"use client";

import GlassCard from "@/components/space/GlassCard";
import type { LiteSection } from "@/lib/v2/lite/types";

function SectionBlock({ section }: { section: LiteSection }) {
  if (!section?.body?.trim()) return null;
  return (
    <div className="space-y-1.5 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3.5">
      {section.title ? (
        <h3 className="text-sm font-semibold text-[rgba(255,255,255,0.9)]">
          {section.title}
        </h3>
      ) : null}
      <p className="text-sm leading-relaxed text-[rgba(255,255,255,0.78)]">
        {section.body}
      </p>
    </div>
  );
}

export function CurrentLiteReportView({
  oneLineSummary,
  sections,
}: {
  oneLineSummary: string;
  sections: LiteSection[];
}) {
  return (
    <div className="space-y-4">
      {oneLineSummary ? (
        <p className="text-center text-[15px] font-medium leading-snug text-[#7B9BFF]">
          {oneLineSummary}
        </p>
      ) : null}
      <div className="space-y-2.5">
        {sections.map((s, i) => (
          <SectionBlock key={`${s.title}-${i}`} section={s} />
        ))}
      </div>
    </div>
  );
}

export function EssenceLiteReportView({
  oneLineSummary,
  sections,
}: {
  oneLineSummary: string;
  sections: LiteSection[];
}) {
  return (
    <div className="space-y-4">
      {oneLineSummary ? (
        <p className="text-center text-[15px] font-medium leading-snug text-[#FF9A3C]">
          {oneLineSummary}
        </p>
      ) : null}
      <div className="space-y-2.5">
        {sections.map((s, i) => (
          <SectionBlock key={`${s.title}-${i}`} section={s} />
        ))}
      </div>
    </div>
  );
}

export function LiteReportLoading({
  hint,
}: {
  hint?: string;
} = {}) {
  return (
    <GlassCard className="!py-8 text-center">
      <p className="text-sm text-white/55">분석 중이에요…</p>
      <p className="mt-1 text-xs text-white/40">
        {hint ?? "잠시만 기다려 주세요"}
      </p>
    </GlassCard>
  );
}

export function LiteReportError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <GlassCard className="space-y-3 !py-6 text-center">
      <p className="text-sm text-amber-200/90">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="text-sm text-[#67B7FF] underline-offset-2 hover:underline"
        >
          다시 시도
        </button>
      ) : null}
    </GlassCard>
  );
}
