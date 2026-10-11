import { NextResponse } from "next/server";
import { sanitizeReturnPath } from "@/lib/auth/returnPath";

/**
 * Server-side return after sign-in / sign-up / KR consent:
 * GET /api/auth/continue?to=<internal path>. Anything that is not a safe
 * internal path (external URL, //host, \ tricks, auth pages, API routes)
 * goes to the home page instead. Never redirects off-site.
 */
export function GET(req: Request) {
  const url = new URL(req.url);
  const safe = sanitizeReturnPath(url.searchParams.get("to"));
  const target = new URL(safe ?? "/", url.origin);
  const res = NextResponse.redirect(target, 303);
  res.headers.set("Cache-Control", "no-store");
  return res;
}
