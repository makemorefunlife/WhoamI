import { cookies } from "next/headers";
import { NextResponse, after } from "next/server";
import { processDueGuestEmails } from "@/lib/email/guestPurchaseEmail";
import {
  createRouteSupabaseClient,
  supabaseConfigErrorResponse,
} from "@/lib/supabase/serverClient";
import { readJsonBodyLimited } from "@/lib/security/requestValidation";
import { logServerError } from "@/lib/security/safeLog";
import { enforceRateLimit, rateLimitResponse } from "@/lib/security/rateLimit";
import { clientIpKey, maskEmail } from "@/lib/payment/guestCheckout";
import { CLAIM_COOKIE, verifyClaimToken } from "@/lib/payment/guestClaimToken";

export const runtime = "nodejs";

/**
 * Guest claim page helper: what is this order and (only for the holder of
 * the claim-link token, or the buyer's own browser right after paying) which
 * email should Clerk's sign-up / sign-in form be prefilled with.
 *
 * POST { orderId }
 *   The token comes only from the short-lived httpOnly cookie set by
 *   /confirm (right after paying) or /claim-link (emailed link).
 *
 * Read only. Grants nothing: the purchase is attached only by
 * /api/payments/toss/claim for a signed-in account whose Clerk-VERIFIED email
 * equals the order email.
 */
export async function POST(req: Request) {
  try {
    const limited = await enforceRateLimit("guest_checkout", clientIpKey(req));
    if (!limited.ok) return rateLimitResponse(limited);

    const parsed = await readJsonBodyLimited(req);
    if (!parsed.ok) return parsed.response;
    const body = (parsed.body ?? {}) as Record<string, unknown>;
    const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
    if (!/^aha_[a-f0-9]{32}$/.test(orderId)) {
      return NextResponse.json({ status: "invalid_request" }, { status: 400 });
    }
    const raw = (await cookies()).get(CLAIM_COOKIE)?.value ?? "";
    const [cookieOrder, cookieToken] = raw.split(".");
    const token = cookieOrder === orderId && cookieToken ? cookieToken : "";

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();
    after(async () => {
      await processDueGuestEmails(supabase, { limit: 3 }).catch(() => undefined);
    });
    const { data, error } = await supabase
      .from("toss_payment_orders")
      .select("order_id, plan_id, amount, currency, status, guest_email, clerk_user_id, is_test, test_grant_blocked_reason, claim_token_nonce, claim_token_expires_at, approved_at, locale")
      .eq("order_id", orderId)
      .maybeSingle();
    if (error) {
      logServerError("payments/toss/claim-info", error, "read_failed");
      return NextResponse.json({ status: "error" }, { status: 500 });
    }
    const row = data as {
      order_id: string;
      plan_id: string;
      amount: number | string;
      currency: string;
      status: string;
      guest_email: string | null;
      clerk_user_id: string | null;
      is_test: boolean | null;
      test_grant_blocked_reason: string | null;
      claim_token_nonce: string | null;
      claim_token_expires_at: string | null;
      approved_at: string | null;
      locale: string | null;
    } | null;
    if (!row || !row.guest_email) return NextResponse.json({ status: "not_found" }, { status: 404 });

    const tokenValid = verifyClaimToken({
      orderId,
      nonce: row.claim_token_nonce,
      expiresAt: row.claim_token_expires_at,
      token,
    });
    const status = row.test_grant_blocked_reason || row.status === "test_completed"
      ? "test_not_allowed"
      : row.clerk_user_id
        ? "claimed"
        : row.status === "paid"
          ? "awaiting_claim"
          : "closed";

    return NextResponse.json(
      {
        status,
        planId: row.plan_id,
        amount: Number(row.amount),
        currency: row.currency,
        isTest: row.is_test === true,
        maskedEmail: maskEmail(row.guest_email),
        // Purchase time (pass end date = this + 30 days) and order language,
        // so the page shows the same wording as the purchase email.
        approvedAt: row.approved_at,
        locale: row.locale === "en-US" ? "en-US" : "ko-KR",
        linkValid: tokenValid,
        // Full email only for the link / cookie holder, only while unclaimed,
        // and only to prefill Clerk's form -- it proves nothing by itself.
        prefillEmail: tokenValid && status === "awaiting_claim" ? row.guest_email : null,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    logServerError("payments/toss/claim-info", e, "internal_error");
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
