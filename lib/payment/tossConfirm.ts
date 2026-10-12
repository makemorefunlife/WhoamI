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
import { decideTestGrant, guestTestBuyerAllowed, testAllowlistRequired, testGrantLimit, testOrderRestricted, tossKeyIsTest, type TestGrantDecision } from "@/lib/payment/tossTestMode";
import { sendGuestPurchaseEmail, type GuestEmailStatus } from "@/lib/email/guestPurchaseEmail";
import type { MailSender } from "@/lib/email/resend";

export type TossConfirmOutcome =
  /** Entitlement granted (or was already granted by an earlier request). */
  | { status: "granted"; alreadyProcessed: boolean; planId: string }
  /** Guest checkout: paid, waiting for the buyer to claim it into an account. */
  | { status: "awaiting_claim"; planId: string; emailStatus: GuestEmailStatus }
  /**
   * Toss TEST payment on a public deployment by a non-allowlisted buyer (or
   * over the test quantity limit): recorded as status 'test_completed',
   * nothing granted. No real money moved (test keys).
   */
  | { status: "test_no_grant"; reason: string }
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
  /** Purchase-guide email sender (guest orders). Defaults to Postmark. */
  mail?: MailSender;
};

const defaultDeps: TossDeps = { confirm: confirmTossPayment, get: getTossPayment, cancel: cancelTossPayment };

type OrderMeta = {
  is_test: boolean | null;
  guest_email: string | null;
  payment_key: string | null;
  test_grant_blocked_reason: string | null;
};

async function readOrderMeta(supabase: SupabaseClient, orderId: string): Promise<OrderMeta | null> {
  const { data, error } = await supabase
    .from("toss_payment_orders")
    .select("is_test, guest_email, payment_key, test_grant_blocked_reason")
    .eq("order_id", orderId)
    .maybeSingle();
  if (error) {
    logServerError("toss.confirm", error, "order_meta_failed");
    return null;
  }
  return (data as OrderMeta | null) ?? null;
}

/**
 * A paid TEST order that must not become an entitlement (public deployment,
 * buyer not allowlisted or over the test quantity limit): closed as
 * 'test_completed' -- recorded as a completed test, kept apart from real
 * purchases, nothing granted. Not cancelled at Toss: test keys move no money.
 */
async function completeTestWithoutGrant(
  supabase: SupabaseClient,
  params: { orderId: string; reason: string },
): Promise<TossConfirmOutcome> {
  const { error } = await supabase.rpc("complete_toss_test_without_grant", {
    p_order_id: params.orderId,
    p_reason: params.reason,
  });
  if (error) {
    logServerError("toss.confirm", error, "test_complete_failed");
    return { status: "pending_retry", reason: "test_complete_failed" };
  }
  logServerEvent("toss.confirm", `test_no_grant_${params.reason}`);
  return { status: "test_no_grant", reason: params.reason };
}

async function guestAwaitingClaim(
  supabase: SupabaseClient,
  orderId: string,
  planId: string,
  deps: TossDeps,
): Promise<TossConfirmOutcome> {
  // Queue first (durable), then try once right away; the background sender
  // (/api/cron/guest-emails) picks up anything not sent here.
  await supabase.rpc("queue_guest_purchase_email", { p_order_id: orderId });
  const emailStatus = await sendGuestPurchaseEmail(supabase, orderId, deps.mail ? { send: deps.mail } : undefined);
  return { status: "awaiting_claim", planId, emailStatus };
}

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

/** Test guest orders of this purchase email that went through (not blocked), other than this one. */
async function countGuestTestOrders(supabase: SupabaseClient, email: string, exceptOrderId: string): Promise<number | null> {
  const { data, error } = await supabase
    .from("toss_payment_orders")
    .select("order_id")
    .eq("is_test", true)
    .eq("guest_email", email.trim().toLowerCase())
    .in("status", ["paid", "granted"])
    .limit(100);
  if (error) {
    logServerError("toss.confirm", error, "test_count_failed");
    return null;
  }
  return ((data ?? []) as { order_id: string }[]).filter((r) => r.order_id !== exceptOrderId).length;
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
  input: {
    clerkUserId: string | null;
    orderId: string;
    paymentKey: string;
    amount: number;
    /**
     * Members only: server-side allowlist decision for TEST orders on a public
     * deployment (uses the Clerk user id + Clerk-verified emails).
     */
    testAccess?: () => Promise<TestGrantDecision>;
  },
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
    case "test_completed":
      return { status: "test_no_grant", reason: "test_completed" };
    case "awaiting_claim": {
      const meta = await readOrderMeta(supabase, input.orderId);
      if (meta?.test_grant_blocked_reason) return { status: "test_no_grant", reason: meta.test_grant_blocked_reason };
      return guestAwaitingClaim(supabase, input.orderId, claim.plan_id ?? "", deps);
    }
    case "paid": {
      if (guest) return { status: "rejected", reason: "closed" };
      const meta = await readOrderMeta(supabase, input.orderId);
      if (!meta) return { status: "pending_retry", reason: "order_meta_failed" };
      if (meta.test_grant_blocked_reason) return { status: "test_no_grant", reason: meta.test_grant_blocked_reason };
      if (testOrderRestricted(meta.is_test === true)) {
        const decision = input.testAccess ? await input.testAccess() : ({ allowed: false, reason: "not_allowlisted" } as const);
        if (!decision.allowed) {
          return completeTestWithoutGrant(supabase, { orderId: input.orderId, reason: decision.reason });
        }
      }
      return grant(supabase, input, claim.plan_id ?? "", deps);
    }
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
  if (result.payment.receiptUrl) {
    await supabase.rpc("set_toss_order_receipt", { p_order_id: input.orderId, p_receipt_url: result.payment.receiptUrl });
  }

  const meta = await readOrderMeta(supabase, input.orderId);
  if (!meta) return { status: "pending_retry", reason: "order_meta_failed" };
  if (testOrderRestricted(meta.is_test === true)) {
    if (guest) {
      // The checkout email is browser input: it only decides whether the flow
      // continues (guide email to an allowlisted address). The grant is still
      // decided on the claiming account (claimGuestTossOrders).
      if (!guestTestBuyerAllowed(meta.guest_email)) {
        return completeTestWithoutGrant(supabase, { orderId: input.orderId, reason: "not_allowlisted" });
      }
      // Test buyer: at most TOSS_TEST_GRANT_LIMIT open test orders
      // per purchase email (same limit as accounts). Using one still needs the
      // purchase email to be proven (emailed link / code) -- the confirm route
      // opens no same-browser session for these orders.
      const used = await countGuestTestOrders(supabase, meta.guest_email as string, input.orderId);
      if (used === null) return { status: "pending_retry", reason: "test_count_failed" };
      if (used >= testGrantLimit()) {
        return completeTestWithoutGrant(supabase, { orderId: input.orderId, reason: "limit_reached" });
      }
    } else {
      const decision = input.testAccess ? await input.testAccess() : ({ allowed: false, reason: "not_allowlisted" } as const);
      if (!decision.allowed) {
        return completeTestWithoutGrant(supabase, { orderId: input.orderId, reason: decision.reason });
      }
    }
  }

  // Guest: money is captured; the entitlement is granted only when the buyer
  // claims the order into a verified account (claimGuestTossOrders). The
  // purchase-guide email goes out now (separately from the approval).
  if (guest) return guestAwaitingClaim(supabase, input.orderId, planId, deps);

  return grant(supabase, input, planId, deps);
}

export type GuestClaimResult = {
  orderId: string;
  result:
    | "claimed"
    | "already_claimed"
    | "claimed_by_other"
    | "email_mismatch"
    | "not_paid"
    | "not_found"
    | "test_not_allowed"
    | "in_progress"
    | "already_member_refunded"
    | "needs_attention"
    | "error";
  planId?: string;
  /** Guest Personal already used without an account: the report saved into this account. */
  reportId?: string | null;
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
  deps: TossDeps = defaultDeps,
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
    // Test payments on a public deployment: only allowlisted accounts (by
    // Clerk user id / Clerk-verified email), within the quantity limit.
    const { data: metaRow } = await supabase
      .from("toss_payment_orders")
      .select("is_test, guest_email, payment_key, test_grant_blocked_reason, clerk_user_id, status, plan_id")
      .eq("order_id", orderId)
      .maybeSingle();
    const meta = metaRow as (OrderMeta & { clerk_user_id: string | null; status: string; plan_id: string }) | null;
    if (meta?.test_grant_blocked_reason || meta?.status === "test_completed") {
      out.push({ orderId, result: "test_not_allowed" });
      continue;
    }
    if (
      meta &&
      testOrderRestricted(meta.is_test === true) &&
      meta.clerk_user_id === null &&
      meta.status === "paid" &&
      meta.guest_email &&
      emails.includes(meta.guest_email)
    ) {
      const decision = await decideTestGrant(supabase, { clerkUserId: params.clerkUserId, verifiedEmails: emails });
      if (!decision.allowed) {
        await completeTestWithoutGrant(supabase, { orderId, reason: decision.reason });
        out.push({ orderId, result: "test_not_allowed" });
        continue;
      }
    }
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
    const row = rpcRow<{ result: string }>(data);
    const result = row?.result ?? "error";

    if (result === "guest_used") {
      // Used without an account: save that report into this account (same
      // verified-email rule) -- never a second credit.
      const { data: saved, error: saveError } = await supabase.rpc("save_guest_personal_to_account", {
        p_order_id: orderId,
        p_clerk_user_id: params.clerkUserId,
        p_verified_emails: emails,
      });
      const s = rpcRow<{ result: string; report_id: string | null }>(saved);
      if (saveError || !s) {
        if (saveError) logServerError("toss.guestClaim", saveError, "guest_save_failed");
        out.push({ orderId, result: "error", planId: meta?.plan_id });
      } else {
        out.push({
          orderId,
          result: s.result === "saved" || s.result === "already_saved" ? "claimed" : "error",
          planId: meta?.plan_id,
          reportId: s.report_id,
        });
      }
      continue;
    }
    if (result === "guest_use_in_progress") {
      out.push({ orderId, result: "in_progress", planId: meta?.plan_id });
      continue;
    }
    if (result === "already_member") {
      // Guest-bought membership, but this account already has an active one:
      // refund the new purchase in full instead of a second membership.
      const cancel = meta?.payment_key
        ? await deps.cancel({
            paymentKey: meta.payment_key,
            cancelReason: `already_member:${orderId}`,
            idempotencyKey: `already-member-cancel-${orderId}`,
          })
        : ({ kind: "unknown", reason: "no_payment_key" } as const);
      if (cancel.kind === "ok") {
        await supabase.rpc("mark_toss_order_canceled", { p_order_id: orderId, p_error: "active_membership_exists" });
        out.push({ orderId, result: "already_member_refunded", planId: meta?.plan_id });
      } else {
        await flagForOperator(supabase, {
          paymentKey: meta?.payment_key ?? orderId,
          orderId,
          planId: meta?.plan_id ?? "",
          reason: "guest_membership_duplicate_cancel_failed",
        });
        out.push({ orderId, result: "needs_attention", planId: meta?.plan_id });
      }
      continue;
    }
    out.push({ orderId, result: result as GuestClaimResult["result"], planId: meta?.plan_id });
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

/**
 * 2026-10-12: test orders closed only because the buyer was not on the old
 * allowlist ("not_allowlisted"), or over a test limit that has since been
 * raised ("limit_reached", TOSS_TEST_GRANT_LIMIT), are reopened -- no new
 * purchase -- when:
 * the allowlist is no longer required, the server key is a TEST key, Toss
 * still reports the payment DONE for the same order and amount (a cancelled
 * payment stays closed), and the buyer is under the test limit. Then the
 * normal path runs: guest -> purchase-guide email + use after email proof;
 * member -> pass granted (same idempotent grant, per-account limit).
 *
 * Who: { guestEmail } -- guest orders of that email (the guide goes only to
 * that address); { clerkUserId, verifiedEmails } -- this account's own
 * orders and guest orders of its Clerk-verified emails.
 */
const RECOVERABLE_TEST_BLOCKS = ["not_allowlisted", "limit_reached"];

export async function recoverBlockedTestOrders(
  supabase: SupabaseClient,
  who: { guestEmail: string } | { clerkUserId: string; verifiedEmails: string[] },
  deps: TossDeps = defaultDeps,
): Promise<number> {
  if (!tossKeyIsTest() || testAllowlistRequired()) return 0;
  const base = () =>
    supabase
      .from("toss_payment_orders")
      .select("order_id, payment_key, amount, currency, clerk_user_id, guest_email, created_at")
      .eq("is_test", true)
      .eq("status", "test_completed")
      .in("test_grant_blocked_reason", RECOVERABLE_TEST_BLOCKS)
      .order("created_at", { ascending: false })
      .limit(10);
  type Row = { order_id: string; payment_key: string | null; amount: number | string; currency: string; clerk_user_id: string | null; guest_email: string | null };
  const rows: Row[] = [];
  if ("guestEmail" in who) {
    const { data, error } = await base().is("clerk_user_id", null).eq("guest_email", who.guestEmail.trim().toLowerCase());
    if (error) logServerError("toss.testRecover", error, "list_failed");
    rows.push(...((data ?? []) as Row[]));
  } else {
    const emails = [...new Set(who.verifiedEmails.map((e) => e.trim().toLowerCase()).filter(Boolean))];
    const own = await base().eq("clerk_user_id", who.clerkUserId);
    if (own.error) logServerError("toss.testRecover", own.error, "list_failed");
    rows.push(...((own.data ?? []) as Row[]));
    if (emails.length) {
      const guest = await base().is("clerk_user_id", null).in("guest_email", emails);
      if (guest.error) logServerError("toss.testRecover", guest.error, "list_failed");
      rows.push(...((guest.data ?? []) as Row[]));
    }
  }

  let reopened = 0;
  for (const o of rows) {
    if (!o.payment_key) continue;
    const order = { orderId: o.order_id, amount: Number(o.amount), currency: o.currency };
    const lookup = await deps.get(o.payment_key);
    if (lookup.kind !== "ok" || !paymentMatchesOrder(lookup.payment, order)) continue; // cancelled / unknown: stays closed
    const isGuest = o.clerk_user_id === null;
    if (isGuest) {
      const open = await countGuestTestOrders(supabase, o.guest_email ?? "", o.order_id);
      if (open === null || open >= testGrantLimit()) continue;
    }
    const { data: upd, error } = await supabase
      .from("toss_payment_orders")
      .update({
        status: "paid",
        test_grant_blocked_reason: null,
        ...(isGuest ? { guest_email_status: null, guest_email_next_attempt_at: null } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", o.order_id)
      .eq("status", "test_completed")
      .in("test_grant_blocked_reason", RECOVERABLE_TEST_BLOCKS)
      .select("order_id");
    if (error || !Array.isArray(upd) || upd.length !== 1) {
      if (error) logServerError("toss.testRecover", error, "reopen_failed");
      continue;
    }
    reopened++;
    logServerEvent("toss.testRecover", isGuest ? "reopened_guest" : "reopened_member");
    // Same path as a fresh approval (idempotent, limits re-checked).
    await completeTossOrder(
      supabase,
      {
        clerkUserId: o.clerk_user_id,
        orderId: o.order_id,
        paymentKey: o.payment_key,
        amount: order.amount,
        testAccess:
          !isGuest && "clerkUserId" in who
            ? () => decideTestGrant(supabase, { clerkUserId: who.clerkUserId, verifiedEmails: who.verifiedEmails })
            : undefined,
      },
      deps,
    );
  }
  return reopened;
}

