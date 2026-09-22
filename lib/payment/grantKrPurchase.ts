import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveKrPlan } from "@/lib/payment/krPricing";
import { logServerError } from "@/lib/security/safeLog";

export type GrantKrPurchaseResult =
  | { ok: true; alreadyProcessed: boolean }
  | { ok: false; reason: "unknown_plan" | "grant_failed" };

/**
 * Thin wrapper around process_kr_purchase (see
 * supabase/migrations/20260922050000_kr_purchase_grants.sql). Same
 * single-round-trip, idempotent-on-paddle_transaction_id contract as
 * grantUsPurchase / grantBetaPurchase.
 */
export async function grantKrPurchase(
  supabase: SupabaseClient,
  params: {
    clerkUserId: string;
    planId: string;
    paddleTransactionId: string;
    paddlePriceId: string;
    currencyCode: string;
  },
): Promise<GrantKrPurchaseResult> {
  const plan = resolveKrPlan(params.planId);
  if (!plan) return { ok: false, reason: "unknown_plan" };

  const { data, error } = await supabase.rpc("process_kr_purchase", {
    p_clerk_user_id: params.clerkUserId,
    p_plan_id: params.planId,
    p_paddle_transaction_id: params.paddleTransactionId,
    p_paddle_price_id: params.paddlePriceId,
    p_currency_code: params.currencyCode,
  });

  if (error) {
    logServerError("grantKrPurchase.rpc", error, "process_kr_purchase_failed");
    return { ok: false, reason: "grant_failed" };
  }

  const row = (Array.isArray(data) ? data[0] : data) as
    | { ok: boolean; already_processed: boolean }
    | undefined;

  if (!row?.ok) return { ok: false, reason: "grant_failed" };

  return { ok: true, alreadyProcessed: row.already_processed === true };
}
