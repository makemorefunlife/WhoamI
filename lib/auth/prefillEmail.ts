"use client";

/**
 * Hands an email to the sign-in / sign-up page for Clerk's form prefill
 * without putting it in a URL (sessionStorage, this tab only, 15 minutes,
 * read once). Used by the guest-purchase claim page.
 */
const KEY = "aha.auth.prefillEmail";
const TTL_MS = 15 * 60 * 1000;

export function setAuthPrefillEmail(email: string): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ email, exp: Date.now() + TTL_MS }));
  } catch {
    /* storage unavailable: the form just starts empty */
  }
}

export function readAuthPrefillEmail(): string | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as { email?: string; exp?: number };
    if (!v.email || !v.exp || v.exp < Date.now()) {
      sessionStorage.removeItem(KEY);
      return null;
    }
    return v.email;
  } catch {
    return null;
  }
}

export function clearAuthPrefillEmail(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** Same-origin relative path from a redirect_url query value, or null. */
export function safeRelativeRedirect(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw, "https://placeholder.invalid");
    if (u.origin !== "https://placeholder.invalid" && typeof window !== "undefined" && u.origin !== window.location.origin) {
      return null;
    }
    const path = `${u.pathname}${u.search}`;
    return path.startsWith("/") && !path.startsWith("//") ? path : null;
  } catch {
    return null;
  }
}
