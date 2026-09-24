import { logServerError, logServerEvent } from "@/lib/security/safeLog";

const PADDLE_SANDBOX_BASE = "https://sandbox-api.paddle.com";

export type PaddleTransaction = {
  id: string;
  status: string;
  currency_code: string;
  custom_data: Record<string, unknown> | null;
  items: { price?: { id?: string } | null; price_id?: string }[];
  /**
   * Present when this transaction belongs to a subscription (e.g. the US
   * Annual membership's initial purchase or a later renewal transaction) --
   * read from Paddle's own re-fetched transaction record, never trusted
   * from the client. Used to link memberships.paddle_subscription_id.
   */
  subscription_id?: string | null;
};

/**
 * Server-side-only transaction lookup — never trust the client's own
 * "checkout completed" event for anything that grants credit. This is the
 * one place PADDLE_SANDBOX_API_SECRET_KEY is used; it never reaches the
 * client. Sandbox-only by design for this Beta (no live/production Paddle
 * key exists in this app yet).
 */
// Paddle's transaction-status API can briefly lag behind the client-side
// checkout.completed event (eventual consistency). These control how many
// times -- and how long we wait between tries -- we re-check before giving
// up on a transaction that fetched successfully but isn't "completed" yet.
const TRANSACTION_STATUS_RETRY_ATTEMPTS = 3;
const TRANSACTION_STATUS_RETRY_DELAY_MS = 900;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchPaddleSandboxTransaction(
  transactionId: string,
): Promise<PaddleTransaction | null> {
  const key = process.env.PADDLE_SANDBOX_API_SECRET_KEY;
  if (!key) {
    logServerError("paddleSandboxClient.fetchTransaction", null, "missing_api_key");
    return null;
  }
  try {
    let txn: PaddleTransaction | null = null;
    for (let attempt = 1; attempt <= TRANSACTION_STATUS_RETRY_ATTEMPTS; attempt++) {
      const res = await fetch(`${PADDLE_SANDBOX_BASE}/transactions/${encodeURIComponent(transactionId)}`, {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (!res.ok) {
        // Diagnostic-only addition: previously this branch failed silently,
        // making it indistinguishable in logs from missing_api_key or
        // network_error. Mirrors the existing paddle_api_error_${status}
        // pattern already used below in cancelPaddleSandboxSubscription.
        // Not retried -- an API/auth error won't resolve itself on a retry.
        logServerError(
          "paddleSandboxClient.fetchTransaction",
          null,
          `paddle_api_error_${res.status}`,
        );
        return null;
      }
      const body = (await res.json()) as { data?: PaddleTransaction };
      txn = body.data ?? null;
      // Temporary diagnostic-only addition: logs each retry attempt's
      // outcome so we can see, from Vercel logs alone, whether the retry
      // loop is actually iterating and what status Paddle is returning at
      // each step. No effect on control flow -- remove once the 409
      // eventual-consistency question is settled.
      logServerEvent("paddleSandboxClient.fetchTransaction", "retry_attempt", {
        attempt,
        status: txn?.status ?? "no_data",
      });
      // Only retry the "fetched fine but not completed yet" case -- the
      // caller's own completed-status check (and everything else about the
      // purchase-approval logic) is unchanged, we're just more patient
      // before handing back the final answer.
      if (txn && txn.status === "completed") {
        return txn;
      }
      if (attempt < TRANSACTION_STATUS_RETRY_ATTEMPTS) {
        await delay(TRANSACTION_STATUS_RETRY_DELAY_MS);
      }
    }
    return txn;
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

export type PaddleSubscription = {
  id: string;
  status: string;
  canceled_at?: string | null;
  scheduled_change?: { action: string; effective_at: string; resume_at: string | null } | null;
  current_billing_period?: { starts_at: string; ends_at: string } | null;
};

/**
 * Cancels a Paddle Sandbox subscription server-side. Two distinct calling
 * contexts use this with two different `effectiveFrom` values:
 *  - The member-initiated cancel API (app/api/account/membership/cancel)
 *    uses "next_billing_period" -- the member keeps access through the
 *    term they already paid for, matching refundPolicy.ts's existing,
 *    unchanged promise ("you will retain access ... until the end of your
 *    current billing cycle").
 *  - Account deletion (app/api/account/delete) uses "immediately" --
 *    there is no account left to use any remaining term, so the
 *    subscription is stopped from billing again right away rather than
 *    left to cancel itself out at a term end nobody will ever see.
 *
 * Never called from the client -- PADDLE_SANDBOX_API_SECRET_KEY never
 * leaves the server, same trust boundary as fetchPaddleSandboxTransaction.
 */
export async function cancelPaddleSandboxSubscription(
  subscriptionId: string,
  effectiveFrom: "next_billing_period" | "immediately",
): Promise<PaddleSubscription | null> {
  const key = process.env.PADDLE_SANDBOX_API_SECRET_KEY;
  if (!key) {
    logServerError("paddleSandboxClient.cancelSubscription", null, "missing_api_key");
    return null;
  }
  try {
    const res = await fetch(
      `${PADDLE_SANDBOX_BASE}/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ effective_from: effectiveFrom }),
      },
    );
    if (!res.ok) {
      logServerError(
        "paddleSandboxClient.cancelSubscription",
        null,
        `paddle_api_error_${res.status}`,
      );
      return null;
    }
    const body = (await res.json()) as { data?: PaddleSubscription };
    return body.data ?? null;
  } catch (e) {
    logServerError("paddleSandboxClient.cancelSubscription", e, "network_error");
    return null;
  }
}
