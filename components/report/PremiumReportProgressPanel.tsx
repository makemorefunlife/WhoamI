"use client";

import type { PremiumProgressStage } from "@/lib/report/premiumPipelineConfig";
import { PREMIUM_PROGRESS_LABELS } from "@/lib/report/premiumPipelineConfig";

export default function PremiumReportProgressPanel({
  stage,
  streaming,
  streamedChars,
}: {
  stage: PremiumProgressStage | null;
  streaming?: boolean;
  streamedChars?: number;
}) {
  const label = stage ? PREMIUM_PROGRESS_LABELS[stage] : "심화 리포트를 준비하는 중…";

  return (
    <div
      className="flex min-h-[200px] flex-col items-center justify-center gap-4 py-10"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className="h-9 w-9 animate-spin rounded-full border-2 border-[#D6B46A]/35 border-t-[#F0D797]"
        aria-hidden
      />
      <div className="max-w-sm space-y-1.5 text-center">
        <p className="text-sm font-medium text-[var(--space-text)]">{label}</p>
        {streaming && streamedChars != null && streamedChars > 0 ? (
          <p className="text-xs text-[var(--space-text-muted)]">
            {streamedChars.toLocaleString()}자 수신 중…
          </p>
        ) : (
          <p className="text-xs text-[var(--space-text-muted)]">
            완료까지 1~3분 걸릴 수 있어요
          </p>
        )}
      </div>
    </div>
  );
}
