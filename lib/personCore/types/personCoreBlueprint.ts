import type { PERSON_CORE_BLUEPRINT_VERSION } from "../schemaVersion";
import type { PsychMasterJson } from "./psychMaster";
import type { SajuMasterJson } from "./sajuMaster";
import type { UserMetaJson } from "./userMeta";

/**
 * PersonCoreBlueprint — 1인 마스터 그릇.
 *
 * 전략: 기존 파이프라인 옆에 두고, `reportId` 단위로 1회 빌드 → DB 스냅샷 저장.
 * 레거시 `loadSajuBundleFromReport` / `getCurrentSelfProfileForReport` 는 2단계에서 이 객체로 이주.
 */
export type PersonCoreBlueprint = {
  schema_version: typeof PERSON_CORE_BLUEPRINT_VERSION;

  report_id: string;

  /**
   * 출생+설문 입력 fingerprint — 원본 변경 시 재빌드 트리거.
   * (birth_date|birth_time|survey answers stable hash)
   */
  input_fingerprint: string;

  built_at: string;

  user_meta: UserMetaJson;
  saju_master_json: SajuMasterJson;
  psych_master_json: PsychMasterJson;
};

/** DB 행 ↔ 도메인 객체 매핑용 (JSON 컬럼 3분할 저장) */
export type PersonCoreBlueprintRecord = {
  id: string;
  report_id: string;
  schema_version: string;
  input_fingerprint: string;
  engine_version: string;
  built_at: string;
  user_meta: UserMetaJson;
  saju_master_json: SajuMasterJson;
  psych_master_json: PsychMasterJson;
  source_survey_response_id: string | null;
  created_at: string;
  updated_at: string;
};
