import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type { RelationshipReportRow } from "@/lib/relationship/fetchReportsWhereParticipant";

/** Dev SSOT — no result_premium column */
export const RR_SELECT =
  "id, report_id_a, report_id_b, analysis_type, result_basic, result_premium_by_kind, relationship_kind";

/** @deprecated Use RR_SELECT */
export const RR_SELECT_FULL = RR_SELECT;

export function isMissingColumnError(
  error: PostgrestError | null | undefined,
): boolean {
  if (!error) return false;
  if (error.code === "42703" || error.code === "PGRST204") return true;
  return /does not exist|Could not find the .* column/i.test(error.message ?? "");
}

/** relationship_kind check 제약 — cohabitation 마이그레이션 전 DB */
export function isRelationshipKindCheckError(
  error: PostgrestError | null | undefined,
): boolean {
  if (!error) return false;
  if (error.code === "23514") return true;
  return /relationship_reports_relationship_kind_check|relationship_analysis_logs_relationship_kind_check/i.test(
    error.message ?? "",
  );
}

export function relationshipReportSelect(): string {
  return RR_SELECT;
}

function normalizeRow(row: Record<string, unknown>): RelationshipReportRow {
  return {
    id: String(row.id),
    report_id_a: String(row.report_id_a),
    report_id_b: String(row.report_id_b),
    analysis_type: String(row.analysis_type),
    result_basic: row.result_basic,
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
    data: (data ?? []).map((r) =>
      normalizeRow(r as unknown as Record<string, unknown>),
    ),
    error: null,
  };
}

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
  if (error) throw error;

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

  if (error) return { row: null, error };
  if (!data) return { row: null, error: null };

  return {
    row: normalizeRow(data as unknown as Record<string, unknown>),
    error: null,
  };
}

export async function fetchRelationshipReportsByIdsSafe(
  supabase: SupabaseClient,
  relationshipReportIds: string[],
): Promise<RelationshipReportRow[]> {
  const ids = [...new Set(relationshipReportIds.map((id) => id.trim()).filter(Boolean))];
  if (ids.length === 0) return [];

  const select = relationshipReportSelect();
  const { data, error } = await supabase
    .from("relationship_reports")
    .select(select)
    .in("id", ids);

  if (error) throw error;

  return (data ?? []).map((r) =>
    normalizeRow(r as unknown as Record<string, unknown>),
  );
}

/** Dev SSOT — single patch (no legacy result_premium fallback) */
export async function updateRelationshipReportSafe(
  supabase: SupabaseClient,
  relationshipReportId: string,
  patch: Record<string, unknown>,
): Promise<{ error: PostgrestError | null; usedLegacy: boolean }> {
  const updatedAt = new Date().toISOString();
  const { error } = await supabase
    .from("relationship_reports")
    .update({ ...patch, updated_at: updatedAt })
    .eq("id", relationshipReportId);

  if (
    error &&
    isRelationshipKindCheckError(error) &&
    "relationship_kind" in patch
  ) {
    const { relationship_kind: _omit, ...withoutKind } = patch;
    console.warn(
      "[relationship_reports] relationship_kind_check_fallback",
    );
    const { error: retryErr } = await supabase
      .from("relationship_reports")
      .update({ ...withoutKind, updated_at: updatedAt })
      .eq("id", relationshipReportId);
    return { error: retryErr, usedLegacy: false };
  }

  return { error, usedLegacy: false };
}

function isMissingRpcError(error: PostgrestError | null | undefined): boolean {
  if (!error) return false;
  if (error.code === "PGRST202" || error.code === "42883") return true;
  return /Could not find the function|function .* does not exist/i.test(
    error.message ?? "",
  );
}

/**
 * Atomically merge one kind into result_premium_by_kind (|| jsonb).
 * Falls back to re-read + JS merge if RPC migration is not applied yet.
 */
export async function mergeRelationshipPremiumByKind(
  supabase: SupabaseClient,
  relationshipReportId: string,
  kind: string,
  payload: unknown,
  options?: { relationshipKind?: string },
): Promise<{ error: PostgrestError | null }> {
  const relationshipKind = options?.relationshipKind ?? kind;
  const { error: rpcError } = await supabase.rpc(
    "merge_relationship_premium_by_kind",
    {
      p_relationship_report_id: relationshipReportId,
      p_kind: kind,
      p_payload: payload,
      p_relationship_kind: relationshipKind,
    },
  );

  if (!rpcError) return { error: null };
  if (!isMissingRpcError(rpcError)) return { error: rpcError };

  const { row, error: fetchErr } = await fetchRelationshipReportByIdSafe(
    supabase,
    relationshipReportId,
  );
  if (fetchErr) return { error: fetchErr };
  if (!row) {
    return {
      error: {
        message: "relationship report not found",
        details: "",
        hint: "",
        code: "PGRST116",
        name: "PostgrestError",
      } as PostgrestError,
    };
  }

  const prev =
    row.result_premium_by_kind &&
    typeof row.result_premium_by_kind === "object" &&
    !Array.isArray(row.result_premium_by_kind)
      ? (row.result_premium_by_kind as Record<string, unknown>)
      : {};
  const nextByKind = { ...prev, [kind]: payload };
  const { error: upErr } = await updateRelationshipReportSafe(
    supabase,
    relationshipReportId,
    {
      result_premium_by_kind: nextByKind,
      relationship_kind: relationshipKind,
    },
  );
  return { error: upErr };
}
