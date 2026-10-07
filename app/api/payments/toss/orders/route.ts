import { createHash, randomUUID } from "node:crypto";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  createRouteSupabaseClient,
  supabaseConfigErrorResponse,
} from "@/lib/supabase/serverClient";
import { readJsonBodyLimited } from "@/lib/security/requestValidation";
import { logServerError } from "@/lib/security/safeLog";
import { enforceRateLimit, rateLimitResponse } from "@/lib/security/rateLimit";
import { resolveRequestLocale } from "@/lib/i18n/llmLocale";
import { getMessages } from "@/lib/i18n/messages";
import { resolveTossPaymentMethod, resolveTossPlan } from "@/lib/payment/tossCatalog";
import { tossSecretConfigured } from "@/lib/payment/tossServer";
import { getActiveMembershipRow, membershipBlocksNewPurchase } from "@/lib/payment/membershipStatus";
import { clientIpKey, normalizeGuestEmail } from "@/lib/payment/guestCheckout";

export const runtime = "nodejs";

/**
 * Creates a Toss order. The server fixes amount + currency + orderId; the
 * client only opens the Toss payment window with exactly these values, and
 * /api/payments/toss/confirm re-checks them before any money is captured
 * (Toss only charges on our server-side confirm call).
 *
 * Signed in  -> member order (entitlement granted at confirm).
 * Signed out -> guest order: needs { guestEmail } and a guest-eligible plan
 *               (KR one-time plans). Granted only after the buyer later
 *               claims it from an account that VERIFIED that email.
 *
 * USD (US membership) stays closed unless TOSS_USD_PAYMENT_METHOD is set to
 * a contract-confirmed method -- never silently switched to KRW or another
 * method.
 */
export async function POST(req: Request) {
  const locale = resolveRequestLocale({
    bodyLanguage: null,
    headerLanguage: req.headers.get("x-aha-locale") ?? req.headers.get("accept-language"),
  });
  const messages = getMessages(locale);
  try {
    const { userId } = await auth();

    const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY?.trim();
    if (!clientKey || !tossSecretConfigured()) {
      logServerError("payments/toss/orders", null, "toss_not_configured");
      return NextResponse.json({ error: messages.errors.generic, code: "toss_not_configured" }, { status: 503 });
    }

    if (!userId) {
      const limited = await enforceRateLimit("guest_checkout", clientIpKey(req));
      if (!limited.ok) return rateLimitResponse(limited);
    }

    const parsed = await readJsonBodyLimited(req);
    if (!parsed.ok) return parsed.response;
    const body = (parsed.body ?? {}) as Record<string, unknown>;
    const planId = typeof body.planId === "string" ? body.planId.trim() : "";
    const plan = resolveTossPlan(planId);
    if (!plan) {
      return NextResponse.json({ error: messages.errors.invalidRequest }, { status: 400 });
    }

    const usEnabled = process.env.NEXT_PUBLIC_US_CHECKOUT_ENABLED === "true";
    const method = resolveTossPaymentMethod(plan.currency, process.env.TOSS_USD_PAYMENT_METHOD);
    if (!method || (plan.currency === "USD" && !usEnabled)) {
      return NextResponse.json(
        { error: messages.payments.tossNotConfigured, code: "currency_not_enabled" },
        { status: 503 },
      );
    }

    let guestEmail: string | null = null;
    if (!userId) {
      if (!plan.guestCheckout) {
        return NextResponse.json({ error: messages.errors.unauthorized, code: "sign_in_required" }, { status: 401 });
      }
      guestEmail = normalizeGuestEmail(body.guestEmail);
      if (!guestEmail) {
        return NextResponse.json({ error: messages.payments.guestEmailInvalid, code: "invalid_email" }, { status: 400 });
      }
      if (body.agreedToTerms !== true) {
        return NextResponse.json({ error: messages.errors.invalidRequest, code: "consent_required" }, { status: 400 });
      }
    }

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();

    if (userId && plan.planId === "us_annual_membership") {
      const active = await getActiveMembershipRow(supabase, userId);
      if (!active.ok) {
        return NextResponse.json({ error: messages.errors.generic }, { status: 500 });
      }
      if (active.row && membershipBlocksNewPurchase(active.row)) {
        return NextResponse.json(
          { error: messages.payments.tossAlreadyMember, code: "already_member" },
          { status: 409 },
        );
      }
    }

    // 6-64 chars of [A-Za-z0-9-_=] (Toss orderId rule).
    const orderId = `aha_${randomUUID().replace(/-/g, "")}`;
    const orderName = plan.orderName[locale];

    const { error } = await supabase.from("toss_payment_orders").insert({
      order_id: orderId,
      clerk_user_id: userId ?? null,
      guest_email: guestEmail,
      plan_id: plan.planId,
      amount: plan.amount,
      currency: plan.currency,
      order_name: orderName,
    });
    if (error) {
      logServerError("payments/toss/orders", error, "insert_failed");
      return NextResponse.json({ error: messages.errors.generic }, { status: 500 });
    }

    return NextResponse.json({
      orderId,
      orderName,
      amount: plan.amount,
      currency: plan.currency,
      method,
      guest: !userId,
      // Members: stable, non-reversible per-user key. Guests: the client
      // uses TossPayments.ANONYMOUS.
      customerKey: userId ? `aha_${createHash("sha256").update(userId).digest("hex").slice(0, 40)}` : null,
      customerEmail: guestEmail,
      clientKey,
    });
  } catch (e) {
    logServerError("payments/toss/orders", e, "internal_error");
    return NextResponse.json({ error: messages.errors.generic }, { status: 500 });
  }
}
