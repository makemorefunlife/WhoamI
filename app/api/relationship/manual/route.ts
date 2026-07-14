import { auth } from "@clerk/nextjs/server";
import { logServerError } from "@/lib/security/safeLog";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { NextResponse } from "next/server";
import { mergeBirthCoordinateFields, insertReportPatchSafely } from "@/lib/report/applyBirthCoordinatePatch";
import { assertGuestOrOwnerReportAccess } from "@/lib/report/assertGuestOrOwnerReportAccess";
import { ensureRelationshipReport } from "@/lib/relationship/createRelationshipReport";
import { resolveBirthTimeForCharts } from "@/lib/v2/onboarding/resolveBirthChartInput";
import { UNKNOWN_BIRTH_FALLBACK } from "@/lib/v2/onboarding/birthFallbackPolicy";
import { buildNeutralV2Profile } from "@/lib/v2/survey/neutralProfile";
import { scoreSurveyAnswers } from "@/lib/v2/survey/scorer";
import type { SurveyAnswersInput } from "@/lib/v2/survey/types";

export const runtime = "nodejs";

type Body = {
  reportIdA?: string;
  partnerName?: string;
  birthDate?: string;
  birthTime?: string | null;
  birthTimeUnknown?: boolean;
  birthPlace?: string | null;
  birthPlaceUnknown?: boolean;
  surveySkipped?: boolean;
  surveyAnswers?: SurveyAnswersInput | null;
};

/** 이메일 없이 친구 정보 직접 입력 → proxy report + 관계 행 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const reportIdA = body.reportIdA?.trim();
    const partnerName = body.partnerName?.trim();
    const birthDate = body.birthDate?.trim();
    const birthPlaceUnknown = body.birthPlaceUnknown === true;
    const birthPlace = birthPlaceUnknown
      ? UNKNOWN_BIRTH_FALLBACK.place
      : (body.birthPlace?.trim() || null);
    const surveySkipped = body.surveySkipped === true;

    if (!reportIdA || !partnerName || !birthDate) {
      return NextResponse.json(
        { error: "reportIdA, partnerName, birthDate가 필요합니다." },
        { status: 400 },
      );
    }
    if (!birthPlaceUnknown && !birthPlace) {
      return NextResponse.json(
        { error: "태어난 지역을 입력하거나 '모름'을 선택해 주세요." },
        { status: 400 },
      );
    }
    if (
      !surveySkipped &&
      (!body.surveyAnswers ||
        Object.keys(body.surveyAnswers).filter((k) => /^q\d+$/.test(k))
          .length < 10)
    ) {
      return NextResponse.json(
        { error: "친구 설문 10문항 응답이 필요합니다." },
        { status: 400 },
      );
    }

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();
    const { userId } = await auth();
    const access = await assertGuestOrOwnerReportAccess(
      supabase,
      reportIdA,
      userId,
    );
    if (access.error) return access.error;

    const birthTimeUnknown = body.birthTimeUnknown === true;
    const { chartTime } = resolveBirthTimeForCharts({
      birthTime: body.birthTime,
      birthTimeUnknown,
    });
    const birthTime = birthTimeUnknown ? null : (body.birthTime?.trim() || chartTime);
    const profile = surveySkipped
      ? buildNeutralV2Profile()
      : scoreSurveyAnswers(body.surveyAnswers!);

    const reportPatch = mergeBirthCoordinateFields(
      {
        name: partnerName,
        birth_date: birthDate,
        birth_time: birthTime,
        birth_place: birthPlace,
        report_type: "partner_manual",
        entitlement: "free",
        clerk_user_id: userId,
      },
      birthPlace,
    );

    const { data: partnerReport, error: repErr } = await insertReportPatchSafely(
      supabase,
      reportPatch,
    );

    if (repErr || !partnerReport?.id) {
      return NextResponse.json(
        { error: repErr?.message ?? "친구 리포트 생성 실패" },
        { status: 500 },
      );
    }

    const surveyPayload: Record<string, unknown> = surveySkipped
      ? {
          survey_source: "v2_10q",
          survey_skipped: true,
          v2_profile: profile,
        }
      : {
          ...body.surveyAnswers,
          v2_profile: profile,
          survey_source: "v2_10q",
        };

    const { error: survErr } = await supabase.from("survey_responses").insert({
      report_id: partnerReport.id,
      answers: surveyPayload,
    });

    if (survErr) {
      await supabase.from("reports").delete().eq("id", partnerReport.id);
      return NextResponse.json({ error: survErr.message }, { status: 500 });
    }

    const { relationshipReportId, created } = await ensureRelationshipReport(
      supabase,
      reportIdA,
      partnerReport.id,
    );

    return NextResponse.json({
      ok: true,
      partner_report_id: partnerReport.id,
      relationship_report_id: relationshipReportId,
      created,
    });
  } catch (e) {
    logServerError("relationship/manual:", e, "internal_error");
    return NextResponse.json(
      { error: "request failed" },
      { status: 500 },
    );
  }
}
