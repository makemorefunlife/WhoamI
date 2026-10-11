import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { assertPremiumReportOwner } from "@/lib/relationship/reportShare/assertPremiumReportOwner";
import { resolveRequestLocale } from "@/lib/i18n/llmLocale";
import { getMessages } from "@/lib/i18n/messages";
import { logServerError } from "@/lib/security/safeLog";

export const runtime = "nodejs";

/**
 * "공유 중지" / "Stop sharing" — spec section 36. Creator only. From now on the
 * other participant can no longer open this report (link, hub, direct URL,
 * API). It does not take back what they already read.
 */
export async function POST(req: Request) {
  const locale = resolveRequestLocale({
    bodyLanguage: null,
    headerLanguage: req.headers.get("x-aha-locale") ?? req.headers.get("accept-language"),
  });
  const messages = getMessages(locale);
  try {
    const body = await req.json().catch(() => ({}));
    const relationshipReportId = String(body?.relationshipReportId ?? "").trim();
    const ownerReportId = String(body?.ownerReportId ?? "").trim();
    const kind = String(body?.kind ?? "").trim();
    const premiumReportId = String(body?.premiumReportId ?? "").trim() || null;
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
      locale: body?.locale ?? locale,
      premiumReportId,
    });
    if (access.error) return access.error;

    const { error } = await supabase
      .from("relationship_report_shares")
      .update({ status: "revoked", revoked_at: new Date().toISOString() })
      .eq("premium_report_id", access.report.id)
      .eq("status", "active");

    if (error) {
      logServerError("relationship/share/revoke", error, "db_update_failed");
      return NextResponse.json({ error: messages.errors.generic }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    logServerError("relationship/share/revoke", e, "internal_error");
    return NextResponse.json({ error: messages.errors.generic }, { status: 500 });
  }
}
