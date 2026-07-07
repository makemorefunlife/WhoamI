import type { SupabaseClient } from "@supabase/supabase-js";
import {
  fetchRelationshipReportRowsForReportId,
  mergeRelationshipRowsFromInboundInvites,
  mergeRelationshipRowsFromOutboundInvites,
} from "@/lib/relationship/fetchReportsWhereParticipant";
import { isRelationshipPremiumComplete } from "@/lib/relationship/isRelationshipPremiumComplete";

function isBasicComplete(resultBasic: unknown): boolean {
  const basic = resultBasic as { perspectives?: unknown } | null;
  return (
    basic != null &&
    typeof basic === "object" &&
    basic.perspectives != null &&
    typeof basic.perspectives === "object"
  );
}

/** 홈 탐사실 허브 — pending / completed 카운트 (relationship/list simple 과 동일 기준) */
export async function countHubRelationshipSummary(
  supabase: SupabaseClient,
  reportId: string,
): Promise<{ pending: number; completed: number }> {
  let rows = await fetchRelationshipReportRowsForReportId(supabase, reportId);
  rows = await mergeRelationshipRowsFromOutboundInvites(
    supabase,
    reportId,
    rows,
  );
  rows = await mergeRelationshipRowsFromInboundInvites(
    supabase,
    reportId,
    rows,
  );

  const { data: openInvites, error: invErr } = await supabase
    .from("invites")
    .select("id, relationship_report_id")
    .eq("from_report_id", reportId)
    .eq("status", "open");

  if (invErr) {
    console.error("hubRelationshipSummary invites:", invErr);
    return { pending: 0, completed: 0 };
  }

  let pending = 0;
  let completed = 0;

  for (const inv of openInvites ?? []) {
    if (!inv.relationship_report_id) pending++;
  }

  for (const r of rows) {
    const at = r.analysis_type as string;
    const basicDone = isBasicComplete(r.result_basic);
    const premiumDone = isRelationshipPremiumComplete(
      at,
      r.result_premium,
      r.result_premium_by_kind,
      r.relationship_kind,
    );
    const done = basicDone && (at !== "premium" || premiumDone);
    if (done) completed++;
    else pending++;
  }

  return { pending, completed };
}
