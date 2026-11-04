"use server";

import { verifyOperatorCredentials } from "@/lib/security/operatorAuth";
import { lookupTossOrderDiagnostic, tossSecretConfigured, type TossOrderDiagnostic } from "@/lib/payment/tossServer";
import { tossKeyIsTest } from "@/lib/payment/tossTestMode";

/**
 * Backs the admin page's form -- never called with a raw secret embedded in
 * client code; the operator types it into a password field on every lookup
 * (same two-factor check as the existing requireOperator admin API routes,
 * just sourced from a form field instead of a request header -- see
 * lib/security/operatorAuth.ts).
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

export async function lookupOrderDiagnosticAction(
  orderId: string,
  operatorSecret: string,
): Promise<OrderDiagnosticActionResult> {
  const trimmedOrderId = orderId.trim();
  if (!/^aha_[a-f0-9]{32}$/.test(trimmedOrderId)) {
    return { ok: false, reason: "invalid_order_id" };
  }

  const auth = await verifyOperatorCredentials(operatorSecret);
  if (!auth.ok) {
    return { ok: false, reason: "operator_auth_failed", status: auth.status };
  }

  const keyMode = !tossSecretConfigured() ? "not_configured" : tossKeyIsTest() ? "test" : "live";
  const toss = await lookupTossOrderDiagnostic(trimmedOrderId);
  return { ok: true, operatorId: auth.operatorId, keyMode, toss };
}
