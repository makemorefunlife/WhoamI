/**
 * ONE rule for "what of my own info is still missing, and where do I fill it
 * in" (2026-10-11). Used by the result pages (blueprintMissingStep), add
 * friend / post-purchase (friendAddReadiness), and invites.
 *
 *   - Birth date is always needed (time / place may be "unknown").
 *   - Survey: required only where the locale requires it (en-US). In ko-KR it
 *     is optional and never blocks anything.
 *   - Completed input is never asked again: a step is returned only for what
 *     is actually missing.
 *
 * Paths are locale-free; callers localize them.
 */
export type InfoFacts = {
  reportId: string;
  hasBirth: boolean;
  hasSurvey: boolean;
  surveyRequired: boolean;
};

export type InfoStep = "survey" | "birth" | null;

export function nextInfoStep(f: InfoFacts): InfoStep {
  // US: survey first, then birth (same order as member onboarding).
  if (f.surveyRequired && !f.hasSurvey) return "survey";
  if (!f.hasBirth) return "birth";
  return null;
}

export function nextInfoStepPath(f: InfoFacts): string | null {
  const step = nextInfoStep(f);
  if (!step) return null;
  const q = `?reportId=${encodeURIComponent(f.reportId)}`;
  if (step === "survey") return `/survey-v2${q}`;
  // US: the birth step after the (required) survey is the survey-complete
  // page. Everywhere else the plain birth page -- it does not depend on a
  // survey copy being in this browser.
  return f.hasSurvey && f.surveyRequired ? `/survey-v2/complete${q}` : `/onboarding/birth${q}`;
}
