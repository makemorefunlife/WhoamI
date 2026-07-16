import type { Locale } from "@/lib/i18n/locale";
import { normalizeLocale } from "@/lib/i18n/locale";
import {
  SURVEY_V2_QUESTIONS,
  type SurveyQuestion,
} from "@/lib/v2/survey/questions";
import { SURVEY_V2_QUESTIONS_EN } from "@/lib/v2/survey/questionsEn";

/**
 * Locale UI copy for survey — IDs and option `value`s are identical across locales.
 * Scoring must use values only, never labels.
 */
export function getSurveyQuestions(locale: Locale | string): SurveyQuestion[] {
  const resolved = normalizeLocale(locale);
  return resolved === "ko-KR" ? SURVEY_V2_QUESTIONS : SURVEY_V2_QUESTIONS_EN;
}

export function getSurveyQuestionCount(locale: Locale | string): number {
  return getSurveyQuestions(locale).length;
}
