"use client";

import { ensureBirthSession, hasMinimalBirth } from "@/lib/v2/onboarding/hydrateBirthSession";
import { readSurveyV2Session } from "@/lib/v2/survey/session";
import { nextInfoStepPath } from "@/lib/profile/infoSteps";
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
  // Shared rule (lib/profile/infoSteps.ts): only what is missing is asked.
  return nextInfoStepPath(p);
}
