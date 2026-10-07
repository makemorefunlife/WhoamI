import { NextResponse } from "next/server";
import {
  createRouteSupabaseClient,
  supabaseConfigErrorResponse,
} from "@/lib/supabase/serverClient";
import { isUuid } from "@/lib/security/requestValidation";
import { requireOperator } from "@/lib/security/operatorAuth";
import { executeMembershipRefundAttempt } from "@/lib/payment/membershipRefund";

export const runtime = "nodejs";

/**
 * Operator-only: retry a failed (or stuck 'processing' > 2 min) membership
 * refund. Uses the same Toss Idempotency-Key as the original attempt, so
 * it can never refund twice. No-op for an already-succeeded request.
 */
export async function POST(req: Request, ctx: { params: Promise<{ requestId: string }> }) {
  const op = await requireOperator(req);
  if (!op.ok) return NextResponse.json({ error: "forbidden" }, { status: op.status });

  const { requestId } = await ctx.params;
  if (!isUuid(requestId)) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const supabase = createRouteSupabaseClient();
  if (!supabase) return supabaseConfigErrorResponse();

  const attempt = await executeMembershipRefundAttempt(supabase, requestId);
  return NextResponse.json(
    { requestId, attempt },
    { status: attempt.status === "succeeded" ? 200 : attempt.status === "in_progress" ? 202 : attempt.status === "failed" ? 502 : 404 },
  );
}
