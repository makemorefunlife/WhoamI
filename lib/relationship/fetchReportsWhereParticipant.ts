import type { SupabaseClient } from "@supabase/supabase-js";
import { logServerError } from "@/lib/security/safeLog";
import {
  fetchRelationshipReportRowsForReportIdSafe,
  fetchRelationshipReportsByIdsSafe,
  sortRelationshipRowsByCreatedAtDesc,
} from "@/lib/relationship/relationshipReportQuery";

/** relationship_reports 한 행 (조회용) */
export type RelationshipReportRow = {
  id: string;
  report_id_a: string;
  report_id_b: string;
  analysis_type: string;
  result_basic: unknown;
  result_premium_by_kind?: unknown;
  relationship_kind?: string | null;
  /** CAS version for mergeRelationshipPremiumByKind's optimistic-concurrency retry. */
  premium_merge_version?: number;
  /** 친구 추가(=관계 행 생성) 시각 — 허브 목록 정렬용 */
  created_at?: string | null;
};

/**
 * 내 report_id가 A 또는 B인 관계 행을 모두 가져옴.
 * `.or(report_id_a.eq.x,report_id_b.eq.x)` 대신 두 번 조회해 합치면
 * 일부 환경/데이터에서 한쪽만 매칭되는 문제를 피할 수 있음.
 */
export async function fetchRelationshipReportRowsForReportId(
  supabase: SupabaseClient,
  reportId: string,
): Promise<RelationshipReportRow[]> {
  return fetchRelationshipReportRowsForReportIdSafe(supabase, reportId);
}

function collectMissingInviteReportIds(
  rows: RelationshipReportRow[],
  inviteRows: { relationship_report_id: string | null }[] | null | undefined,
): string[] {
  const seen = new Set(rows.map((r) => r.id));
  const missing: string[] = [];
  for (const inv of inviteRows ?? []) {
    const rrId = inv.relationship_report_id?.trim();
    if (!rrId || seen.has(rrId)) continue;
    seen.add(rrId);
    missing.push(rrId);
  }
  return missing;
}

/**
 * 관계 허브 — 현재 reportId 참여 관계 + invite로만 연결된 행 보강.
 * outbound/inbound invite 조회와 누락 행 batch fetch를 병렬로 처리한다.
 */
export async function fetchRelationshipReportRowsForHub(
  supabase: SupabaseClient,
  reportId: string,
): Promise<RelationshipReportRow[]> {
  const [primary, outboundInvites, inboundInvites] = await Promise.all([
    fetchRelationshipReportRowsForReportId(supabase, reportId),
    supabase
      .from("invites")
      .select("relationship_report_id")
      .eq("from_report_id", reportId)
      .not("relationship_report_id", "is", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("invites")
      .select("relationship_report_id")
      .eq("accepted_report_id", reportId)
      .neq("from_report_id", reportId)
      .not("relationship_report_id", "is", null)
      .order("created_at", { ascending: false }),
  ]);

  if (outboundInvites.error) {
    logServerError("fetchParticipant.outbound", outboundInvites.error, "db_select_failed");
  }
  if (inboundInvites.error) {
    logServerError("fetchParticipant.inbound", inboundInvites.error, "db_select_failed");
  }

  const missingIds = [
    ...collectMissingInviteReportIds(primary, outboundInvites.data),
    ...collectMissingInviteReportIds(primary, inboundInvites.data),
  ];

  if (missingIds.length === 0) {
    return primary;
  }

  const extra = await fetchRelationshipReportsByIdsSafe(supabase, missingIds);
  const map = new Map(primary.map((r) => [r.id, r]));
  for (const row of extra) {
    map.set(row.id, row);
  }
  return sortRelationshipRowsByCreatedAtDesc([...map.values()]);
}

/**
 * @deprecated fetchRelationshipReportRowsForHub가 병렬·batch로 처리합니다.
 */
export async function mergeRelationshipRowsFromOutboundInvites(
  supabase: SupabaseClient,
  fromReportId: string,
  rows: RelationshipReportRow[],
): Promise<RelationshipReportRow[]> {
  const { data, error } = await supabase
    .from("invites")
    .select("relationship_report_id")
    .eq("from_report_id", fromReportId)
    .not("relationship_report_id", "is", null)
    .order("created_at", { ascending: false });

  if (error) {
    logServerError("fetchParticipant.outbound", error, "db_select_failed");
    return rows;
  }

  const missingIds = collectMissingInviteReportIds(rows, data);
  if (missingIds.length === 0) return rows;

  const extra = await fetchRelationshipReportsByIdsSafe(supabase, missingIds);
  const map = new Map(rows.map((r) => [r.id, r]));
  for (const row of extra) {
    map.set(row.id, row);
  }
  return [...map.values()];
}

/**
 * @deprecated fetchRelationshipReportRowsForHub가 병렬·batch로 처리합니다.
 */
export async function mergeRelationshipRowsFromInboundInvites(
  supabase: SupabaseClient,
  myReportId: string,
  rows: RelationshipReportRow[],
): Promise<RelationshipReportRow[]> {
  const { data, error } = await supabase
    .from("invites")
    .select("relationship_report_id")
    .eq("accepted_report_id", myReportId)
    .neq("from_report_id", myReportId)
    .not("relationship_report_id", "is", null)
    .order("created_at", { ascending: false });

  if (error) {
    logServerError("fetchParticipant.inbound", error, "db_select_failed");
    return rows;
  }

  const missingIds = collectMissingInviteReportIds(rows, data);
  if (missingIds.length === 0) return rows;

  const extra = await fetchRelationshipReportsByIdsSafe(supabase, missingIds);
  const map = new Map(rows.map((r) => [r.id, r]));
  for (const row of extra) {
    map.set(row.id, row);
  }
  return [...map.values()];
}
