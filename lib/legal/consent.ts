/** Clerk unsafeMetadata keys for launch legal consents */

export const LEGAL_CONSENT_META_KEY = "legalConsent" as const;
export const MARKETING_CONSENT_META_KEY = "marketingConsent" as const;

export type LegalConsentRecord = {
  ageConfirmed: true;
  termsAccepted: true;
  /**
   * Separate from termsAccepted -- PIPA distinguishes "terms of service
   * consent" from "consent to collect/use personal information"; a single
   * combined checkbox does not satisfy either (2026-09-18 legal
   * consultation memo). Both are gated together in the UI today (one flow,
   * two checkboxes), but tracked as distinct fields so they can be
   * audited/withdrawn independently later.
   */
  privacyAccepted: true;
  /** ISO timestamp */
  acceptedAt: string;
  /** Locale at consent time */
  locale: "ko-KR" | "en-US";
  /** Minimum age affirmed (14 KR / 13 US) */
  minAge: 13 | 14;
};

export type SignupConsentDraft = {
  age?: boolean;
  terms?: boolean;
  /** Consent to collect/use personal info -- separate from `terms`, see LegalConsentRecord. */
  privacy?: boolean;
  marketing: boolean;
  locale: "ko-KR" | "en-US";
  at: number;
};

export const SIGNUP_CONSENT_SESSION_KEY = "aha_signup_legal_consent";

export function isLegalConsentComplete(
  unsafeMetadata: Record<string, unknown> | undefined | null,
): boolean {
  const raw = unsafeMetadata?.[LEGAL_CONSENT_META_KEY];
  if (!raw || typeof raw !== "object") return false;
  const c = raw as Partial<LegalConsentRecord>;
  return (
    c.ageConfirmed === true &&
    c.termsAccepted === true &&
    c.privacyAccepted === true &&
    typeof c.acceptedAt === "string"
  );
}

export function buildLegalConsentRecord(
  locale: "ko-KR" | "en-US",
): LegalConsentRecord {
  return {
    ageConfirmed: true,
    termsAccepted: true,
    privacyAccepted: true,
    acceptedAt: new Date().toISOString(),
    locale,
    minAge: locale === "ko-KR" ? 14 : 13,
  };
}

export function readSignupConsentDraft(): SignupConsentDraft | null {
  try {
    const raw = sessionStorage.getItem(SIGNUP_CONSENT_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SignupConsentDraft>;
    if (parsed.locale !== "ko-KR" && parsed.locale !== "en-US") return null;
    return {
      age: parsed.age === true,
      terms: parsed.terms === true,
      privacy: parsed.privacy === true,
      marketing: parsed.marketing === true,
      locale: parsed.locale,
      at: typeof parsed.at === "number" ? parsed.at : Date.now(),
    };
  } catch {
    return null;
  }
}

export function writeSignupConsentDraft(
  draft: Omit<SignupConsentDraft, "at"> & { at?: number },
): void {
  try {
    const payload: SignupConsentDraft = {
      age: draft.age === true,
      terms: draft.terms === true,
      privacy: draft.privacy === true,
      marketing: draft.marketing === true,
      locale: draft.locale,
      at: draft.at ?? Date.now(),
    };
    sessionStorage.setItem(SIGNUP_CONSENT_SESSION_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function clearSignupConsentDraft(): void {
  try {
    sessionStorage.removeItem(SIGNUP_CONSENT_SESSION_KEY);
  } catch {
    /* ignore */
  }
}
