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
 * MAX_SIGNATURE_AGE_SECONDS is a generous clock-skew/retry-delay
 * tolerance, not the primary replay defense -- paddle_webhook_events
 * (claim_paddle_webhook_event) is what actually makes redelivery safe.
 * This check only rejects a payload too old to plausibly be a live
 * delivery. FLAG FOR REVIEW: double-check Paddle's own currently
 * documented recommendation for this tolerance before Live/production use.
 */
const MAX_SIGNATURE_AGE_SECONDS = 5 * 60;

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
