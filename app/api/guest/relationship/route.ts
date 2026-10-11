import { NextResponse } from "next/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { logServerError } from "@/lib/security/safeLog";
import { loadGuestRelationshipState } from "@/lib/payment/guestRelationship";
import { guestSessionOrderId } from "@/lib/payment/guestRoute";

export const runtime = "nodejs";

/**
 * Guest single-Relationship state for the caller's VERIFIED guest session
 * (purchase verification is shared with guest Personal: /api/guest/personal
 * answers "unverified" and offers the link / code steps). Reading never
 * generates or uses the purchase.
 */
export async function GET() {
  try {
    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();
    const orderId = await guestSessionOrderId(supabase);
    if (!orderId) return NextResponse.json({ status: "unverified" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    const state = await loadGuestRelationshipState(supabase, orderId);
    if (!state) return NextResponse.json({ status: "not_available" }, { status: 404 });
    return NextResponse.json({ ...state, orderId }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    logServerError("guest/relationship", e, "internal_error");
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
