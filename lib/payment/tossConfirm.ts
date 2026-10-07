import type { SupabaseClient } from "@supabase/supabase-js";
import {
  cancelTossPayment,
  confirmTossPayment,
  getTossPayment,
  type TossPayment,
  type TossResult,
} from "@/lib/payment/tossServer";
import { sameAmount } from "@/lib/payment/tossCatalog";
import { getActiveMembershipRow, membershipBlocksNewPurchase } from "@/lib/payment/membershipStatus";
import { logServerError, logServerEvent } from "@/lib/security/safeLog";

export type TossConfirmOutcome =
  /** Entitlement granted (or was already granted by an earlier request). */
  | { status: "granted"; alreadyProcessed: boolean; planId: string }
  /** Guest checkout: paid, waiting for the buyer to claim it into an account. */
  | { status: "awaiting_claim"; planId: string }
  /** Toss declined / buyer error. Nothing was charged. */
  | { status: "payment_failed"; code: string }
  /** Charged, but the grant has not finished -- safe to retry the same request. */
  | { status: "pending_retry"; reason: string }
  /** Charged, grant impossible (e.g. already a member) -> payment cancelled in full. */
  | { status: "refunded_automatically"; reason: string }
  /** Charged and could not auto-cancel -- needs an operator. */
  | { status: "needs_attention"; reason: string }
  | { status: "rejected"; reason: "not_found" | "mismatch" | "in_progress" | "closed" };

export type TossDeps = {
  confirm: typeof confirmTossPayment;
  get: typeof getTossPayment;
  cancel: typeof cancelTossPayment;
};

const defaultDeps: TossDeps = { confirm: confirmTossPayment, get: getTossPayment, cancel: cancelTossPayment };

/** Records a charged-but-unresolved Toss payment for an operator (idempotent per paymentKey). */
async function flagForOperator(
  supabase: SupabaseClient,
  params: { paymentKey: string; orderId: string; planId: string; reason: string },
): Promise<void> {
  const { error } = await supabase.from("payment_manual_reviews").upsert(
    {
      provider: "toss",
      provider_transaction_id: params.paymentKey,
      plan_id: params.planId,
      reason: params.reason,
      source: `toss_confirm:${params.orderId}`,
    },
    { onConflict: "provider,provider_transaction_id", ignoreDuplicates: true },
  );
  if (error) logServerError("toss.confirm", error, "manual_review_insert_failed");
}

function rpcRow<T>(data: unknown): T | undefined {
  return (Array.isArray(data) ? data[0] : data) as T | undefined;
}

function paymentMatchesOrder(
  payment: TossPayment,
  order: { orderId: string; amount: number; currency: string },
): boolean {
  return (
    payment.status === "DONE" &&
    payment.orderId === order.orderId &&
    payment.currency === order.currency &&
    sameAmount(payment.totalAmount, order.amount)
  );
}

/**
 * Server-side completion of a Toss payment-window purchase.
 *
 * Ordering guarantees:
 *  1. The order row (server-created amount/currency/owner) is CLAIMED first
 *     -- a tampered amount, another user's order, or a different
 *     paymentKey is refused before Toss is ever called.
 *  2. Membership eligibility is re-checked BEFORE confirm, so an ineligible
 *     buyer is never charged (Toss only captures on confirm).
 *  3. Toss confirm uses Idempotency-Key "confirm-<orderId>": a retry after a
 *     crash/timeout can never charge twice.
 *  4. The grant (process_toss_order) is idempotent on the order; if it fails
 *     transiently the order stays 'paid' and the same request can be
 *     retried. If it fails because the grant is impossible
 *     ('active_membership_exists'), the payment is cancelled in full.
 */
export async function completeTossOrder(
  supabase: SupabaseClient,
  /** clerkUserId null = guest checkout (the order must be a guest order). */
  input: { clerkUserId: string | null; orderId: string; paymentKey: string; amount: number },
  deps: TossDeps = defaultDeps,
): Promise<TossConfirmOutcome> {
  const guest = input.clerkUserId === null;
  const { data: claimData, error: claimError } = guest
    ? await supabase.rpc("claim_guest_toss_order_for_confirm", {
        p_order_id: input.orderId,
        p_payment_key: input.paymentKey,
        p_amount: input.amount,
      })
    : await supabase.rpc("claim_toss_order_for_confirm", {
        p_order_id: input.orderId,
        p_clerk_user_id: input.clerkUserId,
        p_payment_key: input.paymentKey,
        p_amount: input.amount,
      });
  if (claimError) {
    logServerError("toss.confirm", claimError, "claim_failed");
    return { status: "pending_retry", reason: "claim_failed" };
  }
  const claim = rpcRow<{ result: string; plan_id: string | null; amount: number | null; currency: string | null }>(claimData);
  if (!claim) return { status: "pending_retry", reason: "claim_failed" };

  switch (claim.result) {
    case "not_found":
      return { status: "rejected", reason: "not_found" };
    case "mismatch":
      logServerError("toss.confirm", null, "order_mismatch");
      return { status: "rejected", reason: "mismatch" };
    case "in_progress":
      return { status: "rejected", reason: "in_progress" };
    case "granted":
      return { status: "granted", alreadyProcessed: true, planId: claim.plan_id ?? "" };
    case "awaiting_claim":
      return { status: "awaiting_claim", planId: claim.plan_id ?? "" };
    case "paid":
      if (guest) return { status: "rejected", reason: "closed" };
      return grant(supabase, input, claim.plan_id ?? "", deps);
    case "claimed":
      break;
    default:
      // failed / canceled / refunded -- a closed order is never re-opened.
      return { status: "rejected", reason: "closed" };
  }

  const planId = claim.plan_id ?? "";
  const order = { orderId: input.orderId, amount: Number(claim.amount), currency: claim.currency ?? "" };

  if (planId === "us_annual_membership" && input.clerkUserId) {
    const active = await getActiveMembershipRow(supabase, input.clerkUserId);
    if (!active.ok) {
      // Leave 'confirming': nothing charged yet; a retry re-claims after the grace window.
      return { status: "pending_retry", reason: "membership_lookup_failed" };
    }
    if (active.row && membershipBlocksNewPurchase(active.row)) {
      await supabase.rpc("mark_toss_order_failed", { p_order_id: input.orderId, p_error: "already_member_before_confirm" });
      return { status: "payment_failed", code: "ALREADY_MEMBER" };
    }
  }

  let result: TossResult = await deps.confirm({
    paymentKey: input.paymentKey,
    orderId: input.orderId,
    amount: order.amount,
  });

  if (result.kind === "rejected" && result.code === "ALREADY_PROCESSED_PAYMENT") {
    result = await deps.get(input.paymentKey);
  }

  if (result.kind === "unknown") {
    // Outcome unknown (timeout / 5xx). Try to read the real state once.
    const lookup = await deps.get(input.paymentKey);
    if (lookup.kind === "ok" && lookup.payment.status === "DONE") {
      result = lookup;
    } else {
      // Order stays 'confirming'; after the grace window the same request
      // re-drives confirm with the same Idempotency-Key.
      logServerEvent("toss.confirm", `confirm_unknown_${result.reason}`);
      return { status: "pending_retry", reason: result.reason };
    }
  }

  if (result.kind === "rejected") {
    await supabase.rpc("mark_toss_order_failed", {
      p_order_id: input.orderId,
      p_error: `${result.code}: ${result.message}`,
    });
    return { status: "payment_failed", code: result.code };
  }

  if (!paymentMatchesOrder(result.payment, order)) {
    // Approved something we did not order -- cancel it rather than grant.
    logServerError("toss.confirm", null, "approved_payment_mismatch");
    const cancel = await deps.cancel({
      paymentKey: input.paymentKey,
      cancelReason: `order_mismatch:${input.orderId}`,
      idempotencyKey: `mismatch-cancel-${input.orderId}`,
    });
    await supabase.rpc("mark_toss_order_failed", { p_order_id: input.orderId, p_error: "approved_payment_mismatch" });
    if (cancel.kind === "ok") return { status: "refunded_automatically", reason: "payment_mismatch" };
    await flagForOperator(supabase, { paymentKey: input.paymentKey, orderId: input.orderId, planId, reason: "payment_mismatch_cancel_failed" });
    return { status: "needs_attention", reason: "payment_mismatch_cancel_failed" };
  }

  const { error: paidError } = await supabase.rpc("mark_toss_order_paid", {
    p_order_id: input.orderId,
    p_payment_key: input.paymentKey,
    p_method: result.payment.method,
    p_approved_at: result.payment.approvedAt ?? new Date().toISOString(),
  });
  if (paidError) {
    logServerError("toss.confirm", paidError, "mark_paid_failed");
    return { status: "pending_retry", reason: "mark_paid_failed" };
  }

  // Guest: money is captured; the entitlement is granted only when the buyer
  // claims the order into a verified account (claimGuestTossOrders).
  if (guest) return { status: "awaiting_claim", planId };

  return grant(supabase, input, planId, deps);
}

export type GuestClaimResult = {
  orderId: string;
  result: "claimed" | "already_claimed" | "claimed_by_other" | "email_mismatch" | "not_paid" | "not_found" | "error";
};

/**
 * Attaches paid guest orders to the signed-in account. Ownership proof is
 * the account's VERIFIED email addresses (read server-side from Clerk by the
 * caller) -- the order can only be claimed by an account that verified the
 * same email the buyer entered at checkout. With no orderIds, claims every
 * paid, unclaimed guest order for those emails.
 */
export async function claimGuestTossOrders(
  supabase: SupabaseClient,
  params: { clerkUserId: string; verifiedEmails: string[]; orderIds?: string[] },
): Promise<GuestClaimResult[]> {
  const emails = [...new Set(params.verifiedEmails.map((e) => e.trim().toLowerCase()).filter(Boolean))];
  if (emails.length === 0) return (params.orderIds ?? []).map((orderId) => ({ orderId, result: "email_mismatch" }));

  let orderIds = params.orderIds ?? [];
  if (orderIds.length === 0) {
    const { data, error } = await supabase
      .from("toss_payment_orders")
      .select("order_id")
      .is("clerk_user_id", null)
      .eq("status", "paid")
      .in("guest_email", emails)
      .limit(20);
    if (error) {
      logServerError("toss.guestClaim", error, "list_failed");
      return [];
    }
    orderIds = (data ?? []).map((r: { order_id: string }) => r.order_id);
  }

  const out: GuestClaimResult[] = [];
  for (const orderId of orderIds) {
    const { data, error } = await supabase.rpc("claim_paid_guest_toss_order", {
      p_order_id: orderId,
      p_clerk_user_id: params.clerkUserId,
      p_verified_emails: emails,
    });
    if (error) {
      logServerError("toss.guestClaim", error, "claim_failed");
      out.push({ orderId, result: "error" });
      continue;
    }
    const row = rpcRow<{ result: GuestClaimResult["result"] }>(data);
    out.push({ orderId, result: row?.result ?? "error" });
  }
  return out;
}

async function grant(
  supabase: SupabaseClient,
  input: { orderId: string; paymentKey: string },
  planId: string,
  deps: TossDeps,
): Promise<TossConfirmOutcome> {
  const { data, error } = await supabase.rpc("process_toss_order", { p_order_id: input.orderId });
  if (!error) {
    const row = rpcRow<{ ok: boolean; already_processed: boolean }>(data);
    if (row?.ok) return { status: "granted", alreadyProcessed: row.already_processed === true, planId };
    return { status: "pending_retry", reason: "grant_not_ok" };
  }

  if (!String(error.message ?? "").includes("active_membership_exists")) {
    logServerError("toss.confirm", error, "grant_failed_retryable");
    return { status: "pending_retry", reason: "grant_failed" };
  }

  // Raced into a second membership after confirm: refund in full.
  const cancel = await deps.cancel({
    paymentKey: input.paymentKey,
    cancelReason: `already_member:${input.orderId}`,
    idempotencyKey: `already-member-cancel-${input.orderId}`,
  });
  if (cancel.kind === "ok") {
    await supabase.rpc("mark_toss_order_canceled", { p_order_id: input.orderId, p_error: "active_membership_exists" });
    return { status: "refunded_automatically", reason: "already_member" };
  }
  logServerError("toss.confirm", null, "already_member_cancel_failed");
  await flagForOperator(supabase, { paymentKey: input.paymentKey, orderId: input.orderId, planId, reason: "already_member_cancel_failed" });
  return { status: "needs_attention", reason: "already_member_cancel_failed" };
}
