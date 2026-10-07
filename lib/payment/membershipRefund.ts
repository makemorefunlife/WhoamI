import type { SupabaseClient } from "@supabase/supabase-js";
import { cancelTossPayment, findCancelByTag, getTossPayment, type TossResult } from "@/lib/payment/tossServer";
import { sameAmount } from "@/lib/payment/tossCatalog";
import { logServerError } from "@/lib/security/safeLog";

/**
 * Operator refund of a one-time 12-Month Membership.
 *
 * Money first, benefits second: the membership's benefits are ended only by
 * complete_membership_refund, which runs only after Toss confirms the
 * cancel. A failed or unknown provider result never touches benefits.
 *
 * Duplicate safety (three layers):
 *  - DB: one membership_refund_requests row per membership; attempts are
 *    claimed under a row lock (begin_membership_refund_attempt).
 *  - Toss: every attempt for the same request uses the same
 *    Idempotency-Key ("membership-refund-<requestId>"), so a retry after a
 *    timeout returns the original result instead of refunding again.
 *  - Reconciliation: cancelReason carries "membership_refund:<requestId>";
 *    on an ambiguous result we look the payment up and match that tag.
 */
export type RefundAttemptOutcome =
  | { status: "succeeded"; alreadySucceeded: boolean; providerReference: string | null }
  | { status: "failed"; error: string; retryable: true }
  | { status: "in_progress" }
  | { status: "not_found" | "missing_payment" };

export type RefundDeps = { cancel: typeof cancelTossPayment; get: typeof getTossPayment };
const defaultDeps: RefundDeps = { cancel: cancelTossPayment, get: getTossPayment };

function row<T>(data: unknown): T | undefined {
  return (Array.isArray(data) ? data[0] : data) as T | undefined;
}

export function refundTag(requestId: string): string {
  return `membership_refund:${requestId}`;
}

export async function executeMembershipRefundAttempt(
  supabase: SupabaseClient,
  requestId: string,
  deps: RefundDeps = defaultDeps,
): Promise<RefundAttemptOutcome> {
  const { data, error } = await supabase.rpc("begin_membership_refund_attempt", { p_request_id: requestId });
  if (error) {
    logServerError("membershipRefund", error, "begin_attempt_failed");
    return { status: "failed", error: "begin_attempt_failed", retryable: true };
  }
  const claim = row<{ result: string; payment_key: string | null; refund_amount: number; currency: string }>(data);
  if (!claim) return { status: "failed", error: "begin_attempt_failed", retryable: true };
  if (claim.result === "already_succeeded") return { status: "succeeded", alreadySucceeded: true, providerReference: null };
  if (claim.result === "in_progress") return { status: "in_progress" };
  if (claim.result === "not_found" || claim.result === "missing_payment") return { status: claim.result };
  if (claim.result !== "claimed" || !claim.payment_key) {
    return { status: "failed", error: `unexpected_claim_${claim.result}`, retryable: true };
  }

  const tag = refundTag(requestId);
  const amount = Number(claim.refund_amount);

  let result: TossResult = await deps.cancel({
    paymentKey: claim.payment_key,
    cancelReason: `${tag} (12-Month Membership early cancellation)`,
    cancelAmount: amount,
    idempotencyKey: `membership-refund-${requestId}`,
  });

  // Ambiguous answer (timeout / 5xx / "already canceled"-type rejection):
  // look the payment up and decide from the actual cancel history.
  if (result.kind !== "ok") {
    const lookup = await deps.get(claim.payment_key);
    if (lookup.kind === "ok" && findCancelByTag(lookup.payment, tag)) {
      result = lookup;
    }
  }

  if (result.kind === "ok") {
    const cancel = findCancelByTag(result.payment, tag);
    if (!cancel || !sameAmount(cancel.cancelAmount, amount)) {
      const err = cancel ? "cancel_amount_mismatch" : "cancel_not_found_in_payment";
      await supabase.rpc("fail_membership_refund", { p_request_id: requestId, p_error: err });
      return { status: "failed", error: err, retryable: true };
    }
    const { error: completeError } = await supabase.rpc("complete_membership_refund", {
      p_request_id: requestId,
      p_provider_reference: cancel.transactionKey || null,
    });
    if (completeError) {
      // Money moved but the DB write failed: retrying is safe (Toss returns
      // the same result for the same Idempotency-Key, then we complete).
      logServerError("membershipRefund", completeError, "complete_failed_after_provider_success");
      return { status: "failed", error: "complete_failed_after_provider_success", retryable: true };
    }
    return { status: "succeeded", alreadySucceeded: false, providerReference: cancel.transactionKey || null };
  }

  const err = result.kind === "rejected" ? `${result.code}: ${result.message}` : `unknown: ${result.reason}`;
  await supabase.rpc("fail_membership_refund", { p_request_id: requestId, p_error: err });
  return { status: "failed", error: err, retryable: true };
}
