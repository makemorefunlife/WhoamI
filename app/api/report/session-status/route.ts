import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { logServerError } from "@/lib/security/safeLog";
import {
  createRouteSupabaseClient,
  supabaseConfigErrorResponse,
} from "@/lib/supabase/serverClient";
import { assertOwnedReportAccess } from "@/lib/report/assertOwnedReportAccess";
import { isV2SurveyCompleteForReport } from "@/lib/v2/survey/dbCompletion";

export const runtime = "nodejs";

/**
 * reportId 유효·설문 완료 여부 — 로그인 + 본인 소유 report만.
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

    const { userId } = await auth();
    const access = await assertOwnedReportAccess(supabase, reportId, userId);
    if (access.error) {
      if (access.error.status === 404) {
        return NextResponse.json({
          hasReport: false,
          surveyCompleted: false,
          name: null,
        });
      }
      return access.error;
    }

    const { data: report, error: repErr } = await supabase
      .from("reports")
      .select("id, name")
      .eq("id", reportId)
      .maybeSingle();

    if (repErr) {
      logServerError("session-status report:", repErr, "internal_error");
      return NextResponse.json({ error: "request failed" }, { status: 500 });
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
