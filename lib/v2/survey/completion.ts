import { SCORED_QUESTION_IDS, type SurveyChoice } from "@/lib/v2/survey/types";

const VALID_CHOICES = new Set<SurveyChoice>(["A", "B", "C", "D"]);
const VALID_Q10 = new Set(["1", "2", "3", "4", "5"]);

export function isSurveyV2AnswersComplete(
  answers: Record<string, string> | null | undefined,
): boolean {
  if (!answers) return false;

  for (const qId of SCORED_QUESTION_IDS) {
    const v = answers[qId]?.trim().toUpperCase();
    if (!v || !VALID_CHOICES.has(v as SurveyChoice)) return false;
  }

  const q10 = answers.q10?.trim();
  return Boolean(q10 && VALID_Q10.has(q10));
}
