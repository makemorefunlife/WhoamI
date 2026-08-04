import { auth } from "@clerk/nextjs/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { NextResponse } from "next/server";
import { assertOwnedReportAccess } from "@/lib/report/assertOwnedReportAccess";
import { scoreSurveyAnswers } from "@/lib/v2/survey/scorer";
import type { CurrentSelfProfile, SurveyAnswersInput } from "@/lib/v2/survey/types";
import { normalizeCurrentSelfProfile } from "@/lib/v2/framework/normalizePrimaryAxes";
import { isSurveyV2AnswersComplete } from "@/lib/v2/survey/completion";
import { invalidatePersonCoreBlueprint } from "@/lib/personCore";
import { invalidateRelationshipPremiumsForReport } from "@/lib/relationship/invalidateRelationshipPremiums";
import {
  enforceRateLimit,
  rateLimitResponse,
} from "@/lib/security/rateLimit";
import {
  parseSurveyAnswers,
  readJsonBodyLimited,
  requireUuid,
  stripClientTrustFields,
} from "@/lib/security/requestValidation";
import { clientSafeErrorMessage, logServerError } from "@/lib/security/safeLog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function profileFromRow(answers: Record<string, unknown>): CurrentSelfProfile | null {
  const embedded = answers.v2_profile;
  if (embedded && typeof embedded === "object" && !Array.isArray(embedded)) {
    return normalizeCurrentSelfProfile(embedded as CurrentSelfProfile);
  }
  const stringAnswers: Record<string, string> = {};
  for (const [k, v] of Object.entries(answers)) {
    if (typeof v === "string" && /^q\d+$/i.test(k)) stringAnswers[k] = v;
  }
  if (!isSurveyV2AnswersComplete(stringAnswers)) return null;
  return scoreSurveyAnswers(stringAnswers as SurveyAnswersInput);
}

/** GET ?reportId= — 저장된 v2 설문 조회 */
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const idCheck = requireUuid(
      new URL(req.url).searchParams.get("reportId"),
      "reportId",
    );
    if (!idCheck.ok) return idCheck.response;

    const limited = await enforceRateLimit("survey_persist", userId);
    if (!limited.ok) return rateLimitResponse(limited);

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();
    const access = await assertOwnedReportAccess(
      supabase,
      idCheck.value,
      userId,
    );
    if (access.error) return access.error;

    const { data, error } = await supabase
      .from("survey_responses")
      .select("answers")
      .eq("report_id", idCheck.value)
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      logServerError("v2/survey GET", error);
      return NextResponse.json({ error: "lookup failed" }, { status: 500 });
    }
    if (!data?.answers) {
      return NextResponse.json({ ok: true, hasSurvey: false });
    }

    let answers: unknown = data.answers;
    if (typeof answers === "string") {
      try {
        answers = JSON.parse(answers);
      } catch {
        return NextResponse.json({ ok: true, hasSurvey: false });
      }
    }
    if (!answers || typeof answers !== "object") {
      return NextResponse.json({ ok: true, hasSurvey: false });
    }

    const record = answers as Record<string, unknown>;
    const profile = profileFromRow(record);
    if (!profile) {
      return NextResponse.json({ ok: true, hasSurvey: false });
    }

    const stringAnswers: Record<string, string> = {};
    for (const [k, v] of Object.entries(record)) {
      if (/^q\d+$/.test(k) && typeof v === "string") stringAnswers[k] = v;
    }

    return NextResponse.json({
      ok: true,
      hasSurvey: true,
      answers: stringAnswers,
      profile,
    });
  } catch (e) {
    logServerError("v2/survey GET", e);
    return NextResponse.json(
      { error: clientSafeErrorMessage(e, "lookup failed") },
      { status: 500 },
    );
  }
}

/** POST — v2 설문 저장 (로그인 + 소유 report만) */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const parsed = await readJsonBodyLimited(req);
    if (!parsed.ok) return parsed.response;
    const raw = stripClientTrustFields(
      (parsed.body && typeof parsed.body === "object"
        ? parsed.body
        : {}) as Record<string, unknown>,
    );

    const idCheck = requireUuid(raw.reportId, "reportId");
    if (!idCheck.ok) return idCheck.response;

    const answersCheck = parseSurveyAnswers(raw.answers);
    if (!answersCheck.ok) return answersCheck.response;
    if (!isSurveyV2AnswersComplete(answersCheck.value)) {
      return NextResponse.json(
        { error: "survey incomplete" },
        { status: 400 },
      );
    }

    if (!raw.profile || typeof raw.profile !== "object") {
      return NextResponse.json({ error: "profile required" }, { status: 400 });
    }
    const profile = normalizeCurrentSelfProfile(
      raw.profile as CurrentSelfProfile,
    );

    const limited = await enforceRateLimit("survey_persist", userId);
    if (!limited.ok) return rateLimitResponse(limited);

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();
    const access = await assertOwnedReportAccess(
      supabase,
      idCheck.value,
      userId,
    );
    if (access.error) return access.error;

    const payload = {
      ...answersCheck.value,
      survey_source: "v2_10q",
      v2_profile: profile,
    };

    const { error } = await supabase.from("survey_responses").insert({
      report_id: idCheck.value,
      answers: payload,
    });

    if (error) {
      logServerError("v2/survey POST", error);
      return NextResponse.json({ error: "save failed" }, { status: 500 });
    }

    await Promise.all([
      invalidatePersonCoreBlueprint(idCheck.value, supabase),
      invalidateRelationshipPremiumsForReport(supabase, idCheck.value),
    ]);

    return NextResponse.json({ ok: true });
  } catch (e) {
    logServerError("v2/survey POST", e);
    return NextResponse.json(
      { error: clientSafeErrorMessage(e, "save failed") },
      { status: 500 },
    );
  }
}

/** DELETE ?reportId= — 설문 다시하기 */
export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const idCheck = requireUuid(
      new URL(req.url).searchParams.get("reportId"),
      "reportId",
    );
    if (!idCheck.ok) return idCheck.response;

    const limited = await enforceRateLimit("survey_persist", userId);
    if (!limited.ok) return rateLimitResponse(limited);

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();
    const access = await assertOwnedReportAccess(
      supabase,
      idCheck.value,
      userId,
    );
    if (access.error) return access.error;

    const { error } = await supabase
      .from("survey_responses")
      .delete()
      .eq("report_id", idCheck.value);

    if (error) {
      logServerError("v2/survey DELETE", error);
      return NextResponse.json({ error: "delete failed" }, { status: 500 });
    }

    await Promise.all([
      invalidatePersonCoreBlueprint(idCheck.value, supabase),
      invalidateRelationshipPremiumsForReport(supabase, idCheck.value),
    ]);

    return NextResponse.json({ ok: true });
  } catch (e) {
    logServerError("v2/survey DELETE", e);
    return NextResponse.json(
      { error: clientSafeErrorMessage(e, "delete failed") },
      { status: 500 },
    );
  }
}
