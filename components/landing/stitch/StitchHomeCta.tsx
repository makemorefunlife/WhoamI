"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";

type Props = {
  resumeLoading: boolean;
  creatingReport: boolean;
  onOpenStartChoice: () => void;
};

/** Small caption under the CTA — replaces the old "이용 방법" link with the hero hook line. */
function HeroHookCaption() {
  const { messages } = useLocale();
  const text = messages.landing.heroBody2 || messages.landing.heroHook;
  if (!text) return null;
  return (
    <p className="w-full max-w-md self-start whitespace-pre-line text-left text-xs leading-relaxed text-on-surface-variant/70">
      {text}
    </p>
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
        className="group relative z-10 cursor-pointer inline-flex w-full min-w-[18rem] sm:min-w-[22rem] items-center justify-center gap-2.5 rounded-full bg-gradient-to-b from-[#234d3c] via-[#1a382c] to-[#12281f] px-8 py-5 text-lg sm:text-xl font-bold tracking-wide text-[#fffdf8] shadow-[0_16px_36px_rgba(26,51,40,0.32),0_2px_0_rgba(255,255,255,0.18)_inset] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(26,51,40,0.42),0_0_0_2px_rgba(58,143,110,0.4)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-65"
        disabled={creatingReport}
        onClick={(e) => {
          e.preventDefault();
          onOpenStartChoice();
        }}
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
      <HeroHookCaption />
    </div>
  );
}
