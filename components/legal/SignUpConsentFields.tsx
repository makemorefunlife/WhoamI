"use client";

import LocaleLink from "@/lib/i18n/LocaleLink";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { ROUTES } from "@/constants/routes";
import { writeSignupConsentDraft } from "@/lib/legal/consent";

type Props = {
  ageChecked: boolean;
  termsChecked: boolean;
  marketingChecked: boolean;
  onAgeChange: (v: boolean) => void;
  onTermsChange: (v: boolean) => void;
  onMarketingChange: (v: boolean) => void;
};

/** 한국 가입 화면 — 필수 2개 + 선택 마케팅 동의 */
export default function SignUpConsentFields({
  ageChecked,
  termsChecked,
  marketingChecked,
  onAgeChange,
  onTermsChange,
  onMarketingChange,
}: Props) {
  const { locale, messages } = useLocale();
  const copy = messages.legalConsent;

  function persist(
    nextAge: boolean,
    nextTerms: boolean,
    nextMarketing: boolean,
  ) {
    writeSignupConsentDraft({
      age: nextAge,
      terms: nextTerms,
      marketing: nextMarketing,
      locale,
    });
  }

  return (
    <div className="mb-5 w-full max-w-[400px] space-y-3 rounded-xl border border-white/10 bg-slate-900/80 p-4 text-left">
      <label className="flex cursor-pointer items-start gap-2.5 text-sm leading-snug text-slate-200">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/30"
          checked={ageChecked}
          onChange={(e) => {
            const v = e.target.checked;
            onAgeChange(v);
            persist(v, termsChecked, marketingChecked);
          }}
          required
        />
        <span>{copy.ageLabel}</span>
      </label>

      <label className="flex cursor-pointer items-start gap-2.5 text-sm leading-snug text-slate-200">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/30"
          checked={termsChecked}
          onChange={(e) => {
            const v = e.target.checked;
            onTermsChange(v);
            persist(ageChecked, v, marketingChecked);
          }}
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
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/30"
          checked={marketingChecked}
          onChange={(e) => {
            const v = e.target.checked;
            onMarketingChange(v);
            persist(ageChecked, termsChecked, v);
          }}
        />
        <span>{copy.marketingLabel}</span>
      </label>

      {!(ageChecked && termsChecked) ? (
        <p className="text-xs text-amber-200/90">{copy.gateHint}</p>
      ) : null}
    </div>
  );
}
