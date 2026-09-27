import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  createRouteSupabaseClient,
  supabaseConfigErrorResponse,
} from "@/lib/supabase/serverClient";
import { logServerError } from "@/lib/security/safeLog";
import { getCreditLotSummary } from "@/lib/credits/creditEngine";
import { getDecisionJournalAccess } from "@/lib/entitlements/decisionJournalAccess";
import { listOwnPersonalGifts } from "@/lib/credits/personalGifts";

export const runtime = "nodejs";

/**
 * GET the CALLER's OWN entitlement summary -- Personal/Relationship credit
 * remaining + soonest expiry, and Decision Journal's unlimited-window
 * status. Auth-scoped by clerk_user_id from the session only, same pattern
 * as /api/account/membership -- no id parameter, so no ownership check to
 * get wrong.
 *
 * Read-only and side-effect-free: NEVER used to gate a purchase or a
 * generation attempt. The real entitlement gate stays the credit
 * reservation itself (see Phase 1 -- app/api/relationship/analyze/premium
 * and app/api/v2/deep/essence). This is consumed by three UI surfaces that
 * only need to know current state, not enforce it:
 *   - the account "My Access" section (remaining counts, expiry dates)
 *   - the Decision Journal page (20-entry cap vs. unlimited override)
 *   - PurchaseSelectorContent's lightweight "you already have access"
 *     informational notice (never blocks a purchase, see product rules)
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createRouteSupabaseClient();
  if (!supabase) return supabaseConfigErrorResponse();

  try {
    const [personal, relationship, journal, personalGifts] = await Promise.all([
      getCreditLotSummary(supabase, userId, "personal"),
      getCreditLotSummary(supabase, userId, "relationship"),
      getDecisionJournalAccess(supabase, userId),
      listOwnPersonalGifts(supabase, userId),
    ]);

    return NextResponse.json({
      personal: {
        remaining: personal.totalRemaining,
        soonestExpiresAt: personal.soonestExpiresAt,
      },
      relationship: {
        remaining: relationship.totalRemaining,
        soonestExpiresAt: relationship.soonestExpiresAt,
      },
      journal: journal.hasAccess
        ? { unlimited: true, unlimitedUntil: journal.expiresAt, unlimitedSource: journal.source }
        : { unlimited: false, unlimitedUntil: null, unlimitedSource: null },
      // Annual-membership "gift" inventory the caller can share -- kept
      // fully separate from `personal` above per the product rule: a gift
      // belongs to this inventory until claimed, and only then does the
      // recipient (a different clerk_user_id) receive an ordinary Personal
      // credit lot. Empty for non-Annual members (no rows issued to them).
      personalGifts: personalGifts.map((g) => ({
        code: g.code,
        status: g.status,
      })),
    });
  } catch (error) {
    logServerError("account.entitlements.get", error, "query_failed");
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
