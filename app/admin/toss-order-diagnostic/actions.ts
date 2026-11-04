"use server";

import { verifyOperatorClerkIdentity } from "@/lib/security/operatorAuth";
import { lookupTossOrderDiagnostic, tossSecretConfigured, type TossOrderDiagnostic } from "@/lib/payment/tossServer";
import { tossKeyIsTest } from "@/lib/payment/tossTestMode";

/**
 * Backs the admin page's form. 2026-11-04: Clerk-identity-only
 * (verifyOperatorClerkIdentity) -- no separate secret, by explicit request,
 * since this page only reads Toss's own order record (no cancel/confirm,
 * nothing financial) and OPERATOR_CLERK_USER_IDS is the one admin allowlist
 * this site already has. Still refuses anyone not on that allowlist, and
 * still fails closed if that env var isn't configured -- see
 * lib/security/operatorAuth.ts for exactly what did and didn't change.
 */
export type OrderDiagnosticActionResult =
  // Our own auth failed (distinct from anything Toss returned).
  | { ok: false; reason: "invalid_order_id" }
  | { ok: false; reason: "operator_auth_failed"; status: 401 | 403 }
  // Our auth passed; this is what Toss's own API said.
  | {
      ok: true;
      operatorId: string;
      /** Whether the secret key configured on THIS deployment is a Toss test key or a live key. */
      keyMode: "test" | "live" | "not_configured";
      toss: TossOrderDiagnostic;
    };

export async function lookupOrderDiagnosticAction(orderId: string): Promise<OrderDiagnosticActionResult> {
  const trimmedOrderId = orderId.trim();
  if (!/^aha_[a-f0-9]{32}$/.test(trimmedOrderId)) {
    return { ok: false, reason: "invalid_order_id" };
  }

  const auth = await verifyOperatorClerkIdentity();
  if (!auth.ok) {
    return { ok: false, reason: "operator_auth_failed", status: auth.status };
  }

  const keyMode = !tossSecretConfigured() ? "not_configured" : tossKeyIsTest() ? "test" : "live";
  const toss = await lookupTossOrderDiagnostic(trimmedOrderId);
  return { ok: true, operatorId: auth.operatorId, keyMode, toss };
}
