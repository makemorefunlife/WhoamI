/**
 * Temporary stand-in for the US/English checkout while it stays disabled
 * (see tossCatalog.ts's isCheckoutEnabled -- US Toss is off pending the USD
 * contract, Paddle is disconnected pending re-approval).
 *
 * Covers only the two plans that gate the English "Analyze -> paywall ->
 * unlock" flow (StitchPremiumCard / the relationship paywall). Every other
 * US plan (membership, 30-Day Pass, additional relationship) stays fully
 * disabled -- NEXT_PUBLIC_US_FREE_BETA_ENABLED never affects them.
 *
 * Gated independently of NEXT_PUBLIC_US_CHECKOUT_ENABLED on purpose: turning
 * this on must never also turn on the real (still-unready) Toss/Paddle
 * checkout for US plans, and turning the real checkout on later should be a
 * one-line revert in PurchaseSelectorContent.handleCheckout, not a flag
 * flip here.
 */
export type UsFreeBetaPlanId = "us_personal_premium" | "us_relationship_premium";

const US_FREE_BETA_PLAN_IDS: readonly UsFreeBetaPlanId[] = [
  "us_personal_premium",
  "us_relationship_premium",
];

export function isUsFreeBetaPlanId(planId: string): planId is UsFreeBetaPlanId {
  return (US_FREE_BETA_PLAN_IDS as readonly string[]).includes(planId);
}

/** Safe to read on the client (NEXT_PUBLIC_) and on the server (same env var). */
export function usFreeBetaEnabled(): boolean {
  return process.env.NEXT_PUBLIC_US_FREE_BETA_ENABLED === "true";
}
