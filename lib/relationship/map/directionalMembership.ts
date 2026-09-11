/**
 * Directional map-membership rules (spec section 9) — wired into
 * app/api/connect/complete/route.ts (link join) and
 * app/api/connect/respond/route.ts (reciprocal accept/decline, still used
 * to resolve pre-existing pending rows created before auto-connect).
 *
 * The map answers "who is in MY map". Personal-link joins are now fully
 * reciprocal and immediate: sharing your personal link IS the consent —
 * anyone who completes onboarding through it appears in both maps right
 * away, no separate accept step. (Previously the owner's side started
 * "pending" and required an explicit reciprocal accept; that gate was
 * removed by product decision — see git history on this file.)
 */

export type MembershipStatus = "pending" | "accepted" | "declined";

/**
 * The two independent membership rows created the moment someone joins
 * through a personal connect link. `owner` = whoever's personal link was
 * used; `joiner` = the person who just completed onboarding through it.
 * Both sides are accepted immediately — sharing the link is the consent.
 */
export function initialMembershipsForLinkJoin(): {
  /** joiner's map -> owner: joiner explicitly opted into this by using the link. */
  joinerSeesOwner: MembershipStatus;
  /** owner's map -> joiner: owner shared the link, which is itself consent to whoever joins through it. */
  ownerSeesJoiner: MembershipStatus;
} {
  return { joinerSeesOwner: "accepted", ownerSeesJoiner: "accepted" };
}

/**
 * The two independent membership rows created when an invite link is accepted.
 * Unlike personal connect link joins where the owner hasn't accepted yet,
 * explicit invites sent by an owner and accepted by an invitee mean BOTH
 * parties have consented to connecting.
 */
export function initialMembershipsForInviteAccept(): {
  /** Inviter sent the invite specifically for invitee -> accepted immediately */
  inviterSeesInvitee: MembershipStatus;
  /** Invitee accepted the invite -> accepted immediately */
  inviteeSeesInviter: MembershipStatus;
} {
  return { inviterSeesInvitee: "accepted", inviteeSeesInviter: "accepted" };
}

/**
 * Whether `other` should render in `viewer`'s map right now.
 *
 * `membershipStatus` is the row for (relationship_report, viewer, other) if
 * one exists; `null` means no directional membership row exists at all,
 * which happens for every connection created before this layer existed
 * (manual entries, the old symmetric invite flow). Those must keep working
 * exactly as before — only connections created through the NEW personal
 * link flow get real directional gating — so a missing row falls back to
 * `isLegacyConnection`, never to "hidden".
 */
export function isVisibleInMap(
  membershipStatus: MembershipStatus | null,
  isLegacyConnection: boolean,
): boolean {
  if (membershipStatus === "accepted") return true;
  if (membershipStatus === "pending" || membershipStatus === "declined") return false;
  return isLegacyConnection;
}

/**
 * Batch-friendly wrapper for the map's connection-list read path (spec
 * section 15) — no per-connection query. Callers pass:
 * - `membershipByRelationshipReportId`: this viewer's own membership row
 *   status for each relationship_report_id, fetched in one query.
 * - `newFlowRelationshipReportIds`: the set of relationship_report_ids that
 *   have ANY personal_connect_link_uses row (in either direction),
 *   fetched in one query — this is what distinguishes "legacy connection,
 *   no row yet" (still visible) from "new-flow connection whose row is
 *   somehow missing" (fail closed, not visible).
 */
export function isVisibleInMapBatch(
  relationshipReportId: string,
  membershipByRelationshipReportId: ReadonlyMap<string, MembershipStatus>,
  newFlowRelationshipReportIds: ReadonlySet<string>,
): boolean {
  const status = membershipByRelationshipReportId.get(relationshipReportId) ?? null;
  const isLegacyConnection = !newFlowRelationshipReportIds.has(relationshipReportId);
  return isVisibleInMap(status, isLegacyConnection);
}
