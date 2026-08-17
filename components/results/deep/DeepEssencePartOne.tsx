"use client";

import { DeepEssenceRadarChart } from "@/components/results/deep/DeepEssenceRadarChart";
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

/**
 * IA Batch 1 — New Part 01 ("지금, 당신은 이렇게 살아가고 있어요" / Current Self).
 * Narrowed from the original Part 01 (which also carried axis_interpretations,
 * layered_identity, strengths, and watchouts — all now their own Parts, see
 * DeepEssenceReport.tsx). This component now shows only: the summary tiles,
 * the current-vs-potential radar, and a deterministic "most/least used axis"
 * read straight off radarCurrent (no LLM call, no new field).
 *
 * summary.core_mode is intentionally NOT treated as this Part's headline —
 * its own evidence pool leans innate (day master, elements, month/day pillar
 * candidates; see lib/v1/slim/part01IdentityEvidence.ts's buildCoreModeEvidence),
 * so presenting it as "who you are right now" would misrepresent its grounding.
 * The summary tiles are kept as-is (existing data, unchanged position) without
 * being reframed as a Current Self statement.
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

      {/* 지금 가장 많이/덜 쓰는 축 — radarCurrent에서 결정론적으로 계산, LLM 미개입 */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <div className="text-[10px] tracking-[0.18em] text-on-surface-variant uppercase">
            {t.part1.mostUsedAxisLabel}
          </div>
          <div className="mt-2 text-[17px] text-on-surface" style={serifStyle}>
            {axisLabel(highest, locale)}
          </div>
        </div>
        <div>
          <div className="text-[10px] tracking-[0.18em] text-on-surface-variant uppercase">
            {t.part1.leastUsedAxisLabel}
          </div>
          <div className="mt-2 text-[17px] text-on-surface" style={serifStyle}>
            {axisLabel(lowest, locale)}
          </div>
        </div>
      </div>
    </div>
  );
}
