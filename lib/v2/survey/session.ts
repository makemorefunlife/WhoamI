import type { CurrentSelfProfile } from "@/lib/v2/survey/types";
import { isSurveyV2AnswersComplete } from "@/lib/v2/survey/completion";
import {
  readJsonStorage,
  removeJsonStorage,
  writeJsonStorage,
} from "@/lib/v2/storage/localPersist";

const PREFIX = "ahaitsme_v2_survey_";

export type SurveyV2SessionBundle = {
  answers: Record<string, string>;
  profile: CurrentSelfProfile;
  savedAt: string;
};

function storageKey(reportId: string) {
  return `${PREFIX}${reportId}`;
}

export function writeSurveyV2Session(
  reportId: string,
  bundle: Omit<SurveyV2SessionBundle, "savedAt">,
) {
  if (!reportId) return;
  writeJsonStorage(storageKey(reportId), {
    ...bundle,
    savedAt: new Date().toISOString(),
  });
}

export function readSurveyV2Session(
  reportId: string,
): SurveyV2SessionBundle | null {
  if (!reportId) return null;
  const bundle = readJsonStorage<SurveyV2SessionBundle>(
    storageKey(reportId),
    storageKey(reportId),
  );
  if (!bundle || !bundle.answers || !bundle.profile) return null;
  if (!isSurveyV2AnswersComplete(bundle.answers)) return null;
  return bundle;
}

export function clearSurveyV2Session(reportId: string) {
  if (!reportId) return;
  removeJsonStorage(storageKey(reportId), storageKey(reportId));
}

export function hasSurveyV2Session(reportId: string): boolean {
  return readSurveyV2Session(reportId) != null;
}
