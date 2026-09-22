import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  createRouteSupabaseClient,
  supabaseConfigErrorResponse,
} from "@/lib/supabase/serverClient";

export const runtime = "nodejs";

/**
 * Self-serve account deletion:
 * 1) Delete user's owned DB data (reports row delete + FK cascade -- this
 *    covers reports, survey_responses, report_analyses,
 *    relationship_reports, person_core_blueprints; all have
 *    `on delete cascade` back to reports.id)
 * 2) Delete/anonymize entitlement + purchase-history state
 *    (cleanup_account_entitlement_data -- see
 *    supabase/migrations/20260922070000_account_deletion_entitlement_cleanup.sql
 *    for the full retain/delete/anonymize classification). This is
 *    intentionally separate from step 1: none of these tables carry a
 *    foreign key to `reports`, so they are NEVER touched by the cascade
 *    above and would otherwise survive account deletion untouched.
 * 3) Delete Clerk user account
 *
 * NOTE: this does not cancel an active Paddle subscription
 * (memberships.paddle_subscription_id). If the user has a live US Annual
 * membership at deletion time, Paddle will still bill its next renewal on
 * schedule even though the local membership row is gone -- there is no
 * Paddle-side subscription-cancellation call wired up yet. Flagged as a
 * follow-up, not solved here.
 */
export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createRouteSupabaseClient();
  if (!supabase) return supabaseConfigErrorResponse();

  const { error: deleteReportsError } = await supabase
    .from("reports")
    .delete()
    .eq("clerk_user_id", userId);

  if (deleteReportsError) {
    console.error("[account.delete] db_delete_failed", {
      code: deleteReportsError.code ?? "unknown",
    });
    return NextResponse.json(
      { error: "계정 데이터 삭제 중 오류가 발생했어요. 다시 시도해 주세요." },
      { status: 500 },
    );
  }

  const { error: cleanupEntitlementError } = await supabase.rpc(
    "cleanup_account_entitlement_data",
    { p_clerk_user_id: userId },
  );

  if (cleanupEntitlementError) {
    console.error("[account.delete] entitlement_cleanup_failed", {
      code: cleanupEntitlementError.code ?? "unknown",
    });
    return NextResponse.json(
      { error: "계정 데이터 삭제 중 오류가 발생했어요. 다시 시도해 주세요." },
      { status: 500 },
    );
  }

  try {
    const client = await clerkClient();
    await client.users.deleteUser(userId);
  } catch (error) {
    console.error("[account.delete] clerk_delete_failed", error);
    return NextResponse.json(
      {
        error:
          "계정 삭제 마무리 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
