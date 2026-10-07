import { NextResponse } from "next/server";
import {
  createRouteSupabaseClient,
  supabaseConfigErrorResponse,
} from "@/lib/supabase/serverClient";
import { readJsonBodyLimited } from "@/lib/security/requestValidation";
import { requireOperator } from "@/lib/security/operatorAuth";
import { logServerError } from "@/lib/security/safeLog";
import { sendGuestPurchaseEmail } from "@/lib/email/guestPurchaseEmail";

export const runtime = "nodejs";

/**
 * Operator-only: re-send the purchase-guide email of a paid, unclaimed guest
 * order (after a permanent failure, or -- with { allowResend: true } -- when
 * the buyer lost an email that was already sent). Starts a new email
 * generation (new Resend Idempotency-Key) with the same claim link. Never
 * touches the payment or the entitlement.
 */
export async function POST(req: Request, ctx: { params: Promise<{ orderId: string }> }) {
  const op = await requireOperator(req);
  if (!op.ok) return NextResponse.json({ error: "forbidden" }, { status: op.status });

  const { orderId } = await ctx.params;
  if (!/^aha_[a-f0-9]{32}$/.test(orderId)) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  const parsed = await readJsonBodyLimited(req);
  if (!parsed.ok) return parsed.response;
  const allowResend = ((parsed.body ?? {}) as Record<string, unknown>).allowResend === true;

  const supabase = createRouteSupabaseClient();
  if (!supabase) return supabaseConfigErrorResponse();

  const { data: cur } = await supabase
    .from("toss_payment_orders")
    .select("guest_email_status")
    .eq("order_id", orderId)
    .maybeSingle();
  const current = (cur as { guest_email_status: string | null } | null)?.guest_email_status ?? null;
  if (current === "sent" && !allowResend) return NextResponse.json({ orderId, result: "already_sent" }, { status: 409 });
  const { data, error } = await supabase.rpc("reissue_guest_purchase_email", { p_order_id: orderId });
  if (error) {
    logServerError("admin/toss-guest-email", error, "reopen_failed");
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
  const reopened = (Array.isArray(data) ? data[0] : data) as string | Record<string, string> | undefined;
  const reopenResult = typeof reopened === "string" ? reopened : Object.values(reopened ?? {})[0];
  if (reopenResult !== "reissued") return NextResponse.json({ orderId, result: reopenResult ?? "error" }, { status: 409 });

  const emailStatus = await sendGuestPurchaseEmail(supabase, orderId);
  return NextResponse.json({ orderId, emailStatus }, { status: emailStatus === "sent" ? 200 : 502 });
}
