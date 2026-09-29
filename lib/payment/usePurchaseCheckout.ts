"use client";

import { useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import type { Locale } from "@/lib/i18n/locale";
import { isPurchasingAvailable } from "@/lib/payment/checkoutAvailability";

export type PurchaseCheckoutOutcome =
  | "success"
  | "already_processed"
  | "cancelled"
  | "error"
  | "ineligible"
  | "not_ready"
  /** Paid, but held for manual review (nothing granted yet). */
  | "needs_review"
  /** No checkout provider is active -- see checkoutAvailability.ts. */
  | "unavailable";

/**
 * Provider-agnostic checkout entry point used by every live purchase UI
 * (PurchaseSelectorContent -> PurchaseSelectorModal / PurchaseSelectorPage).
 *
 * Replaces the direct use of the Paddle-specific useRegionalCheckout hook
 * so that no production page imports, loads or opens Paddle.js. While
 * ACTIVE_CHECKOUT_PROVIDER is null, openCheckout never contacts any
 * payment provider or checkout API and resolves to "unavailable".
 *
 * When the next provider is approved, add its checkout here (keeping the
 * same outcome contract: success / already_processed / needs_review ...)
 * so none of the UI call sites have to change.
 */
export function usePurchaseCheckout() {
  const { isLoaded } = useUser();
  const purchasingAvailable = isPurchasingAvailable();

  const openCheckout = useCallback(
    async (
      _planId: string,
      _locale: Locale,
      _opts?: { successRedirectPath?: string },
    ): Promise<PurchaseCheckoutOutcome> => {
      if (!purchasingAvailable) return "unavailable";
      // No provider implementation exists yet; fail closed.
      return "unavailable";
    },
    [purchasingAvailable],
  );

  return { busy: false, openCheckout, isLoaded, purchasingAvailable };
}
