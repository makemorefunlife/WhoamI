import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type { RelationshipReportRow } from "@/lib/relationship/fetchReportsWhereParticipant";

export const RR_SELECT_LEGACY =
  "id, report_id_a, report_id_b, analysis_type, result_basic, result_premium";

export const RR_SELECT_FULL = `${RR_SELECT_LEGACY}, result_premium_by_kind, relationship_kind`;

export function isMissingColumnError(
  error: PostgrestError | null | undefined,
): boolean {
  if (!error) return false;
  if (error.code === "42703" || error.code === "PGRST204") return true;
  return /does not exist|Could not find the .* column/i.test(error.message ?? "");
}

/** 프로세스당 한 번 감지 — 마이그레이션 미적용 DB */
let preferLegacySelect: boolean | null = null;

export function relationshipReportSelect(): string {
  if (preferLegacySelect === true) return RR_SELECT_LEGACY;
  return RR_SELECT_FULL;
}

function normalizeRow(row: Record<string, unknown>): RelationshipReportRow {
  return {
    id: String(row.id),
    report_id_a: String(row.report_id_a),
    report_id_b: String(row.report_id_b),
    analysis_type: String(row.analysis_type),
    result_basic: row.result_basic,
    result_premium: row.result_premium,
    result_premium_by_kind: row.result_premium_by_kind ?? {},
    relationship_kind: (row.relationship_kind as string) ?? "friendship",
  };
}

async function selectByReportSide(
  supabase: SupabaseClient,
  select: string,
  column: "report_id_a" | "report_id_b",
  reportId: string,
): Promise<{ data: RelationshipReportRow[]; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from("relationship_reports")
    .select(select)
    .eq(column, reportId);

  if (error) return { data: [], error };
  return {
    data: (data ?? []).map((r) => normalizeRow(r as Record<string, unknown>)),
    error: null,
  };
}

/** report_id_a / report_id_b 참여 행 — 신규 컬럼 없으면 legacy select 로 재시도 */
export async function fetchRelationshipReportRowsForReportIdSafe(
  supabase: SupabaseClient,
  reportId: string,
): Promise<RelationshipReportRow[]> {
  const select = relationshipReportSelect();
  const [aSide, bSide] = await Promise.all([
    selectByReportSide(supabase, select, "report_id_a", reportId),
    selectByReportSide(supabase, select, "report_id_b", reportId),
  ]);

  const error = aSide.error ?? bSide.error;
  if (error && isMissingColumnError(error) && preferLegacySelect !== true) {
    preferLegacySelect = true;
    console.warn(
      "[relationship_reports] 마이그레이션 미적용 — legacy 컬럼만 사용합니다. Supabase SQL Editor에서 supabase/APPLY_PENDING_MIGRATIONS.sql 실행을 권장합니다.",
    );
    return fetchRelationshipReportRowsForReportIdSafe(supabase, reportId);
  }

  if (error) throw error;
  if (preferLegacySelect === null) preferLegacySelect = false;

  const map = new Map<string, RelationshipReportRow>();
  for (const r of [...aSide.data, ...bSide.data]) {
    map.set(r.id, r);
  }
  return [...map.values()];
}

export async function fetchRelationshipReportByIdSafe(
  supabase: SupabaseClient,
  relationshipReportId: string,
): Promise<{ row: RelationshipReportRow | null; error: PostgrestError | null }> {
  const select = relationshipReportSelect();
  const { data, error } = await supabase
    .from("relationship_reports")
    .select(select)
    .eq("id", relationshipReportId)
    .maybeSingle();

  if (error && isMissingColumnError(error) && preferLegacySelect !== true) {
    preferLegacySelect = true;
    console.warn(
      "[relationship_reports] 마이그레이션 미적용 — legacy 컬럼만 사용합니다.",
    );
    return fetchRelationshipReportByIdSafe(supabase, relationshipReportId);
  }

  if (error) return { row: null, error };
  if (!data) return { row: null, error: null };
  if (preferLegacySelect === null) preferLegacySelect = false;

  return {
    row: normalizeRow(data as Record<string, unknown>),
    error: null,
  };
}

/** 신규 컬럼 업데이트 실패 시 legacy 컬럼(result_premium 등)만으로 재시도 */
export async function updateRelationshipReportSafe(
  supabase: SupabaseClient,
  relationshipReportId: string,
  fullPatch: Record<string, unknown>,
  legacyPatch: Record<string, unknown>,
): Promise<{ error: PostgrestError | null; usedLegacy: boolean }> {
  const updatedAt = new Date().toISOString();
  const { error } = await supabase
    .from("relationship_reports")
    .update({ ...fullPatch, updated_at: updatedAt })
    .eq("id", relationshipReportId);

  if (error && isMissingColumnError(error)) {
    preferLegacySelect = true;
    console.warn(
      "[relationship_reports] 마이그레이션 미적용 — result_premium(legacy)에 저장합니다.",
    );
    const { error: legacyErr } = await supabase
      .from("relationship_reports")
      .update({ ...legacyPatch, updated_at: updatedAt })
      .eq("id", relationshipReportId);
    return { error: legacyErr, usedLegacy: true };
  }

  return { error, usedLegacy: false };
}
