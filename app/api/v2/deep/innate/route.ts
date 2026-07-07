import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { runSlimIntegratedReport } from "@/lib/v1/slim/runSlimIntegratedReport";
import { assertGuestOrOwnerReportAccess } from "@/lib/report/assertGuestOrOwnerReportAccess";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import type {
  CurrentSelfProfile,
  SurveyAnswersInput,
} from "@/lib/v2/survey/types";

export const runtime = "nodejs";
export const maxDuration = 120;

type Body = {
  reportId?: string;
  birthDate?: string;
  birthTime?: string | null;
  birthTimeUnknown?: boolean;
  birthPlace?: string | null;
  surveyAnswers?: SurveyAnswersInput | null;
  currentSelfProfile?: CurrentSelfProfile | null;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const reportId = body.reportId?.trim();
    const birthDate = body.birthDate?.trim();

    if (!reportId) {
      return NextResponse.json(
        { error: "reportId가 필요합니다." },
        { status: 400 },
      );
    }
    if (!birthDate) {
      return NextResponse.json(
        { error: "birthDate가 필요합니다." },
        { status: 400 },
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: "서버 Supabase 설정이 필요합니다." },
        { status: 500 },
      );
    }

    const supabase = createServiceRoleClient(supabaseUrl, serviceKey);
    const { userId } = await auth();
    const access = await assertGuestOrOwnerReportAccess(
      supabase,
      reportId,
      userId,
    );
    if (access.error) return access.error;

    const slim_v1 = await runSlimIntegratedReport({
      birthDate,
      birthTime: body.birthTime ?? null,
      birthTimeUnknown: body.birthTimeUnknown === true,
      birthPlace: body.birthPlace ?? null,
      surveyAnswers: body.surveyAnswers ?? null,
      currentSelfProfile: body.currentSelfProfile ?? null,
    });

    return NextResponse.json({ ok: true, slim_v1 });
  } catch (e) {
    console.error("v2/deep/innate:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "분석 실패" },
      { status: 500 },
    );
  }
}
