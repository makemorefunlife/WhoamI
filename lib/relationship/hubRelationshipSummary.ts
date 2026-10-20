import type { SupabaseClient } from "@supabase/supabase-js";
import { logServerError } from "@/lib/security/safeLog";
import {
  fetchRelationshipReportRowsForReportId,
  mergeRelationshipRowsFromInboundInvites,
  mergeRelationshipRowsFromOutboundInvites,
} from "@/lib/relationship/fetchReportsWhereParticipant";
import { isRelationshipPremiumComplete } from "@/lib/relationship/isRelationshipPremiumComplete";
import { fetchAccessiblePremiumKinds } from "@/lib/relationship/premiumAccess";
import { viewerGroupReportIds } from "@/lib/account/profileGroup";

function isBasicComplete(resultBasic: unknown): boolean {
  const basic = resultBasic as { perspectives?: unknown } | null;
  return (
    basic != null &&
    typeof basic === "object" &&
    basic.perspectives != null &&
    typeof basic.perspectives === "object"
  );
}

/**
 * 홈 탐사실 허브 — pending / completed 카운트 (relationship/list simple 과 동일 기준)
 * A main report with grouped reports (lib/account/profileGroup.ts) counts the
 * grouped reports' relationships too; the same other person counted once
 * (completed wins). Ungrouped reports: unchanged result.
 */
export async function countHubRelationshipSummary(
  supabase: SupabaseClient,
  reportId: string,
): Promise<{ pending: number; completed: number }> {
  const ids = await viewerGroupReportIds(supabase, reportId);
  if (ids.length === 1) return countForReport(supabase, reportId);
  let pending = 0;
  const doneByPartner = new Map<string, boolean>();
  for (const id of ids) {
    const part = await collectForReport(supabase, id);
    if (!part) continue;
    pending += part.openInvites;
    for (const r of part.rows) {
      doneByPartner.set(r.partnerId, (doneByPartner.get(r.partnerId) ?? false) || r.done);
    }
  }
  let completed = 0;
  for (const done of doneByPartner.values()) {
    if (done) completed++;
    else pending++;
  }
  return { pending, completed };
}

async function countForReport(
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
    logServerError("hubRelationshipSummary invites:", invErr, "internal_error");
    return { pending: 0, completed: 0 };
  }

  let pending = 0;
  let completed = 0;

  for (const inv of openInvites ?? []) {
    if (!inv.relationship_report_id) pending++;
  }

  const accessibleByRr = await fetchAccessiblePremiumKinds(
    supabase,
    reportId,
    rows.map((r) => r.id as string),
  );

  for (const r of rows) {
    const at = r.analysis_type as string;
    const basicDone = isBasicComplete(r.result_basic);
    const premiumDone = isRelationshipPremiumComplete(
      at,
      r.result_premium_by_kind,
      r.relationship_kind,
      undefined,
      accessibleByRr.get(r.id as string),
    );
    const done = basicDone && (at !== "premium" || premiumDone);
    if (done) completed++;
    else pending++;
  }

  return { pending, completed };
}

/** Same reads as countForReport, per relationship row (for grouped accounts). */
async function collectForReport(
  supabase: SupabaseClient,
  reportId: string,
): Promise<{ openInvites: number; rows: { partnerId: string; done: boolean }[] } | null> {
  let rows = await fetchRelationshipReportRowsForReportId(supabase, reportId);
  rows = await mergeRelationshipRowsFromOutboundInvites(supabase, reportId, rows);
  rows = await mergeRelationshipRowsFromInboundInvites(supabase, reportId, rows);
  const { data: openInvites, error: invErr } = await supabase
    .from("invites")
    .select("id, relationship_report_id")
    .eq("from_report_id", reportId)
    .eq("status", "open");
  if (invErr) {
    logServerError("hubRelationshipSummary invites:", invErr, "internal_error");
    return null;
  }
  const accessibleByRr = await fetchAccessiblePremiumKinds(
    supabase,
    reportId,
    rows.map((r) => r.id as string),
  );
  return {
    openInvites: (openInvites ?? []).filter((inv) => !inv.relationship_report_id).length,
    rows: rows.map((r) => {
      const at = r.analysis_type as string;
      const basicDone = isBasicComplete(r.result_basic);
      const premiumDone = isRelationshipPremiumComplete(
        at,
        r.result_premium_by_kind,
        r.relationship_kind,
        undefined,
        accessibleByRr.get(r.id as string),
      );
      const partnerId = (r.report_id_a === reportId ? r.report_id_b : r.report_id_a) as string;
      return { partnerId, done: basicDone && (at !== "premium" || premiumDone) };
    }),
  };
}
