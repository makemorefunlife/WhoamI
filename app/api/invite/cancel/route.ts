import { auth } from "@clerk/nextjs/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { NextResponse } from "next/server";
import { assertOwnedReportAccess } from "@/lib/report/assertOwnedReportAccess";
import {
  enforceRateLimit,
  rateLimitResponse,
} from "@/lib/security/rateLimit";
import {
  readJsonBodyLimited,
  requireUuid,
} from "@/lib/security/requestValidation";
import { logServerError } from "@/lib/security/safeLog";
import { resolveRequestLocale } from "@/lib/i18n/llmLocale";
import { getMessages } from "@/lib/i18n/messages";

export const runtime = "nodejs";

/**
 * Cancel open invite — creator (from_report owner) only.
 * Marks status cancelled when delete not preferred; uses status filter.
 */
export async function POST(req: Request) {
  const locale = resolveRequestLocale({
    bodyLanguage: null,
    headerLanguage:
      req.headers.get("x-aha-locale") ?? req.headers.get("accept-language"),
  });
  const messages = getMessages(locale);
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: messages.errors.unauthorized }, { status: 401 });
    }

    const parsed = await readJsonBodyLimited(req);
    if (!parsed.ok) return parsed.response;
    const body = (parsed.body ?? {}) as {
      inviteId?: unknown;
      reportId?: unknown;
    };

    const inviteIdCheck = requireUuid(body.inviteId, "inviteId");
    if (!inviteIdCheck.ok) return inviteIdCheck.response;
    const reportIdCheck = requireUuid(body.reportId, "reportId");
    if (!reportIdCheck.ok) return reportIdCheck.response;

    const limited = await enforceRateLimit("invite", userId);
    if (!limited.ok) return rateLimitResponse(limited);

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();
    const access = await assertOwnedReportAccess(
      supabase,
      reportIdCheck.value,
      userId,
      locale,
    );
    if (access.error) return access.error;

    // Physical delete of open invite — no new status enum without migration.
    // complete() only matches status=open, so cancelled/deleted cannot accept.
    const { data, error } = await supabase
      .from("invites")
      .delete()
      .eq("id", inviteIdCheck.value)
      .eq("from_report_id", reportIdCheck.value)
      .eq("status", "open")
      .select("id")
      .maybeSingle();

    if (error) {
      logServerError("invite/cancel", error);
      return NextResponse.json({ error: messages.hub.inviteCancelFailed }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json(
        { error: messages.errors.notFound },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    logServerError("invite/cancel", e);
    return NextResponse.json({ error: messages.hub.inviteCancelFailed }, { status: 500 });
  }
}
