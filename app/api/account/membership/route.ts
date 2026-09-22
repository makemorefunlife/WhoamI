import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  createRouteSupabaseClient,
  supabaseConfigErrorResponse,
} from "@/lib/supabase/serverClient";
import { logServerError } from "@/lib/security/safeLog";
import { resolveUsPlan } from "@/lib/payment/usPricing";

export const runtime = "nodejs";

/**
 * GET the CALLER's OWN current membership status -- for the billing page.
 * Auth-scoped by clerk_user_id from the session only; there is no id
 * parameter, so there is no ownership check to get wrong here (a user can
 * only ever ask for their own row by construction of this query).
 *
 * Returns { membership: null } (200) when the user has no active
 * membership -- that is a normal, expected state, not an error.
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createRouteSupabaseClient();
  if (!supabase) return supabaseConfigErrorResponse();

  const { data, error } = await supabase
    .from("memberships")
    .select(
      "plan_id, status, current_term_start, current_term_end, cancel_at_period_end, cancel_requested_at",
    )
    .eq("clerk_user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    logServerError("account.membership.get", error, "query_failed");
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ membership: null });
  }

  const plan = resolveUsPlan(data.plan_id as string);

  return NextResponse.json({
    membership: {
      planId: data.plan_id,
      planPriceUsd: plan?.priceUsd ?? null,
      status: data.status,
      currentTermStart: data.current_term_start,
      currentTermEnd: data.current_term_end,
      cancelAtPeriodEnd: data.cancel_at_period_end === true,
      cancelRequestedAt: data.cancel_requested_at,
    },
  });
}
