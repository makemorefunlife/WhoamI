/**
 * Batch 0 — Individual Saju SSOT architectural constants & deterministic rules.
 * Pure fact model: no metaphor / advice / narrative copy in the SSOT.
 */

export const INDIVIDUAL_SAJU_CHART_VERSION = "individual_saju_chart_v1" as const;

/** Engine that produces IndividualSajuChart (superset of calculateSajuBundle_v2). */
export const INDIVIDUAL_SAJU_ENGINE_ID = "individual_saju_chart_v1" as const;

/** Legacy engine id kept on saju_master_json dual-write. */
export const LEGACY_SAJU_ENGINE_ID = "calculateSajuBundle_v2" as const;

export const MANSERYEOK_PACKAGE = "@fullstackfamily/manseryeok@^1.0.8" as const;

/** Branch Ten God: 지지 정기(main) 지장간 천간으로 십성 산출. */
export const BRANCH_TEN_GOD_METHOD = "branch_main_hidden_stem_v1" as const;

/** 지장간 오행 가중 (surface 대비). */
export const HIDDEN_ELEMENT_WEIGHTS = {
  main: 1,
  middle: 0.5,
  residual: 0.25,
} as const;

export const HIDDEN_ELEMENT_WEIGHTING_METHOD =
  "hidden_layer_weights_v1" as const;

/** 개인 공망: 일주(일간+일지) 기준 旬空. */
export const GONGMANG_METHOD = "xunkong_by_day_pillar_v1" as const;

/** 신강약 — 기존 estimateStrengthBalance 와 동일 margin. */
export const STRENGTH_METHOD = "element_support_drain_v1" as const;
export const STRENGTH_MARGIN = 2 as const;

/** 통근 — 일지 지장간 일치 + 강운성. */
export const ROOTEDNESS_METHOD = "day_branch_hidden_and_strong_stage_v1" as const;

export const STRONG_TWELVE_STAGE_CODES = [
  "jangsaeng",
  "geollok",
  "jewang",
  "gwandae",
] as const;

/** 월령(계절) 득령 — 월지 오행 vs 일간 오행. */
export const SEASONAL_STRENGTH_METHOD = "month_branch_season_v1" as const;

/** 용희기신 휴리스틱 — 오행 약/강 후보. */
export const FAVORABLE_ELEMENTS_METHOD = "element_weak_strong_heuristic_v1" as const;

export const JOHU_METHOD = "element_ratio_v1" as const;

export const NOBLE_STAR_IDS = [
  "cheoneul_guin",
  "munchang_guin",
  "hakdang_guin",
  "woldeok_guin",
  "cheondeok_guin",
  "taegeuk_guin",
  "jaego_guin",
  "cheonnok_guin",
] as const;

export type NobleStarId = (typeof NOBLE_STAR_IDS)[number];

/** REF name_ko → stable noble id */
export const NOBLE_NAME_TO_ID: Record<string, NobleStarId> = {
  천을귀인: "cheoneul_guin",
  문창귀인: "munchang_guin",
  학당귀인: "hakdang_guin",
  월덕귀인: "woldeok_guin",
  천덕귀인: "cheondeok_guin",
  태극귀인: "taegeuk_guin",
  재고귀인: "jaego_guin",
  천록귀인: "cheonnok_guin",
};

export const SPECIAL_SIGNAL_IDS = [
  "dohwa",
  "yeokma",
  "wonjin",
  "guimun",
] as const;

export type SpecialSignalId = (typeof SPECIAL_SIGNAL_IDS)[number];

export const RELATION_TYPE_IDS = {
  천간합: "stem_combine",
  천간충: "stem_clash",
  육합: "branch_six_combine",
  삼합: "branch_three_combine",
  방합: "branch_direction_combine",
  충: "branch_clash",
  형: "branch_punishment",
  파: "branch_break",
  해: "branch_harm",
  원진: "wonjin",
  귀문: "guimun",
} as const;
