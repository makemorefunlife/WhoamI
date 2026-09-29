import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isCheckoutAllowedForUser } from "@/lib/payment/checkoutAvailability";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * UI hint only: may the signed-in user start a checkout (QA allowlist, see
 * lib/payment/checkoutAvailability.ts)? The real gate is enforced again in
 * the checkout prepare/complete routes and the webhook.
 */
export async function GET() {
  try {
    const { userId } = await auth();
    return NextResponse.json({ available: isCheckoutAllowedForUser(userId) });
  } catch {
    return NextResponse.json({ available: false });
  }
}
