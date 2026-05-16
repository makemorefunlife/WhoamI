import { NextResponse } from "next/server";
import { isSurveyCompleteForReport } from "@/lib/report/surveyCompletion";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

export const runtime = "nodejs";

/**
 * 로컬 reportId가 유효한지, 설문을 이미 제출했는지 확인 (서비스 롤)
 */
export async function GET(req: Request) {
  try {
    const reportId = new URL(req.url).searchParams.get("reportId")?.trim();
    if (!reportId) {
      return NextResponse.json(
        { error: "reportId가 필요합니다." },
        { status: 400 },
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return NextResponse.json(
        { error: "서버 Supabase 설정이 필요합니다." },
        { status: 500 },
      );
    }

    const supabase = createServiceRoleClient(url, serviceKey);

    const { data: report, error: repErr } = await supabase
      .from("reports")
      .select("id, name")
      .eq("id", reportId)
      .maybeSingle();

    if (repErr) {
      console.error("session-status report:", repErr);
      return NextResponse.json({ error: repErr.message }, { status: 500 });
    }

    if (!report) {
      return NextResponse.json({
        hasReport: false,
        surveyCompleted: false,
        name: null,
      });
    }

    const surveyCompleted = await isSurveyCompleteForReport(
      supabase,
      reportId,
    );

    return NextResponse.json({
      hasReport: true,
      surveyCompleted,
      name: (report as { name?: string | null }).name?.trim() ?? null,
    });
  } catch (e) {
    console.error("session-status:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "조회 실패" },
      { status: 500 },
    );
  }
}
