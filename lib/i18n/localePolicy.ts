import type { Locale } from "@/lib/i18n/locale";

/**
 * US/KR onboarding split -- SSOT for whether the 10-question behavioral
 * survey is a mandatory gate before birth-date entry / results.
 *
 * en-US (`www.ahaitsme.com`): survey is REQUIRED -- preserves the app's
 * original v2 onboarding contract (survey -> birth -> blueprint)
 * unchanged. See resolveEntryDestination / app/onboarding/birth for the
 * actual gate logic this flag drives.
 *
 * ko-KR (`www.ahaitsme.com/kr`): survey is OPTIONAL -- Saju birth data
 * alone is enough for a base analysis. The survey UI/engine is not
 * removed; it is simply not a blocking prerequisite. Existing KR users'
 * flow (including anyone who already completed the survey) is untouched.
 */
export function isPsychSurveyRequired(locale: Locale): boolean {
  return locale !== "ko-KR";
}
