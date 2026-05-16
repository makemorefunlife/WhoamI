import type { SupabaseClient } from "@supabase/supabase-js";

const SURVEY_ANSWER_KEYS = Array.from(
  { length: 18 },
  (_, i) => `q${i + 1}`,
);

export function answersIndicateCompleteSurvey(
  answers: unknown,
): boolean {
  if (!answers || typeof answers !== "object") return false;
  const record = answers as Record<string, unknown>;
  return SURVEY_ANSWER_KEYS.every((key) => {
    const v = record[key];
    return v === "Y" || v === "N";
  });
}

/** 설문 완료: survey_responses 행 + 18문항 Y/N */
export async function isSurveyCompleteForReport(
  supabase: SupabaseClient,
  reportId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("survey_responses")
    .select("id, answers")
    .eq("report_id", reportId)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("surveyCompletion:", reportId, error.message);
    return false;
  }
  if (!data) return false;
  return answersIndicateCompleteSurvey(data.answers);
}
