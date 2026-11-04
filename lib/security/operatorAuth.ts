import { timingSafeEqual } from "node:crypto";
import { auth } from "@clerk/nextjs/server";

/**
 * Operator-only API guard (refunds etc.). BOTH must hold:
 *  1. the caller is signed in with a Clerk user id listed in
 *     OPERATOR_CLERK_USER_IDS (comma-separated), and
 *  2. the request carries x-operator-secret === OPERATOR_API_SECRET
 *     (>= 24 chars), compared in constant time.
 * Either env var missing -> every request is refused (fail closed).
 */
export type OperatorAuthResult = { ok: true; operatorId: string } | { ok: false; status: 401 | 403 };

function secretMatches(got: string, expected: string): boolean {
  const a = Buffer.from(got);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * The actual two-factor check, independent of HOW the secret arrived (a
 * request header for the existing admin API routes, or a form field for a
 * Server Action -- see verifyOperatorCredentials). Both callers must hold:
 * the caller is signed in with a Clerk user id listed in
 * OPERATOR_CLERK_USER_IDS, AND the supplied secret matches
 * OPERATOR_API_SECRET (>= 24 chars), compared in constant time. Either env
 * var missing -> every caller is refused (fail closed).
 */
async function checkOperator(secret: string): Promise<OperatorAuthResult> {
  const expected = process.env.OPERATOR_API_SECRET?.trim() ?? "";
  const allow = (process.env.OPERATOR_CLERK_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (expected.length < 24 || allow.length === 0) return { ok: false, status: 403 };

  const got = secret.trim();
  if (!got || !secretMatches(got, expected)) return { ok: false, status: 401 };

  const { userId } = await auth();
  if (!userId) return { ok: false, status: 401 };
  if (!allow.includes(userId)) return { ok: false, status: 403 };
  return { ok: true, operatorId: userId };
}

/** Existing admin API routes: secret comes from the x-operator-secret request header. */
export async function requireOperator(req: Request): Promise<OperatorAuthResult> {
  return checkOperator(req.headers.get("x-operator-secret") ?? "");
}

/**
 * Server Actions have no request headers to read -- the secret comes from
 * a form field instead (a password input on the admin page, submitted
 * fresh on every lookup; never hardcoded in client code, never stored).
 * Same two factors, same fail-closed behavior as requireOperator.
 */
export async function verifyOperatorCredentials(secret: string): Promise<OperatorAuthResult> {
  return checkOperator(secret);
}
