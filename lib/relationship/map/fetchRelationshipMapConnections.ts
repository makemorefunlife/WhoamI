import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchRelationshipReportRowsForHub } from "@/lib/relationship/fetchReportsWhereParticipant";
import { isRelationshipPremiumComplete } from "@/lib/relationship/isRelationshipPremiumComplete";
import {
  partnerNameFromLogSnapshot,
  resolvePartnerDisplayName,
} from "@/lib/relationship/resolvePartnerDisplayName";
import {
  compareStringTieBreakDesc,
  sortByIsoTimestampDesc,
} from "@/lib/relationship/sortByIsoTimestampDesc";
import { dedupeConnectionsByPartner } from "@/lib/relationship/map/dedupeConnectionsByPartner";

export type RelationshipMapConnection = {
  relationshipReportId: string;
  partnerReportId: string;
  partnerName: string;
  analysisType: "basic" | "premium" | null;
  status: "completed" | "pending";
  addedAt: string | null;
};

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
 * Same source connections as /api/relationship/list (fetchRelationshipReportRowsForHub +
 * partner-name resolution), deduped one row per partner. Unlike the hub list, a
 * connection is included here regardless of analysis completion — the map only
 * needs a Day Master, not a finished report (see relationship-map spec section 21).
 */
export async function fetchRelationshipMapConnections(
  supabase: SupabaseClient,
  viewerReportId: string,
): Promise<RelationshipMapConnection[]> {
  const rows = await fetchRelationshipReportRowsForHub(supabase, viewerReportId);
  if (rows.length === 0) return [];

  const partnerIds = rows.map((r) =>
    r.report_id_a === viewerReportId ? r.report_id_b : r.report_id_a,
  );
  const uniquePartners = [...new Set(partnerIds)];
  const rrIds = rows.map((r) => r.id);

  // These two only depend on `rows`, not on each other — run them together
  // instead of one-after-another (this pair alone was costing a full extra
  // network round-trip on every map load and every role click).
  const [{ data: names }, { data: logRows }] = await Promise.all([
    uniquePartners.length > 0
      ? supabase.from("reports").select("id, name, report_type").in("id", uniquePartners)
      : Promise.resolve({ data: [] as { id: string; name: string | null; report_type: string | null }[] }),
    rrIds.length > 0
      ? supabase
          .from("relationship_analysis_logs")
          .select("relationship_report_id, result_snapshot, created_at")
          .eq("viewer_report_id", viewerReportId)
          .in("relationship_report_id", rrIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as { relationship_report_id: string; result_snapshot: unknown; created_at: string }[] }),
  ]);

  const nameById = Object.fromEntries(
    (names ?? []).map((n) => [n.id, n.name?.trim() ?? ""]),
  );
  const typeById = Object.fromEntries(
    (names ?? []).map((n) => [n.id, n.report_type ?? ""]),
  );

  const logNameByRrId = new Map<string, string>();
  for (const log of logRows ?? []) {
    const rrId = log.relationship_report_id as string;
    if (logNameByRrId.has(rrId)) continue;
    const fromLog = partnerNameFromLogSnapshot(
      (log.result_snapshot ?? {}) as Record<string, unknown>,
    );
    if (fromLog) logNameByRrId.set(rrId, fromLog);
  }

  type Candidate = RelationshipMapConnection & { isManual: boolean };
  const candidates: Candidate[] = rows.map((r) => {
    const partnerId = r.report_id_a === viewerReportId ? r.report_id_b : r.report_id_a;
    const partnerName = resolvePartnerDisplayName(
      nameById[partnerId],
      logNameByRrId.get(r.id),
      typeById[partnerId] === "partner_manual" ? "친구" : "탐사자",
    );
    const at = r.analysis_type as string;
    const analysisType: "basic" | "premium" | null =
      at === "premium" || at === "basic" ? at : null;
    const basicDone = isBasicComplete(r.result_basic);
    const premiumDone = isRelationshipPremiumComplete(
      at,
      r.result_premium_by_kind,
      r.relationship_kind,
    );
    const completed = basicDone && (at !== "premium" || premiumDone);

    return {
      relationshipReportId: r.id,
      partnerReportId: partnerId,
      partnerName,
      analysisType,
      status: completed ? "completed" : "pending",
      addedAt: r.created_at ?? null,
      isManual: typeById[partnerId] === "partner_manual",
    };
  });

  const deduped = dedupeConnectionsByPartner(candidates);

  return sortByIsoTimestampDesc(
    deduped,
    (c) => c.addedAt,
    (a, b) => compareStringTieBreakDesc(a.relationshipReportId, b.relationshipReportId),
  );
}
