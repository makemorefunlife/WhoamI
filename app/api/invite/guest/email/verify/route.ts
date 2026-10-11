import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { enforceRateLimit, rateLimitResponse } from "@/lib/security/rateLimit";
import { clientIpKey, normalizeGuestEmail } from "@/lib/payment/guestCheckout";
import { readJsonBodyLimited } from "@/lib/security/requestValidation";
import { logServerError } from "@/lib/security/safeLog";
import { GUEST_INVITE_COOKIE, consumeInviteCode, resolveGuestParticipant } from "@/lib/invite/guestInvite";

export const runtime = "nodejs";

/** POST {email, code} — stores the email on this participation only once the code proves it. */
export async function POST(req: Request) {
  try {
    const limited = await enforceRateLimit("guest_code_verify", clientIpKey(req));
    if (!limited.ok) return rateLimitResponse(limited);
    const parsed = await readJsonBodyLimited(req);
    if (!parsed.ok) return parsed.response;
    const b = (parsed.body ?? {}) as Record<string, unknown>;
    const email = normalizeGuestEmail(b.email);
    const code = typeof b.code === "string" ? b.code : "";
    if (!email) return NextResponse.json({ code: "invalid_email" }, { status: 400 });
    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();
    const p = await resolveGuestParticipant(supabase, (await cookies()).get(GUEST_INVITE_COOKIE)?.value);
    if (!p) return NextResponse.json({ code: "no_participation" }, { status: 404 });
    const ok = await consumeInviteCode(supabase, { purpose: "verify", email, code });
    if (!ok || ok.participantId !== p.id) return NextResponse.json({ code: "wrong_code" }, { status: 400 });
    await supabase
      .from("guest_invite_participants")
      .update({ email, email_verified_at: new Date().toISOString() })
      .eq("id", p.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    logServerError("invite/guest/email/verify", e, "internal_error");
    return NextResponse.json({ code: "error" }, { status: 500 });
  }
}
