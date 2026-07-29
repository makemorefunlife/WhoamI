/** Personal Context Engine MVP — structured context only, no narrative. */

export const PERSONAL_CE_VERSION = "personal_ce_v1" as const;

export const PERSONAL_INNATE_LENS = "personal_innate_v1" as const;

export type PersonalLensId = typeof PERSONAL_INNATE_LENS;

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
  | "growth_signal";
