/**
 * Batch 1 — deterministic Current × Innate Primary-6 comparison layer.
 *
 * SSOT reuse only:
 * - Current Primary 6 / Secondary 11: scoreSurveyAnswers() output (lib/v2/survey/scorer.ts)
 * - Innate Primary 6: calculateEssenceSelfLite() output (lib/v2/saju/essenceLite.ts)
 * - delta / tone: buildGapRows / gapDeltaTone (lib/v2/analysis/gap.ts) — reused as-is
 *
 * This module does not compute any new saju facts or psych scores — it only
 * combines scores that are already produced elsewhere. Callers pass in the
 * already-computed profiles; this file has no knowledge of how they were built.
 */
import {
  type PrimaryAxisKey,
  type PrimaryAxesScores,
  type SecondaryAxisKey,
  type SecondaryAxesScores,
} from "@/lib/v2/survey/types";
import { PRIMARY_AXIS_DEFINITIONS } from "@/lib/v2/framework/primaryAxisDefinitions";
import { PRIMARY_TO_SECONDARY_AXIS_KEYS } from "@/lib/v2/framework/primarySecondaryAxisMap";
import { buildGapRows, gapDeltaTone } from "@/lib/v2/analysis/gap";

export type AxisDirection = "current_higher" | "innate_higher" | "aligned";

/**
 * Reused directly from gap.ts's gapDeltaTone — intentionally NOT a new
 * 3-tier "strong_alignment / mild_gap / wide_gap" scheme. gapDeltaTone is
 * the existing SSOT threshold (absDelta <= 10 → "neutral", else "wide") and
 * introducing a second, competing threshold here would violate the
 * single-source-of-truth rule for this batch. If finer granularity is ever
 * needed, it belongs as a change to gapDeltaTone itself, not a parallel
 * scheme in this file.
 */
export type AxisMagnitude = ReturnType<typeof gapDeltaTone>;

export type AxisConfidence = "high" | "medium" | "low" | "insufficient";

export type AxisSecondaryEvidence = {
  axis: SecondaryAxisKey;
  score: number;
};

export type AxisComparison = {
  axis: PrimaryAxisKey;
  human_meaning: string;
  current: {
    score: number;
    secondaryEvidence: AxisSecondaryEvidence[];
  };
  innate: {
    score: number;
  };
  /** current - essence, same sign convention as GapAxisRow.delta. Raw truth — never re-derive from magnitude. */
  delta: number;
  direction: AxisDirection;
  magnitude: AxisMagnitude;
  /**
   * Not populated in Batch 1. Personal CE evidence (confidence/mixed-signal
   * provenance) isn't wired into this layer yet, and a confidence value
   * fabricated from score delta alone would not be grounded in any real
   * evidence source. Left undefined on purpose — Batch 2 fills this in once
   * CE dimension confidence is available.
   */
  confidence?: AxisConfidence;
};

function resolveDirection(delta: number): AxisDirection {
  if (delta > 0) return "current_higher";
  if (delta < 0) return "innate_higher";
  return "aligned";
}

function buildSecondaryEvidence(
  axis: PrimaryAxisKey,
  secondaryAxes: SecondaryAxesScores,
): AxisSecondaryEvidence[] {
  const keys = PRIMARY_TO_SECONDARY_AXIS_KEYS[axis];
  if (!keys) return [];
  return keys.map((key) => ({ axis: key, score: secondaryAxes[key] }));
}

/**
 * Deterministic Current × Innate comparison for all Primary 6 axes.
 * Pure combination of already-computed scores — does not call the survey
 * scorer or essenceLite itself, so callers keep full control over how those
 * profiles were produced (session, cache, fixture, etc.).
 */
export function buildAxisComparisons(
  currentPrimary: PrimaryAxesScores,
  currentSecondary: SecondaryAxesScores,
  innatePrimary: PrimaryAxesScores,
): AxisComparison[] {
  const gapRows = buildGapRows(currentPrimary, innatePrimary);

  return gapRows.map((row) => ({
    axis: row.axis,
    human_meaning: PRIMARY_AXIS_DEFINITIONS[row.axis].description,
    current: {
      score: row.current,
      secondaryEvidence: buildSecondaryEvidence(row.axis, currentSecondary),
    },
    innate: {
      score: row.essence,
    },
    delta: row.delta,
    direction: resolveDirection(row.delta),
    magnitude: gapDeltaTone(row.absDelta),
  }));
}

export type AxisHighlightSelection = {
  /** Top 2-3 widest-gap axes (magnitude === "wide" only), sorted by |delta| descending. May be shorter than 3, or empty — never padded. */
  gaps: AxisComparison[];
  /** The single closest-aligned axis (smallest |delta|). Null only when axisComparisons is empty. */
  alignment: AxisComparison | null;
};

/**
 * Batch 8 — deterministic selection of which axes deserve deep-dive
 * interpretation. LLM never decides which axes are "notable"; this is pure
 * ranking over the already-computed delta/magnitude. Reuses the existing
 * gapDeltaTone "wide" threshold as-is — introduces no new/parallel scheme,
 * and never forces a gap count when fewer than 3 axes genuinely qualify.
 */
export function selectAxisHighlights(
  axisComparisons: AxisComparison[],
): AxisHighlightSelection {
  const gaps = axisComparisons
    .filter((a) => a.magnitude === "wide")
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 3);

  const sortedByCloseness = [...axisComparisons].sort(
    (a, b) => Math.abs(a.delta) - Math.abs(b.delta),
  );
  const closest = sortedByCloseness[0] ?? null;
  // Defensive only: in a degenerate all-equal-delta case, don't show the
  // same axis as both a "gap" and "the alignment" highlight.
  const alignment =
    closest && gaps.some((g) => g.axis === closest.axis) ? null : closest;

  return { gaps, alignment };
}
