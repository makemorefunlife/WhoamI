/**
 * Unit tests for lib/security/pgErrorDiagnostics.ts — the bounded,
 * non-sensitive Supabase/PostgREST error classifier added to
 * app/api/report/create/route.ts to diagnose the report_create_insert_failed
 * incident without capturing PII or raw error text.
 *
 * Covers every category → response-code mapping the route now exposes, and
 * proves the extractor never leaks values embedded in a raw Postgres error
 * message (e.g. the actual duplicate key value in a unique-violation
 * "details" string).
 *
 * Run: npx tsx tests/unit/report-create-error-diagnostics.test.mjs
 */
import assert from "node:assert/strict";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

const { diagnoseReportCreateError } = await import(
  "../../lib/security/pgErrorDiagnostics.ts"
);

// ---------------------------------------------------------------------------
section("1) 42703 undefined_column -> report_create_missing_column, column extracted");

const missingColumn = diagnoseReportCreateError({
  code: "42703",
  message: 'column "report_type" of relation "reports" does not exist',
});
assert.equal(missingColumn.category, "missing_column");
assert.equal(missingColumn.responseCode, "report_create_missing_column");
assert.equal(missingColumn.column, "report_type");
assert.equal(missingColumn.constraint, null);
ok("42703 classified as missing_column with column='report_type'");

// ---------------------------------------------------------------------------
section("2) PGRST204 schema-cache miss -> report_create_schema_cache, column extracted from PostgREST phrasing");

const schemaCache = diagnoseReportCreateError({
  code: "PGRST204",
  message: "Could not find the 'entitlement' column of 'reports' in the schema cache",
});
assert.equal(schemaCache.category, "schema_cache");
assert.equal(schemaCache.responseCode, "report_create_schema_cache");
assert.equal(schemaCache.column, "entitlement");
ok("PGRST204 classified as schema_cache with column='entitlement'");

// ---------------------------------------------------------------------------
section("3) 23502 not_null_violation -> report_create_not_null_violation, column extracted");

const notNull = diagnoseReportCreateError({
  code: "23502",
  message: 'null value in column "report_type" of relation "reports" violates not-null constraint',
  details: "Failing row contains (a1b2c3, user_abc123, null, null, null, null, null, null, null, null, null, null, null).",
});
assert.equal(notNull.category, "not_null_violation");
assert.equal(notNull.responseCode, "report_create_not_null_violation");
assert.equal(notNull.column, "report_type");
ok("23502 classified as not_null_violation with column='report_type'");

// ---------------------------------------------------------------------------
section("4) 23514 check_violation -> report_create_check_violation, constraint extracted");

const checkViolation = diagnoseReportCreateError({
  code: "23514",
  message: 'new row for relation "reports" violates check constraint "reports_entitlement_check"',
});
assert.equal(checkViolation.category, "check_violation");
assert.equal(checkViolation.responseCode, "report_create_check_violation");
assert.equal(checkViolation.constraint, "reports_entitlement_check");
ok("23514 classified as check_violation with constraint='reports_entitlement_check'");

// ---------------------------------------------------------------------------
section("5) 23505 unique_violation -> report_create_unique_violation, constraint extracted, VALUE NEVER LEAKED");

const uniqueViolation = diagnoseReportCreateError({
  code: "23505",
  message: 'duplicate key value violates unique constraint "reports_pkey"',
  details: "Key (id)=(11111111-2222-3333-4444-555555555555) already exists.",
});
assert.equal(uniqueViolation.category, "unique_violation");
assert.equal(uniqueViolation.responseCode, "report_create_unique_violation");
assert.equal(uniqueViolation.constraint, "reports_pkey");
// The diagnostic object must never contain the leaked key value from `details`.
const serialized = JSON.stringify(uniqueViolation);
assert.equal(serialized.includes("11111111-2222-3333-4444-555555555555"), false);
ok("23505 classified as unique_violation, constraint extracted, and the embedded row value never appears in the diagnostic");

// ---------------------------------------------------------------------------
section("6) 42501 insufficient_privilege -> report_create_rls_or_permission");

const rlsDenied = diagnoseReportCreateError({
  code: "42501",
  message: 'new row violates row-level security policy for table "reports"',
});
assert.equal(rlsDenied.category, "rls_or_permission");
assert.equal(rlsDenied.responseCode, "report_create_rls_or_permission");
ok("42501 classified as rls_or_permission");

// ---------------------------------------------------------------------------
section("7) Unrecognized code -> report_create_unknown_db_error, never throws");

const unknown = diagnoseReportCreateError({
  code: "55000",
  message: "some unexpected object-not-in-prerequisite-state error",
});
assert.equal(unknown.category, "unknown_db_error");
assert.equal(unknown.responseCode, "report_create_unknown_db_error");
ok("unrecognized pg code falls back to unknown_db_error, not a throw");

// ---------------------------------------------------------------------------
section("8) Malformed / non-object error input never throws and never fabricates an identifier");

for (const bad of [null, undefined, "raw string error", 42, { message: 123 }]) {
  const diag = diagnoseReportCreateError(bad);
  assert.equal(diag.category, "unknown_db_error");
  assert.equal(diag.pgCode, "none");
  assert.equal(diag.constraint, null);
  assert.equal(diag.column, null);
}
ok("malformed error inputs (null/undefined/string/number/wrong-typed fields) degrade safely to unknown_db_error");

// ---------------------------------------------------------------------------
section("9) Constraint/column extraction rejects anything outside [a-zA-Z0-9_]{1,64} — no raw text ever passes through unsanitized");

const injectionAttempt = diagnoseReportCreateError({
  code: "23514",
  message: 'new row for relation "reports" violates check constraint "reports_entitlement_check\'; DROP TABLE reports; --"',
});
// The malicious/malformed constraint text contains characters outside the
// whitelist, so it must be rejected entirely rather than partially passed through.
assert.equal(injectionAttempt.constraint, null);
ok("a constraint name containing non-identifier characters is rejected outright, not partially captured");

// ---------------------------------------------------------------------------
section("10) All 7 required response codes are reachable and exactly match the spec");

const expectedCodes = [
  "report_create_missing_column",
  "report_create_not_null_violation",
  "report_create_check_violation",
  "report_create_unique_violation",
  "report_create_rls_or_permission",
  "report_create_schema_cache",
  "report_create_unknown_db_error",
];
const actualCodes = [
  missingColumn,
  notNull,
  checkViolation,
  uniqueViolation,
  rlsDenied,
  schemaCache,
  unknown,
].map((d) => d.responseCode);
assert.deepEqual([...actualCodes].sort(), [...expectedCodes].sort());
ok("all 7 required response codes are produced by their corresponding pg error shape, no more, no fewer");

console.log("\nOK: report-create-error-diagnostics tests passed");
