import { NextResponse } from "next/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { enforceRateLimit, rateLimitResponse } from "@/lib/security/rateLimit";
import { clientIpKey, normalizeGuestEmail } from "@/lib/payment/guestCheckout";
import { readJsonBodyLimited } from "@/lib/security/requestValidation";
import { logServerError } from "@/lib/security/safeLog";
import {
  GUEST_INVITE_COOKIE,
  consumeInviteCode,
  guestInviteCookieOptions,
  openParticipantSession,
} from "@/lib/invite/guestInvite";

export const runtime = "nodejs";

/** POST {email, code} — opens the participation session on this browser. */
export async function POST(req: Request) {
  try {
    const limited = await enforceRateLimit("guest_code_verify", clientIpKey(req));
    if (!limited.ok) return rateLimitResponse(limited);
    const parsed = await readJsonBodyLimited(req);
    if (!parsed.ok) return parsed.response;
    const b = (parsed.body ?? {}) as Record<string, unknown>;
    const email = normalizeGuestEmail(b.email);
    if (!email) return NextResponse.json({ code: "invalid_email" }, { status: 400 });
    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();
    const ok = await consumeInviteCode(supabase, { purpose: "recover", email, code: typeof b.code === "string" ? b.code : "" });
    if (!ok?.participantId) return NextResponse.json({ code: "wrong_code" }, { status: 400 });
    const { data: p } = await supabase
      .from("guest_invite_participants")
      .select("id, expires_at, status, email")
      .eq("id", ok.participantId)
      .maybeSingle();
    if (!p || p.status !== "active" || p.email !== email || p.expires_at <= new Date().toISOString()) {
      return NextResponse.json({ code: "expired" }, { status: 410 });
    }
    const token = await openParticipantSession(supabase, { id: p.id as string, expires_at: p.expires_at as string }, "code");
    if (!token) return NextResponse.json({ code: "error" }, { status: 503 });
    const res = NextResponse.json({ ok: true });
    res.cookies.set(GUEST_INVITE_COOKIE, token, guestInviteCookieOptions(new Date(p.expires_at as string)));
    return res;
  } catch (e) {
    logServerError("invite/guest/recover/verify", e, "internal_error");
    return NextResponse.json({ code: "error" }, { status: 500 });
  }
}
