import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveBetaPlan } from "@/lib/payment/betaPaddlePricing";
import { logServerError } from "@/lib/security/safeLog";

export type GrantBetaPurchaseResult =
  | { ok: true; alreadyProcessed: boolean }
  | { ok: false; reason: "unknown_plan" | "grant_failed" };

/**
 * Thin wrapper around the process_beta_purchase RPC (see
 * supabase/migrations/20260907030100_process_beta_purchase_function.sql).
 * Deliberately a SINGLE round trip: the idempotency claim in
 * beta_purchase_grants and every grant_credit call for the plan happen
 * inside that one Postgres function call, so they either all land or all
 * roll back together — a Membership purchase can never end up with the
 * personal credit granted, the relationship credits missing, AND the
 * transaction already marked processed (which would have silently blocked
 * any retry from ever finishing the grant).
 */
export async function grantBetaPurchase(
  supabase: SupabaseClient,
  params: {
    clerkUserId: string;
    planId: string;
    paddleTransactionId: string;
    paddlePriceId: string;
    currencyCode: string;
  },
): Promise<GrantBetaPurchaseResult> {
  const plan = resolveBetaPlan(params.planId);
  if (!plan) return { ok: false, reason: "unknown_plan" };

  const { data, error } = await supabase.rpc("process_beta_purchase", {
    p_clerk_user_id: params.clerkUserId,
    p_plan_id: params.planId,
    p_paddle_transaction_id: params.paddleTransactionId,
    p_paddle_price_id: params.paddlePriceId,
    p_currency_code: params.currencyCode,
  });

  if (error) {
    logServerError("grantBetaPurchase.rpc", error, "process_beta_purchase_failed");
    return { ok: false, reason: "grant_failed" };
  }

  const row = (Array.isArray(data) ? data[0] : data) as
    | { ok: boolean; already_processed: boolean }
    | undefined;

  if (!row?.ok) return { ok: false, reason: "grant_failed" };

  return { ok: true, alreadyProcessed: row.already_processed === true };
}
