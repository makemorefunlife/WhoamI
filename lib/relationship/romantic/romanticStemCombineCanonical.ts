/**
 * Romantic cross-chart 천간합(stem combine) canonical → client projection.
 *
 * Chain:
 *   analyzeCrossChartStemCombines(pairChartAnalysis.ts) — full 4×4 pillar pairs
 *   → RomanticDynamicsTypedSnapshot.crossChartHits (category: "stem_combine")
 *   → stemCombineValueFromDynamicsSnapshot(snapshot)
 *   → buildRomanticStemCombineCanonical(finalized)
 *   → buildRomanticStemCombineClientProjection(value)
 *   → injectRomanticStemCombineClientProjection(report, projection)
 *
 * Bypasses dominant_categories (which cannot carry hit arrays and feeds the
 * frozen LLM digest — see decision 027). Saju-only — psychMode always "none".
 * Never enters PairSajuAnalysis.allCrossHits / romanticRules/* legacy digest.
 */
import type { CanonicalJudgment } from "@/lib/relationship/contextEngine/canonicalJudgment";
import type { CrossChartHit } from "@/lib/saju/pairChartAnalysis";
import {
  asCrossChartHitArray,
  cloneCrossChartHitArray,
} from "./romanticCrossChartHitParsing";

export const ROMANTIC_STEM_COMBINE_CANONICAL_SOURCE =
  "collectRomanticDynamicsTypedSnapshot" as const;

export const ROMANTIC_STEM_COMBINE_PERSISTENCE_PATH =
  "romantic_context_input.dynamics_typed_snapshot" as const;

export const ROMANTIC_STEM_COMBINE_CLIENT_PATH =
  "canonical_projections.cross_chart_stem_combine" as const;

export const ROMANTIC_STEM_COMBINE_PSYCH_MODE = "none" as const;

export type RomanticStemCombineValue = {
  hits: CrossChartHit[];
  hitCount: number;
  /** rule.description of the highest-weightedPriority hit, e.g. "정임합목" */
  dominantCombineName: string | null;
};

export type RomanticStemCombineCanonical =
  CanonicalJudgment<RomanticStemCombineValue>;

function cloneValue(v: RomanticStemCombineValue): RomanticStemCombineValue {
  return {
    hits: cloneCrossChartHitArray(v.hits),
    hitCount: v.hitCount,
    dominantCombineName: v.dominantCombineName,
  };
}

/** Extract 천간합 hits from the already-merged, already-sorted snapshot list. */
export function stemCombineValueFromDynamicsSnapshot(
  snapshot: { crossChartHits: CrossChartHit[] } | null | undefined,
): RomanticStemCombineValue | null {
  if (!snapshot) return null;
  const hits = snapshot.crossChartHits.filter((h) => h.category === "stem_combine");
  if (hits.length === 0) return null;
  return {
    hits,
    hitCount: hits.length,
    dominantCombineName: hits[0]?.detail ?? null,
  };
}

/** Wrap an already-finalized stem-combine judgment. Does not call resolvers. */
export function buildRomanticStemCombineCanonical(
  finalized: RomanticStemCombineValue | null | undefined,
): RomanticStemCombineCanonical | null {
  if (!finalized) return null;
  return {
    value: cloneValue(finalized),
    source: ROMANTIC_STEM_COMBINE_CANONICAL_SOURCE,
    psychMode: ROMANTIC_STEM_COMBINE_PSYCH_MODE,
    persistencePath: ROMANTIC_STEM_COMBINE_PERSISTENCE_PATH,
  };
}

export function buildRomanticStemCombineClientProjection(
  value: RomanticStemCombineValue | null | undefined,
): RomanticStemCombineValue | null {
  if (!value) return null;
  return cloneValue(value);
}

type ReportWithCanonicalProjections = {
  canonical_projections?: {
    cross_chart_stem_combine?: unknown;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export function injectRomanticStemCombineClientProjection<
  T extends ReportWithCanonicalProjections,
>(
  report: T,
  projection: RomanticStemCombineValue | null | undefined,
): T {
  const { canonical_projections: priorProjections, ...rest } = report;
  const priorRest =
    priorProjections && typeof priorProjections === "object"
      ? Object.fromEntries(
          Object.entries(priorProjections).filter(
            ([k]) => k !== "cross_chart_stem_combine",
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
      cross_chart_stem_combine: cloneValue(projection),
    },
  };
}

/** Parse client projection; malformed hits are dropped, never invented. */
export function readRomanticStemCombineCanonicalProjection(
  report:
    | { canonical_projections?: { cross_chart_stem_combine?: unknown } }
    | null
    | undefined,
): RomanticStemCombineValue | null {
  const raw = report?.canonical_projections?.cross_chart_stem_combine;
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const hits = asCrossChartHitArray(o.hits);
  if (hits.length === 0) return null;
  const hitCount = typeof o.hitCount === "number" ? o.hitCount : hits.length;
  const dominantCombineName =
    typeof o.dominantCombineName === "string" ? o.dominantCombineName : null;
  return { hits, hitCount, dominantCombineName };
}
