import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type { RelationshipReportRow } from "@/lib/relationship/fetchReportsWhereParticipant";
import type { ResultPremiumByKind } from "@/lib/relationship/premiumByKind";
import { mergePremiumKindLocale } from "@/lib/relationship/premiumByKind";
import type { RelationshipKind } from "@/lib/relationship/relationshipKind";
import type { PremiumKindPayload } from "@/lib/relationship/premiumByKind";
import {
  compareStringTieBreakDesc,
  sortByIsoTimestampDesc,
} from "@/lib/relationship/sortByIsoTimestampDesc";

/** Dev SSOT — no result_premium column */
export const RR_SELECT =
  "id, report_id_a, report_id_b, analysis_type, result_basic, result_premium_by_kind, relationship_kind, created_at, premium_merge_version";

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
    created_at:
      typeof row.created_at === "string" && row.created_at.trim()
        ? row.created_at
        : null,
    premium_merge_version:
      typeof row.premium_merge_version === "number"
        ? row.premium_merge_version
        : Number(row.premium_merge_version) || 0,
  };
}

export function sortRelationshipRowsByCreatedAtDesc(
  rows: RelationshipReportRow[],
): RelationshipReportRow[] {
  return sortByIsoTimestampDesc(
    rows,
    (r) => r.created_at,
    (a, b) => compareStringTieBreakDesc(a.id, b.id),
  );
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
    .eq(column, reportId)
    .order("created_at", { ascending: false });

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
  return sortRelationshipRowsByCreatedAtDesc([...map.values()]);
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
 * Atomically merge one kind into result_premium_by_kind.
 * When `locale` is set, merges into `byLocale[locale]` without wiping other locales
 * (read–merge–write; RPC whole-kind replace is skipped so peer locales stay intact).
 * Without locale, keeps legacy RPC / flat-kind merge.
 */
/**
 * mergeRelationshipPremiumByKind's locale-path CAS retry budget + backoff.
 *
 * Live-tested against a real DB with 5 simultaneous writers to the same row
 * (all 5 relationship kinds generating at once): with no backoff, every
 * retry fires back-to-back in lockstep, so several writers keep colliding
 * with each other on each attempt — 3 retries was not enough headroom and
 * one writer exhausted its budget. A small random jitter between attempts
 * fixes this by spreading retries out in time instead of them all racing
 * again immediately; 6 attempts gives comfortable headroom even for this
 * unrealistic worst case (real usage is at most 2-3 concurrent kinds).
 */
const MAX_PREMIUM_MERGE_ATTEMPTS = 6;
const PREMIUM_MERGE_RETRY_BASE_DELAY_MS = 25;

function premiumMergeRetryDelayMs(attempt: number): number {
  const jitter = Math.random() * PREMIUM_MERGE_RETRY_BASE_DELAY_MS;
  return attempt * PREMIUM_MERGE_RETRY_BASE_DELAY_MS + jitter;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function notFoundError(): PostgrestError {
  return {
    message: "relationship report not found",
    details: "",
    hint: "",
    code: "PGRST116",
    name: "PostgrestError",
  } as PostgrestError;
}

function casConflictError(): PostgrestError {
  return {
    message: "premium merge conflict — max retries exceeded",
    details: "",
    hint: "",
    code: "PGRST_CAS_CONFLICT",
    name: "PostgrestError",
  } as PostgrestError;
}

export async function mergeRelationshipPremiumByKind(
  supabase: SupabaseClient,
  relationshipReportId: string,
  kind: string,
  payload: unknown,
  options?: { relationshipKind?: string; locale?: string },
): Promise<{ error: PostgrestError | null }> {
  const relationshipKind = options?.relationshipKind ?? kind;
  const locale = options?.locale?.trim();

  if (locale) {
    // Optimistic-concurrency CAS: read result_premium_by_kind + its version,
    // merge in JS (unchanged mergePremiumKindLocale — no shape-behavior
    // change), then write conditionally on that exact version. A 0-row
    // result means another request's write landed first (this row shares
    // one JSONB column across all 5 kinds x 2 locales, so two different
    // kinds/locales can legitimately race on it) — re-fetch and retry
    // rather than silently discarding either write.
    for (let attempt = 0; attempt < MAX_PREMIUM_MERGE_ATTEMPTS; attempt++) {
      const { row, error: fetchErr } = await fetchRelationshipReportByIdSafe(
        supabase,
        relationshipReportId,
      );
      if (fetchErr) return { error: fetchErr };
      if (!row) return { error: notFoundError() };

      const prev =
        row.result_premium_by_kind &&
        typeof row.result_premium_by_kind === "object" &&
        !Array.isArray(row.result_premium_by_kind)
          ? (row.result_premium_by_kind as ResultPremiumByKind)
          : {};

      const nextByKind = mergePremiumKindLocale(
        prev,
        kind as RelationshipKind,
        locale,
        payload as PremiumKindPayload,
      );
      const expectedVersion = row.premium_merge_version ?? 0;
      const updatedAt = new Date().toISOString();

      const { data, error: upErr } = await supabase
        .from("relationship_reports")
        .update({
          result_premium_by_kind: nextByKind,
          relationship_kind: relationshipKind,
          updated_at: updatedAt,
          premium_merge_version: expectedVersion + 1,
        })
        .eq("id", relationshipReportId)
        .eq("premium_merge_version", expectedVersion)
        .select("id")
        .maybeSingle();

      if (upErr) {
        // Same legacy check-constraint fallback updateRelationshipReportSafe
        // uses elsewhere: some older DBs reject relationship_kind values —
        // drop it and retry the same CAS write once.
        if (isRelationshipKindCheckError(upErr)) {
          const { data: retryData, error: retryErr } = await supabase
            .from("relationship_reports")
            .update({
              result_premium_by_kind: nextByKind,
              updated_at: updatedAt,
              premium_merge_version: expectedVersion + 1,
            })
            .eq("id", relationshipReportId)
            .eq("premium_merge_version", expectedVersion)
            .select("id")
            .maybeSingle();
          if (retryErr) return { error: retryErr };
          if (retryData?.id) return { error: null };
          // else: version conflict under the fallback shape too — fall through to retry.
        } else {
          return { error: upErr };
        }
      } else if (data?.id) {
        return { error: null };
      }
      // data is null, no error: 0 rows matched premium_merge_version — CAS
      // conflict, another write landed between our fetch and update. Back
      // off with jitter before retrying so concurrent writers spread out
      // instead of colliding again on the very next attempt in lockstep.
      if (attempt < MAX_PREMIUM_MERGE_ATTEMPTS - 1) {
        await sleep(premiumMergeRetryDelayMs(attempt));
      }
    }
    return { error: casConflictError() };
  }

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
