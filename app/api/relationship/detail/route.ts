import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

export const runtime = "nodejs";

/** 단일 관계 분석 행 + 현재 보는 사람 시점의 perspective 슬라이스 */
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

    const { data: rr, error } = await supabase
      .from("relationship_reports")
      .select(
        "id, report_id_a, report_id_b, analysis_type, result_basic, result_premium",
      )
      .eq("id", relationshipReportId)
      .maybeSingle();

    if (error || !rr) {
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

    const partnerId =
      rr.report_id_a === viewerReportId ? rr.report_id_b : rr.report_id_a;

    const [{ data: partner }, { data: viewer }] = await Promise.all([
      supabase.from("reports").select("name").eq("id", partnerId).maybeSingle(),
      supabase
        .from("reports")
        .select("name")
        .eq("id", viewerReportId)
        .maybeSingle(),
    ]);

    const basic = rr.result_basic as {
      perspectives?: Record<string, Record<string, unknown>>;
    } | null;
    const premium = rr.result_premium as {
      perspectives?: Record<string, Record<string, unknown>>;
    } | null;

    const perspectiveBasic =
      basic?.perspectives?.[viewerReportId] ?? null;
    const perspectivePremium =
      premium?.perspectives?.[viewerReportId] ?? null;

    return NextResponse.json({
      relationship_report_id: rr.id,
      analysis_type: rr.analysis_type,
      viewer_report_id: viewerReportId,
      partner_report_id: partnerId,
      viewer_name: viewer?.name?.trim() ?? "나",
      partner_name: partner?.name?.trim() ?? "상대",
      perspective_basic: perspectiveBasic,
      perspective_premium: perspectivePremium,
      raw_basic: rr.result_basic,
      raw_premium: rr.result_premium,
    });
  } catch (e) {
    console.error("relationship/detail:", e);
    return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  }
}
