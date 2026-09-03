import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { assertOwnedReportAccess } from "@/lib/report/assertOwnedReportAccess";
import { resetPersonalConnectLink } from "@/lib/relationship/personalConnect/personalConnectLinks";
import { resolveRequestLocale } from "@/lib/i18n/llmLocale";
import { getMessages } from "@/lib/i18n/messages";
import { logServerError } from "@/lib/security/safeLog";

export const runtime = "nodejs";

/**
 * Rotate the personal connect link — spec section 3. The old token stops
 * resolving the instant this returns (nothing else references the token
 * value, so personal_connect_link_uses history is untouched — already-
 * connected people stay connected).
 */
export async function POST(req: Request) {
  const locale = resolveRequestLocale({
    bodyLanguage: null,
    headerLanguage: req.headers.get("x-aha-locale") ?? req.headers.get("accept-language"),
  });
  const messages = getMessages(locale);
  try {
    const body = await req.json().catch(() => ({}));
    const reportId = String(body?.reportId ?? "").trim();
    if (!reportId) {
      return NextResponse.json({ error: messages.errors.reportIdRequired }, { status: 400 });
    }

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();

    const { userId } = await auth();
    const access = await assertOwnedReportAccess(supabase, reportId, userId, locale);
    if (access.error) return access.error;

    const { token } = await resetPersonalConnectLink(supabase, reportId);
    return NextResponse.json({ token });
  } catch (e) {
    logServerError("connect/reset", e, "internal_error");
    return NextResponse.json({ error: messages.errors.generic }, { status: 500 });
  }
}
