import type { SupabaseClient } from "@supabase/supabase-js";
import { logServerError } from "@/lib/security/safeLog";

/**
 * Toss TEST payments (test_sk_ keys: no real charge) on a PUBLIC deployment
 * must never hand out real analysis credits to ordinary visitors.
 *
 *  - Local dev (no VERCEL_ENV): test payments behave like real ones, so the
 *    whole flow (payment -> email -> sign-up -> claim -> analysis) can be run.
 *  - Vercel production / preview (or TOSS_TEST_RESTRICT=true): a test order
 *    becomes an entitlement ONLY for an account on the server-side allowlist
 *    (TOSS_TEST_ALLOWLIST: Clerk user ids and/or emails, comma-separated),
 *    checked against the Clerk user id / Clerk-VERIFIED emails -- never
 *    against anything the browser sent -- and at most TOSS_TEST_GRANT_LIMIT
 *    granted test orders per account (default 3). Everyone else can still go
 *    through the payment window (e.g. the Toss review); the approved test
 *    payment is cancelled and nothing is granted.
 *
 * Live keys (live_sk_) are never affected.
 */

export function tossKeyIsTest(): boolean {
  return (process.env.TOSS_SECRET_KEY ?? "").trim().startsWith("test_");
}

export function isPublicDeployment(): boolean {
  if (process.env.TOSS_TEST_RESTRICT === "true") return true;
  const v = process.env.VERCEL_ENV;
  return v === "production" || v === "preview";
}

/** True when this order is a test order that needs the allowlist check. */
export function testOrderRestricted(isTestOrder: boolean): boolean {
  return isTestOrder && isPublicDeployment();
}

type Allowlist = { userIds: Set<string>; emails: Set<string> };

export function readTestAllowlist(): Allowlist {
  const userIds = new Set<string>();
  const emails = new Set<string>();
  for (const raw of (process.env.TOSS_TEST_ALLOWLIST ?? "").split(",")) {
    const v = raw.trim();
    if (!v) continue;
    if (v.includes("@")) emails.add(v.toLowerCase());
    else userIds.add(v);
  }
  return { userIds, emails };
}

export function testGrantLimit(): number {
  const n = Number(process.env.TOSS_TEST_GRANT_LIMIT ?? "3");
  if (!Number.isFinite(n)) return 3;
  return Math.min(Math.max(Math.trunc(n), 0), 50);
}

export type TestGrantDecision =
  | { allowed: true }
  | { allowed: false; reason: "not_allowlisted" | "limit_reached" | "lookup_failed" };

/**
 * Server-side decision for one account. `verifiedEmails` must come from
 * Clerk on the server (verification.status === "verified").
 */
export async function decideTestGrant(
  supabase: SupabaseClient,
  account: { clerkUserId: string; verifiedEmails: string[] },
): Promise<TestGrantDecision> {
  const list = readTestAllowlist();
  const listed =
    list.userIds.has(account.clerkUserId) ||
    account.verifiedEmails.some((e) => list.emails.has(e.trim().toLowerCase()));
  if (!listed) return { allowed: false, reason: "not_allowlisted" };
  const { data, error } = await supabase.rpc("count_toss_test_grants", { p_clerk_user_id: account.clerkUserId });
  if (error) {
    logServerError("toss.testMode", error, "count_failed");
    return { allowed: false, reason: "lookup_failed" };
  }
  const raw = Array.isArray(data) ? (data[0] as Record<string, unknown> | number | undefined) : data;
  const count = typeof raw === "number" ? raw : Number(Object.values((raw ?? {}) as Record<string, unknown>)[0] ?? 0);
  if (count >= testGrantLimit()) return { allowed: false, reason: "limit_reached" };
  return { allowed: true };
}

/**
 * Guest test orders on a public deployment: the checkout email is only
 * browser input, so it can at most decide whether the flow CONTINUES (a
 * purchase-guide email is sent to an allowlisted address). The entitlement
 * itself is decided later by decideTestGrant on the claiming account.
 */
export function guestEmailAllowlisted(email: string | null | undefined): boolean {
  if (!email) return false;
  return readTestAllowlist().emails.has(email.trim().toLowerCase());
}
