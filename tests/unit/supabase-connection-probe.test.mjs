/**
 * Unit tests for lib/security/supabaseConnectionProbe.ts — the read-only
 * head-count probe used to prove the configured Supabase URL+key pair can
 * actually authenticate and query Production, independent of the
 * report/create insert path. Proves the probe never surfaces rows/IDs on
 * success and reuses the same bounded diagnostics on failure.
 *
 * Run: npx tsx tests/unit/supabase-connection-probe.test.mjs
 */
import assert from "node:assert/strict";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

const { probeSupabaseConnection, formatSupabaseConnectionProbeResult } =
  await import("../../lib/security/supabaseConnectionProbe.ts");

function fakeSupabaseClient(selectResult) {
  return {
    from(table) {
      assert.equal(table, "reports");
      return {
        select(columns, opts) {
          assert.equal(columns, "id");
          assert.deepEqual(opts, { count: "exact", head: true });
          return Promise.resolve(selectResult);
        },
      };
    },
  };
}

// ---------------------------------------------------------------------------
section("1) Successful head-count query -> ok=true, bounded count, no rows/IDs field exists");

const okClient = fakeSupabaseClient({ error: null, count: 42, data: null });
const r1 = await probeSupabaseConnection(okClient);
assert.equal(r1.ok, true);
assert.equal(r1.count, 42);
assert.equal("data" in r1, false);
ok("successful probe returns ok=true and a bounded count, with no row/data field on the result");

// ---------------------------------------------------------------------------
section("2) Successful query with null count -> ok=true, count=null (not fabricated as 0)");

const nullCountClient = fakeSupabaseClient({ error: null, count: null });
const r2 = await probeSupabaseConnection(nullCountClient);
assert.equal(r2.ok, true);
assert.equal(r2.count, null);
ok("a null count from PostgREST is preserved as null, not silently coerced to 0");

// ---------------------------------------------------------------------------
section("3) Empty-code fallback error (the observed production shape) -> ok=false, bounded diagnostic + fields, no raw message");

const emptyCodeError = {
  message: "TypeError: fetch failed",
  details: "",
  hint: "",
  code: "",
};
const failClient = fakeSupabaseClient({ error: emptyCodeError, count: null });
const r3 = await probeSupabaseConnection(failClient);
assert.equal(r3.ok, false);
assert.equal(r3.diagnostic.category, "unknown_db_error");
assert.equal(r3.fields.codeTypeof, "string");
assert.equal(r3.fields.codeStringLength, 0);
assert.equal(r3.fields.messageStringLength, emptyCodeError.message.length);
const s3 = JSON.stringify(r3);
assert.equal(s3.includes("fetch failed"), false);
ok("the exact production-observed empty-code fallback shape is classified unknown_db_error with bounded fields, raw message never leaked");

// ---------------------------------------------------------------------------
section("4) RLS/permission error -> ok=false, category rls_or_permission");

const rlsError = {
  message: 'permission denied for table "reports"',
  details: "",
  hint: "",
  code: "42501",
};
const rlsClient = fakeSupabaseClient({ error: rlsError, count: null });
const r4 = await probeSupabaseConnection(rlsClient);
assert.equal(r4.ok, false);
assert.equal(r4.diagnostic.category, "rls_or_permission");
ok("a 42501 permission error from the probe is classified rls_or_permission, same as the insert path");

// ---------------------------------------------------------------------------
section("5) formatSupabaseConnectionProbeResult emits stable bounded lines for both outcomes");

const okLines = formatSupabaseConnectionProbeResult(r1);
assert.deepEqual(okLines, ["ok=true", "count=42"]);

const failLines = formatSupabaseConnectionProbeResult(r3);
assert.equal(failLines[0], "ok=false");
assert.equal(failLines.some((l) => l.startsWith("code=report_create_unknown_db_error")), true);
const joinedFail = failLines.join(" ");
assert.equal(joinedFail.includes("fetch failed"), false);
ok("formatted probe result lines are stable and bounded for both success and failure, no raw text leaked");

console.log("\nOK: supabase-connection-probe tests passed");
