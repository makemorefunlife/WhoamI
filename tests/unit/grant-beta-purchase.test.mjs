/**
 * grantBetaPurchase — thin wrapper around the atomic process_beta_purchase
 * RPC (supabase/migrations/20260907030100_process_beta_purchase_function.sql).
 * Mocks Supabase only (no live DB) — the actual atomicity (idempotency
 * claim + all grants in one Postgres transaction) is a DB-level guarantee
 * exercised live against DEV separately, not here. This suite verifies the
 * wrapper calls that ONE RPC with the right args and maps its result
 * correctly — it must NEVER fall back to multiple separate calls (that was
 * exactly the partial-grant bug this migration closed).
 *
 * Run: npx tsx tests/unit/grant-beta-purchase.test.mjs
 */
import assert from "node:assert/strict";
import { grantBetaPurchase } from "../../lib/payment/grantBetaPurchase.ts";

let passed = 0;
function ok(name) {
  passed += 1;
  console.log(`ok - ${name}`);
}
function section(title) {
  console.log(`\n=== ${title} ===`);
}

function makeMockSupabase(rpcResult) {
  const calls = [];
  const fromCalls = [];
  return {
    calls,
    fromCalls,
    from(table) {
      // grantBetaPurchase must never touch beta_purchase_grants directly
      // anymore — only the RPC does, atomically.
      fromCalls.push(table);
      throw new Error(`grantBetaPurchase must not call .from(${table}) directly`);
    },
    rpc(fnName, args) {
      calls.push({ fnName, args });
      return Promise.resolve(rpcResult);
    },
  };
}

const BASE = {
  clerkUserId: "user_test_1",
  paddleTransactionId: "txn_abc123",
  paddlePriceId: "pri_xxx",
  currencyCode: "KRW",
};

section("A. Unknown plan id — no RPC call at all");
{
  const supabase = makeMockSupabase({ data: null, error: null });
  const result = await grantBetaPurchase(supabase, { ...BASE, planId: "not_a_plan" });
  assert.deepEqual(result, { ok: false, reason: "unknown_plan" });
  assert.equal(supabase.calls.length, 0);
  ok("unknown plan id short-circuits before any RPC call");
}

section("B. Known plan — calls process_beta_purchase exactly once with all 5 args, nothing else");
{
  const supabase = makeMockSupabase({
    data: [{ ok: true, already_processed: false }],
    error: null,
  });
  const result = await grantBetaPurchase(supabase, { ...BASE, planId: "membership_beta" });
  assert.deepEqual(result, { ok: true, alreadyProcessed: false });
  assert.equal(supabase.calls.length, 1, "exactly one RPC call — never a separate insert + N grant calls");
  assert.equal(supabase.calls[0].fnName, "process_beta_purchase");
  assert.deepEqual(supabase.calls[0].args, {
    p_clerk_user_id: "user_test_1",
    p_plan_id: "membership_beta",
    p_paddle_transaction_id: "txn_abc123",
    p_paddle_price_id: "pri_xxx",
    p_currency_code: "KRW",
  });
  ok("a single process_beta_purchase call carries everything the atomic RPC needs — membership's personal+relationship split happens entirely inside that one transaction");
}

section("C. RPC reports already_processed:true — surfaced as alreadyProcessed, still ok");
{
  const supabase = makeMockSupabase({
    data: [{ ok: true, already_processed: true }],
    error: null,
  });
  const result = await grantBetaPurchase(supabase, { ...BASE, planId: "relationship_premium" });
  assert.deepEqual(result, { ok: true, alreadyProcessed: true });
  assert.equal(supabase.calls.length, 1, "a duplicate transaction is still exactly one round trip, not a claim-check then a separate no-op");
  ok("an already-processed transaction is reported as such without a second code path");
}

section("D. RPC-level error (network/permission/etc) surfaces as grant_failed");
{
  const supabase = makeMockSupabase({ data: null, error: { message: "boom" } });
  const result = await grantBetaPurchase(supabase, { ...BASE, planId: "personal_premium" });
  assert.deepEqual(result, { ok: false, reason: "grant_failed" });
  ok("an RPC error (e.g. the function raised — meaning EVERYTHING in it rolled back atomically) is reported as a failure, not a silent success");
}

section("E. RPC returning ok:false surfaces as grant_failed");
{
  const supabase = makeMockSupabase({ data: [{ ok: false, already_processed: false }], error: null });
  const result = await grantBetaPurchase(supabase, { ...BASE, planId: "additional_relationship" });
  assert.deepEqual(result, { ok: false, reason: "grant_failed" });
  ok("ok:false from the RPC itself is treated as a failure");
}

console.log(`\n${passed} passed`);
