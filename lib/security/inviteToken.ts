import { randomBytes } from "crypto";

/** New invite tokens: 32 bytes → 64 hex chars. */
export const INVITE_TOKEN_HEX_LENGTH = 64;

/**
 * Cryptographically secure invite token (64 hex chars).
 * Short / weak-random legacy formats must not be generated here.
 */
export function createInviteToken(): string {
  const token = randomBytes(32).toString("hex");
  if (token.length !== INVITE_TOKEN_HEX_LENGTH || !/^[0-9a-f]+$/.test(token)) {
    throw new Error("invite_token_generation_failed");
  }
  return token;
}

/** Current format only. */
export function isModernInviteToken(token: string): boolean {
  return /^[0-9a-f]{64}$/.test(token.trim());
}

/**
 * Legacy formats still accepted on complete for existing customer links.
 * Examples: prefix `invite_` plus timestamp/suffix (deprecated generation removed).
 * @deprecated accept-only; do not create.
 */
export function isLegacyInviteTokenFormat(token: string): boolean {
  const t = token.trim();
  if (!t || isModernInviteToken(t)) return false;
  return t.length >= 16 && t.length <= 128;
}

export function isAcceptableInviteToken(token: string): boolean {
  return isModernInviteToken(token) || isLegacyInviteTokenFormat(token);
}

export function maskInviteToken(token: string): string {
  const t = token.trim();
  if (t.length <= 8) return "****";
  return `${t.slice(0, 4)}…${t.slice(-2)}`;
}
