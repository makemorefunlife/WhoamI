import { NextResponse } from "next/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { logServerError } from "@/lib/security/safeLog";
import { buildGuestPremiumRequest, loadGuestRelationshipState } from "@/lib/payment/guestRelationship";
import { guestSessionOrderId } from "@/lib/payment/guestRoute";
import { handleRelationshipPremium } from "@/lib/relationship/premiumGenerationHandler";

export const runtime = "nodejs";
// Same budget as the member relationship premium route.
export const maxDuration = 300;

/**
 * Generates the guest's Relationship report ONCE, from the STORED input only
 * (the request body is ignored). Same engine, locks and per-creator save as
 * members; the purchase is reserved first, marked used only after the report
 * is saved, and released on any failure. Explicit POST only -- opening or
 * refreshing the page never generates.
 */
export async function POST() {
  try {
    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();
    const orderId = await guestSessionOrderId(supabase);
    if (!orderId) return NextResponse.json({ status: "unverified" }, { status: 401 });

    const state = await loadGuestRelationshipState(supabase, orderId);
    if (!state || state.status === "not_available") return NextResponse.json({ status: "not_eligible" }, { status: 409 });
    if (state.status === "generated") return NextResponse.json({ status: "generated" });
    if (state.status === "generating") return NextResponse.json({ status: "in_progress" }, { status: 409 });
    if (state.status !== "ready") return NextResponse.json({ status: state.status }, { status: 409 });

    const built = await buildGuestPremiumRequest(supabase, orderId);
    if (!built.ok) return NextResponse.json({ status: built.code }, { status: 409 });
    const inner = new Request("http://internal/api/guest/relationship/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-aha-locale": built.locale },
      body: JSON.stringify(built.body),
    });
    const res = await handleRelationshipPremium(inner, built.requester);
    if (res.ok) return NextResponse.json({ status: "generated" });
    if (res.status === 409) return NextResponse.json({ status: "in_progress" }, { status: 409 });
    const after = await loadGuestRelationshipState(supabase, orderId);
    if (after?.status === "generated") return NextResponse.json({ status: "generated" });
    return NextResponse.json({ status: "failed" }, { status: res.status >= 500 ? 502 : 409 });
  } catch (e) {
    logServerError("guest/relationship/generate", e, "internal_error");
    return NextResponse.json({ status: "failed" }, { status: 500 });
  }
}
