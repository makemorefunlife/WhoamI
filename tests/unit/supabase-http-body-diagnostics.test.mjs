/**
 * Unit tests for lib/security/supabaseHttpBodyDiagnostics.ts — the bounded
 * extractor for a Supabase Data API gateway's JSON error body (e.g. a 403
 * rejection). Proves allowlisted standard phrases are returned verbatim
 * (safe — they carry no project/user data) while anything else degrades
 * to length + bounded category, never the raw text.
 *
 * Run: npx tsx tests/unit/supabase-http-body-diagnostics.test.mjs
 */
import assert from "node:assert/strict";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

const { diagnoseHttpJsonBody, formatHttpJsonBodyDiagnostic } = await import(
  "../../lib/security/supabaseHttpBodyDiagnostics.ts"
);

// ---------------------------------------------------------------------------
section("1) Every allowlisted phrase is returned verbatim as exactValue, category null");

const allowlisted = [
  "Invalid API key",
  "JWT expired",
  "JWT invalid",
  "Project paused",
  "Project restoring",
  "Forbidden",
  "Unauthorized",
];
for (const phrase of allowlisted) {
  const d = diagnoseHttpJsonBody(
    403,
    "application/json",
    JSON.stringify({ message: phrase }),
  );
  assert.equal(d.message.exactValue, phrase);
  assert.equal(d.message.category, null);
  assert.equal(d.message.length, phrase.length);
}
ok("all 7 allowlisted phrases are returned verbatim with no category assigned");

// ---------------------------------------------------------------------------
section("2) code/error/message all evaluated independently against the allowlist");

const d2 = diagnoseHttpJsonBody(
  403,
  "application/json",
  JSON.stringify({ code: "PGRST301", error: "Forbidden", message: "JWT expired" }),
);
assert.equal(d2.code.exactValue, null);
assert.equal(d2.code.length, "PGRST301".length);
assert.equal(d2.error.exactValue, "Forbidden");
assert.equal(d2.error.category, null);
assert.equal(d2.message.exactValue, "JWT expired");
ok("code/error/message fields are each independently checked against the allowlist");

// ---------------------------------------------------------------------------
section("3) Non-allowlisted free text degrades to length + bounded category, raw text never appears");

const sensitiveText =
  "Unauthorized access attempt from internal-service-account-xyz for project detail";
const d3 = diagnoseHttpJsonBody(
  403,
  "application/json",
  JSON.stringify({ message: sensitiveText }),
);
assert.equal(d3.message.exactValue, null);
assert.equal(d3.message.length, sensitiveText.length);
assert.equal(d3.message.category, "unauthorized");
const s3 = JSON.stringify(d3);
assert.equal(s3.includes("internal-service-account-xyz"), false);
assert.equal(s3.includes(sensitiveText), false);
ok("a longer message containing a recognizable category substring degrades to length + category='unauthorized', never the raw text");

// ---------------------------------------------------------------------------
section("4) Malformed / non-JSON body never throws, isJson=false, all fields absent");

const d4 = diagnoseHttpJsonBody(500, "text/html", "<html>Internal Server Error</html>");
assert.equal(d4.isJson, false);
assert.deepEqual(d4.jsonKeys, []);
assert.equal(d4.code.present, false);
assert.equal(d4.message.present, false);
const s4 = JSON.stringify(d4);
assert.equal(s4.includes("Internal Server Error"), false);
ok("a non-JSON body (e.g. an HTML error page) never throws and never leaks its content, isJson=false");

// ---------------------------------------------------------------------------
section("5) JSON array body (not an object) -> jsonKeys empty, fields absent, no crash");

const d5 = diagnoseHttpJsonBody(200, "application/json", "[]");
assert.equal(d5.isJson, true);
assert.deepEqual(d5.jsonKeys, []);
assert.equal(d5.code.present, false);
ok("a JSON array body is correctly treated as having no object-level fields, not crashed on");

// ---------------------------------------------------------------------------
section("6) Non-string code/error/message values (numbers, null, objects) never throw and report present appropriately");

const d6 = diagnoseHttpJsonBody(
  403,
  "application/json",
  JSON.stringify({ code: 500, error: null, message: { nested: "x" } }),
);
assert.equal(d6.code.present, true);
assert.equal(d6.code.exactValue, null);
assert.equal(d6.code.length, null);
assert.equal(d6.error.present, true);
assert.equal(d6.error.exactValue, null);
assert.equal(d6.message.present, true);
assert.equal(d6.message.exactValue, null);
ok("non-string field values (number/null/object) never throw and are never coerced into a fake string diagnostic");

// ---------------------------------------------------------------------------
section("7) Key extraction is bounded to safe alnum/underscore identifiers, capped at 20");

const manyKeysBody = {};
for (let i = 0; i < 30; i++) manyKeysBody[`k${i}`] = "x";
manyKeysBody["weird key"] = "x";
const d7 = diagnoseHttpJsonBody(403, "application/json", JSON.stringify(manyKeysBody));
assert.equal(d7.jsonKeys.length, 20);
assert.equal(d7.jsonKeys.every((k) => /^[a-zA-Z0-9_]{1,64}$/.test(k)), true);
assert.equal(d7.jsonKeys.includes("weird key"), false);
ok("json key extraction is filtered to safe identifiers and capped at 20 keys");

// ---------------------------------------------------------------------------
section("8) formatHttpJsonBodyDiagnostic emits a stable bounded line, never contains raw non-allowlisted text");

const lines = formatHttpJsonBodyDiagnostic(d3);
assert.equal(Array.isArray(lines), true);
assert.equal(lines.some((l) => l.startsWith("messageCategory=unauthorized")), true);
const joined = lines.join(" ");
assert.equal(joined.includes(sensitiveText), false);
ok("formatted body diagnostic line is bounded and never contains raw non-allowlisted field text");

console.log("\nOK: supabase-http-body-diagnostics tests passed");
