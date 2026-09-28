import type { SupabaseClient } from "@supabase/supabase-js";
import { logServerError, logServerEvent } from "@/lib/security/safeLog";

/**
 * Our catalog is fixed products bought at quantity 1 (a pack such as
 * kr_relationship_triple is its own product, still quantity 1), and
 * process_us_purchase / process_kr_purchase grant a fixed amount per plan.
 * Paddle's overlay can still let a buyer change quantity when a price's
 * quantity range allows it, so both fulfillment paths check the FINAL
 * Paddle transaction before granting: anything other than exactly one unit
 * in total is not auto-fulfilled -- it is flagged for manual review instead
 * of silently granting the fixed (1x) amount for an Nx charge.
 */

type PaddleItemLike = {
  quantity?: unknown;
};

/**
 * Total units across every line item of a Paddle transaction. A missing or
 * malformed quantity counts as 1 (Paddle always sends one; this keeps an
 * unexpected payload shape from blocking a normal purchase).
 */
export function paddleTransactionTotalQuantity(items: unknown): number {
  if (!Array.isArray(items) || items.length === 0) return 1;
  let total = 0;
  for (const item of items as PaddleItemLike[]) {
    const q = item && typeof item === "object" ? item.quantity : undefined;
    total += typeof q === "number" && Number.isInteger(q) && q > 0 ? q : 1;
  }
  return total;
}

/** True when the transaction must be held for manual review (not exactly 1 unit). */
export function paddleQuantityRequiresReview(items: unknown): boolean {
  return paddleTransactionTotalQuantity(items) !== 1;
}

export type ManualReviewSource = "webhook" | "checkout_complete";

/**
 * Records the transaction in payment_manual_reviews (idempotent on
 * provider + transaction id, so the webhook, the client /complete call and
 * Paddle retries all land on one row). Grants nothing. Returns ok:false only
 * when the flag could not be persisted -- callers then fail loudly so the
 * event is retried rather than lost.
 */
export async function flagPaymentForManualReview(
  supabase: SupabaseClient,
  params: {
    transactionId: string;
    quantity: number;
    source: ManualReviewSource;
    region?: string | null;
    planId?: string | null;
    priceId?: string | null;
    clerkUserId?: string | null;
  },
): Promise<{ ok: boolean }> {
  const { error } = await supabase.from("payment_manual_reviews").upsert(
    {
      provider: "paddle",
      provider_transaction_id: params.transactionId,
      region: params.region ?? null,
      plan_id: params.planId ?? null,
      price_id: params.priceId ?? null,
      quantity: params.quantity,
      clerk_user_id: params.clerkUserId ?? null,
      reason: "quantity_not_one",
      source: params.source,
    },
    { onConflict: "provider,provider_transaction_id", ignoreDuplicates: true },
  );
  if (error) {
    logServerError("paddleQuantityGuard.flag", error, "manual_review_flag_failed");
    return { ok: false };
  }
  logServerEvent("paddleQuantityGuard", `manual_review_quantity_${params.quantity}_${params.source}`);
  return { ok: true };
}
