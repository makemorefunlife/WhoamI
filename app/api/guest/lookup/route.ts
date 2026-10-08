import { NextResponse } from "next/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { readJsonBodyLimited } from "@/lib/security/requestValidation";
import { enforceRateLimit, rateLimitResponse } from "@/lib/security/rateLimit";
import { logServerError } from "@/lib/security/safeLog";
import { clientIpKey, normalizeGuestEmail } from "@/lib/payment/guestCheckout";
import { claimTokenExpiry, newClaimNonce } from "@/lib/payment/guestClaimToken";
import { sendGuestPurchaseEmail } from "@/lib/email/guestPurchaseEmail";
import { rpcText } from "@/lib/payment/guestAccess";

export const runtime = "nodejs";

/**
 * Lost the email / link: re-sends the purchase guide (with a NEW link) for
 * up to 5 paid, unlinked guest orders of that email -- always TO that email,
 * so receiving it is the proof. Same answer whether or not orders exist.
 */
export async function POST(req: Request) {
  try {
    const limited = await enforceRateLimit("guest_code_send", clientIpKey(req));
    if (!limited.ok) return rateLimitResponse(limited);
    const parsed = await readJsonBodyLimited(req);
    if (!parsed.ok) return parsed.response;
    const email = normalizeGuestEmail(((parsed.body ?? {}) as Record<string, unknown>).email);
    if (!email) return NextResponse.json({ status: "invalid_email" }, { status: 400 });

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();
    const { data } = await supabase
      .from("toss_payment_orders")
      .select("order_id")
      .eq("guest_email", email)
      .eq("status", "paid")
      .is("clerk_user_id", null)
      .limit(5);
    for (const row of (data ?? []) as { order_id: string }[]) {
      const { data: r } = await supabase.rpc("reissue_guest_purchase_email", {
        p_order_id: row.order_id,
        p_new_nonce: newClaimNonce(),
        p_new_expires_at: claimTokenExpiry(),
        p_min_interval_seconds: 300,
      });
      if (rpcText(r) === "reissued") await sendGuestPurchaseEmail(supabase, row.order_id);
    }
    return NextResponse.json({ status: "ok" });
  } catch (e) {
    logServerError("guest/lookup", e, "internal_error");
    return NextResponse.json({ status: "ok" });
  }
}
