import { NextResponse } from "next/server";
import { createRouteSupabaseClient } from "@/lib/supabase/serverClient";
import { isAcceptableInviteToken } from "@/lib/security/inviteToken";
import { logServerError } from "@/lib/security/safeLog";
import { resolvePartnerDisplayName } from "@/lib/relationship/resolvePartnerDisplayName";
import { resolveClerkDisplayNamesByUserId } from "@/lib/relationship/resolveClerkDisplayNames";
import { resolveRequestLocale } from "@/lib/i18n/llmLocale";
import { getMessages } from "@/lib/i18n/messages";

export const runtime = "nodejs";

/**
 * Public route to resolve minimal invite info (inviter display name only).
 * Returns only { inviterName: string | null }.
 * Absolutely no PII (email, clerk userId, birth details, report ID, token hash) returned.
 */
export async function GET(req: Request) {
  const locale = resolveRequestLocale({
    bodyLanguage: null,
    headerLanguage:
      req.headers.get("x-aha-locale") ?? req.headers.get("accept-language"),
  });
  const messages = getMessages(locale);

  try {
    const url = new URL(req.url);
    const token =
      url.searchParams.get("token")?.trim() ||
      url.searchParams.get("invite")?.trim() ||
      "";

    if (!token || !isAcceptableInviteToken(token)) {
      return NextResponse.json({ inviterName: null });
    }

    const supabase = createRouteSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ inviterName: null });
    }

    const { data: invite, error: inviteErr } = await supabase
      .from("invites")
      .select("from_report_id")
      .eq("invite_token", token)
      .maybeSingle();

    if (inviteErr || !invite || !invite.from_report_id) {
      if (inviteErr) logServerError("invite/info.invite", inviteErr);
      return NextResponse.json({ inviterName: null });
    }

    const { data: report, error: reportErr } = await supabase
      .from("reports")
      .select("name, clerk_user_id")
      .eq("id", invite.from_report_id)
      .maybeSingle();

    if (reportErr || !report) {
      if (reportErr) logServerError("invite/info.report", reportErr);
      return NextResponse.json({ inviterName: null });
    }

    const clerkNameMap = await resolveClerkDisplayNamesByUserId([
      report.clerk_user_id,
    ]);

    const inviterName = resolvePartnerDisplayName(
      report.name,
      report.clerk_user_id ? clerkNameMap[report.clerk_user_id] : undefined,
      undefined,
      messages.report.partnerFallbackLabel,
    );

    return NextResponse.json({ inviterName });
  } catch (e) {
    logServerError("invite/info", e);
    return NextResponse.json({ inviterName: null });
  }
}
