import { NextResponse } from "next/server";
import { requireOperator } from "@/lib/security/operatorAuth";
import { lookupTossOrderDiagnostic } from "@/lib/payment/tossServer";

export const runtime = "nodejs";

/**
 * Operator-only, read-only: looks up Toss's OWN record for an order (GET
 * /v1/payments/orders/{orderId}), separate from our own toss_payment_orders
 * row. Built while triaging a COMMON_ERROR on US PayPal checkout -- the
 * public failUrl redirect only carries a generic code/message, but Toss
 * keeps a more specific `failure` object on the Payment record itself for
 * attempts that reached ABORTED/EXPIRED. Never mutates anything (no
 * confirm/cancel). Safe to remove once this is triaged.
 */
export async function GET(req: Request, ctx: { params: Promise<{ orderId: string }> }) {
  const op = await requireOperator(req);
  if (!op.ok) return NextResponse.json({ error: "forbidden" }, { status: op.status });

  const { orderId } = await ctx.params;
  if (!/^aha_[a-f0-9]{32}$/.test(orderId)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const result = await lookupTossOrderDiagnostic(orderId);
  return NextResponse.json(result);
}
