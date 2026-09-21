import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { assertOwnedReportAccess } from "@/lib/report/assertOwnedReportAccess";
import { resolvePartnerDisplayName } from "@/lib/relationship/resolvePartnerDisplayName";
import { resolveClerkDisplayNamesByUserId } from "@/lib/relationship/resolveClerkDisplayNames";
import { resolveRequestLocale } from "@/lib/i18n/llmLocale";
import { getMessages } from "@/lib/i18n/messages";
import { logServerError } from "@/lib/security/safeLog";

export const runtime = "nodejs";

/**
 * Relationship Discovery Flow V1 -- this viewer's own unseen connections.
 * A row here means someone connected with this viewer (personal connect
 * link or one-time invite) and the viewer has never been shown that
 * connection yet (relationship_map_memberships.discovered_seen_at IS
 * NULL -- see supabase/migrations/20260920120000_relationship_discovery_seen_at.sql).
 *
 * Deliberately the same request/response shape as the existing
 * /api/connect/pending (same table, same "viewer's own rows" fetch
 * pattern) but a disjoint condition and a different purpose: pending is
 * "should I let this person into my map" (the pre-auto-accept reciprocal
 * gate, mostly legacy now); this is "have I actually seen that this
 * person is already in my map" -- every new-flow connection is accepted
 * immediately (see lib/relationship/map/directionalMembership.ts), so
 * this is the only place that new-connection notice now surfaces from.
 *
 * A pair with no relationship_map_memberships row at all (manual adds,
 * pre-personal-link legacy connections) never appears here -- no code
 * path creates a membership row for those, so old connections can never
 * show up as a "new" discovery.
 */
export async function GET(req: Request) {
  const locale = resolveRequestLocale({
    bodyLanguage: null,
    headerLanguage: req.headers.get("x-aha-locale") ?? req.headers.get("accept-language"),
  });
  const messages = getMessages(locale);
  try {
    const sp = new URL(req.url).searchParams;
    const reportId = sp.get("reportId")?.trim() ?? "";

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();

    const { userId } = await auth();
    const access = await assertOwnedReportAccess(supabase, reportId, userId, locale);
    if (access.error) return access.error;

    const { data: rows, error } = await supabase
      .from("relationship_map_memberships")
      .select("relationship_report_id, other_report_id, created_at")
      .eq("viewer_report_id", reportId)
      .eq("status", "accepted")
      .is("discovered_seen_at", null)
      .order("created_at", { ascending: true });

    if (error) {
      logServerError("connect/discoveries", error, "db_select_failed");
      return NextResponse.json({ error: messages.errors.generic }, { status: 500 });
    }
    if (!rows || rows.length === 0) {
      return NextResponse.json({ discoveries: [] });
    }

    const otherIds = [...new Set(rows.map((r) => r.other_report_id))];
    const { data: names } = await supabase
      .from("reports")
      .select("id, name, report_type, clerk_user_id")
      .in("id", otherIds);

    // Same name-resolution chain as the map's own connection list
    // (fetchRelationshipMapConnections): a real connected partner's name
    // lives on their own Clerk account, not on `reports.name` (that column
    // is only ever populated for manually-added contacts).
    const clerkNameByClerkUserId = await resolveClerkDisplayNamesByUserId(
      (names ?? [])
        .filter((n) => n.report_type !== "partner_manual")
        .map((n) => n.clerk_user_id),
    );
    const nameById = Object.fromEntries(
      (names ?? []).map((n) => [
        n.id,
        resolvePartnerDisplayName(
          n.name,
          n.report_type !== "partner_manual" && n.clerk_user_id
            ? clerkNameByClerkUserId[n.clerk_user_id]
            : undefined,
          undefined,
          messages.connect.someoneFallbackName,
        ),
      ]),
    );

    const discoveries = rows.map((r) => ({
      relationshipReportId: r.relationship_report_id,
      otherReportId: r.other_report_id,
      name: nameById[r.other_report_id] ?? messages.connect.someoneFallbackName,
    }));

    return NextResponse.json({ discoveries });
  } catch (e) {
    logServerError("connect/discoveries", e, "internal_error");
    return NextResponse.json({ error: messages.errors.generic }, { status: 500 });
  }
}
