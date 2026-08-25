import { auth } from "@clerk/nextjs/server";
import { logServerError } from "@/lib/security/safeLog";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { NextResponse } from "next/server";
import { mergeBirthCoordinateFields, insertReportPatchSafely } from "@/lib/report/applyBirthCoordinatePatch";
import { detectsOwnBirthDateCollision } from "@/lib/report/detectOwnBirthDateCollision";
import { assertGuestOrOwnerReportAccess } from "@/lib/report/assertGuestOrOwnerReportAccess";
import { ensureRelationshipReport } from "@/lib/relationship/createRelationshipReport";
import { resolveBirthTimeForCharts } from "@/lib/v2/onboarding/resolveBirthChartInput";
import { UNKNOWN_BIRTH_FALLBACK } from "@/lib/v2/onboarding/birthFallbackPolicy";
import { buildNeutralV2Profile } from "@/lib/v2/survey/neutralProfile";
import { scoreSurveyAnswers } from "@/lib/v2/survey/scorer";
import type { SurveyAnswersInput } from "@/lib/v2/survey/types";
import { resolveRequestLocale } from "@/lib/i18n/llmLocale";
import { getMessages } from "@/lib/i18n/messages";

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
  const locale = resolveRequestLocale({
    bodyLanguage: null,
    headerLanguage:
      req.headers.get("x-aha-locale") ?? req.headers.get("accept-language"),
  });
  const messages = getMessages(locale);
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
        { error: messages.errors.relationshipManualFieldsRequired },
        { status: 400 },
      );
    }
    if (!birthPlaceUnknown && !birthPlace) {
      return NextResponse.json(
        { error: messages.relationshipForm.birthPlaceRequired },
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
        { error: messages.errors.friendSurveyIncomplete },
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
      locale,
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
        clerk_user_id: userId || `guest_${reportIdA.slice(0, 8)}`,
      },
      birthPlace,
    );

    const { data: partnerReport, error: repErr } = await insertReportPatchSafely(
      supabase,
      reportPatch,
    );

    if (repErr || !partnerReport?.id) {
      return NextResponse.json(
        { error: repErr?.message ?? messages.errors.partnerReportCreateFailed },
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

    // 새로 만든 파트너 프로필의 생년월일시가 본인(reportIdA)의 self report와
    // 완전히 같은지 확인 — 경고용, 생성을 막지는 않는다(진짜 같은 생일일 수도
    // 있으므로). 2026-07-21 동글 birth_date 오염 사고 재발 방지.
    let ownBirthDateCollision = false;
    if (userId) {
      const { data: ownSelfReport } = await supabase
        .from("reports")
        .select("id, birth_date, birth_time")
        .eq("clerk_user_id", userId)
        .eq("report_type", "self")
        .maybeSingle();

      ownBirthDateCollision = detectsOwnBirthDateCollision({
        targetReportId: partnerReport.id,
        ownSelfReport: ownSelfReport ?? null,
        newBirthDate: birthDate,
        newBirthTime: birthTime,
      });
    }

    return NextResponse.json({
      ok: true,
      partner_report_id: partnerReport.id,
      relationship_report_id: relationshipReportId,
      created,
      own_birth_date_collision_warning: ownBirthDateCollision,
    });
  } catch (e) {
    logServerError("relationship/manual:", e, "internal_error");
    return NextResponse.json(
      { error: messages.errors.generic },
      { status: 500 },
    );
  }
}
