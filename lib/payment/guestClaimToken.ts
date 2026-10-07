import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Claim-link token for a paid guest order (SERVER ONLY).
 *
 *   token = base64url(HMAC-SHA256(GUEST_CLAIM_TOKEN_SECRET, "<orderId>:<nonce>"))
 *
 * The nonce is random per order and stored on the order; the token itself is
 * never stored or logged. It is unguessable without the secret, expires
 * (claim_token_expires_at), and only:
 *   - identifies which order the link is about, and
 *   - lets the claim page prefill the purchase email in Clerk's sign-in /
 *     sign-up form.
 * It NEVER grants anything: the entitlement is attached only when a signed-in
 * Clerk account whose VERIFIED email equals the order email claims it
 * (claim_paid_guest_toss_order).
 *
 * The emailed link hits /api/payments/toss/claim-link, which checks the
 * token, moves it into a short-lived httpOnly cookie and redirects to the
 * claim page -- so the page URL (and anything that records page views)
 * never contains it. A new link (new nonce) can be requested; the old one
 * then stops working.
 */

export const CLAIM_TOKEN_TTL_DAYS = 30;

function secret(): string | null {
  const s = process.env.GUEST_CLAIM_TOKEN_SECRET?.trim() ?? "";
  return s.length >= 32 ? s : null;
}

export function claimTokenConfigured(): boolean {
  return secret() !== null;
}

export function newClaimNonce(): string {
  return randomBytes(18).toString("base64url");
}

export function claimTokenExpiry(from: Date = new Date()): string {
  return new Date(from.getTime() + CLAIM_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

export function claimTokenFor(orderId: string, nonce: string): string | null {
  const key = secret();
  if (!key || !nonce) return null;
  return createHmac("sha256", key).update(`${orderId}:${nonce}`).digest("base64url");
}

export function verifyClaimToken(params: {
  orderId: string;
  nonce: string | null;
  expiresAt: string | null;
  token: string | null | undefined;
  now?: Date;
}): boolean {
  if (!params.token || !params.nonce || !params.expiresAt) return false;
  if (new Date(params.expiresAt).getTime() <= (params.now ?? new Date()).getTime()) return false;
  const expected = claimTokenFor(params.orderId, params.nonce);
  if (!expected) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(params.token);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Short-lived httpOnly cookie (post-payment or after opening the emailed link) used to prefill the claim form. */
export const CLAIM_COOKIE = "aha_gclaim";
export const CLAIM_COOKIE_MAX_AGE_S = 30 * 60;
