/** Pair Context Engine — context-neutral packets over Pair Fact Layer. */

export const PAIR_CE_VERSION = "pair_ce_v1" as const;
export const PAIR_SHARED_LENS = "pair_shared_v1" as const;

export type PairContextGroupId =
  | "bonding"
  | "friction"
  | "energy"
  | "structure"
  | "modifiers";

export type PairRoleInLens =
  | "bond_signal"
  | "friction_signal"
  | "energy_flow"
  | "energy_balance"
  | "modifier_signal"
  | "directional_guidance";

export type PairSignalTier = 1 | 2 | 3 | 4;

export type PairFactKind =
  | "stem_combine"
  | "stem_clash"
  | "branch_pair"
  | "branch_trio"
  | "wonjin_guimun"
  | "gongmang_cross"
  | "gongmang_shared"
  | "element_flow"
  | "johu_relation"
  | "yongsin_alignment"
  | "other";

export const PAIR_POLICY_DEFAULTS = {
  max_packets_per_group: 10,
  reserved_t1_t2_per_group: 4,
  /** Ordering only — never scores/%/UI metrics. Class S/A/B/C → bands. */
  class_s_selection_priority: 0.95,
  class_a_selection_priority: 0.8,
  class_b_selection_priority: 0.55,
  class_c_selection_priority: 0.4,
} as const;

export const BRANCH_TENSION_TYPES = new Set(["충", "형", "파", "해"]);
export const BRANCH_BOND_TYPES = new Set(["육합"]);
