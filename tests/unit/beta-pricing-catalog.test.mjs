/**
 * 1-week Beta Release Candidate — Paddle sandbox catalog + purchase grant.
 * Run: npx tsx tests/unit/beta-pricing-catalog.test.mjs
 */
import assert from "node:assert/strict";
import { resolveBetaPlan, planHasPriceId, BETA_PLANS } from "../../lib/payment/betaPaddlePricing.ts";

let passed = 0;
function ok(name) {
  passed += 1;
  console.log(`ok - ${name}`);
}
function section(title) {
  console.log(`\n=== ${title} ===`);
}

section("A. All 4 Beta plans resolve with both locale prices and correct grants");
{
  const expected = {
    personal_premium: [{ creditType: "personal", amount: 1 }],
    relationship_premium: [{ creditType: "relationship", amount: 1 }],
    membership_beta: [
      { creditType: "personal", amount: 1 },
      { creditType: "relationship", amount: 2 },
    ],
    additional_relationship: [{ creditType: "relationship", amount: 1 }],
  };
  for (const [planId, grants] of Object.entries(expected)) {
    const plan = resolveBetaPlan(planId);
    assert.ok(plan, `${planId} must resolve`);
    assert.ok(plan.priceId["ko-KR"]?.startsWith("pri_"), `${planId} must have a KR price id`);
    assert.ok(plan.priceId["en-US"]?.startsWith("pri_"), `${planId} must have a US price id`);
    assert.notEqual(
      plan.priceId["ko-KR"],
      plan.priceId["en-US"],
      `${planId} KR/US prices must be distinct (separate currency prices, not one shared price)`,
    );
    assert.deepEqual(plan.grants, grants, `${planId} grants must match the agreed Beta design`);
  }
  ok("all 4 plans resolve with distinct KR/US price ids and the exact agreed credit grants");
}

section("B. Membership plan uses a fresh ONE-TIME price, never the pre-existing recurring one");
{
  const plan = resolveBetaPlan("membership_beta");
  // The pre-existing Paddle sandbox price on this product was a real
  // monthly-recurring price (pri_01kxk38j6ahr1jtsjym7tff1rt) — the Beta must
  // never reference it, since a recurring price is exactly what "no
  // automatic billing after the Beta ends" rules out.
  const OLD_RECURRING_PRICE_ID = "pri_01kxk38j6ahr1jtsjym7tff1rt";
  assert.notEqual(plan.priceId["ko-KR"], OLD_RECURRING_PRICE_ID);
  assert.notEqual(plan.priceId["en-US"], OLD_RECURRING_PRICE_ID);
  ok("membership_beta points at the new one-time prices, not the pre-existing recurring price");
}

section("C. resolveBetaPlan / planHasPriceId reject unknown plans and prices");
{
  assert.equal(resolveBetaPlan("not_a_real_plan"), null);
  const plan = resolveBetaPlan("personal_premium");
  assert.equal(planHasPriceId(plan, "pri_not_this_one"), false);
  assert.equal(planHasPriceId(plan, plan.priceId["ko-KR"]), true);
  assert.equal(planHasPriceId(plan, plan.priceId["en-US"]), true);
  ok("unknown plan ids resolve to null; planHasPriceId only matches this plan's own two prices");
}

section("D. Every BETA_PLANS entry's own planId key matches its map key (no copy/paste drift)");
{
  for (const [key, plan] of Object.entries(BETA_PLANS)) {
    assert.equal(plan.planId, key, `BETA_PLANS.${key}.planId must equal "${key}"`);
  }
  ok("no mismatched planId/key pairs in the catalog");
}

console.log(`\n${passed} passed`);
