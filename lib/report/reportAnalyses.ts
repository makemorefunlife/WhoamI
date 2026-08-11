import type { SupabaseClient } from "@supabase/supabase-js";
import { logServerError } from "@/lib/security/safeLog";

export const REPORT_ANALYSIS_TYPES = [
  "basic",
  "premium",
  "integrated",
  "relationship",
  "detailed_survey",
  "astrology",
  "deep_essence_structured",
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
    logServerError("reportAnalyses.read", error, "db_select_failed");
    return null;
  }

  const rows = data ?? [];
  if (rows.length === 0) return null;

  if (rows.length > 1) {
    const keepId = rows[0].id;
    logServerError("reportAnalyses.duplicate", undefined, "duplicate_rows");
    const staleIds = rows.slice(1).map((r) => r.id);
    if (staleIds.length > 0) {
      const { error: delErr } = await supabase
        .from("report_analyses")
        .delete()
        .in("id", staleIds);
      if (delErr) {
        logServerError("reportAnalyses.prune", delErr, "db_delete_failed");
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
    logServerError("reportAnalyses.write", error, "db_write_failed");
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
    logServerError("reportAnalyses.delete", error, "db_delete_failed");
  }
}

export type PersistedAnalysesBundle = {
  basic: string | null;
  integrated: string | null;
  detailed_survey: string | null;
  astrology: { content: string | null; metadata: Record<string, unknown> | null };
};

const BATCH_ANALYSIS_TYPES = [
  "basic",
  "integrated",
  "detailed_survey",
  "astrology",
] as const;

function pickLatestContent(
  rows: { analysis_type: string; content: string; updated_at: string }[],
  type: string,
): string | null {
  const match = rows
    .filter((r) => r.analysis_type === type)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0];
  const text = typeof match?.content === "string" ? match.content.trim() : "";
  return text || null;
}

/** report_analyses — basic/integrated/detailed_survey/astrology 1회 조회 */
export async function readPersistedAnalysesBatch(
  supabase: SupabaseClient,
  reportId: string,
): Promise<PersistedAnalysesBundle> {
  const { data, error } = await supabase
    .from("report_analyses")
    .select("analysis_type, content, metadata, updated_at")
    .eq("report_id", reportId)
    .in("analysis_type", [...BATCH_ANALYSIS_TYPES]);

  if (error) {
    logServerError("reportAnalyses.batch", error, "db_select_failed");
    return {
      basic: null,
      integrated: null,
      detailed_survey: null,
      astrology: { content: null, metadata: null },
    };
  }

  const rows = data ?? [];
  const astrologyRow = rows
    .filter((r) => r.analysis_type === "astrology")
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0];

  const basic = pickLatestContent(rows, "basic");

  const astroContent =
    typeof astrologyRow?.content === "string"
      ? astrologyRow.content.trim()
      : "";
  const astroMetadata =
    astrologyRow?.metadata && typeof astrologyRow.metadata === "object"
      ? (astrologyRow.metadata as Record<string, unknown>)
      : null;

  return {
    basic,
    integrated: pickLatestContent(rows, "integrated"),
    detailed_survey: pickLatestContent(rows, "detailed_survey"),
    astrology: {
      content: astroContent || null,
      metadata: astroMetadata,
    },
  };
}

export async function readPersistedBasicAnalysis(
  supabase: SupabaseClient,
  reportId: string,
): Promise<string | null> {
  return readReportAnalysis(supabase, reportId, "basic");
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
    logServerError("reportAnalyses.astrology", error, "db_select_failed");
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

/** Slim V1 "심화 통합 분석" (deep essence, Part 01~05 + 부록) — 전체 SlimV1ReportResult를 JSON 문자열로 저장 */
export async function readPersistedDeepEssenceAnalysis(
  supabase: SupabaseClient,
  reportId: string,
): Promise<string | null> {
  return readReportAnalysis(supabase, reportId, "deep_essence_structured");
}

export async function writePersistedDeepEssenceAnalysis(
  supabase: SupabaseClient,
  reportId: string,
  text: string,
  metadata?: Record<string, unknown> | null,
): Promise<boolean> {
  return writeReportAnalysis(supabase, reportId, "deep_essence_structured", text, metadata);
}
