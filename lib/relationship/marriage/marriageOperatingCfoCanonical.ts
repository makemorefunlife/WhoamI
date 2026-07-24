/**
 * Phase 6-2c — Marriage operating CFO canonical vertical slice.
 *
 * Pipeline (report boundary):
 *   pickHouseholdCfo (base → section_money_chores)
 *   → refineHouseholdCfo (composite, psychMode soft when psych present)
 *   → buildMarriageOperatingCfoCanonical(refined)  // wrap only
 *   → .value → household.section_money_chores cfo_* fields
 *   → canonical_projections.operating_cfo (client typed authority)
 *   → context_output / ViewModel money_chores (read-only)
 *
 * Product question: who operates day-to-day shared money / household CFO
 * (budget, accounts, big spends — one designated operator).
 *
 * Not: compare asset_management row, cfo_power_struggle.leader_side,
 * chores_guideline, bedroom_lead / manner, or parenting.
 * Not Friendship treasurer / Romantic balance_of_power / Work leadership.
 *
 * Does not change Phase 5 thresholds, lock/flip, or copy.
 */
import type { CanonicalJudgment } from "@/lib/relationship/contextEngine/canonicalJudgment";
import type { RefinedHouseholdCfo } from "./marriageCfoConsumption";

export const MARRIAGE_OPERATING_CFO_CANONICAL_SOURCE =
  "refineHouseholdCfo" as const;

/** Section holding cfo_* fields (nickname / reason / align / confidence / dual). */
export const MARRIAGE_OPERATING_CFO_PERSISTENCE_PATH =
  "household.section_money_chores" as const;

export const MARRIAGE_OPERATING_CFO_CLIENT_PATH =
  "canonical_projections.operating_cfo" as const;

/** Soft refine when composite attached confidence/align; otherwise none (legacy). */
export const MARRIAGE_OPERATING_CFO_PSYCH_MODE_WITH_PSYCH = "soft" as const;
export const MARRIAGE_OPERATING_CFO_PSYCH_MODE_LEGACY = "none" as const;

export type MarriageOperatingCfoBase = {
  nickname: string;
  reason: string;
};

export type MarriageOperatingCfoCanonical =
  CanonicalJudgment<RefinedHouseholdCfo>;

/** Locale-independent client projection (reason prose excluded). */
export type MarriageOperatingCfoClientValue = {
  side: "a" | "b";
  confidence?: RefinedHouseholdCfo["confidence"];
  align?: RefinedHouseholdCfo["align"];
  dual?: boolean;
};

/**
 * Wrap an already-finalized `refineHouseholdCfo` result.
 * Does not call pick/refine, read signals/psych, or alter the judgment.
 */
export function buildMarriageOperatingCfoCanonical(
  refined: RefinedHouseholdCfo | null | undefined,
  options?: {
    base?: MarriageOperatingCfoBase | null;
  },
): MarriageOperatingCfoCanonical | null {
  if (!refined) return null;

  const psychApplied =
    refined.confidence != null || refined.align != null;

  return {
    value: refined,
    source: MARRIAGE_OPERATING_CFO_CANONICAL_SOURCE,
    psychMode: psychApplied
      ? MARRIAGE_OPERATING_CFO_PSYCH_MODE_WITH_PSYCH
      : MARRIAGE_OPERATING_CFO_PSYCH_MODE_LEGACY,
    confidence: refined.confidence,
    align: refined.align,
    base: options?.base ?? undefined,
    persistencePath: MARRIAGE_OPERATING_CFO_PERSISTENCE_PATH,
  };
}

/** Semantic judgment fields — locale copy (reason) excluded. */
export type MarriageOperatingCfoJudgmentFields = {
  nickname: string;
  confidence?: RefinedHouseholdCfo["confidence"];
  align?: RefinedHouseholdCfo["align"];
  dual?: boolean;
};

export function operatingCfoJudgmentFields(
  refined: RefinedHouseholdCfo | null | undefined,
): MarriageOperatingCfoJudgmentFields | null {
  if (!refined) return null;
  return {
    nickname: refined.nickname,
    ...(refined.confidence ? { confidence: refined.confidence } : {}),
    ...(refined.align ? { align: refined.align } : {}),
    ...(refined.dual ? { dual: true } : {}),
  };
}

/**
 * Map section nickname → Context Output a|b side (no re-pick).
 * Same-name pairs omit a/b (do not invent a slot).
 */
export function operatingCfoSideFromNickname(
  nickname: string | null | undefined,
  nicknameA: string,
  nicknameB: string,
): "a" | "b" | null {
  if (!nickname) return null;
  if (nicknameA === nicknameB) return null;
  if (nickname === nicknameA) return "a";
  if (nickname === nicknameB) return "b";
  return null;
}

function cloneClient(
  v: MarriageOperatingCfoClientValue,
): MarriageOperatingCfoClientValue {
  return {
    side: v.side,
    ...(v.align ? { align: v.align } : {}),
    ...(v.confidence ? { confidence: v.confidence } : {}),
    ...(v.dual ? { dual: true } : {}),
  };
}

export function operatingCfoClientValueFromFinalized(
  refined: RefinedHouseholdCfo | null | undefined,
  nicknameA: string,
  nicknameB: string,
): MarriageOperatingCfoClientValue | null {
  if (!refined) return null;
  const side = operatingCfoSideFromNickname(
    refined.nickname,
    nicknameA,
    nicknameB,
  );
  if (!side) return null;
  return {
    side,
    ...(refined.align ? { align: refined.align } : {}),
    ...(refined.confidence ? { confidence: refined.confidence } : {}),
    ...(refined.dual ? { dual: true } : {}),
  };
}

export function buildMarriageOperatingCfoClientProjection(
  value: MarriageOperatingCfoClientValue | null | undefined,
): MarriageOperatingCfoClientValue | null {
  if (!value) return null;
  return cloneClient(value);
}

type ReportWithProjections = {
  canonical_projections?: {
    operating_cfo?: unknown;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export function injectMarriageOperatingCfoClientProjection<
  T extends ReportWithProjections,
>(report: T, projection: MarriageOperatingCfoClientValue | null | undefined): T {
  const { canonical_projections: prior, ...rest } = report;
  const priorRest =
    prior && typeof prior === "object"
      ? Object.fromEntries(
          Object.entries(prior).filter(([k]) => k !== "operating_cfo"),
        )
      : {};
  if (!projection) {
    if (Object.keys(priorRest).length === 0) return rest as T;
    return { ...(rest as T), canonical_projections: priorRest };
  }
  return {
    ...(rest as T),
    canonical_projections: {
      ...priorRest,
      operating_cfo: cloneClient(projection),
    },
  };
}

/** Malformed → null (never invent from cfo_reason prose). */
export function readMarriageOperatingCfoCanonicalProjection(
  report:
    | { canonical_projections?: { operating_cfo?: unknown } }
    | null
    | undefined,
): MarriageOperatingCfoClientValue | null {
  const raw = report?.canonical_projections?.operating_cfo;
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.side !== "a" && o.side !== "b") return null;
  const align =
    o.align === "confirms" || o.align === "caution" ? o.align : undefined;
  const confidence =
    o.confidence === "high" || o.confidence === "low"
      ? o.confidence
      : undefined;
  if (o.align !== undefined && !align) return null;
  if (o.confidence !== undefined && !confidence) return null;
  const dual = o.dual === true ? true : undefined;
  if (o.dual !== undefined && o.dual !== true) return null;
  return {
    side: o.side,
    ...(align ? { align } : {}),
    ...(confidence ? { confidence } : {}),
    ...(dual ? { dual: true } : {}),
  };
}

export function formatMarriageOperatingCfoCanonicalLabel(
  value: MarriageOperatingCfoClientValue,
  params: { nameA: string; nameB: string; locale?: string | null },
): string {
  const en =
    params.locale === "en" ||
    params.locale === "en-US" ||
    Boolean(params.locale?.startsWith("en"));
  const who = value.side === "a" ? params.nameA : params.nameB;
  let base = en ? `${who} is household CFO` : `${who} 가정 CFO`;
  if (value.dual) {
    base = en ? `${base} · dual risk` : `${base} · 듀얼 리스크`;
  }
  if (value.align === "confirms") {
    base = en ? `${base} · confirmed` : `${base} · 보강 일치`;
  } else if (value.align === "caution") {
    base = en ? `${base} · caution` : `${base} · 보강 주의`;
  }
  return base;
}
