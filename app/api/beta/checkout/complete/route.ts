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
import {
  fetchPaddleSandboxTransaction,
  transactionPriceIds,
} from "@/lib/payment/paddleSandboxClient";
import { resolveBetaPlan, planHasPriceId } from "@/lib/payment/betaPaddlePricing";
import { grantBetaPurchase } from "@/lib/payment/grantBetaPurchase";

export const runtime = "nodejs";

/**
 * 1-week Beta Release Candidate — Paddle sandbox purchase completion.
 *
 * Deliberately does NOT trust the client's own "checkout completed" event.
 * The client only ever sends a transaction_id here; this route re-fetches
 * that transaction from Paddle's own Sandbox API (server-side secret key,
 * never exposed to the client) and verifies status + price + who it
 * belongs to before granting anything. No webhook — Paddle.js's checkout
 * success callback is what triggers the client to call this route, but the
 * actual trust boundary is this server-side re-fetch, not the callback
 * itself.
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

    const parsed = await readJsonBodyLimited(req);
    if (!parsed.ok) return parsed.response;
    const body = (parsed.body ?? {}) as Record<string, unknown>;

    const transactionId =
      typeof body.transactionId === "string" ? body.transactionId.trim() : "";
    const planId = typeof body.planId === "string" ? body.planId.trim() : "";
    if (!transactionId || !planId) {
      return NextResponse.json({ error: messages.errors.invalidRequest }, { status: 400 });
    }

    const plan = resolveBetaPlan(planId);
    if (!plan) {
      return NextResponse.json({ error: messages.errors.invalidRequest }, { status: 400 });
    }

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();

    const txn = await fetchPaddleSandboxTransaction(transactionId);
    if (!txn) {
      return NextResponse.json({ error: messages.errors.generic }, { status: 502 });
    }

    if (txn.status !== "completed") {
      return NextResponse.json({ error: messages.errors.invalidRequest }, { status: 409 });
    }

    // The transaction must actually belong to THIS Clerk session — custom_data
    // is set at Paddle.Checkout.open() time on the client (see
    // useBetaCheckout.ts) and is opaque to the buyer, but never trust it
    // alone: it's still just data on a request the client controls the
    // shape of. Combined with the price-id check below, this is "the
    // transaction Paddle actually recorded was for this exact plan, opened
    // by this exact signed-in user" — not just "some transaction id".
    const customData = txn.custom_data ?? {};
    if (customData.clerkUserId !== userId || customData.planId !== planId) {
      logServerError("beta/checkout/complete", null, "transaction_identity_mismatch");
      return NextResponse.json({ error: messages.errors.invalidRequest }, { status: 403 });
    }

    const priceIds = transactionPriceIds(txn);
    const matchedPriceId = priceIds.find((id) => planHasPriceId(plan, id));
    if (!matchedPriceId) {
      logServerError("beta/checkout/complete", null, "transaction_price_mismatch");
      return NextResponse.json({ error: messages.errors.invalidRequest }, { status: 409 });
    }

    const result = await grantBetaPurchase(supabase, {
      clerkUserId: userId,
      planId,
      paddleTransactionId: transactionId,
      paddlePriceId: matchedPriceId,
      currencyCode: txn.currency_code,
    });

    if (!result.ok) {
      return NextResponse.json({ error: messages.errors.generic }, { status: 500 });
    }

    return NextResponse.json({ ok: true, planId, alreadyProcessed: result.alreadyProcessed });
  } catch (e) {
    logServerError("beta/checkout/complete", e, "internal_error");
    return NextResponse.json({ error: messages.errors.generic }, { status: 500 });
  }
}
