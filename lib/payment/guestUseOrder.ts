import type { SupabaseClient } from "@supabase/supabase-js";
import { isGuestPersonalPlan, isGuestRelationshipPlan, isGuestUseOrderRow } from "@/lib/payment/tossCatalog";

/**
 * Whether an EXISTING guest order is used without an account (SERVER ONLY).
 * Personal: by plan (unchanged). Relationship: only orders flagged
 * guest_use_enabled at creation -- earlier orders keep the account flow.
 * Reading the flag is best-effort: if the column is not there yet (migration
 * 20261011140000 not applied) the order keeps the account flow.
 */
export async function isGuestUseOrder(
  supabase: SupabaseClient,
  orderId: string,
  planId: string | null | undefined,
): Promise<boolean> {
  if (isGuestPersonalPlan(planId)) return true;
  if (!isGuestRelationshipPlan(planId)) return false;
  const { data, error } = await supabase
    .from("toss_payment_orders")
    .select("plan_id, guest_use_enabled")
    .eq("order_id", orderId)
    .maybeSingle();
  if (error || !data) return false;
  return isGuestUseOrderRow(data as { plan_id: string; guest_use_enabled: boolean | null });
}
