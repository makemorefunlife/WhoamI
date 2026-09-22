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
    providerTransactionId: string;
    providerPriceId: string;
    currencyCode: string;
    /** Which processor handled this purchase. Paddle Sandbox only today --
     * KR may switch to Toss Payments later based on operational data, and
     * this is the one field that would change; nothing else in this
     * function or in process_kr_purchase has any Paddle-specific
     * dependency. */
    paymentProvider?: string;
  },
): Promise<GrantKrPurchaseResult> {
  const plan = resolveKrPlan(params.planId);
  if (!plan) return { ok: false, reason: "unknown_plan" };

  const { data, error } = await supabase.rpc("process_kr_purchase", {
    p_clerk_user_id: params.clerkUserId,
    p_plan_id: params.planId,
    p_provider_transaction_id: params.providerTransactionId,
    p_provider_price_id: params.providerPriceId,
    p_currency_code: params.currencyCode,
    p_payment_provider: params.paymentProvider ?? "paddle",
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
