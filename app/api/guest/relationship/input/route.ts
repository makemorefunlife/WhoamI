import { NextResponse } from "next/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { readJsonBodyLimited } from "@/lib/security/requestValidation";
import { logServerError } from "@/lib/security/safeLog";
import { loadGuestRelationshipState, saveGuestRelationshipInput } from "@/lib/payment/guestRelationship";
import { guestSessionOrderId } from "@/lib/payment/guestRoute";

export const runtime = "nodejs";

/** Stores my info, the other person's info (with the required notice / consent) and the relationship kind. */
export async function POST(req: Request) {
  try {
    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();
    const orderId = await guestSessionOrderId(supabase);
    if (!orderId) return NextResponse.json({ status: "unverified" }, { status: 401 });
    const parsed = await readJsonBodyLimited(req);
    if (!parsed.ok) return parsed.response;
    const state = await loadGuestRelationshipState(supabase, orderId);
    if (!state || state.status === "not_available") return NextResponse.json({ status: "not_available" }, { status: 404 });
    const r = await saveGuestRelationshipInput(supabase, orderId, state.locale, (parsed.body ?? {}) as never);
    if (r.ok) return NextResponse.json({ status: "saved" });
    return NextResponse.json({ status: r.code }, { status: r.code === "error" ? 500 : r.code === "locked" ? 409 : 400 });
  } catch (e) {
    logServerError("guest/relationship/input", e, "internal_error");
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
