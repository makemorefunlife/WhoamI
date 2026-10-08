/**
 * What adding a friend / running a relationship analysis actually needs from
 * the viewer -- and, just as important, what it does NOT need.
 *
 * Needed (all free):
 *   - signed in (friends and relationship records belong to an account),
 *   - the viewer's own profile row (`reports`, created free when they start),
 *   - their birth date on it (relationship analysis compares both people's
 *     birth data; time / place may be "unknown"),
 *   - the 10-question survey only where the locale requires it (en-US).
 *     In ko-KR it is optional (it sharpens the result).
 *
 * NOT needed:
 *   - a paid Personal report or any purchase,
 *   - the free "basic analysis" result page having been opened or generated
 *     (relationship analysis reads the birth data directly).
 *
 * Buying a relationship pass is never gated by any of this.
 */
export type FriendAddReadiness =
  | { status: "loading" }
  | { status: "signed_out" }
  | { status: "no_profile" }
  | { status: "needs_birth"; reportId: string; surveyDone: boolean }
  | { status: "needs_survey"; reportId: string }
  | { status: "ready"; reportId: string };

export type ViewerFacts = {
  signedIn: boolean;
  reportId: string | null;
  hasBirthDate: boolean;
  surveyComplete: boolean;
  surveyRequired: boolean;
};

export function decideFriendAddReadiness(f: ViewerFacts): FriendAddReadiness {
  if (!f.signedIn) return { status: "signed_out" };
  if (!f.reportId) return { status: "no_profile" };
  // US: survey first, then birth (same order as the member onboarding).
  if (f.surveyRequired && !f.surveyComplete) return { status: "needs_survey", reportId: f.reportId };
  if (!f.hasBirthDate) return { status: "needs_birth", reportId: f.reportId, surveyDone: f.surveyComplete };
  return { status: "ready", reportId: f.reportId };
}

/** Where to send the viewer to fill in what is missing (locale-free paths). */
export function selfProfileStepPath(r: FriendAddReadiness, surveyRequired: boolean): string | null {
  if (r.status === "needs_survey") return `/survey-v2?reportId=${encodeURIComponent(r.reportId)}`;
  if (r.status === "needs_birth") {
    return surveyRequired && r.surveyDone
      ? `/survey-v2/complete?reportId=${encodeURIComponent(r.reportId)}`
      : `/onboarding/birth?reportId=${encodeURIComponent(r.reportId)}`;
  }
  return null;
}

/** Hub URL that reopens the add-friend sheet for this viewer. */
export function friendAddReturnPath(reportId: string | null): string {
  const p = new URLSearchParams({ section: "add" });
  if (reportId) p.set("myReportId", reportId);
  return `/relationships?${p.toString()}`;
}
