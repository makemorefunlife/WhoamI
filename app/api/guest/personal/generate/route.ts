import { NextResponse } from "next/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { logServerError } from "@/lib/security/safeLog";
import { runSlimIntegratedReport } from "@/lib/v1/slim/runSlimIntegratedReport";
import { generateGuestPersonal } from "@/lib/payment/guestPersonal";
import { guestSessionOrderId } from "@/lib/payment/guestRoute";

export const runtime = "nodejs";
// Same budget as the member Personal deep route.
export const maxDuration = 300;

/**
 * Generates the guest's Personal report from the STORED input (never from
 * the request body). The order's single use is reserved first and marked used
 * only after the report is saved. Explicit POST only -- opening a link or a
 * page never uses the pass.
 */
export async function POST() {
  try {
    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();
    const orderId = await guestSessionOrderId(supabase);
    if (!orderId) return NextResponse.json({ status: "unverified" }, { status: 401 });

    const outcome = await generateGuestPersonal(supabase, orderId, {
      generate: (input) =>
        runSlimIntegratedReport({
          birthDate: input.birthDate,
          birthTime: input.birthTime,
          birthTimeUnknown: input.birthTimeUnknown,
          birthPlace: input.birthPlace,
          surveyAnswers: input.surveyAnswers,
          currentSelfProfile: null,
          locale: input.locale,
        }),
    });
    switch (outcome.kind) {
      case "ok":
        return NextResponse.json({ status: "generated", slim_v1: outcome.slim_v1 });
      case "already_used":
        return NextResponse.json({ status: "generated", slim_v1: outcome.slim_v1 });
      case "in_progress":
        return NextResponse.json({ status: "in_progress" }, { status: 409 });
      case "rejected":
        return NextResponse.json({ status: outcome.code }, { status: 409 });
      default:
        return NextResponse.json({ status: "failed", code: outcome.code }, { status: outcome.status });
    }
  } catch (e) {
    logServerError("guest/personal/generate", e, "internal_error");
    return NextResponse.json({ status: "failed" }, { status: 500 });
  }
}
