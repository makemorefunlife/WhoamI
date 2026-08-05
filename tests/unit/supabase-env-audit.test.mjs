/**
 * Unit tests for lib/security/supabaseEnvAudit.ts — the bounded, non-secret
 * audit of the configured Supabase URL + service-role key, added to
 * diagnose report_create_unknown_db_error after production evidence
 * pointed at a connection/config problem (Supabase client's fallback
 * empty-code error shape) rather than a schema/constraint violation.
 *
 * Every JWT used here is synthetic test data constructed inline — no real
 * Supabase key ever appears in this file or its output.
 *
 * Run: npx tsx tests/unit/supabase-env-audit.test.mjs
 */
import assert from "node:assert/strict";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

const { auditSupabaseEnvConfig, formatSupabaseEnvAudit } = await import(
  "../../lib/security/supabaseEnvAudit.ts"
);

function b64url(obj) {
  return Buffer.from(JSON.stringify(obj))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fakeJwt(payload, header = { alg: "HS256", typ: "JWT" }) {
  return `${b64url(header)}.${b64url(payload)}.fake-signature-not-a-real-secret`;
}

// ---------------------------------------------------------------------------
section("1) Matching URL + service_role key -> refsMatch=true, looksLikeServiceRole=true");

const goodKey = fakeJwt({
  ref: "gncjslondpvysjaytagd",
  role: "service_role",
  iss: "supabase",
  exp: 2000000000,
});
const a1 = auditSupabaseEnvConfig(
  "https://gncjslondpvysjaytagd.supabase.co",
  goodKey,
  "gncjslondpvysjaytagd",
);
assert.equal(a1.url.present, true);
assert.equal(a1.url.projectRef, "gncjslondpvysjaytagd");
assert.equal(a1.url.matchesExpectedRef, true);
assert.equal(a1.key.jwtSegmentCount, 3);
assert.equal(a1.key.jwtDecodable, true);
assert.equal(a1.key.claimRef, "gncjslondpvysjaytagd");
assert.equal(a1.key.claimRole, "service_role");
assert.equal(a1.key.looksLikeServiceRole, true);
assert.equal(a1.key.looksLikeAnonKey, false);
assert.equal(a1.refsMatch, true);
const s1 = JSON.stringify(a1);
assert.equal(s1.includes("fake-signature-not-a-real-secret"), false);
ok("well-formed matching URL+service_role key: refsMatch true, role correctly identified, signature never leaked into the audit");

// ---------------------------------------------------------------------------
section("2) Anon key used where service-role is expected -> looksLikeAnonKey=true, looksLikeServiceRole=false");

const anonKey = fakeJwt({
  ref: "gncjslondpvysjaytagd",
  role: "anon",
  iss: "supabase",
  exp: 2000000000,
});
const a2 = auditSupabaseEnvConfig(
  "https://gncjslondpvysjaytagd.supabase.co",
  anonKey,
  "gncjslondpvysjaytagd",
);
assert.equal(a2.key.looksLikeAnonKey, true);
assert.equal(a2.key.looksLikeServiceRole, false);
assert.equal(a2.refsMatch, true);
ok("an anon-role key is correctly flagged as looksLikeAnonKey, distinct from a project-ref mismatch");

// ---------------------------------------------------------------------------
section("3) Wrong-project key -> refsMatch=false even though both are well-formed");

const wrongProjectKey = fakeJwt({
  ref: "some-other-project-ref",
  role: "service_role",
  iss: "supabase",
  exp: 2000000000,
});
const a3 = auditSupabaseEnvConfig(
  "https://gncjslondpvysjaytagd.supabase.co",
  wrongProjectKey,
  "gncjslondpvysjaytagd",
);
assert.equal(a3.url.matchesExpectedRef, true);
assert.equal(a3.key.claimRef, "some-other-project-ref");
assert.equal(a3.refsMatch, false);
ok("a key whose ref claim doesn't match the URL's project ref is caught by refsMatch=false");

// ---------------------------------------------------------------------------
section("4) Truncated key (missing segment) -> jwtSegmentCount != 3, jwtDecodable=false, claims all null");

const truncated = goodKey.split(".").slice(0, 2).join(".");
const a4 = auditSupabaseEnvConfig(
  "https://gncjslondpvysjaytagd.supabase.co",
  truncated,
);
assert.equal(a4.key.jwtSegmentCount, 2);
assert.equal(a4.key.jwtDecodable, false);
assert.equal(a4.key.claimRef, null);
assert.equal(a4.key.claimRole, null);
assert.equal(a4.key.looksLikeServiceRole, false);
ok("a truncated key (wrong segment count) is caught structurally, never crashes, never fabricates claims");

// ---------------------------------------------------------------------------
section("5) Empty-string / missing URL and key -> present=false, length=0, no crash");

const a5 = auditSupabaseEnvConfig(undefined, undefined);
assert.equal(a5.url.present, false);
assert.equal(a5.url.length, 0);
assert.equal(a5.url.projectRef, null);
assert.equal(a5.key.present, false);
assert.equal(a5.key.length, 0);
assert.equal(a5.key.jwtSegmentCount, 0);
assert.equal(a5.refsMatch, null);
ok("missing URL/key never throws and reports present=false / length=0 rather than fabricating a value");

// ---------------------------------------------------------------------------
section("6) Key with embedded whitespace or wrapping quotes -> hasWhitespaceOrQuotes=true");

const quotedKey = `"${goodKey}"`;
const a6a = auditSupabaseEnvConfig("https://gncjslondpvysjaytagd.supabase.co", quotedKey);
assert.equal(a6a.key.hasWhitespaceOrQuotes, true);

const newlineKey = `${goodKey.slice(0, 20)}\n${goodKey.slice(20)}`;
const a6b = auditSupabaseEnvConfig("https://gncjslondpvysjaytagd.supabase.co", newlineKey);
assert.equal(a6b.key.hasWhitespaceOrQuotes, true);
ok("a key corrupted with wrapping quotes or an embedded newline is flagged via hasWhitespaceOrQuotes");

// ---------------------------------------------------------------------------
section("7) URL with a non-supabase.co host -> projectRef=null, matchesExpectedRef=false");

const a7 = auditSupabaseEnvConfig(
  "https://example.com",
  goodKey,
  "gncjslondpvysjaytagd",
);
assert.equal(a7.url.projectRef, null);
assert.equal(a7.url.matchesExpectedRef, false);
ok("a non-supabase.co URL yields projectRef=null and an explicit matchesExpectedRef=false, not a silent pass");

// ---------------------------------------------------------------------------
section("8) formatSupabaseEnvAudit emits a stable bounded line and never contains the raw key or its signature");

const lines = formatSupabaseEnvAudit(a1);
assert.equal(Array.isArray(lines), true);
assert.equal(lines.some((l) => l.startsWith("keyClaimRole=service_role")), true);
assert.equal(lines.some((l) => l.startsWith("refsMatch=true")), true);
const joined = lines.join(" ");
assert.equal(joined.includes(goodKey), false);
assert.equal(joined.includes("fake-signature-not-a-real-secret"), false);
ok("formatted audit line is bounded and never contains the raw key string or signature segment");

console.log("\nOK: supabase-env-audit tests passed");
