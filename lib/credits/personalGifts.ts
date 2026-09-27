import type { SupabaseClient } from "@supabase/supabase-js";

export type PersonalGiftStatus = "available" | "claimed" | "expired";

export type PersonalGiftSummary = {
  code: string;
  status: PersonalGiftStatus;
  createdAt: string;
  redeemedAt: string | null;
};

/**
 * Must match the 1-year issue-expiry window enforced server-side in
 * redeem_gift_personal_coupon() (supabase/migrations/20260928000000_redeem_code_system.sql).
 * Gift-code expiry is intentionally computed from created_at rather than
 * stored in its own column (same pattern as the 30-Day Pass's Decision
 * Journal window in lib/entitlements/decisionJournalAccess.ts) -- if that
 * window ever changes, update it in both places.
 */
const GIFT_CODE_TTL_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * Lists the Personal Analysis gift coupons issued TO (i.e. owned/shareable
 * by) a clerk user across their Annual membership(s) -- the gifts they can
 * hand out, never gifts they've claimed from someone else (those show up
 * as an ordinary Personal credit lot, via getCreditLotSummary).
 *
 * Status is derived, not stored:
 * - "claimed": status = 'redeemed' in the DB. The gift *code's* own 1-year
 *   window stops mattering once claimed -- only the recipient's resulting
 *   credit-lot expiry (set at redemption time) matters from here on.
 * - "expired": still 'unredeemed' but issued more than a year ago, so it
 *   can no longer be claimed even though nobody ever redeemed it.
 * - "available": still 'unredeemed' and inside the 1-year issue window.
 *
 * Rows with status = 'revoked' (from a cancelled/refunded membership; see
 * mark_membership_refunded) are intentionally excluded -- per the product
 * rule that cancellation only revokes still-unclaimed gifts, there is
 * nothing actionable left to show for one, and an already-claimed gift
 * (now the recipient's own credit) is never touched by cancellation.
 */
export async function listOwnPersonalGifts(
  supabase: SupabaseClient,
  clerkUserId: string,
): Promise<PersonalGiftSummary[]> {
  const { data, error } = await supabase
    .from("gift_personal_coupons")
    .select("code, status, created_at, redeemed_at")
    .eq("issued_to_clerk_user_id", clerkUserId)
    .neq("status", "revoked")
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  const now = Date.now();
  return data.map((row: Record<string, unknown>) => {
    const status = row.status as string;
    const createdAt = row.created_at as string;
    let derived: PersonalGiftStatus;
    if (status === "redeemed") {
      derived = "claimed";
    } else {
      const issuedAtMs = new Date(createdAt).getTime();
      derived = now - issuedAtMs >= GIFT_CODE_TTL_MS ? "expired" : "available";
    }
    return {
      code: row.code as string,
      status: derived,
      createdAt,
      redeemedAt: (row.redeemed_at as string | null) ?? null,
    };
  });
}
