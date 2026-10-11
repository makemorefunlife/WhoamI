import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { maskEmail } from "@/lib/payment/guestCheckout";
import { logServerError } from "@/lib/security/safeLog";
import { GUEST_INVITE_COOKIE, resolveGuestParticipant } from "@/lib/invite/guestInvite";
import { resolveClerkDisplayNamesByUserId } from "@/lib/relationship/resolveClerkDisplayNames";

export const runtime = "nodejs";

/** GET — this browser's guest participation (session cookie only). Nothing else is revealed. */
export async function GET() {
  try {
    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();
    const p = await resolveGuestParticipant(supabase, (await cookies()).get(GUEST_INVITE_COOKIE)?.value);
    if (!p) return NextResponse.json({ status: "none" }, { headers: { "Cache-Control": "no-store" } });
    let inviterName: string | null = null;
    if (p.inviter_report_id) {
      const { data: inv } = await supabase
        .from("reports")
        .select("name, clerk_user_id")
        .eq("id", p.inviter_report_id)
        .maybeSingle();
      const byId = await resolveClerkDisplayNamesByUserId([inv?.clerk_user_id ?? null]);
      inviterName = (inv?.clerk_user_id ? byId[inv.clerk_user_id] : null) ?? inv?.name ?? null;
    }
    return NextResponse.json(
      {
        status: "active",
        inviterName,
        expiresAt: p.expires_at,
        emailVerified: Boolean(p.email_verified_at),
        maskedEmail: p.email ? maskEmail(p.email) : null,
        locale: p.locale,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    logServerError("invite/guest/state", e, "internal_error");
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
