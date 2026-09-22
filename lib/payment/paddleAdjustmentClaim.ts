import type { SupabaseClient } from "@supabase/supabase-js";
import { logServerError } from "@/lib/security/safeLog";

/**
 * Adjustment-id-level idempotency for refund clawback side effects --
 * separate from lib/payment/paddleWebhookState.ts's event-id-level claim.
 * See supabase/migrations/20260923010000_paddle_adjustment_idempotency.sql
 * for why the two are not the same thing: a single refund can arrive as
 * adjustment.created AND one or more adjustment.updated, each its own
 * legitimate event_id, all pointing at the same underlying adjustment.id.
 * This claim is what makes the actual clawback (mark_membership_refunded /
 * revoke_remaining_credit_for_grant) run at most once per adjustment.id
 * even under concurrent delivery of two different events for it.
 *
 * Deliberately a standalone module, not a generalization merged into
 * paddleWebhookState.ts -- kept isolated so this fix cannot regress the
 * already-tested event-level state machine.
 */

export type AdjustmentClaimResult =
  | "claimed"
  | "already_processed"
  | "in_progress"
  | "claim_error";

export async function claimPaddleAdjustmentRefund(
  supabase: SupabaseClient,
  params: {
    adjustmentId: string;
    action: string;
    status: string;
    transactionId: string | null;
    subscriptionId: string | null;
  },
): Promise<AdjustmentClaimResult> {
  const { data, error } = await supabase.rpc("claim_paddle_adjustment_refund", {
    p_adjustment_id: params.adjustmentId,
    p_action: params.action,
    p_status: params.status,
    p_transaction_id: params.transactionId,
    p_subscription_id: params.subscriptionId,
  });

  if (error) {
    logServerError("paddleAdjustmentClaim.claim", error, "claim_rpc_failed");
    return "claim_error";
  }

  if (data === "claimed" || data === "already_processed" || data === "in_progress") {
    return data;
  }

  logServerError("paddleAdjustmentClaim.claim", null, "unexpected_claim_result");
  return "claim_error";
}

export async function markPaddleAdjustmentProcessed(
  supabase: SupabaseClient,
  adjustmentId: string,
): Promise<boolean> {
  const { error } = await supabase.rpc("mark_paddle_adjustment_processed", {
    p_adjustment_id: adjustmentId,
  });
  if (error) {
    logServerError("paddleAdjustmentClaim.markProcessed", error, "mark_processed_failed");
    return false;
  }
  return true;
}

export async function markPaddleAdjustmentFailed(
  supabase: SupabaseClient,
  adjustmentId: string,
  lastError: string,
): Promise<boolean> {
  const { error } = await supabase.rpc("mark_paddle_adjustment_failed", {
    p_adjustment_id: adjustmentId,
    p_last_error: lastError,
  });
  if (error) {
    logServerError("paddleAdjustmentClaim.markFailed", error, "mark_failed_failed");
    return false;
  }
  return true;
}

export type AdjustmentProcessOnceResult =
  | { status: "processed" }
  | { status: "already_processed" }
  | { status: "in_progress" }
  | { status: "claim_error" }
  | { status: "handler_failed"; error: unknown };

/**
 * Claim -> run the clawback at most once -> mark done/failed, exactly the
 * same contract as paddleWebhookState.ts's processWebhookEventOnce, but
 * scoped to one Paddle adjustment.id instead of one webhook event_id.
 */
export async function processPaddleAdjustmentOnce(
  supabase: SupabaseClient,
  adjustment: {
    adjustmentId: string;
    action: string;
    status: string;
    transactionId: string | null;
    subscriptionId: string | null;
  },
  handler: () => Promise<void>,
): Promise<AdjustmentProcessOnceResult> {
  const claim = await claimPaddleAdjustmentRefund(supabase, adjustment);

  if (claim === "already_processed") return { status: "already_processed" };
  if (claim === "in_progress") return { status: "in_progress" };
  if (claim === "claim_error") return { status: "claim_error" };

  try {
    await handler();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await markPaddleAdjustmentFailed(supabase, adjustment.adjustmentId, message);
    return { status: "handler_failed", error };
  }

  await markPaddleAdjustmentProcessed(supabase, adjustment.adjustmentId);
  return { status: "processed" };
}
