/**
 * 1-week Beta Release Candidate — Paddle SANDBOX product/price catalog.
 *
 * Not secrets (Paddle price IDs are meant to be passed to the client-side
 * Paddle.js Checkout.open() call), so these live as plain constants rather
 * than env vars — one file to read to see the whole Beta catalog.
 *
 * All 4 Paddle products already existed in the sandbox account
 * (deepself / relationship_single / subscribe / addtional relationship);
 * this Beta adds a fresh ONE-TIME price per product per currency (the
 * existing "subscribe" product's old price was a real monthly recurring
 * price, which the Beta must never use — see BetaPlanId "membership_beta"
 * below, which points at the new one-time price instead).
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
  priceId: { "ko-KR": string; "en-US": string };
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
    paddleProductId: "pro_01kxk2zw67458tnkcnfgt0whv0", // "deepself"
    priceId: {
      "ko-KR": "pri_01m1xm9wj8ay9f2g7af9sbff1w", // ₩4,900
      "en-US": "pri_01m1xm9wvkbshger1xywdsd4rc", // $4.99
    },
    grants: [{ creditType: "personal", amount: 1 }],
  },
  relationship_premium: {
    planId: "relationship_premium",
    paddleProductId: "pro_01kxk34w89pyjs6w1mk9kz1kp9", // "relationship_single"
    priceId: {
      "ko-KR": "pri_01m1xm9xpsw0mafh2gcxqtafm7", // ₩20,000
      "en-US": "pri_01m1xm9xyg6yw4bcxz5nq36trt", // $21.99
    },
    grants: [{ creditType: "relationship", amount: 1 }],
  },
  membership_beta: {
    planId: "membership_beta",
    paddleProductId: "pro_01kxk37hpcxdmr9vry88edtckf", // "subscribe" (existing product; NEW one-time price, not the old recurring one)
    priceId: {
      "ko-KR": "pri_01m1xm9y5h0v5chcr0b3bhb78j", // ₩17,900
      "en-US": "pri_01m1xm9ycep8n9b5w01dkrh4pz", // $17.99
    },
    grants: [
      { creditType: "personal", amount: 1 },
      { creditType: "relationship", amount: 2 },
    ],
  },
  additional_relationship: {
    planId: "additional_relationship",
    paddleProductId: "pro_01kxk3dx6tq9rtzbkt24f2h01w", // "addtional relationship"
    priceId: {
      "ko-KR": "pri_01m1xm9yk9y5heefdpt0y7ggtz", // ₩7,900
      "en-US": "pri_01m1xm9yt7z8p6jyn2t7zavr5n", // $7.99
    },
    grants: [{ creditType: "relationship", amount: 1 }],
  },
};

export function resolveBetaPlan(planId: string): BetaPlan | null {
  return (BETA_PLANS as Record<string, BetaPlan>)[planId] ?? null;
}

/** True if `priceId` is one of this plan's two locale prices (KR or US) — the transaction's currency tells us which one was actually charged, not the request locale. */
export function planHasPriceId(plan: BetaPlan, priceId: string): boolean {
  return plan.priceId["ko-KR"] === priceId || plan.priceId["en-US"] === priceId;
}
