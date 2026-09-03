import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { assertOwnedReportAccess } from "@/lib/report/assertOwnedReportAccess";
import { ensureRelationshipReport } from "@/lib/relationship/createRelationshipReport";
import { initialMembershipsForLinkJoin } from "@/lib/relationship/map/directionalMembership";
import { invalidateRelationshipMapCache } from "@/lib/relationship/map/computeRelationshipMap";
import { resolveRequestLocale } from "@/lib/i18n/llmLocale";
import { getMessages } from "@/lib/i18n/messages";
import { logServerError } from "@/lib/security/safeLog";

export const runtime = "nodejs";

/**
 * Completing a personal connect link — spec sections 9-10. Mirrors
 * /api/invite/complete's shape ({token/inviteToken, reportId} -> ok) so
 * the existing home-resume pipeline (app/homecontent.tsx) can drive this
 * the same way it drives the legacy invite, just calling a different
 * endpoint at the end.
 *
 * Idempotent by construction: re-running this for the same (owner, joiner)
 * pair never creates a duplicate relationship_reports row
 * (ensureRelationshipReport already guarantees that), never creates a
 * duplicate personal_connect_link_uses row (unique + ignoreDuplicates),
 * and never resets an already-decided owner-side membership back to
 * pending (insert-if-missing, not overwrite).
 */
export async function POST(req: Request) {
  const locale = resolveRequestLocale({
    bodyLanguage: null,
    headerLanguage: req.headers.get("x-aha-locale") ?? req.headers.get("accept-language"),
  });
  const messages = getMessages(locale);
  try {
    const body = await req.json().catch(() => ({}));
    const token = String(body?.token ?? "").trim();
    const reportId = String(body?.reportId ?? "").trim();
    if (!token || !reportId) {
      return NextResponse.json({ error: messages.errors.invalidRequest }, { status: 400 });
    }

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();

    const { userId } = await auth();
    const access = await assertOwnedReportAccess(supabase, reportId, userId, locale);
    if (access.error) return access.error;

    const { data: link, error: linkErr } = await supabase
      .from("personal_connect_links")
      .select("report_id")
      .eq("token", token)
      .maybeSingle();

    if (linkErr) {
      logServerError("connect/complete", linkErr, "db_select_failed");
      return NextResponse.json({ error: messages.errors.generic }, { status: 500 });
    }
    if (!link) {
      return NextResponse.json({ error: messages.connect.invalidBody }, { status: 404 });
    }

    const ownerReportId = link.report_id as string;
    const joinerReportId = reportId;

    if (ownerReportId === joinerReportId) {
      return NextResponse.json({ error: messages.connect.selfLinkError }, { status: 400 });
    }

    const { relationshipReportId } = await ensureRelationshipReport(
      supabase,
      ownerReportId,
      joinerReportId,
    );

    // One row per person who's ever joined this link — idempotent, a
    // second completion by the same joiner is a silent no-op.
    const { error: useErr } = await supabase
      .from("personal_connect_link_uses")
      .upsert(
        {
          report_id: ownerReportId,
          accepted_report_id: joinerReportId,
          relationship_report_id: relationshipReportId,
        },
        { onConflict: "report_id,accepted_report_id", ignoreDuplicates: true },
      );
    if (useErr) {
      logServerError("connect/complete.use", useErr, "db_upsert_failed");
    }

    const { joinerSeesOwner, ownerSeesJoiner } = initialMembershipsForLinkJoin();

    // Joiner's map -> owner: always (re-)confirmed accepted on every
    // successful completion — the joiner is re-consenting each time they
    // complete via this link.
    const { error: joinerMembershipErr } = await supabase
      .from("relationship_map_memberships")
      .upsert(
        {
          relationship_report_id: relationshipReportId,
          viewer_report_id: joinerReportId,
          other_report_id: ownerReportId,
          status: joinerSeesOwner,
          responded_at: new Date().toISOString(),
        },
        { onConflict: "relationship_report_id,viewer_report_id" },
      );
    if (joinerMembershipErr) {
      logServerError("connect/complete.joinerMembership", joinerMembershipErr, "db_upsert_failed");
    }

    // Owner's map -> joiner: only created if the owner has no existing
    // decision for this pair yet. Must NOT clobber a prior accept/decline
    // if the joiner re-uses the link later.
    const { error: ownerMembershipErr } = await supabase
      .from("relationship_map_memberships")
      .upsert(
        {
          relationship_report_id: relationshipReportId,
          viewer_report_id: ownerReportId,
          other_report_id: joinerReportId,
          status: ownerSeesJoiner,
        },
        { onConflict: "relationship_report_id,viewer_report_id", ignoreDuplicates: true },
      );
    if (ownerMembershipErr) {
      logServerError("connect/complete.ownerMembership", ownerMembershipErr, "db_upsert_failed");
    }

    invalidateRelationshipMapCache(ownerReportId);
    invalidateRelationshipMapCache(joinerReportId);

    return NextResponse.json({ ok: true, relationshipReportId });
  } catch (e) {
    logServerError("connect/complete", e, "internal_error");
    return NextResponse.json({ error: messages.errors.generic }, { status: 500 });
  }
}
