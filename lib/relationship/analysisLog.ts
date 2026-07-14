import type { SupabaseClient } from "@supabase/supabase-js";
import { logServerError } from "@/lib/security/safeLog";
import { ROMANTIC_SAJU_DEEP_FORMAT } from "@/lib/prompts/relationshipPremium/romanticSajuDeep";
import { COHABITATION_DEEP_FORMAT } from "@/lib/prompts/relationshipPremium/cohabitation";
import { WORK_COLLEAGUE_DEEP_FORMAT } from "@/lib/prompts/relationshipPremium/workColleague";
import { FAMILY_PARENT_CHILD_DEEP_FORMAT } from "@/lib/prompts/relationshipPremium/familyParentChild";
import { FRIEND_SOCIAL_DEEP_FORMAT } from "@/lib/prompts/relationshipPremium/friendSocial";
import {
  parseRelationshipKind,
  isRelationshipKind,
  type RelationshipKind,
} from "@/lib/relationship/relationshipKind";
import { isRelationshipKindCheckError } from "@/lib/relationship/relationshipReportQuery";

const DEEP_REPORT_FORMATS = new Set<string>([
  ROMANTIC_SAJU_DEEP_FORMAT,
  WORK_COLLEAGUE_DEEP_FORMAT,
  COHABITATION_DEEP_FORMAT,
  FAMILY_PARENT_CHILD_DEEP_FORMAT,
  FRIEND_SOCIAL_DEEP_FORMAT,
]);

export type AnalysisLogLevel = "basic" | "premium";

export type AnalysisLogRow = {
  id: string;
  relationship_report_id: string;
  viewer_report_id: string;
  relationship_kind: RelationshipKind | "unspecified";
  analysis_level: AnalysisLogLevel;
  result_format: string;
  result_snapshot: Record<string, unknown>;
  created_at: string;
};

function buildLogSummary(
  resultFormat: string,
  snapshot: Record<string, unknown>,
): { title: string; subtitle: string } {
  if (resultFormat === ROMANTIC_SAJU_DEEP_FORMAT) {
    const report = snapshot.report as {
      section_1_summary?: {
        relationship_name?: string;
        one_line_summary?: string;
      };
    } | undefined;
    const s1 = report?.section_1_summary;
    return {
      title: s1?.relationship_name?.trim() || "연인 사주 심화",
      subtitle: s1?.one_line_summary?.trim() || "",
    };
  }
  if (resultFormat === WORK_COLLEAGUE_DEEP_FORMAT) {
    const report = snapshot.report as {
      headline?: string;
      summary_line?: string;
    } | undefined;
    return {
      title: report?.headline?.trim() || "동료 심화 분석",
      subtitle: report?.summary_line?.trim() || "",
    };
  }
  if (resultFormat === COHABITATION_DEEP_FORMAT) {
    const report = snapshot.report as {
      headline?: string;
      summary_line?: string;
    } | undefined;
    return {
      title: report?.headline?.trim() || "동거·결혼 심화 분석",
      subtitle: report?.summary_line?.trim() || "",
    };
  }
  if (resultFormat === FRIEND_SOCIAL_DEEP_FORMAT) {
    const report = snapshot.report as {
      headline?: string;
      summary_line?: string;
      one_line_friendship?: string;
    } | undefined;
    return {
      title: report?.headline?.trim() || "친구 Social DNA 분석",
      subtitle:
        report?.summary_line?.trim() ||
        report?.one_line_friendship?.trim() ||
        "",
    };
  }
  if (resultFormat === FAMILY_PARENT_CHILD_DEEP_FORMAT) {
    const report = snapshot.report as {
      headline?: string;
      summary_line?: string;
      one_line_family?: string;
    } | undefined;
    return {
      title: report?.headline?.trim() || "가족 Child DNA 분석",
      subtitle:
        report?.summary_line?.trim() || report?.one_line_family?.trim() || "",
    };
  }
  return {
    title: "관계 기본 분석",
    subtitle: "네 가지 관점으로 정리한 결과",
  };
}

export function buildAnalysisLogSnapshot(params: {
  resultFormat: string;
  payload: unknown;
  viewerReportId: string;
}): Record<string, unknown> {
  const { resultFormat, payload, viewerReportId } = params;
  const base = {
    viewer_report_id: viewerReportId,
    saved_at: new Date().toISOString(),
  };

  // All deep kinds share { format, report } — extract report for replay.
  // (Previously friendship/family fell through to perspectives-only and lost the deep body.)
  if (DEEP_REPORT_FORMATS.has(resultFormat)) {
    const p = payload as { report?: unknown };
    return { ...base, report: p.report ?? p };
  }

  const p = payload as { perspectives?: Record<string, unknown> };
  const slice = p.perspectives?.[viewerReportId] ?? null;
  return { ...base, perspective: slice, full: p };
}

export async function insertRelationshipAnalysisLog(
  supabase: SupabaseClient,
  params: {
    relationshipReportId: string;
    viewerReportId: string;
    relationshipKind: RelationshipKind | "unspecified";
    analysisLevel: AnalysisLogLevel;
    resultFormat: string;
    payload: unknown;
  },
): Promise<string | null> {
  const viewerReportId = params.viewerReportId.trim();
  if (!viewerReportId) return null;

  const snapshot = buildAnalysisLogSnapshot({
    resultFormat: params.resultFormat,
    payload: params.payload,
    viewerReportId,
  });

  const insertRow = (relationshipKind: RelationshipKind | "unspecified") =>
    supabase
      .from("relationship_analysis_logs")
      .insert({
        relationship_report_id: params.relationshipReportId,
        viewer_report_id: viewerReportId,
        relationship_kind: relationshipKind,
        analysis_level: params.analysisLevel,
        result_format: params.resultFormat,
        result_snapshot: snapshot,
      })
      .select("id")
      .maybeSingle();

  let { data, error } = await insertRow(params.relationshipKind);

  if (error && isRelationshipKindCheckError(error)) {
    console.warn(
      "[relationship_analysis_logs] relationship_kind check 제약 — unspecified로 기록합니다.",
    );
    ({ data, error } = await insertRow("unspecified"));
  }

  if (error) {
    logServerError("analysisLog.insert", error, "db_insert_failed");
    return null;
  }
  return data?.id ?? null;
}

export async function listRelationshipAnalysisLogs(
  supabase: SupabaseClient,
  relationshipReportId: string,
  viewerReportId: string,
  limit = 30,
  offset = 0,
): Promise<
  (AnalysisLogRow & { summary_title: string; summary_subtitle: string })[]
> {
  const safeLimit = Math.max(1, Math.min(100, limit));
  const safeOffset = Math.max(0, offset);
  const rangeEnd = safeOffset + safeLimit - 1;
  const { data, error } = await supabase
    .from("relationship_analysis_logs")
    .select(
      "id, relationship_report_id, viewer_report_id, relationship_kind, analysis_level, result_format, result_snapshot, created_at",
    )
    .eq("relationship_report_id", relationshipReportId)
    .eq("viewer_report_id", viewerReportId)
    .order("created_at", { ascending: false })
    .range(safeOffset, rangeEnd);

  if (error) {
    logServerError("analysisLog.list", error, "db_select_failed");
    return [];
  }

  return (data ?? []).map((row) => {
    const snap = (row.result_snapshot ?? {}) as Record<string, unknown>;
    const summary = buildLogSummary(row.result_format, snap);
    return {
      ...(row as AnalysisLogRow),
      relationship_kind: isRelationshipKind(row.relationship_kind)
        ? row.relationship_kind
        : "unspecified",
      summary_title: summary.title,
      summary_subtitle: summary.subtitle,
    };
  });
}

export async function fetchFavoriteRelationshipIds(
  supabase: SupabaseClient,
  viewerReportId: string,
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("relationship_favorites")
    .select("relationship_report_id")
    .eq("viewer_report_id", viewerReportId);

  if (error) {
    if (error.code === "42P01") return new Set();
    logServerError("favorites.list", error, "db_select_failed");
    return new Set();
  }
  return new Set((data ?? []).map((r) => r.relationship_report_id as string));
}

export async function isRelationshipFavorite(
  supabase: SupabaseClient,
  viewerReportId: string,
  relationshipReportId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("relationship_favorites")
    .select("relationship_report_id")
    .eq("viewer_report_id", viewerReportId)
    .eq("relationship_report_id", relationshipReportId)
    .maybeSingle();

  if (error) return false;
  return Boolean(data);
}

export async function setRelationshipFavorite(
  supabase: SupabaseClient,
  viewerReportId: string,
  relationshipReportId: string,
  favorited: boolean,
): Promise<boolean> {
  if (favorited) {
    const { error } = await supabase.from("relationship_favorites").upsert(
      {
        viewer_report_id: viewerReportId,
        relationship_report_id: relationshipReportId,
      },
      { onConflict: "viewer_report_id,relationship_report_id" },
    );
    if (error) {
      logServerError("favorites.upsert", error, "db_upsert_failed");
      return false;
    }
    return true;
  }

  const { error } = await supabase
    .from("relationship_favorites")
    .delete()
    .eq("viewer_report_id", viewerReportId)
    .eq("relationship_report_id", relationshipReportId);

  if (error) {
    logServerError("favorites.delete", error, "db_delete_failed");
    return false;
  }
  return true;
}
