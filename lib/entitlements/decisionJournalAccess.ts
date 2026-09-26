import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Decision Journal access is a time-boxed entitlement, not a credit --
 * "unlimited while active" rather than a countable balance. Deliberately
 * derived on read from tables that already exist for other reasons,
 * instead of a new dedicated access-flag table:
 *
 *  - Annual membership: unlimited for as long as the membership row is
 *    'active' and now() falls inside its current term window.
 *  - 30-Day Insight Pass (US or KR): unlimited for 30 days from the
 *    purchase's own us_purchase_grants/kr_purchase_grants.created_at -- the
 *    SAME 30-day window its personal/relationship credit_lots expire on
 *    (see process_us_purchase / process_kr_purchase), so Journal access and
 *    those credits always run out together. Checked in both regions' grant
 *    tables -- a KR buyer must get the same unlimited window a US buyer
 *    does.
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

  const { data: usPass } = await supabase
    .from("us_purchase_grants")
    .select("created_at")
    .eq("clerk_user_id", clerkUserId)
    .eq("plan_id", "us_insight_pass_30d")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (usPass) {
    const expiresAt = new Date(
      new Date(usPass.created_at as string).getTime() +
        INSIGHT_PASS_WINDOW_DAYS * 24 * 60 * 60 * 1000,
    );
    if (expiresAt.getTime() > Date.now()) {
      return { hasAccess: true, source: "insight_pass_30d", expiresAt: expiresAt.toISOString() };
    }
  }

  // KR 30-Day Pass -- same window rule, separate table (kr_purchase_grants
  // is intentionally never joined against us_purchase_grants -- see
  // 20260922060000_kr_purchase_grants_provider_agnostic.sql). Without this
  // check a KR Pass buyer would incorrectly get hasAccess: false here.
  const { data: krPass } = await supabase
    .from("kr_purchase_grants")
    .select("created_at")
    .eq("clerk_user_id", clerkUserId)
    .eq("plan_id", "kr_insight_pass_30d")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (krPass) {
    const expiresAt = new Date(
      new Date(krPass.created_at as string).getTime() +
        INSIGHT_PASS_WINDOW_DAYS * 24 * 60 * 60 * 1000,
    );
    if (expiresAt.getTime() > Date.now()) {
      return { hasAccess: true, source: "insight_pass_30d", expiresAt: expiresAt.toISOString() };
    }
  }

  return { hasAccess: false };
}
