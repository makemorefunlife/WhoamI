import type { SupabaseClient } from "@supabase/supabase-js";
import {
  fetchRelationshipReportByIdSafe,
  fetchRelationshipReportRowsForReportIdSafe,
} from "@/lib/relationship/relationshipReportQuery";

/** relationship_reports 한 행 (조회용) */
export type RelationshipReportRow = {
  id: string;
  report_id_a: string;
  report_id_b: string;
  analysis_type: string;
  result_basic: unknown;
  result_premium: unknown;
  result_premium_by_kind?: unknown;
  relationship_kind?: string | null;
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

/**
 * 관계 허브 — 동일 clerk 계정의 모든 리포트에 연결된 관계 행을 합친다.
 * (리포트 ID가 달라져도 같은 사용자 친구 목록이 보이도록)
 */
export async function fetchRelationshipReportRowsForHub(
  supabase: SupabaseClient,
  reportId: string,
): Promise<RelationshipReportRow[]> {
  let primary = await fetchRelationshipReportRowsForReportId(supabase, reportId);
  primary = await mergeRelationshipRowsFromOutboundInvites(
    supabase,
    reportId,
    primary,
  );
  primary = await mergeRelationshipRowsFromInboundInvites(
    supabase,
    reportId,
    primary,
  );
  // NOTE:
  // 다른 reportId(동일 clerk 계정 소유)까지 합쳐서 내려주면,
  // detail API의 viewerReportId 권한 체크와 충돌해 403이 발생할 수 있다.
  // 허브 액션 안정화를 위해 현재 활성 reportId 참여 관계만 반환한다.
  return primary;
}

/**
 * 내가 보낸 관계 초대(invites)에만 연결된 relationship_report_id가 있으나
 * 위 조회에 안 잡힌 행이 있으면(예: 쿼리/타이밍 이슈) invites를 통해 보강.
 */
export async function mergeRelationshipRowsFromOutboundInvites(
  supabase: SupabaseClient,
  fromReportId: string,
  rows: RelationshipReportRow[],
): Promise<RelationshipReportRow[]> {
  const seen = new Set(rows.map((r) => r.id));
  const out = [...rows];

  const { data: invites, error } = await supabase
    .from("invites")
    .select("relationship_report_id, status")
    .eq("from_report_id", fromReportId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("outbound invites:", error.message);
    return out;
  }

  for (const inv of invites ?? []) {
    const rrId = inv.relationship_report_id as string | null | undefined;
    if (!rrId || seen.has(rrId)) continue;

    const { row: rr, error: rrErr } = await fetchRelationshipReportByIdSafe(
      supabase,
      rrId,
    );

    if (rrErr || !rr) continue;

    seen.add(rr.id);
    out.push(rr);
  }

  return out;
}

/**
 * 내가 초대를 *받은* 쪽(invite.accepted_report_id = 나)인데
 * relationship_report 행이 위 조회에서 빠진 경우 보강.
 */
export async function mergeRelationshipRowsFromInboundInvites(
  supabase: SupabaseClient,
  myReportId: string,
  rows: RelationshipReportRow[],
): Promise<RelationshipReportRow[]> {
  const seen = new Set(rows.map((r) => r.id));
  const out = [...rows];

  const { data: invites, error } = await supabase
    .from("invites")
    .select("relationship_report_id")
    .eq("accepted_report_id", myReportId)
    .neq("from_report_id", myReportId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("inbound invites merge:", error.message);
    return out;
  }

  for (const inv of invites ?? []) {
    const rrId = inv.relationship_report_id as string | null | undefined;
    if (!rrId || seen.has(rrId)) continue;

    const { row: rr, error: rrErr } = await fetchRelationshipReportByIdSafe(
      supabase,
      rrId,
    );

    if (rrErr || !rr) continue;

    seen.add(rr.id);
    out.push(rr);
  }

  return out;
}
