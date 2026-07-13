import { calculateSajuBundle } from "@/lib/v2/saju/calculateSajuBundle";
import { fetchLatestSurveyForPersonCore, fetchReportForPersonCore } from "../data/fetchPersonCoreSources";
import { PersonCoreError } from "../errors";
import { mapPsychMasterJson } from "../mappers/mapPsychMasterJson";
import { mapSajuBundleToMasterJson } from "../mappers/mapSajuMasterJson";
import {
  PERSON_CORE_BLUEPRINT_VERSION,
  USER_META_JSON_VERSION,
} from "../schemaVersion";
import type { PersonCoreBlueprint } from "../types/personCoreBlueprint";
import { buildInputFingerprint } from "../utils/fingerprint";
import { getPersonCoreSupabase } from "../utils/getServerSupabase";

function resolveDisplayName(reportName: string | null): string {
  const trimmed = reportName?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "나";
}

/**
 * reports + survey_responses → PersonCoreBlueprint (사주 1회 계산).
 * DB 스냅샷 저장은 `upsertPersonCoreBlueprint` — 레거시 파이프라인 미연결.
 */
export async function buildPersonCoreBlueprint(
  reportId: string,
): Promise<PersonCoreBlueprint> {
  const trimmedId = reportId.trim();
  if (!trimmedId) {
    throw new PersonCoreError("report_not_found", "reportId가 비어 있습니다.");
  }

  const supabase = getPersonCoreSupabase();
  const report = await fetchReportForPersonCore(supabase, trimmedId);
  const birthDate = report.birth_date?.trim();
  if (!birthDate) {
    throw new PersonCoreError(
      "birth_date_missing",
      "생년월일이 없어 PersonCore를 빌드할 수 없습니다.",
    );
  }

  const birthTimeUnknown = !report.birth_time?.trim();
  const bundle = calculateSajuBundle({
    birthDate,
    birthTime: report.birth_time,
    birthTimeUnknown,
  });

  if (!bundle?.saju?.dayPillar) {
    throw new PersonCoreError(
      "saju_calculation_failed",
      "사주 계산에 실패했습니다.",
    );
  }

  const surveyRow = await fetchLatestSurveyForPersonCore(supabase, trimmedId);
  const surveyAnswers = surveyRow?.answers ?? null;
  const displayName = resolveDisplayName(report.name);

  const saju_master_json = mapSajuBundleToMasterJson({
    bundle,
    birthDate,
    birthTime: report.birth_time,
    birthTimeUnknown,
  });

  const psych_master_json = mapPsychMasterJson({
    displayName,
    bundle,
    surveyAnswers,
  });

  const input_fingerprint = buildInputFingerprint({
    birth_date: birthDate,
    birth_time: report.birth_time,
    birth_time_unknown: birthTimeUnknown,
    surveyAnswers,
  });

  const built_at = new Date().toISOString();

  return {
    schema_version: PERSON_CORE_BLUEPRINT_VERSION,
    report_id: trimmedId,
    input_fingerprint,
    built_at,
    user_meta: {
      schema_version: USER_META_JSON_VERSION,
      report_id: trimmedId,
      display_name: displayName,
      clerk_user_id: report.clerk_user_id ?? null,
      report_name: report.name?.trim() || null,
    },
    saju_master_json,
    psych_master_json,
  };
}
