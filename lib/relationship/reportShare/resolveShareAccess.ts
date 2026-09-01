export type ShareRow = {
  status: "active" | "revoked" | string;
  recipient_report_id: string;
};

export type ShareAccessDecision =
  | { allowed: true }
  | { allowed: false; reason: "not_found" | "revoked" | "auth_required" | "wrong_user" };

/**
 * Pure recipient-authorization decision for a share token — spec section 35.
 * Deliberately has zero I/O so it can be exhaustively unit tested without a
 * database or a signed-in session: a valid token alone must never be
 * enough, only the intended recipient's own account.
 */
export function resolveShareAccess(
  share: ShareRow | null,
  requestingUserId: string | null,
  recipientReportClerkUserId: string | null,
): ShareAccessDecision {
  if (!share) return { allowed: false, reason: "not_found" };
  if (share.status !== "active") return { allowed: false, reason: "revoked" };
  if (!requestingUserId) return { allowed: false, reason: "auth_required" };
  if (!recipientReportClerkUserId || recipientReportClerkUserId !== requestingUserId) {
    return { allowed: false, reason: "wrong_user" };
  }
  return { allowed: true };
}
