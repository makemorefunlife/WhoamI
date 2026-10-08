import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { logServerError } from "@/lib/security/safeLog";
import { GUEST_LINK_COOKIE } from "@/lib/payment/guestAccess";
import { verifyClaimToken } from "@/lib/payment/guestClaimToken";
import { maskEmail } from "@/lib/payment/guestCheckout";
import { loadGuestPersonalState } from "@/lib/payment/guestPersonal";
import { guestSessionOrderId, ORDER_ID_RE } from "@/lib/payment/guestRoute";

export const runtime = "nodejs";

/**
 * Guest Personal state for the caller's verified guest session.
 * Without a valid session for this order: { status: "unverified" } plus
 * whether a valid purchase-link cookie is present (so the page can offer
 * "use on this device") -- nothing else about the order.
 */
export async function GET(req: Request) {
  try {
    const orderId = new URL(req.url).searchParams.get("orderId") ?? "";
    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();
    const sessionOrder = await guestSessionOrderId(supabase);
    const target = ORDER_ID_RE.test(orderId) ? orderId : sessionOrder;

    if (!target || sessionOrder !== target) {
      let linkReady = false;
      let maskedEmail: string | null = null;
      const [linkOrder, linkToken] = ((await cookies()).get(GUEST_LINK_COOKIE)?.value ?? "").split(".");
      if (target && linkOrder === target && linkToken) {
        const { data } = await supabase
          .from("toss_payment_orders")
          .select("guest_email, claim_token_nonce, claim_token_expires_at")
          .eq("order_id", target)
          .maybeSingle();
        const row = data as { guest_email: string | null; claim_token_nonce: string | null; claim_token_expires_at: string | null } | null;
        linkReady = Boolean(
          row && verifyClaimToken({ orderId: target, nonce: row.claim_token_nonce, expiresAt: row.claim_token_expires_at, token: linkToken }),
        );
        if (linkReady && row?.guest_email) maskedEmail = maskEmail(row.guest_email);
      }
      return NextResponse.json({ status: "unverified", linkReady, maskedEmail }, { headers: { "Cache-Control": "no-store" } });
    }

    const state = await loadGuestPersonalState(supabase, target);
    if (!state) return NextResponse.json({ status: "not_available" }, { status: 404 });
    return NextResponse.json({ ...state, orderId: target }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    logServerError("guest/personal", e, "internal_error");
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
