import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { resolveRequestLocale } from "@/lib/i18n/llmLocale";
import { getMessages } from "@/lib/i18n/messages";
import { logServerError } from "@/lib/security/safeLog";
import { resolveShareAccess } from "@/lib/relationship/reportShare/resolveShareAccess";

export const runtime = "nodejs";

/**
 * Recipient-facing share resolver, spec section 35. Requires the caller to
 * be signed in AND to own the exact report the owner shared with — a valid
 * token alone is never enough. Returns the target to open (the recipient's
 * own existing analysis view of this relationship_report), never the raw
 * report payload — the existing participant-scoped /api/relationship/detail
 * still governs what they actually see.
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
      return NextResponse.json({ error: messages.errors.invalidRequest }, { status: 400 });
    }

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();

    const { userId } = await auth();

    const { data: share, error } = await supabase
      .from("relationship_report_shares")
      .select("relationship_report_id, kind, recipient_report_id, status")
      .eq("share_token", token)
      .maybeSingle();

    if (error) {
      logServerError("relationship/share/view", error, "db_select_failed");
      return NextResponse.json({ error: messages.errors.generic }, { status: 500 });
    }

    let recipientClerkUserId: string | null = null;
    if (share) {
      const { data: recipientReport } = await supabase
        .from("reports")
        .select("id, clerk_user_id")
        .eq("id", share.recipient_report_id)
        .maybeSingle();
      recipientClerkUserId = recipientReport?.clerk_user_id ?? null;
    }

    const decision = resolveShareAccess(share, userId, recipientClerkUserId);

    if (!decision.allowed) {
      if (decision.reason === "auth_required") {
        return NextResponse.json(
          { error: messages.relationshipMap.reportShare.authRequiredBody, authRequired: true },
          { status: 401 },
        );
      }
      if (decision.reason === "not_found" || decision.reason === "revoked") {
        return NextResponse.json(
          { error: messages.relationshipMap.reportShare.accessDeniedTitle },
          { status: 404 },
        );
      }
      return NextResponse.json(
        {
          error: messages.relationshipMap.reportShare.accessDeniedTitle,
          detail: messages.relationshipMap.reportShare.accessDeniedBody,
        },
        { status: 403 },
      );
    }

    return NextResponse.json({
      relationshipReportId: share!.relationship_report_id,
      kind: share!.kind,
      viewerReportId: share!.recipient_report_id,
    });
  } catch (e) {
    logServerError("relationship/share/view", e, "internal_error");
    return NextResponse.json({ error: messages.errors.generic }, { status: 500 });
  }
}
