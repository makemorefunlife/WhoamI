"use client";

import { StitchReportError } from "@/components/results/deep/StitchReportStatus";
import { DeepEssenceReport } from "@/components/results/deep/DeepEssenceReport";
import AiAnalysisDisclaimer from "@/components/legal/AiAnalysisDisclaimer";
import type { EssenceDeepPreviewResponse } from "@/lib/v1/slim/types";
import { isDeepEssenceStructuredReport } from "@/lib/report/deepEssenceStructuredSchema";
import { useLocale } from "@/lib/i18n/LocaleProvider";

/**
 * essence/deep 페이지 본문. 로버블(Lovable) "Inner Compass" 디자인 이식 — Phase 3.
 *
 * - 유효한 structured가 있으면 Part 01~05 디자인을 렌더한다.
 * - radar_current가 없어도 structured.radar_potential으로 레이더를 유지한다.
 * - structured가 없을 때만 산문 폴백 + 재생성 CTA (톤 폴리시로 UI가 꺼지지 않게
 *   서버는 polishDeepEssenceStructuredReport로 스키마를 보호한다).
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
  // radar_current가 비어도 structured.radar_potential으로 레이더를 그린다
  // (설문 축이 잠시 빠진 캐시에서도 Inner Compass UI가 유지되게).
  const validStructured = isDeepEssenceStructuredReport(structured)
    ? structured
    : null;
  const radarForUi =
    radar_current ?? validStructured?.radar_potential ?? null;
  const hasStructuredReport = Boolean(validStructured && radarForUi);
  const reportLooksLikeJsonDump = (() => {
    const t = report.trim();
    return t.startsWith("```") || t.startsWith("{") || t.startsWith("[");
  })();

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
          {hasStructuredReport && validStructured && radarForUi ? (
            <DeepEssenceReport
              structured={validStructured}
              radarCurrent={radarForUi}
              locale={locale}
            />
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-accent-rose/25 bg-accent-rose-soft/40 px-4 py-3 text-sm text-on-surface">
                <p className="font-medium text-primary">
                  {messages.blueprint.structuredDesignFallbackTitle}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
                  {messages.blueprint.structuredDesignFallbackBody}
                </p>
                {onRegenerateFresh || onRetry ? (
                  <button
                    type="button"
                    onClick={() => void (onRegenerateFresh ?? onRetry)?.()}
                    className="stitch-cta-primary mt-3 !min-w-0 !px-5 !py-2.5 !text-sm"
                  >
                    {messages.blueprint.regenerate}
                  </button>
                ) : null}
              </div>
              {reportLooksLikeJsonDump ? null : (
                <p className="text-on-surface whitespace-pre-wrap text-sm leading-relaxed">
                  {report}
                </p>
              )}
            </div>
          )}
          <AiAnalysisDisclaimer className="mt-8 border-t border-outline-variant/20 pt-4" />
        </div>
      </div>
    </div>
  );
}
