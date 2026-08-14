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

function Field({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <div className="text-[9.5px] tracking-[0.16em] text-on-surface-variant uppercase">
        {label}
      </div>
      <p className="mt-1 text-[13px] leading-[1.6] text-on-surface">{text}</p>
    </div>
  );
}

function axisLabel(axis: PrimaryAxisKey, locale: Locale): string {
  const def = PRIMARY_AXIS_DEFINITIONS[axis];
  return locale === "ko-KR" ? def.koLabel : def.label;
}

/**
 * Batch 8 — replaces Batch 7's "all 6 axes, same shallow depth" reading
 * with 3 pieces, placed directly under the radar: (1) a compact static
 * glossary for all 6 axes — never LLM text, spectrum-framed, no "high
 * score = good", always shown regardless of grounding — (2) deep-dive
 * cards for the deterministically-selected (never LLM-chosen) top 2-3
 * widest-gap axes, and (3) one card for the single best-aligned axis.
 * Sections 2/3 independently omit themselves when their data is missing
 * (e.g. no packet, or the LLM's response was malformed) — the glossary
 * alone still renders, since it needs no grounding at all. evidence_refs
 * and raw saju/CE terms never reach this component.
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
      {/* Compact glossary — static, all 6 axes, never LLM-generated */}
      <div>
        <div className="flex items-baseline justify-between gap-4 border-b border-outline-variant pb-3">
          <h3 className="text-[18px] text-on-surface" style={serifStyle}>
            {t.glossaryTitle}
          </h3>
          <span className="shrink-0 text-[10px] tracking-[0.2em] text-primary uppercase">
            {t.glossaryTag}
          </span>
        </div>
        <div className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {DEEP_ESSENCE_RADAR_AXIS_ORDER.map((axis) => (
            <div key={axis}>
              <div className="text-[12.5px] text-on-surface" style={serifStyle}>
                {axisLabel(axis, locale)}
              </div>
              <p className="mt-0.5 text-[11.5px] leading-[1.5] text-on-surface-variant">
                {t.glossary[axis]}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Gap deep-dive — deterministically selected top 2-3 widest-gap axes */}
      {gapEntries.length > 0 ? (
        <div>
          <div className="flex items-baseline justify-between gap-4 border-b border-outline-variant pb-3">
            <h3 className="text-[18px] text-on-surface" style={serifStyle}>
              {t.gapSectionTitle}
            </h3>
            <span className="shrink-0 text-[10px] tracking-[0.2em] text-primary uppercase">
              {t.gapSectionTag}
            </span>
          </div>
          <div className="mt-6 space-y-6">
            {gapEntries.map(([axis, dive]) => (
              <div key={axis} className="border-t border-primary pt-4">
                <h4 className="text-[15px] text-on-surface" style={serifStyle}>
                  {axisLabel(axis, locale)}
                </h4>
                <div className="mt-3 space-y-3">
                  <Field label={t.naturalTendencyLabel} text={dive.natural_tendency} />
                  <Field label={t.currentPatternLabel} text={dive.current_pattern} />
                  <Field label={t.givesYouLabel} text={dive.gives_you} />
                  <Field label={t.mayCostLabel} text={dive.may_cost} />
                  {dive.may_work_better ? (
                    <Field label={t.mayWorkBetterLabel} text={dive.may_work_better} />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Alignment highlight — the single best-aligned axis */}
      {alignment ? (
        <div>
          <div className="flex items-baseline justify-between gap-4 border-b border-outline-variant pb-3">
            <h3 className="text-[18px] text-on-surface" style={serifStyle}>
              {t.alignmentSectionTitle}
            </h3>
            <span className="text-accent-emerald shrink-0 text-[10px] tracking-[0.2em] uppercase">
              {t.alignmentSectionTag}
            </span>
          </div>
          <div className="border-accent-emerald mt-6 border-t pt-4">
            <h4 className="text-[15px] text-on-surface" style={serifStyle}>
              {axisLabel(alignment[0], locale)}
            </h4>
            <div className="mt-3 space-y-3">
              <Field label={t.naturalTendencyLabel} text={alignment[1].natural_tendency} />
              <Field label={t.currentPatternLabel} text={alignment[1].current_pattern} />
              <Field label={t.whyItFeelsEasyLabel} text={alignment[1].why_it_feels_easy} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
