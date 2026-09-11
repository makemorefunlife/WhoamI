/**
 * 1-week Beta Release Candidate — Paddle sandbox catalog + purchase grant.
 * Run: npx tsx tests/unit/beta-pricing-catalog.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { resolveBetaPlan, planHasPriceId, BETA_PLANS } from "../../lib/payment/betaPaddlePricing.ts";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../..");
function readSrc(relPath) {
  return readFileSync(join(root, relPath), "utf8");
}

let passed = 0;
function ok(name) {
  passed += 1;
  console.log(`ok - ${name}`);
}
function section(title) {
  console.log(`\n=== ${title} ===`);
}

section("A. All 4 Beta plans resolve to the exact agreed single Paddle price id and grants");
{
  const expected = {
    personal_premium: {
      priceId: "pri_01m24ybdvr53kc9fvf91y9s6bt",
      grants: [{ creditType: "personal", amount: 1 }],
    },
    relationship_premium: {
      priceId: "pri_01m24ycpwf5cq713z463tqf1he",
      grants: [{ creditType: "relationship", amount: 1 }],
    },
    membership_beta: {
      priceId: "pri_01m24yejnkaf61jw42jek47ejb",
      grants: [
        { creditType: "personal", amount: 1 },
        { creditType: "relationship", amount: 2 },
      ],
    },
    additional_relationship: {
      priceId: "pri_01m24yfrgt87dph6caewbjajky",
      grants: [{ creditType: "relationship", amount: 1 }],
    },
  };
  for (const [planId, expectedPlan] of Object.entries(expected)) {
    const plan = resolveBetaPlan(planId);
    assert.ok(plan, `${planId} must resolve`);
    assert.equal(typeof plan.priceId, "string", `${planId} must have a single string priceId, not a per-locale map`);
    assert.equal(plan.priceId, expectedPlan.priceId, `${planId} must use the new agreed Paddle price id`);
    assert.deepEqual(plan.grants, expectedPlan.grants, `${planId} grants must match the agreed Beta design`);
  }
  ok("all 4 plans resolve to the new single price id and the exact agreed credit grants");
}

section("B. Membership plan uses a fresh ONE-TIME price, never a recurring one");
{
  const plan = resolveBetaPlan("membership_beta");
  // The pre-existing Paddle sandbox price on this product was a real
  // monthly-recurring price (pri_01kxk38j6ahr1jtsjym7tff1rt) — the Beta must
  // never reference it, since a recurring price is exactly what "no
  // automatic billing after the Beta ends" rules out.
  const OLD_RECURRING_PRICE_ID = "pri_01kxk38j6ahr1jtsjym7tff1rt";
  assert.notEqual(plan.priceId, OLD_RECURRING_PRICE_ID);
  ok("membership_beta points at the new one-time price, not the pre-existing recurring price");
}

section("C. resolveBetaPlan / planHasPriceId reject unknown plans and wrong/old prices");
{
  assert.equal(resolveBetaPlan("not_a_real_plan"), null);
  const plan = resolveBetaPlan("personal_premium");
  assert.equal(planHasPriceId(plan, "pri_not_this_one"), false);
  assert.equal(planHasPriceId(plan, plan.priceId), true);

  // Every retired per-locale price id from the old 8-price catalog must be
  // rejected by every plan — a stale client or replayed transaction must
  // never verify against a price Paddle no longer associates with this Beta.
  const OLD_PRICE_IDS = [
    "pri_01m1xm9wj8ay9f2g7af9sbff1w",
    "pri_01m1xm9wvkbshger1xywdsd4rc",
    "pri_01m1xm9xpsw0mafh2gcxqtafm7",
    "pri_01m1xm9xyg6yw4bcxz5nq36trt",
    "pri_01m1xm9y5h0v5chcr0b3bhb78j",
    "pri_01m1xm9ycep8n9b5w01dkrh4pz",
    "pri_01m1xm9yk9y5heefdpt0y7ggtz",
    "pri_01m1xm9yt7z8p6jyn2t7zavr5n",
  ];
  for (const [, betaPlan] of Object.entries(BETA_PLANS)) {
    for (const oldId of OLD_PRICE_IDS) {
      assert.equal(planHasPriceId(betaPlan, oldId), false, `${betaPlan.planId} must reject retired price id ${oldId}`);
    }
  }
  ok("unknown plan ids resolve to null; planHasPriceId only matches this plan's own new price, never old/retired ones");
}

section("D. Every BETA_PLANS entry's own planId key matches its map key (no copy/paste drift)");
{
  for (const [key, plan] of Object.entries(BETA_PLANS)) {
    assert.equal(plan.planId, key, `BETA_PLANS.${key}.planId must equal "${key}"`);
  }
  ok("no mismatched planId/key pairs in the catalog");
}

section("E. Checkout hook selects the plan's single price id — no per-locale branching left");
{
  const src = readSrc("lib/payment/useBetaCheckout.ts");
  assert.ok(src.includes("const priceId = plan.priceId;"), "must use the plan's single priceId directly");
  assert.equal(src.includes("plan.priceId[locale]"), false, "must not select a price by locale anymore");
  ok("useBetaCheckout uses the same single priceId regardless of locale (KR/EN)");
}

console.log(`\n${passed} passed`);
