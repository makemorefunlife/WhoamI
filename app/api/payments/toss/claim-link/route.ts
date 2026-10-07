import { NextResponse } from "next/server";
import { createRouteSupabaseClient } from "@/lib/supabase/serverClient";
import { logServerError } from "@/lib/security/safeLog";
import { localizedPath } from "@/lib/i18n/locale";
import { orderLocale } from "@/lib/email/guestPurchaseEmail";
import { CLAIM_COOKIE, CLAIM_COOKIE_MAX_AGE_S, verifyClaimToken } from "@/lib/payment/guestClaimToken";

export const runtime = "nodejs";

/**
 * Target of the "link my account" button in the purchase-guide email.
 * Checks the link token, keeps it ONLY in a short-lived httpOnly cookie
 * (used to prefill the sign-in email on the claim page) and redirects to the
 * claim page, whose URL carries no token. Grants nothing.
 *
 * An expired / replaced link still lands on the claim page (?link=expired)
 * where a new link can be requested -- link expiry never affects the order
 * or its pass.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const orderId = url.searchParams.get("orderId") ?? "";
  const token = (url.searchParams.get("t") ?? "").slice(0, 100);
  const origin = url.origin;
  const noStore = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" };

  if (!/^aha_[a-f0-9]{32}$/.test(orderId)) {
    return NextResponse.redirect(`${origin}/`, { status: 303, headers: noStore });
  }

  let locale: "ko-KR" | "en-US" = "ko-KR";
  let valid = false;
  const supabase = createRouteSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("toss_payment_orders")
      .select("locale, claim_token_nonce, claim_token_expires_at")
      .eq("order_id", orderId)
      .maybeSingle();
    if (error) logServerError("payments/toss/claim-link", error, "read_failed");
    const row = data as { locale: string | null; claim_token_nonce: string | null; claim_token_expires_at: string | null } | null;
    if (row) {
      locale = orderLocale(row.locale);
      valid = verifyClaimToken({ orderId, nonce: row.claim_token_nonce, expiresAt: row.claim_token_expires_at, token });
    }
  }

  const q = new URLSearchParams({ orderId });
  if (!valid) q.set("link", "expired");
  const res = NextResponse.redirect(`${origin}${localizedPath("/checkout/toss/claim", locale)}?${q.toString()}`, {
    status: 303,
    headers: noStore,
  });
  if (valid) {
    res.cookies.set(CLAIM_COOKIE, `${orderId}.${token}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/payments/toss",
      maxAge: CLAIM_COOKIE_MAX_AGE_S,
    });
  }
  return res;
}
