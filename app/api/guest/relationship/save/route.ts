import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { logServerError } from "@/lib/security/safeLog";
import { saveGuestRelationshipToAccount } from "@/lib/payment/guestRelationship";
import { guestSessionOrderId } from "@/lib/payment/guestRoute";
import { invalidateRelationshipMapCache } from "@/lib/relationship/map/computeRelationshipMap";

export const runtime = "nodejs";

/**
 * Saves the guest's generated Relationship report into the signed-in account
 * -- only when one of the account's Clerk-VERIFIED emails equals the purchase
 * email (checked in SQL). The same report moves as it is: no re-entry, no
 * regeneration, no extra credit. An existing profile is kept unchanged.
 */
export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ status: "sign_in_required" }, { status: 401 });
    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();
    const orderId = await guestSessionOrderId(supabase);
    if (!orderId) return NextResponse.json({ status: "unverified" }, { status: 401 });

    const user = await currentUser();
    const verifiedEmails = (user?.emailAddresses ?? [])
      .filter((e) => e.verification?.status === "verified")
      .map((e) => e.emailAddress);
    const r = await saveGuestRelationshipToAccount(supabase, { orderId, clerkUserId: userId, verifiedEmails });
    if (r.reportId) invalidateRelationshipMapCache(r.reportId);
    const httpStatus = r.result === "saved" || r.result === "already_saved" ? 200 : r.result === "error" ? 500 : 409;
    return NextResponse.json(
      { status: r.result, reportId: r.reportId, relationshipReportId: r.relationshipReportId },
      { status: httpStatus },
    );
  } catch (e) {
    logServerError("guest/relationship/save", e, "internal_error");
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
