"use client";

import GlowButton from "@/components/space/GlowButton";
import type { PremiumPipelineFailure } from "@/lib/report/premiumPipelineFailure";
import { getPremiumFailureMessage } from "@/lib/report/premiumPipelineFailure";

export default function PremiumReportErrorPanel({
  failure,
  onRetry,
  onRegenerate,
  showRegenerate,
}: {
  failure: PremiumPipelineFailure | null;
  onRetry: () => void;
  onRegenerate?: () => void;
  showRegenerate?: boolean;
}) {
  return (
    <div className="space-y-4 p-5 text-center">
      <p className="text-sm leading-relaxed text-[var(--space-text-muted)]">
        {getPremiumFailureMessage(failure)}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <GlowButton
          type="button"
          variant="secondary"
          className="w-full sm:min-w-[9rem]"
          onClick={onRetry}
        >
          다시 시도
        </GlowButton>
        {showRegenerate && onRegenerate ? (
          <GlowButton
            type="button"
            variant="ghost"
            className="w-full sm:min-w-[9rem]"
            onClick={onRegenerate}
          >
            심화 리포트 다시 생성
          </GlowButton>
        ) : null}
      </div>
    </div>
  );
}
