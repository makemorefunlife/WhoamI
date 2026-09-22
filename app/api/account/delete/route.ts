import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  createRouteSupabaseClient,
  supabaseConfigErrorResponse,
} from "@/lib/supabase/serverClient";
import { logServerError } from "@/lib/security/safeLog";
import { cancelPaddleSandboxSubscription } from "@/lib/payment/paddleSandboxClient";

export const runtime = "nodejs";

/**
 * Self-serve account deletion:
 * 0) If this user has an ACTIVE membership with a live Paddle subscription,
 *    cancel it at Paddle FIRST (effective_from: "immediately" -- there is
 *    no account left afterwards to use any remaining paid term, so this
 *    stops future billing right away rather than leaving a subscription
 *    that keeps charging a deleted account). Deletion only proceeds once
 *    that cancellation is confirmed; if it fails, the whole request is
 *    aborted here and NOTHING is deleted -- this route must never report
 *    account deletion as successful while a live Paddle subscription is
 *    still running.
 * 1) Delete user's owned DB data (reports row delete + FK cascade -- this
 *    covers reports, survey_responses, report_analyses,
 *    relationship_reports, person_core_blueprints; all have
 *    `on delete cascade` back to reports.id)
 * 2) Delete/anonymize entitlement + purchase-history state
 *    (cleanup_account_entitlement_data -- see
 *    supabase/migrations/20260922070000_account_deletion_entitlement_cleanup.sql
 *    for the full retain/delete/anonymize classification). This also
 *    deletes the memberships row itself (cascading to its term/monthly
 *    grants), so no local cancel/sync call is needed after step 0 --
 *    the row is gone a moment later regardless.
 * 3) Delete Clerk user account
 */
export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createRouteSupabaseClient();
  if (!supabase) return supabaseConfigErrorResponse();

  const { data: activeMembership, error: membershipLookupError } = await supabase
    .from("memberships")
    .select("paddle_subscription_id")
    .eq("clerk_user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (membershipLookupError) {
    logServerError("account.delete", membershipLookupError, "membership_lookup_failed");
    return NextResponse.json(
      { error: "계정 삭제 준비 중 오류가 발생했어요. 다시 시도해 주세요." },
      { status: 500 },
    );
  }

  const subscriptionId = activeMembership?.paddle_subscription_id as string | null | undefined;
  if (subscriptionId) {
    const cancelResult = await cancelPaddleSandboxSubscription(subscriptionId, "immediately");
    if (!cancelResult) {
      logServerError("account.delete", null, "subscription_cancel_failed");
      // Do NOT proceed with any deletion -- report a clear failure so the
      // caller knows the account (and the subscription) are both still
      // intact, never a partial "account half-deleted, subscription still
      // running" state.
      return NextResponse.json(
        {
          error:
            "구독 해지에 실패해 계정을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.",
        },
        { status: 502 },
      );
    }
  }

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
