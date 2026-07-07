import type { SupabaseClient } from "@supabase/supabase-js";
import { getPatternSummaryForReport } from "@/lib/relationship/surveyPatterns";

/**
 * report_id에 대한 v2 설문 요약을 LLM free 모드용 userInput 문자열로 반환
 */
export async function buildSurveyOnlyUserInputForReport(
  supabase: SupabaseClient,
  reportId: string,
): Promise<string | null> {
  const summary = await getPatternSummaryForReport(supabase, reportId);
  if (!summary?.trim()) return null;

  return `
[설문 기반 성향 — Human Framework v2]
${summary.trim()}

위 설문 해석만을 근거로 분석해줘.
`.trim();
}
