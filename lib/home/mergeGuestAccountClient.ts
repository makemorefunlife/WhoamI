import type { MergeGuestAccountResult } from "@/lib/home/mergeGuestAccount";

export type MergeGuestAccountClientResult = MergeGuestAccountResult & {
  merged: boolean;
};

/**
 * Guest merge disabled — product policy: no guest UUID claim/merge.
 * Safe no-op retained so call sites keep compiling.
 */
export async function ensureGuestAccountMerged(
  _guestReportIdHint?: string,
): Promise<MergeGuestAccountClientResult | null> {
  return null;
}
