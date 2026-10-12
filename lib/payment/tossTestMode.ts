import type { SupabaseClient } from "@supabase/supabase-js";

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
 *    against anything the browser sent. Everyone else can still go
 *    through the payment window (e.g. the Toss review); nothing is granted.
 *    (This allowlist mode is now optional -- see testAllowlistRequired.)
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

/**
 * 2026-10-12 policy: on the public site EVERYONE may complete a Toss TEST
 * purchase and use it (members get the pass, guests use it after proving the
 * purchase email). The allowlist is no longer required; set
 * TOSS_TEST_ALLOWLIST_REQUIRED=true to go back to allowlisted testers only.
 * There is no cumulative cap on test purchases (2026-10-12: the old
 * "3 per account / email" cap was never requested and is removed). Each order
 * is still granted / used at most once, and guests prove the purchase (buyer
 * cookie in the paying browser, emailed link or code elsewhere).
 */
export function testAllowlistRequired(): boolean {
  return process.env.TOSS_TEST_ALLOWLIST_REQUIRED?.trim() === "true";
}

/** Guest test order may continue (use still needs the purchase proof). */
export function guestTestBuyerAllowed(email: string | null | undefined): boolean {
  if (!email) return false;
  return testAllowlistRequired() ? guestEmailAllowlisted(email) : true;
}

export type TestGrantDecision =
  | { allowed: true }
  | { allowed: false; reason: "not_allowlisted" };

/**
 * Server-side decision for one account. `verifiedEmails` must come from
 * Clerk on the server (verification.status === "verified").
 */
export async function decideTestGrant(
  _supabase: SupabaseClient,
  account: { clerkUserId: string; verifiedEmails: string[] },
): Promise<TestGrantDecision> {
  const list = readTestAllowlist();
  const listed =
    list.userIds.has(account.clerkUserId) ||
    account.verifiedEmails.some((e) => list.emails.has(e.trim().toLowerCase()));
  if (testAllowlistRequired() && !listed) return { allowed: false, reason: "not_allowlisted" };
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
