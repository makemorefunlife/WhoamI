import { NextResponse } from "next/server";
import { deleteReportAnalysis } from "@/lib/report/reportAnalyses";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

export const runtime = "nodejs";

/**
 * 같은 report에 대해 설문을 다시 받기 위해 survey_responses 행 삭제
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { reportId?: string };
    const reportId = typeof body.reportId === "string" ? body.reportId.trim() : "";
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

    const { error } = await supabase
      .from("survey_responses")
      .delete()
      .eq("report_id", reportId);

    if (error) {
      console.error("survey reset:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await deleteReportAnalysis(supabase, reportId, "basic");

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("survey reset:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "삭제 실패" },
      { status: 500 },
    );
  }
}
