"use client";

import { DeepEssenceRadarChart, DEEP_ESSENCE_RADAR_AXIS_ORDER } from "@/components/results/deep/DeepEssenceRadarChart";
import { PRIMARY_AXIS_DEFINITIONS } from "@/lib/v2/framework/primaryAxisDefinitions";
import type { DeepEssenceStructuredReport } from "@/lib/report/runDeepEssenceStructuredLlm";
import type { PrimaryAxesScores, PrimaryAxisKey } from "@/lib/v2/survey/types";
import type { Locale } from "@/lib/i18n/locale";
import type { DeepEssenceUiStrings } from "@/components/results/deep/deepEssenceUiStrings";

const serifStyle = { fontFamily: "var(--font-stitch-serif)" } as const;

/** Purely deterministic — reads radarCurrent's own max/min, no LLM involved. */
function findExtremeAxes(scores: PrimaryAxesScores): {
  highest: PrimaryAxisKey;
  lowest: PrimaryAxisKey;
} {
  const entries = Object.entries(scores) as [PrimaryAxisKey, number][];
  let highest = entries[0]!;
  let lowest = entries[0]!;
  for (const entry of entries) {
    if (entry[1] > highest[1]) highest = entry;
    if (entry[1] < lowest[1]) lowest = entry;
  }
  return { highest: highest[0], lowest: lowest[0] };
}

function axisLabel(axis: PrimaryAxisKey, locale: Locale): string {
  const def = PRIMARY_AXIS_DEFINITIONS[axis];
  return locale === "ko-KR" ? def.koLabel : def.label;
}

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
  const { summary, radar_potential } = structured;
  const { highest, lowest } = findExtremeAxes(radarCurrent);

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

      {/* 주요 성향 경향성 — 결정론적 최고/최저 점수 축의 실제 행동 문장 번역 */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-outline-variant/60 bg-surface/50 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
              {axisLabel(highest, locale)}
            </span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              {t.part1.highestTag}
            </span>
          </div>
          <p className="mt-2 text-[14.5px] font-medium leading-snug text-on-surface" style={serifStyle}>
            {t.axisBehaviorSentences[highest]?.high}
          </p>
        </div>
        <div className="rounded-xl border border-outline-variant/60 bg-surface/50 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
              {axisLabel(lowest, locale)}
            </span>
            <span className="rounded-full bg-outline-variant/40 px-2 py-0.5 text-[10px] font-medium text-on-surface-variant">
              {t.part1.lowestTag}
            </span>
          </div>
          <p className="mt-2 text-[14.5px] font-medium leading-snug text-on-surface-variant" style={serifStyle}>
            {t.axisBehaviorSentences[lowest]?.low}
          </p>
        </div>
      </div>

      {/* 여섯 가지 기준은 무엇을 의미하나요? 설명 아코디언 */}
      <details className="group rounded-xl border border-outline-variant/60 bg-surface/50 p-4 transition-colors">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-on-surface">
          <h3 className="text-[14.5px] text-on-surface" style={serifStyle}>
            {t.axisInterpretation.glossaryTitle}
          </h3>
          <span className="shrink-0 text-[11.5px] font-medium text-primary group-open:hidden">
            {locale === "ko-KR" ? "열어보기 ↓" : "Expand ↓"}
          </span>
          <span className="hidden shrink-0 text-[11.5px] font-medium text-primary group-open:inline">
            {locale === "ko-KR" ? "접기 ↑" : "Collapse ↑"}
          </span>
        </summary>
        <div className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {DEEP_ESSENCE_RADAR_AXIS_ORDER.map((axis) => (
            <div key={axis}>
              <div className="text-[12.5px] font-medium text-on-surface" style={serifStyle}>
                {axisLabel(axis, locale)}
              </div>
              <p className="mt-0.5 text-[11.5px] leading-[1.5] text-on-surface-variant">
                {t.axisInterpretation.glossary[axis]}
              </p>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
