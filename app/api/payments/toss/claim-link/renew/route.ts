import { NextResponse } from "next/server";
import {
  createRouteSupabaseClient,
  supabaseConfigErrorResponse,
} from "@/lib/supabase/serverClient";
import { readJsonBodyLimited } from "@/lib/security/requestValidation";
import { logServerError } from "@/lib/security/safeLog";
import { enforceRateLimit, rateLimitResponse } from "@/lib/security/rateLimit";
import { clientIpKey } from "@/lib/payment/guestCheckout";
import { claimTokenExpiry, newClaimNonce } from "@/lib/payment/guestClaimToken";
import { sendGuestPurchaseEmail } from "@/lib/email/guestPurchaseEmail";

export const runtime = "nodejs";

/**
 * "Send me a new link": issues a NEW claim link for a paid, unclaimed guest
 * order and emails it to the ORDER email (never to an address from the
 * request) -- receiving it is the proof. The old link stops working. At most
 * once per 5 minutes per order (plus the IP rate limit). The order and its
 * pass are unchanged; nothing is granted here.
 *
 * Always answers { ok: true } for a well-formed request so the endpoint does
 * not reveal order state.
 */
export async function POST(req: Request) {
  try {
    const limited = await enforceRateLimit("guest_checkout", clientIpKey(req));
    if (!limited.ok) return rateLimitResponse(limited);
    const parsed = await readJsonBodyLimited(req);
    if (!parsed.ok) return parsed.response;
    const orderId = String(((parsed.body ?? {}) as Record<string, unknown>).orderId ?? "").trim();
    if (!/^aha_[a-f0-9]{32}$/.test(orderId)) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();
    const { data, error } = await supabase.rpc("reissue_guest_purchase_email", {
      p_order_id: orderId,
      p_new_nonce: newClaimNonce(),
      p_new_expires_at: claimTokenExpiry(),
      p_min_interval_seconds: 300,
    });
    if (error) {
      logServerError("payments/toss/claim-link/renew", error, "reissue_failed");
      return NextResponse.json({ ok: true });
    }
    const r = (Array.isArray(data) ? data[0] : data) as string | Record<string, string> | undefined;
    const result = typeof r === "string" ? r : Object.values(r ?? {})[0];
    if (result === "reissued") await sendGuestPurchaseEmail(supabase, orderId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    logServerError("payments/toss/claim-link/renew", e, "internal_error");
    return NextResponse.json({ ok: true });
  }
}
