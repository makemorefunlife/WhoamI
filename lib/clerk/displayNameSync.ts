"use client";

import { getPublicDisplayName, resolveClerkDisplayName } from "@/lib/clerk/displayName";

type ClerkUserForSync =
  | {
      fullName?: string | null;
      firstName?: string | null;
      primaryEmailAddress?: { emailAddress?: string } | null;
      externalAccounts?: readonly unknown[] | null;
      publicMetadata?: Record<string, unknown> | null;
      reload?: () => Promise<unknown>;
    }
  | null
  | undefined;

/**
 * Single reusable "seed publicMetadata.displayName if missing" primitive —
 * every component that needs to seed a display name (Google auto-seed on
 * first report creation, legacy-user backfill on the results dashboard)
 * goes through this instead of each keeping its own read/POST/reload
 * logic. Never overwrites an existing value: reads first, only POSTs when
 * nothing is set yet.
 *
 * `computeFallback` lets callers choose the fallback policy (e.g. only
 * Google's own name vs. the full fullName->firstName->email->generic
 * chain) without duplicating the read-guard/POST/reload mechanics.
 */
export async function seedDisplayName(
  user: ClerkUserForSync,
  computeFallback: () => string | null,
): Promise<string | null> {
  const existing = getPublicDisplayName(user);
  if (existing) return existing;

  const fallback = computeFallback()?.trim();
  if (!fallback || fallback === "나") return null;

  try {
    const res = await fetch("/api/account/display-name", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: fallback }),
    });
    if (!res.ok) return null;
    await user?.reload?.();
    return fallback;
  } catch {
    return null;
  }
}

/** Legacy-user backfill policy — the full fallback chain, any signup method. */
export function seedDisplayNameFromClerkFallback(user: ClerkUserForSync): Promise<string | null> {
  return seedDisplayName(user, () => resolveClerkDisplayName(user));
}

/**
 * New-signup gate decision (spec: Google gets auto-seeded silently, email/
 * password gets DisplayNameSetupModal) — a name is only required from the
 * user when nothing is set yet AND there's no OAuth-provided name to seed
 * from instead. Already has a display name, or is on an OAuth account →
 * never prompt.
 */
export function shouldPromptForDisplayName(
  existingDisplayName: string | null,
  isOAuthAccount: boolean,
): boolean {
  return !existingDisplayName && !isOAuthAccount;
}
