import { createHmac, timingSafeEqual } from "node:crypto";
import { logServerError } from "@/lib/security/safeLog";

/**
 * Paddle webhook signature verification (Paddle Billing / Payments v2).
 *
 * The `Paddle-Signature` request header has the shape
 * `ts=<unix_seconds>;h1=<hex_hmac_sha256>`. The signed payload is the
 * literal string `${ts}:${rawBody}` -- the UNPARSED request body bytes --
 * which is why app/api/webhooks/paddle/route.ts reads req.text() and
 * never req.json() before this check runs (parsing and re-stringifying
 * would not reliably reproduce Paddle's exact byte sequence). The HMAC
 * key is the notification destination's own secret (Paddle dashboard ->
 * Developer Tools -> Notifications -> this destination; starts
 * `pdl_ntfset_...`), a DIFFERENT secret from PADDLE_SANDBOX_API_SECRET_KEY,
 * supplied here as PADDLE_SANDBOX_WEBHOOK_SECRET.
 *
 * MAX_SIGNATURE_AGE_SECONDS matches Paddle's own documented SDK default
 * exactly: "Our SDKs have a default tolerance of five seconds between the
 * timestamp and the current time" (developer.paddle.com/webhooks/about/
 * signature-verification, confirmed 2026-09-23). This is replay/staleness
 * protection at the transport layer; paddle_webhook_events
 * (claim_paddle_webhook_event) is the separate, independent idempotency
 * layer that makes an actual redelivery of a legitimate event safe to
 * re-receive.
 *
 * On using Paddle's own Node SDK (@paddle/paddle-node-sdk) instead of this
 * hand-rolled HMAC check: considered and deliberately NOT adopted here.
 * The SDK's webhooks.unmarshal() is only reachable through a fully
 * constructed `new Paddle(apiKey)` client -- it has no standalone verify
 * function -- and it returns its own typed event/entity classes, which
 * would mean rewriting every handler in app/api/webhooks/paddle/route.ts
 * against a different data shape for a signature-verification change
 * that doesn't need it. The algorithm this file implements (HMAC-SHA256
 * of `${ts}:${rawBody}`, timing-safe compare) is exactly what Paddle's
 * own docs specify step-by-step for a manual implementation, so there is
 * no correctness gap being traded away -- only a dependency. Worth
 * revisiting if this app ever adopts the SDK for other reasons (e.g. a
 * typed API client), but not as a fix bundled into this pass.
 */
const MAX_SIGNATURE_AGE_SECONDS = 5;

function parseSignatureHeader(header: string): { ts: string; h1: string } | null {
  const out: Record<string, string> = {};
  for (const part of header.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    out[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  if (!out.ts || !out.h1) return null;
  return { ts: out.ts, h1: out.h1 };
}

export function verifyPaddleWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  const secret = process.env.PADDLE_SANDBOX_WEBHOOK_SECRET;
  if (!secret) {
    logServerError("paddleWebhookVerify", null, "missing_webhook_secret");
    return false;
  }
  if (!signatureHeader) return false;

  const parsed = parseSignatureHeader(signatureHeader);
  if (!parsed) return false;

  const tsNum = Number(parsed.ts);
  if (!Number.isFinite(tsNum)) return false;
  const ageSeconds = Math.abs(Date.now() / 1000 - tsNum);
  if (ageSeconds > MAX_SIGNATURE_AGE_SECONDS) {
    logServerError("paddleWebhookVerify", null, "signature_timestamp_stale");
    return false;
  }

  let expectedBuf: Buffer;
  let actualBuf: Buffer;
  try {
    const expectedHex = createHmac("sha256", secret)
      .update(`${parsed.ts}:${rawBody}`)
      .digest("hex");
    expectedBuf = Buffer.from(expectedHex, "hex");
    actualBuf = Buffer.from(parsed.h1, "hex");
  } catch (e) {
    logServerError("paddleWebhookVerify", e, "signature_compute_failed");
    return false;
  }

  if (expectedBuf.length !== actualBuf.length) return false;
  return timingSafeEqual(expectedBuf, actualBuf);
}
