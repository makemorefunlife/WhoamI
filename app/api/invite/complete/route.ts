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

    const limited = enforceRateLimit("invite", userId);
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
    const { data, error } = await supabase
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

    if (!data) {
      return NextResponse.json(
        { error: messages.errors.inviteUnavailable },
        { status: 404 },
      );
    }

    let relationship_report_id: string | null = null;
    if (
      data.from_report_id &&
      idCheck.value &&
      data.from_report_id !== idCheck.value
    ) {
      try {
        const { relationshipReportId } = await ensureRelationshipReport(
          supabase,
          data.from_report_id,
          idCheck.value,
        );
        relationship_report_id = relationshipReportId;
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
      } catch (relErr) {
        logServerError("invite/complete.rel", relErr);
      }
    }

    return NextResponse.json({ ok: true, relationship_report_id });
  } catch (e) {
    logServerError("invite/complete", e);
    return NextResponse.json(
      { error: messages.errors.inviteCompleteFailed },
      { status: 500 },
    );
  }
}
