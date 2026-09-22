import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  createRouteSupabaseClient,
  supabaseConfigErrorResponse,
} from "@/lib/supabase/serverClient";
import { logServerError } from "@/lib/security/safeLog";
import { cancelPaddleSandboxSubscription } from "@/lib/payment/paddleSandboxClient";

export const runtime = "nodejs";

/**
 * Member-initiated Annual Membership cancellation.
 *
 * Ownership: the ONLY row this route can ever touch is looked up by
 * (clerk_user_id = the authenticated caller's own session id) AND
 * (status = 'active') -- there is no subscriptionId/membershipId taken
 * from the request body at all, so there is no id a caller could tamper
 * with to reach another user's membership. This mirrors the same
 * "derive the target row from the session, never from client input"
 * pattern as GET /api/account/membership.
 *
 * Design: effective_from "next_billing_period" -- the member keeps
 * access through the term they already paid for. This matches
 * refundPolicy.ts's existing, UNCHANGED promise ("you will retain access
 * ... until the end of your current billing cycle. No partial refunds
 * will be issued for unused days") and Paddle's own behavior for that
 * effective_from value: `status` stays "active" and a `scheduled_change`
 * appears immediately, but Paddle does not actually end the subscription
 * (and therefore does not fire subscription.canceled) until the current
 * billing period's end. set_membership_cancel_schedule below is a local,
 * purely-cosmetic mirror of that -- it does NOT change `status` or touch
 * any entitlement check.
 *
 * The Paddle API call happens server-side only (this route handler),
 * using PADDLE_SANDBOX_API_SECRET_KEY, which never reaches the client.
 */
export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createRouteSupabaseClient();
  if (!supabase) return supabaseConfigErrorResponse();

  const { data: membership, error: lookupError } = await supabase
    .from("memberships")
    .select("paddle_subscription_id, current_term_end, cancel_at_period_end")
    .eq("clerk_user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (lookupError) {
    logServerError("account.membership.cancel", lookupError, "lookup_failed");
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }

  if (!membership) {
    return NextResponse.json({ error: "no_active_membership" }, { status: 404 });
  }

  const subscriptionId = membership.paddle_subscription_id as string | null;
  if (!subscriptionId) {
    // Should not happen for a real Annual membership (grantUsPurchase
    // requires paddle_subscription_id for us_annual_membership at grant
    // time) -- defensive guard only.
    logServerError("account.membership.cancel", null, "membership_missing_subscription_id");
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }

  if (membership.cancel_at_period_end === true) {
    // Idempotent: a repeat click (or a retry after a slow first request)
    // just confirms the already-scheduled cancellation rather than
    // erroring or calling Paddle a second time.
    return NextResponse.json({
      ok: true,
      alreadyScheduled: true,
      accessUntil: membership.current_term_end,
    });
  }

  const result = await cancelPaddleSandboxSubscription(subscriptionId, "next_billing_period");
  if (!result) {
    logServerError("account.membership.cancel", null, "paddle_cancel_call_failed");
    return NextResponse.json({ error: "cancel_failed" }, { status: 502 });
  }

  const { error: scheduleError } = await supabase.rpc("set_membership_cancel_schedule", {
    p_paddle_subscription_id: subscriptionId,
    p_cancel_at_period_end: true,
  });

  if (scheduleError) {
    // Paddle-side cancellation DID succeed at this point -- the member's
    // subscription genuinely will not renew. Only our own local display
    // flag failed to update, which the subscription.updated webhook will
    // still correct shortly after (it re-syncs cancel_at_period_end from
    // Paddle's own scheduled_change on every update). Log loudly but do
    // not report this to the caller as a failed cancellation -- it was
    // not one.
    logServerError("account.membership.cancel", scheduleError, "local_schedule_update_failed");
  }

  return NextResponse.json({
    ok: true,
    alreadyScheduled: false,
    accessUntil: membership.current_term_end,
  });
}
