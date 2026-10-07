import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { processDueGuestEmails } from "@/lib/email/guestPurchaseEmail";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Background sender for queued purchase-guide emails (pending, due retries,
 * expired 'sending' leases). Serverless-safe: each run is bounded and every
 * send is guarded by the DB lease + Resend Idempotency-Key.
 *
 * Auth: "Authorization: Bearer <CRON_SECRET>" -- what Vercel Cron sends when
 * CRON_SECRET is set. Schedule it with Vercel Cron, Supabase pg_cron + pg_net,
 * or any HTTP scheduler (see docs/dev/decisions/2026-10-08_guest_purchase_email_resend.md).
 */
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim() ?? "";
  if (secret.length < 16) return false;
  const got = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(got);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function run(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const supabase = createRouteSupabaseClient();
  if (!supabase) return supabaseConfigErrorResponse();
  const result = await processDueGuestEmails(supabase, { limit: 25 });
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}

export const GET = run;
export const POST = run;
