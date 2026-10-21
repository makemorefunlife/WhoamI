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
import { isUsFreeBetaPlanId, usFreeBetaEnabled } from "@/lib/payment/usFreeBeta";

export const runtime = "nodejs";

/**
 * Temporary stand-in for the disabled US/English checkout (see
 * lib/payment/usFreeBeta.ts). A signed-in en-US buyer who clicks the
 * existing Purchase button for Personal or Relationship Premium gets the
 * credit granted here immediately -- no payment window.
 *
 * The actual trust boundary is process_us_free_beta_grant: it is the only
 * place a grant is issued, it is idempotent per requestId (a fresh id the
 * client generates for each Purchase click, guarding against a
 * retried/duplicated request for that same click), and it grants with
 * source='promo' scoped to en-US -- never counted as purchase revenue and
 * never usable from the KR site. This route only authenticates the caller
 * and validates the plan id before calling it.
 */
export async function POST(req: Request) {
  if (!usFreeBetaEnabled()) {
    return NextResponse.json({ error: "checkout_unavailable", code: "us_free_beta_disabled" }, { status: 410 });
  }
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
    const requestId = typeof body.requestId === "string" ? body.requestId.trim() : "";
    if (!planId || !isUsFreeBetaPlanId(planId) || !requestId) {
      return NextResponse.json({ error: messages.errors.invalidRequest }, { status: 400 });
    }

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();

    const { data, error } = await supabase.rpc("process_us_free_beta_grant", {
      p_clerk_user_id: userId,
      p_plan_id: planId,
      p_request_id: requestId,
    });
    if (error) {
      logServerError("payments/us-free-beta/grant", error, "grant_failed");
      return NextResponse.json({ error: messages.errors.generic }, { status: 500 });
    }

    const row = (Array.isArray(data) ? data[0] : data) as
      | { ok: boolean; already_processed: boolean }
      | undefined;
    if (!row?.ok) {
      return NextResponse.json({ error: messages.errors.generic }, { status: 500 });
    }

    return NextResponse.json({ ok: true, planId, alreadyProcessed: row.already_processed === true });
  } catch (e) {
    logServerError("payments/us-free-beta/grant", e, "internal_error");
    return NextResponse.json({ error: messages.errors.generic }, { status: 500 });
  }
}
