/**
 * Toss Payments server API client (confirm / lookup / cancel). SERVER ONLY:
 * TOSS_SECRET_KEY never leaves the server. Every call has a timeout and
 * returns a typed outcome instead of throwing, so callers can tell apart:
 *
 *   ok        -- Toss returned the Payment object
 *   rejected  -- Toss answered with an error code (definitive: e.g. card
 *                declined, already processed, cancel not allowed)
 *   unknown   -- no definitive answer (timeout, network, Toss 5xx). The
 *                operation MAY have happened -- callers must reconcile
 *                (GET the payment) or retry with the SAME Idempotency-Key,
 *                never with a new one.
 *
 * Docs: https://docs.tosspayments.com/reference (confirm: POST
 * /v1/payments/confirm, cancel: POST /v1/payments/{paymentKey}/cancel,
 * lookup: GET /v1/payments/{paymentKey}). Auth: Basic base64("<secretKey>:").
 */
import { logServerError } from "@/lib/security/safeLog";

const TOSS_API_BASE = "https://api.tosspayments.com";
const TIMEOUT_MS = 20_000;

export type TossCancel = {
  cancelAmount: number;
  cancelReason: string;
  canceledAt: string;
  transactionKey: string;
  cancelStatus?: string;
};

export type TossPayment = {
  paymentKey: string;
  orderId: string;
  status: string; // READY | IN_PROGRESS | WAITING_FOR_DEPOSIT | DONE | CANCELED | PARTIAL_CANCELED | ABORTED | EXPIRED
  totalAmount: number;
  balanceAmount: number;
  currency: string;
  method: string | null;
  approvedAt: string | null;
  cancels: TossCancel[];
  /** Toss's own receipt page (payment.receipt.url), when provided. */
  receiptUrl?: string | null;
};

export type TossResult =
  | { kind: "ok"; payment: TossPayment }
  | { kind: "rejected"; httpStatus: number; code: string; message: string }
  | { kind: "unknown"; reason: string };

/**
 * 2026-11-04: USD (foreign-easy-pay/PayPal) orders use a SEPARATE key pair
 * (TOSS_USD_CLIENT_KEY / TOSS_USD_SECRET_KEY) issued by Toss for the
 * specifically-contracted foreign-easy-pay MID -- not the general
 * TOSS_SECRET_KEY, which KR (KRW) keeps using exactly as before. Deliberately
 * NO fallback to the general key for USD: if the USD-specific key isn't
 * configured, USD calls must fail closed (tossSecretConfigured(currency)
 * reports false) rather than silently hit the wrong MID again, which is
 * exactly the bug this split fixes.
 */
function secretKeyFor(currency: string): string {
  if (currency === "USD") return process.env.TOSS_USD_SECRET_KEY?.trim() ?? "";
  return process.env.TOSS_SECRET_KEY?.trim() ?? "";
}

export function tossSecretConfigured(currency: string = "KRW"): boolean {
  return Boolean(secretKeyFor(currency));
}

function authHeader(currency: string): string {
  return `Basic ${Buffer.from(`${secretKeyFor(currency)}:`).toString("base64")}`;
}

function parsePayment(body: unknown): TossPayment | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (typeof b.paymentKey !== "string" || typeof b.orderId !== "string" || typeof b.status !== "string") {
    return null;
  }
  const cancels = Array.isArray(b.cancels)
    ? (b.cancels as Record<string, unknown>[]).map((c) => ({
        cancelAmount: Number(c.cancelAmount ?? 0),
        cancelReason: String(c.cancelReason ?? ""),
        canceledAt: String(c.canceledAt ?? ""),
        transactionKey: String(c.transactionKey ?? ""),
        cancelStatus: typeof c.cancelStatus === "string" ? c.cancelStatus : undefined,
      }))
    : [];
  return {
    paymentKey: b.paymentKey,
    orderId: b.orderId,
    status: b.status,
    totalAmount: Number(b.totalAmount ?? 0),
    balanceAmount: Number(b.balanceAmount ?? 0),
    currency: typeof b.currency === "string" ? b.currency : "KRW",
    method: typeof b.method === "string" ? b.method : null,
    approvedAt: typeof b.approvedAt === "string" ? b.approvedAt : null,
    receiptUrl:
      b.receipt && typeof b.receipt === "object" && typeof (b.receipt as Record<string, unknown>).url === "string"
        ? ((b.receipt as Record<string, unknown>).url as string)
        : null,
    cancels,
  };
}

async function call(
  path: string,
  init: { method: "GET" | "POST"; body?: unknown; idempotencyKey?: string },
  currency: string = "KRW",
): Promise<TossResult> {
  if (!tossSecretConfigured(currency)) return { kind: "unknown", reason: "toss_secret_not_configured" };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const headers: Record<string, string> = { Authorization: authHeader(currency) };
    if (init.body !== undefined) headers["Content-Type"] = "application/json";
    if (init.idempotencyKey) headers["Idempotency-Key"] = init.idempotencyKey;
    const res = await fetch(`${TOSS_API_BASE}${path}`, {
      method: init.method,
      headers,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      signal: controller.signal,
      cache: "no-store",
    });
    const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    if (res.ok) {
      const payment = parsePayment(json);
      return payment ? { kind: "ok", payment } : { kind: "unknown", reason: "unparseable_response" };
    }
    if (res.status >= 500) {
      return { kind: "unknown", reason: `toss_http_${res.status}` };
    }
    return {
      kind: "rejected",
      httpStatus: res.status,
      code: typeof json?.code === "string" ? json.code : `HTTP_${res.status}`,
      message: typeof json?.message === "string" ? json.message : "",
    };
  } catch (e) {
    logServerError("toss.api", e, "request_failed");
    return { kind: "unknown", reason: controller.signal.aborted ? "timeout" : "network_error" };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Approves a payment the buyer authorized in the payment window.
 * Idempotency-Key = orderId. `currency` (default "KRW") picks the key pair
 * -- always pass the order's own currency so a USD order is confirmed
 * against the foreign-easy-pay key, never the general one.
 */
export function confirmTossPayment(
  params: {
    paymentKey: string;
    orderId: string;
    amount: number;
  },
  currency: string = "KRW",
): Promise<TossResult> {
  return call(
    "/v1/payments/confirm",
    {
      method: "POST",
      body: { paymentKey: params.paymentKey, orderId: params.orderId, amount: params.amount },
      idempotencyKey: `confirm-${params.orderId}`,
    },
    currency,
  );
}

export function getTossPayment(paymentKey: string, currency: string = "KRW"): Promise<TossResult> {
  return call(`/v1/payments/${encodeURIComponent(paymentKey)}`, { method: "GET" }, currency);
}

export type TossOrderDiagnostic =
  | {
      kind: "found";
      mId: string | null;
      status: string | null;
      method: string | null;
      currency: string | null;
      totalAmount: number | null;
      requestedAt: string | null;
      approvedAt: string | null;
      /** Toss's own failure detail -- usually more specific than the generic failUrl code/message. */
      failure: { code: string; message: string } | null;
    }
  | { kind: "not_found" }
  | { kind: "error"; httpStatus: number; code: string; message: string }
  | { kind: "unknown"; reason: string };

/**
 * One-off diagnostic lookup, separate from the confirm/cancel machinery
 * above on purpose: GET /v1/payments/orders/{orderId} can return a record
 * for an order that never reached DONE (status ABORTED/EXPIRED with a
 * `failure` object), which parsePayment()'s strict required-paymentKey shape
 * isn't meant to represent. Never called from the money-moving paths --
 * only from the operator-only lookup route for triaging a stuck checkout.
 */
export async function lookupTossOrderDiagnostic(
  orderId: string,
  currency: string = "KRW",
): Promise<TossOrderDiagnostic> {
  if (!tossSecretConfigured(currency)) return { kind: "unknown", reason: "toss_secret_not_configured" };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${TOSS_API_BASE}/v1/payments/orders/${encodeURIComponent(orderId)}`, {
      method: "GET",
      headers: { Authorization: authHeader(currency) },
      signal: controller.signal,
      cache: "no-store",
    });
    const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    if (res.status === 404) return { kind: "not_found" };
    if (!res.ok) {
      return {
        kind: "error",
        httpStatus: res.status,
        code: typeof json?.code === "string" ? json.code : `HTTP_${res.status}`,
        message: typeof json?.message === "string" ? json.message : "",
      };
    }
    if (!json) return { kind: "unknown", reason: "unparseable_response" };
    const failure =
      json.failure && typeof json.failure === "object"
        ? {
            code: String((json.failure as Record<string, unknown>).code ?? ""),
            message: String((json.failure as Record<string, unknown>).message ?? ""),
          }
        : null;
    return {
      kind: "found",
      mId: typeof json.mId === "string" ? json.mId : null,
      status: typeof json.status === "string" ? json.status : null,
      method: typeof json.method === "string" ? json.method : null,
      currency: typeof json.currency === "string" ? json.currency : null,
      totalAmount: typeof json.totalAmount === "number" ? json.totalAmount : null,
      requestedAt: typeof json.requestedAt === "string" ? json.requestedAt : null,
      approvedAt: typeof json.approvedAt === "string" ? json.approvedAt : null,
      failure,
    };
  } catch (e) {
    logServerError("toss.orderDiagnostic", e, "request_failed");
    return { kind: "unknown", reason: controller.signal.aborted ? "timeout" : "network_error" };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Full (cancelAmount omitted) or partial cancel. The same idempotencyKey
 * must be reused for every retry of the same logical refund -- Toss then
 * returns the original result for 15 days instead of cancelling again.
 */
export function cancelTossPayment(
  params: {
    paymentKey: string;
    cancelReason: string;
    cancelAmount?: number;
    idempotencyKey: string;
  },
  currency: string = "KRW",
): Promise<TossResult> {
  const body: Record<string, unknown> = { cancelReason: params.cancelReason.slice(0, 200) };
  if (params.cancelAmount !== undefined) body.cancelAmount = params.cancelAmount;
  return call(
    `/v1/payments/${encodeURIComponent(params.paymentKey)}/cancel`,
    {
      method: "POST",
      body,
      idempotencyKey: params.idempotencyKey,
    },
    currency,
  );
}

/** Finds a cancel we issued, identified by the unique tag in its cancelReason. */
export function findCancelByTag(payment: TossPayment, tag: string): TossCancel | null {
  return payment.cancels.find((c) => c.cancelReason.includes(tag)) ?? null;
}
