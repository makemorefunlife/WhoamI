/**
 * QA/QC #2 -- Relationship entry UX + Paddle quantity guard.
 * Run: npx tsx tests/unit/relationship-entry-and-paddle-quantity.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolveRelationshipEntryState } from "../../lib/credits/analysisEntryGate";
import {
  flagPaymentForManualReview,
  paddleQuantityRequiresReview,
  paddleTransactionTotalQuantity,
} from "../../lib/payment/paddleQuantityGuard";

let passed = 0;
function ok(name: string) {
  passed += 1;
  console.log(`ok - ${name}`);
}
const src = (p: string) => readFileSync(p, "utf8");
const before = (s: string, a: string | RegExp, b: string | RegExp) => {
  const ia = typeof a === "string" ? s.indexOf(a) : s.search(a);
  const ib = typeof b === "string" ? s.indexOf(b) : s.search(b);
  assert.ok(ia >= 0, `missing: ${a}`);
  assert.ok(ib >= 0, `missing: ${b}`);
  return ia < ib;
};

async function main() {
  const base = { kindLoaded: true, creditExhausted: false, creditEnforced: true };
  const section = src("components/relationship/detail/RelationshipPremiumSection.tsx");
  const view = src("app/relationship/[id]/RelationshipView.tsx");
  const hook = src("app/relationship/[id]/useRelationshipDetail.ts");
  const premiumRoute = src("app/api/relationship/analyze/premium/route.ts");
  const detailRoute = src("app/api/relationship/detail/route.ts");

  // ---- B1. saved report exists -> opens report, no credit used ----------
  for (const remaining of [0, 1, null]) {
    assert.equal(
      resolveRelationshipEntryState({ ...base, hasSavedReport: true, remaining, creditExhausted: remaining === 0 }),
      "saved_report",
    );
  }
  // The detail read never reserves/consumes; the generation route returns a
  // cached report BEFORE it ever reaches reserve_credit.
  assert.doesNotMatch(detailRoute, /reserve(Relationship)?Credit|consume(Relationship)?Credit/);
  assert.ok(
    before(premiumRoute, "hasPremiumCacheForKindLocale(byKind, kind, locale)", "reserveRelationshipCredit(supabase"),
    "cache hit must return before credit reservation",
  );
  ok("saved report -> shows report state; detail read and cache hit never touch credits");

  // ---- B2. no report + credit 1 -> generate directly ---------------------
  assert.equal(resolveRelationshipEntryState({ ...base, hasSavedReport: false, remaining: 1 }), "generate");
  assert.match(section, /entryState === "generate" \? \([\s\S]{0,400}onClick=\{\(\) => void handleGenerateClick\(\)\}/);
  assert.match(section, /ok = await onRunPremium\(premiumKind\)/);
  ok("no report + credit 1 -> single Generate CTA that starts generation");

  // ---- B3. no report + credit 0 -> purchase UI on first action -----------
  assert.equal(resolveRelationshipEntryState({ ...base, hasSavedReport: false, remaining: 0 }), "purchase");
  assert.match(section, /entryState === "purchase" && onOpenPurchase \? \([\s\S]{0,300}onClick=\{onOpenPurchase\}/);
  // purchase state never also shows the Generate button or "generate" hint
  assert.match(section, /entryState === "purchase" \? messages\.report\.premiumEmptyBuyHint : defaultHint/);
  assert.doesNotMatch(section, /messages\.report\.premiumCreditExhausted/);
  ok("no report + credit 0 -> single Buy CTA opens the purchase selector directly (no Generate, no mixed copy)");

  // ---- B4. no repeated click to reach checkout ----------------------------
  // Balance unknown/stale -> Generate; the server's 402 then opens checkout
  // on that SAME click (no second "Buy" click).
  assert.equal(resolveRelationshipEntryState({ ...base, hasSavedReport: false, remaining: null }), "generate");
  assert.equal(
    resolveRelationshipEntryState({ ...base, hasSavedReport: false, remaining: 3, creditExhausted: true }),
    "purchase",
    "server 402 wins over a stale balance",
  );
  assert.match(view, /const openPurchaseOnCreditExhausted = useCallback\(\(\) => setPurchaseOpen\(true\), \[\]\)/);
  assert.match(view, /onCreditExhausted: openPurchaseOnCreditExhausted/);
  assert.match(hook, /setPremiumCreditExhausted\(true\);\s*setErr\(null\);\s*onCreditExhaustedRef\.current\?\.\(\);/);
  assert.equal((hook.match(/setPremiumCreditExhausted\(true\)/g) ?? []).length, 1, "only the 402 branch sets it");
  assert.match(hook, /if \(res\.status === 402\) \{[\s\S]{0,700}setPremiumCreditExhausted\(true\)/);
  ok("402 on the first click opens the purchase selector immediately; opening the page alone never does");

  // Unenforced env (beta/dev): a 0 balance is not a dead end
  assert.equal(
    resolveRelationshipEntryState({ ...base, creditEnforced: false, hasSavedReport: false, remaining: 0 }),
    "generate",
  );
  // While the selected kind's saved report is loading, no CTA at all
  assert.equal(resolveRelationshipEntryState({ ...base, kindLoaded: false, hasSavedReport: false, remaining: 0 }), "loading");
  assert.match(hook, /setLoadedPremiumKind\(kindForRequest\)/);
  ok("loading shows no CTA (no Buy flash before a saved report appears); unenforced env keeps Generate");

  // ---- B5. refresh/reopen existing report -> no additional credit --------
  assert.equal(resolveRelationshipEntryState({ ...base, hasSavedReport: true, kindLoaded: false, remaining: 0 }), "saved_report");
  // Page entry only reads the balance (GET entitlements); generation is the
  // only place credits are spent, and only via an explicit action/autostart.
  assert.match(hook, /fetch\("\/api\/account\/entitlements", \{ cache: "no-store" \}\)/);
  assert.doesNotMatch(section, /reserve_credit|\/api\/relationship\/analyze\/premium/);
  ok("refresh/reopen of an existing report stays in saved_report; entering the page spends nothing");

  // ---- A. Paddle quantity guard ------------------------------------------
  assert.equal(paddleTransactionTotalQuantity([{ price: { id: "p" }, quantity: 1 }]), 1);
  assert.equal(paddleTransactionTotalQuantity([{ price: { id: "p" }, quantity: 2 }]), 2);
  assert.equal(paddleTransactionTotalQuantity([{ quantity: 1 }, { quantity: 1 }]), 2);
  assert.equal(paddleTransactionTotalQuantity([{ price: { id: "p" } }]), 1);
  assert.equal(paddleQuantityRequiresReview([{ quantity: 1 }]), false);
  assert.equal(paddleQuantityRequiresReview([{ quantity: 2 }]), true);
  assert.equal(paddleQuantityRequiresReview([{ quantity: 3 }]), true);
  ok("quantity 1 passes; quantity 2/3 or multiple units -> manual review");

  const calls: unknown[] = [];
  const okDb = { from: (t: string) => ({ upsert: (row: unknown, opts: unknown) => { calls.push({ t, row, opts }); return Promise.resolve({ error: null }); } }) } as never;
  assert.deepEqual(await flagPaymentForManualReview(okDb, { transactionId: "txn_1", quantity: 2, source: "webhook", planId: "us_relationship_premium" }), { ok: true });
  const c = calls[0] as { t: string; row: Record<string, unknown>; opts: Record<string, unknown> };
  assert.equal(c.t, "payment_manual_reviews");
  assert.equal(c.row.provider_transaction_id, "txn_1");
  assert.equal(c.row.quantity, 2);
  assert.deepEqual(c.opts, { onConflict: "provider,provider_transaction_id", ignoreDuplicates: true });
  const badDb = { from: () => ({ upsert: () => Promise.resolve({ error: { message: "x" } }) }) } as never;
  assert.deepEqual(await flagPaymentForManualReview(badDb, { transactionId: "t", quantity: 2, source: "webhook" }), { ok: false });
  ok("flag is idempotent per transaction and reports persistence failure");

  const webhook = src("app/api/webhooks/paddle/route.ts");
  assert.ok(before(webhook, /await holdForQuantityReview\(supabase, data, \{\s*transactionId,\s*region: match\.region/, "const result = await grantUsPurchase("));
  assert.ok(before(webhook, /await holdForQuantityReview\(supabase, data, \{\s*transactionId,\s*region: match\.region/, "const result = await grantKrPurchase("));
  assert.ok(before(webhook, /region: "us",\s*planId: "us_annual_membership"/, "const result = await grantUsAnnualRenewal("));
  assert.match(webhook, /if \(!flagged\.ok\) throw new Error\("manual_review_flag_failed"\)/);
  ok("webhook: US + KR + renewal paths check quantity BEFORE any grant; unflaggable -> retried");

  const complete = src("app/api/pricing/checkout/complete/route.ts");
  assert.ok(before(complete, "paddleQuantityRequiresReview(txn.items)", "const result = await grantUsPurchase("));
  assert.ok(before(complete, "paddleQuantityRequiresReview(txn.items)", "const result = await grantKrPurchase("));
  assert.match(complete, /needsReview: true \},\s*\{ status: 409 \}/);
  ok("checkout/complete: quantity checked before US/KR grant; buyer told it's under review (409), nothing granted");

  const hookCheckout = src("lib/payment/useRegionalCheckout.ts");
  assert.match(hookCheckout, /res\.status === 409 && errBody\.needsReview \? "needs_review" : "error"/);
  ok("client surfaces needs_review instead of a generic error (no invitation to pay again)");

  // Existing pack product untouched
  assert.match(src("lib/payment/krPricing.ts"), /kr_relationship_triple: \{[\s\S]{0,200}priceId: "pri_01m346qtbw408b5nnqgw9bmbj8"/);
  ok("KR Relationship Triple product unchanged");

  console.log(`\nrelationship-entry-and-paddle-quantity: ${passed} passed`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
