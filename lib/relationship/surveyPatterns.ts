import type { SupabaseClient } from "@supabase/supabase-js";
import { logServerError } from "@/lib/security/safeLog";
import { buildV2PatternSummaryForRelationship } from "@/lib/relationship/v2PatternSummary";
import { normalizeCurrentSelfProfile } from "@/lib/v2/framework/normalizePrimaryAxes";
import { isSurveyV2AnswersComplete } from "@/lib/v2/survey/completion";
import { scoreSurveyAnswers } from "@/lib/v2/survey/scorer";
import type { CurrentSelfProfile, SurveyAnswersInput } from "@/lib/v2/survey/types";

/**
 * 한 리포트의 설문 answers (복수 행이 있어도 1건만 사용).
 */
export async function getSurveyAnswersForReport(
  supabase: SupabaseClient,
  reportId: string,
): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase
    .from("survey_responses")
    .select("answers")
    .eq("report_id", reportId)
    .order("id", { ascending: false })
    .limit(1);

  if (error) {
    logServerError("surveyPatterns.select", error, "db_select_failed");
    return null;
  }

  const row = data?.[0];
  if (row?.answers == null) return null;

  let answers: unknown = row.answers;
  if (typeof answers === "string") {
    try {
      answers = JSON.parse(answers) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
    return null;
  }
  return answers as Record<string, unknown>;
}

function parseSurveyAnswersForScoring(
  raw: Record<string, unknown>,
): Record<string, string> | null {
  const stringAnswers: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "string") stringAnswers[k] = v;
  }
  if (raw.survey_source === "v2_10q" && raw.v2_profile) {
    return stringAnswers;
  }
  return isSurveyV2AnswersComplete(stringAnswers) ? stringAnswers : null;
}

function isValidCurrentSelfProfile(
  profile: CurrentSelfProfile | null | undefined,
): profile is CurrentSelfProfile {
  if (!profile || profile.profile_type !== "current_self") return false;
  if (!profile.secondary_axes || typeof profile.secondary_axes !== "object") {
    return false;
  }
  return true;
}

/** survey_responses.answers → CurrentSelfProfile (GET /api/v2/survey와 동일 규칙) */
export function currentSelfProfileFromSurveyAnswers(
  answers: Record<string, unknown>,
): CurrentSelfProfile | null {
  const embedded = answers.v2_profile;
  if (embedded && typeof embedded === "object" && !Array.isArray(embedded)) {
    const profile = normalizeCurrentSelfProfile(embedded as CurrentSelfProfile);
    return isValidCurrentSelfProfile(profile) ? profile : null;
  }
  const stringAnswers = parseSurveyAnswersForScoring(answers);
  if (!stringAnswers) return null;
  const profile = scoreSurveyAnswers(stringAnswers as SurveyAnswersInput);
  return isValidCurrentSelfProfile(profile) ? profile : null;
}

/** 한 리포트의 v2 설문 프로필 (survey_responses SSOT) */
export async function getCurrentSelfProfileForReport(
  supabase: SupabaseClient,
  reportId: string,
): Promise<CurrentSelfProfile | null> {
  const rawAnswers = await getSurveyAnswersForReport(supabase, reportId);
  if (!rawAnswers) return null;
  return currentSelfProfileFromSurveyAnswers(rawAnswers);
}

function isV2SurveyAnswers(answers: Record<string, unknown>): boolean {
  if (answers.survey_source === "v2_10q") return true;
  if (answers.v2_profile && typeof answers.v2_profile === "object") return true;
  const keys = Object.keys(answers).filter((k) => /^q\d+$/.test(k));
  if (keys.length < 8) return false;
  const sample = answers[keys[0]];
  return typeof sample === "string" && /^[A-D]$/i.test(sample.trim());
}

function v2SummaryFromAnswers(
  answers: Record<string, unknown>,
): string | null {
  const embedded = answers.v2_profile;
  if (embedded && typeof embedded === "object" && !Array.isArray(embedded)) {
    return buildV2PatternSummaryForRelationship(
      normalizeCurrentSelfProfile(embedded as CurrentSelfProfile),
    );
  }
  if (!isV2SurveyAnswers(answers)) return null;
  const scored = scoreSurveyAnswers(answers as SurveyAnswersInput);
  return buildV2PatternSummaryForRelationship(scored);
}

/** v2 설문 — Human Framework 요약 텍스트 */
export async function getPatternSummaryForReport(
  supabase: SupabaseClient,
  reportId: string,
): Promise<string | null> {
  const rawAnswers = await getSurveyAnswersForReport(supabase, reportId);
  if (!rawAnswers) return null;

  const v2 = v2SummaryFromAnswers(rawAnswers);
  if (!v2) return null;

  if (rawAnswers.survey_skipped === true) {
    return `${v2}\n\n[참고] 설문 미응답 — 중립 프로필 기준으로 분석됩니다.`;
  }
  return v2;
}

/** 관계 기본 분석 API 폴백용 최소 텍스트 */
export function buildFallbackPatternSummary(
  answers: Record<string, unknown>,
): string {
  const v2 = v2SummaryFromAnswers(answers);
  if (v2) return v2;
  return "[설문] v2 프로필을 불러오지 못했습니다.";
}
