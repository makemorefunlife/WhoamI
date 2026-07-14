/**
 * Pending survey answers before login — browser session only (not DB).
 */

const KEY = "ahaitsme_v2_survey_pending";

export type PendingSurveyDraft = {
  answers: Record<string, string>;
  currentIndex?: number;
  savedAt: string;
};

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function writePendingSurveyDraft(
  draft: Omit<PendingSurveyDraft, "savedAt">,
): void {
  const s = storage();
  if (!s) return;
  const payload: PendingSurveyDraft = {
    ...draft,
    savedAt: new Date().toISOString(),
  };
  s.setItem(KEY, JSON.stringify(payload));
}

export function readPendingSurveyDraft(): PendingSurveyDraft | null {
  const s = storage();
  if (!s) return null;
  try {
    const raw = s.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingSurveyDraft;
    if (!parsed?.answers || typeof parsed.answers !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingSurveyDraft(): void {
  storage()?.removeItem(KEY);
}
