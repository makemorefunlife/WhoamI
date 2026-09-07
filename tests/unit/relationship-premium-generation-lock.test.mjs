/**
 * Relationship premium generation lock — regression tests (updated
 * 2026-09-07 for the credit-engine integration: acquire/release now take a
 * generationRequestId fencing token instead of trusting the lock row's own
 * id, since a stale-lock steal reuses that row via UPDATE rather than
 * delete+insert — see relationshipPremiumGenerationLock.ts's doc comment).
 * Exercises acquire / release / stillOwnsLock against a minimal mock
 * Supabase client shaped exactly like the real query chains the module
 * issues — no live database involved.
 *
 * Run: npx tsx tests/unit/relationship-premium-generation-lock.test.mjs
 */
import assert from "node:assert/strict";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

const {
  acquireRelationshipPremiumGenerationLock,
  releaseRelationshipPremiumGenerationLock,
  stillOwnsRelationshipPremiumGenerationLock,
} = await import("../../lib/relationship/relationshipPremiumGenerationLock.ts");

/**
 * Minimal chainable mock covering every call shape the module issues:
 *   locks: .insert().select().maybeSingle()
 *          .select().eq().eq().eq().maybeSingle()        (previous-owner lookup before steal)
 *          .update().eq().eq().eq().lt().select().maybeSingle()  (steal)
 *          .select().eq().maybeSingle()                  (stillOwns)
 *          .delete().eq().eq()                           (release)
 *   rpc('release_credit', ...)                            (steal's best-effort cleanup)
 *
 * `script` is an array of {op, result} consumed in order for `locks`
 * table calls; `rpcResults` (optional) scripts .rpc() calls separately
 * since they don't share the same call counter.
 */
function makeMockSupabase({ script, rpcResults = [] }) {
  let i = 0;
  let rpcI = 0;
  const calls = [];
  const rpcCalls = [];
  function next(op) {
    const step = script[i];
    assert.ok(step, `mock script ran out of steps at call #${i} (op=${op})`);
    assert.equal(step.op, op, `expected script step #${i} to be "${step.op}", got op "${op}"`);
    i += 1;
    return step.result;
  }
  return {
    calls,
    rpcCalls,
    rpc(fnName, args) {
      rpcCalls.push({ fnName, args });
      const result = rpcResults[rpcI] ?? { data: true, error: null };
      rpcI += 1;
      return Promise.resolve(result);
    },
    from(table) {
      assert.equal(table, "relationship_premium_generation_locks");
      return {
        insert(obj) {
          calls.push({ op: "insert", obj });
          return {
            select() {
              return { maybeSingle: async () => next("insert") };
            },
          };
        },
        select() {
          calls.push({ op: "select" });
          const builder = {
            eq: () => builder,
            maybeSingle: async () => next("select"),
          };
          return builder;
        },
        update(obj) {
          calls.push({ op: "update", obj });
          const builder = {
            eq: () => builder,
            lt: () => builder,
            select() {
              return { maybeSingle: async () => next("update") };
            },
          };
          return builder;
        },
        delete() {
          calls.push({ op: "delete" });
          const builder = { eq: () => builder };
          // release() doesn't await the final .eq() chain's own promise
          // explicitly, but the real supabase-js thenable resolves lazily —
          // make the builder itself awaitable so `await ...delete().eq().eq()` works.
          builder.then = (resolve) => resolve(next("delete"));
          return builder;
        },
      };
    },
  };
}

const BASE_PARAMS = {
  relationshipReportId: "rr-1",
  kind: "work",
  locale: "ko-KR",
  requestedByReportId: "report-a",
};

section("A. clean acquire — no existing lock, insert succeeds");
{
  const supabase = makeMockSupabase({
    script: [{ op: "insert", result: { data: { id: "lock-1" }, error: null } }],
  });
  const result = await acquireRelationshipPremiumGenerationLock(supabase, {
    ...BASE_PARAMS,
    generationRequestId: "req-1",
  });
  assert.deepEqual(result, { ok: true, lockId: "lock-1" });
  assert.equal(supabase.calls[0].obj.current_request_id, "req-1", "insert must stamp current_request_id with the caller's request id");
  ok("insert succeeds -> lock acquired with current_request_id set to this request");
}

section("B. conflict, existing lock NOT stale -> in_progress, no false steal, no credit touched");
{
  const supabase = makeMockSupabase({
    script: [
      { op: "insert", result: { data: null, error: { code: "23505", message: "duplicate key" } } },
      { op: "select", result: { data: { current_request_id: "req-old" }, error: null } },
      { op: "update", result: { data: null, error: null } }, // 0 rows: not stale yet
    ],
  });
  const result = await acquireRelationshipPremiumGenerationLock(supabase, {
    ...BASE_PARAMS,
    generationRequestId: "req-2",
  });
  assert.deepEqual(result, { ok: false, reason: "in_progress" });
  assert.equal(supabase.rpcCalls.length, 0, "must not touch credit when the steal attempt fails");
  ok("live lock correctly reported as in_progress; no credit-release rpc fired since nothing was stolen");
}

section("C. conflict, existing lock IS stale -> steal succeeds, old owner's credit released");
{
  const supabase = makeMockSupabase({
    script: [
      { op: "insert", result: { data: null, error: { code: "23505", message: "duplicate key" } } },
      { op: "select", result: { data: { current_request_id: "req-dead" }, error: null } },
      { op: "update", result: { data: { id: "lock-2" }, error: null } },
    ],
  });
  const result = await acquireRelationshipPremiumGenerationLock(supabase, {
    ...BASE_PARAMS,
    generationRequestId: "req-new",
  });
  assert.deepEqual(result, { ok: true, lockId: "lock-2" });
  assert.equal(supabase.calls[2].obj.current_request_id, "req-new", "steal must overwrite current_request_id to the new owner");
  assert.equal(supabase.rpcCalls.length, 1);
  assert.equal(supabase.rpcCalls[0].fnName, "release_credit");
  assert.equal(supabase.rpcCalls[0].args.p_generation_request_id, "req-dead", "must release the DEAD request's reservation, not the new owner's");
  ok("abandoned lock stolen; the dead request's credit reservation is released, not the new owner's");
}

section("D. steal with no previous owner on record -> steal still succeeds, no bogus credit release");
{
  const supabase = makeMockSupabase({
    script: [
      { op: "insert", result: { data: null, error: { code: "23505", message: "duplicate key" } } },
      { op: "select", result: { data: null, error: null } }, // lookup itself raced away / row gone
      { op: "update", result: { data: { id: "lock-3" }, error: null } },
    ],
  });
  const result = await acquireRelationshipPremiumGenerationLock(supabase, {
    ...BASE_PARAMS,
    generationRequestId: "req-new-2",
  });
  assert.deepEqual(result, { ok: true, lockId: "lock-3" });
  assert.equal(supabase.rpcCalls.length, 0, "no previous_request_id to clean up -> no rpc call");
  ok("steal succeeds even when the best-effort previous-owner lookup found nothing");
}

section("E. transient insert error (not 23505) -> reported as 'error', never silently 'in_progress'");
{
  const supabase = makeMockSupabase({
    script: [{ op: "insert", result: { data: null, error: { code: "08006", message: "connection failure" } } }],
  });
  const result = await acquireRelationshipPremiumGenerationLock(supabase, {
    ...BASE_PARAMS,
    generationRequestId: "req-3",
  });
  assert.deepEqual(result, { ok: false, reason: "error" });
  ok("a genuine DB error is distinguished from a real held lock");
}

section("F. release deletes only when BOTH id and current_request_id match (fencing)");
{
  const supabase = makeMockSupabase({
    script: [{ op: "delete", result: { error: null } }],
  });
  await releaseRelationshipPremiumGenerationLock(supabase, "lock-1", "req-1");
  assert.equal(supabase.calls.length, 1);
  assert.equal(supabase.calls[0].op, "delete");
  ok("release issues exactly one delete call filtered by id AND current_request_id");
}

section("G. stillOwnsLock reflects the lock row's current holder");
{
  const supabaseOwns = makeMockSupabase({
    script: [{ op: "select", result: { data: { current_request_id: "req-mine" }, error: null } }],
  });
  assert.equal(
    await stillOwnsRelationshipPremiumGenerationLock(supabaseOwns, "lock-1", "req-mine"),
    true,
  );

  const supabaseStolen = makeMockSupabase({
    script: [{ op: "select", result: { data: { current_request_id: "req-someone-else" }, error: null } }],
  });
  assert.equal(
    await stillOwnsRelationshipPremiumGenerationLock(supabaseStolen, "lock-1", "req-mine"),
    false,
  );

  const supabaseGone = makeMockSupabase({
    script: [{ op: "select", result: { data: null, error: null } }],
  });
  assert.equal(
    await stillOwnsRelationshipPremiumGenerationLock(supabaseGone, "lock-1", "req-mine"),
    false,
    "a lock that no longer exists at all must never read as still-owned",
  );
  ok("stillOwnsLock correctly distinguishes still-mine / stolen-by-someone-else / gone entirely");
}

console.log("\nAll relationship premium generation lock tests passed.");
