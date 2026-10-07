import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  createRouteSupabaseClient,
  supabaseConfigErrorResponse,
} from "@/lib/supabase/serverClient";
import { readJsonBodyLimited } from "@/lib/security/requestValidation";
import { logServerError } from "@/lib/security/safeLog";
import { completeTossOrder } from "@/lib/payment/tossConfirm";

export const runtime = "nodejs";

/**
 * Called by /checkout/toss/success with the query params Toss appended to
 * successUrl (paymentKey, orderId, amount). The client values are only
 * lookup keys -- every check (owner, amount, currency, eligibility) is done
 * against the server-created order row and Toss's own response. Safe to
 * call repeatedly with the same params (see completeTossOrder).
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ status: "unauthorized" }, { status: 401 });
    }

    const parsed = await readJsonBodyLimited(req);
    if (!parsed.ok) return parsed.response;
    const body = (parsed.body ?? {}) as Record<string, unknown>;
    const paymentKey = typeof body.paymentKey === "string" ? body.paymentKey.trim() : "";
    const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
    const amount = Number(body.amount);
    if (!paymentKey || paymentKey.length > 200 || !/^aha_[a-f0-9]{32}$/.test(orderId) || !Number.isFinite(amount)) {
      return NextResponse.json({ status: "invalid_request" }, { status: 400 });
    }

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();

    const outcome = await completeTossOrder(supabase, { clerkUserId: userId, orderId, paymentKey, amount });

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
