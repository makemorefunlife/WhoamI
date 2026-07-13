import type { SecondaryAxisKey } from "@/lib/v2/survey/types";
import type { PSYCH_MASTER_JSON_VERSION } from "../schemaVersion";

/** 11축 psych — 0~100 확정 점수 (설문 완료 시) */
export type PsychSecondaryAxesScores = Record<SecondaryAxisKey, number>;

/**
 * 홈라이프 DNA 성향 태그 — `buildHomeLifeDnaProfile` 산출물의 스냅샷.
 * (동거·결혼 도메인용; 생성 시 saju+십성에서 파생되어 psych와 함께 bake-in)
 */
export type HomeLifeFamilyCategory =
  | "wealth"
  | "officer"
  | "food"
  | "seal"
  | "self"
  | "balanced";

export type HomeLifeDnaTags = {
  lifestyle_title: string;
  family_identity_category: HomeLifeFamilyCategory;
  family_identity_line: string;
  life_values_line: string;
  private_home_self_line: string;
  energy_battery_line: string;
};

export type PsychSurveySource =
  | "v2_10q"
  | "manual_neutral"
  | "incomplete";

/**
 * 설문 11축 + 홈라이프 DNA 태그 스냅샷.
 * 원본 SSOT는 `survey_responses.answers` — 이 JSON은 재계산 방지용 캐시.
 */
export type PsychMasterJson = {
  schema_version: typeof PSYCH_MASTER_JSON_VERSION;

  secondary_axes: PsychSecondaryAxesScores;

  survey_source: PsychSurveySource;
  survey_completed_at: string | null;

  /** 설문 원본 fingerprint (answers hash) — 무효화 판단용 */
  survey_input_fingerprint: string | null;

  home_life_dna: HomeLifeDnaTags;
};
