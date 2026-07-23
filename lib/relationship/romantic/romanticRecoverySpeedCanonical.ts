/**
 * Phase 6-2d2 — Romantic recovery_speed canonical → client projection.
 *
 * Chain:
 *   collectRomanticDynamicsTypedSnapshot
 *   → dominant_categories.recovery_*
 *   → buildRomanticRecoverySpeedCanonical(finalized)
 *   → buildRomanticRecoveryClientProjection(value)
 *   → injectRomanticRecoveryClientProjection(report, projection)
 *   → UI badge; LLM headline/body = explanation only
 *
 * Recovery only — residual is not part of this projection (Option B).
 * Does not call resolvers, read psych/signals, or parse prose.
 */
import type { CanonicalJudgment } from "@/lib/relationship/contextEngine/canonicalJudgment";
import type { RecoverySpeedBand } from "@/lib/relationship/romanticRules/relationshipDynamics";
import type {
  RomanticContextDominantCategory,
  RomanticDynamicsTypedSnapshot,
} from "./romanticContextInput";

export const ROMANTIC_RECOVERY_SPEED_CANONICAL_SOURCE =
  "collectRomanticDynamicsTypedSnapshot" as const;

export const ROMANTIC_RECOVERY_SPEED_PERSISTENCE_PATH =
  "romantic_context_input.dominant_categories" as const;

export const ROMANTIC_RECOVERY_SPEED_CLIENT_PATH =
  "canonical_projections.recovery_speed" as const;

export const ROMANTIC_RECOVERY_SPEED_PSYCH_MODE_WITH_PSYCH =
  "primary" as const;
export const ROMANTIC_RECOVERY_SPEED_PSYCH_MODE_LEGACY = "none" as const;

const RECOVERY_BANDS = new Set<RecoverySpeedBand>([
  "quick_recovery",
  "deep_processing",
  "balanced",
]);

const MISMATCH_CATEGORIES = new Set(["mismatch", "aligned"]);

export type RomanticRecoverySpeedValue = {
  recovery_a: RecoverySpeedBand;
  recovery_b: RecoverySpeedBand;
  recovery_mismatch: boolean;
  score_a?: number;
  score_b?: number;
};

export type RomanticRecoverySpeedCanonical =
  CanonicalJudgment<RomanticRecoverySpeedValue>;

function asRecoveryBand(v: unknown): RecoverySpeedBand | null {
  return typeof v === "string" && RECOVERY_BANDS.has(v as RecoverySpeedBand)
    ? (v as RecoverySpeedBand)
    : null;
}

function asMismatchBoolean(v: unknown): boolean | null {
  if (typeof v !== "string" || !MISMATCH_CATEGORIES.has(v)) return null;
  return v === "mismatch";
}

function cloneRecoveryValue(
  v: RomanticRecoverySpeedValue,
): RomanticRecoverySpeedValue {
  return {
    recovery_a: v.recovery_a,
    recovery_b: v.recovery_b,
    recovery_mismatch: v.recovery_mismatch,
    ...(v.score_a != null ? { score_a: v.score_a } : {}),
    ...(v.score_b != null ? { score_b: v.score_b } : {}),
  };
}

/** Map typed dynamics snapshot → finalized recovery value. */
export function recoverySpeedValueFromDynamicsSnapshot(
  d: RomanticDynamicsTypedSnapshot,
): RomanticRecoverySpeedValue {
  return {
    recovery_a: d.recovery.bandA,
    recovery_b: d.recovery.bandB,
    recovery_mismatch: d.recovery.mismatch,
    ...(d.recovery.scoreA != null ? { score_a: d.recovery.scoreA } : {}),
    ...(d.recovery.scoreB != null ? { score_b: d.recovery.scoreB } : {}),
  };
}

/** Map context dominant_categories → finalized value (null if incomplete). */
export function recoverySpeedValueFromDominantCategories(
  cats: Record<string, RomanticContextDominantCategory> | null | undefined,
): RomanticRecoverySpeedValue | null {
  if (!cats) return null;
  const recovery_a = asRecoveryBand(cats.recovery_a?.category);
  const recovery_b = asRecoveryBand(cats.recovery_b?.category);
  const recovery_mismatch = asMismatchBoolean(
    cats.recovery_mismatch?.category,
  );
  if (!recovery_a || !recovery_b || recovery_mismatch == null) {
    return null;
  }
  const score_a = cats.recovery_a?.scores?.score;
  const score_b = cats.recovery_b?.scores?.score;
  return {
    recovery_a,
    recovery_b,
    recovery_mismatch,
    ...(typeof score_a === "number" ? { score_a } : {}),
    ...(typeof score_b === "number" ? { score_b } : {}),
  };
}

/**
 * Wrap an already-finalized recovery judgment.
 * Does not call resolvers, read signals/psych, or alter fields.
 */
export function buildRomanticRecoverySpeedCanonical(
  finalized: RomanticRecoverySpeedValue | null | undefined,
): RomanticRecoverySpeedCanonical | null {
  if (!finalized) return null;
  const psychApplied =
    finalized.score_a != null || finalized.score_b != null;
  return {
    value: cloneRecoveryValue(finalized),
    source: ROMANTIC_RECOVERY_SPEED_CANONICAL_SOURCE,
    psychMode: psychApplied
      ? ROMANTIC_RECOVERY_SPEED_PSYCH_MODE_WITH_PSYCH
      : ROMANTIC_RECOVERY_SPEED_PSYCH_MODE_LEGACY,
    persistencePath: ROMANTIC_RECOVERY_SPEED_PERSISTENCE_PATH,
  };
}

/**
 * Client-safe typed fields only — no localization, prose, residual, or evidence.
 */
export function buildRomanticRecoveryClientProjection(
  value: RomanticRecoverySpeedValue | null | undefined,
): RomanticRecoverySpeedValue | null {
  if (!value) return null;
  return cloneRecoveryValue(value);
}

type ReportWithCanonicalProjections = {
  canonical_projections?: {
    recovery_speed?: unknown;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

/**
 * Immutable inject of server recovery projection.
 * Server projection always wins over any LLM-provided canonical_projections.recovery_speed.
 * Preserves balance_of_power and other keys. Does not mutate input.
 */
export function injectRomanticRecoveryClientProjection<
  T extends ReportWithCanonicalProjections,
>(
  report: T,
  projection: RomanticRecoverySpeedValue | null | undefined,
): T {
  const { canonical_projections: priorProjections, ...rest } = report;
  const priorRest =
    priorProjections && typeof priorProjections === "object"
      ? Object.fromEntries(
          Object.entries(priorProjections).filter(
            ([k]) => k !== "recovery_speed",
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
      recovery_speed: cloneRecoveryValue(projection),
    },
  };
}

/** Semantic fields for equality tests (scores optional). */
export function recoverySpeedJudgmentFields(
  v: RomanticRecoverySpeedValue | null | undefined,
): Omit<RomanticRecoverySpeedValue, "score_a" | "score_b"> | null {
  if (!v) return null;
  return {
    recovery_a: v.recovery_a,
    recovery_b: v.recovery_b,
    recovery_mismatch: v.recovery_mismatch,
  };
}

/** Parse client projection; malformed → null (never invent from prose). */
export function readRomanticRecoveryCanonicalProjection(
  report:
    | { canonical_projections?: { recovery_speed?: unknown } }
    | null
    | undefined,
): RomanticRecoverySpeedValue | null {
  const raw = report?.canonical_projections?.recovery_speed;
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const recovery_a = asRecoveryBand(o.recovery_a);
  const recovery_b = asRecoveryBand(o.recovery_b);
  if (!recovery_a || !recovery_b) return null;
  if (typeof o.recovery_mismatch !== "boolean") return null;
  return {
    recovery_a,
    recovery_b,
    recovery_mismatch: o.recovery_mismatch,
    ...(typeof o.score_a === "number" ? { score_a: o.score_a } : {}),
    ...(typeof o.score_b === "number" ? { score_b: o.score_b } : {}),
  };
}

function bandLabel(band: RecoverySpeedBand, locale: "ko" | "en"): string {
  if (locale === "en") {
    if (band === "quick_recovery") return "quick recovery";
    if (band === "deep_processing") return "deep processing";
    return "balanced";
  }
  if (band === "quick_recovery") return "급속 회복";
  if (band === "deep_processing") return "심층 숙성";
  return "균형";
}

/**
 * Presentation label from typed enums only — never reads LLM prose or residual.
 */
export function formatRomanticRecoveryCanonicalLabel(
  value: RomanticRecoverySpeedValue,
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
  const { nameA, nameB } = params;
  const { recovery_a, recovery_b, recovery_mismatch } = value;

  let base: string;
  if (recovery_a === "balanced" && recovery_b === "balanced") {
    base = locale === "en" ? "Balanced recovery pace" : "회복 속도 균형";
  } else if (
    recovery_a === recovery_b &&
    recovery_a !== "balanced"
  ) {
    base =
      locale === "en"
        ? `Both: ${bandLabel(recovery_a, "en")}`
        : `둘 다 ${bandLabel(recovery_a, "ko")}`;
  } else {
    base =
      locale === "en"
        ? `${nameA}: ${bandLabel(recovery_a, "en")} · ${nameB}: ${bandLabel(recovery_b, "en")}`
        : `${nameA}: ${bandLabel(recovery_a, "ko")} · ${nameB}: ${bandLabel(recovery_b, "ko")}`;
  }

  if (!recovery_mismatch) return base;
  return locale === "en" ? `${base} · gap` : `${base} · 격차 큼`;
}
