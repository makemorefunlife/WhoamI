/** Pair Fact Layer — canonical A×B facts (no domain narrative). */

export const PAIR_SAJU_FACTS_VERSION = "pair_saju_facts_v1" as const;

/**
 * Palace weighting for Pair Fact hit scores.
 * Canonical default = lib/saju/palaceWeight.ts (romantic-default day/month priority).
 * Domain analyzers (WORK / MARRIAGE / FRIEND weight tables) may re-rank for scoring —
 * they must not invent alternate hit existence.
 */
export const PAIR_FACT_PALACE_WEIGHT_SOURCE =
  "lib/saju/palaceWeight.ts PALACE_WEIGHT" as const;

/** Documented gaps — never fabricated by Pair Fact / Pair CE. */
export const PAIR_SSOT_GAPS = [
  "mutual_cheoneul_guin",
  "cross_ten_god_officer_vs_self",
  "cross_ten_god_food_vs_seal",
  "gyeokguk",
] as const;

export type PairSsotGap = (typeof PAIR_SSOT_GAPS)[number];
