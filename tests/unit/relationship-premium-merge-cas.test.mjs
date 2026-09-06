/**
 * mergeRelationshipPremiumByKind CAS retry — regression tests (2026-09-07
 * fix for the beta-readiness audit's "racy read-modify-write, can lose a
 * sibling kind/locale's just-persisted result" finding, Option B: an
 * optimistic-concurrency version column + bounded retry loop). Exercises
 * the locale-path against a minimal mock Supabase client — no live database.
 *
 * Run: npx tsx tests/unit/relationship-premium-merge-cas.test.mjs
 */
import assert from "node:assert/strict";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

const { mergeRelationshipPremiumByKind } = await import(
  "../../lib/relationship/relationshipReportQuery.ts"
);

const PAYLOAD = { format: "friend_social_deep_v1", report: { headline: "test" } };

/**
 * Scripted mock: `fetches` is an array of row snapshots returned in order
 * for each `select(...).eq("id",...).maybeSingle()` call; `updates` is an
 * array of {data, error} returned in order for each
 * `update(...).eq("id",...).eq("premium_merge_version",...).select().maybeSingle()`
 * call. Verifies each update's `.eq("premium_merge_version", expected)`
 * argument matches the version the preceding fetch actually returned.
 */
function makeMockSupabase({ fetches, updates }) {
  let fetchI = 0;
  let updateI = 0;
  const seenVersions = [];
  return {
    seenVersions,
    from(table) {
      assert.equal(table, "relationship_reports");
      return {
        select() {
          return {
            eq() {
              return {
                maybeSingle: async () => {
                  const row = fetches[fetchI];
                  assert.ok(row, `ran out of scripted fetches at #${fetchI}`);
                  fetchI += 1;
                  return { data: row, error: null };
                },
              };
            },
          };
        },
        update(patch) {
          const builder = {
            eq(col, val) {
              if (col === "premium_merge_version") seenVersions.push(val);
              return builder;
            },
            lt: () => builder,
            select() {
              return {
                maybeSingle: async () => {
                  const result = updates[updateI];
                  assert.ok(result, `ran out of scripted updates at #${updateI}`);
                  updateI += 1;
                  return result;
                },
              };
            },
          };
          return builder;
        },
      };
    },
  };
}

section("A. no conflict — single fetch, single update, version passed through unchanged");
{
  const supabase = makeMockSupabase({
    fetches: [{ id: "rr-1", report_id_a: "a", report_id_b: "b", result_premium_by_kind: {}, premium_merge_version: 5 }],
    updates: [{ data: { id: "rr-1" }, error: null }],
  });
  const { error } = await mergeRelationshipPremiumByKind(supabase, "rr-1", "friendship", PAYLOAD, { locale: "ko-KR" });
  assert.equal(error, null);
  assert.deepEqual(supabase.seenVersions, [5]);
  ok("clean write uses the fetched version exactly once, no retry needed");
}

section("B. one CAS conflict, then success — refetches fresh version and retries once");
{
  const supabase = makeMockSupabase({
    fetches: [
      { id: "rr-1", report_id_a: "a", report_id_b: "b", result_premium_by_kind: {}, premium_merge_version: 5 },
      { id: "rr-1", report_id_a: "a", report_id_b: "b", result_premium_by_kind: { work: { byLocale: {} } }, premium_merge_version: 6 },
    ],
    updates: [
      { data: null, error: null }, // 0 rows: version 5 was stale (someone else already bumped it)
      { data: { id: "rr-1" }, error: null }, // retry with version 6 succeeds
    ],
  });
  const { error } = await mergeRelationshipPremiumByKind(supabase, "rr-1", "friendship", PAYLOAD, { locale: "ko-KR" });
  assert.equal(error, null);
  assert.deepEqual(supabase.seenVersions, [5, 6], "second attempt must use the freshly re-fetched version, not the stale one");
  ok("a lost race on the first attempt is recovered by re-fetching and retrying — no data silently dropped");
}

section("C. persistent conflict — gives up after the retry budget, does not loop forever");
{
  // Retry budget is 6 (bumped from 3 after a live 5-concurrent-writer DEV
  // test showed 3 wasn't enough headroom without backoff — see
  // MAX_PREMIUM_MERGE_ATTEMPTS's doc comment in relationshipReportQuery.ts).
  const ATTEMPTS = 6;
  const supabase = makeMockSupabase({
    fetches: Array.from({ length: ATTEMPTS }, (_, i) => ({
      id: "rr-1",
      report_id_a: "a",
      report_id_b: "b",
      result_premium_by_kind: {},
      premium_merge_version: i + 1,
    })),
    updates: Array.from({ length: ATTEMPTS }, () => ({ data: null, error: null })),
  });
  const { error } = await mergeRelationshipPremiumByKind(supabase, "rr-1", "friendship", PAYLOAD, { locale: "ko-KR" });
  assert.ok(error, "must surface a real error rather than silently succeeding");
  assert.equal(error.code, "PGRST_CAS_CONFLICT");
  assert.equal(supabase.seenVersions.length, ATTEMPTS, `must stop at the retry budget (${ATTEMPTS}), not loop indefinitely`);
  ok(`bounded retry gives up cleanly with a distinguishable error code after ${ATTEMPTS} attempts`);
}

section("D. relationship report not found — surfaced immediately, no retry");
{
  const supabase = {
    from(table) {
      assert.equal(table, "relationship_reports");
      return {
        select() {
          return { eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) };
        },
      };
    },
  };
  const { error } = await mergeRelationshipPremiumByKind(supabase, "missing-rr", "friendship", PAYLOAD, { locale: "ko-KR" });
  assert.ok(error);
  assert.equal(error.code, "PGRST116");
  ok("a genuinely missing row fails fast with not_found, never treated as a CAS conflict to retry");
}

console.log("\nAll mergeRelationshipPremiumByKind CAS regression tests passed.");
