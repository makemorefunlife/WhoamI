import type { SupabaseClient } from "@supabase/supabase-js";
import { logServerError } from "@/lib/security/safeLog";
import { isSurveyV2AnswersComplete } from "@/lib/v2/survey/completion";

function parseAnswersRow(raw: unknown): Record<string, unknown> | null {
  if (!raw) return null;
  let answers: unknown = raw;
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

function isV2CompleteRecord(answers: Record<string, unknown>): boolean {
  if (answers.survey_source === "v2_10q") return true;
  if (answers.v2_profile && typeof answers.v2_profile === "object") return true;

  const stringAnswers: Record<string, string> = {};
  for (const [key, value] of Object.entries(answers)) {
    if (typeof value === "string") stringAnswers[key] = value;
  }
  return isSurveyV2AnswersComplete(stringAnswers);
}

/** DB survey_responses 기준 v2 10문항 완료 여부 */
export async function isV2SurveyCompleteForReport(
  supabase: SupabaseClient,
  reportId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("survey_responses")
    .select("answers")
    .eq("report_id", reportId)
    .order("id", { ascending: false })
    .limit(1);

  if (error) {
    logServerError("dbCompletion", error, "db_select_failed");
    return false;
  }

  const answers = parseAnswersRow(data?.[0]?.answers);
  if (!answers) return false;
  return isV2CompleteRecord(answers);
}
