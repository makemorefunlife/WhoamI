import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { assertOwnedReportAccess } from "@/lib/report/assertOwnedReportAccess";
import { resolveRequestLocale } from "@/lib/i18n/llmLocale";
import { getMessages } from "@/lib/i18n/messages";
import { logServerError } from "@/lib/security/safeLog";
import { buildSharedInboxItem } from "@/lib/relationship/reportShare/buildSharedInboxItem";

export const runtime = "nodejs";

const INBOX_LIMIT = 3;

/**
 * Auto-share inbox (spec section 3a / "Option A"): analyses shared WITH the
 * caller, sourced from active relationship_report_shares rows where the
 * caller's own report is the recipient. The caller already has full access
 * to the underlying relationship_reports content as a real participant
 * (see assertOwnedViewerParticipantAccess) — this endpoint only exists to
 * surface *that a share happened* without needing the token link.
 */
export async function GET(req: Request) {
  const locale = resolveRequestLocale({
    bodyLanguage: null,
    headerLanguage: req.headers.get("x-aha-locale") ?? req.headers.get("accept-language"),
  });
  const messages = getMessages(locale);
  try {
    const sp = new URL(req.url).searchParams;
    const viewerReportId = sp.get("viewerReportId")?.trim();
    if (!viewerReportId) {
      return NextResponse.json({ error: messages.errors.invalidRequest }, { status: 400 });
    }

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();

    const { userId } = await auth();
    const ownership = await assertOwnedReportAccess(supabase, viewerReportId, userId, locale);
    if (ownership.error) return ownership.error;

    const { data: shares, error } = await supabase
      .from("relationship_report_shares")
      .select("id, relationship_report_id, kind, owner_report_id, created_at")
      .eq("recipient_report_id", viewerReportId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(INBOX_LIMIT);

    if (error) {
      logServerError("relationship/share/inbox", error, "db_select_failed");
      return NextResponse.json({ error: messages.errors.generic }, { status: 500 });
    }

    const rows = shares ?? [];
    if (rows.length === 0) {
      return NextResponse.json({ items: [] });
    }

    const ownerIds = Array.from(new Set(rows.map((r) => r.owner_report_id as string)));
    const { data: owners } = await supabase
      .from("reports")
      .select("id, name")
      .in("id", ownerIds);
    const ownerNameById = new Map(
      (owners ?? []).map((o) => [o.id as string, o.name as string | null]),
    );

    const items = rows.map((row) =>
      buildSharedInboxItem(
        {
          id: row.id as string,
          relationship_report_id: row.relationship_report_id as string,
          kind: row.kind as string,
          owner_report_id: row.owner_report_id as string,
          created_at: row.created_at as string,
        },
        ownerNameById.get(row.owner_report_id as string) ?? null,
        {
          partnerFallbackLabel: messages.report.partnerFallbackLabel,
          kindLabel: (kind) => messages.report.relationshipKindNames[kind],
          sharedAnalysisTitle: messages.hub.sharedAnalysisTitle,
          sharedAnalysisSubtitle: messages.hub.sharedAnalysisSubtitle,
        },
      ),
    );

    return NextResponse.json({ items });
  } catch (e) {
    logServerError("relationship/share/inbox", e, "internal_error");
    return NextResponse.json({ error: messages.errors.generic }, { status: 500 });
  }
}
