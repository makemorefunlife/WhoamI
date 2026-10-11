import { NextResponse } from "next/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { enforceRateLimit, rateLimitResponse } from "@/lib/security/rateLimit";
import { clientIpKey } from "@/lib/payment/guestCheckout";
import { readJsonBodyLimited } from "@/lib/security/requestValidation";
import { isAcceptableInviteToken } from "@/lib/security/inviteToken";
import { normalizeLocale } from "@/lib/i18n/locale";
import { logServerError } from "@/lib/security/safeLog";
import { GUEST_INVITE_COOKIE, guestInviteCookieOptions, joinInviteAsGuest } from "@/lib/invite/guestInvite";

export const runtime = "nodejs";

/**
 * POST — a non-member joins an open invite without signing up (IA v2 §4-2).
 * Body: inviteToken, displayName, birth fields, consent {age, privacy},
 * surveyAnswers (required where the locale requires the survey), locale.
 * Sets the httpOnly participation session; never returns the token.
 */
export async function POST(req: Request) {
  try {
    const limited = await enforceRateLimit("guest_checkout", clientIpKey(req));
    if (!limited.ok) return rateLimitResponse(limited);
    const parsed = await readJsonBodyLimited(req);
    if (!parsed.ok) return parsed.response;
    const b = (parsed.body ?? {}) as Record<string, unknown>;
    const token = typeof b.inviteToken === "string" ? b.inviteToken.trim() : "";
    if (!isAcceptableInviteToken(token)) return NextResponse.json({ code: "invalid" }, { status: 400 });

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();
    const consent = (b.consent ?? {}) as Record<string, unknown>;
    const survey = b.surveyAnswers && typeof b.surveyAnswers === "object" ? (b.surveyAnswers as Record<string, string>) : null;
    const result = await joinInviteAsGuest(supabase, {
      inviteToken: token,
      locale: normalizeLocale(typeof b.locale === "string" ? b.locale : undefined),
      displayName: typeof b.displayName === "string" ? b.displayName : "",
      birthDate: typeof b.birthDate === "string" ? b.birthDate.trim() : "",
      birthTime: typeof b.birthTime === "string" && b.birthTime.trim() ? b.birthTime.trim() : null,
      birthTimeUnknown: b.birthTimeUnknown === true,
      birthPlace: typeof b.birthPlace === "string" ? b.birthPlace : null,
      birthPlaceUnknown: b.birthPlaceUnknown === true,
      surveyAnswers: survey,
      consent: { age: consent.age === true, privacy: consent.privacy === true },
    });
    if (!result.ok) {
      const status = result.code === "unavailable" ? 410 : result.code === "error" ? 500 : 400;
      return NextResponse.json({ code: result.code }, { status });
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set(GUEST_INVITE_COOKIE, result.sessionToken, guestInviteCookieOptions(result.expiresAt));
    return res;
  } catch (e) {
    logServerError("invite/guest/join", e, "internal_error");
    return NextResponse.json({ code: "error" }, { status: 500 });
  }
}
