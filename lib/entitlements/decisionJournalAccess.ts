import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Decision Journal access is a time-boxed entitlement, not a credit --
 * "unlimited while active" rather than a countable balance. Deliberately
 * derived on read from tables that already exist for other reasons,
 * instead of a new dedicated access-flag table:
 *
 *  - Annual membership: unlimited for as long as the membership row is
 *    'active' and now() falls inside its current term window.
 *  - 30-Day Insight Pass: unlimited for 30 days from the purchase's own
 *    us_purchase_grants.created_at -- the SAME 30-day window its personal/
 *    relationship credit_lots expire on (see process_us_purchase), so
 *    Journal access and those credits always run out together.
 *
 * Both are just windows in already-idempotent, already-atomic tables, so
 * this needs no extra grant/expiry bookkeeping of its own.
 */
export type DecisionJournalAccess =
  | { hasAccess: false }
  | { hasAccess: true; source: "annual_membership"; expiresAt: string }
  | { hasAccess: true; source: "insight_pass_30d"; expiresAt: string };

const INSIGHT_PASS_WINDOW_DAYS = 30;

export async function getDecisionJournalAccess(
  supabase: SupabaseClient,
  clerkUserId: string,
): Promise<DecisionJournalAccess> {
  const nowIso = new Date().toISOString();

  const { data: membership } = await supabase
    .from("memberships")
    .select("status, current_term_start, current_term_end")
    .eq("clerk_user_id", clerkUserId)
    .eq("status", "active")
    .lte("current_term_start", nowIso)
    .gt("current_term_end", nowIso)
    .maybeSingle();

  if (membership) {
    return {
      hasAccess: true,
      source: "annual_membership",
      expiresAt: membership.current_term_end as string,
    };
  }

  const { data: pass } = await supabase
    .from("us_purchase_grants")
    .select("created_at")
    .eq("clerk_user_id", clerkUserId)
    .eq("plan_id", "us_insight_pass_30d")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (pass) {
    const expiresAt = new Date(
      new Date(pass.created_at as string).getTime() +
        INSIGHT_PASS_WINDOW_DAYS * 24 * 60 * 60 * 1000,
    );
    if (expiresAt.getTime() > Date.now()) {
      return { hasAccess: true, source: "insight_pass_30d", expiresAt: expiresAt.toISOString() };
    }
  }

  return { hasAccess: false };
}
