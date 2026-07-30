/**
 * Romantic cross-chart 삼합/방합(trio combine) canonical → client projection.
 *
 * Chain:
 *   analyzeCrossChartTrioCombines(pairChartAnalysis.ts) — A+B combined branch
 *   pool, requires genuine both-person contribution (neither chart alone
 *   already completes the trio)
 *   → RomanticDynamicsTypedSnapshot.crossTrioHits
 *   → crossTrioValueFromDynamicsSnapshot(snapshot)
 *   → buildRomanticCrossTrioCanonical(finalized)
 *   → buildRomanticCrossTrioClientProjection(value)
 *   → injectRomanticCrossTrioClientProjection(report, projection)
 *
 * Bypasses dominant_categories (frozen-digest-adjacent — see decision 027).
 * Saju-only — psychMode always "none".
 */
import type { CanonicalJudgment } from "@/lib/relationship/contextEngine/canonicalJudgment";
import type { CrossChartTrioHit } from "@/lib/saju/pairChartAnalysis";
import {
  asCrossChartTrioHitArray,
  cloneCrossChartTrioHitArray,
} from "./romanticCrossChartHitParsing";

export const ROMANTIC_CROSS_TRIO_CANONICAL_SOURCE =
  "collectRomanticDynamicsTypedSnapshot" as const;

export const ROMANTIC_CROSS_TRIO_PERSISTENCE_PATH =
  "romantic_context_input.dynamics_typed_snapshot" as const;

export const ROMANTIC_CROSS_TRIO_CLIENT_PATH =
  "canonical_projections.cross_chart_trio" as const;

export const ROMANTIC_CROSS_TRIO_PSYCH_MODE = "none" as const;

export type RomanticCrossTrioValue = {
  hits: CrossChartTrioHit[];
  hitCount: number;
};

export type RomanticCrossTrioCanonical =
  CanonicalJudgment<RomanticCrossTrioValue>;

function cloneValue(v: RomanticCrossTrioValue): RomanticCrossTrioValue {
  return { hits: cloneCrossChartTrioHitArray(v.hits), hitCount: v.hitCount };
}

export function crossTrioValueFromDynamicsSnapshot(
  snapshot: { crossTrioHits: CrossChartTrioHit[] } | null | undefined,
): RomanticCrossTrioValue | null {
  if (!snapshot) return null;
  const hits = snapshot.crossTrioHits;
  if (hits.length === 0) return null;
  return { hits, hitCount: hits.length };
}

export function buildRomanticCrossTrioCanonical(
  finalized: RomanticCrossTrioValue | null | undefined,
): RomanticCrossTrioCanonical | null {
  if (!finalized) return null;
  return {
    value: cloneValue(finalized),
    source: ROMANTIC_CROSS_TRIO_CANONICAL_SOURCE,
    psychMode: ROMANTIC_CROSS_TRIO_PSYCH_MODE,
    persistencePath: ROMANTIC_CROSS_TRIO_PERSISTENCE_PATH,
  };
}

export function buildRomanticCrossTrioClientProjection(
  value: RomanticCrossTrioValue | null | undefined,
): RomanticCrossTrioValue | null {
  if (!value) return null;
  return cloneValue(value);
}

type ReportWithCanonicalProjections = {
  canonical_projections?: {
    cross_chart_trio?: unknown;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export function injectRomanticCrossTrioClientProjection<
  T extends ReportWithCanonicalProjections,
>(
  report: T,
  projection: RomanticCrossTrioValue | null | undefined,
): T {
  const { canonical_projections: priorProjections, ...rest } = report;
  const priorRest =
    priorProjections && typeof priorProjections === "object"
      ? Object.fromEntries(
          Object.entries(priorProjections).filter(
            ([k]) => k !== "cross_chart_trio",
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
      cross_chart_trio: cloneValue(projection),
    },
  };
}

export function readRomanticCrossTrioCanonicalProjection(
  report:
    | { canonical_projections?: { cross_chart_trio?: unknown } }
    | null
    | undefined,
): RomanticCrossTrioValue | null {
  const raw = report?.canonical_projections?.cross_chart_trio;
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const hits = asCrossChartTrioHitArray(o.hits);
  if (hits.length === 0) return null;
  const hitCount = typeof o.hitCount === "number" ? o.hitCount : hits.length;
  return { hits, hitCount };
}
