/**
 * Romantic cross_chart_tension canonical → client projection.
 *
 * Chain:
 *   analyzePairSaju(pairChartAnalysis.ts).dayBranchCrossHits
 *   → collectRomanticDynamicsTypedSnapshot({ dayBranchCrossHits })
 *   → resolveCrossChartTension (충/형/파/해 only — 육합 excluded)
 *   → dominant_categories.cross_chart_tension_*
 *   → buildRomanticCrossChartTensionCanonical(finalized)
 *   → buildRomanticCrossChartTensionClientProjection(value)
 *   → injectRomanticCrossChartTensionClientProjection(report, projection)
 *   → Conflict Translation (M7): additional evidence + confidence input only.
 *
 * Does not invent dialogue text. Does not call resolvers. Saju-only (no
 * psych axis involved) — psychMode is always "none".
 */
import type { CanonicalJudgment } from "@/lib/relationship/contextEngine/canonicalJudgment";
import type {
  CrossChartTensionBand,
  CrossChartTensionResult,
  CrossChartTensionType,
} from "@/lib/relationship/romanticRules/relationshipDynamics";
import type { CrossChartHit } from "@/lib/saju/pairChartAnalysis";
import {
  asCrossChartHitArray,
  cloneCrossChartHitArray,
} from "./romanticCrossChartHitParsing";
import type { RomanticContextDominantCategory } from "./romanticContextInput";

export const ROMANTIC_CROSS_CHART_TENSION_CANONICAL_SOURCE =
  "collectRomanticDynamicsTypedSnapshot" as const;

export const ROMANTIC_CROSS_CHART_TENSION_PERSISTENCE_PATH =
  "romantic_context_input.dominant_categories" as const;

export const ROMANTIC_CROSS_CHART_TENSION_CLIENT_PATH =
  "canonical_projections.cross_chart_tension" as const;

export const ROMANTIC_CROSS_CHART_TENSION_PSYCH_MODE = "none" as const;

const BANDS = new Set<CrossChartTensionBand>(["high", "moderate", "none"]);
const TYPES = new Set<CrossChartTensionType>(["충", "형", "파", "해"]);

export type RomanticCrossChartTensionValue = {
  band: CrossChartTensionBand;
  dominant_type: CrossChartTensionType | null;
  hit_count: number;
  /** 개별 히트 전체(궁위·해석·priority 보존) — dominant_categories 경로에서는 항상 []. */
  hits: CrossChartHit[];
};

export type RomanticCrossChartTensionCanonical =
  CanonicalJudgment<RomanticCrossChartTensionValue>;

function asBand(v: unknown): CrossChartTensionBand | null {
  return typeof v === "string" && BANDS.has(v as CrossChartTensionBand)
    ? (v as CrossChartTensionBand)
    : null;
}

function asType(v: unknown): CrossChartTensionType | null {
  return typeof v === "string" && TYPES.has(v as CrossChartTensionType)
    ? (v as CrossChartTensionType)
    : null;
}

function cloneValue(
  v: RomanticCrossChartTensionValue,
): RomanticCrossChartTensionValue {
  return {
    band: v.band,
    dominant_type: v.dominant_type,
    hit_count: v.hit_count,
    hits: cloneCrossChartHitArray(v.hits),
  };
}

/**
 * Map context dominant_categories → finalized value (null if incomplete).
 * dominant_categories.scores is Record<string, number> — cannot carry hit
 * detail, so this legacy path always yields hits: []. Prefer
 * crossChartTensionValueFromFinalized for full detail.
 */
export function crossChartTensionValueFromDominantCategories(
  cats: Record<string, RomanticContextDominantCategory> | null | undefined,
): RomanticCrossChartTensionValue | null {
  if (!cats) return null;
  const band = asBand(cats.cross_chart_tension_band?.category);
  if (!band) return null;
  const rawType = cats.cross_chart_tension_type?.category;
  const dominant_type = rawType === "none" ? null : asType(rawType);
  const hit_count = cats.cross_chart_tension_type?.scores?.hit_count ?? 0;
  return { band, dominant_type, hit_count, hits: [] };
}

/**
 * Map the already-computed CrossChartTensionResult (RomanticDynamicsTypedSnapshot)
 * directly → finalized value, full hit detail preserved. Bypasses
 * dominant_categories entirely — this is the path index.ts should use.
 */
export function crossChartTensionValueFromFinalized(
  result: CrossChartTensionResult | null | undefined,
): RomanticCrossChartTensionValue | null {
  if (!result) return null;
  return {
    band: result.band,
    dominant_type: result.dominantType,
    hit_count: result.hitCount,
    hits: cloneCrossChartHitArray(result.hits),
  };
}

/**
 * Wrap an already-finalized cross-chart-tension judgment.
 * Does not call resolvers, read signals/psych, or alter fields.
 */
export function buildRomanticCrossChartTensionCanonical(
  finalized: RomanticCrossChartTensionValue | null | undefined,
): RomanticCrossChartTensionCanonical | null {
  if (!finalized) return null;
  return {
    value: cloneValue(finalized),
    source: ROMANTIC_CROSS_CHART_TENSION_CANONICAL_SOURCE,
    psychMode: ROMANTIC_CROSS_CHART_TENSION_PSYCH_MODE,
    persistencePath: ROMANTIC_CROSS_CHART_TENSION_PERSISTENCE_PATH,
  };
}

/** Client-safe typed fields only — no localization, prose, or evidence. */
export function buildRomanticCrossChartTensionClientProjection(
  value: RomanticCrossChartTensionValue | null | undefined,
): RomanticCrossChartTensionValue | null {
  if (!value) return null;
  return cloneValue(value);
}

type ReportWithCanonicalProjections = {
  canonical_projections?: {
    cross_chart_tension?: unknown;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

/**
 * Immutable inject of server cross-chart-tension projection.
 * Preserves all other canonical_projections keys. Does not mutate input.
 */
export function injectRomanticCrossChartTensionClientProjection<
  T extends ReportWithCanonicalProjections,
>(
  report: T,
  projection: RomanticCrossChartTensionValue | null | undefined,
): T {
  const { canonical_projections: priorProjections, ...rest } = report;
  const priorRest =
    priorProjections && typeof priorProjections === "object"
      ? Object.fromEntries(
          Object.entries(priorProjections).filter(
            ([k]) => k !== "cross_chart_tension",
          ),
        )
      : {};

  if (!projection) {
    if (Object.keys(priorRest).length === 0) {
      return rest as T;
    }
    return {
      ...(rest as T),
      canonical_projections: priorRest,
    };
  }

  return {
    ...(rest as T),
    canonical_projections: {
      ...priorRest,
      cross_chart_tension: cloneValue(projection),
    },
  };
}

/** Parse client projection; malformed → null (never invent from prose). */
export function readRomanticCrossChartTensionCanonicalProjection(
  report:
    | { canonical_projections?: { cross_chart_tension?: unknown } }
    | null
    | undefined,
): RomanticCrossChartTensionValue | null {
  const raw = report?.canonical_projections?.cross_chart_tension;
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const band = asBand(o.band);
  if (!band) return null;
  const dominant_type = o.dominant_type == null ? null : asType(o.dominant_type);
  const hit_count = typeof o.hit_count === "number" ? o.hit_count : 0;
  const hits = asCrossChartHitArray(o.hits);
  return { band, dominant_type, hit_count, hits };
}
