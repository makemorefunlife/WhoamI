import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { logServerError } from "@/lib/security/safeLog";
import { GUEST_INVITE_COOKIE, linkGuestParticipation, resolveGuestParticipant } from "@/lib/invite/guestInvite";

export const runtime = "nodejs";

/**
 * POST — after sign-up / sign-in within 30 days: link this browser's guest
 * participation to the account. Needs BOTH the Clerk session and the guest
 * participation session (or one recovered by an email code). The invite
 * token alone is never enough.
 */
export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ code: "unauthorized" }, { status: 401 });
    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();
    const jar = await cookies();
    const p = await resolveGuestParticipant(supabase, jar.get(GUEST_INVITE_COOKIE)?.value);
    if (!p) return NextResponse.json({ code: "no_participation" }, { status: 404 });
    const r = await linkGuestParticipation(supabase, p, userId);
    if (!r.ok) return NextResponse.json({ code: "error" }, { status: 500 });
    const res = NextResponse.json({ ok: true, reportId: r.reportId, relationshipReportId: r.relationshipReportId, mode: r.mode });
    res.cookies.set(GUEST_INVITE_COOKIE, "", { path: "/", maxAge: 0 });
    return res;
  } catch (e) {
    logServerError("invite/guest/link", e, "internal_error");
    return NextResponse.json({ code: "error" }, { status: 500 });
  }
}
