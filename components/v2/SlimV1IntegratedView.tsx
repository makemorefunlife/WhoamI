"use client";

import GlassCard from "@/components/space/GlassCard";
import {
  LiteReportError,
  LiteReportLoading,
} from "@/components/v2/LiteReportView";
import type { EssenceDeepPreviewResponse } from "@/lib/v1/slim/types";

export default function SlimV1IntegratedView({
  data,
  loading,
  error,
  onRetry,
  onRegenerateFresh,
}: {
  data: EssenceDeepPreviewResponse | null;
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  onRegenerateFresh?: () => void;
}) {
  if (loading && !data) {
    return (
      <LiteReportLoading hint="리포트 생성 중… 보통 1~2분 걸려요. 창을 닫지 마세요." />
    );
  }
  if (error && !data) {
    return (
      <LiteReportError
        message={error}
        onRetry={onRegenerateFresh ?? onRetry}
      />
    );
  }
  if (!data) return null;

  const report = data.slim_v1.report;

  return (
    <div className="relative">
      {loading ? (
        <div className="absolute inset-0 z-10 flex items-start justify-center rounded-2xl bg-[rgba(8,12,24,0.72)] pt-16 backdrop-blur-[2px]">
          <LiteReportLoading hint="다시 생성 중… 1~2분 정도 걸릴 수 있어요." />
        </div>
      ) : null}

      <GlassCard className="!py-4">
        <div className="max-h-[70vh] overflow-y-auto px-1">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/82">
            {report}
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
