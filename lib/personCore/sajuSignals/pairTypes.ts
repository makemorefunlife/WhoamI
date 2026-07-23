/** 2인 domain_signals 교차 연산 결과 — pair 레이어 SSOT */
export const PAIR_DOMAIN_SIGNALS_VERSION = "pair_domain_signals_v1" as const;

export type PairIntensityBand = "low" | "medium" | "high";

export type SecretAffinityLink = {
  side:
    | "hidden_a_hidden_b"
    | "hidden_a_day_stem_b"
    | "day_stem_a_hidden_b"
    | "day_stem_a_day_stem_b";
  stem_code_a: string;
  stem_code_b: string;
};

export type PairCohabitationSignals = {
  secret_affinity: {
    present: boolean;
    links: SecretAffinityLink[];
    affinity_index: number;
  };
  cfo_power_struggle: {
    dual_cfo_war: boolean;
    struggle_score: number;
    struggle_band: PairIntensityBand;
    /**
     * Side more likely to drive or intensify a money-control struggle
     * (pair affinity gap). Not the recommended household operating CFO —
     * that lives on Marriage `section_money_chores.cfo_nickname` (refined).
     */
    leader_side: "a" | "b" | "even" | null;
    a_cfo_affinity: number;
    b_cfo_affinity: number;
  };
  day_palace_cross: {
    branch_a: string;
    branch_b: string;
    cross_relation_type: string | null;
    cross_tension_index: number;
  };
};

export type PairWorkSignals = {
  micromanaging_poison_index: number;
  micromanaging_band: PairIntensityBand;
  leadership_conflict_index: number;
  leadership_conflict_band: PairIntensityBand;
  drive_clash_notes: string[];
};

export type PairFriendshipSignals = {
  johu_gap: {
    heat_gap: number;
    moisture_gap: number;
    temperature_mismatch: boolean;
    band_a: "cold" | "neutral" | "hot";
    band_b: "cold" | "neutral" | "hot";
  };
  energy_drain_index: number;
  energy_drain_band: PairIntensityBand;
};

/** Part2 C — 두 사람 guidance mode 적합도 (guidanceProfile.resolveGuidanceFit). */
export type PairGuidanceFit = "aligned" | "partial" | "mismatch";

export type PairFamilySignals = {
  umbilical_separation_index: number;
  umbilical_band: PairIntensityBand;
  nagging_trigger_index: number;
  nagging_band: PairIntensityBand;
  combined_karma_tension: number;
  /**
   * Part2 C. modes를 넘긴 경우에만 채움.
   * 미전달 시 null — 비교표는 counts로 resolveGuidanceFit 폴백(동일 SSOT 함수).
   */
  guidance_fit: PairGuidanceFit | null;
};

export type PairDomainSignalsPack = {
  schema_version: typeof PAIR_DOMAIN_SIGNALS_VERSION;
  cohabitation: PairCohabitationSignals;
  work: PairWorkSignals;
  friendship: PairFriendshipSignals;
  family: PairFamilySignals;
};
