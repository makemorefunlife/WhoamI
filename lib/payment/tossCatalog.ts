import { US_PLANS, type UsPlanId } from "@/lib/payment/usPricing";
import { KR_PLANS, type KrPlanId } from "@/lib/payment/krPricing";

/**
 * Plans sold through the Toss Payments payment window. Safe to import on the
 * client -- no secrets here.
 *
 * Amount/currency are fixed HERE (server-authoritative at order creation and
 * re-checked at confirm); the client only echoes what the order API returned.
 *
 * KRW plans (all four KR products) pay by card (method CARD).
 *
 * USD (the US 12-Month Membership): Toss card payments in USD require Toss's
 * foreign-currency contract; USD is otherwise only offered through
 * FOREIGN_EASY_PAY (PayPal). Until the contract is confirmed, USD checkout
 * stays DISABLED: there is no default method and no fallback to KRW or to
 * another method. It opens only when TOSS_USD_PAYMENT_METHOD is set
 * explicitly to a method confirmed on the merchant contract.
 */
export type TossPaymentMethod = "CARD" | "FOREIGN_EASY_PAY";

export type TossPlan = {
  planId: UsPlanId | KrPlanId;
  amount: number;
  currency: "USD" | "KRW";
  orderName: { "en-US": string; "ko-KR": string };
  /**
   * Can be bought without signing in (paid first, then claimed into an
   * account after the buyer proves ownership of the order email). Never true
   * for the membership: it depends on the buyer's existing membership state,
   * which can only be checked for a known account before charging.
   */
  guestCheckout: boolean;
};

function krPlan(planId: KrPlanId, ko: string, en: string): TossPlan {
  return {
    planId,
    amount: KR_PLANS[planId].priceKrw,
    currency: "KRW",
    orderName: { "ko-KR": `Aha It's me ${ko}`, "en-US": `Aha It's me ${en}` },
    guestCheckout: true,
  };
}

export const TOSS_PLANS: Partial<Record<string, TossPlan>> = {
  us_annual_membership: {
    planId: "us_annual_membership",
    amount: US_PLANS.us_annual_membership.priceUsd,
    currency: "USD",
    orderName: { "en-US": "Aha It's me 12-Month Membership", "ko-KR": "Aha It's me 12개월 멤버십" },
    guestCheckout: false,
  },
  kr_personal_premium: krPlan("kr_personal_premium", "Personal 심화 분석", "Personal deep report"),
  kr_relationship_premium: krPlan("kr_relationship_premium", "Relationship 심화 분석", "Relationship deep report"),
  kr_insight_pass_30d: krPlan("kr_insight_pass_30d", "30일 인사이트 패스", "30-Day Insight Pass"),
  kr_relationship_triple: krPlan("kr_relationship_triple", "Relationship Triple", "Relationship Triple"),
};

export function resolveTossPlan(planId: string): TossPlan | null {
  return TOSS_PLANS[planId] ?? null;
}

export function isTossPlan(planId: string): boolean {
  return resolveTossPlan(planId) !== null;
}

export function isGuestTossPlan(planId: string): boolean {
  return resolveTossPlan(planId)?.guestCheckout === true;
}

/**
 * Whether a plan can be bought right now. Only Toss-sold plans can; KRW
 * plans are always on, USD plans only when US checkout is switched on
 * (NEXT_PUBLIC_US_CHECKOUT_ENABLED). The server additionally requires a
 * contract-confirmed TOSS_USD_PAYMENT_METHOD before it creates a USD order.
 */
export function isCheckoutEnabled(planId: string, usCheckoutEnabled: boolean): boolean {
  const plan = resolveTossPlan(planId);
  if (!plan) return false;
  return plan.currency === "KRW" || usCheckoutEnabled;
}

/**
 * Payment method for a currency, or null when that currency is not enabled.
 * KRW -> CARD. USD -> only an explicitly configured, contract-confirmed method.
 */
export function resolveTossPaymentMethod(
  currency: TossPlan["currency"],
  usdMethodEnv: string | undefined,
): TossPaymentMethod | null {
  if (currency === "KRW") return "CARD";
  const v = usdMethodEnv?.trim().toUpperCase();
  return v === "CARD" || v === "FOREIGN_EASY_PAY" ? v : null;
}

/** Amounts are compared as fixed 2-decimal strings to avoid float drift. */
export function sameAmount(a: number | string, b: number | string): boolean {
  const na = Number(a);
  const nb = Number(b);
  if (!Number.isFinite(na) || !Number.isFinite(nb)) return false;
  return na.toFixed(2) === nb.toFixed(2);
}
