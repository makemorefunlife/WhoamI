import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveUsPlan } from "@/lib/payment/usPricing";
import { logServerError } from "@/lib/security/safeLog";

export type GrantUsPurchaseResult =
  | { ok: true; alreadyProcessed: boolean }
  | { ok: false; reason: "unknown_plan" | "grant_failed" };

/**
 * Thin wrapper around process_us_purchase (see
 * supabase/migrations/20260922040300_us_membership_functions.sql). Same
 * single-round-trip contract as grantBetaPurchase: the paddle_transaction_id
 * idempotency claim and every credit/membership/coupon grant for the plan
 * happen inside that one Postgres function call, so a retry after a
 * mid-flight failure either finds nothing committed (safe to redo) or finds
 * everything already committed (already_processed: true) -- never a partial
 * state.
 *
 * For `us_annual_membership`, paddlePaddleSubscriptionId is REQUIRED --
 * process_us_annual_renewal looks the membership up by it, so an initial
 * purchase recorded without it can never be renewed later.
 */
export async function grantUsPurchase(
  supabase: SupabaseClient,
  params: {
    clerkUserId: string;
    planId: string;
    paddleTransactionId: string;
    paddlePriceId: string;
    currencyCode: string;
    paddleSubscriptionId?: string;
  },
): Promise<GrantUsPurchaseResult> {
  const plan = resolveUsPlan(params.planId);
  if (!plan) return { ok: false, reason: "unknown_plan" };

  if (plan.planId === "us_annual_membership" && !params.paddleSubscriptionId?.trim()) {
    logServerError("grantUsPurchase", null, "missing_subscription_id_for_annual");
    return { ok: false, reason: "grant_failed" };
  }

  const { data, error } = await supabase.rpc("process_us_purchase", {
    p_clerk_user_id: params.clerkUserId,
    p_plan_id: params.planId,
    p_paddle_transaction_id: params.paddleTransactionId,
    p_paddle_price_id: params.paddlePriceId,
    p_currency_code: params.currencyCode,
    p_paddle_subscription_id: params.paddleSubscriptionId ?? null,
  });

  if (error) {
    logServerError("grantUsPurchase.rpc", error, "process_us_purchase_failed");
    return { ok: false, reason: "grant_failed" };
  }

  const row = (Array.isArray(data) ? data[0] : data) as
    | { ok: boolean; already_processed: boolean }
    | undefined;

  if (!row?.ok) return { ok: false, reason: "grant_failed" };

  return { ok: true, alreadyProcessed: row.already_processed === true };
}

export type GrantUsRenewalResult =
  | { ok: true; alreadyProcessed: boolean }
  | { ok: false; reason: "grant_failed" };

/**
 * Thin wrapper around process_us_annual_renewal -- called once per annual
 * renewal transaction (a real, separate Paddle transaction each year, not a
 * synthetic monthly event). Idempotent on that transaction's own id, same
 * pattern as grantUsPurchase.
 */
export async function grantUsAnnualRenewal(
  supabase: SupabaseClient,
  params: {
    clerkUserId: string;
    paddleTransactionId: string;
    paddlePriceId: string;
    currencyCode: string;
    paddleSubscriptionId: string;
  },
): Promise<GrantUsRenewalResult> {
  const { data, error } = await supabase.rpc("process_us_annual_renewal", {
    p_clerk_user_id: params.clerkUserId,
    p_paddle_transaction_id: params.paddleTransactionId,
    p_paddle_price_id: params.paddlePriceId,
    p_currency_code: params.currencyCode,
    p_paddle_subscription_id: params.paddleSubscriptionId,
  });

  if (error) {
    logServerError("grantUsAnnualRenewal.rpc", error, "process_us_annual_renewal_failed");
    return { ok: false, reason: "grant_failed" };
  }

  const row = (Array.isArray(data) ? data[0] : data) as
    | { ok: boolean; already_processed: boolean }
    | undefined;

  if (!row?.ok) return { ok: false, reason: "grant_failed" };

  return { ok: true, alreadyProcessed: row.already_processed === true };
}
