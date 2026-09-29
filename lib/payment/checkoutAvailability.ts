/**
 * Provider-agnostic purchase availability switch.
 *
 * Paddle is no longer our payment provider (merchant application rejected,
 * 2026-09). Until the next provider (Lemon Squeezy) is approved and
 * integrated, there is NO active checkout provider, so:
 *   - every purchase CTA renders the localized "Purchasing is temporarily
 *     unavailable" state instead of opening any checkout,
 *   - /api/pricing/checkout/{prepare,complete} and
 *     /api/beta/checkout/complete refuse with 503 purchase_unavailable,
 *   - the Paddle webhook no longer grants NEW purchases (existing
 *     memberships' lifecycle events -- renewal, cancel, refund -- still
 *     apply, so nothing a user already owns is changed or destroyed).
 *
 * Deliberately a hard-coded constant, NOT an env flag: there is no
 * configuration value that can accidentally re-enable the dormant Paddle
 * checkout in production. Turning purchasing back on is a code change
 * that sets ACTIVE_CHECKOUT_PROVIDER to the new provider's id and wires
 * its checkout into usePurchaseCheckout.ts.
 *
 * Nothing here touches credits, entitlements, reports or purchase history:
 * existing credits are still reserved/consumed/released exactly as before,
 * and redeem codes (/api/redeem) keep working.
 */

/** Providers the app knows how to run a checkout with. Paddle is intentionally absent. */
export type CheckoutProviderId = "lemonsqueezy";

export const ACTIVE_CHECKOUT_PROVIDER: CheckoutProviderId | null = null;

/** Machine-readable error code returned by checkout API routes while purchasing is off. */
export const PURCHASE_UNAVAILABLE_CODE = "purchase_unavailable";

export function isPurchasingAvailable(): boolean {
  return ACTIVE_CHECKOUT_PROVIDER !== null;
}

/**
 * Pure outcome of "the user clicked a buy button" while no provider is
 * active -- exported for tests and used by usePurchaseCheckout.
 */
export function unavailableCheckoutOutcome(): "unavailable" | null {
  return isPurchasingAvailable() ? null : "unavailable";
}
