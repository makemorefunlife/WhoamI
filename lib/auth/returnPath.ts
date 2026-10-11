/**
 * One rule for "where to go back to" after sign-in, sign-up, KR terms
 * consent or a missing-info step (2026-10-11).
 *
 * - Only an internal path is accepted ("/x..."): no scheme, no host, no
 *   "//" or "\" tricks, no control characters or whitespace.
 * - Auth / consent / callback pages and API routes are never a target (no
 *   loops, no open endpoints) -- except the continue route itself, which is
 *   how every return goes through the SERVER check (app/api/auth/continue).
 * - The caller passes the path already localized (href(...)), so the locale
 *   (/kr) and the original purpose (query: orderId, token, reportId, ...)
 *   are kept as they were.
 */
const BLOCKED_ROOTS = [
  "/api",
  "/sign-in",
  "/sign-up",
  "/sso-callback",
  "/onboarding/legal-consent",
  "/kr/sign-in",
  "/kr/sign-up",
  "/kr/sso-callback",
  "/kr/onboarding/legal-consent",
  "/_next",
];

export const CONTINUE_ROUTE = "/api/auth/continue";
export const RETURN_QUERY_KEY = "next";

export function sanitizeReturnPath(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (!value || value.length > 1024) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (/[\\\s\u0000-\u001f\u007f]/.test(value)) return null;
  let parsed: URL;
  try {
    parsed = new URL(value, "https://return.invalid");
  } catch {
    return null;
  }
  if (parsed.origin !== "https://return.invalid") return null;
  const path = parsed.pathname;
  if (BLOCKED_ROOTS.some((root) => path === root || path.startsWith(`${root}/`))) {
    return null;
  }
  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

/**
 * URL that returns to `path` through the server check. Use it as Clerk's
 * redirect target and after the KR consent page. Invalid input -> home.
 */
export function continueHref(path: string | null | undefined, fallback = "/"): string {
  const safe = sanitizeReturnPath(path) ?? sanitizeReturnPath(fallback) ?? "/";
  return `${CONTINUE_ROUTE}?to=${encodeURIComponent(safe)}`;
}

/** Current page (path + query) as a return target, on the client. */
export function currentReturnPath(): string {
  if (typeof window === "undefined") return "/";
  return `${window.location.pathname}${window.location.search}`;
}
