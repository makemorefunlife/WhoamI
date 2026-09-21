import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { assertOwnedReportAccess } from "@/lib/report/assertOwnedReportAccess";
import { resolveRequestLocale } from "@/lib/i18n/llmLocale";
import { getMessages } from "@/lib/i18n/messages";
import { logServerError } from "@/lib/security/safeLog";

export const runtime = "nodejs";

/**
 * Relationship Discovery Flow V1 -- mark one of the viewer's own
 * connections as seen (relationship_map_memberships.discovered_seen_at =
 * now()). Same body/pattern as /api/connect/respond: `reportId` is the
 * viewer's own report (ownership-checked), `relationshipReportId` picks
 * the row.
 *
 * Idempotent and one-directional by construction: this only ever sets
 * discovered_seen_at to a fresh timestamp, never clears it back to NULL,
 * so calling this twice (or racing two tabs) is harmless -- a
 * discovery, once seen, cannot un-see itself.
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
    const relationshipReportId = String(body?.relationshipReportId ?? "").trim();
    if (!reportId || !relationshipReportId) {
      return NextResponse.json({ error: messages.errors.invalidRequest }, { status: 400 });
    }

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();

    const { userId } = await auth();
    const access = await assertOwnedReportAccess(supabase, reportId, userId, locale);
    if (access.error) return access.error;

    const { error } = await supabase
      .from("relationship_map_memberships")
      .update({ discovered_seen_at: new Date().toISOString() })
      .eq("relationship_report_id", relationshipReportId)
      .eq("viewer_report_id", reportId)
      .is("discovered_seen_at", null);

    if (error) {
      logServerError("connect/discoveries.seen", error, "db_update_failed");
      return NextResponse.json({ error: messages.errors.generic }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    logServerError("connect/discoveries.seen", e, "internal_error");
    return NextResponse.json({ error: messages.errors.generic }, { status: 500 });
  }
}
