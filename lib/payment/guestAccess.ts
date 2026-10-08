import { createHash, createHmac, randomBytes, randomInt } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { logServerError } from "@/lib/security/safeLog";

/**
 * Guest purchase verification + guest access sessions (SERVER ONLY).
 *
 * A guest can use a single Personal purchase without an account, but only
 * after proving they control the ORDER email -- on every device:
 *   - the emailed purchase link (claim-link sets a short-lived link cookie;
 *     the session is created only by an explicit POST from the page, so mail
 *     scanners / link previews that merely GET the link create nothing and
 *     use nothing), or
 *   - a 6-digit code emailed to the order email (never to an address taken
 *     from the request).
 * Either one creates a 7-day guest access session. Only hashes are stored.
 */

export const GUEST_SESSION_COOKIE = "aha_gsess";
export const GUEST_SESSION_TTL_S = 7 * 24 * 60 * 60;
/** Set by /api/payments/toss/claim-link after a valid purchase-link token. */
export const GUEST_LINK_COOKIE = "aha_glink";
export const GUEST_LINK_COOKIE_MAX_AGE_S = 30 * 60;

export const CODE_TTL_S = 10 * 60;
export const CODE_MAX_PER_HOUR = 5;
export const CODE_MAX_ATTEMPTS = 5;

function secret(): string | null {
  const s = process.env.GUEST_CLAIM_TOKEN_SECRET?.trim() ?? "";
  return s.length >= 32 ? s : null;
}

export function newVerificationCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/** Keyed hash of a code (bound to the order), or null when the secret is missing. */
export function hashVerificationCode(orderId: string, code: string): string | null {
  const key = secret();
  if (!key) return null;
  return createHmac("sha256", key).update(`code:${orderId}:${code.trim()}`).digest("hex");
}

export function newSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function sessionCookieOptions(maxAge = GUEST_SESSION_TTL_S) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

/** Creates a 7-day guest access session for an eligible guest order; returns the cookie token. */
export async function openGuestSession(
  supabase: SupabaseClient,
  orderId: string,
  via: "link" | "code",
): Promise<string | null> {
  const token = newSessionToken();
  const { data, error } = await supabase.rpc("create_guest_access_session", {
    p_order_id: orderId,
    p_session_hash: hashSessionToken(token),
    p_via: via,
    p_ttl_seconds: GUEST_SESSION_TTL_S,
  });
  if (error) {
    logServerError("guestAccess", error, "session_create_failed");
    return null;
  }
  const v = Array.isArray(data) ? (data[0] as Record<string, unknown> | string | null) : data;
  const exp = typeof v === "string" ? v : v && typeof v === "object" ? Object.values(v)[0] : null;
  return exp ? token : null;
}

/** Order id of a valid guest session token, else null. */
export async function resolveGuestSession(
  supabase: SupabaseClient,
  token: string | null | undefined,
): Promise<string | null> {
  if (!token || token.length < 20 || token.length > 100) return null;
  const { data, error } = await supabase.rpc("resolve_guest_access_session", {
    p_session_hash: hashSessionToken(token),
  });
  if (error) {
    logServerError("guestAccess", error, "session_resolve_failed");
    return null;
  }
  const v = Array.isArray(data) ? (data[0] as Record<string, unknown> | string | null) : data;
  const orderId = typeof v === "string" ? v : v && typeof v === "object" ? Object.values(v)[0] : null;
  return typeof orderId === "string" && orderId ? orderId : null;
}

export function rpcText(data: unknown): string | null {
  const v = Array.isArray(data) ? (data[0] as unknown) : data;
  if (typeof v === "string") return v;
  if (typeof v === "boolean") return String(v);
  if (v && typeof v === "object") {
    const first = Object.values(v as Record<string, unknown>)[0];
    return first === null || first === undefined ? null : String(first);
  }
  return null;
}
