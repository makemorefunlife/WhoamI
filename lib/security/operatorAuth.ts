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

export async function requireOperator(req: Request): Promise<OperatorAuthResult> {
  const expected = process.env.OPERATOR_API_SECRET?.trim() ?? "";
  const allow = (process.env.OPERATOR_CLERK_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (expected.length < 24 || allow.length === 0) return { ok: false, status: 403 };

  const got = req.headers.get("x-operator-secret")?.trim() ?? "";
  if (!got || !secretMatches(got, expected)) return { ok: false, status: 401 };

  const { userId } = await auth();
  if (!userId) return { ok: false, status: 401 };
  if (!allow.includes(userId)) return { ok: false, status: 403 };
  return { ok: true, operatorId: userId };
}
