import { auth } from "@clerk/nextjs/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { NextResponse } from "next/server";
import { assertOwnedReportAccess } from "@/lib/report/assertOwnedReportAccess";
import { createInviteToken } from "@/lib/security/inviteToken";
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

/** 친구 초대 생성 — 로그인 + 소유 report만 */
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
    const body = (parsed.body ?? {}) as Record<string, unknown>;
    const idCheck = requireUuid(body.reportId, "reportId");
    if (!idCheck.ok) return idCheck.response;

    const limited = await enforceRateLimit("invite", userId);
    if (!limited.ok) return rateLimitResponse(limited);

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();
    const access = await assertOwnedReportAccess(
      supabase,
      idCheck.value,
      userId,
      locale,
    );
    if (access.error) return access.error;

    const inviteToken = createInviteToken();

    const { data, error } = await supabase
      .from("invites")
      .insert([
        {
          from_report_id: idCheck.value,
          invite_token: inviteToken,
          invite_type: "relationship",
          status: "open",
        },
      ])
      .select("id, status, from_report_id, invite_type, created_at")
      .single();

    if (error || !data) {
      logServerError("invite/create", error);
      return NextResponse.json({ error: messages.hub.inviteCreateFailed }, { status: 500 });
    }

    // Return token once to creator; never log full token.
    return NextResponse.json({
      invite: {
        ...data,
        invite_token: inviteToken,
      },
    });
  } catch (error) {
    logServerError("invite/create", error);
    return NextResponse.json(
      { error: messages.hub.inviteCreateFailed },
      { status: 500 },
    );
  }
}
