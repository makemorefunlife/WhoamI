"use client";

import LocaleLink from "@/lib/i18n/LocaleLink";
import { useLocale } from "@/lib/i18n/LocaleProvider";

type Props = {
  resumeLoading: boolean;
  creatingReport: boolean;
  onOpenStartChoice: () => void;
};

function HowItWorksLink() {
  const { messages } = useLocale();
  return (
    <LocaleLink
      href="/how-it-works"
      className="w-fit text-sm text-on-surface-variant underline-offset-4 transition hover:text-primary hover:underline"
    >
      {messages.nav.howItWorks}
    </LocaleLink>
  );
}

/** Stitch 랜딩 단일 CTA — 시작하기 + how it works */
export default function StitchHomeCta({
  resumeLoading,
  creatingReport,
  onOpenStartChoice,
}: Props) {
  const { messages } = useLocale();
  return (
    <div className="flex w-full max-w-lg flex-col items-stretch gap-4">
      <button
        type="button"
        className="stitch-cta-primary w-full !py-5 !text-lg shadow-[0_12px_28px_rgba(39,86,68,0.25)]"
        disabled={creatingReport}
        onClick={onOpenStartChoice}
      >
        {creatingReport ? messages.common.preparing : messages.cta.getStarted}
        {!creatingReport ? (
          <span className="text-base font-normal opacity-90" aria-hidden>
            →
          </span>
        ) : null}
      </button>
      <HowItWorksLink />
    </div>
  );
}
