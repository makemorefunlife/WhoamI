import { NextResponse } from "next/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { readJsonBodyLimited } from "@/lib/security/requestValidation";
import { logServerError } from "@/lib/security/safeLog";
import { loadGuestPersonalState, saveGuestPersonalInput } from "@/lib/payment/guestPersonal";
import { guestSessionOrderId } from "@/lib/payment/guestRoute";

export const runtime = "nodejs";

/** Stores the guest's birth input (and survey where the locale requires it) server-side. */
export async function POST(req: Request) {
  try {
    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();
    const orderId = await guestSessionOrderId(supabase);
    if (!orderId) return NextResponse.json({ status: "unverified" }, { status: 401 });
    const parsed = await readJsonBodyLimited(req);
    if (!parsed.ok) return parsed.response;
    const state = await loadGuestPersonalState(supabase, orderId);
    if (!state) return NextResponse.json({ status: "not_available" }, { status: 404 });
    const r = await saveGuestPersonalInput(supabase, orderId, state.locale, (parsed.body ?? {}) as never);
    if (r.ok) return NextResponse.json({ status: "saved" });
    return NextResponse.json({ status: r.code }, { status: r.code === "error" ? 500 : 400 });
  } catch (e) {
    logServerError("guest/personal/input", e, "internal_error");
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
