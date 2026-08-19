"use client";

import DecisionStatusDot from "@/components/decision/DecisionStatusDot";
import { StarRatingDisplay } from "@/components/decision/StarRating";
import type { DecisionEntry } from "@/lib/decision/types";
import { useLocale } from "@/lib/i18n/LocaleProvider";

const AUTHENTIC_ENTRY: DecisionEntry = {
  id: "landing-authentic-1",
  context: "오늘 중요한 회의에서 상대가 거세게 밀어붙일 때, 감정대로 바로 받아치지 않고 한 박자 쉬어가며 질문을 먼저 던졌다.",
  category: "relationship",
  status: "reviewed",
  note: "내 본질 성향을 기억하고 즉각적인 반응을 늦춘 선택이 맞았다. 앞으로도 갈등 상황에서는 먼저 감정을 정리한 뒤 핵심만 3줄로 전달해야겠다.",
  rating: 5,
  createdAt: "2026-03-14T09:00:00.000Z",
  updatedAt: "2026-03-14T09:00:00.000Z",
  reviewedAt: "2026-03-14T09:00:00.000Z",
};

export default function StitchDecisionJournalPreview() {
  const { messages } = useLocale();

  const steps = [
    { num: "01", label: messages.decision.onboardingLogLabel, desc: messages.decision.onboardingLogDesc },
    { num: "02", label: messages.decision.onboardingReviewLabel, desc: messages.decision.onboardingReviewDesc },
    { num: "03", label: messages.decision.onboardingAnalyzeLabel, desc: messages.decision.onboardingAnalyzeDesc },
  ];

  return (
    <div className="w-full max-w-2xl text-left rounded-extra-extra-large border border-outline-variant/30 bg-surface-container-lowest p-6 sm:p-8 shadow-sm">
      {/* 3-step workflow banner */}
      <div className="mb-6 rounded-2xl border border-outline-variant/25 bg-gradient-to-r from-surface-container-low/80 via-surface-container-lowest to-surface-container-low/60 px-4 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-1 sm:gap-3">
          {steps.map((step, index) => (
            <div key={step.num} className="contents">
              <div className="min-w-0 flex-1 text-center">
                <p className="text-[10px] font-bold tracking-[0.2em] text-primary sm:text-[11px]">
                  <span className="text-secondary">{step.num}</span>{" "}
                  <span>{step.label}</span>
                </p>
                <p className="mt-1 text-[9px] leading-snug text-on-surface-variant/70 sm:text-[10px]">
                  {step.desc}
                </p>
              </div>
              {index < steps.length - 1 ? (
                <span
                  className="mt-0.5 shrink-0 px-0.5 text-[10px] font-light text-outline-variant sm:mt-1 sm:px-1 sm:text-xs"
                  aria-hidden
                >
                  ➔
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* Authentic human-written diary entry card */}
      <div className="rounded-2xl border border-[#e2dad0] bg-[#fcfbfa] p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between gap-3 border-b border-[#ece5dd] pb-3">
          <div className="flex items-center gap-2.5">
            <DecisionStatusDot entry={AUTHENTIC_ENTRY} />
            <span className="text-xs font-semibold text-accent-emerald tracking-wider uppercase">
              2026. 03. 14 · 일상 기록
            </span>
          </div>
          <StarRatingDisplay rating={5} />
        </div>

        <div className="space-y-3.5 text-sm">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary/70 block mb-1">
              [오늘의 결정]
            </span>
            <p className="font-medium text-primary leading-relaxed text-base">
              &quot;{AUTHENTIC_ENTRY.context}&quot;
            </p>
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/70 block mb-1">
              [그때의 마음]
            </span>
            <p className="text-on-surface-variant leading-relaxed">
              처음엔 조급하고 답답했지만, 결과적으로 대화의 주도권을 지킴.
            </p>
          </div>

          <div className="mt-4 rounded-xl bg-secondary-container/50 p-4 border border-accent-emerald/25">
            <span className="text-[11px] font-bold uppercase tracking-wider text-accent-emerald block mb-1.5">
              [나의 선택 패턴 회고]
            </span>
            <p className="text-xs sm:text-sm text-primary/95 leading-relaxed font-normal">
              {AUTHENTIC_ENTRY.note}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
