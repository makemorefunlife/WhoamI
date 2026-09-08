import { NextResponse } from "next/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { resolveConnectLinkOwnerName } from "@/lib/relationship/personalConnect/personalConnectLinks";
import { resolveRequestLocale } from "@/lib/i18n/llmLocale";
import { getMessages } from "@/lib/i18n/messages";
import { logServerError } from "@/lib/security/safeLog";

export const runtime = "nodejs";

/**
 * Public, unauthenticated token resolver for the /connect/[token] landing
 * page — spec section 6. Deliberately returns only a display name, never
 * report_id or any other internal identifier, and never distinguishes
 * "never existed" from "reset" for an invalid token (both just come back
 * `valid: false`), so this can't be used to probe which tokens are real.
 */
export async function GET(req: Request) {
  const locale = resolveRequestLocale({
    bodyLanguage: null,
    headerLanguage: req.headers.get("x-aha-locale") ?? req.headers.get("accept-language"),
  });
  const messages = getMessages(locale);
  try {
    const sp = new URL(req.url).searchParams;
    const token = sp.get("token")?.trim();
    if (!token) {
      return NextResponse.json({ valid: false });
    }

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();

    const ownerName = await resolveConnectLinkOwnerName(supabase, token);
    if (ownerName === undefined) {
      return NextResponse.json({ valid: false });
    }

    return NextResponse.json({ valid: true, ownerName: ownerName ?? messages.connect.someoneFallbackName });
  } catch (e) {
    logServerError("connect/resolve", e, "internal_error");
    return NextResponse.json({ valid: false });
  }
}
