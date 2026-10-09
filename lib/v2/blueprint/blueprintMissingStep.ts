"use client";

import { ensureBirthSession, hasMinimalBirth } from "@/lib/v2/onboarding/hydrateBirthSession";
import { readSurveyV2Session } from "@/lib/v2/survey/session";
import { hydrateSurveySession } from "@/lib/v2/survey/surveyClient";

/**
 * Where to send someone whose blueprint can't be built yet (shared by the
 * result, current, essence and deep pages). The survey is a missing step
 * only where the locale requires it (en-US); in ko-KR it is optional, so
 * only missing birth data sends them to the birth page.
 * Returns a locale-free path, or null when nothing is missing.
 */
export async function blueprintMissingStepPath(reportId: string, surveyRequired: boolean): Promise<string | null> {
  if (!reportId) return "/";
  if (!readSurveyV2Session(reportId)) await hydrateSurveySession(reportId);
  const hasSurvey = Boolean(readSurveyV2Session(reportId));
  // Birth is only fetched when the survey step doesn't already decide it.
  const hasBirth = !hasSurvey && surveyRequired ? true : hasMinimalBirth(await ensureBirthSession(reportId));
  return decideBlueprintMissingStep({ reportId, hasSurvey, hasBirth, surveyRequired });
}

/** Pure rule behind blueprintMissingStepPath (unit-tested). */
export function decideBlueprintMissingStep(p: {
  reportId: string;
  hasSurvey: boolean;
  hasBirth: boolean;
  surveyRequired: boolean;
}): string | null {
  if (!p.reportId) return "/";
  const q = `?reportId=${encodeURIComponent(p.reportId)}`;
  if (!p.hasSurvey && p.surveyRequired) return `/survey-v2${q}`;
  if (!p.hasBirth) {
    // The survey-complete page needs a survey; the birth page does not.
    return p.hasSurvey ? `/survey-v2/complete${q}` : `/onboarding/birth${q}`;
  }
  return null;
}
