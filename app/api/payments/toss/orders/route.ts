import { createHash, randomUUID } from "node:crypto";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  createRouteSupabaseClient,
  supabaseConfigErrorResponse,
} from "@/lib/supabase/serverClient";
import { readJsonBodyLimited } from "@/lib/security/requestValidation";
import { logServerError } from "@/lib/security/safeLog";
import { resolveRequestLocale } from "@/lib/i18n/llmLocale";
import { getMessages } from "@/lib/i18n/messages";
import { resolveTossPaymentMethod, resolveTossPlan } from "@/lib/payment/tossCatalog";
import { tossSecretConfigured } from "@/lib/payment/tossServer";
import { getActiveMembershipRow, membershipBlocksNewPurchase } from "@/lib/payment/membershipStatus";

export const runtime = "nodejs";

/**
 * Creates a Toss order for a Toss-sold plan (today: the 12-Month
 * Membership). The server fixes amount + currency + orderId; the client
 * only opens the Toss payment window with exactly these values, and
 * /api/payments/toss/confirm re-checks them against this row before any
 * money is captured (Toss only charges on our server-side confirm call).
 *
 * Sign-in is required: the purchase becomes an entitlement on a Clerk
 * account. (Guest checkout is not supported -- see the 2026-10-07 decision
 * doc.)
 */
export async function POST(req: Request) {
  const locale = resolveRequestLocale({
    bodyLanguage: null,
    headerLanguage: req.headers.get("x-aha-locale") ?? req.headers.get("accept-language"),
  });
  const messages = getMessages(locale);
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: messages.errors.unauthorized }, { status: 401 });
    }

    const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY?.trim();
    if (!clientKey || !tossSecretConfigured()) {
      logServerError("payments/toss/orders", null, "toss_not_configured");
      return NextResponse.json({ error: messages.errors.generic, code: "toss_not_configured" }, { status: 503 });
    }

    const parsed = await readJsonBodyLimited(req);
    if (!parsed.ok) return parsed.response;
    const body = (parsed.body ?? {}) as Record<string, unknown>;
    const planId = typeof body.planId === "string" ? body.planId.trim() : "";
    const plan = resolveTossPlan(planId);
    if (!plan) {
      return NextResponse.json({ error: messages.errors.invalidRequest }, { status: 400 });
    }

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();

    if (plan.planId === "us_annual_membership") {
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
      clerk_user_id: userId,
      plan_id: plan.planId,
      amount: plan.amount,
      currency: plan.currency,
      order_name: orderName,
    });
    if (error) {
      logServerError("payments/toss/orders", error, "insert_failed");
      return NextResponse.json({ error: messages.errors.generic }, { status: 500 });
    }

    // Stable, non-reversible per-user key (Toss: 2-50 chars, no raw user id).
    const customerKey = `aha_${createHash("sha256").update(userId).digest("hex").slice(0, 40)}`;

    return NextResponse.json({
      orderId,
      orderName,
      amount: plan.amount,
      currency: plan.currency,
      method: resolveTossPaymentMethod(process.env.TOSS_US_PAYMENT_METHOD),
      customerKey,
      clientKey,
    });
  } catch (e) {
    logServerError("payments/toss/orders", e, "internal_error");
    return NextResponse.json({ error: messages.errors.generic }, { status: 500 });
  }
}
