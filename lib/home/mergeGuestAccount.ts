import type { SupabaseClient } from "@supabase/supabase-js";
import {
  resolveCanonicalReport,
  type CanonicalReportRow,
} from "@/lib/home/resolveCanonicalReport";
import { sortReportPair } from "@/lib/relationship/sortReportPair";
import { cleanupStaleOpenInvites } from "@/lib/relationship/cleanupStaleOpenInvites";

export type MergeGuestAccountResult = {
  canonicalReportId: string;
  mergedFromReportIds: string[];
  relationshipsRepointed: number;
  relationshipsMerged: number;
  invitesRepointed: number;
  favoritesRepointed: number;
  logsRepointed: number;
  relationshipIdMap: Record<string, string>;
};

type RelationshipRow = {
  id: string;
  report_id_a: string;
  report_id_b: string;
  analysis_type: string;
  result_basic: unknown;
  result_premium: unknown;
  result_premium_by_kind?: unknown;
  relationship_kind?: string | null;
};

function analysisRank(type: string): number {
  return type === "premium" ? 2 : 1;
}

async function claimOrphanReport(
  supabase: SupabaseClient,
  reportId: string,
  clerkUserId: string,
): Promise<void> {
  const { error } = await supabase
    .from("reports")
    .update({ clerk_user_id: clerkUserId })
    .eq("id", reportId)
    .is("clerk_user_id", null);

  if (error) {
    console.error("mergeGuestAccount claim:", error.message);
  }
}

async function fetchOwnedSelfReports(
  supabase: SupabaseClient,
  clerkUserId: string,
): Promise<CanonicalReportRow[]> {
  const { data, error } = await supabase
    .from("reports")
    .select(
      "id, name, clerk_user_id, created_at, birth_date, birth_time, birth_place, payment_status, plan_type",
    )
    .eq("clerk_user_id", clerkUserId)
    .neq("report_type", "partner_manual")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    console.error("mergeGuestAccount owned:", error.message);
    return [];
  }
  return (data ?? []) as CanonicalReportRow[];
}

async function mergeRelationshipRowData(
  supabase: SupabaseClient,
  keepId: string,
  keep: RelationshipRow,
  drop: RelationshipRow,
): Promise<void> {
  const patch: Record<string, unknown> = {};

  if (analysisRank(drop.analysis_type) > analysisRank(keep.analysis_type)) {
    patch.analysis_type = drop.analysis_type;
  }
  if (!keep.result_basic && drop.result_basic) {
    patch.result_basic = drop.result_basic;
  }
  if (!keep.result_premium && drop.result_premium) {
    patch.result_premium = drop.result_premium;
  }
  if (!keep.result_premium_by_kind && drop.result_premium_by_kind) {
    patch.result_premium_by_kind = drop.result_premium_by_kind;
  }
  if (!keep.relationship_kind && drop.relationship_kind) {
    patch.relationship_kind = drop.relationship_kind;
  }

  if (Object.keys(patch).length === 0) return;

  const { error } = await supabase
    .from("relationship_reports")
    .update(patch)
    .eq("id", keepId);

  if (error) {
    console.error("mergeGuestAccount merge row data:", error.message);
  }
}

async function repointRelationshipReportReferences(
  supabase: SupabaseClient,
  fromRelationshipId: string,
  toRelationshipId: string,
): Promise<void> {
  if (fromRelationshipId === toRelationshipId) return;

  await supabase
    .from("invites")
    .update({ relationship_report_id: toRelationshipId })
    .eq("relationship_report_id", fromRelationshipId);

  const { data: favorites } = await supabase
    .from("relationship_favorites")
    .select("viewer_report_id")
    .eq("relationship_report_id", fromRelationshipId);

  for (const fav of favorites ?? []) {
    const viewerId = fav.viewer_report_id as string;
    await supabase.from("relationship_favorites").upsert(
      {
        viewer_report_id: viewerId,
        relationship_report_id: toRelationshipId,
      },
      { onConflict: "viewer_report_id,relationship_report_id" },
    );
  }

  await supabase
    .from("relationship_favorites")
    .delete()
    .eq("relationship_report_id", fromRelationshipId);

  await supabase
    .from("relationship_analysis_logs")
    .update({ relationship_report_id: toRelationshipId })
    .eq("relationship_report_id", fromRelationshipId);
}

async function repointRelationshipRows(
  supabase: SupabaseClient,
  sourceReportId: string,
  canonicalReportId: string,
): Promise<{
  repointed: number;
  merged: number;
  idMap: Record<string, string>;
}> {
  const idMap: Record<string, string> = {};
  let repointed = 0;
  let merged = 0;

  const { data: rows, error } = await supabase
    .from("relationship_reports")
    .select(
      "id, report_id_a, report_id_b, analysis_type, result_basic, result_premium, result_premium_by_kind, relationship_kind",
    )
    .or(
      `report_id_a.eq.${sourceReportId},report_id_b.eq.${sourceReportId}`,
    );

  if (error) {
    console.error("mergeGuestAccount relationship rows:", error.message);
    return { repointed, merged, idMap };
  }

  for (const row of (rows ?? []) as RelationshipRow[]) {
    const partnerId =
      row.report_id_a === sourceReportId
        ? row.report_id_b
        : row.report_id_a;

    if (partnerId === canonicalReportId) {
      await supabase.from("relationship_reports").delete().eq("id", row.id);
      continue;
    }

    const { report_id_a, report_id_b } = sortReportPair(
      canonicalReportId,
      partnerId,
    );

    const { data: existing } = await supabase
      .from("relationship_reports")
      .select(
        "id, report_id_a, report_id_b, analysis_type, result_basic, result_premium, result_premium_by_kind, relationship_kind",
      )
      .eq("report_id_a", report_id_a)
      .eq("report_id_b", report_id_b)
      .maybeSingle();

    if (existing?.id && existing.id !== row.id) {
      await mergeRelationshipRowData(
        supabase,
        existing.id,
        existing as RelationshipRow,
        row,
      );
      await repointRelationshipReportReferences(
        supabase,
        row.id,
        existing.id,
      );
      idMap[row.id] = existing.id;
      await supabase.from("relationship_reports").delete().eq("id", row.id);
      merged += 1;
      continue;
    }

    const { error: updateErr } = await supabase
      .from("relationship_reports")
      .update({ report_id_a, report_id_b })
      .eq("id", row.id);

    if (!updateErr) repointed += 1;
    else console.error("mergeGuestAccount repoint row:", updateErr.message);
  }

  return { repointed, merged, idMap };
}

async function repointInvites(
  supabase: SupabaseClient,
  sourceReportId: string,
  canonicalReportId: string,
): Promise<number> {
  let count = 0;

  const fromResult = await supabase
    .from("invites")
    .update({ from_report_id: canonicalReportId })
    .eq("from_report_id", sourceReportId)
    .select("id");

  if (!fromResult.error) count += fromResult.data?.length ?? 0;

  const acceptedResult = await supabase
    .from("invites")
    .update({ accepted_report_id: canonicalReportId })
    .eq("accepted_report_id", sourceReportId)
    .select("id");

  if (!acceptedResult.error) count += acceptedResult.data?.length ?? 0;

  return count;
}

async function repointViewerScopedRows(
  supabase: SupabaseClient,
  sourceReportId: string,
  canonicalReportId: string,
): Promise<{ favorites: number; logs: number }> {
  const { data: favorites } = await supabase
    .from("relationship_favorites")
    .select("relationship_report_id")
    .eq("viewer_report_id", sourceReportId);

  for (const fav of favorites ?? []) {
    await supabase.from("relationship_favorites").upsert(
      {
        viewer_report_id: canonicalReportId,
        relationship_report_id: fav.relationship_report_id as string,
      },
      { onConflict: "viewer_report_id,relationship_report_id" },
    );
  }

  const favCount = favorites?.length ?? 0;

  await supabase
    .from("relationship_favorites")
    .delete()
    .eq("viewer_report_id", sourceReportId);

  const logsResult = await supabase
    .from("relationship_analysis_logs")
    .update({ viewer_report_id: canonicalReportId })
    .eq("viewer_report_id", sourceReportId)
    .select("id");

  return {
    favorites: favCount,
    logs: logsResult.data?.length ?? 0,
  };
}

/**
 * 게스트(또는 비-canonical) reportId에 묶인 관계 데이터를
 * 로그인 계정의 canonical reportId로 병합한다.
 */
export async function mergeGuestAccountData(
  supabase: SupabaseClient,
  clerkUserId: string,
  guestReportIdHint?: string,
): Promise<MergeGuestAccountResult | null> {
  const hint = guestReportIdHint?.trim() || undefined;

  if (hint) {
    const { data: hintRow } = await supabase
      .from("reports")
      .select("id, clerk_user_id, report_type")
      .eq("id", hint)
      .maybeSingle();

    if (
      hintRow?.id &&
      hintRow.report_type !== "partner_manual" &&
      hintRow.clerk_user_id == null
    ) {
      await claimOrphanReport(supabase, hintRow.id, clerkUserId);
    }
  }

  const { report: canonical } = await resolveCanonicalReport(
    supabase,
    clerkUserId,
    hint,
  );

  if (!canonical?.id) return null;

  const owned = await fetchOwnedSelfReports(supabase, clerkUserId);
  const sourceIds = new Set<string>();

  for (const row of owned) {
    if (row.id !== canonical.id) sourceIds.add(row.id);
  }

  if (hint && hint !== canonical.id) {
    const { data: hintOwned } = await supabase
      .from("reports")
      .select("id, report_type, clerk_user_id")
      .eq("id", hint)
      .maybeSingle();

    if (
      hintOwned?.id &&
      hintOwned.report_type !== "partner_manual" &&
      hintOwned.clerk_user_id === clerkUserId
    ) {
      sourceIds.add(hintOwned.id);
    }
  }

  const mergedFromReportIds = [...sourceIds];

  let relationshipsRepointed = 0;
  let relationshipsMerged = 0;
  let invitesRepointed = 0;
  let favoritesRepointed = 0;
  let logsRepointed = 0;
  const relationshipIdMap: Record<string, string> = {};

  if (mergedFromReportIds.length === 0) {
    await cleanupStaleOpenInvites(supabase, canonical.id);
    return {
      canonicalReportId: canonical.id,
      mergedFromReportIds: [],
      relationshipsRepointed: 0,
      relationshipsMerged: 0,
      invitesRepointed: 0,
      favoritesRepointed: 0,
      logsRepointed: 0,
      relationshipIdMap: {},
    };
  }

  for (const sourceId of mergedFromReportIds) {
    const rel = await repointRelationshipRows(
      supabase,
      sourceId,
      canonical.id,
    );
    relationshipsRepointed += rel.repointed;
    relationshipsMerged += rel.merged;
    Object.assign(relationshipIdMap, rel.idMap);

    invitesRepointed += await repointInvites(
      supabase,
      sourceId,
      canonical.id,
    );

    const scoped = await repointViewerScopedRows(
      supabase,
      sourceId,
      canonical.id,
    );
    favoritesRepointed += scoped.favorites;
    logsRepointed += scoped.logs;
  }

  await cleanupStaleOpenInvites(supabase, canonical.id);

  return {
    canonicalReportId: canonical.id,
    mergedFromReportIds,
    relationshipsRepointed,
    relationshipsMerged,
    invitesRepointed,
    favoritesRepointed,
    logsRepointed,
    relationshipIdMap,
  };
}
