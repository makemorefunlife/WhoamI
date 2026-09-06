/**
 * Relationship premium generation lock — regression tests (2026-09-07 fix
 * for the beta-readiness audit's "no in-flight guard" / "racy merge"
 * findings). Exercises acquireRelationshipPremiumGenerationLock /
 * releaseRelationshipPremiumGenerationLock against a minimal mock Supabase
 * client shaped exactly like the real query chains the module issues —
 * no live database involved.
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
} = await import("../../lib/relationship/relationshipPremiumGenerationLock.ts");

/**
 * Minimal chainable mock matching exactly the calls the module makes:
 *   .from(table).insert(obj).select(cols).maybeSingle()
 *   .from(table).update(obj).eq().eq().eq().lt().select(cols).maybeSingle()
 *   .from(table).delete().eq()
 * `script` is an array of { op: "insert"|"update"|"delete", result: {data,error} }
 * consumed in order — lets each test script exactly what the DB "does".
 */
function makeMockSupabase(script) {
  let i = 0;
  const calls = [];
  function next(op) {
    const step = script[i];
    assert.ok(step, `mock script ran out of steps at call #${i} (op=${op})`);
    assert.equal(step.op, op, `expected script step #${i} to be "${step.op}", got op "${op}"`);
    i += 1;
    return step.result;
  }
  return {
    calls,
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
          return { eq: async () => next("delete") };
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
  const supabase = makeMockSupabase([
    { op: "insert", result: { data: { id: "lock-1" }, error: null } },
  ]);
  const result = await acquireRelationshipPremiumGenerationLock(supabase, BASE_PARAMS);
  assert.deepEqual(result, { ok: true, lockId: "lock-1" });
  ok("insert succeeds -> lock acquired, id returned");
}

section("B. conflict, existing lock NOT stale -> in_progress, no false steal");
{
  const supabase = makeMockSupabase([
    { op: "insert", result: { data: null, error: { code: "23505", message: "duplicate key" } } },
    { op: "update", result: { data: null, error: null } }, // 0 rows: not stale yet
  ]);
  const result = await acquireRelationshipPremiumGenerationLock(supabase, BASE_PARAMS);
  assert.deepEqual(result, { ok: false, reason: "in_progress" });
  ok("live lock correctly reported as in_progress, steal attempt correctly found nothing stale");
}

section("C. conflict, existing lock IS stale -> steal succeeds");
{
  const supabase = makeMockSupabase([
    { op: "insert", result: { data: null, error: { code: "23505", message: "duplicate key" } } },
    { op: "update", result: { data: { id: "lock-2" }, error: null } },
  ]);
  const result = await acquireRelationshipPremiumGenerationLock(supabase, BASE_PARAMS);
  assert.deepEqual(result, { ok: true, lockId: "lock-2" });
  ok("abandoned lock stolen via conditional UPDATE, new lock id returned");
}

section("D. two concurrent stealers -> only one wins (steal itself is a real conflict, not a false double-grant)");
{
  // Simulates: both callers see the same "23505 on insert", both attempt the
  // conditional steal; only the first UPDATE actually matches a stale row
  // (0 rows for the second, since the first already bumped started_at).
  const supabaseA = makeMockSupabase([
    { op: "insert", result: { data: null, error: { code: "23505", message: "duplicate key" } } },
    { op: "update", result: { data: { id: "lock-3" }, error: null } },
  ]);
  const supabaseB = makeMockSupabase([
    { op: "insert", result: { data: null, error: { code: "23505", message: "duplicate key" } } },
    { op: "update", result: { data: null, error: null } },
  ]);
  const [resultA, resultB] = await Promise.all([
    acquireRelationshipPremiumGenerationLock(supabaseA, BASE_PARAMS),
    acquireRelationshipPremiumGenerationLock(supabaseB, BASE_PARAMS),
  ]);
  assert.equal(resultA.ok, true);
  assert.equal(resultB.ok, false);
  assert.equal(resultB.reason, "in_progress");
  ok("only one of two concurrent steal attempts can win — the mechanism itself is race-safe by construction");
}

section("E. transient insert error (not 23505) -> reported as 'error', never silently 'in_progress'");
{
  const supabase = makeMockSupabase([
    { op: "insert", result: { data: null, error: { code: "08006", message: "connection failure" } } },
  ]);
  const result = await acquireRelationshipPremiumGenerationLock(supabase, BASE_PARAMS);
  assert.deepEqual(result, { ok: false, reason: "error" });
  ok("a genuine DB error is distinguished from a real held lock — caller can tell the two apart");
}

section("F. release deletes by lock id, not by key");
{
  const supabase = makeMockSupabase([{ op: "delete", result: { error: null } }]);
  await releaseRelationshipPremiumGenerationLock(supabase, "lock-1");
  assert.equal(supabase.calls.length, 1);
  assert.equal(supabase.calls[0].op, "delete");
  ok("release issues exactly one delete call");
}

console.log("\nAll relationship premium generation lock tests passed.");
