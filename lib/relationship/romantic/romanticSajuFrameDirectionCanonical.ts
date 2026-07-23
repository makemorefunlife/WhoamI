/**
 * Phase 6-2d7 — Romantic saju_frame_direction canonical → client projection.
 *
 * Thin wrap of existing resolveSajuFrameDirection / dominant_categories
 * saju_frame_direction (+ derived anchor_is_a matching prepare).
 * Does not invent a new interpretation. Does not call resolvers.
 * LLM special-bond prose remains explanation-only.
 */
import type { CanonicalJudgment } from "@/lib/relationship/contextEngine/canonicalJudgment";
import type { SajuFrameDirection } from "@/lib/relationship/romanticRules/relationshipDynamics";
import type { RomanticContextDominantCategory } from "./romanticContextInput";

export const ROMANTIC_SAJU_FRAME_DIRECTION_CANONICAL_SOURCE =
  "collectRomanticDynamicsTypedSnapshot" as const;

export const ROMANTIC_SAJU_FRAME_DIRECTION_PERSISTENCE_PATH =
  "romantic_context_input.dominant_categories" as const;

export const ROMANTIC_SAJU_FRAME_DIRECTION_CLIENT_PATH =
  "canonical_projections.saju_frame_direction" as const;

export const ROMANTIC_SAJU_FRAME_DIRECTION_PSYCH_MODE = "none" as const;

const DIRECTIONS = new Set<SajuFrameDirection>(["A", "B", "balanced"]);

export type RomanticSajuFrameDirectionValue = {
  direction: SajuFrameDirection;
  /**
   * Matches prepare anchorIsA:
   * A → true, B → false, balanced → null
   */
  anchor_is_a: boolean | null;
};

export type RomanticSajuFrameDirectionCanonical =
  CanonicalJudgment<RomanticSajuFrameDirectionValue>;

function asDirection(v: unknown): SajuFrameDirection | null {
  return typeof v === "string" && DIRECTIONS.has(v as SajuFrameDirection)
    ? (v as SajuFrameDirection)
    : null;
}

/** Derive prepare-compatible anchorIsA from direction (no new judgment). */
export function anchorIsAFromSajuFrameDirection(
  direction: SajuFrameDirection,
): boolean | null {
  if (direction === "A") return true;
  if (direction === "B") return false;
  return null;
}

function cloneValue(
  v: RomanticSajuFrameDirectionValue,
): RomanticSajuFrameDirectionValue {
  return {
    direction: v.direction,
    anchor_is_a: v.anchor_is_a,
  };
}

export function sajuFrameDirectionValueFromFinalized(
  direction: SajuFrameDirection | null | undefined,
): RomanticSajuFrameDirectionValue | null {
  const d = asDirection(direction);
  if (!d) return null;
  return {
    direction: d,
    anchor_is_a: anchorIsAFromSajuFrameDirection(d),
  };
}

export function sajuFrameDirectionValueFromDominantCategories(
  cats: Record<string, RomanticContextDominantCategory> | null | undefined,
): RomanticSajuFrameDirectionValue | null {
  if (!cats) return null;
  return sajuFrameDirectionValueFromFinalized(
    cats.saju_frame_direction?.category as SajuFrameDirection | undefined,
  );
}

export function buildRomanticSajuFrameDirectionCanonical(
  finalized: RomanticSajuFrameDirectionValue | null | undefined,
): RomanticSajuFrameDirectionCanonical | null {
  if (!finalized) return null;
  return {
    value: cloneValue(finalized),
    source: ROMANTIC_SAJU_FRAME_DIRECTION_CANONICAL_SOURCE,
    psychMode: ROMANTIC_SAJU_FRAME_DIRECTION_PSYCH_MODE,
    persistencePath: ROMANTIC_SAJU_FRAME_DIRECTION_PERSISTENCE_PATH,
  };
}

export function buildRomanticSajuFrameDirectionClientProjection(
  value: RomanticSajuFrameDirectionValue | null | undefined,
): RomanticSajuFrameDirectionValue | null {
  if (!value) return null;
  return cloneValue(value);
}

type ReportWithCanonicalProjections = {
  canonical_projections?: {
    saju_frame_direction?: unknown;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export function injectRomanticSajuFrameDirectionClientProjection<
  T extends ReportWithCanonicalProjections,
>(
  report: T,
  projection: RomanticSajuFrameDirectionValue | null | undefined,
): T {
  const { canonical_projections: priorProjections, ...rest } = report;
  const priorRest =
    priorProjections && typeof priorProjections === "object"
      ? Object.fromEntries(
          Object.entries(priorProjections).filter(
            ([k]) => k !== "saju_frame_direction",
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
      saju_frame_direction: cloneValue(projection),
    },
  };
}

export function sajuFrameDirectionJudgmentFields(
  v: RomanticSajuFrameDirectionValue | null | undefined,
): RomanticSajuFrameDirectionValue | null {
  if (!v) return null;
  return cloneValue(v);
}

export function readRomanticSajuFrameDirectionCanonicalProjection(
  report:
    | { canonical_projections?: { saju_frame_direction?: unknown } }
    | null
    | undefined,
): RomanticSajuFrameDirectionValue | null {
  const raw = report?.canonical_projections?.saju_frame_direction;
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const direction = asDirection(o.direction);
  if (!direction) return null;
  const expected = anchorIsAFromSajuFrameDirection(direction);
  // Accept missing/null anchor_is_a when balanced; otherwise must match derive.
  if (o.anchor_is_a === undefined) {
    return { direction, anchor_is_a: expected };
  }
  if (o.anchor_is_a !== expected) return null;
  return { direction, anchor_is_a: expected };
}

/**
 * Presentation label from typed direction only — never special-bond prose.
 */
export function formatRomanticSajuFrameDirectionCanonicalLabel(
  value: RomanticSajuFrameDirectionValue,
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

  if (direction === "balanced") {
    return locale === "en"
      ? "Special-bond roles balanced"
      : "특별함 역할 균형";
  }
  if (direction === "A") {
    return locale === "en"
      ? `${nameA} as steadier anchor`
      : `${nameA} 쪽이 안식처 역할`;
  }
  return locale === "en"
    ? `${nameB} as steadier anchor`
    : `${nameB} 쪽이 안식처 역할`;
}
