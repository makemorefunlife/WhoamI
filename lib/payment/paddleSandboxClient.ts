import { logServerError } from "@/lib/security/safeLog";

const PADDLE_SANDBOX_BASE = "https://sandbox-api.paddle.com";

export type PaddleTransaction = {
  id: string;
  status: string;
  currency_code: string;
  custom_data: Record<string, unknown> | null;
  items: { price?: { id?: string } | null; price_id?: string }[];
};

/**
 * Server-side-only transaction lookup — never trust the client's own
 * "checkout completed" event for anything that grants credit. This is the
 * one place PADDLE_SANDBOX_API_SECRET_KEY is used; it never reaches the
 * client. Sandbox-only by design for this Beta (no live/production Paddle
 * key exists in this app yet).
 */
export async function fetchPaddleSandboxTransaction(
  transactionId: string,
): Promise<PaddleTransaction | null> {
  const key = process.env.PADDLE_SANDBOX_API_SECRET_KEY;
  if (!key) {
    logServerError("paddleSandboxClient.fetchTransaction", null, "missing_api_key");
    return null;
  }
  try {
    const res = await fetch(`${PADDLE_SANDBOX_BASE}/transactions/${encodeURIComponent(transactionId)}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: PaddleTransaction };
    return body.data ?? null;
  } catch (e) {
    logServerError("paddleSandboxClient.fetchTransaction", e, "network_error");
    return null;
  }
}

export function transactionPriceIds(txn: PaddleTransaction): string[] {
  return txn.items
    .map((item) => item.price?.id ?? item.price_id)
    .filter((id): id is string => Boolean(id));
}
