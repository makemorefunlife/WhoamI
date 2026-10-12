import { NextResponse } from "next/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { readJsonBodyLimited } from "@/lib/security/requestValidation";
import { enforceRateLimit, rateLimitResponse } from "@/lib/security/rateLimit";
import { logServerError, logServerEvent } from "@/lib/security/safeLog";
import { clientIpKey, normalizeGuestEmail } from "@/lib/payment/guestCheckout";
import { claimTokenConfigured, claimTokenExpiry, newClaimNonce } from "@/lib/payment/guestClaimToken";
import { appBaseUrl, readGuestEmailState, sendGuestPurchaseEmail } from "@/lib/email/guestPurchaseEmail";
import { mailConfigured } from "@/lib/email/resend";
import { rpcText } from "@/lib/payment/guestAccess";
import { recoverBlockedTestOrders } from "@/lib/payment/tossConfirm";

export const runtime = "nodejs";

/**
 * Lost the email / link: re-sends the purchase guide (with a NEW link) for
 * up to 5 paid, unlinked guest orders of that email -- always TO that email,
 * so receiving it is the proof. Same answer whether or not orders exist.
 */
export async function POST(req: Request) {
  try {
    const limited = await enforceRateLimit("guest_code_send", clientIpKey(req));
    if (!limited.ok) return rateLimitResponse(limited);
    const parsed = await readJsonBodyLimited(req);
    if (!parsed.ok) return parsed.response;
    const email = normalizeGuestEmail(((parsed.body ?? {}) as Record<string, unknown>).email);
    if (!email) return NextResponse.json({ status: "invalid_email" }, { status: 400 });

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();
    // Test orders closed under the old allowlist rule: reopened only if Toss
    // still shows them paid (never cancelled ones); the guide then goes out.
    await recoverBlockedTestOrders(supabase, { guestEmail: email }).catch(() => 0);
    const { data, error: listError } = await supabase
      .from("toss_payment_orders")
      .select("order_id")
      .eq("guest_email", email)
      .eq("status", "paid")
      .is("clerk_user_id", null)
      .limit(5);
    if (listError) logServerError("guest/lookup", listError, "list_failed");
    const rows = (data ?? []) as { order_id: string }[];
    // Why nothing matched (if so): status counts of every order with this email.
    const { data: all } = await supabase
      .from("toss_payment_orders")
      .select("status, clerk_user_id")
      .eq("guest_email", email)
      .limit(50);
    const statuses: Record<string, number> = {};
    for (const o of (all ?? []) as { status: string | null; clerk_user_id: string | null }[]) {
      const k = `${o.status ?? "null"}${o.clerk_user_id ? "+linked" : ""}`;
      statuses[k] = (statuses[k] ?? 0) + 1;
    }
    // Trace (server log only; no email, no token, no secret, order id shortened):
    //   matched=<n>  config: base / linkSigning (GUEST_CLAIM_TOKEN_SECRET) / mail = ok|missing (presence only)
    logServerEvent("guest/lookup", "matched", {
      n: rows.length,
      statuses: JSON.stringify(statuses),
      base: appBaseUrl() ? "ok" : "missing",
      linkSigning: claimTokenConfigured() ? "ok" : "missing",
      mail: mailConfigured() ? "ok" : "missing",
    });
    for (const row of rows) {
      const ref = row.order_id.slice(-6);
      const { data: r, error: reissueError } = await supabase.rpc("reissue_guest_purchase_email", {
        p_order_id: row.order_id,
        p_new_nonce: newClaimNonce(),
        p_new_expires_at: claimTokenExpiry(),
        p_min_interval_seconds: 300,
      });
      if (reissueError) logServerError("guest/lookup", reissueError, "reissue_failed");
      const reissue = rpcText(r) ?? "error";
      if (reissue !== "reissued") {
        logServerEvent("guest/lookup", "order", { ref, reissue });
        continue;
      }
      const sent = await sendGuestPurchaseEmail(supabase, row.order_id);
      const state = await readGuestEmailState(supabase, row.order_id);
      // sent = Resend accepted the request (message id stored); otherwise the queue reason code.
      logServerEvent("guest/lookup", "order", { ref, reissue, send: sent, queue: state.status, reason: state.reason ?? "none" });
    }
    return NextResponse.json({ status: "ok" });
  } catch (e) {
    logServerError("guest/lookup", e, "internal_error");
    return NextResponse.json({ status: "ok" });
  }
}
