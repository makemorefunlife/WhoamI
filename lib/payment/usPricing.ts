/**
 * US Paddle SANDBOX product/price catalog — separate from betaPaddlePricing.ts
 * on purpose: these are real, different prices from the existing beta
 * catalog (e.g. Personal is $11.99 here vs $4.99 in BETA_PLANS), so the two
 * sets must never be merged into one keyed object or a US purchase could
 * resolve to the wrong price.
 *
 * Paddle price ids below are PLACEHOLDERS ("TODO_PADDLE_SANDBOX_PRICE_ID_*")
 * -- they must be created in the Paddle sandbox dashboard (one product,
 * five one-time/recurring prices, matching betaPaddlePricing.ts's existing
 * pattern) before checkout can actually open. Nothing reads these as
 * secrets; swap the strings in place once the dashboard prices exist.
 *
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
  paddleProductId: string;
  priceId: string;
  billingType: UsBillingType;
  priceUsd: number;
  /**
   * DOCUMENTATION ONLY, same convention as BETA_PLANS.grants — the actual
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
    paddleProductId: "TODO_PADDLE_SANDBOX_PRODUCT_ID_US",
    priceId: "TODO_PADDLE_SANDBOX_PRICE_ID_US_PERSONAL",
    billingType: "one_time",
    priceUsd: 11.99,
    grants: "personal +1 (no expiry)",
    requiresEligibilityCheck: false,
  },
  us_relationship_premium: {
    planId: "us_relationship_premium",
    paddleProductId: "TODO_PADDLE_SANDBOX_PRODUCT_ID_US",
    priceId: "TODO_PADDLE_SANDBOX_PRICE_ID_US_RELATIONSHIP",
    billingType: "one_time",
    priceUsd: 18.99,
    grants: "relationship +1 (no expiry)",
    requiresEligibilityCheck: false,
  },
  us_insight_pass_30d: {
    planId: "us_insight_pass_30d",
    paddleProductId: "TODO_PADDLE_SANDBOX_PRODUCT_ID_US",
    priceId: "TODO_PADDLE_SANDBOX_PRICE_ID_US_INSIGHT_PASS",
    billingType: "one_time",
    priceUsd: 28,
    grants: "personal +1, relationship +1 (both expire 30 days after purchase), Decision Journal unlimited for 30 days",
    requiresEligibilityCheck: false,
  },
  us_annual_membership: {
    planId: "us_annual_membership",
    paddleProductId: "TODO_PADDLE_SANDBOX_PRODUCT_ID_US",
    priceId: "TODO_PADDLE_SANDBOX_PRICE_ID_US_ANNUAL",
    billingType: "recurring_annual",
    priceUsd: 280,
    grants:
      "personal +1 per term (no expiry), relationship +2 per membership-anchored month (no rollover), " +
      "2x Gift Personal coupons (welcome only, term 0), Decision Journal unlimited for the term, early access",
    requiresEligibilityCheck: false,
  },
  us_additional_relationship: {
    planId: "us_additional_relationship",
    paddleProductId: "TODO_PADDLE_SANDBOX_PRODUCT_ID_US",
    priceId: "TODO_PADDLE_SANDBOX_PRICE_ID_US_ADDITIONAL_RELATIONSHIP",
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
