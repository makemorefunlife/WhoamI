import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { assertPremiumReportOwner } from "@/lib/relationship/reportShare/assertPremiumReportOwner";
import { resolveRequestLocale } from "@/lib/i18n/llmLocale";
import { getMessages } from "@/lib/i18n/messages";
import { logServerError } from "@/lib/security/safeLog";

export const runtime = "nodejs";

/**
 * Report-owner-facing share state for one (relationshipReportId, kind) —
 * spec section 34: PRIVATE (no row) until the owner explicitly shares.
 */
export async function GET(req: Request) {
  const locale = resolveRequestLocale({
    bodyLanguage: null,
    headerLanguage: req.headers.get("x-aha-locale") ?? req.headers.get("accept-language"),
  });
  const messages = getMessages(locale);
  try {
    const sp = new URL(req.url).searchParams;
    const relationshipReportId = sp.get("relationshipReportId")?.trim();
    const ownerReportId = sp.get("ownerReportId")?.trim();
    const kind = sp.get("kind")?.trim();
    const premiumReportId = sp.get("premiumReportId")?.trim() || null;
    if (!relationshipReportId || !ownerReportId || !kind) {
      return NextResponse.json({ error: messages.errors.invalidRequest }, { status: 400 });
    }

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();

    const { userId } = await auth();
    const access = await assertPremiumReportOwner(supabase, {
      userId,
      relationshipReportId,
      ownerReportId,
      kind,
      locale: sp.get("locale") ?? locale,
      premiumReportId,
    });
    if (access.error) return access.error;

    const { data, error } = await supabase
      .from("relationship_report_shares")
      .select("share_token, status")
      .eq("premium_report_id", access.report.id)
      .eq("status", "active")
      .maybeSingle();

    if (error) {
      logServerError("relationship/share/status", error, "db_select_failed");
      return NextResponse.json({ error: messages.errors.generic }, { status: 500 });
    }

    return NextResponse.json({
      status: data ? "shared" : "private",
      shareToken: data?.share_token ?? null,
    });
  } catch (e) {
    logServerError("relationship/share/status", e, "internal_error");
    return NextResponse.json({ error: messages.errors.generic }, { status: 500 });
  }
}
