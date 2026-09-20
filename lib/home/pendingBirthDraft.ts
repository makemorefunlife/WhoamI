import type { StitchBirthFormState } from "@/components/onboarding/StitchBirthInputForm";

const KEY = "pendingBirthDraft";

/**
 * Birth date/time/place captured BEFORE the person has signed in or up —
 * used by the invite/connect "birth-first" entry (app/invite-birth/page.tsx
 * draft mode) to survive the Clerk auth step. A plain in-memory React
 * state would be lost the moment an OAuth provider (Google, etc.) does its
 * full-page redirect away and back, so this is the source of truth for
 * "what did they already type" across that boundary — read once right
 * after sign-in completes, then cleared.
 */
export function readPendingBirthDraft(): StitchBirthFormState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StitchBirthFormState> | null;
    if (!parsed || typeof parsed.birthDate !== "string" || !parsed.birthDate) {
      return null;
    }
    return {
      birthDate: parsed.birthDate,
      birthTime: typeof parsed.birthTime === "string" ? parsed.birthTime : null,
      birthTimeUnknown: Boolean(parsed.birthTimeUnknown),
      birthPlace: typeof parsed.birthPlace === "string" ? parsed.birthPlace : null,
      birthPlaceUnknown: Boolean(parsed.birthPlaceUnknown),
    };
  } catch {
    return null;
  }
}

export function writePendingBirthDraft(state: StitchBirthFormState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Best-effort only — a storage failure just means no survive-redirect
    // safety net, not a reason to block the person from continuing.
  }
}

export function clearPendingBirthDraft(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    // no-op
  }
}
