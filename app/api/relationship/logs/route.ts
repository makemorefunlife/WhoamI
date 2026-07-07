import { NextResponse } from "next/server";
import { listRelationshipAnalysisLogs } from "@/lib/relationship/analysisLog";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

export const runtime = "nodejs";

/** 관계 분석 이력 목록 */
export async function GET(req: Request) {
  try {
    const sp = new URL(req.url).searchParams;
    const relationshipReportId = sp.get("relationshipReportId")?.trim();
    const viewerReportId = sp.get("viewerReportId")?.trim();

    if (!relationshipReportId || !viewerReportId) {
      return NextResponse.json(
        { error: "relationshipReportId와 viewerReportId가 필요합니다." },
        { status: 400 },
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return NextResponse.json(
        { error: "서버 설정이 필요합니다." },
        { status: 500 },
      );
    }

    const supabase = createServiceRoleClient(url, serviceKey);

    const { data: rr } = await supabase
      .from("relationship_reports")
      .select("report_id_a, report_id_b")
      .eq("id", relationshipReportId)
      .maybeSingle();

    if (!rr) {
      return NextResponse.json(
        { error: "관계 분석을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    if (
      rr.report_id_a !== viewerReportId &&
      rr.report_id_b !== viewerReportId
    ) {
      return NextResponse.json({ error: "권한 없음" }, { status: 403 });
    }

    const logs = await listRelationshipAnalysisLogs(
      supabase,
      relationshipReportId,
      viewerReportId,
    );

    return NextResponse.json({ logs });
  } catch (e) {
    console.error("relationship/logs GET:", e);
    return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  }
}
