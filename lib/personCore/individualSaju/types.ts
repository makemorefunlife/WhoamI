/**
 * IndividualSajuChart — pure fact model (individual_saju_chart_v1).
 * No metaphor / advice / strength·weakness prose / localized narrative.
 */

import type {
  BRANCH_TEN_GOD_METHOD,
  INDIVIDUAL_SAJU_CHART_VERSION,
  NobleStarId,
  SpecialSignalId,
} from "./constants";

export type PillarSlot = "year" | "month" | "day" | "hour";
export type ElementCode = "wood" | "fire" | "earth" | "metal" | "water";
export type YinYang = "yin" | "yang";
export type Season = "spring" | "summer" | "autumn" | "winter";
export type Confidence =
  | "deterministic"
  | "high"
  | "medium"
  | "low"
  | "heuristic";

export type TenGodCategory =
  | "self"
  | "food"
  | "wealth"
  | "officer"
  | "seal";

export type EvidenceRef = {
  kind:
    | "pillar"
    | "stem"
    | "branch"
    | "hidden_stem"
    | "relation"
    | "shinsal"
    | "rule"
    | "count"
    | "note";
  pillar_slot?: PillarSlot;
  codes: string[];
  detail: string;
};

/** Stable stem identity — copy lives in Reference Dictionary. */
export type StemRef = {
  code: string;
  element: ElementCode;
  yin_yang: YinYang;
  reference_id: string; // stem:{code}
};

export type BranchRef = {
  code: string;
  element: ElementCode;
  yin_yang: YinYang;
  season: Season | null;
  reference_id: string; // branch:{code}
};

export type TenGodRef = {
  code: string;
  category: TenGodCategory;
  reference_id: string; // ten_god:{code}
};

export type TwelveStageRef = {
  code: string;
  /** REF energy band token e.g. peak|falling — not narrative. */
  energy_level: string | null;
  reference_id: string; // twelve_stage:{code}
};

export type HiddenStemLayer = "main" | "middle" | "residual" | string;

export type HiddenStemFact = {
  pillar_slot: PillarSlot;
  branch_code: string;
  order: number;
  layer_type: HiddenStemLayer;
  stem: StemRef;
  ten_god: TenGodRef;
  reference_id: string; // hidden_stem:{branch}:{stem}:{layer}
};

export type PillarFact = {
  slot: PillarSlot;
  label_ko: "년주" | "월주" | "일주" | "시주";
  /** Deterministic eight-character glyph from manseryeok. */
  pillar_hangul: string;
  stem: StemRef;
  branch: BranchRef;
  stem_ten_god: TenGodRef;
  branch_ten_god: TenGodRef;
  branch_ten_god_method: typeof BRANCH_TEN_GOD_METHOD;
  twelve_stage: TwelveStageRef & { branch_code: string };
  hidden_stems: HiddenStemFact[];
};

export type DayMasterFact = {
  stem: StemRef;
  day_branch: BranchRef;
  day_pillar_hangul: string;
  element: ElementCode;
  yin_yang: YinYang;
};

export type ElementCounts = Record<ElementCode, number>;

export type FiveElementsFact = {
  surface_counts: ElementCounts;
  with_hidden_counts: ElementCounts;
  weighting_method: string;
  dominant: ElementCode;
  weakest: ElementCode;
  confidence: Confidence;
  evidence: EvidenceRef[];
};

export type JohuFact = {
  heat_score: number;
  moisture_score: number;
  temperature_band: "cold" | "neutral" | "hot";
  moisture_band: "dry" | "neutral" | "moist";
  method: string;
  confidence: Confidence;
  evidence: EvidenceRef[];
};

export type StrengthFact = {
  label_code: "strong" | "balanced" | "weak";
  /** Stable code mirror of legacy label family — not presentation copy. */
  label_token: "shin_gang" | "shin_yak" | "jung_hwa";
  support_score: number;
  drain_score: number;
  margin_used: number;
  method: string;
  engine_version: string;
  confidence: Confidence;
  evidence: EvidenceRef[];
};

export type RootednessFact = {
  day_stem_rooted_in_day_branch: boolean;
  root_hits: Array<{
    pillar_slot: PillarSlot;
    branch_code: string;
    hidden_stem_code: string;
    layer_type: HiddenStemLayer;
  }>;
  strong_stage_slots: PillarSlot[];
  rootedness_index: number;
  method: string;
  engine_version: string;
  confidence: Confidence;
  evidence: EvidenceRef[];
};

export type SeasonalStrengthFact = {
  month_branch_code: string;
  season: Season | null;
  in_season: boolean;
  season_score: number;
  method: string;
  engine_version: string;
  confidence: Confidence;
  evidence: EvidenceRef[];
};

export type FavorableElementsFact = {
  yongsin: ElementCode[];
  huisin: ElementCode[];
  gisin: ElementCode[];
  method: string;
  engine_version: string;
  confidence: Confidence;
  evidence: EvidenceRef[];
};

export type RelationFact = {
  /** Stable type id e.g. stem_combine, branch_clash */
  type_id: string;
  reference_id: string | null; // relation:{ref_id} when known
  priority: number;
  codes: string[];
  pillar_slots: PillarSlot[];
  evidence: EvidenceRef[];
};

export type GongmangFact = {
  void_branch_codes: string[];
  hit_pillars: Array<{ pillar_slot: PillarSlot; branch_code: string }>;
  method: string;
  engine_version: string;
  confidence: Confidence;
  evidence: EvidenceRef[];
};

export type ShinsalFact = {
  reference_id: string; // shinsal:{numeric_id}
  /** Stable slug from name — for indexes; display via dictionary. */
  slug: string;
  category: string | null;
  possessed: true;
  hit_codes: string[];
  evidence: EvidenceRef[];
};

export type NobleIndex = Record<NobleStarId, boolean> & {
  noble_hits: NobleStarId[];
};

export type SpecialSignalFact = {
  signal_id: SpecialSignalId | string;
  possessed: boolean;
  evidence: EvidenceRef[];
};

export type CalendarFact = {
  input_calendar: "gregorian";
  birth_local_date: string;
  birth_local_time: string;
  birth_time_unknown: boolean;
  lunar_date: string | null;
  solar_term: string | null;
  true_solar_time: string | null;
  timezone_offset_hours: number | null;
  place_affects_saju: false;
  notes: string[];
};

export type LuckCyclesFact = {
  gender_assumed: "male" | "female" | "unknown" | null;
  direction: "forward" | "backward" | null;
  major_cycles: unknown[];
  method: string;
  computed: boolean;
  confidence: Confidence;
  notes: string[];
};

export type ValidationFact = {
  ok: boolean;
  notes: string[];
  checks: Array<{ code: string; ok: boolean; detail: string }>;
};

export type EngineFact = {
  schema_version: typeof INDIVIDUAL_SAJU_CHART_VERSION;
  engine_id: string;
  manseryeok_package: string;
  ref_data_fingerprint: string;
  built_at: string;
  input_fingerprint: string;
};

export type IndividualSajuChart = {
  engine: EngineFact;
  birth: {
    report_id: string;
    birth_date: string;
    birth_time_raw: string | null;
    chart_time: string;
    birth_time_unknown: boolean;
  };
  calendar: CalendarFact;
  pillars: PillarFact[];
  day_master: DayMasterFact;
  five_elements: FiveElementsFact;
  johu: JohuFact;
  strength: StrengthFact;
  rootedness: RootednessFact;
  seasonal_strength: SeasonalStrengthFact;
  favorable_elements: FavorableElementsFact;
  relations_intra: RelationFact[];
  gongmang: GongmangFact;
  shinsal_hits: ShinsalFact[];
  nobles: NobleIndex;
  special_signals: SpecialSignalFact[];
  luck_cycles: LuckCyclesFact;
  validation: ValidationFact;
};
