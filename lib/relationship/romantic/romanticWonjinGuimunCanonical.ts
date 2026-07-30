/**
 * Romantic cross-chart 원진/귀문(wonjin/guimun) canonical → client projection.
 *
 * Chain:
 *   analyzeCrossChartWonjinGuimun(workPairRiskSignals.ts) — full 4×4 pillar
 *   pairs, reuses the pure isWonjin/isGuimun pair-checks (not the narrower
 *   Marriage-domain day/hour+month-only wrapper — Romantic has no existing
 *   call site for either)
 *   → RomanticDynamicsTypedSnapshot.crossChartHits (category: "wonjin_guimun")
 *   → wonjinGuimunValueFromDynamicsSnapshot(snapshot)
 *   → buildRomanticWonjinGuimunCanonical(finalized)
 *   → buildRomanticWonjinGuimunClientProjection(value)
 *   → injectRomanticWonjinGuimunClientProjection(report, projection)
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

export const ROMANTIC_WONJIN_GUIMUN_CANONICAL_SOURCE =
  "collectRomanticDynamicsTypedSnapshot" as const;

export const ROMANTIC_WONJIN_GUIMUN_PERSISTENCE_PATH =
  "romantic_context_input.dynamics_typed_snapshot" as const;

export const ROMANTIC_WONJIN_GUIMUN_CLIENT_PATH =
  "canonical_projections.cross_chart_wonjin_guimun" as const;

export const ROMANTIC_WONJIN_GUIMUN_PSYCH_MODE = "none" as const;

export type RomanticWonjinGuimunValue = {
  hits: CrossChartHit[];
  wonjinCount: number;
  guimunCount: number;
};

export type RomanticWonjinGuimunCanonical =
  CanonicalJudgment<RomanticWonjinGuimunValue>;

function cloneValue(v: RomanticWonjinGuimunValue): RomanticWonjinGuimunValue {
  return {
    hits: cloneCrossChartHitArray(v.hits),
    wonjinCount: v.wonjinCount,
    guimunCount: v.guimunCount,
  };
}

export function wonjinGuimunValueFromDynamicsSnapshot(
  snapshot: { crossChartHits: CrossChartHit[] } | null | undefined,
): RomanticWonjinGuimunValue | null {
  if (!snapshot) return null;
  const hits = snapshot.crossChartHits.filter((h) => h.category === "wonjin_guimun");
  if (hits.length === 0) return null;
  return {
    hits,
    wonjinCount: hits.filter((h) => h.type === "원진").length,
    guimunCount: hits.filter((h) => h.type === "귀문").length,
  };
}

export function buildRomanticWonjinGuimunCanonical(
  finalized: RomanticWonjinGuimunValue | null | undefined,
): RomanticWonjinGuimunCanonical | null {
  if (!finalized) return null;
  return {
    value: cloneValue(finalized),
    source: ROMANTIC_WONJIN_GUIMUN_CANONICAL_SOURCE,
    psychMode: ROMANTIC_WONJIN_GUIMUN_PSYCH_MODE,
    persistencePath: ROMANTIC_WONJIN_GUIMUN_PERSISTENCE_PATH,
  };
}

export function buildRomanticWonjinGuimunClientProjection(
  value: RomanticWonjinGuimunValue | null | undefined,
): RomanticWonjinGuimunValue | null {
  if (!value) return null;
  return cloneValue(value);
}

type ReportWithCanonicalProjections = {
  canonical_projections?: {
    cross_chart_wonjin_guimun?: unknown;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export function injectRomanticWonjinGuimunClientProjection<
  T extends ReportWithCanonicalProjections,
>(
  report: T,
  projection: RomanticWonjinGuimunValue | null | undefined,
): T {
  const { canonical_projections: priorProjections, ...rest } = report;
  const priorRest =
    priorProjections && typeof priorProjections === "object"
      ? Object.fromEntries(
          Object.entries(priorProjections).filter(
            ([k]) => k !== "cross_chart_wonjin_guimun",
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
      cross_chart_wonjin_guimun: cloneValue(projection),
    },
  };
}

export function readRomanticWonjinGuimunCanonicalProjection(
  report:
    | { canonical_projections?: { cross_chart_wonjin_guimun?: unknown } }
    | null
    | undefined,
): RomanticWonjinGuimunValue | null {
  const raw = report?.canonical_projections?.cross_chart_wonjin_guimun;
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const hits = asCrossChartHitArray(o.hits);
  if (hits.length === 0) return null;
  const wonjinCount =
    typeof o.wonjinCount === "number"
      ? o.wonjinCount
      : hits.filter((h) => h.type === "원진").length;
  const guimunCount =
    typeof o.guimunCount === "number"
      ? o.guimunCount
      : hits.filter((h) => h.type === "귀문").length;
  return { hits, wonjinCount, guimunCount };
}
