"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export default function StitchPremiumCard({
  reportId,
  onGuestClick,
}: {
  reportId: string;
  onGuestClick?: () => void;
}) {
  const router = useRouter();
  const { locale, href: localize } = useLocale();
  const isKo = locale === "ko-KR";
  const href = localize(`/blueprint-preview/${encodeURIComponent(reportId)}/essence/deep`);

  const handleClick = () => {
    if (onGuestClick) {
      onGuestClick();
      return;
    }
    router.push(href);
  };

  return (
    <div className="group relative w-full overflow-hidden rounded-extra-large border border-[#c49a6c]/40 bg-gradient-to-br from-[#fffdf8] via-[#fbf7f0] to-[#f4ece0] p-6 text-left shadow-[0_16px_40px_rgba(26,51,40,0.08)] transition hover:border-[#c49a6c]/60 hover:shadow-[0_20px_48px_rgba(26,51,40,0.12)] sm:p-8">
      {/* Top Header Eyebrow */}
      <div className="flex items-center justify-between gap-4">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#c49a6c]/40 bg-[#c49a6c]/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
          <Sparkles className="h-3 w-3 text-[#c49a6c]" />
          PERSONAL PREMIUM
        </span>
      </div>

      {/* Main Headline */}
      <h2 className="stitch-headline mt-4 text-balance text-2xl font-bold leading-snug text-primary sm:text-3xl">
        {isKo ? "심화 통합 분석" : "Deep Integration Analysis"}
      </h2>

      {/* Body Copy */}
      <div className="mt-3.5 space-y-2 max-w-2xl text-sm sm:text-[15px] leading-relaxed text-on-surface-variant">
        <p className="font-semibold text-primary/90">
          {isKo
            ? "지금의 나와 본래의 나를 함께 읽어, 왜 지금의 방식으로 살아가고 있는지 이해합니다."
            : "Synthesize who you are today with your innate baseline to understand why you navigate life the way you do."}
        </p>
        <p className="text-on-surface-variant/90 text-xs sm:text-sm">
          {isKo
            ? "현재와 본래의 차이, 관계와 환경에서 반복되는 패턴, 에너지를 많이 쓰는 방식과 자연스럽게 잘하는 힘, 그리고 앞으로의 선택 기준까지 하나의 리포트로 연결해 보여드립니다."
            : "Weave your current state and essence into a single cohesive report — revealing core patterns, energy dynamics, relational environments, and decision frameworks."}
        </p>
      </div>

      {/* Feature Line / Chips */}
      <div className="mt-6 flex flex-wrap items-center gap-2 text-xs font-medium text-primary/80">
        <span className="rounded-lg bg-surface-container-lowest/80 border border-outline-variant/30 px-3 py-1.5 shadow-2xs">
          {isKo ? "현재의 나 · 본래의 나" : "Current Self · Innate Baseline"}
        </span>
        <span className="rounded-lg bg-surface-container-lowest/80 border border-outline-variant/30 px-3 py-1.5 shadow-2xs">
          {isKo ? "차이와 정렬 · 지금까지의 이야기" : "Alignment · Life Story"}
        </span>
        <span className="rounded-lg bg-surface-container-lowest/80 border border-outline-variant/30 px-3 py-1.5 shadow-2xs">
          {isKo ? "에너지 · 관계와 환경" : "Energy Dynamics · Relationships"}
        </span>
        <span className="rounded-lg bg-surface-container-lowest/80 border border-outline-variant/30 px-3 py-1.5 shadow-2xs">
          {isKo ? "앞으로의 선택" : "Decision Framework"}
        </span>
      </div>

      {/* Price & Primary Action */}
      <div className="mt-8 flex flex-col gap-4 border-t border-[#c49a6c]/25 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-baseline gap-2.5">
          <span className="stitch-headline text-3xl font-extrabold text-primary sm:text-4xl">
            $12.99
          </span>
          <span className="text-xs font-medium text-on-surface-variant/80">
            {isKo ? "1회 결제 · 계속 열람" : "One-time · Lifetime access"}
          </span>
        </div>

        <button
          type="button"
          onClick={handleClick}
          className="stitch-cta-primary inline-flex w-full items-center justify-center gap-2 sm:w-auto sm:min-w-[13rem] !py-3.5 !text-base shadow-md group-hover:shadow-lg transition-all"
        >
          <span>{isKo ? "심화 리포트 열기" : "Unlock Full Report"}</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}
