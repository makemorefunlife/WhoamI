/**
 * Phase 6-2d5 — Romantic residual canonical → client projection.
 *
 * Chain:
 *   collectRomanticDynamicsTypedSnapshot
 *   → dominant_categories.residual_a / residual_b
 *   → buildRomanticResidualCanonical(finalized)
 *   → buildRomanticResidualClientProjection(value)
 *   → injectRomanticResidualClientProjection(report, projection)
 *
 * Independent of recovery_speed (Option B). Does not own expression_speed.
 * Does not call resolvers, read psych/signals, or parse prose.
 */
import type { CanonicalJudgment } from "@/lib/relationship/contextEngine/canonicalJudgment";
import type { ResidualBand } from "@/lib/relationship/romanticRules/relationshipDynamics";
import type {
  RomanticContextDominantCategory,
  RomanticDynamicsTypedSnapshot,
} from "./romanticContextInput";

export const ROMANTIC_RESIDUAL_CANONICAL_SOURCE =
  "collectRomanticDynamicsTypedSnapshot" as const;

export const ROMANTIC_RESIDUAL_PERSISTENCE_PATH =
  "romantic_context_input.dominant_categories" as const;

export const ROMANTIC_RESIDUAL_CLIENT_PATH =
  "canonical_projections.residual" as const;

export const ROMANTIC_RESIDUAL_PSYCH_MODE = "none" as const;

const RESIDUAL_BANDS = new Set<ResidualBand>([
  "lingers",
  "clears_fast",
  "moderate",
]);

export type RomanticResidualValue = {
  residual_a: ResidualBand;
  residual_b: ResidualBand;
};

export type RomanticResidualCanonical =
  CanonicalJudgment<RomanticResidualValue>;

function asResidualBand(v: unknown): ResidualBand | null {
  return typeof v === "string" && RESIDUAL_BANDS.has(v as ResidualBand)
    ? (v as ResidualBand)
    : null;
}

function cloneResidualValue(v: RomanticResidualValue): RomanticResidualValue {
  return {
    residual_a: v.residual_a,
    residual_b: v.residual_b,
  };
}

/** Map typed dynamics snapshot → finalized residual value. */
export function residualValueFromDynamicsSnapshot(
  d: RomanticDynamicsTypedSnapshot,
): RomanticResidualValue {
  return {
    residual_a: d.residualA,
    residual_b: d.residualB,
  };
}

/** Map context dominant_categories → finalized value (null if incomplete). */
export function residualValueFromDominantCategories(
  cats: Record<string, RomanticContextDominantCategory> | null | undefined,
): RomanticResidualValue | null {
  if (!cats) return null;
  const residual_a = asResidualBand(cats.residual_a?.category);
  const residual_b = asResidualBand(cats.residual_b?.category);
  if (!residual_a || !residual_b) return null;
  return { residual_a, residual_b };
}

/**
 * Wrap an already-finalized residual judgment.
 * Does not call resolvers, read signals/psych, or alter fields.
 */
export function buildRomanticResidualCanonical(
  finalized: RomanticResidualValue | null | undefined,
): RomanticResidualCanonical | null {
  if (!finalized) return null;
  return {
    value: cloneResidualValue(finalized),
    source: ROMANTIC_RESIDUAL_CANONICAL_SOURCE,
    psychMode: ROMANTIC_RESIDUAL_PSYCH_MODE,
    persistencePath: ROMANTIC_RESIDUAL_PERSISTENCE_PATH,
  };
}

/** Client-safe typed fields only — no localization, prose, or recovery fields. */
export function buildRomanticResidualClientProjection(
  value: RomanticResidualValue | null | undefined,
): RomanticResidualValue | null {
  if (!value) return null;
  return cloneResidualValue(value);
}

type ReportWithCanonicalProjections = {
  canonical_projections?: {
    residual?: unknown;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

/**
 * Immutable inject of server residual projection.
 * Preserves balance/recovery/reassurance/role_play and other keys.
 */
export function injectRomanticResidualClientProjection<
  T extends ReportWithCanonicalProjections,
>(
  report: T,
  projection: RomanticResidualValue | null | undefined,
): T {
  const { canonical_projections: priorProjections, ...rest } = report;
  const priorRest =
    priorProjections && typeof priorProjections === "object"
      ? Object.fromEntries(
          Object.entries(priorProjections).filter(([k]) => k !== "residual"),
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
      residual: cloneResidualValue(projection),
    },
  };
}

export function residualJudgmentFields(
  v: RomanticResidualValue | null | undefined,
): RomanticResidualValue | null {
  if (!v) return null;
  return cloneResidualValue(v);
}

/** Parse client projection; malformed → null (never invent from prose). */
export function readRomanticResidualCanonicalProjection(
  report:
    | { canonical_projections?: { residual?: unknown } }
    | null
    | undefined,
): RomanticResidualValue | null {
  const raw = report?.canonical_projections?.residual;
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const residual_a = asResidualBand(o.residual_a);
  const residual_b = asResidualBand(o.residual_b);
  if (!residual_a || !residual_b) return null;
  return { residual_a, residual_b };
}

function bandLabel(band: ResidualBand, locale: "ko" | "en"): string {
  if (locale === "en") {
    if (band === "lingers") return "lingers";
    if (band === "clears_fast") return "clears fast";
    return "moderate";
  }
  if (band === "lingers") return "오래 남음";
  if (band === "clears_fast") return "빨리 가심";
  return "보통";
}

/**
 * Presentation label from typed enums only — never reads LLM prose.
 * Available for future UI; residual has no independent card in 6-2d5.
 */
export function formatRomanticResidualCanonicalLabel(
  value: RomanticResidualValue,
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
  if (value.residual_a === value.residual_b) {
    return locale === "en"
      ? `Both: ${bandLabel(value.residual_a, "en")}`
      : `둘 다 ${bandLabel(value.residual_a, "ko")}`;
  }
  return locale === "en"
    ? `${nameA}: ${bandLabel(value.residual_a, "en")} · ${nameB}: ${bandLabel(value.residual_b, "en")}`
    : `${nameA}: ${bandLabel(value.residual_a, "ko")} · ${nameB}: ${bandLabel(value.residual_b, "ko")}`;
}
