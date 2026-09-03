/**
 * Canonical display_name — pure logic tests for the sanitizer, the
 * Clerk-derived seed/fallback helpers (lib/report/displayNameInput.ts,
 * lib/clerk/displayName.ts, lib/clerk/displayNameSync.ts).
 *
 * Covers spec cases 1/2/5/9 directly (Google seed-if-missing, Google
 * existing-value-preserved, email-already-has-name skips the prompt,
 * sanitizer). Cases 3/4/6/7/8 are UI-flow/live-persistence behavior
 * (DisplayNameSetupModal wiring in homecontent.tsx, Clerk publicMetadata
 * round-trip, reports.name regression for partner_manual) verified by
 * code review + a browser smoke test — see the final report for details.
 *
 * Run: npx tsx tests/unit/display-name.test.mjs
 */
import assert from "node:assert/strict";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

const { sanitizeDisplayNameInput } = await import(
  "../../lib/report/displayNameInput.ts"
);
const { resolveClerkDisplayName, hasOAuthAccount, getPublicDisplayName } = await import(
  "../../lib/clerk/displayName.ts"
);
const {
  seedDisplayName,
  seedDisplayNameFromClerkFallback,
  shouldPromptForDisplayName,
} = await import("../../lib/clerk/displayNameSync.ts");

section("sanitizeDisplayNameInput — trims, caps length, rejects empty/non-string");
{
  assert.equal(sanitizeDisplayNameInput("  Sera  "), "Sera");
  assert.equal(sanitizeDisplayNameInput(""), null);
  assert.equal(sanitizeDisplayNameInput("   "), null);
  assert.equal(sanitizeDisplayNameInput(null), null);
  assert.equal(sanitizeDisplayNameInput(undefined), null);
  assert.equal(sanitizeDisplayNameInput(12345), null, "non-string input must never pass through");
  const long = "a".repeat(200);
  assert.equal(sanitizeDisplayNameInput(long).length, 60, "input longer than the cap is truncated, never rejected outright");
  ok("trims whitespace, caps at 60 chars, empty/whitespace/non-string all become null");
}

section("resolveClerkDisplayName — fullName -> firstName -> email local part -> generic fallback");
{
  assert.equal(resolveClerkDisplayName({ fullName: "Aswin Wijaya" }), "Aswin Wijaya");
  assert.equal(resolveClerkDisplayName({ fullName: "", firstName: "Aswin" }), "Aswin");
  assert.equal(
    resolveClerkDisplayName({ primaryEmailAddress: { emailAddress: "sera123@example.com" } }),
    "sera123",
  );
  assert.equal(resolveClerkDisplayName(null), "나");
  assert.equal(resolveClerkDisplayName(undefined), "나");
  assert.equal(resolveClerkDisplayName({}), "나");
  ok("Google name wins when present; email-local and generic fallback only kick in when nothing else is available");
}

section("hasOAuthAccount — true only when externalAccounts is a non-empty array");
{
  assert.equal(hasOAuthAccount({ externalAccounts: [{ provider: "oauth_google" }] }), true);
  assert.equal(hasOAuthAccount({ externalAccounts: [] }), false, "email/password accounts have zero external accounts");
  assert.equal(hasOAuthAccount({ externalAccounts: null }), false);
  assert.equal(hasOAuthAccount({}), false);
  assert.equal(hasOAuthAccount(null), false);
  ok("distinguishes Google/OAuth signups (skip the name prompt) from email/password signups (show it)");
}

section("getPublicDisplayName — reads user.publicMetadata.displayName, empty/missing -> null");
{
  assert.equal(getPublicDisplayName({ publicMetadata: { displayName: "Sera" } }), "Sera");
  assert.equal(getPublicDisplayName({ publicMetadata: { displayName: "  " } }), null);
  assert.equal(getPublicDisplayName({ publicMetadata: {} }), null);
  assert.equal(getPublicDisplayName({ publicMetadata: { displayName: 42 } }), null, "non-string metadata value is never trusted");
  assert.equal(getPublicDisplayName(null), null);
  ok("canonical read is user.publicMetadata.displayName, never a report field");
}

section("shouldPromptForDisplayName — spec cases 3 & 5: only prompt when nothing set AND no OAuth name available");
{
  assert.equal(shouldPromptForDisplayName(null, false), true, "case 3: email signup, no name yet -> show modal");
  assert.equal(shouldPromptForDisplayName(null, true), false, "Google signup, no name yet -> silently seed, no modal");
  assert.equal(shouldPromptForDisplayName("Sera", false), false, "case 5: email user who already has a name -> never re-prompt");
  assert.equal(shouldPromptForDisplayName("Sera", true), false, "already has a name -> never prompt regardless of OAuth status");
  ok("the exact 4-way decision matrix the signup gate in homecontent.tsx relies on");
}

section("seedDisplayName / seedDisplayNameFromClerkFallback — case 1: Google user, no displayName yet -> seeded once");
{
  const postedBodies = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    postedBodies.push({ url, body: JSON.parse(init.body) });
    return { ok: true };
  };
  try {
    const user = { fullName: "Aswin Wijaya", publicMetadata: {} };
    const result = await seedDisplayNameFromClerkFallback(user);
    assert.equal(result, "Aswin Wijaya");
    assert.equal(postedBodies.length, 1, "exactly one POST — this must never fire twice for one seed");
    assert.equal(postedBodies[0].url, "/api/account/display-name");
    assert.deepEqual(postedBodies[0].body, { displayName: "Aswin Wijaya" });
  } finally {
    globalThis.fetch = realFetch;
  }
  ok("Google user with no displayName yet gets seeded from their Google name, exactly once");
}

section("seedDisplayName — case 2: user already has a displayName -> never overwritten, fetch never called");
{
  let fetchCalled = false;
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    fetchCalled = true;
    return { ok: true };
  };
  try {
    const user = { fullName: "Someone Else Entirely", publicMetadata: { displayName: "Sera" } };
    const result = await seedDisplayNameFromClerkFallback(user);
    assert.equal(result, "Sera", "existing value is returned as-is");
    assert.equal(fetchCalled, false, "an existing displayName must never trigger a write, even if the Clerk name differs");
  } finally {
    globalThis.fetch = realFetch;
  }
  ok("an already-set displayName is never overwritten by a freshly-computed Clerk fallback");
}

section("seedDisplayName — generic-only fallback (no real name anywhere) never gets seeded as a value");
{
  let fetchCalled = false;
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    fetchCalled = true;
    return { ok: true };
  };
  try {
    const user = { publicMetadata: {} };
    const result = await seedDisplayNameFromClerkFallback(user);
    assert.equal(result, null);
    assert.equal(fetchCalled, false, "the generic '나' fallback must never be persisted as a real display name");
  } finally {
    globalThis.fetch = realFetch;
  }
  ok("nothing to seed from (no fullName/firstName/email) -> no write, caller falls through to its own UI");
}

console.log("\nAll display-name tests passed.");
