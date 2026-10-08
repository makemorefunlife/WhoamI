import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { readJsonBodyLimited } from "@/lib/security/requestValidation";
import { enforceRateLimit, rateLimitResponse } from "@/lib/security/rateLimit";
import { logServerError } from "@/lib/security/safeLog";
import { clientIpKey } from "@/lib/payment/guestCheckout";
import {
  CODE_MAX_PER_HOUR,
  CODE_TTL_S,
  hashVerificationCode,
  newVerificationCode,
  rpcText,
} from "@/lib/payment/guestAccess";
import { sendGuestCodeEmail } from "@/lib/email/guestCodeEmail";
import { ORDER_ID_RE } from "@/lib/payment/guestRoute";

export const runtime = "nodejs";

/**
 * Sends a 6-digit purchase-verification code to the ORDER email (never to an
 * address from the request). Limits: per IP (rate limiter) and per order
 * (CODE_MAX_PER_HOUR in SQL). A new code replaces any earlier unused one.
 */
export async function POST(req: Request) {
  try {
    const limited = await enforceRateLimit("guest_code_send", clientIpKey(req));
    if (!limited.ok) return rateLimitResponse(limited);
    const parsed = await readJsonBodyLimited(req);
    if (!parsed.ok) return parsed.response;
    const orderId = String(((parsed.body ?? {}) as Record<string, unknown>).orderId ?? "").trim();
    if (!ORDER_ID_RE.test(orderId)) return NextResponse.json({ status: "invalid_request" }, { status: 400 });

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();
    const { data: o } = await supabase
      .from("toss_payment_orders")
      .select("guest_email, locale, is_test")
      .eq("order_id", orderId)
      .maybeSingle();
    const order = o as { guest_email: string | null; locale: string | null; is_test: boolean | null } | null;
    if (!order?.guest_email) return NextResponse.json({ status: "not_available" }, { status: 404 });

    const code = newVerificationCode();
    const hash = hashVerificationCode(orderId, code);
    if (!hash) {
      logServerError("guest/access/code", null, "secret_missing");
      return NextResponse.json({ status: "error" }, { status: 500 });
    }
    const { data, error } = await supabase.rpc("issue_guest_purchase_code", {
      p_order_id: orderId,
      p_code_hash: hash,
      p_ttl_seconds: CODE_TTL_S,
      p_max_per_hour: CODE_MAX_PER_HOUR,
    });
    if (error) {
      logServerError("guest/access/code", error, "issue_failed");
      return NextResponse.json({ status: "error" }, { status: 500 });
    }
    const r = rpcText(data);
    if (r === "too_many") return NextResponse.json({ status: "too_many" }, { status: 429 });
    if (r !== "issued") return NextResponse.json({ status: "not_available" }, { status: 409 });

    const sent = await sendGuestCodeEmail({
      to: order.guest_email,
      locale: order.locale === "en-US" ? "en-US" : "ko-KR",
      code,
      isTest: order.is_test === true,
      idempotencyKey: `guest-code-${orderId}-${randomUUID()}`,
    });
    if (sent.kind !== "sent") {
      logServerError("guest/access/code", null, `send_${sent.kind}`);
      return NextResponse.json({ status: "send_failed" }, { status: 502 });
    }
    return NextResponse.json({ status: "sent" }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    logServerError("guest/access/code", e, "internal_error");
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
