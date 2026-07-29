/** Personal Context Engine MVP — structured context only, no narrative. */

export const PERSONAL_CE_VERSION = "personal_ce_v1" as const;

export const PERSONAL_INNATE_LENS = "personal_innate_v1" as const;

export type PersonalLensId = typeof PERSONAL_INNATE_LENS;

/** Selection priority tiers — not numeric personality/compatibility scores. */
export type PersonalSignalTier = 1 | 2 | 3 | 4;

/** Lens output groups (deterministic buckets, not prose sections). */
export type PersonalContextGroupId =
  | "identity"
  | "energy"
  | "strengths"
  | "cautions"
  | "growth";

export type PersonalRoleInLens =
  | "identity_core"
  | "identity_support"
  | "energy_pattern"
  | "strength_signal"
  | "caution_signal"
  | "growth_signal"
  | "modifier_signal"
  | "directional_guidance";

/** Policy defaults (recommendations until product overrides). */
export const POLICY_DEFAULTS = {
  max_packets_per_group: 8,
  /** Reserve this many slots for T1+T2 before admitting T3/T4. */
  reserved_t1_t2_per_group: 4,
  max_nobles: 2,
  max_non_noble_shinsal: 2,
  max_combine_relations: 2,
  max_tension_relations: 2,
  /** Ordering keys only — never scores/confidence/%/UI metrics. */
  noble_selection_priority: 0.42,
  shinsal_selection_priority: 0.38,
  yongsin_selection_priority: 0.34,
  /** Default: omit low-confidence favorable_elements. */
  include_low_confidence: false,
} as const;

export const COMBINE_RELATION_TYPES = new Set([
  "stem_combine",
  "branch_six_combine",
  "branch_three_combine",
  "branch_direction_combine",
]);

export const TENSION_RELATION_TYPES = new Set([
  "stem_clash",
  "branch_clash",
  "branch_punishment",
  "branch_break",
  "branch_harm",
  "wonjin",
  "guimun",
]);

/** Documented SSOT gaps — never fabricated by CE. */
export const DOCUMENTED_SSOT_GAPS = [
  "yin_yang_balance",
  "gyeokguk",
  "luck_cycles",
] as const;
