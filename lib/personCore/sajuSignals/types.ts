/** 4대 관계 도메인 통합 명리 신호 팩 — PersonCore bake-in SSOT */
export const DOMAIN_SAJU_SIGNALS_VERSION = "domain_saju_signals_v1" as const;

export type SajuRelationHitBrief = {
  type: string;
  counterpart_palace: "년주" | "월주" | "일주" | "시주";
  codes: string[];
  interpretation_ko: string | null;
};

export type IntensityBand3 = "low" | "medium" | "high";
export type DriveBand = "low" | "balanced" | "high";
export type StubbornBand = "flexible" | "balanced" | "stubborn";
export type IsolationBand = "bonded" | "balanced" | "lone_wolf";
export type ParentBondBand = "distant" | "balanced" | "smothering";
export type EconomicDominanceBand = "low" | "medium" | "high";

/** 부부/동거 — 일지·속궁합·재관 세력 */
export type CohabitationSajuSignals = {
  day_palace: {
    branch_code: string;
    harmony_hits: SajuRelationHitBrief[];
    tension_hits: SajuRelationHitBrief[];
    harmony_index: number;
    tension_index: number;
  };
  hidden_stem_intimacy: {
    day_stem_rooted_in_spouse_palace: boolean;
    stem_combine_links: Array<{
      hidden_stem_code: string;
      target_palace: "년주" | "월주" | "시주";
      combine_type: "천간합";
    }>;
    intimacy_index: number;
  };
  wealth_officer_power: {
    wealth_count: number;
    officer_count: number;
    wealth_officer_total: number;
    cfo_affinity_score: number;
    dual_power_risk: boolean;
    economic_dominance_band: EconomicDominanceBand;
  };
};

export type TenGodCategory = "self" | "food" | "wealth" | "officer" | "seal";

/** 동료 — 월주 격국·식상/비겁·문창/장성 */
export type WorkSajuSignals = {
  month_geokguk: {
    month_stem_ten_god_ko: string | null;
    month_stem_category: TenGodCategory;
    geokguk_label_ko: string;
    month_branch_element: string;
    day_master_element_support: boolean;
  };
  drive_stubborn: {
    food_count: number;
    self_count: number;
    food_intensity: number;
    self_intensity: number;
    drive_band: DriveBand;
    stubborn_band: StubbornBand;
  };
  literary_noble: {
    has_munchang_guin: boolean;
    has_jangseong_sal: boolean;
    has_cheoneul_guin: boolean;
    noble_star_hits: string[];
    work_support_index: number;
  };
};

/** 친구 — 년월 합충·조후·비겁 고립 */
export type FriendshipSajuSignals = {
  year_month_palace: {
    harmony_hits: SajuRelationHitBrief[];
    tension_hits: SajuRelationHitBrief[];
    social_surface_tension_index: number;
  };
  johu_profile: {
    heat_score: number;
    moisture_score: number;
    temperature_band: "cold" | "neutral" | "hot";
    dominant_element: "wood" | "fire" | "earth" | "metal" | "water";
  };
  bijie_isolation: {
    self_count: number;
    peer_cluster_score: number;
    isolation_score: number;
    isolation_band: IsolationBand;
  };
};

/** 가족 — 년주 카르마·인성·가내 형살 */
export type FamilySajuSignals = {
  year_karma: {
    year_branch_code: string;
    tension_hits: SajuRelationHitBrief[];
    karma_tension_index: number;
  };
  seal_parent: {
    seal_count: number;
    seal_excess: boolean;
    seal_isolated: boolean;
    parent_bond_band: ParentBondBand;
  };
  home_punishment: {
    punishment_hits: SajuRelationHitBrief[];
    punishment_count: number;
    family_conflict_index: number;
  };
};

export type ExpressionBand = "expressive" | "balanced" | "reserved";
export type ConflictBand = "principled" | "balanced" | "direct";
export type AffectionBand = "action_gift" | "balanced" | "emotional_care";
export type StressReactionBand = "explosive" | "steady" | "withdrawn";
export type DecisionBand = "independent" | "balanced" | "consultative";
export type CommunicationBand = "direct" | "balanced" | "considerate";

/**
 * 연인 — 표현/갈등/애정언어/스트레스/의사결정/소통 6축.
 * romanticSajuDeep LLM comparison_table(감정 표현·갈등 반응·애정 언어·
 * 스트레스 패턴·의사결정·소통 방식)과 1:1로 맞춰서, LLM에게 짜깁기 대신
 * 사람별로 실제로 다른 근거 있는 신호를 준다.
 */
export type RomanticSajuSignals = {
  expression_style: {
    food_count: number;
    expression_band: ExpressionBand;
  };
  conflict_response: {
    officer_count: number;
    food_count: number;
    day_branch_tension_hits: SajuRelationHitBrief[];
    conflict_band: ConflictBand;
  };
  affection_language: {
    wealth_count: number;
    seal_count: number;
    affection_band: AffectionBand;
  };
  stress_pattern: {
    heat_score: number;
    temperature_band: "cold" | "neutral" | "hot";
    stress_band: StressReactionBand;
  };
  decision_making: {
    strength_label: string;
    decision_band: DecisionBand;
  };
  communication_style: {
    self_count: number;
    seal_count: number;
    communication_band: CommunicationBand;
  };
};

export type DomainSajuSignalsPack = {
  schema_version: typeof DOMAIN_SAJU_SIGNALS_VERSION;
  engine_version: string;
  cohabitation_signals: CohabitationSajuSignals;
  work_signals: WorkSajuSignals;
  friendship_signals: FriendshipSajuSignals;
  family_signals: FamilySajuSignals;
  romantic_signals: RomanticSajuSignals;
};
