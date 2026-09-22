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
import { resolveRegionalPlan, regionalPlanHasPriceId } from "@/lib/payment/resolveRegionalPlan";
import { grantUsPurchase } from "@/lib/payment/grantUsPurchase";
import { grantKrPurchase } from "@/lib/payment/grantKrPurchase";

export const runtime = "nodejs";

/**
 * US + KR regional-catalog Paddle sandbox purchase completion. Sibling to
 * /api/beta/checkout/complete, same trust model: the client only ever sends
 * a transaction_id, this route re-fetches it from Paddle's own Sandbox API
 * server-side and verifies status + price + owner before granting anything.
 *
 * Which grant path runs (grantUsPurchase vs grantKrPurchase) is decided
 * SOLELY by resolveRegionalPlan(planId) -- i.e. by which catalog's
 * namespace the plan id itself belongs to, never by a locale header or any
 * other client-supplied field. A US plan id can only ever reach
 * grantUsPurchase; a KR plan id can only ever reach grantKrPurchase. There
 * is no shared branch where the two could cross.
 *
 * KNOWN GAP: this only ever handles a CLIENT-INITIATED checkout completion
 * -- i.e. the transaction the buyer's own browser just opened and finished.
 * An Annual membership's automatic yearly renewal charge happens on
 * Paddle's own billing schedule with no browser involved, so it can never
 * reach this route. process_us_annual_renewal (see
 * supabase/migrations/20260922040300_us_membership_functions.sql) and
 * grantUsAnnualRenewal (lib/payment/grantUsPurchase.ts) are ready for it,
 * but nothing calls them yet -- that needs an actual Paddle webhook
 * endpoint (signature-verified), which this codebase does not have at all
 * today (the existing Beta flow is 100% client-driven, by design -- see
 * app/api/beta/checkout/complete/route.ts's own doc comment). Wiring that
 * webhook is out of scope for this price-id pass.
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

    const match = resolveRegionalPlan(planId);
    if (!match) {
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

    // Same identity check as the Beta route -- custom_data is opaque
    // client-set data, never trusted alone, only as a co-signal alongside
    // the price-id match below.
    const customData = txn.custom_data ?? {};
    if (customData.clerkUserId !== userId || customData.planId !== planId) {
      logServerError("pricing/checkout/complete", null, "transaction_identity_mismatch");
      return NextResponse.json({ error: messages.errors.invalidRequest }, { status: 403 });
    }

    const priceIds = transactionPriceIds(txn);
    const matchedPriceId = priceIds.find((id) => regionalPlanHasPriceId(match, id));
    if (!matchedPriceId) {
      logServerError("pricing/checkout/complete", null, "transaction_price_mismatch");
      return NextResponse.json({ error: messages.errors.invalidRequest }, { status: 409 });
    }

    if (match.region === "us") {
      if (match.planId === "us_annual_membership" && !txn.subscription_id) {
        logServerError("pricing/checkout/complete", null, "annual_missing_subscription_id");
        return NextResponse.json({ error: messages.errors.generic }, { status: 502 });
      }

      const result = await grantUsPurchase(supabase, {
        clerkUserId: userId,
        planId,
        paddleTransactionId: transactionId,
        paddlePriceId: matchedPriceId,
        currencyCode: txn.currency_code,
        paddleSubscriptionId: txn.subscription_id ?? undefined,
      });

      if (!result.ok) {
        return NextResponse.json({ error: messages.errors.generic }, { status: 500 });
      }
      return NextResponse.json({ ok: true, planId, alreadyProcessed: result.alreadyProcessed });
    }

    const result = await grantKrPurchase(supabase, {
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
    logServerError("pricing/checkout/complete", e, "internal_error");
    return NextResponse.json({ error: messages.errors.generic }, { status: 500 });
  }
}
