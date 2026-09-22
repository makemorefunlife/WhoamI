import type { SupabaseClient } from "@supabase/supabase-js";
import { logServerError } from "@/lib/security/safeLog";

/**
 * Thin wrapper around the webhook-event state-machine RPCs added in
 * supabase/migrations/20260923000000_paddle_webhook_idempotency_and_ordering.sql
 * (claim_paddle_webhook_event / mark_paddle_webhook_event_processed /
 * mark_paddle_webhook_event_failed). Kept separate from
 * app/api/webhooks/paddle/route.ts so the claim/retry/concurrency
 * DECISION LOGIC (processWebhookEventOnce below) can be unit-tested with a
 * mocked supabase.rpc(...), the same way lib/credits/creditEngine.ts is
 * tested against tests/unit/credit-engine.test.mjs -- the actual atomicity
 * guarantee lives in the SQL functions themselves and is not re-verified
 * here (no live DB in that test suite).
 */

export type ClaimResult = "claimed" | "already_processed" | "in_progress" | "claim_error";

export async function claimPaddleWebhookEvent(
  supabase: SupabaseClient,
  params: { eventId: string; eventType: string; occurredAt: string },
): Promise<ClaimResult> {
  const { data, error } = await supabase.rpc("claim_paddle_webhook_event", {
    p_paddle_event_id: params.eventId,
    p_event_type: params.eventType,
    p_occurred_at: params.occurredAt,
  });

  if (error) {
    logServerError("paddleWebhookState.claim", error, "claim_rpc_failed");
    return "claim_error";
  }

  if (data === "claimed" || data === "already_processed" || data === "in_progress") {
    return data;
  }

  logServerError("paddleWebhookState.claim", null, "unexpected_claim_result");
  return "claim_error";
}

export async function markPaddleWebhookEventProcessed(
  supabase: SupabaseClient,
  eventId: string,
): Promise<boolean> {
  const { error } = await supabase.rpc("mark_paddle_webhook_event_processed", {
    p_paddle_event_id: eventId,
  });
  if (error) {
    logServerError("paddleWebhookState.markProcessed", error, "mark_processed_failed");
    return false;
  }
  return true;
}

export async function markPaddleWebhookEventFailed(
  supabase: SupabaseClient,
  eventId: string,
  lastError: string,
): Promise<boolean> {
  const { error } = await supabase.rpc("mark_paddle_webhook_event_failed", {
    p_paddle_event_id: eventId,
    p_last_error: lastError,
  });
  if (error) {
    logServerError("paddleWebhookState.markFailed", error, "mark_failed_failed");
    return false;
  }
  return true;
}

export type ProcessOnceResult =
  | { status: "processed" }
  | { status: "already_processed" }
  | { status: "in_progress" }
  | { status: "claim_error" }
  | { status: "handler_failed"; error: unknown };

/**
 * The full claim -> run-handler-once -> mark-done-or-failed decision
 * logic, independent of Next.js/Request/Response so it can be exercised
 * directly in a plain Node test.
 *
 * Contract: `handler` runs AT MOST ONCE per call to this function, and
 * only when the claim result is "claimed". Every other claim result
 * returns without ever invoking `handler` -- this is what guarantees a
 * duplicate or concurrently-in-flight delivery never causes a second
 * entitlement grant, independent of (in addition to) the underlying
 * grant RPCs' own paddle_transaction_id uniqueness.
 */
export async function processWebhookEventOnce(
  supabase: SupabaseClient,
  event: { eventId: string; eventType: string; occurredAt: string },
  handler: () => Promise<void>,
): Promise<ProcessOnceResult> {
  const claim = await claimPaddleWebhookEvent(supabase, event);

  if (claim === "already_processed") return { status: "already_processed" };
  if (claim === "in_progress") return { status: "in_progress" };
  if (claim === "claim_error") return { status: "claim_error" };

  try {
    await handler();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await markPaddleWebhookEventFailed(supabase, event.eventId, message);
    return { status: "handler_failed", error };
  }

  await markPaddleWebhookEventProcessed(supabase, event.eventId);
  return { status: "processed" };
}
