/**
 * Phase 6-2c — Marriage operating CFO canonical vertical slice.
 *
 * Pipeline (report boundary):
 *   pickHouseholdCfo (base → section_money_chores)
 *   → refineHouseholdCfo (composite, psychMode soft when psych present)
 *   → buildMarriageOperatingCfoCanonical(refined)  // wrap only
 *   → .value → household.section_money_chores cfo_* fields
 *   → context_output / ViewModel money_chores (read-only)
 *
 * Product question: who operates day-to-day shared money / household CFO
 * (budget, accounts, big spends — one designated operator).
 *
 * Not: compare asset_management row, cfo_power_struggle.leader_side,
 * chores_guideline, bedroom_lead / manner, or parenting.
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

/** Soft refine when composite attached confidence/align; otherwise none (legacy). */
export const MARRIAGE_OPERATING_CFO_PSYCH_MODE_WITH_PSYCH = "soft" as const;
export const MARRIAGE_OPERATING_CFO_PSYCH_MODE_LEGACY = "none" as const;

export type MarriageOperatingCfoBase = {
  nickname: string;
  reason: string;
};

export type MarriageOperatingCfoCanonical =
  CanonicalJudgment<RefinedHouseholdCfo>;

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
