import type { SupabaseClient } from "@supabase/supabase-js";
import { logServerError } from "@/lib/security/safeLog";
import { PersonCoreError } from "../errors";
import { profileSourceReportId } from "@/lib/account/profileGroup";

export type ReportRowForPersonCore = {
  id: string;
  name: string | null;
  clerk_user_id: string | null;
  birth_date: string | null;
  birth_time: string | null;
};

export type SurveyRowForPersonCore = {
  id: string;
  answers: Record<string, unknown>;
};

export async function fetchReportForPersonCore(
  supabase: SupabaseClient,
  reportId: string,
): Promise<ReportRowForPersonCore> {
  const { data, error } = await supabase
    .from("reports")
    .select("id, name, clerk_user_id, birth_date, birth_time")
    .eq("id", reportId)
    .maybeSingle();

  if (error) {
    throw new PersonCoreError(
      "report_not_found",
      `reports 조회 실패: ${error.message}`,
    );
  }
  if (!data) {
    throw new PersonCoreError(
      "report_not_found",
      `report를 찾을 수 없습니다: ${reportId}`,
    );
  }
  const row = data as ReportRowForPersonCore;
  // A grouped self report describes the person with the main report's saved
  // birth details (lib/account/profileGroup.ts). id/name/owner stay its own.
  const sourceId = await profileSourceReportId(supabase, reportId);
  if (sourceId !== row.id) {
    const { data: src, error: srcErr } = await supabase
      .from("reports")
      .select("birth_date, birth_time")
      .eq("id", sourceId)
      .maybeSingle();
    if (!srcErr && src) {
      const b = src as { birth_date: string | null; birth_time: string | null };
      return { ...row, birth_date: b.birth_date, birth_time: b.birth_time };
    }
  }
  return row;
}

function parseSurveyAnswers(raw: unknown): Record<string, unknown> | null {
  if (raw == null) return null;
  let answers: unknown = raw;
  if (typeof answers === "string") {
    try {
      answers = JSON.parse(answers) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
    return null;
  }
  return answers as Record<string, unknown>;
}

export async function fetchLatestSurveyForPersonCore(
  supabase: SupabaseClient,
  reportId: string,
): Promise<SurveyRowForPersonCore | null> {
  const sourceId = await profileSourceReportId(supabase, reportId);
  const { data, error } = await supabase
    .from("survey_responses")
    .select("id, answers")
    .eq("report_id", sourceId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false }) // uuid ids are random: newest = created_at
    .limit(1);

  if (error) {
    logServerError("personCore.survey_select", error, "db_select_failed");
    return null;
  }

  const row = data?.[0];
  if (!row?.answers) return null;
  const answers = parseSurveyAnswers(row.answers);
  if (!answers) return null;

  return { id: String(row.id), answers };
}

export async function fetchLatestSurveyResponseId(
  supabase: SupabaseClient,
  reportId: string,
): Promise<string | null> {
  const sourceId = await profileSourceReportId(supabase, reportId);
  const { data, error } = await supabase
    .from("survey_responses")
    .select("id")
    .eq("report_id", sourceId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false }) // uuid ids are random: newest = created_at
    .limit(1)
    .maybeSingle();

  if (error || !data?.id) return null;
  return String(data.id);
}
