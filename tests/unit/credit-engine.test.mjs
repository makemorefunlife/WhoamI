/**
 * Credit engine — regression tests for the TS wrapper layer
 * (lib/credits/creditEngine.ts) around the reserve_credit / consume_credit /
 * release_credit / grant_credit Postgres RPCs. Mocks `supabase.rpc(...)`
 * only — the actual atomicity lives in the SQL functions themselves
 * (supabase/migrations/20260907020200_credit_engine_functions.sql), which
 * this suite does not re-test (no live DB here).
 *
 * Run: npx tsx tests/unit/credit-engine.test.mjs
 */
import assert from "node:assert/strict";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

const {
  reserveRelationshipCredit,
  consumeRelationshipCredit,
  releaseRelationshipCredit,
  grantCredits,
} = await import("../../lib/credits/creditEngine.ts");

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

const originalEnforcement = process.env.CREDIT_ENFORCEMENT;
function restoreEnforcement() {
  if (originalEnforcement === undefined) delete process.env.CREDIT_ENFORCEMENT;
  else process.env.CREDIT_ENFORCEMENT = originalEnforcement;
}

section("A. reserveRelationshipCredit — success passes through reservation id and balance");
{
  process.env.CREDIT_ENFORCEMENT = "true";
  const supabase = makeMockSupabase((fnName) => {
    assert.equal(fnName, "reserve_credit");
    return { data: [{ reservation_id: "res-1", ok: true, balance_after: 4 }], error: null };
  });
  const result = await reserveRelationshipCredit(supabase, {
    clerkUserId: "user_1",
    relationshipReportId: "rr-1",
    kind: "work",
    locale: "ko-KR",
    generationLockId: "lock-1",
    generationRequestId: "req-1",
  });
  assert.deepEqual(result, { ok: true, reservationId: "res-1", balanceAfter: 4, enforced: true });
  assert.equal(supabase.calls[0].args.p_credit_type, "relationship");
  assert.equal(supabase.calls[0].args.p_clerk_user_id, "user_1", "must charge the requesting user, not any other participant");
  assert.equal(supabase.calls[0].args.p_enforced, true);
  ok("reserve wraps the RPC result correctly and always charges the calling user's own clerkUserId");
  restoreEnforcement();
}

section("B. reserveRelationshipCredit — insufficient balance surfaces as a typed rejection, not an exception");
{
  process.env.CREDIT_ENFORCEMENT = "true";
  const supabase = makeMockSupabase(() => ({
    data: [{ reservation_id: null, ok: false, balance_after: null }],
    error: null,
  }));
  const result = await reserveRelationshipCredit(supabase, {
    clerkUserId: "user_1",
    relationshipReportId: "rr-1",
    kind: "work",
    locale: "ko-KR",
    generationLockId: "lock-1",
    generationRequestId: "req-2",
  });
  assert.deepEqual(result, { ok: false, reason: "insufficient_balance" });
  ok("insufficient balance is a typed { ok:false } result, caller doesn't need a try/catch");
  restoreEnforcement();
}

section("C. reserveRelationshipCredit — RPC-level error (not a business rejection) is distinguished");
{
  const supabase = makeMockSupabase(() => ({ data: null, error: { message: "connection reset" } }));
  const result = await reserveRelationshipCredit(supabase, {
    clerkUserId: "user_1",
    relationshipReportId: "rr-1",
    kind: "work",
    locale: "ko-KR",
    generationLockId: "lock-1",
    generationRequestId: "req-3",
  });
  assert.deepEqual(result, { ok: false, reason: "error" });
  ok("a genuine RPC/network error is reported distinctly from 'insufficient_balance'");
}

section("D. reserveRelationshipCredit — enforcement OFF (beta) still calls the RPC, marks enforced:false");
{
  delete process.env.CREDIT_ENFORCEMENT;
  const supabase = makeMockSupabase((fnName, args) => {
    assert.equal(args.p_enforced, false, "beta mode must still call the RPC, just with p_enforced=false");
    return { data: [{ reservation_id: "res-beta", ok: true, balance_after: 0 }], error: null };
  });
  const result = await reserveRelationshipCredit(supabase, {
    clerkUserId: "user_1",
    relationshipReportId: "rr-1",
    kind: "work",
    locale: "ko-KR",
    generationLockId: "lock-1",
    generationRequestId: "req-4",
  });
  assert.equal(result.ok, true);
  assert.equal(result.enforced, false);
  ok("with CREDIT_ENFORCEMENT unset (beta default), reserve still runs and records usage, just unenforced");
  restoreEnforcement();
}

section("E. consumeRelationshipCredit / releaseRelationshipCredit — call the right RPC with the right key");
{
  const supabase = makeMockSupabase(() => ({ data: true, error: null }));
  await consumeRelationshipCredit(supabase, "req-5");
  await releaseRelationshipCredit(supabase, "req-5b");
  assert.equal(supabase.calls[0].fnName, "consume_credit");
  assert.equal(supabase.calls[0].args.p_generation_request_id, "req-5");
  assert.equal(supabase.calls[1].fnName, "release_credit");
  assert.equal(supabase.calls[1].args.p_generation_request_id, "req-5b");
  ok("consume/release are keyed by generation_request_id, not reservation id or lock id");
}

section("F. grantCredits — routes source through to the RPC unchanged");
{
  const supabase = makeMockSupabase((fnName, args) => {
    assert.equal(fnName, "grant_credit");
    assert.equal(args.p_source, "one_time_purchase");
    assert.equal(args.p_amount, 5);
    return { data: 5, error: null };
  });
  const result = await grantCredits(supabase, {
    clerkUserId: "user_1",
    creditType: "relationship",
    amount: 5,
    source: "one_time_purchase",
  });
  assert.deepEqual(result, { ok: true, balanceAfter: 5 });
  ok("grant passes source/amount straight through — one shared entry point for membership/purchase/promo/admin");
}

console.log("\nAll credit engine wrapper tests passed.");
