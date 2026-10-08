import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { logServerError } from "@/lib/security/safeLog";
import { verifyClaimToken } from "@/lib/payment/guestClaimToken";
import {
  GUEST_LINK_COOKIE,
  GUEST_SESSION_COOKIE,
  openGuestSession,
  sessionCookieOptions,
} from "@/lib/payment/guestAccess";

export const runtime = "nodejs";

/**
 * "Use my pass on this device" after opening the emailed purchase link.
 * Only an explicit POST (a click on the page) turns the link cookie set by
 * /api/payments/toss/claim-link into a 7-day guest session -- a mail
 * scanner / link preview that only GETs the link creates no session and uses
 * nothing.
 */
export async function POST() {
  try {
    const jar = await cookies();
    const raw = jar.get(GUEST_LINK_COOKIE)?.value ?? "";
    const [orderId, token] = raw.split(".");
    if (!orderId || !token) return NextResponse.json({ status: "no_link" }, { status: 401 });
    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();
    const { data } = await supabase
      .from("toss_payment_orders")
      .select("claim_token_nonce, claim_token_expires_at")
      .eq("order_id", orderId)
      .maybeSingle();
    const row = data as { claim_token_nonce: string | null; claim_token_expires_at: string | null } | null;
    if (!row || !verifyClaimToken({ orderId, nonce: row.claim_token_nonce, expiresAt: row.claim_token_expires_at, token })) {
      return NextResponse.json({ status: "link_expired" }, { status: 401 });
    }
    const session = await openGuestSession(supabase, orderId, "link");
    if (!session) return NextResponse.json({ status: "not_available" }, { status: 409 });
    const res = NextResponse.json({ status: "verified", orderId }, { headers: { "Cache-Control": "no-store" } });
    res.cookies.set(GUEST_SESSION_COOKIE, session, sessionCookieOptions());
    res.cookies.set(GUEST_LINK_COOKIE, "", { path: "/api/guest", maxAge: 0 });
    return res;
  } catch (e) {
    logServerError("guest/access/link", e, "internal_error");
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
