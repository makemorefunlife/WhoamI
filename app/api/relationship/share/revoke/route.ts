import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { assertShareOwnerAccess } from "@/lib/relationship/reportShare/assertShareOwnerAccess";
import { resolveRequestLocale } from "@/lib/i18n/llmLocale";
import { getMessages } from "@/lib/i18n/messages";
import { logServerError } from "@/lib/security/safeLog";

export const runtime = "nodejs";

/** "공유 중지" / "Stop sharing" — spec section 36: immediately invalidates the link; the report itself stays private to the owner forever. */
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
    if (!relationshipReportId || !ownerReportId || !kind) {
      return NextResponse.json({ error: messages.errors.invalidRequest }, { status: 400 });
    }

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();

    const { userId } = await auth();
    const access = await assertShareOwnerAccess(
      supabase,
      userId,
      relationshipReportId,
      ownerReportId,
      locale,
    );
    if (access.error) return access.error;

    const { error } = await supabase
      .from("relationship_report_shares")
      .update({ status: "revoked", revoked_at: new Date().toISOString() })
      .eq("relationship_report_id", relationshipReportId)
      .eq("kind", kind)
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
