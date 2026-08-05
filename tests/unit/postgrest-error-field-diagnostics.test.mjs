/**
 * Unit tests for lib/security/postgrestErrorFieldDiagnostics.ts — the
 * field-level fallback diagnostic added after a production error showed
 * keys=message,details,hint,code (the standard PostgrestError shape) but
 * extractSafeErrorShape's general-purpose `code` extraction returned
 * "none" anyway. This proves the extractor correctly handles the exact
 * { message, details, hint, code } plain-object shape Supabase/PostgREST
 * returns (not an Error instance), and never surfaces raw message text —
 * only typeof/length/bounded-category facts about it.
 *
 * Run: npx tsx tests/unit/postgrest-error-field-diagnostics.test.mjs
 */
import assert from "node:assert/strict";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

const { diagnosePostgrestErrorFields, formatPostgrestErrorFieldDiagnostic } =
  await import("../../lib/security/postgrestErrorFieldDiagnostics.ts");

// ---------------------------------------------------------------------------
section("1) { code: '23505', message: unique-violation text } -> codeSafe='23505', category 'duplicate' + 'constraint' detected");

const uniqueViolation = {
  code: "23505",
  message: 'duplicate key value violates unique constraint "reports_pkey"',
  details: "Key (id)=(11111111-2222-3333-4444-555555555555) already exists.",
  hint: null,
};
const d1 = diagnosePostgrestErrorFields(uniqueViolation);
assert.equal(d1.codeTypeof, "string");
assert.equal(d1.codeIsNull, false);
assert.equal(d1.codeIsUndefined, false);
assert.equal(d1.codeStringLength, 5);
assert.equal(d1.codeSafe, "23505");
assert.equal(d1.messageTypeof, "string");
assert.equal(d1.messageStringLength, uniqueViolation.message.length);
assert.deepEqual([...d1.messageCategories].sort(), ["constraint", "duplicate"]);
const s1 = JSON.stringify(d1);
assert.equal(s1.includes("11111111-2222-3333-4444-555555555555"), false);
assert.equal(s1.includes("reports_pkey"), false);
ok("23505 unique-violation shape: safe code extracted, message categorized without leaking raw text");

// ---------------------------------------------------------------------------
section("2) { code: '23514', message: check-violation text } -> codeSafe='23514', category 'constraint' detected");

const checkViolation = {
  code: "23514",
  message: 'new row for relation "reports" violates check constraint "reports_entitlement_check"',
  details: "Failing row contains sensitive-looking-row-data-here.",
  hint: null,
};
const d2 = diagnosePostgrestErrorFields(checkViolation);
assert.equal(d2.codeSafe, "23514");
assert.equal(d2.messageCategories.includes("constraint"), true);
const s2 = JSON.stringify(d2);
assert.equal(s2.includes("sensitive-looking-row-data-here"), false);
assert.equal(s2.includes("reports_entitlement_check"), false);
ok("23514 check-violation shape: safe code extracted, 'constraint' category detected, no raw text leaked");

// ---------------------------------------------------------------------------
section("3) { code: 'PGRST204', message: schema-cache text } -> codeSafe='PGRST204', category 'schema cache' detected");

const schemaCache = {
  code: "PGRST204",
  message: "Could not find the 'entitlement' column of 'reports' in the schema cache",
  details: null,
  hint: null,
};
const d3 = diagnosePostgrestErrorFields(schemaCache);
assert.equal(d3.codeSafe, "PGRST204");
assert.deepEqual([...d3.messageCategories].sort(), ["column", "schema cache"]);
ok("PGRST204 schema-cache shape: safe code extracted, 'column' + 'schema cache' categories both detected");

// ---------------------------------------------------------------------------
section("4a) code: null -> codeIsNull=true, codeTypeof='object', codeSafe=null");

const codeNull = diagnosePostgrestErrorFields({ code: null, message: "x" });
assert.equal(codeNull.codeTypeof, "object");
assert.equal(codeNull.codeIsNull, true);
assert.equal(codeNull.codeIsUndefined, false);
assert.equal(codeNull.codeStringLength, "null".length);
assert.equal(codeNull.codeSafe, null);
ok("code: null correctly flagged as codeIsNull, not silently treated as absent");

// ---------------------------------------------------------------------------
section("4b) code: undefined (key present but undefined) -> codeIsUndefined=true");

const codeUndefined = diagnosePostgrestErrorFields({ code: undefined, message: "x" });
assert.equal(codeUndefined.codeTypeof, "undefined");
assert.equal(codeUndefined.codeIsUndefined, true);
assert.equal(codeUndefined.codeIsNull, false);
assert.equal(codeUndefined.codeSafe, null);
ok("code: undefined correctly flagged as codeIsUndefined");

// ---------------------------------------------------------------------------
section("4c) code: '' (empty string) -> codeTypeof='string', codeStringLength=0, codeSafe=null — the observed production shape");

const codeEmpty = diagnosePostgrestErrorFields({
  code: "",
  message: "x",
  details: "",
  hint: "",
});
assert.equal(codeEmpty.codeTypeof, "string");
assert.equal(codeEmpty.codeIsNull, false);
assert.equal(codeEmpty.codeIsUndefined, false);
assert.equal(codeEmpty.codeStringLength, 0);
assert.equal(codeEmpty.codeSafe, null);
ok("code: '' (empty string) — a real, distinct, string value with length 0 — correctly distinguished from null/undefined, and correctly rejected by the pg-code pattern");

// ---------------------------------------------------------------------------
section("4d) code: 42 (non-string) -> codeTypeof='number', codeSafe=null (pattern requires a string)");

const codeNumber = diagnosePostgrestErrorFields({ code: 42, message: "x" });
assert.equal(codeNumber.codeTypeof, "number");
assert.equal(codeNumber.codeIsNull, false);
assert.equal(codeNumber.codeIsUndefined, false);
assert.equal(codeNumber.codeStringLength, 2);
assert.equal(codeNumber.codeSafe, null);
ok("a non-string code (e.g. number) is never coerced into codeSafe, even if its string form would match the pattern");

// ---------------------------------------------------------------------------
section("5) Plain-object PostgrestError shape (not an Error instance) is fully supported");

class NotAPlainObject {}
const notPlain = new NotAPlainObject();
notPlain.code = "23502";
notPlain.message = "null value in column violates not-null constraint";
const d5 = diagnosePostgrestErrorFields(notPlain);
assert.equal(d5.codeSafe, "23502");
assert.deepEqual([...d5.messageCategories].sort(), ["column", "constraint", "null"]);
ok("a plain-object-shaped error (own code/message, not Error.prototype) is read correctly, matching Supabase's actual PostgrestError shape");

// ---------------------------------------------------------------------------
section("6) Non-object / malformed inputs never throw and degrade safely");

for (const bad of [null, undefined, "raw string error", 42, true]) {
  const d = diagnosePostgrestErrorFields(bad);
  assert.equal(d.codeTypeof, "undefined");
  assert.equal(d.codeIsUndefined, true);
  assert.equal(d.codeSafe, null);
  assert.equal(d.messageTypeof, "undefined");
  assert.deepEqual(d.messageCategories, []);
}
ok("non-object inputs never throw and degrade to codeIsUndefined/messageTypeof='undefined'");

// ---------------------------------------------------------------------------
section("7) A code value shaped like SQL injection is rejected outright, not partially captured");

const injection = diagnosePostgrestErrorFields({
  code: "23505'; DROP TABLE reports; --",
  message: "x",
});
assert.equal(injection.codeSafe, null);
ok("a malformed/injection-shaped code value never passes the strict pg-code pattern");

// ---------------------------------------------------------------------------
section("8) formatPostgrestErrorFieldDiagnostic emits a stable bounded line, and the full formatted output never contains raw message text");

const lines = formatPostgrestErrorFieldDiagnostic(d1);
assert.equal(Array.isArray(lines), true);
assert.equal(lines.some((l) => l.startsWith("codeSafe=23505")), true);
assert.equal(lines.some((l) => l.startsWith("messageCategories=")), true);
const joined = lines.join(" ");
assert.equal(joined.includes("reports_pkey"), false);
assert.equal(joined.includes("11111111"), false);
ok("formatted diagnostic line is bounded and never contains raw constraint/message/row text");

console.log("\nOK: postgrest-error-field-diagnostics tests passed");
