import { fetchLatestSurveyResponseId } from "../data/fetchPersonCoreSources";
import { PersonCoreError } from "../errors";
import type { PersonCoreBlueprint } from "../types/personCoreBlueprint";
import { getPersonCoreSupabase } from "../utils/getServerSupabase";

/**
 * `person_core_blueprints` — report_id 기준 upsert (1인 1스냅샷).
 */
export async function upsertPersonCoreBlueprint(
  blueprint: PersonCoreBlueprint,
): Promise<void> {
  const supabase = getPersonCoreSupabase();
  const reportId = blueprint.report_id.trim();
  if (!reportId) {
    throw new PersonCoreError("invalid_snapshot", "blueprint.report_id가 비어 있습니다.");
  }

  const sourceSurveyResponseId = await fetchLatestSurveyResponseId(
    supabase,
    reportId,
  );

  const now = new Date().toISOString();
  const { error } = await supabase.from("person_core_blueprints").upsert(
    {
      report_id: reportId,
      schema_version: blueprint.schema_version,
      input_fingerprint: blueprint.input_fingerprint,
      engine_version: blueprint.saju_master_json.engine_version,
      built_at: blueprint.built_at,
      user_meta: blueprint.user_meta,
      saju_master_json: blueprint.saju_master_json,
      psych_master_json: blueprint.psych_master_json,
      source_survey_response_id: sourceSurveyResponseId,
      updated_at: now,
    },
    { onConflict: "report_id" },
  );

  if (error) {
    throw new PersonCoreError(
      "invalid_snapshot",
      `person_core_blueprints upsert 실패: ${error.message}`,
    );
  }
}
