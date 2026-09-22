import { NextResponse } from "next/server";
import {
  createRouteSupabaseClient,
  supabaseConfigErrorResponse,
} from "@/lib/supabase/serverClient";
import { logServerError, logServerEvent } from "@/lib/security/safeLog";
import { verifyPaddleWebhookSignature } from "@/lib/payment/paddleWebhookVerify";
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
 *   2. Idempotency claim (claim_paddle_webhook_event) keyed on Paddle's
 *      own event_id -- a repeat delivery (Paddle retries on anything but
 *      a 2xx, and does not guarantee exactly-once even on success) short-
 *      circuits to 200 without reprocessing. This is independent of, and
 *      in addition to, the paddle_transaction_id unique constraints on
 *      the purchase-grant tables that grantUsPurchase/grantKrPurchase/
 *      grantUsAnnualRenewal already rely on.
 *   3. A switch on event_type. Every branch either performs its action or
 *      deliberately no-ops, then falls through to
 *      mark_paddle_webhook_event_processed and a 200. Unknown event types
 *      are logged and 200'd -- Paddle should never see us fail-closed on
 *      an event type we simply don't act on.
 *
 * Response codes are chosen so Paddle's own retry behavior does the right
 * thing: 400 only for a bad/missing signature (retrying won't help --
 * Paddle should treat this as a config problem, not resend); 500 for a
 * genuine internal error (retry may help, e.g. a transient DB hiccup);
 * 200 for anything successfully handled OR deliberately skipped.
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
  const data = asRecord(payload.data);

  if (!eventId || !eventType || !data) {
    logServerError("webhooks.paddle", null, "malformed_event_envelope");
    return NextResponse.json({ error: "malformed_event" }, { status: 400 });
  }

  const supabase = createRouteSupabaseClient();
  if (!supabase) return supabaseConfigErrorResponse();

  const { data: claimed, error: claimError } = await supabase.rpc(
    "claim_paddle_webhook_event",
    { p_paddle_event_id: eventId, p_event_type: eventType },
  );

  if (claimError) {
    logServerError("webhooks.paddle.claim", claimError, "claim_rpc_failed");
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }

  if (claimed !== true) {
    // Already seen (and already processed, or currently in flight from a
    // near-simultaneous redelivery) -- 200 without reprocessing.
    logServerEvent("webhooks.paddle", "duplicate_event_skipped");
    return NextResponse.json({ ok: true, duplicate: true });
  }

  try {
    await handleEvent(supabase, eventType, data);
  } catch (e) {
    logServerError("webhooks.paddle.handle", e, `handler_failed_${eventType}`);
    // Leave processed_at null -- claim_paddle_webhook_event already has
    // this event_id recorded, so a Paddle retry after this 500 will be
    // seen as a duplicate above and never actually re-run handleEvent.
    // That's an acceptable, explicit trade-off (never double-grant) --
    // see the idempotency note in the final report for how this is
    // meant to be operationally monitored (received_at with a null
    // processed_at older than a few minutes = needs manual look).
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }

  const { error: markError } = await supabase.rpc("mark_paddle_webhook_event_processed", {
    p_paddle_event_id: eventId,
  });
  if (markError) {
    logServerError("webhooks.paddle.mark", markError, "mark_processed_failed");
  }

  return NextResponse.json({ ok: true });
}

// ---------------------------------------------------------------------------
// Event handling
// ---------------------------------------------------------------------------

type SupabaseLike = ReturnType<typeof createRouteSupabaseClient>;

async function handleEvent(
  supabase: NonNullable<SupabaseLike>,
  eventType: string,
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
      });
      return;
    }

    case "subscription.canceled": {
      const subscriptionId = asString(data.id);
      if (!subscriptionId) return;
      await supabase.rpc("mark_membership_canceled", {
        p_paddle_subscription_id: subscriptionId,
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
      await handleAdjustment(supabase, data);
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
  data: Record<string, unknown>,
): Promise<void> {
  const action = asString(data.action);
  const status = asString(data.status);
  const type = asString(data.type);
  const subscriptionId = asString(data.subscription_id);
  const transactionId = asString(data.transaction_id);

  if (action !== "refund" || status !== "approved") {
    // Chargebacks, credits, pending/rejected refunds: logged only. A
    // pending_approval refund has not actually moved money yet, so
    // nothing should be revoked until it lands as "approved" (Paddle
    // will send a follow-up adjustment.updated when it does).
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

  if (subscriptionId) {
    await supabase.rpc("mark_membership_refunded", {
      p_paddle_subscription_id: subscriptionId,
    });
    return;
  }

  if (!transactionId) {
    logServerError("webhooks.paddle.adjustment", null, "refund_missing_ids");
    return;
  }

  const grantRow = await findPurchaseGrantByTransactionId(supabase, transactionId);
  if (!grantRow) {
    logServerError("webhooks.paddle.adjustment", null, "refund_grant_not_found");
    return;
  }

  await supabase.rpc("revoke_remaining_credit_for_grant", { p_grant_id: grantRow.id });
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
