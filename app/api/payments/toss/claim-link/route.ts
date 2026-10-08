import { NextResponse } from "next/server";
import { createRouteSupabaseClient } from "@/lib/supabase/serverClient";
import { logServerError } from "@/lib/security/safeLog";
import { localizedPath } from "@/lib/i18n/locale";
import { orderLocale } from "@/lib/email/guestPurchaseEmail";
import { CLAIM_COOKIE, CLAIM_COOKIE_MAX_AGE_S, verifyClaimToken } from "@/lib/payment/guestClaimToken";
import { GUEST_LINK_COOKIE, GUEST_LINK_COOKIE_MAX_AGE_S } from "@/lib/payment/guestAccess";
import { isGuestUsePlan } from "@/lib/payment/tossCatalog";

export const runtime = "nodejs";

/**
 * Target of the "link my account" button in the purchase-guide email.
 * Checks the link token, keeps it ONLY in a short-lived httpOnly cookie
 * (used to prefill the sign-in email on the claim page) and redirects to the
 * claim page, whose URL carries no token. Grants nothing.
 *
 * Single Personal (usable without an account) goes to the guest use page
 * instead; there the buyer must press "use on this device" (a POST) to turn
 * the link into a 7-day guest session. A GET of this link -- including mail
 * scanners and link previews -- never creates a session or uses the pass.
 *
 * An expired / replaced link still lands on the right page (?link=expired)
 * where a new link or a code can be requested -- link expiry never affects
 * the order or its pass.
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
  let guestUse = false;
  const supabase = createRouteSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("toss_payment_orders")
      .select("locale, plan_id, claim_token_nonce, claim_token_expires_at")
      .eq("order_id", orderId)
      .maybeSingle();
    if (error) logServerError("payments/toss/claim-link", error, "read_failed");
    const row = data as { locale: string | null; plan_id: string | null; claim_token_nonce: string | null; claim_token_expires_at: string | null } | null;
    if (row) {
      guestUse = isGuestUsePlan(row.plan_id);
      locale = orderLocale(row.locale);
      valid = verifyClaimToken({ orderId, nonce: row.claim_token_nonce, expiresAt: row.claim_token_expires_at, token });
    }
  }

  const q = new URLSearchParams({ orderId });
  if (!valid) q.set("link", "expired");
  const page = guestUse ? "/checkout/toss/use" : "/checkout/toss/claim";
  const res = NextResponse.redirect(`${origin}${localizedPath(page, locale)}?${q.toString()}`, {
    status: 303,
    headers: noStore,
  });
  if (valid && guestUse) {
    res.cookies.set(GUEST_LINK_COOKIE, `${orderId}.${token}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/guest",
      maxAge: GUEST_LINK_COOKIE_MAX_AGE_S,
    });
  }
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
