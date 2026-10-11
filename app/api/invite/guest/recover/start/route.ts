import { NextResponse } from "next/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { enforceRateLimit, rateLimitResponse } from "@/lib/security/rateLimit";
import { clientIpKey, normalizeGuestEmail } from "@/lib/payment/guestCheckout";
import { readJsonBodyLimited } from "@/lib/security/requestValidation";
import { logServerError } from "@/lib/security/safeLog";
import { normalizeLocale } from "@/lib/i18n/locale";
import { issueInviteCode } from "@/lib/invite/guestInvite";
import { sendInviteCodeEmail } from "@/lib/email/inviteCodeEmail";

export const runtime = "nodejs";

/**
 * POST {email} — another browser: send a code ONLY if an active guest
 * participation has this email verified. The response is the same either
 * way (no account/email discovery).
 */
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
    const { data: p } = await supabase
      .from("guest_invite_participants")
      .select("id, locale")
      .eq("email", email)
      .eq("status", "active")
      .not("email_verified_at", "is", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (p?.id) {
      const code = await issueInviteCode(supabase, { participantId: p.id as string, purpose: "recover", email });
      if (code) {
        await sendInviteCodeEmail({
          to: email,
          locale: normalizeLocale(p.locale as string),
          code,
          purpose: "recover",
          idempotencyKey: `invite-recover:${p.id}:${Date.now()}`,
        });
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    logServerError("invite/guest/recover/start", e, "internal_error");
    return NextResponse.json({ ok: true });
  }
}
