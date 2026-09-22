/**
 * US Paddle SANDBOX product/price catalog -- separate from
 * betaPaddlePricing.ts on purpose: these are real, different prices from
 * the existing beta catalog (e.g. Personal is $11.99 here vs $4.99 in
 * BETA_PLANS), so the two sets must never be merged into one keyed object
 * or a US purchase could resolve to the wrong price.
 *
 * Also kept completely separate from krPricing.ts's KR_PLANS: plan id
 * namespaces never overlap ('us_*' here, 'kr_*' there), so
 * resolveRegionalPlan (lib/payment/resolveRegionalPlan.ts) can determine
 * which region a plan id belongs to from the id alone -- no locale header
 * or client-supplied flag is ever trusted for that decision.
 *
 * Price ids are real Paddle SANDBOX prices (confirmed 2026-09-22).
 * us_annual_membership is the only RECURRING price (Paddle subscription) --
 * every other plan here is one-time, same as the existing Beta catalog.
 */

export type UsPlanId =
  | "us_personal_premium"
  | "us_relationship_premium"
  | "us_insight_pass_30d"
  | "us_annual_membership"
  | "us_additional_relationship";

export type UsBillingType = "one_time" | "recurring_annual";

type UsPlan = {
  planId: UsPlanId;
  /** Paddle's own nickname for this price, for cross-referencing the dashboard. */
  paddleNickname: string;
  priceId: string;
  billingType: UsBillingType;
  priceUsd: number;
  /**
   * DOCUMENTATION ONLY, same convention as BETA_PLANS.grants -- the actual
   * granting logic lives in process_us_purchase / process_us_annual_renewal
   * (supabase/migrations/20260922040300_us_membership_functions.sql).
   * Update BOTH if a plan's grant ever changes.
   */
  grants: string;
  /** True only for us_additional_relationship: gated behind an active Annual membership whose current cycle's 2 included credits are already used (see additional_relationship_eligible). */
  requiresEligibilityCheck: boolean;
};

export const US_PLANS: Record<UsPlanId, UsPlan> = {
  us_personal_premium: {
    planId: "us_personal_premium",
    paddleNickname: "DEEPSELF",
    priceId: "pri_01m1xm9wvkbshger1xywdsd4rc",
    billingType: "one_time",
    priceUsd: 11.99,
    grants: "personal +1 (no expiry)",
    requiresEligibilityCheck: false,
  },
  us_relationship_premium: {
    planId: "us_relationship_premium",
    paddleNickname: "RELATIONSHIP_SINGLE",
    priceId: "pri_01m1xm9xyg6yw4bcxz5nq36trt",
    billingType: "one_time",
    priceUsd: 18.99,
    grants: "relationship +1 (no expiry)",
    requiresEligibilityCheck: false,
  },
  us_insight_pass_30d: {
    planId: "us_insight_pass_30d",
    paddleNickname: "30DAY_PASS",
    priceId: "pri_01m346b8d0hysn7h2m7cd9fjcf",
    billingType: "one_time",
    priceUsd: 28,
    grants: "personal +1, relationship +1 (both expire 30 days after purchase), Decision Journal unlimited for 30 days",
    requiresEligibilityCheck: false,
  },
  us_annual_membership: {
    planId: "us_annual_membership",
    paddleNickname: "ANNUAL",
    priceId: "pri_01m1xm9ycep8n9b5w01dkrh4pz",
    billingType: "recurring_annual",
    priceUsd: 280,
    grants:
      "personal +1 per term (no expiry), relationship +2 per membership-anchored month (no rollover), " +
      "2x Gift Personal coupons (welcome only, term 0), Decision Journal unlimited for the term, early access",
    requiresEligibilityCheck: false,
  },
  us_additional_relationship: {
    planId: "us_additional_relationship",
    paddleNickname: "ADDITIONAL_RELATIONSHIP",
    priceId: "pri_01m3469c0zse3kdmd7fkr3s6x4",
    billingType: "one_time",
    priceUsd: 9.99,
    grants: "relationship +1 (no expiry)",
    requiresEligibilityCheck: true,
  },
};

export function resolveUsPlan(planId: string): UsPlan | null {
  return (US_PLANS as Record<string, UsPlan>)[planId] ?? null;
}

export function usPlanHasPriceId(plan: UsPlan, priceId: string): boolean {
  return plan.priceId === priceId;
}
