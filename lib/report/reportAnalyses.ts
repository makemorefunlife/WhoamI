import type { SupabaseClient } from "@supabase/supabase-js";

export const REPORT_ANALYSIS_TYPES = [
  "basic",
  "premium",
  "integrated",
  "relationship",
  "detailed_survey",
  "astrology",
] as const;

export type ReportAnalysisType = (typeof REPORT_ANALYSIS_TYPES)[number];

export type ReportAnalysisRow = {
  id: string;
  report_id: string;
  analysis_type: ReportAnalysisType;
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

/** report_analyses — analysis_type별 content 조회 (중복 행 시 최신 1건만) */
export async function readReportAnalysis(
  supabase: SupabaseClient,
  reportId: string,
  analysisType: ReportAnalysisType,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("report_analyses")
    .select("id, content, updated_at")
    .eq("report_id", reportId)
    .eq("analysis_type", analysisType)
    .order("updated_at", { ascending: false })
    .limit(5);

  if (error) {
    console.warn("readReportAnalysis:", analysisType, error.message);
    return null;
  }

  const rows = data ?? [];
  if (rows.length === 0) return null;

  if (rows.length > 1) {
    const keepId = rows[0].id;
    console.warn(
      "readReportAnalysis: duplicate rows",
      analysisType,
      reportId,
      `count=${rows.length}`,
    );
    const staleIds = rows.slice(1).map((r) => r.id);
    if (staleIds.length > 0) {
      const { error: delErr } = await supabase
        .from("report_analyses")
        .delete()
        .in("id", staleIds);
      if (delErr) {
        console.warn("readReportAnalysis: prune failed", delErr.message);
      }
    }
  }

  const text =
    typeof rows[0].content === "string" ? rows[0].content.trim() : "";
  return text || null;
}

/** upsert — 동일 report_id + analysis_type 은 덮어쓰지 않고 재사용(명시 삭제 전) */
export async function writeReportAnalysis(
  supabase: SupabaseClient,
  reportId: string,
  analysisType: ReportAnalysisType,
  content: string,
  metadata?: Record<string, unknown> | null,
): Promise<boolean> {
  const trimmed = content.trim();
  if (!trimmed) return false;

  const now = new Date().toISOString();
  const { error } = await supabase.from("report_analyses").upsert(
    {
      report_id: reportId,
      analysis_type: analysisType,
      content: trimmed,
      metadata: metadata ?? null,
      updated_at: now,
    },
    { onConflict: "report_id,analysis_type" },
  );

  if (error) {
    console.error("writeReportAnalysis:", analysisType, error.message);
    return false;
  }
  return true;
}

export async function deleteReportAnalysis(
  supabase: SupabaseClient,
  reportId: string,
  analysisType: ReportAnalysisType,
): Promise<void> {
  const { error } = await supabase
    .from("report_analyses")
    .delete()
    .eq("report_id", reportId)
    .eq("analysis_type", analysisType);

  if (error) {
    console.warn("deleteReportAnalysis:", analysisType, error.message);
  }
}

/** @deprecated report_results — 이전 캐시 폴백 */
export async function readLegacyBasicFromReportResults(
  supabase: SupabaseClient,
  reportId: string,
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("report_results")
      .select("analysis_result")
      .eq("report_id", reportId)
      .maybeSingle();
    if (error) return null;
    const text =
      typeof data?.analysis_result === "string"
        ? data.analysis_result.trim()
        : "";
    return text || null;
  } catch {
    return null;
  }
}

export async function readPersistedBasicAnalysis(
  supabase: SupabaseClient,
  reportId: string,
): Promise<string | null> {
  const fromAnalyses = await readReportAnalysis(supabase, reportId, "basic");
  if (fromAnalyses) return fromAnalyses;
  return readLegacyBasicFromReportResults(supabase, reportId);
}

export async function writePersistedBasicAnalysis(
  supabase: SupabaseClient,
  reportId: string,
  text: string,
  metadata?: Record<string, unknown> | null,
): Promise<boolean> {
  return writeReportAnalysis(supabase, reportId, "basic", text, metadata);
}

export async function readPersistedIntegratedAnalysis(
  supabase: SupabaseClient,
  reportId: string,
): Promise<string | null> {
  return readReportAnalysis(supabase, reportId, "integrated");
}

export async function writePersistedIntegratedAnalysis(
  supabase: SupabaseClient,
  reportId: string,
  text: string,
  metadata?: Record<string, unknown> | null,
): Promise<boolean> {
  return writeReportAnalysis(supabase, reportId, "integrated", text, metadata);
}

export async function readPersistedDetailedSurveyAnalysis(
  supabase: SupabaseClient,
  reportId: string,
): Promise<string | null> {
  return readReportAnalysis(supabase, reportId, "detailed_survey");
}

export async function writePersistedDetailedSurveyAnalysis(
  supabase: SupabaseClient,
  reportId: string,
  text: string,
  metadata?: Record<string, unknown> | null,
): Promise<boolean> {
  return writeReportAnalysis(supabase, reportId, "detailed_survey", text, metadata);
}

export async function readPersistedAstrologyAnalysis(
  supabase: SupabaseClient,
  reportId: string,
): Promise<string | null> {
  return readReportAnalysis(supabase, reportId, "astrology");
}

export async function readPersistedAstrologyAnalysisWithMeta(
  supabase: SupabaseClient,
  reportId: string,
): Promise<{
  content: string | null;
  metadata: Record<string, unknown> | null;
}> {
  const { data, error } = await supabase
    .from("report_analyses")
    .select("content, metadata, updated_at")
    .eq("report_id", reportId)
    .eq("analysis_type", "astrology")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn("readPersistedAstrologyAnalysisWithMeta:", error.message);
    return { content: null, metadata: null };
  }

  const content =
    typeof data?.content === "string" ? data.content.trim() : "";
  const metadata =
    data?.metadata && typeof data.metadata === "object"
      ? (data.metadata as Record<string, unknown>)
      : null;

  return { content: content || null, metadata };
}

export async function writePersistedAstrologyAnalysis(
  supabase: SupabaseClient,
  reportId: string,
  text: string,
  metadata?: Record<string, unknown> | null,
): Promise<boolean> {
  return writeReportAnalysis(supabase, reportId, "astrology", text, metadata);
}
