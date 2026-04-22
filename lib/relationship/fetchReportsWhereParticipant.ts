import type { SupabaseClient } from "@supabase/supabase-js";

/** relationship_reports 한 행 (조회용) */
export type RelationshipReportRow = {
  id: string;
  report_id_a: string;
  report_id_b: string;
  analysis_type: string;
  result_basic: unknown;
  result_premium: unknown;
};

const RR_SELECT =
  "id, report_id_a, report_id_b, analysis_type, result_basic, result_premium";

/**
 * 내 report_id가 A 또는 B인 관계 행을 모두 가져옴.
 * `.or(report_id_a.eq.x,report_id_b.eq.x)` 대신 두 번 조회해 합치면
 * 일부 환경/데이터에서 한쪽만 매칭되는 문제를 피할 수 있음.
 */
export async function fetchRelationshipReportRowsForReportId(
  supabase: SupabaseClient,
  reportId: string,
): Promise<RelationshipReportRow[]> {
  const [{ data: aSide, error: e1 }, { data: bSide, error: e2 }] =
    await Promise.all([
      supabase.from("relationship_reports").select(RR_SELECT).eq("report_id_a", reportId),
      supabase.from("relationship_reports").select(RR_SELECT).eq("report_id_b", reportId),
    ]);

  if (e1) throw e1;
  if (e2) throw e2;

  const map = new Map<string, RelationshipReportRow>();
  for (const r of [...(aSide ?? []), ...(bSide ?? [])]) {
    map.set(r.id, r as RelationshipReportRow);
  }
  return [...map.values()];
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

    const { data: rr, error: rrErr } = await supabase
      .from("relationship_reports")
      .select(RR_SELECT)
      .eq("id", rrId)
      .maybeSingle();

    if (rrErr || !rr) continue;

    seen.add(rr.id);
    out.push(rr as RelationshipReportRow);
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

    const { data: rr, error: rrErr } = await supabase
      .from("relationship_reports")
      .select(RR_SELECT)
      .eq("id", rrId)
      .maybeSingle();

    if (rrErr || !rr) continue;

    seen.add(rr.id);
    out.push(rr as RelationshipReportRow);
  }

  return out;
}
