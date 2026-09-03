import { NextResponse } from "next/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { partnerNameFromReportRow } from "@/lib/relationship/resolvePartnerDisplayName";
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

    const { data: link, error } = await supabase
      .from("personal_connect_links")
      .select("report_id")
      .eq("token", token)
      .maybeSingle();

    if (error) {
      logServerError("connect/resolve", error, "db_select_failed");
      return NextResponse.json({ valid: false });
    }
    if (!link) {
      return NextResponse.json({ valid: false });
    }

    const { data: report } = await supabase
      .from("reports")
      .select("name")
      .eq("id", link.report_id)
      .maybeSingle();

    const ownerName = partnerNameFromReportRow(report?.name) ?? messages.connect.someoneFallbackName;
    return NextResponse.json({ valid: true, ownerName });
  } catch (e) {
    logServerError("connect/resolve", e, "internal_error");
    return NextResponse.json({ valid: false });
  }
}
