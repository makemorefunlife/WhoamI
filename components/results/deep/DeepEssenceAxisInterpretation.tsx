"use client";

import { PRIMARY_AXIS_DEFINITIONS } from "@/lib/v2/framework/primaryAxisDefinitions";
import { DEEP_ESSENCE_RADAR_AXIS_ORDER } from "@/components/results/deep/DeepEssenceRadarChart";
import type {
  DeepEssenceAxisGapDeepDive,
  DeepEssenceAxisAlignmentHighlight,
} from "@/lib/report/deepEssenceStructuredSchema";
import type { DeepEssenceStructuredReport } from "@/lib/report/runDeepEssenceStructuredLlm";
import type { DeepEssenceUiStrings } from "@/components/results/deep/deepEssenceUiStrings";
import type { Locale } from "@/lib/i18n/locale";
import type { PrimaryAxisKey } from "@/lib/v2/survey/types";

const serifStyle = { fontFamily: "var(--font-stitch-serif)" } as const;

function axisLabel(axis: PrimaryAxisKey, locale: Locale): string {
  const def = PRIMARY_AXIS_DEFINITIONS[axis];
  return locale === "ko-KR" ? def.koLabel : def.label;
}

/** Exposed so the orchestrator can decide whether this Part renders at all. The static glossary alone (no personalized gap/alignment) is not enough to carry this Part's narrative goal. */
export function hasAxisInterpretationContent(
  axisInterpretations: DeepEssenceStructuredReport["axis_interpretations"],
): boolean {
  const gapCount = Object.keys(axisInterpretations?.gap_deep_dive ?? {}).length;
  const alignmentCount = Object.keys(axisInterpretations?.alignment_highlight ?? {}).length;
  return gapCount > 0 || alignmentCount > 0;
}

function Sub({ label, text }: { label: string; text: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-[13px] font-medium text-on-surface" style={serifStyle}>
        <span className="text-[10px] text-primary/60">▫</span>
        <span>{label}</span>
      </div>
      <p className="pl-4 text-[13.5px] leading-[1.65] text-on-surface-variant">{text}</p>
    </div>
  );
}

/**
 * IA Batch 1 — New Part 03 ("지금의 나와 본래의 나는 어디에서 달라졌을까요?").
 * Promoted from a fragment inside the old Part 01 into its own top-level
 * Part (see DeepEssenceReport.tsx). Same underlying data
 * (gap_deep_dive/alignment_highlight) — two UI changes only:
 *
 * 1. Each gap card used to be five equally-weighted, independently labeled
 *    `Field` blocks (read like a form). They now read as two connected
 *    movements — "the shift" (natural_tendency → current_pattern) and "the
 *    trade-off" (gives_you → may_cost [→ may_work_better]) — separated by a
 *    thin rule, so the five fields read as one adaptation-story fragment
 *    instead of five disconnected facts. No wording changed.
 * 2. The static glossary (never LLM-generated) is now a native
 *    <details>/<summary> disclosure instead of always-open — it's reference
 *    material, not narrative, and was competing with the gap/alignment
 *    narrative for attention at the top of the Part.
 *
 * alignment_highlight stays deliberately lighter than gap_deep_dive (fewer
 * fields, smaller vertical footprint) per the redesign's "already comes
 * easy, no need to dwell" framing.
 */
export function DeepEssenceAxisInterpretation({
  axisInterpretations,
  locale,
  t,
}: {
  axisInterpretations: DeepEssenceStructuredReport["axis_interpretations"];
  locale: Locale;
  t: DeepEssenceUiStrings["axisInterpretation"];
}) {
  if (!hasAxisInterpretationContent(axisInterpretations)) return null;

  const gapEntries = Object.entries(axisInterpretations?.gap_deep_dive ?? {}) as [
    PrimaryAxisKey,
    DeepEssenceAxisGapDeepDive,
  ][];
  const alignmentEntries = Object.entries(axisInterpretations?.alignment_highlight ?? {}) as [
    PrimaryAxisKey,
    DeepEssenceAxisAlignmentHighlight,
  ][];
  // Keep radar's visual order when there happen to be multiple entries.
  const orderIndex = (axis: PrimaryAxisKey) => DEEP_ESSENCE_RADAR_AXIS_ORDER.indexOf(axis);
  gapEntries.sort((a, b) => orderIndex(a[0]) - orderIndex(b[0]));
  const alignment = alignmentEntries[0];

  return (
    <div className="space-y-10">
      {/* Gap deep-dive — deterministically selected top 2-3 widest-gap axes */}
      {gapEntries.length > 0 ? (
        <div>
          <div className="border-b border-outline-variant pb-3">
            <h3 className="text-[18px] font-bold text-on-surface" style={serifStyle}>
              {t.gapSectionTitle}
            </h3>
            <p className="mt-1 text-[13px] leading-relaxed text-on-surface-variant">
              {locale === "ko-KR"
                ? "현재 살아가는 방식과 본래 성향의 차이가 가장 크게 드러난 영역이에요."
                : "These are the areas where your current way of living and underlying tendency differ most."}
            </p>
          </div>
          <div className="mt-6 space-y-8">
            {gapEntries.map(([axis, dive]) => (
              <div key={axis} className="border-t border-primary/30 pt-5">
                <div>
                  <h4 className="flex items-center gap-2 text-[17px] font-semibold text-primary sm:text-[18px]" style={serifStyle}>
                    <span className="text-[13px] text-primary/70">◤</span>
                    <span>{axisLabel(axis, locale)}</span>
                  </h4>
                  {t.glossary[axis] ? (
                    <p className="mt-1 text-[13px] text-on-surface-variant/90 leading-relaxed">
                      {t.glossary[axis]}
                    </p>
                  ) : null}
                </div>
                <div className="mt-4 space-y-4">
                  <Sub label={t.naturalTendencyLabel} text={dive.natural_tendency} />
                  <Sub label={t.currentPatternLabel} text={dive.current_pattern} />
                  <Sub label={t.givesYouLabel} text={dive.gives_you} />
                  <Sub label={t.mayCostLabel} text={dive.may_cost} />
                  {dive.may_work_better ? (
                    <Sub label={t.mayWorkBetterLabel} text={dive.may_work_better} />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Alignment highlight — the single best-aligned axis, deliberately lighter than the gap cards */}
      {alignment ? (
        <div>
          <div className="border-b border-outline-variant pb-3">
            <h3 className="text-[18px] font-bold text-on-surface" style={serifStyle}>
              {t.alignmentSectionTitle}
            </h3>
            <p className="mt-1 text-[13px] leading-relaxed text-on-surface-variant">
              {locale === "ko-KR"
                ? "따로 애쓰지 않아도 본래 성향대로 자연스럽게 합이 맞는 영역이에요."
                : "These are the areas where your natural tendency operates effortlessly without extra friction."}
            </p>
          </div>
          <div className="border-accent-emerald mt-5 border-t pt-5">
            <div>
              <h4 className="flex items-center gap-2 text-[16px] font-semibold text-accent-emerald" style={serifStyle}>
                <span className="text-[12px] text-accent-emerald/70">◤</span>
                <span>{axisLabel(alignment[0], locale)}</span>
              </h4>
              {t.glossary[alignment[0]] ? (
                <p className="mt-1 text-[12.5px] text-on-surface-variant/90 leading-relaxed">
                  {t.glossary[alignment[0]]}
                </p>
              ) : null}
            </div>
            <div className="mt-4 space-y-3.5">
              <Sub label={t.naturalTendencyLabel} text={alignment[1].natural_tendency} />
              <Sub label={t.currentPatternAlignedLabel ?? t.currentPatternLabel} text={alignment[1].current_pattern} />
              <Sub label={t.whyItFeelsEasyLabel} text={alignment[1].why_it_feels_easy} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
