/**
 * Temporary stand-in for the US/English checkout while it stays disabled
 * (see tossCatalog.ts's isCheckoutEnabled -- US Toss is off pending the USD
 * contract, Paddle is disconnected pending re-approval).
 *
 * Covers only the two plans that gate the English "Analyze -> paywall ->
 * unlock" flow (StitchPremiumCard / the relationship paywall). Every other
 * US plan (membership, 30-Day Pass, additional relationship) stays fully
 * disabled -- US_FREE_BETA_LIVE never affects them.
 *
 * US_FREE_BETA_LIVE is a CODE switch, not an env var (2026-10-21 decision):
 * no separate Vercel configuration step to coordinate, so "is the feature
 * live" is always exactly what's in this file in the deployed commit --
 * visible in the diff, flippable in one PR, no drift between what's
 * committed and what's actually running. Default is an explicit `false`;
 * flipping it to `true` is a deliberate, reviewed code change, never an
 * implicit fallback for a missing/misconfigured setting.
 *
 * Independent of NEXT_PUBLIC_US_CHECKOUT_ENABLED on purpose either way:
 * turning this on must never also turn on the real (still-unready)
 * Toss/Paddle checkout for US plans, and turning the real checkout on later
 * should be a one-line revert in PurchaseSelectorContent.handleCheckout,
 * not a flag flip here.
 */
export const US_FREE_BETA_LIVE = true;

export type UsFreeBetaPlanId = "us_personal_premium" | "us_relationship_premium";

const US_FREE_BETA_PLAN_IDS: readonly UsFreeBetaPlanId[] = [
  "us_personal_premium",
  "us_relationship_premium",
];

export function isUsFreeBetaPlanId(planId: string): planId is UsFreeBetaPlanId {
  return (US_FREE_BETA_PLAN_IDS as readonly string[]).includes(planId);
}
