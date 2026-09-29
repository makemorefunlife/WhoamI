"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRegionalCheckout, type RegionalCheckoutOutcome } from "@/lib/payment/useRegionalCheckout";

export type PurchaseCheckoutOutcome = RegionalCheckoutOutcome;

/**
 * Checkout entry point for every live purchase UI (PurchaseSelectorContent
 * -> PurchaseSelectorModal / PurchaseSelectorPage).
 *
 * Wraps the existing sandbox checkout hook unchanged and adds only
 * `purchasingAvailable`: whether the signed-in user is on the checkout QA
 * allowlist (GET /api/pricing/checkout/availability, see
 * lib/payment/checkoutAvailability.ts). The allowlist is enforced again
 * server-side by the prepare route BEFORE any checkout script loads, so a
 * non-QA click can never open a checkout even if this hint is stale.
 *
 * `availabilityLoaded` is false until that request resolves -- callers keep
 * their buy buttons disabled (and show no banner) until then.
 */
export function usePurchaseCheckout() {
  const { isSignedIn } = useUser();
  const regional = useRegionalCheckout();
  const [purchasingAvailable, setPurchasingAvailable] = useState(false);
  const [availabilityLoaded, setAvailabilityLoaded] = useState(false);

  useEffect(() => {
    if (!regional.isLoaded) return;
    if (!isSignedIn) {
      setPurchasingAvailable(false);
      setAvailabilityLoaded(true);
      return;
    }
    let cancelled = false;
    fetch("/api/pricing/checkout/availability")
      .then((res) => (res.ok ? res.json() : { available: false }))
      .then((body: { available?: boolean }) => {
        if (!cancelled) setPurchasingAvailable(body.available === true);
      })
      .catch(() => {
        if (!cancelled) setPurchasingAvailable(false);
      })
      .finally(() => {
        if (!cancelled) setAvailabilityLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [regional.isLoaded, isSignedIn]);

  return {
    busy: regional.busy,
    openCheckout: regional.openCheckout,
    isLoaded: regional.isLoaded,
    purchasingAvailable,
    availabilityLoaded,
  };
}
