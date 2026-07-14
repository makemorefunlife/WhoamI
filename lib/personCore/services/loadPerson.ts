import { PersonCoreError } from "../errors";
import { logServerError } from "@/lib/security/safeLog";
import {
  PERSON_CORE_BLUEPRINT_VERSION,
  PSYCH_MASTER_JSON_VERSION,
  SAJU_MASTER_JSON_VERSION,
  USER_META_JSON_VERSION,
} from "../schemaVersion";
import type { PersonCoreBlueprint } from "../types/personCoreBlueprint";
import type { PsychMasterJson } from "../types/psychMaster";
import type { SajuMasterJson } from "../types/sajuMaster";
import type { UserMetaJson } from "../types/userMeta";
import { getPersonCoreSupabase } from "../utils/getServerSupabase";

function isRecord(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

function parseBlueprintRow(row: Record<string, unknown>): PersonCoreBlueprint | null {
  const reportId = typeof row.report_id === "string" ? row.report_id.trim() : "";
  if (!reportId) return null;

  const userMeta = row.user_meta;
  const saju = row.saju_master_json;
  const psych = row.psych_master_json;

  if (!isRecord(userMeta) || !isRecord(saju) || !isRecord(psych)) return null;

  if (userMeta.schema_version !== USER_META_JSON_VERSION) return null;
  if (saju.schema_version !== SAJU_MASTER_JSON_VERSION) return null;
  if (psych.schema_version !== PSYCH_MASTER_JSON_VERSION) return null;

  const inputFingerprint =
    typeof row.input_fingerprint === "string" ? row.input_fingerprint : "";
  const builtAt =
    typeof row.built_at === "string"
      ? row.built_at
      : typeof row.updated_at === "string"
        ? row.updated_at
        : new Date().toISOString();

  if (!inputFingerprint) return null;

  return {
    schema_version: PERSON_CORE_BLUEPRINT_VERSION,
    report_id: reportId,
    input_fingerprint: inputFingerprint,
    built_at: builtAt,
    user_meta: userMeta as UserMetaJson,
    saju_master_json: saju as SajuMasterJson,
    psych_master_json: psych as PsychMasterJson,
  };
}

/**
 * PersonCore SSOT 로더 — `person_core_blueprints` 단일 SELECT.
 * 스냅샷 없으면 null (레거시 폴백 없음).
 */
export async function loadPerson(
  reportId: string,
): Promise<PersonCoreBlueprint | null> {
  const trimmedId = reportId.trim();
  if (!trimmedId) return null;

  const supabase = getPersonCoreSupabase();
  const { data, error } = await supabase
    .from("person_core_blueprints")
    .select(
      "report_id, schema_version, input_fingerprint, built_at, updated_at, user_meta, saju_master_json, psych_master_json",
    )
    .eq("report_id", trimmedId)
    .maybeSingle();

  if (error) {
    logServerError("personCore.loadPerson", error, "db_select_failed");
    return null;
  }
  if (!data) return null;

  return parseBlueprintRow(data as Record<string, unknown>);
}
