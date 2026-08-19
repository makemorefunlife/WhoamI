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
      className="w-fit text-sm text-on-surface-variant/80 underline-offset-4 transition hover:text-primary hover:underline font-medium"
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
    <div className="flex w-full max-w-md flex-col items-center gap-4 mx-auto">
      <button
        type="button"
        className="group relative inline-flex w-full min-w-[18rem] sm:min-w-[22rem] items-center justify-center gap-2.5 rounded-full bg-gradient-to-b from-[#234d3c] via-[#1a382c] to-[#12281f] px-8 py-5 text-lg sm:text-xl font-bold tracking-wide text-[#fffdf8] shadow-[0_16px_36px_rgba(26,51,40,0.32),0_2px_0_rgba(255,255,255,0.18)_inset] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(26,51,40,0.42),0_0_0_2px_rgba(58,143,110,0.4)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-65"
        disabled={creatingReport}
        onClick={onOpenStartChoice}
      >
        <span>
          {creatingReport
            ? messages.common.preparing
            : messages.landing?.heroCtaText || messages.cta.getStarted}
        </span>
        {!creatingReport ? (
          <span className="text-xl font-semibold transition-transform duration-200 group-hover:translate-x-1" aria-hidden>
            →
          </span>
        ) : null}
      </button>
      <HowItWorksLink />
    </div>
  );
}
