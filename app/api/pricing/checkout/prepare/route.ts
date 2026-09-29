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
import { resolveRegionalPlan } from "@/lib/payment/resolveRegionalPlan";
import { resolveUsPlan } from "@/lib/payment/usPricing";
import { isAdditionalRelationshipEligible } from "@/lib/credits/creditEngine";

export const runtime = "nodejs";

/**
 * Checkout-CREATION-time re-validation for the US/KR regional catalog.
 * useRegionalCheckout.ts calls this BEFORE opening Paddle.Checkout, so a
 * stale client, a tampered planId, or a client that raced past its own
 * eligibility gate can never reach a real (sandbox) checkout window.
 *
 * This is deliberately a separate, lighter check from
 * /api/pricing/checkout/complete: that route re-verifies the actual paid
 * transaction against Paddle's own API after the fact (server-side price +
 * identity match) and is the only place a grant is ever issued. This route
 * issues no grant and calls no Paddle API -- it only confirms the plan id
 * is real and, for the one plan that has an eligibility gate
 * (us_additional_relationship), that THIS signed-in user is currently
 * eligible, using the same shared-engine RPC
 * (additional_relationship_eligible) the pricing page itself polls to
 * decide whether to render the card at all. Region/locale safety is the
 * same locale-agnostic, id-namespace lookup used everywhere else in this
 * flow (resolveRegionalPlan) -- there is no separate US/KR branch here that
 * could cross the two catalogs.
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

    const planId = typeof body.planId === "string" ? body.planId.trim() : "";
    if (!planId) {
      return NextResponse.json({ error: messages.errors.invalidRequest }, { status: 400 });
    }

    const match = resolveRegionalPlan(planId);
    if (!match) {
      return NextResponse.json({ error: messages.errors.invalidRequest }, { status: 400 });
    }

    if (match.region === "us") {
      const plan = resolveUsPlan(match.planId);
      if (plan?.requiresEligibilityCheck) {
        const supabase = createRouteSupabaseClient();
        if (!supabase) return supabaseConfigErrorResponse();

        const eligible = await isAdditionalRelationshipEligible(supabase, userId);
        if (!eligible) {
          return NextResponse.json({ error: messages.errors.forbidden }, { status: 403 });
        }
      }
    }

    return NextResponse.json({ ok: true, planId: match.planId, priceId: match.priceId });
  } catch (e) {
    logServerError("pricing/checkout/prepare", e, "internal_error");
    return NextResponse.json({ error: messages.errors.generic }, { status: 500 });
  }
}
