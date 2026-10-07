import { NextResponse } from "next/server";
import {
  createRouteSupabaseClient,
  supabaseConfigErrorResponse,
} from "@/lib/supabase/serverClient";
import { isUuid, readJsonBodyLimited } from "@/lib/security/requestValidation";
import { logServerError } from "@/lib/security/safeLog";
import { requireOperator } from "@/lib/security/operatorAuth";
import { executeMembershipRefundAttempt } from "@/lib/payment/membershipRefund";

export const runtime = "nodejs";

/**
 * Operator-only: early cancellation + refund of a one-time 12-Month
 * Membership (Refund Policy §4). Guarded by requireOperator.
 *
 * GET  ?membershipId=<uuid>&requestReceivedOn=YYYY-MM-DD
 *      -> quote only (no side effects): total/unused days, prorated amount,
 *         whether the 7-day full refund applies, detected benefit use.
 * POST { membershipId, requestReceivedOn, mode: "prorated" | "full_within_7_days", note? }
 *      -> opens the refund request (idempotent: one per membership) and
 *         runs one refund attempt. Re-POSTing for the same membership
 *         returns the same request and, if it previously failed, retries it.
 *
 * Retry a failed request explicitly: POST /api/admin/membership-refunds/<requestId>/retry
 */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: Request) {
  const op = await requireOperator(req);
  if (!op.ok) return NextResponse.json({ error: "forbidden" }, { status: op.status });

  const url = new URL(req.url);
  const membershipId = url.searchParams.get("membershipId") ?? "";
  const requestReceivedOn = url.searchParams.get("requestReceivedOn") ?? "";
  if (!isUuid(membershipId) || !DATE_RE.test(requestReceivedOn)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const supabase = createRouteSupabaseClient();
  if (!supabase) return supabaseConfigErrorResponse();

  const { data, error } = await supabase.rpc("quote_membership_refund", {
    p_membership_id: membershipId,
    p_request_received_on: requestReceivedOn,
  });
  if (error) {
    logServerError("admin.membership-refunds.quote", error, "quote_failed");
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
  const quote = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({ quote });
}

export async function POST(req: Request) {
  const op = await requireOperator(req);
  if (!op.ok) return NextResponse.json({ error: "forbidden" }, { status: op.status });

  const parsed = await readJsonBodyLimited(req);
  if (!parsed.ok) return parsed.response;
  const body = (parsed.body ?? {}) as Record<string, unknown>;
  const membershipId = typeof body.membershipId === "string" ? body.membershipId.trim() : "";
  const requestReceivedOn = typeof body.requestReceivedOn === "string" ? body.requestReceivedOn.trim() : "";
  const mode = body.mode === "full_within_7_days" ? "full_within_7_days" : body.mode === "prorated" ? "prorated" : "";
  const note = typeof body.note === "string" ? body.note.slice(0, 500) : null;
  if (!isUuid(membershipId) || !DATE_RE.test(requestReceivedOn) || !mode) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const supabase = createRouteSupabaseClient();
  if (!supabase) return supabaseConfigErrorResponse();

  const { data, error } = await supabase.rpc("open_membership_refund", {
    p_membership_id: membershipId,
    p_request_received_on: requestReceivedOn,
    p_mode: mode,
    p_operator: op.operatorId,
    p_note: note,
  });
  if (error) {
    logServerError("admin.membership-refunds.open", error, "open_failed");
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
  const opened = (Array.isArray(data) ? data[0] : data) as
    | { request_id: string | null; created: boolean; status: string | null; refund_amount: number | null; currency: string | null; error: string | null }
    | undefined;
  if (!opened?.request_id) {
    return NextResponse.json({ error: opened?.error ?? "open_failed" }, { status: 409 });
  }

  const attempt = await executeMembershipRefundAttempt(supabase, opened.request_id);
  return NextResponse.json(
    {
      requestId: opened.request_id,
      created: opened.created,
      refundAmount: opened.refund_amount,
      currency: opened.currency,
      attempt,
    },
    { status: attempt.status === "succeeded" ? 200 : attempt.status === "in_progress" ? 202 : 502 },
  );
}
