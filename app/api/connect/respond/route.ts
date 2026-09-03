import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { assertOwnedReportAccess } from "@/lib/report/assertOwnedReportAccess";
import { invalidateRelationshipMapCache } from "@/lib/relationship/map/computeRelationshipMap";
import { resolveRequestLocale } from "@/lib/i18n/llmLocale";
import { getMessages } from "@/lib/i18n/messages";
import { logServerError } from "@/lib/security/safeLog";

export const runtime = "nodejs";

/**
 * Accept or decline a reciprocal connection request (spec sections 11-12).
 * Only the row's own viewer can respond to it — accepting flips this
 * viewer's own membership row to visible; declining flips it to a
 * permanent no, but never touches the other side's row (spec: "declining
 * does not erase what the joiner already consented to").
 */
export async function POST(req: Request) {
  const locale = resolveRequestLocale({
    bodyLanguage: null,
    headerLanguage: req.headers.get("x-aha-locale") ?? req.headers.get("accept-language"),
  });
  const messages = getMessages(locale);
  try {
    const body = await req.json().catch(() => ({}));
    const reportId = String(body?.reportId ?? "").trim();
    const relationshipReportId = String(body?.relationshipReportId ?? "").trim();
    const action = body?.action === "accept" || body?.action === "decline" ? body.action : null;
    if (!reportId || !relationshipReportId || !action) {
      return NextResponse.json({ error: messages.errors.invalidRequest }, { status: 400 });
    }

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();

    const { userId } = await auth();
    const access = await assertOwnedReportAccess(supabase, reportId, userId, locale);
    if (access.error) return access.error;

    const status = action === "accept" ? "accepted" : "declined";
    const { data: updated, error } = await supabase
      .from("relationship_map_memberships")
      .update({ status, responded_at: new Date().toISOString() })
      .eq("relationship_report_id", relationshipReportId)
      .eq("viewer_report_id", reportId)
      .eq("status", "pending")
      .select("relationship_report_id")
      .maybeSingle();

    if (error) {
      logServerError("connect/respond", error, "db_update_failed");
      return NextResponse.json({ error: messages.errors.generic }, { status: 500 });
    }
    if (!updated) {
      return NextResponse.json({ error: messages.errors.notFound }, { status: 404 });
    }

    invalidateRelationshipMapCache(reportId);

    return NextResponse.json({ ok: true, status });
  } catch (e) {
    logServerError("connect/respond", e, "internal_error");
    return NextResponse.json({ error: messages.errors.generic }, { status: 500 });
  }
}
