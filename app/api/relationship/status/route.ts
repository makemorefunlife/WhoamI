import { NextResponse } from "next/server";
import { logServerError } from "@/lib/security/safeLog";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import {
  fetchRelationshipReportRowsForReportId,
  mergeRelationshipRowsFromOutboundInvites,
} from "@/lib/relationship/fetchReportsWhereParticipant";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const reportId = new URL(req.url).searchParams.get("reportId")?.trim();
    if (!reportId) {
      return NextResponse.json(
        { error: "reportId가 필요합니다." },
        { status: 400 },
      );
    }

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();

    let rows = await fetchRelationshipReportRowsForReportId(supabase, reportId);
    rows = await mergeRelationshipRowsFromOutboundInvites(
      supabase,
      reportId,
      rows,
    );

    const partnerIds = rows.map((r) =>
      r.report_id_a === reportId ? r.report_id_b : r.report_id_a,
    );
    const uniquePartners = [...new Set(partnerIds)];

    const { data: names } =
      uniquePartners.length > 0
        ? await supabase
            .from("reports")
            .select("id, name")
            .in("id", uniquePartners)
        : { data: [] as { id: string; name: string | null }[] };

    const nameById = Object.fromEntries(
      (names ?? []).map((n) => [n.id, n.name?.trim() || "탐사자"]),
    );

    const items = rows.map((r) => {
      const partnerId =
        r.report_id_a === reportId ? r.report_id_b : r.report_id_a;
      const basic = r.result_basic as { perspectives?: unknown } | null;
      const hasBasic =
        basic != null &&
        typeof basic === "object" &&
        basic.perspectives != null &&
        typeof basic.perspectives === "object";
      const prem = r.result_premium as { perspectives?: unknown } | null;
      const hasPremium =
        r.analysis_type === "premium" &&
        prem != null &&
        typeof prem === "object" &&
        prem.perspectives != null;

      return {
        relationship_report_id: r.id,
        partner_report_id: partnerId,
        partner_name: nameById[partnerId] ?? "상대",
        analysis_type: r.analysis_type,
        has_basic: hasBasic,
        has_premium: hasPremium,
        status_hint: hasBasic
          ? "관계 요약을 볼 수 있어요."
          : "기본 분석을 준비 중이에요. 잠시 후 다시 열어보세요.",
      };
    });

    return NextResponse.json({ items });
  } catch (e) {
    logServerError("relationship/status:", e, "internal_error");
    return NextResponse.json(
      { error: "request failed" },
      { status: 500 },
    );
  }
}
