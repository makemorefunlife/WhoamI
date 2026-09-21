"use client";

import LocaleLink from "@/lib/i18n/LocaleLink";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { ROUTES } from "@/constants/routes";
import { writeSignupConsentDraft } from "@/lib/legal/consent";

type Props = {
  ageChecked: boolean;
  termsChecked: boolean;
  privacyChecked: boolean;
  marketingChecked: boolean;
  onAgeChange: (v: boolean) => void;
  onTermsChange: (v: boolean) => void;
  onPrivacyChange: (v: boolean) => void;
  onMarketingChange: (v: boolean) => void;
};

/**
 * 한국 가입 화면 -- 필수 3개(연령/이용약관/개인정보 수집·이용) + 선택 마케팅 동의.
 *
 * 이용약관 동의와 개인정보 수집·이용 동의는 별도 체크박스로 분리되어 있다 --
 * PIPA상 두 동의는 서로 다른 근거이고, 개인정보처리방침은 동의 대상이 아니라
 * 열람 대상 공개문서이므로 "처리방침 링크"가 아니라 "수집·이용 동의"를 받는다
 * (2026-09-18 법률 자문 메모 기준). 자세한 목적/항목/보유기간/거부권 안내는
 * 아래 <details>에 자문 메모 초안을 반영해 두었으며, 최종 문구는 변호사
 * 확인 후 확정 필요.
 */
export default function SignUpConsentFields({
  ageChecked,
  termsChecked,
  privacyChecked,
  marketingChecked,
  onAgeChange,
  onTermsChange,
  onPrivacyChange,
  onMarketingChange,
}: Props) {
  const { locale, messages } = useLocale();
  const copy = messages.legalConsent;

  function persist(
    nextAge: boolean,
    nextTerms: boolean,
    nextPrivacy: boolean,
    nextMarketing: boolean,
  ) {
    writeSignupConsentDraft({
      age: nextAge,
      terms: nextTerms,
      privacy: nextPrivacy,
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
            persist(v, termsChecked, privacyChecked, marketingChecked);
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
            persist(ageChecked, v, privacyChecked, marketingChecked);
          }}
          required
        />
        <span>
          {copy.termsCheckboxLabel}{" "}
          <LocaleLink
            href={ROUTES.terms}
            className="underline decoration-white/40 underline-offset-2 hover:text-white"
            target="_blank"
          >
            {copy.termsLink}
          </LocaleLink>
        </span>
      </label>

      <div className="space-y-1.5">
        <label className="flex cursor-pointer items-start gap-2.5 text-sm leading-snug text-slate-200">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/30"
            checked={privacyChecked}
            onChange={(e) => {
              const v = e.target.checked;
              onPrivacyChange(v);
              persist(ageChecked, termsChecked, v, marketingChecked);
            }}
            required
          />
          <span>
            {copy.privacyCheckboxLabel}{" "}
            <LocaleLink
              href={ROUTES.privacy}
              className="underline decoration-white/40 underline-offset-2 hover:text-white"
              target="_blank"
            >
              {copy.privacyLink}
            </LocaleLink>
          </span>
        </label>
        <details className="ml-6 text-xs leading-relaxed text-slate-400">
          <summary className="cursor-pointer select-none text-slate-400 underline decoration-white/30 underline-offset-2 hover:text-slate-200">
            {copy.privacyDetailToggle}
          </summary>
          <dl className="mt-2 space-y-1.5 border-l border-white/10 pl-3">
            <div>
              <dt className="font-medium text-slate-300">{copy.privacyDetailPurposeLabel}</dt>
              <dd>{copy.privacyDetailPurpose}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-300">{copy.privacyDetailItemsLabel}</dt>
              <dd>{copy.privacyDetailItems}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-300">{copy.privacyDetailRetentionLabel}</dt>
              <dd>{copy.privacyDetailRetention}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-300">{copy.privacyDetailRefusalLabel}</dt>
              <dd>{copy.privacyDetailRefusal}</dd>
            </div>
          </dl>
        </details>
      </div>

      <label className="flex cursor-pointer items-start gap-2.5 text-sm leading-snug text-slate-400">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/30"
          checked={marketingChecked}
          onChange={(e) => {
            const v = e.target.checked;
            onMarketingChange(v);
            persist(ageChecked, termsChecked, privacyChecked, v);
          }}
        />
        <span>{copy.marketingLabel}</span>
      </label>

      {!(ageChecked && termsChecked && privacyChecked) ? (
        <p className="text-xs text-amber-200/90">{copy.gateHint}</p>
      ) : null}
    </div>
  );
}
