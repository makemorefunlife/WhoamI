/**
 * Refund/adjustment idempotency audit -- regression tests.
 *
 * Paddle's webhook-EVENT idempotency (paddle_webhook_events, keyed on
 * event_id) does not by itself prevent double clawback: a single refund
 * commonly arrives as adjustment.created (often pending_approval) AND one
 * or more adjustment.updated (e.g. once it lands on approved) -- each its
 * own legitimate event_id, all pointing at the same underlying
 * adjustment.id. lib/payment/paddleAdjustmentClaim.ts adds a SECOND,
 * adjustment-id-level claim specifically for this. As with
 * tests/unit/paddle-webhook-idempotency.test.mjs and
 * tests/unit/credit-engine.test.mjs, this suite mocks supabase.rpc(...)
 * only -- the atomic INSERT ... ON CONFLICT ... DO UPDATE ... WHERE claim
 * itself lives in
 * supabase/migrations/20260923010000_paddle_adjustment_idempotency.sql
 * and is not re-verified against a live DB here.
 *
 * Run: npx tsx tests/unit/paddle-adjustment-idempotency.test.mjs
 */
import assert from "node:assert/strict";
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

const { processPaddleAdjustmentOnce } = await import(
  "../../lib/payment/paddleAdjustmentClaim.ts"
);

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

function baseAdjustment(overrides) {
  return {
    adjustmentId: "adj_1",
    action: "refund",
    status: "approved",
    transactionId: "txn_1",
    subscriptionId: null,
    ...overrides,
  };
}

section("1. adjustment.created(pending_approval) -> adjustment.updated(approved) -> clawback runs exactly once");
{
  // pending_approval never reaches the claim at all -- route.ts's
  // action/status gate filters it out before processPaddleAdjustmentOnce
  // is ever called. Verify that gate exists and runs BEFORE the claim.
  const routeSrc = readSrc("app/api/webhooks/paddle/route.ts");
  const gateIdx = routeSrc.indexOf('if (action !== "refund" || status !== "approved")');
  const claimCallIdx = routeSrc.indexOf("await processPaddleAdjustmentOnce(");
  assert.ok(gateIdx > -1 && claimCallIdx > -1 && gateIdx < claimCallIdx,
    "the refund+approved gate must run before the adjustment-id claim, so a pending_approval event never claims/consumes the adjustment_id");
  ok("route.ts filters non-approved statuses before ever claiming the adjustment_id");

  // Once the SAME adjustment transitions to approved (its first
  // actionable event, whatever event_id carried it), the claim must
  // succeed and run the clawback exactly once.
  const supabase = makeMockSupabase((fnName) => {
    if (fnName === "claim_paddle_adjustment_refund") return { data: "claimed", error: null };
    return { data: null, error: null };
  });
  let clawbacks = 0;
  const result = await processPaddleAdjustmentOnce(supabase, baseAdjustment(), async () => {
    clawbacks += 1;
  });
  assert.equal(result.status, "processed");
  assert.equal(clawbacks, 1);
  ok("the first approved event for the adjustment runs the clawback exactly once");
}

section("2. adjustment.created(approved) -> a later event for the SAME adjustment -> clawback still runs once");
{
  let claims = 0;
  const supabase = makeMockSupabase((fnName) => {
    if (fnName === "claim_paddle_adjustment_refund") {
      claims += 1;
      return { data: claims === 1 ? "claimed" : "already_processed", error: null };
    }
    return { data: null, error: null };
  });
  let clawbacks = 0;
  const adjustment = baseAdjustment({ adjustmentId: "adj_2" });
  const r1 = await processPaddleAdjustmentOnce(supabase, adjustment, async () => {
    clawbacks += 1;
  });
  // A follow-up event for the SAME adjustment_id (e.g. an
  // adjustment.updated Paddle sends after the created event, still
  // status=approved, no new information) must not run the handler again.
  const r2 = await processPaddleAdjustmentOnce(supabase, adjustment, async () => {
    clawbacks += 1;
  });
  assert.equal(r1.status, "processed");
  assert.equal(r2.status, "already_processed");
  assert.equal(clawbacks, 1, "a second event for an already-clawed-back adjustment must not run the handler again");
  ok("adjustment.created(approved) followed by another event for the same adjustment -> clawback runs once");
}

section("3. The exact same approved adjustment event is redelivered -> clawback still runs once");
{
  let claims = 0;
  const supabase = makeMockSupabase((fnName) => {
    if (fnName === "claim_paddle_adjustment_refund") {
      claims += 1;
      return { data: claims === 1 ? "claimed" : "already_processed", error: null };
    }
    return { data: null, error: null };
  });
  let clawbacks = 0;
  const adjustment = baseAdjustment({ adjustmentId: "adj_3", subscriptionId: "sub_1", transactionId: null });
  const handler = async () => {
    clawbacks += 1;
  };
  const r1 = await processPaddleAdjustmentOnce(supabase, adjustment, handler);
  const r2 = await processPaddleAdjustmentOnce(supabase, adjustment, handler); // exact redelivery
  assert.equal(r1.status, "processed");
  assert.equal(r2.status, "already_processed");
  assert.equal(clawbacks, 1);
  ok("redelivery of the identical approved adjustment event -> clawback runs exactly once");
}

section("4. Different adjustment ids are each processed independently");
{
  const processedIds = new Set();
  const supabase = makeMockSupabase((fnName, args) => {
    if (fnName === "claim_paddle_adjustment_refund") {
      const id = args.p_adjustment_id;
      if (processedIds.has(id)) return { data: "already_processed", error: null };
      processedIds.add(id);
      return { data: "claimed", error: null };
    }
    return { data: null, error: null };
  });
  let clawbacks = 0;
  const rA = await processPaddleAdjustmentOnce(
    supabase,
    baseAdjustment({ adjustmentId: "adj_A" }),
    async () => {
      clawbacks += 1;
    },
  );
  const rB = await processPaddleAdjustmentOnce(
    supabase,
    baseAdjustment({ adjustmentId: "adj_B" }),
    async () => {
      clawbacks += 1;
    },
  );
  assert.equal(rA.status, "processed");
  assert.equal(rB.status, "processed");
  assert.equal(clawbacks, 2, "two distinct adjustment ids must each run their own clawback");
  ok("two different adjustment ids are claimed and processed independently of one another");
}

section("5. Concurrency -- two deliveries for the same adjustment_id racing each other -> exactly one clawback");
{
  // This is the actual bug the audit found: revoke_remaining_credit_for_grant
  // / mark_membership_refunded are each individually safe against a
  // SEQUENTIAL second call (they only touch remaining > 0 / status <>
  // 'refunded' rows), but that does not protect against two CONCURRENT
  // deliveries both reading "remaining > 0" before either commits its
  // update -- a real double-clawback/double-ledger-entry race. The
  // adjustment-id claim is what actually closes it.
  let locked = false;
  const supabase = makeMockSupabase((fnName) => {
    if (fnName === "claim_paddle_adjustment_refund") {
      if (locked) return { data: "in_progress", error: null };
      locked = true;
      return { data: "claimed", error: null };
    }
    return { data: null, error: null };
  });
  let clawbacks = 0;
  const adjustment = baseAdjustment({ adjustmentId: "adj_concurrent" });
  const slowHandler = async () => {
    clawbacks += 1;
    await new Promise((resolve) => setTimeout(resolve, 10));
  };
  const [r1, r2] = await Promise.all([
    processPaddleAdjustmentOnce(supabase, adjustment, slowHandler),
    processPaddleAdjustmentOnce(supabase, adjustment, slowHandler),
  ]);
  const statuses = [r1.status, r2.status].sort();
  assert.deepEqual(statuses, ["in_progress", "processed"]);
  assert.equal(clawbacks, 1, "only one of two concurrent deliveries for the same adjustment_id may run the clawback");
  ok("two concurrent deliveries for the same adjustment_id -> exactly one actual clawback (the race the audit found)");
}

section("6. A failed clawback attempt can still be retried for the same adjustment_id");
{
  let attempt = 0;
  const supabase = makeMockSupabase((fnName) => {
    if (fnName === "claim_paddle_adjustment_refund") {
      // mark_paddle_adjustment_failed clears the lease, so a retry is
      // claimable again immediately, same as the event-level fix.
      return { data: "claimed", error: null };
    }
    return { data: null, error: null };
  });
  const adjustment = baseAdjustment({ adjustmentId: "adj_retry" });
  const handler = async () => {
    attempt += 1;
    if (attempt === 1) throw new Error("transient db hiccup during clawback");
  };
  const r1 = await processPaddleAdjustmentOnce(supabase, adjustment, handler);
  const r2 = await processPaddleAdjustmentOnce(supabase, adjustment, handler);
  assert.equal(r1.status, "handler_failed");
  assert.equal(r2.status, "processed");
  assert.equal(attempt, 2);
  assert.equal(
    supabase.calls.filter((c) => c.fnName === "mark_paddle_adjustment_failed").length,
    1,
  );
  assert.equal(
    supabase.calls.filter((c) => c.fnName === "mark_paddle_adjustment_processed").length,
    1,
  );
  ok("a failed clawback attempt is retried and eventually succeeds -- failure never permanently blocks a real refund");
}

section("7. Static checks: revoke_remaining_credit_for_grant / mark_membership_refunded are safe if re-called anyway (defense in depth)");
{
  const migrationSrc = readSrc(
    "supabase/migrations/20260922080000_paddle_webhooks_and_cancellation.sql",
  );
  assert.ok(
    migrationSrc.includes("and remaining > 0"),
    "revoke_remaining_credit_for_grant must only ever touch lots with remaining > 0, making a sequential re-call a no-op",
  );
  const membershipSrc = migrationSrc;
  assert.ok(
    membershipSrc.includes("update memberships") &&
      membershipSrc.includes("set status = 'refunded'"),
    "mark_membership_refunded must exist and set a terminal status",
  );
  ok("revoke_remaining_credit_for_grant and mark_membership_refunded remain individually safe against a sequential re-call, as defense in depth under the new adjustment-id claim");
}

console.log(`\n${passed} passed`);
