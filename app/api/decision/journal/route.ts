import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { readJsonBodyLimited } from "@/lib/security/requestValidation";
import { logServerError } from "@/lib/security/safeLog";
import { getDecisionJournalAccess } from "@/lib/entitlements/decisionJournalAccess";
import {
  DECISION_JOURNAL_FREE_CAP,
  completeJournalReview,
  createJournalEntry,
  listJournalEntries,
} from "@/lib/decision/serverJournal";

export const runtime = "nodejs";
const noStore = { "Cache-Control": "no-store" };

/**
 * The signed-in account's Decision Journal (server storage, 20261011150000).
 * { available: false } when the table is not there yet -- the page then keeps
 * using this device's records as before.
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const supabase = createRouteSupabaseClient();
  if (!supabase) return supabaseConfigErrorResponse();
  try {
    const [entries, access] = await Promise.all([listJournalEntries(supabase, userId), getDecisionJournalAccess(supabase, userId)]);
    if (!entries) return NextResponse.json({ available: false }, { headers: noStore });
    return NextResponse.json(
      {
        available: true,
        entries,
        total: entries.length,
        cap: DECISION_JOURNAL_FREE_CAP,
        unlimited: access.hasAccess,
        unlimitedUntil: access.hasAccess ? access.expiresAt : null,
      },
      { headers: noStore },
    );
  } catch (e) {
    logServerError("decision/journal.get", e, "internal_error");
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

/** New entry. The free allowance is checked in SQL (atomic per account). */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const supabase = createRouteSupabaseClient();
  if (!supabase) return supabaseConfigErrorResponse();
  try {
    const parsed = await readJsonBodyLimited(req);
    if (!parsed.ok) return parsed.response;
    const access = await getDecisionJournalAccess(supabase, userId);
    const r = await createJournalEntry(supabase, userId, (parsed.body ?? {}) as never, access.hasAccess);
    const status = r.result === "created" || r.result === "exists" ? 200 : r.result === "cap_reached" ? 409 : r.result === "invalid" ? 400 : 500;
    return NextResponse.json({ result: r.result, id: r.id }, { status });
  } catch (e) {
    logServerError("decision/journal.post", e, "internal_error");
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

/** Completes a review of one of the caller's own entries. */
export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const supabase = createRouteSupabaseClient();
  if (!supabase) return supabaseConfigErrorResponse();
  try {
    const parsed = await readJsonBodyLimited(req);
    if (!parsed.ok) return parsed.response;
    const body = (parsed.body ?? {}) as { id?: unknown; rating?: unknown; note?: unknown };
    const ok = await completeJournalReview(supabase, userId, body);
    return NextResponse.json({ ok }, { status: ok ? 200 : 404 });
  } catch (e) {
    logServerError("decision/journal.patch", e, "internal_error");
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
