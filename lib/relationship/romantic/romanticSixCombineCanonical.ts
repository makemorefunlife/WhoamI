/**
 * Romantic cross-chart 지지 육합(branch six-combine) canonical → client projection.
 *
 * Chain:
 *   analyzeCrossChartRelations(pairChartAnalysis.ts) — full 4×4 pillar pairs,
 *   already computed as pairAnalysis.allCrossHits (zero new Saju calc here)
 *   → RomanticDynamicsTypedSnapshot.crossChartHits (type: "육합")
 *   → sixCombineValueFromDynamicsSnapshot(snapshot)
 *   → buildRomanticSixCombineCanonical(finalized)
 *   → buildRomanticSixCombineClientProjection(value)
 *   → injectRomanticSixCombineClientProjection(report, projection)
 *
 * Bypasses dominant_categories (frozen-digest-adjacent — see decision 027).
 * Saju-only — psychMode always "none".
 */
import type { CanonicalJudgment } from "@/lib/relationship/contextEngine/canonicalJudgment";
import type { CrossChartHit } from "@/lib/saju/pairChartAnalysis";
import {
  asCrossChartHitArray,
  cloneCrossChartHitArray,
} from "./romanticCrossChartHitParsing";

export const ROMANTIC_SIX_COMBINE_CANONICAL_SOURCE =
  "collectRomanticDynamicsTypedSnapshot" as const;

export const ROMANTIC_SIX_COMBINE_PERSISTENCE_PATH =
  "romantic_context_input.dynamics_typed_snapshot" as const;

export const ROMANTIC_SIX_COMBINE_CLIENT_PATH =
  "canonical_projections.cross_chart_six_combine" as const;

export const ROMANTIC_SIX_COMBINE_PSYCH_MODE = "none" as const;

export type RomanticSixCombineValue = {
  hits: CrossChartHit[];
  hitCount: number;
};

export type RomanticSixCombineCanonical =
  CanonicalJudgment<RomanticSixCombineValue>;

function cloneValue(v: RomanticSixCombineValue): RomanticSixCombineValue {
  return { hits: cloneCrossChartHitArray(v.hits), hitCount: v.hitCount };
}

export function sixCombineValueFromDynamicsSnapshot(
  snapshot: { crossChartHits: CrossChartHit[] } | null | undefined,
): RomanticSixCombineValue | null {
  if (!snapshot) return null;
  const hits = snapshot.crossChartHits.filter((h) => h.type === "육합");
  if (hits.length === 0) return null;
  return { hits, hitCount: hits.length };
}

export function buildRomanticSixCombineCanonical(
  finalized: RomanticSixCombineValue | null | undefined,
): RomanticSixCombineCanonical | null {
  if (!finalized) return null;
  return {
    value: cloneValue(finalized),
    source: ROMANTIC_SIX_COMBINE_CANONICAL_SOURCE,
    psychMode: ROMANTIC_SIX_COMBINE_PSYCH_MODE,
    persistencePath: ROMANTIC_SIX_COMBINE_PERSISTENCE_PATH,
  };
}

export function buildRomanticSixCombineClientProjection(
  value: RomanticSixCombineValue | null | undefined,
): RomanticSixCombineValue | null {
  if (!value) return null;
  return cloneValue(value);
}

type ReportWithCanonicalProjections = {
  canonical_projections?: {
    cross_chart_six_combine?: unknown;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export function injectRomanticSixCombineClientProjection<
  T extends ReportWithCanonicalProjections,
>(
  report: T,
  projection: RomanticSixCombineValue | null | undefined,
): T {
  const { canonical_projections: priorProjections, ...rest } = report;
  const priorRest =
    priorProjections && typeof priorProjections === "object"
      ? Object.fromEntries(
          Object.entries(priorProjections).filter(
            ([k]) => k !== "cross_chart_six_combine",
          ),
        )
      : {};

  if (!projection) {
    if (Object.keys(priorRest).length === 0) {
      return rest as T;
    }
    return { ...(rest as T), canonical_projections: priorRest };
  }

  return {
    ...(rest as T),
    canonical_projections: {
      ...priorRest,
      cross_chart_six_combine: cloneValue(projection),
    },
  };
}

export function readRomanticSixCombineCanonicalProjection(
  report:
    | { canonical_projections?: { cross_chart_six_combine?: unknown } }
    | null
    | undefined,
): RomanticSixCombineValue | null {
  const raw = report?.canonical_projections?.cross_chart_six_combine;
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const hits = asCrossChartHitArray(o.hits);
  if (hits.length === 0) return null;
  const hitCount = typeof o.hitCount === "number" ? o.hitCount : hits.length;
  return { hits, hitCount };
}
