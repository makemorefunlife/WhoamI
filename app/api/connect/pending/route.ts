import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { assertOwnedReportAccess } from "@/lib/report/assertOwnedReportAccess";
import { partnerNameFromReportRow } from "@/lib/relationship/resolvePartnerDisplayName";
import { resolveRequestLocale } from "@/lib/i18n/llmLocale";
import { getMessages } from "@/lib/i18n/messages";
import { logServerError } from "@/lib/security/safeLog";

export const runtime = "nodejs";

/**
 * This viewer's own pending reciprocal-connection requests (spec section 9):
 * someone joined through this viewer's personal link, and the viewer hasn't
 * accepted or declined yet. Least-disruptive surface, not a social-network
 * inbox — just enough to drive an Accept/Decline pair near My People.
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
      .select("relationship_report_id, other_report_id")
      .eq("viewer_report_id", reportId)
      .eq("status", "pending");

    if (error) {
      logServerError("connect/pending", error, "db_select_failed");
      return NextResponse.json({ error: messages.errors.generic }, { status: 500 });
    }
    if (!rows || rows.length === 0) {
      return NextResponse.json({ requests: [] });
    }

    const otherIds = [...new Set(rows.map((r) => r.other_report_id))];
    const { data: names } = await supabase
      .from("reports")
      .select("id, name")
      .in("id", otherIds);
    const nameById = Object.fromEntries((names ?? []).map((n) => [n.id, n.name]));

    const requests = rows.map((r) => ({
      relationshipReportId: r.relationship_report_id,
      otherReportId: r.other_report_id,
      name:
        partnerNameFromReportRow(nameById[r.other_report_id]) ??
        messages.connect.someoneFallbackName,
    }));

    return NextResponse.json({ requests });
  } catch (e) {
    logServerError("connect/pending", e, "internal_error");
    return NextResponse.json({ error: messages.errors.generic }, { status: 500 });
  }
}
