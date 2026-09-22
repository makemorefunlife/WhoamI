import { resolveUsPlan, usPlanHasPriceId, type UsPlanId } from "@/lib/payment/usPricing";
import { resolveKrPlan, krPlanHasPriceId, type KrPlanId } from "@/lib/payment/krPricing";

/**
 * The ONE place that decides which region a plan id belongs to. Deliberately
 * derives region from the plan id's own namespace ('us_*' vs 'kr_*') rather
 * than trusting a client-supplied locale field: the two catalogs' plan ids
 * never overlap by construction, so this lookup can never resolve a US id
 * against the KR grant path or vice versa, regardless of what a request
 * claims its locale is. app/api/pricing/checkout/complete/route.ts uses
 * this as its sole basis for choosing process_us_purchase vs
 * process_kr_purchase -- there is no other branch point where the two
 * could get crossed.
 */
export type RegionalPlanMatch =
  | { region: "us"; planId: UsPlanId; priceId: string; billingType: "one_time" | "recurring_annual" }
  | { region: "kr"; planId: KrPlanId; priceId: string; billingType: "one_time" };

export function resolveRegionalPlan(planId: string): RegionalPlanMatch | null {
  const us = resolveUsPlan(planId);
  if (us) {
    return { region: "us", planId: us.planId, priceId: us.priceId, billingType: us.billingType };
  }
  const kr = resolveKrPlan(planId);
  if (kr) {
    return { region: "kr", planId: kr.planId, priceId: kr.priceId, billingType: kr.billingType };
  }
  return null;
}

export function regionalPlanHasPriceId(match: RegionalPlanMatch, priceId: string): boolean {
  if (match.region === "us") {
    const plan = resolveUsPlan(match.planId);
    return plan ? usPlanHasPriceId(plan, priceId) : false;
  }
  const plan = resolveKrPlan(match.planId);
  return plan ? krPlanHasPriceId(plan, priceId) : false;
}
