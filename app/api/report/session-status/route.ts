import { NextResponse } from "next/server";
import { logServerError } from "@/lib/security/safeLog";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { isV2SurveyCompleteForReport } from "@/lib/v2/survey/dbCompletion";

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

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();

    const { data: report, error: repErr } = await supabase
      .from("reports")
      .select("id, name")
      .eq("id", reportId)
      .maybeSingle();

    if (repErr) {
      logServerError("session-status report:", repErr, "internal_error");
      return NextResponse.json({ error: repErr.message }, { status: 500 });
    }

    if (!report) {
      return NextResponse.json({
        hasReport: false,
        surveyCompleted: false,
        name: null,
      });
    }

    const surveyCompleted = await isV2SurveyCompleteForReport(
      supabase,
      reportId,
    );

    return NextResponse.json({
      hasReport: true,
      surveyCompleted,
      name: (report as { name?: string | null }).name?.trim() ?? null,
    });
  } catch (e) {
    logServerError("session-status:", e, "internal_error");
    return NextResponse.json(
      { error: "request failed" },
      { status: 500 },
    );
  }
}
