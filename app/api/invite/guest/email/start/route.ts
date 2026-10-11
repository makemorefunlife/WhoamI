import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { enforceRateLimit, rateLimitResponse } from "@/lib/security/rateLimit";
import { clientIpKey, normalizeGuestEmail } from "@/lib/payment/guestCheckout";
import { readJsonBodyLimited } from "@/lib/security/requestValidation";
import { logServerError } from "@/lib/security/safeLog";
import { normalizeLocale } from "@/lib/i18n/locale";
import { GUEST_INVITE_COOKIE, issueInviteCode, resolveGuestParticipant } from "@/lib/invite/guestInvite";
import { sendInviteCodeEmail } from "@/lib/email/inviteCodeEmail";

export const runtime = "nodejs";

/** POST {email} — optional: send a code to confirm this email for recovery on another browser. */
export async function POST(req: Request) {
  try {
    const limited = await enforceRateLimit("guest_code_send", clientIpKey(req));
    if (!limited.ok) return rateLimitResponse(limited);
    const parsed = await readJsonBodyLimited(req);
    if (!parsed.ok) return parsed.response;
    const email = normalizeGuestEmail((parsed.body as Record<string, unknown> | null)?.email);
    if (!email) return NextResponse.json({ code: "invalid_email" }, { status: 400 });
    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();
    const p = await resolveGuestParticipant(supabase, (await cookies()).get(GUEST_INVITE_COOKIE)?.value);
    if (!p) return NextResponse.json({ code: "no_participation" }, { status: 404 });
    const code = await issueInviteCode(supabase, { participantId: p.id, purpose: "verify", email });
    if (!code) return NextResponse.json({ code: "error" }, { status: 503 });
    const sent = await sendInviteCodeEmail({
      to: email,
      locale: normalizeLocale(p.locale),
      code,
      purpose: "verify",
      idempotencyKey: `invite-verify:${p.id}:${Date.now()}`,
    });
    if (sent.kind !== "sent") return NextResponse.json({ code: "mail_failed" }, { status: 503 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    logServerError("invite/guest/email/start", e, "internal_error");
    return NextResponse.json({ code: "error" }, { status: 500 });
  }
}
