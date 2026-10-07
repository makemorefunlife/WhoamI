/**
 * KR Paddle SANDBOX product/price catalog. Kept entirely separate from
 * usPricing.ts's US_PLANS: plan id namespaces never overlap ('kr_*' here,
 * 'us_*' there), and from betaPaddlePricing.ts's older shared-price
 * (single price + Paddle-detected-country KRW override) catalog -- these
 * are dedicated KR-native Paddle prices, not an override on a USD price.
 *
 * Price ids are real Paddle SANDBOX prices (confirmed 2026-09-22).
 * kr_relationship_triple has no US or Beta equivalent -- it's a KR-only
 * SKU. No membership/annual concept exists in the KR catalog.
 *
 * 2026-10-07: all four KR plans are sold through the Toss Payments payment
 * window in KRW (provider: "toss", see lib/payment/tossCatalog.ts). The
 * Paddle sandbox price ids below are kept only to reconcile earlier sandbox
 * purchases; krPlanHasPriceId never matches a Toss-sold plan, so no new
 * Paddle checkout/webhook can grant one.
 */

export type KrPlanId =
  | "kr_personal_premium"
  | "kr_relationship_premium"
  | "kr_insight_pass_30d"
  | "kr_relationship_triple";

type KrPlan = {
  planId: KrPlanId;
  /** Paddle's own nickname for this price, for cross-referencing the dashboard. */
  paddleNickname: string;
  priceId: string;
  billingType: "one_time";
  /** Which checkout sells this plan to NEW buyers. */
  provider: "paddle" | "toss";
  priceKrw: number;
  /**
   * DOCUMENTATION ONLY -- the actual granting logic lives in
   * process_kr_purchase (supabase/migrations/20260922050000_kr_purchase_grants.sql).
   * Update BOTH if a plan's grant ever changes.
   */
  grants: string;
};

export const KR_PLANS: Record<KrPlanId, KrPlan> = {
  kr_personal_premium: {
    planId: "kr_personal_premium",
    paddleNickname: "DEEPSELF",
    priceId: "pri_01m346g11a6ndbvzdkbh06jtdc",
    billingType: "one_time",
    provider: "toss",
    priceKrw: 7900,
    grants: "personal +1 (expires 1 year after purchase)",
  },
  kr_relationship_premium: {
    planId: "kr_relationship_premium",
    paddleNickname: "RELATIONSHIP_SINGLE",
    priceId: "pri_01m346hk3xedppb5969h58q1e2",
    billingType: "one_time",
    provider: "toss",
    priceKrw: 14900,
    grants: "relationship +1 (expires 1 year after purchase)",
  },
  kr_insight_pass_30d: {
    planId: "kr_insight_pass_30d",
    paddleNickname: "30DAY_PASS",
    priceId: "pri_01m346m608kkkjsw8786j6b6k0",
    billingType: "one_time",
    provider: "toss",
    priceKrw: 20000,
    grants: "personal +1, relationship +1 (both expire 30 days after purchase), Decision Journal unlimited for 30 days",
  },
  kr_relationship_triple: {
    planId: "kr_relationship_triple",
    paddleNickname: "RELATIONSHIP_TRIPLE",
    priceId: "pri_01m346qtbw408b5nnqgw9bmbj8",
    billingType: "one_time",
    provider: "toss",
    priceKrw: 33000,
    grants: "relationship +3 (expires 1 year after purchase)",
  },
};

export function resolveKrPlan(planId: string): KrPlan | null {
  return (KR_PLANS as Record<string, KrPlan>)[planId] ?? null;
}

export function krPlanHasPriceId(plan: KrPlan, priceId: string): boolean {
  if (plan.provider !== "paddle") return false;
  return plan.priceId === priceId;
}
