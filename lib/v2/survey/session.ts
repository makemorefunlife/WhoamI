import type { CurrentSelfProfile } from "@/lib/v2/survey/types";

const PREFIX = "ahaitsme_v2_survey_";

export type SurveyV2SessionBundle = {
  answers: Record<string, string>;
  profile: CurrentSelfProfile;
  savedAt: string;
};

export function writeSurveyV2Session(
  reportId: string,
  bundle: Omit<SurveyV2SessionBundle, "savedAt">,
) {
  if (typeof window === "undefined" || !reportId) return;
  try {
    const payload: SurveyV2SessionBundle = {
      ...bundle,
      savedAt: new Date().toISOString(),
    };
    sessionStorage.setItem(`${PREFIX}${reportId}`, JSON.stringify(payload));
  } catch {
    /* quota */
  }
}

export function readSurveyV2Session(
  reportId: string,
): SurveyV2SessionBundle | null {
  if (typeof window === "undefined" || !reportId) return null;
  try {
    const raw = sessionStorage.getItem(`${PREFIX}${reportId}`);
    if (!raw) return null;
    return JSON.parse(raw) as SurveyV2SessionBundle;
  } catch {
    return null;
  }
}

export function clearSurveyV2Session(reportId: string) {
  if (typeof window === "undefined" || !reportId) return;
  try {
    sessionStorage.removeItem(`${PREFIX}${reportId}`);
  } catch {
    /* ignore */
  }
}

export function hasSurveyV2Session(reportId: string): boolean {
  return readSurveyV2Session(reportId) != null;
}
