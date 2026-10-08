import { NextResponse } from "next/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { readJsonBodyLimited } from "@/lib/security/requestValidation";
import { enforceRateLimit, rateLimitResponse } from "@/lib/security/rateLimit";
import { logServerError } from "@/lib/security/safeLog";
import { clientIpKey } from "@/lib/payment/guestCheckout";
import {
  CODE_MAX_ATTEMPTS,
  GUEST_SESSION_COOKIE,
  hashVerificationCode,
  openGuestSession,
  rpcText,
  sessionCookieOptions,
} from "@/lib/payment/guestAccess";
import { ORDER_ID_RE } from "@/lib/payment/guestRoute";

export const runtime = "nodejs";

/** Checks the emailed code; on success opens a 7-day guest access session (httpOnly cookie). */
export async function POST(req: Request) {
  try {
    const limited = await enforceRateLimit("guest_code_verify", clientIpKey(req));
    if (!limited.ok) return rateLimitResponse(limited);
    const parsed = await readJsonBodyLimited(req);
    if (!parsed.ok) return parsed.response;
    const body = (parsed.body ?? {}) as Record<string, unknown>;
    const orderId = String(body.orderId ?? "").trim();
    const code = String(body.code ?? "").replace(/\s/g, "");
    if (!ORDER_ID_RE.test(orderId) || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ status: "invalid_request" }, { status: 400 });
    }
    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();
    const hash = hashVerificationCode(orderId, code);
    if (!hash) return NextResponse.json({ status: "error" }, { status: 500 });

    const { data, error } = await supabase.rpc("verify_guest_purchase_code", {
      p_order_id: orderId,
      p_code_hash: hash,
      p_max_attempts: CODE_MAX_ATTEMPTS,
    });
    if (error) {
      logServerError("guest/access/verify", error, "verify_failed");
      return NextResponse.json({ status: "error" }, { status: 500 });
    }
    const r = rpcText(data);
    if (r !== "ok") {
      const status = r === "mismatch" ? 400 : r === "locked" ? 429 : 409;
      return NextResponse.json({ status: r ?? "error" }, { status });
    }
    const token = await openGuestSession(supabase, orderId, "code");
    if (!token) return NextResponse.json({ status: "not_available" }, { status: 409 });
    const res = NextResponse.json({ status: "verified" }, { headers: { "Cache-Control": "no-store" } });
    res.cookies.set(GUEST_SESSION_COOKIE, token, sessionCookieOptions());
    return res;
  } catch (e) {
    logServerError("guest/access/verify", e, "internal_error");
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
