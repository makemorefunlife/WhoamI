/**
 * Post-purchase navigation fix -- regression tests.
 *
 * Background: Paddle's overlay checkout redirects the browser to
 * `successUrl` on its own the moment it detects a successful payment --
 * independent of, and often faster than, this app's own
 * checkout.completed -> /checkout/complete -> onSuccess -> router.push
 * flow (which has to wait on a network round trip first). Before this
 * fix, successUrl always pointed at a generic ROUTES.thankYou target
 * that only carries the current page's own query string forward, so
 * ThankYouClient's redirectParam/reportId fallback logic would land the
 * user back on the generic /blueprint-preview?reportId=... free view
 * instead of the plan-specific page (e.g. .../essence/deep) a purchase
 * from StitchPremiumCard should unlock.
 *
 * buildThankYouSuccessPath (identical, duplicated copies in
 * lib/payment/useRegionalCheckout.ts and lib/payment/useBetaCheckout.ts)
 * is the pure piece of that successUrl-building logic: given the
 * locale-prefixed thank-you target, the current page's query string, and
 * an optional explicit successRedirectPath, it returns the query suffix
 * to append. This suite exercises it directly (no DOM/window/Paddle/
 * Clerk needed -- this repo's test suite has no jsdom/React-rendering
 * infra, so this stays a pure-function test in the same style as the
 * rest of tests/unit/*.test.mjs) plus static source checks confirming
 * both hooks and StitchPremiumCard are actually wired the way this fix
 * intends, and that unrelated callers were left alone.
 *
 * Run: npx tsx tests/unit/checkout-success-redirect.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../..");

let passed = 0;
function ok(name) {
  passed += 1;
  console.log(`ok - ${name}`);
}
function section(title) {
  console.log(`\n=== ${title} ===`);
}
function readSrc(relPath) {
  return readFileSync(join(root, relPath), "utf8");
}

const { buildThankYouSuccessPath: buildFromRegional } = await import(
  "../../lib/payment/useRegionalCheckout.ts"
);
const { buildThankYouSuccessPath: buildFromBeta } = await import(
  "../../lib/payment/useBetaCheckout.ts"
);

const IMPLS = [
  ["useRegionalCheckout", buildFromRegional],
  ["useBetaCheckout", buildFromBeta],
];

section("A. KR Personal Premium: successUrl carries the encoded deep-report redirect");
{
  const reportId = "6d0dd62b-0093-4467-9a93-6885f98b95e5";
  const deepHref = `/kr/blueprint-preview/${reportId}/essence/deep`;
  const thankYouTarget = "/kr/thank-you"; // localizedPath(ROUTES.thankYou, "ko-KR")
  const currentSearch = `?reportId=${reportId}`;

  for (const [label, build] of IMPLS) {
    const path = build(thankYouTarget, currentSearch, deepHref);
    assert.ok(path.startsWith("/kr/thank-you?"), `${label}: path must still target the KR thank-you page`);
    // Round-trip through URL parsing the way ThankYouClient's
    // useSearchParams().get("redirect") would, confirming the value
    // survives encode/decode intact.
    const decoded = new URL(`https://example.com${path}`).searchParams.get("redirect");
    assert.equal(decoded, deepHref, `${label}: decoded redirect must equal the exact KR deep-report href`);
    assert.ok(decoded.startsWith("/"), "decoded redirect must still pass ThankYouClient's startsWith('/') validation");
    ok(`${label}: KR successUrl query encodes the deep-report redirect and round-trips intact`);
  }
}

section("B. EN Personal Premium: same guarantee, no /kr prefix");
{
  const reportId = "6d0dd62b-0093-4467-9a93-6885f98b95e5";
  const deepHref = `/blueprint-preview/${reportId}/essence/deep`;
  const thankYouTarget = "/thank-you"; // localizedPath(ROUTES.thankYou, "en-US")
  const currentSearch = `?reportId=${reportId}`;

  for (const [label, build] of IMPLS) {
    const path = build(thankYouTarget, currentSearch, deepHref);
    assert.ok(path.startsWith("/thank-you?"), `${label}: path must target the EN (unprefixed) thank-you page`);
    const decoded = new URL(`https://example.com${path}`).searchParams.get("redirect");
    assert.equal(decoded, deepHref, `${label}: decoded redirect must equal the exact EN deep-report href`);
    assert.ok(!decoded.startsWith("/kr/"), "EN redirect must not carry a /kr prefix");
    ok(`${label}: EN successUrl query encodes the deep-report redirect, no /kr prefix`);
  }
}

section("C. No explicit redirect -- current behavior is reproduced byte-for-byte");
{
  const thankYouTarget = "/kr/thank-you";
  const currentSearch = "?reportId=6d0dd62b-0093-4467-9a93-6885f98b95e5";
  const legacyExpected = `${thankYouTarget}?${currentSearch.slice(1)}`; // the exact pre-fix string-concat formula

  for (const [label, build] of IMPLS) {
    const withoutOpts = build(thankYouTarget, currentSearch); // successRedirectPath omitted entirely
    const withUndefined = build(thankYouTarget, currentSearch, undefined);
    assert.equal(withoutOpts, legacyExpected, `${label}: omitting the 3rd arg must match the exact pre-fix formula`);
    assert.equal(withUndefined, legacyExpected, `${label}: passing undefined must match the exact pre-fix formula`);
    assert.ok(!withoutOpts.includes("redirect="), `${label}: no redirect param should appear when unset`);
    ok(`${label}: no explicit redirect -> byte-for-byte identical to pre-fix behavior (Relationship/Account/generic pricing unaffected)`);
  }

  // No current-page query string at all (e.g. a bare /pricing page purchase).
  for (const [label, build] of IMPLS) {
    const path = build("/thank-you", "");
    assert.equal(path, "/thank-you", `${label}: empty search + no redirect must return the bare thank-you target`);
    ok(`${label}: empty current search + no redirect -> bare thank-you target, unchanged`);
  }
}

section("D. Static wiring checks -- StitchPremiumCard and both hooks are actually connected this way");
{
  const cardSrc = readSrc("components/results/StitchPremiumCard.tsx");
  assert.ok(
    cardSrc.includes("successRedirectPath={href}"),
    "StitchPremiumCard must pass its own deep-report href as successRedirectPath, not a re-derived value",
  );
  ok("StitchPremiumCard passes its existing localized deep-report href as successRedirectPath");

  const modalSrc = readSrc("components/payment/PurchaseSelectorModal.tsx");
  assert.ok(
    modalSrc.includes("successRedirectPath={successRedirectPath}"),
    "PurchaseSelectorModal must forward successRedirectPath to PurchaseSelectorContent unchanged",
  );
  ok("PurchaseSelectorModal forwards successRedirectPath through to PurchaseSelectorContent");

  const contentSrc = readSrc("components/payment/PurchaseSelectorContent.tsx");
  assert.ok(
    contentSrc.includes("openCheckout(planId, locale, { successRedirectPath })"),
    "PurchaseSelectorContent must pass successRedirectPath into openCheckout's opts",
  );
  ok("PurchaseSelectorContent threads successRedirectPath into openCheckout's opts");

  const wiringPattern = /buildThankYouSuccessPath\(\s*thankYouTarget,\s*windowSearch,\s*opts\?\.successRedirectPath,?\s*\)/;
  for (const [label, relPath] of [
    ["useRegionalCheckout", "lib/payment/useRegionalCheckout.ts"],
    ["useBetaCheckout", "lib/payment/useBetaCheckout.ts"],
  ]) {
    const src = readSrc(relPath);
    assert.ok(
      src.includes("opts?: { successRedirectPath?: string }"),
      `${label}: openCheckout's new option must be optional (won't break Relationship/Account/generic pricing callers)`,
    );
    assert.ok(
      wiringPattern.test(src),
      `${label}: openCheckout must actually call buildThankYouSuccessPath with opts?.successRedirectPath`,
    );
    ok(`${label}: openCheckout's opts.successRedirectPath is optional and wired to buildThankYouSuccessPath`);
  }

  // Existing callers that must NOT need any change (optional-prop audit).
  for (const [label, relPath] of [
    ["account/billing", "app/account/billing/page.tsx"],
    ["RelationshipView", "app/relationship/[id]/RelationshipView.tsx"],
    ["pricing (PurchaseSelectorPage)", "components/payment/PurchaseSelectorPage.tsx"],
  ]) {
    const src = readSrc(relPath);
    assert.ok(
      !src.includes("successRedirectPath"),
      `${label}: must be untouched by this fix -- successRedirectPath is optional and these flows have no single specific destination`,
    );
    ok(`${label}: unaffected -- no successRedirectPath reference, confirming this fix left it alone`);
  }
}

console.log(`\n${passed} passed`);
