/**
 * Phase 6-2d3 — Romantic reassurance_signal canonical → client projection.
 *
 * Chain:
 *   collectRomanticDynamicsTypedSnapshot
 *   → dominant_categories.reassurance_*
 *   → buildRomanticReassuranceCanonical(finalized)
 *   → buildRomanticReassuranceClientProjection(value)
 *   → injectRomanticReassuranceClientProjection(report, projection)
 *   → UI badge; LLM headline/body = explanation only
 *
 * need/give/match = facets of one product judgment.
 * Does not call resolvers, read psych/signals, or parse prose.
 */
import type { CanonicalJudgment } from "@/lib/relationship/contextEngine/canonicalJudgment";
import type {
  GiveStyle,
  ReassuranceBand,
} from "@/lib/relationship/romanticRules/relationshipDynamics";
import type {
  RomanticContextDominantCategory,
  RomanticDynamicsTypedSnapshot,
} from "./romanticContextInput";

export const ROMANTIC_REASSURANCE_CANONICAL_SOURCE =
  "collectRomanticDynamicsTypedSnapshot" as const;

export const ROMANTIC_REASSURANCE_PERSISTENCE_PATH =
  "romantic_context_input.dominant_categories" as const;

export const ROMANTIC_REASSURANCE_CLIENT_PATH =
  "canonical_projections.reassurance_signal" as const;

export const ROMANTIC_REASSURANCE_PSYCH_MODE = "none" as const;

const NEED_BANDS = new Set<ReassuranceBand>([
  "listening",
  "behavior_proof",
  "both",
  "presence",
]);
const GIVE_STYLES = new Set<GiveStyle>([
  "solidarity",
  "expression",
  "action",
  "consistency",
  "care",
]);
const MATCH_CATEGORIES = new Set(["matched", "mismatched"]);

export type RomanticReassuranceValue = {
  need_a: ReassuranceBand;
  need_b: ReassuranceBand;
  give_a: GiveStyle;
  give_b: GiveStyle;
  match_b_gives_a: boolean;
  match_a_gives_b: boolean;
};

export type RomanticReassuranceCanonical =
  CanonicalJudgment<RomanticReassuranceValue>;

function asNeedBand(v: unknown): ReassuranceBand | null {
  return typeof v === "string" && NEED_BANDS.has(v as ReassuranceBand)
    ? (v as ReassuranceBand)
    : null;
}

function asGiveStyle(v: unknown): GiveStyle | null {
  return typeof v === "string" && GIVE_STYLES.has(v as GiveStyle)
    ? (v as GiveStyle)
    : null;
}

function asMatchBoolean(v: unknown): boolean | null {
  if (typeof v !== "string" || !MATCH_CATEGORIES.has(v)) return null;
  return v === "matched";
}

function cloneReassuranceValue(
  v: RomanticReassuranceValue,
): RomanticReassuranceValue {
  return {
    need_a: v.need_a,
    need_b: v.need_b,
    give_a: v.give_a,
    give_b: v.give_b,
    match_b_gives_a: v.match_b_gives_a,
    match_a_gives_b: v.match_a_gives_b,
  };
}

/** Map typed dynamics snapshot → finalized reassurance value. */
export function reassuranceValueFromDynamicsSnapshot(
  d: RomanticDynamicsTypedSnapshot,
): RomanticReassuranceValue {
  return {
    need_a: d.needA,
    need_b: d.needB,
    give_a: d.giveA,
    give_b: d.giveB,
    match_b_gives_a: d.matchBGivesA,
    match_a_gives_b: d.matchAGivesB,
  };
}

/** Map context dominant_categories → finalized value (null if incomplete). */
export function reassuranceValueFromDominantCategories(
  cats: Record<string, RomanticContextDominantCategory> | null | undefined,
): RomanticReassuranceValue | null {
  if (!cats) return null;
  const need_a = asNeedBand(cats.reassurance_need_a?.category);
  const need_b = asNeedBand(cats.reassurance_need_b?.category);
  const give_a = asGiveStyle(cats.reassurance_give_a?.category);
  const give_b = asGiveStyle(cats.reassurance_give_b?.category);
  const match_b_gives_a = asMatchBoolean(
    cats.reassurance_match_b_gives_a?.category,
  );
  const match_a_gives_b = asMatchBoolean(
    cats.reassurance_match_a_gives_b?.category,
  );
  if (
    !need_a ||
    !need_b ||
    !give_a ||
    !give_b ||
    match_b_gives_a == null ||
    match_a_gives_b == null
  ) {
    return null;
  }
  return {
    need_a,
    need_b,
    give_a,
    give_b,
    match_b_gives_a,
    match_a_gives_b,
  };
}

/**
 * Wrap an already-finalized reassurance judgment.
 * Does not call resolvers, read signals/psych, or alter fields.
 */
export function buildRomanticReassuranceCanonical(
  finalized: RomanticReassuranceValue | null | undefined,
): RomanticReassuranceCanonical | null {
  if (!finalized) return null;
  return {
    value: cloneReassuranceValue(finalized),
    source: ROMANTIC_REASSURANCE_CANONICAL_SOURCE,
    psychMode: ROMANTIC_REASSURANCE_PSYCH_MODE,
    persistencePath: ROMANTIC_REASSURANCE_PERSISTENCE_PATH,
  };
}

/** Client-safe typed fields only — no localization, prose, or evidence. */
export function buildRomanticReassuranceClientProjection(
  value: RomanticReassuranceValue | null | undefined,
): RomanticReassuranceValue | null {
  if (!value) return null;
  return cloneReassuranceValue(value);
}

type ReportWithCanonicalProjections = {
  canonical_projections?: {
    reassurance_signal?: unknown;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

/**
 * Immutable inject of server reassurance projection.
 * Preserves balance_of_power, recovery_speed, and other keys.
 */
export function injectRomanticReassuranceClientProjection<
  T extends ReportWithCanonicalProjections,
>(
  report: T,
  projection: RomanticReassuranceValue | null | undefined,
): T {
  const { canonical_projections: priorProjections, ...rest } = report;
  const priorRest =
    priorProjections && typeof priorProjections === "object"
      ? Object.fromEntries(
          Object.entries(priorProjections).filter(
            ([k]) => k !== "reassurance_signal",
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
      reassurance_signal: cloneReassuranceValue(projection),
    },
  };
}

export function reassuranceJudgmentFields(
  v: RomanticReassuranceValue | null | undefined,
): RomanticReassuranceValue | null {
  if (!v) return null;
  return cloneReassuranceValue(v);
}

/** Parse client projection; malformed → null (never invent from prose). */
export function readRomanticReassuranceCanonicalProjection(
  report:
    | { canonical_projections?: { reassurance_signal?: unknown } }
    | null
    | undefined,
): RomanticReassuranceValue | null {
  const raw = report?.canonical_projections?.reassurance_signal;
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const need_a = asNeedBand(o.need_a);
  const need_b = asNeedBand(o.need_b);
  const give_a = asGiveStyle(o.give_a);
  const give_b = asGiveStyle(o.give_b);
  if (!need_a || !need_b || !give_a || !give_b) return null;
  if (
    typeof o.match_b_gives_a !== "boolean" ||
    typeof o.match_a_gives_b !== "boolean"
  ) {
    return null;
  }
  return {
    need_a,
    need_b,
    give_a,
    give_b,
    match_b_gives_a: o.match_b_gives_a,
    match_a_gives_b: o.match_a_gives_b,
  };
}

function needLabel(band: ReassuranceBand, locale: "ko" | "en"): string {
  if (locale === "en") {
    if (band === "listening") return "listening";
    if (band === "behavior_proof") return "proof in action";
    if (band === "both") return "listening + proof";
    return "presence";
  }
  if (band === "listening") return "경청";
  if (band === "behavior_proof") return "행동 증거";
  if (band === "both") return "경청+행동";
  return "함께 있음";
}

/**
 * Presentation label from typed enums only — never reads LLM prose.
 */
export function formatRomanticReassuranceCanonicalLabel(
  value: RomanticReassuranceValue,
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
  const bothMatch = value.match_b_gives_a && value.match_a_gives_b;
  const neitherMatch = !value.match_b_gives_a && !value.match_a_gives_b;

  const needs =
    locale === "en"
      ? `${nameA} needs ${needLabel(value.need_a, "en")} · ${nameB} needs ${needLabel(value.need_b, "en")}`
      : `${nameA} ${needLabel(value.need_a, "ko")} · ${nameB} ${needLabel(value.need_b, "ko")}`;

  if (bothMatch) {
    return locale === "en" ? `${needs} · matched` : `${needs} · 맞음`;
  }
  if (neitherMatch) {
    return locale === "en" ? `${needs} · mismatch` : `${needs} · 어긋남`;
  }
  return locale === "en" ? `${needs} · mixed match` : `${needs} · 일부 맞음`;
}
