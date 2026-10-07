import { US_PLANS, type UsPlanId } from "@/lib/payment/usPricing";

/**
 * Plans sold through Toss Payments (one-time payment window). Safe to import
 * on the client -- no secrets here.
 *
 * Amount/currency are fixed HERE (server-authoritative at order creation and
 * re-checked at confirm); the client only ever echoes what the order API
 * returned.
 *
 * Currency note: Toss card payments in USD need Toss's foreign-currency
 * (해외결제) contract on the merchant account; without it, USD is only
 * available through FOREIGN_EASY_PAY (PayPal). The method is therefore an
 * env setting (TOSS_US_PAYMENT_METHOD) rather than hard-coded -- see
 * docs/dev/decisions/2026-10-07_one_time_membership_toss.md.
 */
export type TossPaymentMethod = "CARD" | "FOREIGN_EASY_PAY";

export type TossPlan = {
  planId: UsPlanId;
  amount: number;
  currency: "USD" | "KRW";
  orderName: { "en-US": string; "ko-KR": string };
};

export const TOSS_PLANS: Partial<Record<string, TossPlan>> = {
  us_annual_membership: {
    planId: "us_annual_membership",
    amount: US_PLANS.us_annual_membership.priceUsd,
    currency: "USD",
    orderName: { "en-US": "Aha It's me 12-Month Membership", "ko-KR": "Aha It's me 12개월 멤버십" },
  },
};

export function resolveTossPlan(planId: string): TossPlan | null {
  return TOSS_PLANS[planId] ?? null;
}

export function isTossPlan(planId: string): boolean {
  return resolveTossPlan(planId) !== null;
}

export function resolveTossPaymentMethod(raw: string | undefined): TossPaymentMethod {
  return raw?.trim().toUpperCase() === "FOREIGN_EASY_PAY" ? "FOREIGN_EASY_PAY" : "CARD";
}

/** Amounts are compared as fixed 2-decimal strings to avoid float drift. */
export function sameAmount(a: number | string, b: number | string): boolean {
  const na = Number(a);
  const nb = Number(b);
  if (!Number.isFinite(na) || !Number.isFinite(nb)) return false;
  return na.toFixed(2) === nb.toFixed(2);
}
