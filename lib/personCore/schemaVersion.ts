/** PersonCoreBlueprint 최상위 스키마 버전 — DB·JSON 공통 */
export const PERSON_CORE_BLUEPRINT_VERSION = "person_core_blueprint_v1" as const;

export const SAJU_MASTER_JSON_VERSION = "saju_master_v1" as const;

export const PSYCH_MASTER_JSON_VERSION = "psych_master_v1" as const;

export const USER_META_JSON_VERSION = "user_meta_v1" as const;

/** 만세력 엔진 식별자 (calculateSajuBundle 경로) */
export const SAJU_ENGINE_VERSION = "calculateSajuBundle_v2" as const;

export type PersonCoreBlueprintVersion =
  typeof PERSON_CORE_BLUEPRINT_VERSION;
