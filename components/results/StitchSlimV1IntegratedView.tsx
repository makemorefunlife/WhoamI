"use client";

import {
  LiteReportError,
} from "@/components/v2/LiteReportView";
import type { EssenceDeepPreviewResponse } from "@/lib/v1/slim/types";

export default function StitchSlimV1IntegratedView({
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
      <div className="stitch-hero-panel rounded-extra-large px-6 py-12 text-center">
        <p className="text-sm text-on-surface-variant">
          리포트 생성 중… 보통 1~2분 걸려요.
        </p>
        <p className="mt-1 text-xs text-on-surface-variant/80">
          창을 닫지 마세요.
        </p>
      </div>
    );
  }

  if (error && !data) {
    return <LiteReportError message={error} onRetry={onRegenerateFresh ?? onRetry} />;
  }

  if (!data) return null;

  const report = data.slim_v1.report;

  return (
    <div className="relative">
      {loading ? (
        <div className="absolute inset-0 z-10 flex items-start justify-center rounded-extra-large bg-[#faf7f0]/80 pt-16 backdrop-blur-[2px]">
          <p className="text-sm text-on-surface-variant">다시 생성 중…</p>
        </div>
      ) : null}

      <div className="stitch-hero-panel rounded-extra-large p-5 sm:p-6">
        <div className="max-h-[70vh] overflow-y-auto">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-on-surface">
            {report}
          </p>
        </div>
      </div>
    </div>
  );
}
