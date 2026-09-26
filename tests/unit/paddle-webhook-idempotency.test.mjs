/**
 * Paddle webhook idempotency/retry/ordering fix — regression tests.
 *
 * Covers:
 *   A. Signature verification (valid / tampered / stale timestamp).
 *   B. processWebhookEventOnce state machine (lib/payment/paddleWebhookState.ts)
 *      -- mocks supabase.rpc(...) only, same convention as
 *      tests/unit/credit-engine.test.mjs: the actual atomicity of the
 *      claim (INSERT ... ON CONFLICT ... DO UPDATE ... WHERE) lives in
 *      supabase/migrations/20260923000000_paddle_webhook_idempotency_and_ordering.sql
 *      and is not re-verified here (no live DB in this suite). What IS
 *      verified here is the decision logic built on top of whatever the
 *      claim RPC reports: given a claim result, does the handler run
 *      exactly the right number of times, and does the right follow-up
 *      RPC (mark processed / mark failed / neither) get called.
 *   C. Static source checks that app/api/webhooks/paddle/route.ts passes
 *      occurred_at through to every membership-state RPC, and that the
 *      new migration's stale-event guard is actually present in all
 *      three ordering-sensitive functions.
 *
 * Run: npx tsx tests/unit/paddle-webhook-idempotency.test.mjs
 */
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../..");

let passed = 0;
function ok(name) {
  passed += 1;
  console.log(`ok - ${name}`);
}
function section(title) {
  console.log(`\n=== ${title} ===`);
}
function readSrc(relPath) {
  return readFileSync(join(root, relPath), "utf8");
}

process.env.PADDLE_SANDBOX_WEBHOOK_SECRET = "test_secret_do_not_use_in_prod";

const { verifyPaddleWebhookSignature } = await import(
  "../../lib/payment/paddleWebhookVerify.ts"
);
const { processWebhookEventOnce } = await import(
  "../../lib/payment/paddleWebhookState.ts"
);

function signBody(body, ts, secret = process.env.PADDLE_SANDBOX_WEBHOOK_SECRET) {
  const h1 = createHmac("sha256", secret).update(`${ts}:${body}`).digest("hex");
  return `ts=${ts};h1=${h1}`;
}

section("A. verifyPaddleWebhookSignature");
{
  const body = JSON.stringify({ event_id: "evt_1", event_type: "customer.created" });
  const now = Math.floor(Date.now() / 1000);
  const sig = signBody(body, now);

  assert.equal(verifyPaddleWebhookSignature(body, sig), true);
  ok("valid signature within tolerance is accepted");

  assert.equal(verifyPaddleWebhookSignature(body + "x", sig), false);
  ok("a body that doesn't match the signature is rejected");

  const lastChar = sig.slice(-1);
  const flippedChar = lastChar === "0" ? "1" : "0";
  const badSig = sig.slice(0, -1) + flippedChar;
  assert.equal(verifyPaddleWebhookSignature(body, badSig), false);
  ok("a tampered h1 is rejected");

  const staleTs = now - 30; // MAX_SIGNATURE_AGE_SECONDS is 5
  assert.equal(verifyPaddleWebhookSignature(body, signBody(body, staleTs)), false);
  ok("a timestamp older than the 5-second tolerance is rejected");

  assert.equal(verifyPaddleWebhookSignature(body, null), false);
  ok("a missing signature header is rejected");
}

section("B. processWebhookEventOnce -- state machine over a mocked supabase.rpc");
{
  function makeMockSupabase(rpcImpl) {
    const calls = [];
    return {
      calls,
      rpc(fnName, args) {
        calls.push({ fnName, args });
        return Promise.resolve(rpcImpl(fnName, args));
      },
    };
  }

  // B1. Same event delivered twice -- handler must run exactly once.
  {
    let claims = 0;
    const supabase = makeMockSupabase((fnName) => {
      if (fnName === "claim_paddle_webhook_event") {
        claims += 1;
        return { data: claims === 1 ? "claimed" : "already_processed", error: null };
      }
      return { data: null, error: null };
    });
    let handlerRuns = 0;
    const event = { eventId: "evt_dup", eventType: "subscription.created", occurredAt: "2026-01-01T00:00:00Z" };
    const r1 = await processWebhookEventOnce(supabase, event, async () => {
      handlerRuns += 1;
    });
    const r2 = await processWebhookEventOnce(supabase, event, async () => {
      handlerRuns += 1;
    });
    assert.equal(r1.status, "processed");
    assert.equal(r2.status, "already_processed");
    assert.equal(handlerRuns, 1, "handler must run exactly once across two deliveries of the same event");
    assert.ok(
      supabase.calls.some((c) => c.fnName === "mark_paddle_webhook_event_processed"),
      "successful first run must mark the event processed",
    );
    ok("same event delivered twice -> entitlement handler runs exactly once");
  }

  // B2. First processing attempt fails; a retry of the same event succeeds.
  {
    let attempt = 0;
    const supabase = makeMockSupabase((fnName) => {
      if (fnName === "claim_paddle_webhook_event") {
        // mark_paddle_webhook_event_failed clears the lease, so a retry
        // is claimable again immediately -- the mock always says
        // "claimed" here to reflect that.
        return { data: "claimed", error: null };
      }
      return { data: null, error: null };
    });
    let handlerRuns = 0;
    const event = { eventId: "evt_retry", eventType: "subscription.updated", occurredAt: "2026-01-01T00:00:00Z" };
    const handler = async () => {
      handlerRuns += 1;
      attempt += 1;
      if (attempt === 1) throw new Error("transient db hiccup");
    };
    const r1 = await processWebhookEventOnce(supabase, event, handler);
    const r2 = await processWebhookEventOnce(supabase, event, handler);
    assert.equal(r1.status, "handler_failed");
    assert.equal(r2.status, "processed");
    assert.equal(handlerRuns, 2);
    assert.equal(
      supabase.calls.filter((c) => c.fnName === "mark_paddle_webhook_event_failed").length,
      1,
    );
    assert.equal(
      supabase.calls.filter((c) => c.fnName === "mark_paddle_webhook_event_processed").length,
      1,
    );
    ok("first processing attempt fails -> retry of the same event succeeds");
  }

  // B3. An already-fully-processed event is redelivered -- pure no-op.
  {
    const supabase = makeMockSupabase((fnName) => {
      if (fnName === "claim_paddle_webhook_event") {
        return { data: "already_processed", error: null };
      }
      return { data: null, error: null };
    });
    let handlerRuns = 0;
    const event = { eventId: "evt_done", eventType: "subscription.canceled", occurredAt: "2026-01-01T00:00:00Z" };
    const r = await processWebhookEventOnce(supabase, event, async () => {
      handlerRuns += 1;
    });
    assert.equal(r.status, "already_processed");
    assert.equal(handlerRuns, 0, "handler must never run for an already-processed event");
    assert.equal(
      supabase.calls.filter((c) => c.fnName.startsWith("mark_paddle_webhook_event")).length,
      0,
      "no mark-processed/failed call should happen for a no-op duplicate",
    );
    ok("a redelivered, already-processed event is a pure no-op (handler never runs)");
  }

  // B4. Two concurrent deliveries of the same event -- only one side effect.
  // This tests the ORCHESTRATION contract (processWebhookEventOnce never
  // invokes handler for a claim result other than "claimed"), using a
  // mock that stands in for what the atomic SQL claim guarantees: the
  // second concurrent caller sees "in_progress" rather than "claimed".
  // Whether the real Postgres upsert actually serializes two truly
  // simultaneous callers this way is a property of the SQL function
  // itself (see the migration's doc comment) and is out of scope for a
  // no-live-DB unit test, exactly like credit-engine.test.mjs's stated
  // scope for the underlying credit RPCs.
  {
    let locked = false;
    const supabase = makeMockSupabase((fnName) => {
      if (fnName === "claim_paddle_webhook_event") {
        if (locked) return { data: "in_progress", error: null };
        locked = true;
        return { data: "claimed", error: null };
      }
      return { data: null, error: null };
    });
    let handlerRuns = 0;
    const event = { eventId: "evt_concurrent", eventType: "transaction.completed", occurredAt: "2026-01-01T00:00:00Z" };
    const slowHandler = async () => {
      handlerRuns += 1;
      await new Promise((resolve) => setTimeout(resolve, 10));
    };
    const [r1, r2] = await Promise.all([
      processWebhookEventOnce(supabase, event, slowHandler),
      processWebhookEventOnce(supabase, event, slowHandler),
    ]);
    const statuses = [r1.status, r2.status].sort();
    assert.deepEqual(statuses, ["in_progress", "processed"]);
    assert.equal(handlerRuns, 1, "only one of two concurrent deliveries may run the handler");
    ok("two concurrent deliveries of the same event -> exactly one actual side effect");
  }

  // B5. The claim RPC itself errors -- handler must never run.
  {
    const supabase = makeMockSupabase((fnName) => {
      if (fnName === "claim_paddle_webhook_event") {
        return { data: null, error: { message: "connection reset" } };
      }
      return { data: null, error: null };
    });
    let handlerRuns = 0;
    const event = { eventId: "evt_claim_err", eventType: "adjustment.created", occurredAt: "2026-01-01T00:00:00Z" };
    const r = await processWebhookEventOnce(supabase, event, async () => {
      handlerRuns += 1;
    });
    assert.equal(r.status, "claim_error");
    assert.equal(handlerRuns, 0);
    ok("a claim RPC error never runs the handler (fails closed, route returns 500 so Paddle retries)");
  }
}

section("C. Static source checks -- occurred_at wiring and stale-event guard");
{
  const routeSrc = readSrc("app/api/webhooks/paddle/route.ts");
  assert.ok(
    routeSrc.includes("p_event_occurred_at: occurredAt") &&
      (routeSrc.match(/p_event_occurred_at: occurredAt/g) || []).length >= 3,
    "subscription.updated, subscription.canceled, and refund adjustment handling must all forward occurred_at to their RPCs",
  );
  assert.ok(
    routeSrc.includes("processWebhookEventOnce"),
    "route must use the shared claim/retry state machine rather than reimplementing it inline",
  );
  ok("route.ts forwards occurred_at to every ordering-sensitive membership RPC");

  const migrationSrc = readSrc(
    "supabase/migrations/20260923000000_paddle_webhook_idempotency_and_ordering.sql",
  );
  const guardClause = "last_paddle_event_at is null or last_paddle_event_at <= p_event_occurred_at";
  const guardCount = (migrationSrc.match(new RegExp(guardClause.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
  assert.equal(
    guardCount,
    3,
    "set_membership_cancel_schedule, mark_membership_canceled, and mark_membership_refunded must all guard against a stale (out-of-order) event",
  );
  ok("migration guards all three membership-state functions against out-of-order events");

  assert.ok(
    migrationSrc.includes("processed_at is null") &&
      migrationSrc.includes("processing_started_at is null") &&
      migrationSrc.includes("make_interval(secs => v_lease_seconds)"),
    "claim_paddle_webhook_event must distinguish processed from in-flight/failed via a lease, not just row existence",
  );
  ok("claim_paddle_webhook_event's SQL implements the received/processed/in-flight state machine, not a bare existence check");
}

section("D. Entitlement-grant failures must stay retryable, not be marked processed");
{
  const routeSrc = readSrc("app/api/webhooks/paddle/route.ts");
  for (const failureLog of [
    "renewal_grant_failed",
    "us_purchase_grant_failed",
    "kr_purchase_grant_failed",
  ]) {
    const logCallIndex = routeSrc.indexOf(`"${failureLog}"`);
    assert.ok(logCallIndex !== -1, `${failureLog} log call must still exist`);
    const nearby = routeSrc.slice(logCallIndex, logCallIndex + 500);
    assert.ok(
      nearby.includes(`throw new Error("${failureLog}")`),
      `${failureLog} must be followed by a throw -- if grantUsPurchase/` +
        `grantUsAnnualRenewal/grantKrPurchase fails, handleTransactionCompleted ` +
        `must not swallow it and return normally, or processWebhookEventOnce ` +
        `will mark the event processed and Paddle will never redeliver it ` +
        `(see section B2 above for the retry contract this depends on).`,
    );
  }
  ok("every entitlement-grant failure branch throws so the event stays failed/retryable instead of being marked processed");
}

console.log(`\n${passed} passed`);
