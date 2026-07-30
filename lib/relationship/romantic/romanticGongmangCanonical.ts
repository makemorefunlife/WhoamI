/**
 * Romantic cross-chart 공망(void) canonical → client projection.
 *
 * Chain:
 *   analyzeCrossChartGongmang(workPairRiskSignals.ts) — bidirectional
 *   (A-void-hits-B and B-void-hits-A), reuses the existing private
 *   voidBranchesForChart table and the same palace-weight mechanism as
 *   every other cross-chart hit (no fabricated confidence number)
 *   → RomanticDynamicsTypedSnapshot.crossChartHits (category: "gongmang")
 *   → gongmangValueFromDynamicsSnapshot(snapshot)
 *   → buildRomanticGongmangCanonical(finalized)
 *   → buildRomanticGongmangClientProjection(value)
 *   → injectRomanticGongmangClientProjection(report, projection)
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

export const ROMANTIC_GONGMANG_CANONICAL_SOURCE =
  "collectRomanticDynamicsTypedSnapshot" as const;

export const ROMANTIC_GONGMANG_PERSISTENCE_PATH =
  "romantic_context_input.dynamics_typed_snapshot" as const;

export const ROMANTIC_GONGMANG_CLIENT_PATH =
  "canonical_projections.cross_chart_gongmang" as const;

export const ROMANTIC_GONGMANG_PSYCH_MODE = "none" as const;

export type RomanticGongmangValue = {
  hits: CrossChartHit[];
  hitCount: number;
};

export type RomanticGongmangCanonical =
  CanonicalJudgment<RomanticGongmangValue>;

function cloneValue(v: RomanticGongmangValue): RomanticGongmangValue {
  return { hits: cloneCrossChartHitArray(v.hits), hitCount: v.hitCount };
}

export function gongmangValueFromDynamicsSnapshot(
  snapshot: { crossChartHits: CrossChartHit[] } | null | undefined,
): RomanticGongmangValue | null {
  if (!snapshot) return null;
  const hits = snapshot.crossChartHits.filter((h) => h.category === "gongmang");
  if (hits.length === 0) return null;
  return { hits, hitCount: hits.length };
}

export function buildRomanticGongmangCanonical(
  finalized: RomanticGongmangValue | null | undefined,
): RomanticGongmangCanonical | null {
  if (!finalized) return null;
  return {
    value: cloneValue(finalized),
    source: ROMANTIC_GONGMANG_CANONICAL_SOURCE,
    psychMode: ROMANTIC_GONGMANG_PSYCH_MODE,
    persistencePath: ROMANTIC_GONGMANG_PERSISTENCE_PATH,
  };
}

export function buildRomanticGongmangClientProjection(
  value: RomanticGongmangValue | null | undefined,
): RomanticGongmangValue | null {
  if (!value) return null;
  return cloneValue(value);
}

type ReportWithCanonicalProjections = {
  canonical_projections?: {
    cross_chart_gongmang?: unknown;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export function injectRomanticGongmangClientProjection<
  T extends ReportWithCanonicalProjections,
>(
  report: T,
  projection: RomanticGongmangValue | null | undefined,
): T {
  const { canonical_projections: priorProjections, ...rest } = report;
  const priorRest =
    priorProjections && typeof priorProjections === "object"
      ? Object.fromEntries(
          Object.entries(priorProjections).filter(
            ([k]) => k !== "cross_chart_gongmang",
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
      cross_chart_gongmang: cloneValue(projection),
    },
  };
}

export function readRomanticGongmangCanonicalProjection(
  report:
    | { canonical_projections?: { cross_chart_gongmang?: unknown } }
    | null
    | undefined,
): RomanticGongmangValue | null {
  const raw = report?.canonical_projections?.cross_chart_gongmang;
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const hits = asCrossChartHitArray(o.hits);
  if (hits.length === 0) return null;
  const hitCount = typeof o.hitCount === "number" ? o.hitCount : hits.length;
  return { hits, hitCount };
}
