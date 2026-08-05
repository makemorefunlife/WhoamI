/**
 * Unit tests for lib/security/errorShape.ts — the bounded structural error
 * inspector used as a fallback diagnostic when pgErrorDiagnostics can't
 * classify a Supabase/PostgREST error (report_create_unknown_db_error) and
 * for resolveCanonicalReport.owned's internal_error path.
 *
 * Proves the extractor never surfaces message/details/hint content, only
 * property names and short whitelisted scalar values.
 *
 * Run: npx tsx tests/unit/error-shape.test.mjs
 */
import assert from "node:assert/strict";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

const { extractSafeErrorShape, formatSafeErrorShape } = await import(
  "../../lib/security/errorShape.ts"
);

// ---------------------------------------------------------------------------
section("1) Plain PostgrestError-shaped object: keys captured, code captured, message/details/hint VALUES never appear");

const pgLike = {
  message: "duplicate key value violates unique constraint containing a-secret-row-value@example.com",
  details: "Key (email)=(a-secret-row-value@example.com) already exists.",
  hint: "some very sensitive hint text",
  code: "23505",
};
const shape1 = extractSafeErrorShape(pgLike);
assert.equal(shape1.typeofError, "object");
assert.equal(shape1.isErrorInstance, false);
assert.deepEqual([...shape1.keys].sort(), ["code", "details", "hint", "message"]);
assert.equal(shape1.code, "23505");
assert.equal(shape1.name, null);
const serialized1 = JSON.stringify(shape1);
assert.equal(serialized1.includes("secret-row-value"), false);
assert.equal(serialized1.includes("duplicate key"), false);
ok("key names captured (message/details/hint/code), but no free-text VALUE ever appears in the shape");

// ---------------------------------------------------------------------------
section("2) status / statusCode scalars extracted when numeric");

const httpLike = { status: 503, statusCode: 503, name: "FetchError" };
const shape2 = extractSafeErrorShape(httpLike);
assert.equal(shape2.status, "503");
assert.equal(shape2.statusCode, "503");
assert.equal(shape2.name, "FetchError");
ok("numeric status/statusCode and simple name extracted as short scalars");

// ---------------------------------------------------------------------------
section("3) nested error.error?.code and error.cause?.code extracted");

const nested = {
  error: { code: "PGRST301" },
  cause: { code: "ECONNRESET" },
};
const shape3 = extractSafeErrorShape(nested);
assert.equal(shape3.nestedErrorCode, "PGRST301");
assert.equal(shape3.nestedCauseCode, "ECONNRESET");
ok("nested error.error.code and error.cause.code both extracted");

// ---------------------------------------------------------------------------
section("4) real Error instance detected, stack/message never leak");

const realError = new Error("some real stack trace text with potential PII inside it");
realError.name = "TypeError";
const shape4 = extractSafeErrorShape(realError);
assert.equal(shape4.isErrorInstance, true);
assert.equal(shape4.typeofError, "object");
assert.equal(shape4.name, "TypeError");
const serialized4 = JSON.stringify(shape4);
assert.equal(serialized4.includes("stack trace"), false);
assert.equal(serialized4.includes("PII"), false);
ok("Error instance correctly flagged; .message/.stack content never appears in the shape");

// ---------------------------------------------------------------------------
section("5) Non-object / malformed inputs never throw and degrade safely");

for (const bad of [null, undefined, "raw string error", 42, true, Symbol("x")]) {
  const shape = extractSafeErrorShape(bad);
  assert.equal(shape.typeofError, typeof bad);
  assert.equal(shape.isErrorInstance, false);
  assert.deepEqual(shape.keys, []);
  assert.equal(shape.code, null);
  assert.equal(shape.name, null);
}
ok("non-object inputs (null/undefined/string/number/boolean/symbol) never throw and yield empty structural fields");

// ---------------------------------------------------------------------------
section("6) Key allowlist rejects non-identifier-shaped keys, and caps at 20 keys");

const manyKeys = {};
for (let i = 0; i < 30; i++) manyKeys[`field_${i}`] = i;
manyKeys["weird key with spaces"] = "x";
manyKeys["also-has-dashes"] = "x";
const shape6 = extractSafeErrorShape(manyKeys);
assert.equal(shape6.keys.length, 20);
assert.equal(shape6.keys.every((k) => /^[a-zA-Z0-9_]{1,64}$/.test(k)), true);
assert.equal(shape6.keys.includes("weird key with spaces"), false);
assert.equal(shape6.keys.includes("also-has-dashes"), false);
ok("keys capped at 20 and filtered to the safe alnum/underscore identifier pattern");

// ---------------------------------------------------------------------------
section("7) code/name values outside the safe-token pattern are dropped, not truncated-and-kept");

const injectionLike = { code: "23505'; DROP TABLE reports; --", name: "ok_name" };
const shape7 = extractSafeErrorShape(injectionLike);
assert.equal(shape7.code, null);
assert.equal(shape7.name, "ok_name");
ok("a code value containing non-identifier characters is rejected outright rather than partially captured");

// ---------------------------------------------------------------------------
section("8) formatSafeErrorShape produces one bounded line, stable field order");

const lines = formatSafeErrorShape(shape1);
assert.equal(Array.isArray(lines), true);
assert.equal(lines.some((l) => l.startsWith("code=23505")), true);
assert.equal(lines.some((l) => l.startsWith("typeofError=object")), true);
ok("formatSafeErrorShape emits a stable, bounded set of key=value strings");

console.log("\nOK: error-shape tests passed");
