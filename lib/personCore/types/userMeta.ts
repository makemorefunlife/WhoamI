import type { USER_META_JSON_VERSION } from "../schemaVersion";

/**
 * 표시·계정 메타 — `reports.name` + Clerk 귀속.
 * viewer-first 보정 전 원본 스냅샷.
 */
export type UserMetaJson = {
  schema_version: typeof USER_META_JSON_VERSION;

  report_id: string;
  display_name: string;
  clerk_user_id: string | null;

  /** reports.name 과 동일 스냅샷 (수동 파트너·친구 이름 등) */
  report_name: string | null;
};
