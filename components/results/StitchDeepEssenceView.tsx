"use client";

import { StitchReportError } from "@/components/results/deep/StitchReportStatus";
import { DeepEssenceReport } from "@/components/results/deep/DeepEssenceReport";
import type { EssenceDeepPreviewResponse } from "@/lib/v1/slim/types";
import { isDeepEssenceStructuredReport } from "@/lib/report/deepEssenceStructuredSchema";
import { useLocale } from "@/lib/i18n/LocaleProvider";

/**
 * essence/deep 페이지 본문. 로버블(Lovable) "Inner Compass" 디자인 이식 — Phase 3.
 *
 * - structured + radar_current가 모두 있으면 전체 리포트(Part 01~05 + 부록)를
 *   새 디자인으로 렌더링한다 (en-US · ko-KR 둘 다 지원).
 * - 구조화 생성이 실패했으면(폴백) 기존 산문 리포트(report)를 그대로 보여줘
 *   절대 깨지지 않게 한다.
 */
export default function StitchDeepEssenceView({
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
  const { locale, messages } = useLocale();

  if (loading && !data) {
    return (
      <div className="stitch-hero-panel rounded-extra-large px-6 py-12 text-center">
        <p className="text-sm text-on-surface-variant">
          {messages.blueprint.generatingReportNotice}
        </p>
        <p className="mt-1 text-xs text-on-surface-variant/80">
          {messages.blueprint.dontCloseWindow}
        </p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <StitchReportError
        message={error}
        onRetry={onRegenerateFresh ?? onRetry}
        retryLabel={messages.report.chrome.retry}
      />
    );
  }

  if (!data) return null;

  const report = data.slim_v1.report;
  const { structured, radar_current } = data.slim_v1;
  // 캐시·API 어느 경로로 오든, 스키마가 안 맞는 structured는 여기서 한 번 더 걸러
  // DeepEssenceReport가 undefined 필드에 접근해 죽는 일이 없게 한다.
  const hasStructuredReport =
    Boolean(radar_current) && isDeepEssenceStructuredReport(structured);

  return (
    <div className="relative">
      {loading ? (
        <div className="absolute inset-0 z-10 flex items-start justify-center rounded-extra-large bg-[#faf7f0]/80 pt-16 backdrop-blur-[2px]">
          <p className="text-sm text-on-surface-variant">
            {messages.blueprint.regeneratingOverlay}
          </p>
        </div>
      ) : null}

      <div className="stitch-hero-panel rounded-extra-large p-5 sm:p-6">
        <div className="max-h-[70vh] overflow-y-auto">
          {hasStructuredReport && structured && radar_current ? (
            <DeepEssenceReport
              structured={structured}
              radarCurrent={radar_current}
              locale={locale}
            />
          ) : (
            <p className="text-on-surface whitespace-pre-wrap text-sm leading-relaxed">
              {report}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
