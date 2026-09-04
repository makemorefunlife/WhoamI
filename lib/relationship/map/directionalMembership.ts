/**
 * Directional map-membership rules (spec section 9) — wired into
 * app/api/connect/complete/route.ts (link join) and
 * app/api/connect/respond/route.ts (reciprocal accept/decline).
 *
 * The map answers "who is in MY map", and that need not be symmetric:
 * when B joins through A's personal link, B explicitly consented to
 * connecting with A — so A appears in B's map immediately. A did not
 * consent to anything about B yet, so B does NOT appear in A's map until
 * A explicitly accepts a reciprocal request.
 */

export type MembershipStatus = "pending" | "accepted" | "declined";

/**
 * The two independent membership rows created the moment someone joins
 * through a personal connect link. `owner` = whoever's personal link was
 * used; `joiner` = the person who just completed onboarding through it.
 */
export function initialMembershipsForLinkJoin(): {
  /** joiner's map -> owner: joiner explicitly opted into this by using the link. */
  joinerSeesOwner: MembershipStatus;
  /** owner's map -> joiner: owner has not agreed to anything about the joiner yet. */
  ownerSeesJoiner: MembershipStatus;
} {
  return { joinerSeesOwner: "accepted", ownerSeesJoiner: "pending" };
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
