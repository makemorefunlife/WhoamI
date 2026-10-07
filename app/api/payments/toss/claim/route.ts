import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  createRouteSupabaseClient,
  supabaseConfigErrorResponse,
} from "@/lib/supabase/serverClient";
import { readJsonBodyLimited } from "@/lib/security/requestValidation";
import { logServerError } from "@/lib/security/safeLog";
import { claimGuestTossOrders } from "@/lib/payment/tossConfirm";

export const runtime = "nodejs";

/**
 * Claims paid guest orders into the signed-in account.
 *
 * Ownership proof: the order's checkout email must be one of this account's
 * VERIFIED email addresses, read here from Clerk (server-side). Nothing the
 * client sends can widen that -- the body may only narrow it to one orderId.
 *
 * POST {}                -> claim every paid, unclaimed guest order for my verified emails
 * POST { orderId }       -> claim that one order
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const parsed = await readJsonBodyLimited(req);
    if (!parsed.ok) return parsed.response;
    const body = (parsed.body ?? {}) as Record<string, unknown>;
    const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
    if (orderId && !/^aha_[a-f0-9]{32}$/.test(orderId)) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }

    const user = await currentUser();
    const verifiedEmails = (user?.emailAddresses ?? [])
      .filter((e) => e.verification?.status === "verified")
      .map((e) => e.emailAddress);

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();

    const results = await claimGuestTossOrders(supabase, {
      clerkUserId: userId,
      verifiedEmails,
      orderIds: orderId ? [orderId] : undefined,
    });
    const claimed = results.filter((r) => r.result === "claimed" || r.result === "already_claimed").length;
    return NextResponse.json({ claimed, results });
  } catch (e) {
    logServerError("payments/toss/claim", e, "internal_error");
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
