/**
 * Phase 6-2d6 — Romantic expression_speed canonical → client projection.
 *
 * Chain:
 *   prepare: resolveExpressionSpeedDirection + refineExpressionSpeedCorroboration
 *   → dominant_categories.expression_speed_*
 *   → buildRomanticExpressionSpeedCanonical(finalized)
 *   → buildRomanticExpressionSpeedClientProjection(value)
 *   → injectRomanticExpressionSpeedClientProjection(report, projection)
 *   → UI badge (conflict dialogue); LLM dialogue prose unchanged
 *
 * direction = psych judgment. align/confidence = residual corroboration meta only.
 * Does not call resolvers/refine, read residual bands, or parse prose.
 */
import type { CanonicalJudgment } from "@/lib/relationship/contextEngine/canonicalJudgment";
import type { ExpressionSpeedDirection } from "@/lib/relationship/romanticRules/relationshipDynamics";
import type {
  ExpressionSpeedAlign,
  ExpressionSpeedConfidence,
} from "./expressionSpeedCorroboration";
import type { RomanticContextDominantCategory } from "./romanticContextInput";

export const ROMANTIC_EXPRESSION_SPEED_CANONICAL_SOURCE =
  "prepareRomanticSajuDeepRun" as const;

export const ROMANTIC_EXPRESSION_SPEED_PERSISTENCE_PATH =
  "romantic_context_input.dominant_categories" as const;

export const ROMANTIC_EXPRESSION_SPEED_CLIENT_PATH =
  "canonical_projections.expression_speed" as const;

export const ROMANTIC_EXPRESSION_SPEED_PSYCH_MODE = "primary" as const;

const DIRECTIONS = new Set<ExpressionSpeedDirection>(["A", "B", "balanced"]);
const ALIGNS = new Set<ExpressionSpeedAlign>(["confirms", "caution"]);
const CONFIDENCES = new Set<ExpressionSpeedConfidence>(["high", "low"]);

export type RomanticExpressionSpeedValue = {
  direction: ExpressionSpeedDirection;
  align?: ExpressionSpeedAlign;
  confidence?: ExpressionSpeedConfidence;
};

export type RomanticExpressionSpeedCanonical =
  CanonicalJudgment<RomanticExpressionSpeedValue>;

function asDirection(v: unknown): ExpressionSpeedDirection | null {
  return typeof v === "string" && DIRECTIONS.has(v as ExpressionSpeedDirection)
    ? (v as ExpressionSpeedDirection)
    : null;
}

function asAlign(v: unknown): ExpressionSpeedAlign | null {
  return typeof v === "string" && ALIGNS.has(v as ExpressionSpeedAlign)
    ? (v as ExpressionSpeedAlign)
    : null;
}

function asConfidence(v: unknown): ExpressionSpeedConfidence | null {
  return typeof v === "string" &&
    CONFIDENCES.has(v as ExpressionSpeedConfidence)
    ? (v as ExpressionSpeedConfidence)
    : null;
}

function cloneExpressionSpeedValue(
  v: RomanticExpressionSpeedValue,
): RomanticExpressionSpeedValue {
  return {
    direction: v.direction,
    ...(v.align != null ? { align: v.align } : {}),
    ...(v.confidence != null ? { confidence: v.confidence } : {}),
  };
}

/**
 * Map already-finalized direction + optional corroboration meta.
 * Does not call refineExpressionSpeedCorroboration.
 */
export function expressionSpeedValueFromFinalized(params: {
  direction: ExpressionSpeedDirection | null | undefined;
  align?: ExpressionSpeedAlign | null;
  confidence?: ExpressionSpeedConfidence | null;
}): RomanticExpressionSpeedValue | null {
  const direction = asDirection(params.direction);
  if (!direction) return null;
  const align = params.align != null ? asAlign(params.align) : null;
  const confidence =
    params.confidence != null ? asConfidence(params.confidence) : null;
  return {
    direction,
    ...(align ? { align } : {}),
    ...(confidence ? { confidence } : {}),
  };
}

/**
 * Map context dominant_categories → finalized value.
 * direction required; align/confidence optional (omit when absent).
 * Missing direction → null (do not discard solely for missing corroboration).
 */
export function expressionSpeedValueFromDominantCategories(
  cats: Record<string, RomanticContextDominantCategory> | null | undefined,
): RomanticExpressionSpeedValue | null {
  if (!cats) return null;
  const direction = asDirection(cats.expression_speed_direction?.category);
  if (!direction) return null;
  const align = asAlign(cats.expression_speed_align?.category);
  const confidence = asConfidence(cats.expression_speed_confidence?.category);
  return {
    direction,
    ...(align ? { align } : {}),
    ...(confidence ? { confidence } : {}),
  };
}

/**
 * Wrap an already-finalized expression_speed judgment.
 * Does not call resolvers/refine or read residual.
 */
export function buildRomanticExpressionSpeedCanonical(
  finalized: RomanticExpressionSpeedValue | null | undefined,
): RomanticExpressionSpeedCanonical | null {
  if (!finalized) return null;
  return {
    value: cloneExpressionSpeedValue(finalized),
    source: ROMANTIC_EXPRESSION_SPEED_CANONICAL_SOURCE,
    psychMode: ROMANTIC_EXPRESSION_SPEED_PSYCH_MODE,
    persistencePath: ROMANTIC_EXPRESSION_SPEED_PERSISTENCE_PATH,
  };
}

/** Client-safe typed fields only — no residual bands, prose, or evidence. */
export function buildRomanticExpressionSpeedClientProjection(
  value: RomanticExpressionSpeedValue | null | undefined,
): RomanticExpressionSpeedValue | null {
  if (!value) return null;
  return cloneExpressionSpeedValue(value);
}

type ReportWithCanonicalProjections = {
  canonical_projections?: {
    expression_speed?: unknown;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

/**
 * Immutable inject of server expression_speed projection.
 * Preserves residual and all other canonical keys.
 */
export function injectRomanticExpressionSpeedClientProjection<
  T extends ReportWithCanonicalProjections,
>(
  report: T,
  projection: RomanticExpressionSpeedValue | null | undefined,
): T {
  const { canonical_projections: priorProjections, ...rest } = report;
  const priorRest =
    priorProjections && typeof priorProjections === "object"
      ? Object.fromEntries(
          Object.entries(priorProjections).filter(
            ([k]) => k !== "expression_speed",
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
      expression_speed: cloneExpressionSpeedValue(projection),
    },
  };
}

/** Semantic fields for equality (optional meta included when present). */
export function expressionSpeedJudgmentFields(
  v: RomanticExpressionSpeedValue | null | undefined,
): RomanticExpressionSpeedValue | null {
  if (!v) return null;
  return cloneExpressionSpeedValue(v);
}

/** Parse client projection; malformed → null (never invent from prose). */
export function readRomanticExpressionSpeedCanonicalProjection(
  report:
    | { canonical_projections?: { expression_speed?: unknown } }
    | null
    | undefined,
): RomanticExpressionSpeedValue | null {
  const raw = report?.canonical_projections?.expression_speed;
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const direction = asDirection(o.direction);
  if (!direction) return null;
  const align = o.align !== undefined ? asAlign(o.align) : null;
  const confidence =
    o.confidence !== undefined ? asConfidence(o.confidence) : null;
  // If align/confidence keys present but invalid → treat as malformed whole.
  if (o.align !== undefined && !align) return null;
  if (o.confidence !== undefined && !confidence) return null;
  return {
    direction,
    ...(align ? { align } : {}),
    ...(confidence ? { confidence } : {}),
  };
}

/**
 * Presentation label from typed direction only — never residual or prose.
 */
export function formatRomanticExpressionSpeedCanonicalLabel(
  value: RomanticExpressionSpeedValue,
  params: {
    nameA: string;
    nameB: string;
    locale?: string | null;
  },
): string {
  const locale =
    params.locale === "en" ||
    params.locale === "en-US" ||
    params.locale?.startsWith("en")
      ? "en"
      : "ko";
  const { nameA, nameB, direction } = {
    nameA: params.nameA,
    nameB: params.nameB,
    direction: value.direction,
  };

  let base: string;
  if (direction === "balanced") {
    base =
      locale === "en" ? "Similar expression pace" : "표현 속도 비슷";
  } else if (direction === "A") {
    base =
      locale === "en"
        ? `${nameA} expresses faster`
        : `${nameA} 쪽이 더 빨리 표현`;
  } else {
    base =
      locale === "en"
        ? `${nameB} expresses faster`
        : `${nameB} 쪽이 더 빨리 표현`;
  }

  if (value.align === "confirms") {
    return locale === "en" ? `${base} · confirmed` : `${base} · 보강 일치`;
  }
  if (value.align === "caution") {
    return locale === "en" ? `${base} · caution` : `${base} · 보강 주의`;
  }
  return base;
}
