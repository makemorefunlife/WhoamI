import { NextResponse } from "next/server";
import {
  createRouteSupabaseClient,
  supabaseConfigErrorResponse,
} from "@/lib/supabase/serverClient";
import { logServerError, logServerEvent } from "@/lib/security/safeLog";
import { verifyPaddleWebhookSignature } from "@/lib/payment/paddleWebhookVerify";
import { processWebhookEventOnce } from "@/lib/payment/paddleWebhookState";
import { processPaddleAdjustmentOnce } from "@/lib/payment/paddleAdjustmentClaim";
import { grantUsAnnualRenewal, grantUsPurchase } from "@/lib/payment/grantUsPurchase";
import { grantKrPurchase } from "@/lib/payment/grantKrPurchase";
import { resolveRegionalPlan, regionalPlanHasPriceId } from "@/lib/payment/resolveRegionalPlan";

export const runtime = "nodejs";

/** Refuse to even parse a body larger than this -- a real Paddle event
 * payload is well under this; anything bigger is not a legitimate
 * delivery and isn't worth spending JSON.parse or HMAC compute on. */
const MAX_WEBHOOK_BODY_BYTES = 512 * 1024;

/**
 * Real Paddle (Billing/Payments v2) webhook endpoint -- Sandbox only for
 * this pass (PADDLE_SANDBOX_API_SECRET_KEY / PADDLE_SANDBOX_WEBHOOK_SECRET
 * are both Sandbox credentials; nothing here talks to Live Paddle).
 *
 * Every request goes through, in order:
 *   1. Raw-body signature verification (verifyPaddleWebhookSignature) --
 *      BEFORE any JSON.parse, using the exact bytes Paddle sent.
 *   2. processWebhookEventOnce (lib/payment/paddleWebhookState.ts) --
 *      atomically claims the event by Paddle's own event_id and runs
 *      handleEvent AT MOST ONCE per successful claim. See that module's
 *      doc comment and supabase/migrations/
 *      20260923000000_paddle_webhook_idempotency_and_ordering.sql for the
 *      full received-vs-processed-vs-in-flight state machine -- this is
 *      independent of, and in addition to, the paddle_transaction_id
 *      unique constraints the purchase-grant tables already enforce.
 *
 * Response codes are chosen so Paddle's own retry behavior does the right
 * thing:
 *   - 400: bad/missing signature, malformed envelope, oversized body --
 *     retrying will never help, this is a delivery/config problem.
 *   - 409: another delivery of this same event is currently inside its
 *     processing lease (see claim_paddle_webhook_event) -- ask Paddle to
 *     retry later rather than silently trusting the in-flight attempt to
 *     finish.
 *   - 500: the claim RPC itself failed, or the handler threw -- Paddle
 *     should retry (mark_paddle_webhook_event_failed has already cleared
 *     the lease, so a fast retry can reclaim immediately).
 *   - 200: already processed (no-op) or successfully processed just now.
 */
export async function POST(req: Request) {
  const rawBody = await req.text();
  if (rawBody.length > MAX_WEBHOOK_BODY_BYTES) {
    return NextResponse.json({ error: "payload_too_large" }, { status: 400 });
  }

  const signatureHeader = req.headers.get("paddle-signature");
  if (!verifyPaddleWebhookSignature(rawBody, signatureHeader)) {
    logServerError("webhooks.paddle", null, "signature_verification_failed");
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch (e) {
    logServerError("webhooks.paddle", e, "invalid_json");
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const eventId = typeof payload.event_id === "string" ? payload.event_id : "";
  const eventType = typeof payload.event_type === "string" ? payload.event_type : "";
  const occurredAt = typeof payload.occurred_at === "string" ? payload.occurred_at : "";
  const data = asRecord(payload.data);

  if (!eventId || !eventType || !occurredAt || !data) {
    logServerError("webhooks.paddle", null, "malformed_event_envelope");
    return NextResponse.json({ error: "malformed_event" }, { status: 400 });
  }

  const supabase = createRouteSupabaseClient();
  if (!supabase) return supabaseConfigErrorResponse();

  const result = await processWebhookEventOnce(
    supabase,
    { eventId, eventType, occurredAt },
    () => handleEvent(supabase, eventType, occurredAt, data),
  );

  switch (result.status) {
    case "processed":
      return NextResponse.json({ ok: true });
    case "already_processed":
      logServerEvent("webhooks.paddle", "duplicate_event_skipped");
      return NextResponse.json({ ok: true, duplicate: true });
    case "in_progress":
      logServerEvent("webhooks.paddle", "event_in_progress_elsewhere");
      return NextResponse.json({ error: "in_progress" }, { status: 409 });
    case "claim_error":
      return NextResponse.json({ error: "internal_error" }, { status: 500 });
    case "handler_failed":
      logServerError("webhooks.paddle.handle", result.error, `handler_failed_${eventType}`);
      return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// Event handling
// ---------------------------------------------------------------------------

type SupabaseLike = ReturnType<typeof createRouteSupabaseClient>;

async function handleEvent(
  supabase: NonNullable<SupabaseLike>,
  eventType: string,
  occurredAt: string,
  data: Record<string, unknown>,
): Promise<void> {
  switch (eventType) {
    case "subscription.created":
    case "subscription.activated": {
      // Informational only. The authoritative initial-grant path is
      // transaction.completed (below), which carries price/custom_data
      // needed to actually grant anything; a subscription.* event alone
      // never grants credit.
      logServerEvent("webhooks.paddle", `noop_${eventType}`);
      return;
    }

    case "subscription.updated": {
      const subscriptionId = asString(data.id);
      if (!subscriptionId) return;
      const scheduledChange = asRecord(data.scheduled_change);
      const isScheduledToCancel = scheduledChange?.action === "cancel";
      await supabase.rpc("set_membership_cancel_schedule", {
        p_paddle_subscription_id: subscriptionId,
        p_cancel_at_period_end: isScheduledToCancel,
        p_event_occurred_at: occurredAt,
      });
      return;
    }

    case "subscription.canceled": {
      const subscriptionId = asString(data.id);
      if (!subscriptionId) return;
      await supabase.rpc("mark_membership_canceled", {
        p_paddle_subscription_id: subscriptionId,
        p_event_occurred_at: occurredAt,
      });
      return;
    }

    case "transaction.completed": {
      await handleTransactionCompleted(supabase, data);
      return;
    }

    case "transaction.payment_failed": {
      // No entitlement change -- rely on Paddle's own dunning process.
      // If retries are exhausted Paddle eventually fires
      // subscription.canceled, which mark_membership_canceled handles.
      logServerEvent("webhooks.paddle", "payment_failed_logged");
      return;
    }

    case "adjustment.created":
    case "adjustment.updated": {
      await handleAdjustment(supabase, occurredAt, data);
      return;
    }

    default: {
      logServerEvent("webhooks.paddle", `unhandled_event_type`);
      return;
    }
  }
}

async function handleTransactionCompleted(
  supabase: NonNullable<SupabaseLike>,
  data: Record<string, unknown>,
): Promise<void> {
  const transactionId = asString(data.id);
  const currencyCode = asString(data.currency_code);
  const subscriptionId = asString(data.subscription_id);
  const origin = asString(data.origin);
  const priceIds = extractPriceIds(data.items);

  if (!transactionId || !currencyCode) {
    logServerError("webhooks.paddle.transaction", null, "missing_required_fields");
    return;
  }

  if (origin === "subscription_recurring" && subscriptionId) {
    // Automatic renewal charge -- never trust custom_data for this path
    // (Paddle does not reliably propagate checkout-time custom_data onto
    // a recurring-billing transaction). Look the owner up by OUR OWN
    // memberships.paddle_subscription_id instead, which was recorded at
    // initial-purchase time from a value we ourselves verified.
    const { data: membership, error } = await supabase
      .from("memberships")
      .select("clerk_user_id")
      .eq("paddle_subscription_id", subscriptionId)
      .maybeSingle();

    if (error || !membership?.clerk_user_id) {
      logServerError(
        "webhooks.paddle.transaction",
        error,
        "renewal_membership_not_found",
      );
      return;
    }

    const priceId = priceIds[0] ?? "";
    const result = await grantUsAnnualRenewal(supabase, {
      clerkUserId: membership.clerk_user_id as string,
      paddleTransactionId: transactionId,
      paddlePriceId: priceId,
      currencyCode,
      paddleSubscriptionId: subscriptionId,
    });

    if (!result.ok) {
      logServerError("webhooks.paddle.transaction", null, "renewal_grant_failed");
    }
    return;
  }

  // Otherwise: an initial-purchase backstop. The client-driven
  // /api/pricing/checkout/complete (and /api/beta/checkout/complete) is
  // the PRIMARY path for this -- it runs the moment the buyer's own
  // browser confirms checkout. This branch exists only to catch the case
  // where that never happens (tab closed before the completion fetch
  // fired, network drop, etc.); it is idempotent with that primary path
  // via the same paddle_transaction_id unique constraint, so whichever
  // one runs first wins and the other becomes a harmless no-op.
  const customData = asRecord(data.custom_data);
  const planId = asString(customData?.planId);
  const clerkUserId = asString(customData?.clerkUserId);
  if (!planId || !clerkUserId) {
    // No usable custom_data -- nothing we can safely attribute this
    // transaction to. Not an error: plenty of transactions (e.g. the
    // renewal case above) legitimately lack it.
    return;
  }

  const match = resolveRegionalPlan(planId);
  if (!match) {
    logServerError("webhooks.paddle.transaction", null, "unknown_plan_id");
    return;
  }

  const matchedPriceId = priceIds.find((id) => regionalPlanHasPriceId(match, id));
  if (!matchedPriceId) {
    logServerError("webhooks.paddle.transaction", null, "price_mismatch");
    return;
  }

  if (match.region === "us") {
    if (match.planId === "us_annual_membership" && !subscriptionId) {
      logServerError("webhooks.paddle.transaction", null, "annual_missing_subscription_id");
      return;
    }
    const result = await grantUsPurchase(supabase, {
      clerkUserId,
      planId,
      paddleTransactionId: transactionId,
      paddlePriceId: matchedPriceId,
      currencyCode,
      paddleSubscriptionId: subscriptionId ?? undefined,
    });
    if (!result.ok) {
      logServerError("webhooks.paddle.transaction", null, "us_purchase_grant_failed");
    }
    return;
  }

  const result = await grantKrPurchase(supabase, {
    clerkUserId,
    planId,
    providerTransactionId: transactionId,
    providerPriceId: matchedPriceId,
    currencyCode,
    paymentProvider: "paddle",
  });
  if (!result.ok) {
    logServerError("webhooks.paddle.transaction", null, "kr_purchase_grant_failed");
  }
}

async function handleAdjustment(
  supabase: NonNullable<SupabaseLike>,
  occurredAt: string,
  data: Record<string, unknown>,
): Promise<void> {
  const adjustmentId = asString(data.id);
  const action = asString(data.action);
  const status = asString(data.status);
  const type = asString(data.type);
  const subscriptionId = asString(data.subscription_id);
  const transactionId = asString(data.transaction_id);

  if (action !== "refund" || status !== "approved") {
    // Chargebacks, credits, pending/rejected refunds: logged only. A
    // pending_approval refund has not actually moved money yet, so
    // nothing should be revoked until it lands as "approved" (Paddle
    // will send a follow-up adjustment.updated when it does). Nothing
    // is claimed at the adjustment-id level for these -- only an
    // actually-actionable (refund, approved, full) event ever reaches
    // the claim below.
    logServerEvent("webhooks.paddle", `adjustment_noop_${action ?? "unknown"}_${status ?? "unknown"}`);
    return;
  }

  if (type !== "full") {
    // Deliberate scope limitation: a partial refund needs manual review
    // -- there is no reliable automatic way to translate "$X of $Y
    // refunded" into "revoke exactly this many credits" for either a
    // one-time purchase or a membership term. Flagged in the final
    // report as a blocker/manual-process item, not solved here.
    logServerError("webhooks.paddle.adjustment", null, "partial_refund_needs_manual_review");
    return;
  }

  if (!adjustmentId) {
    logServerError("webhooks.paddle.adjustment", null, "adjustment_missing_id");
    return;
  }

  // A single real-world refund can arrive as adjustment.created AND one
  // or more adjustment.updated -- each its own legitimate, independently
  // event-id-claimed webhook delivery, but all pointing at this SAME
  // adjustment.id. The outer event-id claim (processWebhookEventOnce)
  // does nothing to stop two of THOSE from both reaching this point
  // concurrently, so the actual clawback is claimed a second time here,
  // keyed on adjustment_id (see lib/payment/paddleAdjustmentClaim.ts and
  // supabase/migrations/20260923010000_paddle_adjustment_idempotency.sql).
  const claim = await processPaddleAdjustmentOnce(
    supabase,
    { adjustmentId, action, status, transactionId, subscriptionId },
    async () => {
      if (subscriptionId) {
        await supabase.rpc("mark_membership_refunded", {
          p_paddle_subscription_id: subscriptionId,
          p_event_occurred_at: occurredAt,
        });
        return;
      }

      if (!transactionId) {
        throw new Error("refund_missing_ids");
      }

      const grantRow = await findPurchaseGrantByTransactionId(supabase, transactionId);
      if (!grantRow) {
        throw new Error("refund_grant_not_found");
      }

      await supabase.rpc("revoke_remaining_credit_for_grant", { p_grant_id: grantRow.id });
    },
  );

  if (claim.status === "processed" || claim.status === "already_processed") {
    return;
  }

  // "in_progress" (a concurrent delivery for this same adjustment_id is
  // currently clawing it back), "claim_error", and "handler_failed" all
  // become a thrown error here, which processWebhookEventOnce (the OUTER,
  // event-id-level state machine) turns into a 500 -- Paddle retries the
  // whole event later, by which point the adjustment-level claim will
  // have resolved to either "processed" (clean no-op next time) or be
  // reclaimable again (its own lease/failure handling, same as the
  // event-level one).
  if (claim.status === "handler_failed") {
    throw claim.error instanceof Error ? claim.error : new Error(String(claim.error));
  }
  throw new Error(`adjustment_claim_${claim.status}`);
}

async function findPurchaseGrantByTransactionId(
  supabase: NonNullable<SupabaseLike>,
  transactionId: string,
): Promise<{ table: string; id: string } | null> {
  const tables = ["us_purchase_grants", "kr_purchase_grants", "beta_purchase_grants"] as const;
  for (const table of tables) {
    const { data: row } = await supabase
      .from(table)
      .select("id")
      .eq("paddle_transaction_id", transactionId)
      .maybeSingle();
    if (row?.id) return { table, id: row.id as string };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Small, defensive unknown-JSON helpers -- a webhook payload is untrusted
// input even after signature verification (the signature proves it came
// from Paddle, not that every field is shaped the way we expect).
// ---------------------------------------------------------------------------

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function extractPriceIds(items: unknown): string[] {
  if (!Array.isArray(items)) return [];
  const out: string[] = [];
  for (const item of items) {
    const rec = asRecord(item);
    if (!rec) continue;
    const price = asRecord(rec.price);
    const id = asString(price?.id) ?? asString(rec.price_id);
    if (id) out.push(id);
  }
  return out;
}
