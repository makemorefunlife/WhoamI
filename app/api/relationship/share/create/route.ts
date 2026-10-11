import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { assertPremiumReportOwner } from "@/lib/relationship/reportShare/assertPremiumReportOwner";
import { generateShareToken } from "@/lib/relationship/reportShare/generateShareToken";
import { resolveRequestLocale } from "@/lib/i18n/llmLocale";
import { getMessages } from "@/lib/i18n/messages";
import { logServerError } from "@/lib/security/safeLog";

export const runtime = "nodejs";

/**
 * Explicit share consent, spec section 33-34. Only ever called from the
 * report CREATOR's own "Share with [name]" click — never automatic, never on
 * report generation. Shares ONE report (relationship_premium_reports.id):
 * one active row per report; re-sharing after a revoke gets a fresh token.
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
    const reportId = access.report.id;

    // Revoke any existing active row for this surface, then insert a fresh one —
    // re-sharing always issues a new token rather than resurrecting an old link.
    await supabase
      .from("relationship_report_shares")
      .update({ status: "revoked", revoked_at: new Date().toISOString() })
      .eq("premium_report_id", reportId)
      .eq("status", "active");

    const shareToken = generateShareToken();
    const { error } = await supabase.from("relationship_report_shares").insert({
      relationship_report_id: relationshipReportId,
      kind: access.report.kind,
      premium_report_id: reportId,
      owner_report_id: ownerReportId,
      recipient_report_id: access.recipientReportId,
      share_token: shareToken,
      status: "active",
    });

    if (error) {
      // 23505 = unique_violation on the (premium_report_id)
      // WHERE status='active' partial index — a second concurrent/double
      // -click request lost the race after both requests revoked the old
      // row and both tried to insert a fresh active one. That's not a real
      // failure: the other request's row IS the current active share, so
      // reuse it instead of surfacing a 500 for what the user experiences
      // as one click.
      if (error.code === "23505") {
        const { data: existing, error: reselectErr } = await supabase
          .from("relationship_report_shares")
          .select("share_token")
          .eq("premium_report_id", reportId)
          .eq("status", "active")
          .maybeSingle();
        if (!reselectErr && existing?.share_token) {
          return NextResponse.json({ shareToken: existing.share_token });
        }
      }
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
