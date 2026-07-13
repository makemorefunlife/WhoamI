import type { SupabaseClient } from "@supabase/supabase-js";
import { PersonCoreError } from "../errors";

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
  return data as ReportRowForPersonCore;
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
  const { data, error } = await supabase
    .from("survey_responses")
    .select("id, answers")
    .eq("report_id", reportId)
    .order("id", { ascending: false })
    .limit(1);

  if (error) {
    console.error("personCore survey_responses select:", reportId, error.message);
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
  const { data, error } = await supabase
    .from("survey_responses")
    .select("id")
    .eq("report_id", reportId)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data?.id) return null;
  return String(data.id);
}
