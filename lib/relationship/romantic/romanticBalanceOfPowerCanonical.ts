/**
 * Phase 6-2d1 — Romantic balance_of_power canonical → client projection.
 *
 * Chain:
 *   collectRomanticDynamicsTypedSnapshot
 *   → dominant_categories.balance_* / sublead_*
 *   → buildRomanticBalanceOfPowerCanonical(finalized)
 *   → buildRomanticBalanceClientProjection(value)
 *   → injectRomanticBalanceClientProjection(report, projection)
 *   → UI badge; LLM headline/body = explanation only
 *
 * Does not call resolvers, read psych/signals, or parse prose.
 */
import type { CanonicalJudgment } from "@/lib/relationship/contextEngine/canonicalJudgment";
import type {
  BalanceOfPowerBand,
  SubLeadBand,
} from "@/lib/relationship/romanticRules/relationshipDynamics";
import type {
  RomanticContextDominantCategory,
  RomanticDynamicsTypedSnapshot,
} from "./romanticContextInput";

export const ROMANTIC_BALANCE_OF_POWER_CANONICAL_SOURCE =
  "collectRomanticDynamicsTypedSnapshot" as const;

export const ROMANTIC_BALANCE_OF_POWER_PERSISTENCE_PATH =
  "romantic_context_input.dominant_categories" as const;

export const ROMANTIC_BALANCE_OF_POWER_CLIENT_PATH =
  "canonical_projections.balance_of_power" as const;

export const ROMANTIC_BALANCE_OF_POWER_PSYCH_MODE_WITH_PSYCH =
  "primary" as const;
export const ROMANTIC_BALANCE_OF_POWER_PSYCH_MODE_LEGACY = "none" as const;

const BALANCE_BANDS = new Set<BalanceOfPowerBand>([
  "leader",
  "receiver",
  "balanced",
]);
const SUBLEAD_BANDS = new Set<SubLeadBand>(["A", "B", "balanced"]);

export type RomanticBalanceOfPowerValue = {
  balance_a: BalanceOfPowerBand;
  balance_b: BalanceOfPowerBand;
  sublead_idea_mood: SubLeadBand;
  sublead_decision_approval: SubLeadBand;
  sublead_execution: SubLeadBand;
  score_a?: number;
  score_b?: number;
};

export type RomanticBalanceOfPowerCanonical =
  CanonicalJudgment<RomanticBalanceOfPowerValue>;

function asBalanceBand(v: unknown): BalanceOfPowerBand | null {
  return typeof v === "string" && BALANCE_BANDS.has(v as BalanceOfPowerBand)
    ? (v as BalanceOfPowerBand)
    : null;
}

function asSubLeadBand(v: unknown): SubLeadBand | null {
  return typeof v === "string" && SUBLEAD_BANDS.has(v as SubLeadBand)
    ? (v as SubLeadBand)
    : null;
}

function cloneBalanceValue(
  v: RomanticBalanceOfPowerValue,
): RomanticBalanceOfPowerValue {
  return {
    balance_a: v.balance_a,
    balance_b: v.balance_b,
    sublead_idea_mood: v.sublead_idea_mood,
    sublead_decision_approval: v.sublead_decision_approval,
    sublead_execution: v.sublead_execution,
    ...(v.score_a != null ? { score_a: v.score_a } : {}),
    ...(v.score_b != null ? { score_b: v.score_b } : {}),
  };
}

/** Map typed dynamics snapshot → finalized balance/sublead value. */
export function balanceOfPowerValueFromDynamicsSnapshot(
  d: RomanticDynamicsTypedSnapshot,
): RomanticBalanceOfPowerValue {
  return {
    balance_a: d.balance.bandA,
    balance_b: d.balance.bandB,
    sublead_idea_mood: d.subLeads.ideaMoodLead,
    sublead_decision_approval: d.subLeads.decisionApprovalLead,
    sublead_execution: d.subLeads.executionLead,
    ...(d.balance.scoreA != null ? { score_a: d.balance.scoreA } : {}),
    ...(d.balance.scoreB != null ? { score_b: d.balance.scoreB } : {}),
  };
}

/** Map context dominant_categories → finalized value (null if incomplete). */
export function balanceOfPowerValueFromDominantCategories(
  cats: Record<string, RomanticContextDominantCategory> | null | undefined,
): RomanticBalanceOfPowerValue | null {
  if (!cats) return null;
  const balance_a = asBalanceBand(cats.balance_a?.category);
  const balance_b = asBalanceBand(cats.balance_b?.category);
  const sublead_idea_mood = asSubLeadBand(cats.sublead_idea_mood?.category);
  const sublead_decision_approval = asSubLeadBand(
    cats.sublead_decision_approval?.category,
  );
  const sublead_execution = asSubLeadBand(cats.sublead_execution?.category);
  if (
    !balance_a ||
    !balance_b ||
    !sublead_idea_mood ||
    !sublead_decision_approval ||
    !sublead_execution
  ) {
    return null;
  }
  const score_a = cats.balance_a?.scores?.score;
  const score_b = cats.balance_b?.scores?.score;
  return {
    balance_a,
    balance_b,
    sublead_idea_mood,
    sublead_decision_approval,
    sublead_execution,
    ...(typeof score_a === "number" ? { score_a } : {}),
    ...(typeof score_b === "number" ? { score_b } : {}),
  };
}

/**
 * Wrap an already-finalized balance/sublead judgment.
 * Does not call resolvers, read signals/psych, or alter fields.
 */
export function buildRomanticBalanceOfPowerCanonical(
  finalized: RomanticBalanceOfPowerValue | null | undefined,
): RomanticBalanceOfPowerCanonical | null {
  if (!finalized) return null;
  const psychApplied =
    finalized.score_a != null || finalized.score_b != null;
  return {
    value: cloneBalanceValue(finalized),
    source: ROMANTIC_BALANCE_OF_POWER_CANONICAL_SOURCE,
    psychMode: psychApplied
      ? ROMANTIC_BALANCE_OF_POWER_PSYCH_MODE_WITH_PSYCH
      : ROMANTIC_BALANCE_OF_POWER_PSYCH_MODE_LEGACY,
    persistencePath: ROMANTIC_BALANCE_OF_POWER_PERSISTENCE_PATH,
  };
}

/**
 * Client-safe typed fields only — no localization, prose, or evidence.
 */
export function buildRomanticBalanceClientProjection(
  value: RomanticBalanceOfPowerValue | null | undefined,
): RomanticBalanceOfPowerValue | null {
  if (!value) return null;
  return cloneBalanceValue(value);
}

type ReportWithCanonicalProjections = {
  canonical_projections?: {
    balance_of_power?: unknown;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

/**
 * Immutable inject of server balance projection.
 * Server projection always wins over any LLM-provided canonical_projections.balance_of_power.
 * Does not mutate input. Does not parse prose or call resolvers.
 */
export function injectRomanticBalanceClientProjection<
  T extends ReportWithCanonicalProjections,
>(
  report: T,
  projection: RomanticBalanceOfPowerValue | null | undefined,
): T {
  const { canonical_projections: priorProjections, ...rest } = report;
  const priorRest =
    priorProjections && typeof priorProjections === "object"
      ? Object.fromEntries(
          Object.entries(priorProjections).filter(
            ([k]) => k !== "balance_of_power",
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
      balance_of_power: cloneBalanceValue(projection),
    },
  };
}

/** Semantic fields for equality tests (scores optional). */
export function balanceOfPowerJudgmentFields(
  v: RomanticBalanceOfPowerValue | null | undefined,
): Omit<RomanticBalanceOfPowerValue, "score_a" | "score_b"> | null {
  if (!v) return null;
  return {
    balance_a: v.balance_a,
    balance_b: v.balance_b,
    sublead_idea_mood: v.sublead_idea_mood,
    sublead_decision_approval: v.sublead_decision_approval,
    sublead_execution: v.sublead_execution,
  };
}

/** Parse client projection; malformed → null (never invent from prose). */
export function readRomanticBalanceCanonicalProjection(
  report:
    | { canonical_projections?: { balance_of_power?: unknown } }
    | null
    | undefined,
): RomanticBalanceOfPowerValue | null {
  const raw = report?.canonical_projections?.balance_of_power;
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const balance_a = asBalanceBand(o.balance_a);
  const balance_b = asBalanceBand(o.balance_b);
  const sublead_idea_mood = asSubLeadBand(o.sublead_idea_mood);
  const sublead_decision_approval = asSubLeadBand(o.sublead_decision_approval);
  const sublead_execution = asSubLeadBand(o.sublead_execution);
  if (
    !balance_a ||
    !balance_b ||
    !sublead_idea_mood ||
    !sublead_decision_approval ||
    !sublead_execution
  ) {
    return null;
  }
  return {
    balance_a,
    balance_b,
    sublead_idea_mood,
    sublead_decision_approval,
    sublead_execution,
    ...(typeof o.score_a === "number" ? { score_a: o.score_a } : {}),
    ...(typeof o.score_b === "number" ? { score_b: o.score_b } : {}),
  };
}

function bandLabel(band: BalanceOfPowerBand, locale: "ko" | "en"): string {
  if (locale === "en") {
    if (band === "leader") return "leads";
    if (band === "receiver") return "receives";
    return "balanced";
  }
  if (band === "leader") return "주도";
  if (band === "receiver") return "수용";
  return "균형";
}

/**
 * Presentation label from typed enums only — never reads LLM prose.
 */
export function formatRomanticBalanceCanonicalLabel(
  value: RomanticBalanceOfPowerValue,
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
  const { balance_a, balance_b } = value;

  if (balance_a === "balanced" && balance_b === "balanced") {
    return locale === "en" ? "Balanced initiative" : "주도권 균형";
  }
  if (balance_a === "leader" && balance_b === "receiver") {
    return locale === "en"
      ? `${nameA} leads · ${nameB} receives`
      : `${nameA} 주도 · ${nameB} 수용`;
  }
  if (balance_a === "receiver" && balance_b === "leader") {
    return locale === "en"
      ? `${nameB} leads · ${nameA} receives`
      : `${nameB} 주도 · ${nameA} 수용`;
  }
  return locale === "en"
    ? `${nameA}: ${bandLabel(balance_a, "en")} · ${nameB}: ${bandLabel(balance_b, "en")}`
    : `${nameA}: ${bandLabel(balance_a, "ko")} · ${nameB}: ${bandLabel(balance_b, "ko")}`;
}
