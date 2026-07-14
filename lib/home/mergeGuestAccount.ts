import type { SupabaseClient } from "@supabase/supabase-js";

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

/**
 * Guest merge / orphan claim disabled (fail-closed).
 * Retained export so call sites compile; always throws.
 */
export async function mergeGuestAccountData(
  _supabase: SupabaseClient,
  _clerkUserId: string,
  _guestReportIdHint?: string,
): Promise<MergeGuestAccountResult | null> {
  throw new Error("guest claim is temporarily disabled");
}

/** @deprecated alias — same fail-closed behavior */
export async function mergeGuestAccountWithReport(
  supabase: SupabaseClient,
  clerkUserId: string,
  guestReportIdHint?: string,
): Promise<MergeGuestAccountResult | null> {
  return mergeGuestAccountData(supabase, clerkUserId, guestReportIdHint);
}
