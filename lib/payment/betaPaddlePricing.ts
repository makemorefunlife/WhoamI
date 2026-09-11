/**
 * 1-week Beta Release Candidate — Paddle SANDBOX product/price catalog.
 *
 * Not secrets (Paddle price IDs are meant to be passed to the client-side
 * Paddle.js Checkout.open() call), so these live as plain constants rather
 * than env vars — one file to read to see the whole Beta catalog.
 *
 * Each plan has exactly ONE Paddle price: a base USD price with a South
 * Korea (KRW) local price override configured in the Paddle dashboard.
 * Paddle Checkout applies the KRW override automatically based on the
 * buyer's detected country — the app never chooses a currency/price by
 * locale itself. This replaced an earlier per-locale (KR/US) pair of
 * prices per plan; see git history on this file for that structure.
 *
 * All 4 prices live on the same sandbox product
 * (pro_01khxfkb62qe04p5byd4jmnstq). Membership Beta's price is a fresh
 * ONE-TIME price — the product's old price was a real monthly recurring
 * price, which the Beta must never use (see BetaPlanId "membership_beta").
 */

export type BetaPlanId =
  | "personal_premium"
  | "relationship_premium"
  | "membership_beta"
  | "additional_relationship";

export type BetaCreditGrant =
  | { creditType: "personal" | "relationship"; amount: number }[];

type BetaPlan = {
  planId: BetaPlanId;
  paddleProductId: string;
  priceId: string;
  /**
   * DOCUMENTATION ONLY — describes what this plan is supposed to grant.
   * The actual granting logic lives in the process_beta_purchase Postgres
   * function (supabase/migrations/20260907030100_process_beta_purchase_function.sql),
   * which hardcodes the same mapping so the whole grant is one atomic
   * transaction. If you change what a plan grants, update BOTH this field
   * (so beta-pricing-catalog.test.mjs still documents the real behavior)
   * AND that migration's if/elsif branches — nothing enforces they stay in
   * sync automatically.
   */
  grants: BetaCreditGrant;
};

export const BETA_PLANS: Record<BetaPlanId, BetaPlan> = {
  personal_premium: {
    planId: "personal_premium",
    paddleProductId: "pro_01khxfkb62qe04p5byd4jmnstq",
    priceId: "pri_01m24ybdvr53kc9fvf91y9s6bt", // USD $4.99, KR override ₩4,900
    grants: [{ creditType: "personal", amount: 1 }],
  },
  relationship_premium: {
    planId: "relationship_premium",
    paddleProductId: "pro_01khxfkb62qe04p5byd4jmnstq",
    priceId: "pri_01m24ycpwf5cq713z463tqf1he", // USD $21.99, KR override ₩20,000
    grants: [{ creditType: "relationship", amount: 1 }],
  },
  membership_beta: {
    planId: "membership_beta",
    paddleProductId: "pro_01khxfkb62qe04p5byd4jmnstq", // one-time price, not the old recurring "subscribe" price
    priceId: "pri_01m24yejnkaf61jw42jek47ejb", // USD $17.99, KR override ₩17,900
    grants: [
      { creditType: "personal", amount: 1 },
      { creditType: "relationship", amount: 2 },
    ],
  },
  additional_relationship: {
    planId: "additional_relationship",
    paddleProductId: "pro_01khxfkb62qe04p5byd4jmnstq",
    priceId: "pri_01m24yfrgt87dph6caewbjajky", // USD $7.99, KR override ₩7,900
    grants: [{ creditType: "relationship", amount: 1 }],
  },
};

export function resolveBetaPlan(planId: string): BetaPlan | null {
  return (BETA_PLANS as Record<string, BetaPlan>)[planId] ?? null;
}

/** True if `priceId` is this plan's single Paddle price id. */
export function planHasPriceId(plan: BetaPlan, priceId: string): boolean {
  return plan.priceId === priceId;
}
