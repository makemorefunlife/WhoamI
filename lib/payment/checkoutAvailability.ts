/**
 * Who may start a checkout right now.
 *
 * The public payment provider is being replaced (the previous merchant
 * application was rejected). Until the replacement is approved, the
 * existing SANDBOX checkout stays wired end-to-end (purchase selector ->
 * sandbox checkout -> /api/pricing/checkout/complete -> webhook backstop ->
 * credit grant -> analysis) but is only open to internal QA accounts.
 * Everyone else sees the localized "Purchasing is temporarily unavailable"
 * state. Nothing here touches existing credits, memberships or reports.
 *
 * Server-only env CHECKOUT_QA_USER_IDS:
 *   - comma-separated Clerk user ids -> only those users may check out
 *   - "*"                            -> every signed-in user (the pre-
 *                                       2026-09-29 public sandbox beta)
 *   - unset / empty                  -> nobody (safe default)
 *
 * Enforced server-side in /api/pricing/checkout/{prepare,complete},
 * /api/beta/checkout/complete and the webhook's new-purchase grant;
 * /api/pricing/checkout/availability only mirrors it for the UI.
 */

/** Machine-readable error code returned by checkout API routes when the caller may not check out. */
export const PURCHASE_UNAVAILABLE_CODE = "purchase_unavailable";

export function parseCheckoutQaUserIds(raw: string | undefined | null): { all: boolean; ids: Set<string> } {
  const parts = (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return { all: parts.includes("*"), ids: new Set(parts.filter((p) => p !== "*")) };
}

export function isCheckoutAllowedForUser(
  userId: string | null | undefined,
  raw: string | undefined | null = process.env.CHECKOUT_QA_USER_IDS,
): boolean {
  if (!userId) return false;
  const { all, ids } = parseCheckoutQaUserIds(raw);
  return all || ids.has(userId);
}
