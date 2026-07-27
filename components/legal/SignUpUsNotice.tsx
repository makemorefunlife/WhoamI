"use client";

import LocaleLink from "@/lib/i18n/LocaleLink";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { ROUTES } from "@/constants/routes";
import { writeSignupConsentDraft } from "@/lib/legal/consent";

type Props = {
  marketingChecked: boolean;
  onMarketingChange: (v: boolean) => void;
};

/**
 * 미국 가입 화면 — Clerk 폼은 바로 노출.
 * 소셜 영역 아래에 Terms 안내 + 선택 마케팅 동의만 둔다.
 */
export default function SignUpUsNotice({
  marketingChecked,
  onMarketingChange,
}: Props) {
  const { locale, messages } = useLocale();
  const copy = messages.legalConsent;

  return (
    <div className="mt-4 w-full max-w-[400px] space-y-3 text-left">
      <p className="text-sm text-gray-500">
        {copy.byContinuingPrefix}{" "}
        <LocaleLink
          href={ROUTES.terms}
          className="underline underline-offset-2 hover:text-gray-300"
          target="_blank"
        >
          {copy.termsLink}
        </LocaleLink>{" "}
        {copy.byContinuingMiddle}{" "}
        <LocaleLink
          href={ROUTES.privacy}
          className="underline underline-offset-2 hover:text-gray-300"
          target="_blank"
        >
          {copy.privacyLink}
        </LocaleLink>
        {copy.byContinuingSuffix}
      </p>

      <label className="flex cursor-pointer items-start gap-2 text-xs leading-snug text-gray-500">
        <input
          type="checkbox"
          className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-white/30"
          checked={marketingChecked}
          onChange={(e) => {
            const v = e.target.checked;
            onMarketingChange(v);
            writeSignupConsentDraft({
              marketing: v,
              locale,
            });
          }}
        />
        <span>{copy.marketingLabelOptional}</span>
      </label>
    </div>
  );
}
