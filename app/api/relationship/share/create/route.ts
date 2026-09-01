import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { assertShareOwnerAccess } from "@/lib/relationship/reportShare/assertShareOwnerAccess";
import { generateShareToken } from "@/lib/relationship/reportShare/generateShareToken";
import { resolveRequestLocale } from "@/lib/i18n/llmLocale";
import { getMessages } from "@/lib/i18n/messages";
import { logServerError } from "@/lib/security/safeLog";

export const runtime = "nodejs";

/**
 * Explicit share consent, spec section 33-34. Only ever called from the
 * report-owner's own "Share with [name]" click — never automatic, never on
 * report generation. Creates one active share row (idempotent per
 * relationship_report_id+kind: re-sharing after a revoke gets a fresh
 * token).
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

    // Revoke any existing active row for this surface, then insert a fresh one —
    // re-sharing always issues a new token rather than resurrecting an old link.
    await supabase
      .from("relationship_report_shares")
      .update({ status: "revoked", revoked_at: new Date().toISOString() })
      .eq("relationship_report_id", relationshipReportId)
      .eq("kind", kind)
      .eq("status", "active");

    const shareToken = generateShareToken();
    const { error } = await supabase.from("relationship_report_shares").insert({
      relationship_report_id: relationshipReportId,
      kind,
      owner_report_id: ownerReportId,
      recipient_report_id: access.recipientReportId,
      share_token: shareToken,
      status: "active",
    });

    if (error) {
      logServerError("relationship/share/create", error, "db_insert_failed");
      return NextResponse.json(
        { error: messages.relationshipMap.reportShare.createFailed },
        { status: 500 },
      );
    }

    return NextResponse.json({ shareToken });
  } catch (e) {
    logServerError("relationship/share/create", e, "internal_error");
    return NextResponse.json(
      { error: messages.relationshipMap.reportShare.createFailed },
      { status: 500 },
    );
  }
}
