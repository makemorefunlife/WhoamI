import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  createRouteSupabaseClient,
  supabaseConfigErrorResponse,
} from "@/lib/supabase/serverClient";
import { readJsonBodyLimited } from "@/lib/security/requestValidation";
import { logServerError } from "@/lib/security/safeLog";
import { completeTossOrder } from "@/lib/payment/tossConfirm";
import { enforceRateLimit, rateLimitResponse } from "@/lib/security/rateLimit";
import { clientIpKey, maskEmail } from "@/lib/payment/guestCheckout";

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

    const outcome = await completeTossOrder(supabase, {
      clerkUserId: guest ? null : (userId as string),
      orderId,
      paymentKey,
      amount,
    });

    if (outcome.status === "awaiting_claim") {
      // Show the buyer which address to verify (masked) -- never the full email.
      const { data } = await supabase
        .from("toss_payment_orders")
        .select("guest_email")
        .eq("order_id", orderId)
        .maybeSingle();
      const email = (data?.guest_email as string | null) ?? null;
      return NextResponse.json({ ...outcome, maskedEmail: email ? maskEmail(email) : null }, { status: 200 });
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
