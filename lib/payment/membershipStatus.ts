import type { SupabaseClient } from "@supabase/supabase-js";

export type MembershipBillingModel = "paddle_recurring" | "one_time_12m";

export type MembershipRow = {
  id: string;
  plan_id: string;
  status: string;
  billing_model: MembershipBillingModel;
  current_term_start: string;
  current_term_end: string;
  cancel_at_period_end: boolean;
  cancel_requested_at: string | null;
};

/**
 * Whether an 'active' membership row still blocks buying a new 12-Month
 * Membership. Mirrors process_toss_order's closing rule exactly:
 *  - one-time: blocks only while inside its 12-month term
 *  - legacy recurring: blocks while in term, and ALSO after term end unless
 *    a cancellation was scheduled (it may still be renewing on Paddle).
 */
export function membershipBlocksNewPurchase(row: MembershipRow, now = Date.now()): boolean {
  if (row.status !== "active") return false;
  const inTerm = new Date(row.current_term_end).getTime() > now;
  if (row.billing_model === "one_time_12m") return inTerm;
  return inTerm || !row.cancel_at_period_end;
}

/** Whether the membership's benefits are currently in effect. */
export function membershipIsCurrent(row: MembershipRow, now = Date.now()): boolean {
  return (
    row.status === "active" &&
    new Date(row.current_term_start).getTime() <= now &&
    new Date(row.current_term_end).getTime() > now
  );
}

const MEMBERSHIP_COLUMNS =
  "id, plan_id, status, billing_model, current_term_start, current_term_end, cancel_at_period_end, cancel_requested_at";

export async function getActiveMembershipRow(
  supabase: SupabaseClient,
  clerkUserId: string,
): Promise<{ ok: true; row: MembershipRow | null } | { ok: false }> {
  const { data, error } = await supabase
    .from("memberships")
    .select(MEMBERSHIP_COLUMNS)
    .eq("clerk_user_id", clerkUserId)
    .eq("status", "active")
    .maybeSingle();
  if (error) return { ok: false };
  return { ok: true, row: (data as MembershipRow | null) ?? null };
}
