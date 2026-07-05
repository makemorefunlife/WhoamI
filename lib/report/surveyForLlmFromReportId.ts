import type { SupabaseClient } from "@supabase/supabase-js";
import { getPatternInterpretation } from "@/lib/hardcoded/patternLookup";

function normalizeYN(value: unknown): string {
  const v = String(value ?? "")
    .trim()
    .toUpperCase();
  if (v === "Y" || v === "YES") return "Y";
  if (v === "N" || v === "NO") return "N";
  return "";
}

function getPattern(a: unknown, b: unknown, c: unknown): string {
  return normalizeYN(a) + normalizeYN(b) + normalizeYN(c);
}

export function buildSurveyOnlyPrompt(interpretations: Record<string, string>) {
  const personality = Object.values(interpretations).filter(Boolean).join(", ");
  return `
[설문 기반 성향 — 실제 행동·패턴 해석]
${personality || "(설문 해석 없음)"}

위 설문 해석만을 근거로 분석해줘.
`.trim();
}

/**
 * report_id에 대한 설문 + pattern_base 해석을 모아 LLM free 모드용 userInput 문자열 생성
 */
export async function buildSurveyOnlyUserInputForReport(
  supabase: SupabaseClient,
  reportId: string,
): Promise<string | null> {
  const { data: responseData } = await supabase
    .from("survey_responses")
    .select("answers")
    .eq("report_id", reportId)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!responseData?.answers) return null;

  const ans = responseData.answers as Record<string, string>;
  const patterns: Record<string, string> = {
    mbti: getPattern(ans.q1, ans.q2, ans.q3),
    disc: getPattern(ans.q4, ans.q5, ans.q6),
    enneagram: getPattern(ans.q7, ans.q8, ans.q9),
    riasec: getPattern(ans.q10, ans.q11, ans.q12),
    pss: getPattern(ans.q13, ans.q14, ans.q15),
    tci: getPattern(ans.q16, ans.q17, ans.q18),
  };

  const localInterpretations: Record<string, string> = {};
  for (const key of Object.keys(patterns)) {
    const pattern = patterns[key];
    localInterpretations[key] =
      getPatternInterpretation(key, pattern) ?? "해석 없음";
  }

  return buildSurveyOnlyPrompt(localInterpretations);
}
