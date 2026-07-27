"use client";

import { RedirectToSignIn, useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LocaleLink from "@/lib/i18n/LocaleLink";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { ROUTES } from "@/constants/routes";
import {
  LEGAL_CONSENT_META_KEY,
  MARKETING_CONSENT_META_KEY,
  buildLegalConsentRecord,
  clearSignupConsentDraft,
  isLegalConsentComplete,
} from "@/lib/legal/consent";

/**
 * 한국 전용 — 필수 연령·약관(+선택 마케팅) 동의.
 * 미국은 가입 화면 Terms 안내로 충분하므로 여기로 보내지 않습니다.
 */
export default function LegalConsentPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const { locale, href, messages } = useLocale();
  const router = useRouter();
  const copy = messages.legalConsent;

  const [ageChecked, setAgeChecked] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [marketingChecked, setMarketingChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const alreadyDone =
    !!user &&
    isLegalConsentComplete(user.unsafeMetadata as Record<string, unknown>);

  useEffect(() => {
    if (locale !== "ko-KR") {
      router.replace(href(ROUTES.home));
      return;
    }
    if (alreadyDone) {
      router.replace(href(ROUTES.home));
    }
  }, [alreadyDone, router, href, locale]);

  if (!isLoaded || !userLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#1a1c2b] to-[#2a2d3e] text-slate-300">
        {copy.loading}
      </div>
    );
  }

  if (!isSignedIn || !user) {
    return <RedirectToSignIn redirectUrl={href(ROUTES.legalConsent)} />;
  }

  if (locale !== "ko-KR" || alreadyDone) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#1a1c2b] to-[#2a2d3e] text-slate-300">
        {copy.loading}
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ageChecked || !termsChecked) {
      setError(copy.gateHint);
      return;
    }
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          [LEGAL_CONSENT_META_KEY]: buildLegalConsentRecord("ko-KR"),
          [MARKETING_CONSENT_META_KEY]: marketingChecked,
        },
      });
      clearSignupConsentDraft();
      router.replace(href(ROUTES.home));
    } catch {
      setError(copy.saveError);
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#1a1c2b] to-[#2a2d3e] px-4 py-12">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md space-y-5 rounded-2xl border border-white/10 bg-slate-900/90 p-6 shadow-xl"
      >
        <div>
          <h1 className="text-xl font-semibold text-white">{copy.pageTitle}</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            {copy.pageSubtitle}
          </p>
        </div>

        <label className="flex cursor-pointer items-start gap-2.5 text-sm leading-snug text-slate-200">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 shrink-0"
            checked={ageChecked}
            onChange={(e) => setAgeChecked(e.target.checked)}
            required
          />
          <span>{copy.ageLabel}</span>
        </label>

        <label className="flex cursor-pointer items-start gap-2.5 text-sm leading-snug text-slate-200">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 shrink-0"
            checked={termsChecked}
            onChange={(e) => setTermsChecked(e.target.checked)}
            required
          />
          <span>
            {copy.termsPrefix}
            <LocaleLink
              href={ROUTES.terms}
              className="underline decoration-white/40 underline-offset-2 hover:text-white"
              target="_blank"
            >
              {copy.termsLink}
            </LocaleLink>
            {copy.termsMiddle}
            <LocaleLink
              href={ROUTES.privacy}
              className="underline decoration-white/40 underline-offset-2 hover:text-white"
              target="_blank"
            >
              {copy.privacyLink}
            </LocaleLink>
            {copy.termsSuffix}
          </span>
        </label>

        <label className="flex cursor-pointer items-start gap-2.5 text-sm leading-snug text-slate-400">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 shrink-0"
            checked={marketingChecked}
            onChange={(e) => setMarketingChecked(e.target.checked)}
          />
          <span>{copy.marketingLabel}</span>
        </label>

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}

        <button
          type="submit"
          disabled={saving || !ageChecked || !termsChecked}
          className="w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? copy.saving : copy.submit}
        </button>
      </form>
    </div>
  );
}
