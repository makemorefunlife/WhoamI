"use client";

import { DeepEssenceRadarChart } from "@/components/results/deep/DeepEssenceRadarChart";
import type { DeepEssenceStructuredReport } from "@/lib/report/runDeepEssenceStructuredLlm";
import type { PrimaryAxesScores } from "@/lib/v2/survey/types";
import type { Locale } from "@/lib/i18n/locale";
import type { DeepEssenceUiStrings } from "@/components/results/deep/deepEssenceUiStrings";

const serifStyle = { fontFamily: "var(--font-stitch-serif)" } as const;

/**
 * 로버블 "Inner Compass" 디자인의 Part 01(요약 · 레이더 · 강점 · 주의점) 이식.
 * 기존 stitch 디자인 토큰(--color-primary, --color-accent-rose, --color-surface 등)을
 * 그대로 재사용해 사이트 전체 톤과 어긋나지 않게 했다. 헤더는 상위(DeepEssenceReport)의
 * ToggleSection이 담당하고, 이 컴포넌트는 본문(요약 그리드·레이더·강점·주의점)만 그린다.
 */
export function DeepEssencePartOne({
  structured,
  radarCurrent,
  locale,
  t,
}: {
  structured: DeepEssenceStructuredReport;
  radarCurrent: PrimaryAxesScores;
  locale: Locale;
  t: DeepEssenceUiStrings;
}) {
  const { summary, radar_potential, strengths, watchouts } = structured;

  return (
    <div className="space-y-12">
      {/* 요약 3개 지표 */}
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-outline-variant bg-outline-variant sm:grid-cols-3">
        {[
          { label: t.summaryLabels.coreMode, value: summary.core_mode },
          { label: t.summaryLabels.energyBalance, value: summary.energy_balance },
          { label: t.summaryLabels.growthEdge, value: summary.growth_edge },
        ].map((item) => (
          <div key={item.label} className="bg-surface px-4 py-5">
            <div className="text-[10px] tracking-[0.18em] text-on-surface-variant uppercase">
              {item.label}
            </div>
            <div
              className="mt-2 text-[17px] leading-tight text-on-surface"
              style={serifStyle}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* 레이더 차트 */}
      <div>
        <div className="text-center text-[10.5px] tracking-[0.18em] text-on-surface-variant uppercase">
          {t.radar.caption}
        </div>
        <div className="mt-6">
          <DeepEssenceRadarChart
            current={radarCurrent}
            potential={radar_potential}
            locale={locale}
            currentLabel={t.radar.current}
            potentialLabel={t.radar.potential}
          />
        </div>
      </div>

      {/* 강점 3가지 */}
      <div>
        <div className="flex items-baseline justify-between gap-4 border-b border-outline-variant pb-3">
          <h3 className="text-[18px] text-on-surface" style={serifStyle}>
            {t.part1.strengthsTitle}
          </h3>
          <span className="shrink-0 text-[10px] tracking-[0.2em] text-primary uppercase">
            {t.part1.strengthsTag}
          </span>
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {strengths.map((s, i) => (
            <div key={s.title} className="border-t border-primary pt-4">
              <div className="text-[10.5px] tracking-[0.2em] text-primary tabular-nums">
                0{i + 1}
              </div>
              <h4 className="mt-3 text-[18px] text-on-surface" style={serifStyle}>
                {s.title}
              </h4>
              <p className="mt-2 text-[13.5px] leading-[1.65] text-on-surface-variant">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 주의점 3가지 */}
      <div>
        <div className="flex items-baseline justify-between gap-4 border-b border-outline-variant pb-3">
          <h3 className="text-[18px] text-on-surface" style={serifStyle}>
            {t.part1.watchoutsTitle}
          </h3>
          <span className="text-accent-rose shrink-0 text-[10px] tracking-[0.2em] uppercase">
            {t.part1.watchoutsTag}
          </span>
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {watchouts.map((w, i) => (
            <div key={w.title} className="border-accent-rose border-t pt-4">
              <div className="text-accent-rose text-[10.5px] tracking-[0.2em] tabular-nums">
                0{i + 1}
              </div>
              <h4 className="mt-3 text-[18px] text-on-surface" style={serifStyle}>
                {w.title}
              </h4>
              <p className="mt-2 text-[13.5px] leading-[1.65] text-on-surface-variant">
                {w.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
