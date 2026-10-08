import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse, after } from "next/server";
import {
  createRouteSupabaseClient,
  supabaseConfigErrorResponse,
} from "@/lib/supabase/serverClient";
import { readJsonBodyLimited } from "@/lib/security/requestValidation";
import { logServerError } from "@/lib/security/safeLog";
import { processDueGuestEmails } from "@/lib/email/guestPurchaseEmail";
import { completeTossOrder } from "@/lib/payment/tossConfirm";
import { enforceRateLimit, rateLimitResponse } from "@/lib/security/rateLimit";
import { clientIpKey, maskEmail } from "@/lib/payment/guestCheckout";
import { decideTestGrant } from "@/lib/payment/tossTestMode";
import { CLAIM_COOKIE, CLAIM_COOKIE_MAX_AGE_S, claimTokenFor } from "@/lib/payment/guestClaimToken";
import { cookies } from "next/headers";
import { isGuestUsePlan } from "@/lib/payment/tossCatalog";
import {
  BUYER_SESSION_WINDOW_S,
  GUEST_BUYER_COOKIE,
  GUEST_SESSION_COOKIE,
  buyerCookieOptions,
  isBuyerCookieFor,
  openGuestSession,
  sessionCookieOptions,
} from "@/lib/payment/guestAccess";

export const runtime = "nodejs";

/**
 * Called by /checkout/toss/success with the query params Toss appended to
 * successUrl (paymentKey, orderId, amount). The client values are only
 * lookup keys -- every check (owner, amount, currency, eligibility) is done
 * against the server-created order row and Toss's own response. Safe to
 * call repeatedly with the same params (see completeTossOrder).
 *
 * Guest orders ({ guest: true }) need no session: they are confirmed (money
 * captured) and left 'awaiting_claim' -- nothing is granted until the buyer
 * claims them via /api/payments/toss/claim from a verified account.
 */
export async function POST(req: Request) {
  try {
    const parsed = await readJsonBodyLimited(req);
    if (!parsed.ok) return parsed.response;
    const body = (parsed.body ?? {}) as Record<string, unknown>;
    const guest = body.guest === true;

    const { userId } = await auth();
    if (!guest && !userId) {
      return NextResponse.json({ status: "unauthorized" }, { status: 401 });
    }
    if (guest) {
      const limited = await enforceRateLimit("guest_checkout", clientIpKey(req));
      if (!limited.ok) return rateLimitResponse(limited);
    }
    const paymentKey = typeof body.paymentKey === "string" ? body.paymentKey.trim() : "";
    const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
    const amount = Number(body.amount);
    if (!paymentKey || paymentKey.length > 200 || !/^aha_[a-f0-9]{32}$/.test(orderId) || !Number.isFinite(amount)) {
      return NextResponse.json({ status: "invalid_request" }, { status: 400 });
    }

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();

    // Serverless-safe extra sender: after this response, send up to a few due
    // purchase-guide emails (elapsed retries / backoffs). Bounded; each send
    // is guarded by the DB lease + Resend Idempotency-Key.
    after(async () => {
      await processDueGuestEmails(supabase, { limit: 3 }).catch(() => undefined);
    });

    const outcome = await completeTossOrder(supabase, {
      clerkUserId: guest ? null : (userId as string),
      orderId,
      paymentKey,
      amount,
      // Test orders on a public deployment: allowlist check on the Clerk user
      // id and Clerk-VERIFIED emails (read server-side, never from the body).
      testAccess: guest
        ? undefined
        : async () => {
            const user = await currentUser();
            const verifiedEmails = (user?.emailAddresses ?? [])
              .filter((e) => e.verification?.status === "verified")
              .map((e) => e.emailAddress);
            return decideTestGrant(supabase, { clerkUserId: userId as string, verifiedEmails });
          },
    });

    if (outcome.status === "awaiting_claim") {
      // Show the buyer which address to verify (masked) -- never the full email.
      const { data } = await supabase
        .from("toss_payment_orders")
        .select("guest_email, approved_at, claim_token_nonce, claim_token_expires_at")
        .eq("order_id", orderId)
        .maybeSingle();
      const row = data as {
        guest_email: string | null;
        approved_at: string | null;
        claim_token_nonce: string | null;
        claim_token_expires_at: string | null;
      } | null;
      const email = row?.guest_email ?? null;
      const approvedMs = row?.approved_at ? new Date(row.approved_at).getTime() : 0;

      // Guest single Personal, same browser that created the order, right
      // after approval: open the 7-day guest session now (no re-verification
      // on this device). Anywhere else, the email link / code is still needed.
      let deviceSession: string | null = null;
      if (isGuestUsePlan(outcome.planId) && approvedMs > 0 && Date.now() - approvedMs < BUYER_SESSION_WINDOW_S * 1000) {
        const buyerRaw = (await cookies()).get(GUEST_BUYER_COOKIE)?.value ?? null;
        if (isBuyerCookieFor(buyerRaw, orderId)) {
          deviceSession = await openGuestSession(supabase, orderId, "purchase");
        }
      }

      const res = NextResponse.json(
        { ...outcome, maskedEmail: email ? maskEmail(email) : null, deviceReady: deviceSession !== null },
        { status: 200 },
      );
      if (deviceSession) {
        res.cookies.set(GUEST_SESSION_COOKIE, deviceSession, sessionCookieOptions());
        res.cookies.set(GUEST_BUYER_COOKIE, "", buyerCookieOptions(0));
      }
      // The buyer's own browser, right after paying: a short-lived httpOnly
      // cookie (not readable by page scripts, not in any URL) lets the claim
      // page prefill the sign-up / sign-in email. Only within 30 minutes of
      // the approval, and the cookie alone grants nothing.
      const fresh = approvedMs > 0 && Date.now() - approvedMs < CLAIM_COOKIE_MAX_AGE_S * 1000;
      const token = fresh && row?.claim_token_nonce ? claimTokenFor(orderId, row.claim_token_nonce) : null;
      if (token) {
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

    if (outcome.status === "test_no_grant") {
      return NextResponse.json(outcome, { status: 200 });
    }

    const httpStatus =
      outcome.status === "granted"
        ? 200
        : outcome.status === "pending_retry"
          ? 202
          : outcome.status === "payment_failed"
            ? 402
            : outcome.status === "rejected"
              ? outcome.reason === "in_progress"
                ? 202
                : 409
              : 409;
    return NextResponse.json(outcome, { status: httpStatus });
  } catch (e) {
    logServerError("payments/toss/confirm", e, "internal_error");
    return NextResponse.json({ status: "pending_retry", reason: "internal_error" }, { status: 500 });
  }
}
