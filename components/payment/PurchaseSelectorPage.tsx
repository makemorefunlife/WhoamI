"use client";

import PurchaseSelectorContent, { type PurchaseContext } from "@/components/payment/PurchaseSelectorContent";

/**
 * Full-page mode of the same selector -- used by app/pricing/page.tsx in
 * place of the old standalone RegionalPricingCards render. The page's own
 * hero/notice/container markup is untouched; this is a drop-in
 * replacement for just the cards area.
 */
export default function PurchaseSelectorPage({ context = "personal" }: { context?: PurchaseContext }) {
  return <PurchaseSelectorContent context={context} />;
}
