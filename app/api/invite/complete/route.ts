import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ensureRelationshipReport } from "@/lib/relationship/createRelationshipReport";
import {
  createRouteSupabaseClient,
  supabaseConfigErrorResponse,
} from "@/lib/supabase/serverClient";
import { assertOwnedReportAccess } from "@/lib/report/assertOwnedReportAccess";
import {
  enforceRateLimit,
  rateLimitResponse,
} from "@/lib/security/rateLimit";
import {
  readJsonBodyLimited,
  requireUuid,
} from "@/lib/security/requestValidation";
import { isAcceptableInviteToken } from "@/lib/security/inviteToken";
import { logServerError } from "@/lib/security/safeLog";
import { resolveRequestLocale } from "@/lib/i18n/llmLocale";
import { getMessages } from "@/lib/i18n/messages";
import { resolvePartnerDisplayName } from "@/lib/relationship/resolvePartnerDisplayName";
import { resolveClerkDisplayNamesByUserId } from "@/lib/relationship/resolveClerkDisplayNames";
import { initialMembershipsForInviteAccept } from "@/lib/relationship/map/directionalMembership";
import { invalidateRelationshipMapCache } from "@/lib/relationship/map/computeRelationshipMap";

export const runtime = "nodejs";

/**
 * Complete invite: accepter links their OWN report.
 * State transition requires status === 'open' (atomic update filter).
 * Cancelled/deleted invites cannot complete; completed cannot reuse.
 *
 * Token formats:
 * - modern: 64-char hex (createInviteToken)
 * - legacy short / invite_* : accept-only (deprecation — existing customer links)
 */
export async function POST(req: Request) {
  const locale = resolveRequestLocale({
    bodyLanguage: null,
    headerLanguage:
      req.headers.get("x-aha-locale") ?? req.headers.get("accept-language"),
  });
  const messages = getMessages(locale);
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: messages.errors.unauthorized }, { status: 401 });
    }

    const parsed = await readJsonBodyLimited(req);
    if (!parsed.ok) return parsed.response;
    const body = (parsed.body ?? {}) as Record<string, unknown>;

    const inviteToken =
      typeof body.inviteToken === "string" ? body.inviteToken.trim() : "";
    // Do not log token. Legacy formats still accepted for existing links.
    if (!isAcceptableInviteToken(inviteToken)) {
      return NextResponse.json({ error: messages.errors.inviteInvalid }, { status: 400 });
    }

    const idCheck = requireUuid(body.reportId, "reportId");
    if (!idCheck.ok) return idCheck.response;

    const limited = await enforceRateLimit("invite", userId);
    if (!limited.ok) return rateLimitResponse(limited);

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();

    // Accepter can only attach their owned report.
    const access = await assertOwnedReportAccess(
      supabase,
      idCheck.value,
      userId,
      locale,
    );
    if (access.error) return access.error;

    // Race-safe: only open → complete.
    const { data: updated, error } = await supabase
      .from("invites")
      .update({
        accepted_report_id: idCheck.value,
        status: "complete",
      })
      .eq("invite_token", inviteToken)
      .eq("status", "open")
      .select("id, from_report_id")
      .maybeSingle();

    if (error) {
      logServerError("invite/complete", error);
      return NextResponse.json({ error: messages.errors.inviteCompleteFailed }, { status: 500 });
    }

    let data = updated;

    if (!data) {
      // The atomic open -> complete transition above only ever succeeds
      // once. A second completion attempt by the SAME accepter (a
      // re-click of the same chat link, a page bounce mid-signup that
      // re-runs the auto-complete effect, etc.) is not an error -- they
      // already have this connection. Look the token up without the
      // status filter to tell that case apart from a genuinely
      // unusable invite (already used by someone else, or cancelled),
      // and re-affirm the existing connection instead of dead-ending
      // with a bare "unavailable" and no relationship info -- mirrors
      // /api/connect/complete's idempotent re-completion.
      const { data: existing, error: existingErr } = await supabase
        .from("invites")
        .select("id, status, from_report_id, accepted_report_id")
        .eq("invite_token", inviteToken)
        .maybeSingle();

      if (existingErr) {
        logServerError("invite/complete.lookup", existingErr);
      }

      if (
        existing &&
        existing.status === "complete" &&
        existing.accepted_report_id === idCheck.value
      ) {
        data = { id: existing.id, from_report_id: existing.from_report_id };
      } else {
        return NextResponse.json(
          { error: messages.errors.inviteUnavailable },
          { status: 404 },
        );
      }
    }

    let relationship_report_id: string | null = null;
    let sharer_name: string | null = null;
    let alreadyConnected = false;
    if (
      data.from_report_id &&
      idCheck.value &&
      data.from_report_id !== idCheck.value
    ) {
      try {
        const { relationshipReportId, created } = await ensureRelationshipReport(
          supabase,
          data.from_report_id,
          idCheck.value,
        );
        relationship_report_id = relationshipReportId;
        alreadyConnected = !created;
        const { error: linkErr } = await supabase
          .from("invites")
          .update({
            relationship_report_id: relationshipReportId,
          })
          .eq("id", data.id)
          .eq("status", "complete");
        if (linkErr) {
          logServerError("invite/complete.link", linkErr);
        }

        const { inviterSeesInvitee, inviteeSeesInviter } =
          initialMembershipsForInviteAccept();
        const nowIso = new Date().toISOString();

        // Inviter (owner-analog) row: discovered_seen_at intentionally
        // omitted from the payload. On first insert it defaults to NULL
        // ("not yet discovered" -- see
        // supabase/migrations/20260920120000_relationship_discovery_seen_at.sql).
        // A one-time invite token can only ever reach this block once
        // (status flips open -> complete atomically, see the update above),
        // so there is no repeat-completion path that could reset an
        // already-seen discovery here -- but a *different* invite between
        // the same two reports later would upsert this same row again, so
        // leaving the field out of the payload (rather than explicitly
        // NULL) is what keeps a prior seen/unseen value from being
        // clobbered on conflict.
        const { error: inviterMemErr } = await supabase
          .from("relationship_map_memberships")
          .upsert(
            {
              relationship_report_id: relationshipReportId,
              viewer_report_id: data.from_report_id,
              other_report_id: idCheck.value,
              status: inviterSeesInvitee,
              responded_at: nowIso,
            },
            { onConflict: "relationship_report_id,viewer_report_id" },
          );
        if (inviterMemErr) {
          logServerError("invite/complete.inviterMembership", inviterMemErr);
        }

        // Invitee (joiner-analog) row: they are the one actually present
        // right now (they just accepted the invite), so there is nothing
        // for them to "discover" later -- mark their own side seen
        // immediately, same as the personal-connect-link joiner side in
        // /api/connect/complete.
        const { error: inviteeMemErr } = await supabase
          .from("relationship_map_memberships")
          .upsert(
            {
              relationship_report_id: relationshipReportId,
              viewer_report_id: idCheck.value,
              other_report_id: data.from_report_id,
              status: inviteeSeesInviter,
              responded_at: nowIso,
              discovered_seen_at: nowIso,
            },
            { onConflict: "relationship_report_id,viewer_report_id" },
          );
        if (inviteeMemErr) {
          logServerError("invite/complete.inviteeMembership", inviteeMemErr);
        }

        invalidateRelationshipMapCache(data.from_report_id);
        invalidateRelationshipMapCache(idCheck.value);

        // Best-effort — the joiner-side "connected!" modal falls back to a
        // generic label if this can't be resolved, so a failure here must
        // never fail the invite completion itself.
        const { data: sharerReport } = await supabase
          .from("reports")
          .select("name, clerk_user_id")
          .eq("id", data.from_report_id)
          .maybeSingle();
        const sharerClerkNameById = await resolveClerkDisplayNamesByUserId([
          sharerReport?.clerk_user_id ?? null,
        ]);
        sharer_name = resolvePartnerDisplayName(
          sharerReport?.name,
          sharerReport?.clerk_user_id
            ? sharerClerkNameById[sharerReport.clerk_user_id]
            : undefined,
          undefined,
          messages.report.partnerFallbackLabel,
        );
      } catch (relErr) {
        logServerError("invite/complete.rel", relErr);
      }
    }

    return NextResponse.json({
      ok: true,
      relationship_report_id,
      sharer_name,
      alreadyConnected,
    });
  } catch (e) {
    logServerError("invite/complete", e);
    return NextResponse.json(
      { error: messages.errors.inviteCompleteFailed },
      { status: 500 },
    );
  }
}
