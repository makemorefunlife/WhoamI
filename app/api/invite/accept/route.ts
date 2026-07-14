import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Legacy mistaken create-in-accept path disabled.
 * Accept flow is /api/invite/complete after the invitee has an owned report.
 */
export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json(
    { error: "use /api/invite/complete" },
    { status: 410 },
  );
}
