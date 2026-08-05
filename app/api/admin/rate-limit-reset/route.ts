import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  isSelfResetableRateLimitBucket,
  peekRateLimitBucketStatus,
  resetOwnRateLimitBucket,
  type SelfResetableRateLimitBucket,
} from "@/lib/security/rateLimit";

export const runtime = "nodejs";

/**
 * Operational self-reset for the caller's own rate-limit bucket.
 * Requires:
 * - Clerk auth (subject = auth user only; never accepts another user id)
 * - RATE_LIMIT_RESET_SECRET via x-rate-limit-reset-secret header
 * Does not log subjects or Upstash credentials.
 */
function secretOk(req: Request): boolean {
  const expected = process.env.RATE_LIMIT_RESET_SECRET?.trim() ?? "";
  if (!expected || expected.length < 16) return false;
  const got = req.headers.get("x-rate-limit-reset-secret")?.trim() ?? "";
  return got.length > 0 && got === expected;
}

export async function GET(req: Request) {
  if (!secretOk(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const bucket = new URL(req.url).searchParams.get("bucket")?.trim() ?? "";
  if (!isSelfResetableRateLimitBucket(bucket)) {
    return NextResponse.json({ error: "bucket not resetable" }, { status: 400 });
  }

  const status = await peekRateLimitBucketStatus(bucket, userId);
  if (!status) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    bucket: status.bucket,
    max: status.max,
    windowSec: status.windowSec,
    retryAfterSec: status.retryAfterSec,
    limited: status.limited,
  });
}

export async function POST(req: Request) {
  if (!secretOk(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    bucket?: string;
    /** Ignored — never used; subject is always auth().userId */
    userId?: string;
  };
  const bucket = body.bucket?.trim() ?? "";
  if (!isSelfResetableRateLimitBucket(bucket)) {
    return NextResponse.json({ error: "bucket not resetable" }, { status: 400 });
  }

  // Explicitly ignore any client-supplied userId — own subject only.
  void body.userId;

  const result = await resetOwnRateLimitBucket(
    bucket as SelfResetableRateLimitBucket,
    userId,
  );
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  console.error("[rate-limit]", "self_reset_ok", `bucket=${bucket}`);
  return NextResponse.json({ ok: true, bucket });
}
