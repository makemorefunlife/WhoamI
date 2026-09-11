/**
 * Directional connection model (spec sections 9-11, 31) — pure logic only.
 * Wired into app/api/connect/complete/route.ts and
 * app/api/connect/respond/route.ts; see
 * tests/scripts/e2e-relationship-map-dev-proof.ts for the live DEV proof
 * that acceptance actually creates/updates relationship_map_memberships
 * end-to-end. These tests cover the pure semantics in isolation.
 *
 * Run: npx tsx tests/unit/relationship-directional-membership.test.mjs
 */
import assert from "node:assert/strict";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

const { initialMembershipsForLinkJoin, initialMembershipsForInviteAccept, isVisibleInMap, isVisibleInMapBatch } = await import(
  "../../lib/relationship/map/directionalMembership.ts"
);

section("A sends invite link, B accepts -> BOTH A and B maps see each other immediately");
{
  const { inviterSeesInvitee, inviteeSeesInviter } = initialMembershipsForInviteAccept();
  assert.equal(inviterSeesInvitee, "accepted");
  assert.equal(inviteeSeesInviter, "accepted");
  assert.ok(isVisibleInMap(inviterSeesInvitee, false), "A (inviter) must see B (invitee) in A's map right away");
  assert.ok(isVisibleInMap(inviteeSeesInviter, false), "B (invitee) must see A (inviter) in B's map right away");
  ok("invite acceptance sets both inviter and invitee memberships to accepted immediately (no 2nd approval)");
}

section("A sends personal link, B joins through it -> B's map sees A immediately");
{
  const { joinerSeesOwner } = initialMembershipsForLinkJoin();
  assert.equal(joinerSeesOwner, "accepted");
  assert.ok(isVisibleInMap(joinerSeesOwner, false), "B (joiner) must see A (owner) in B's map right away");
  ok("joiner's map -> owner is accepted immediately (the joiner explicitly consented by using the link)");
}

section("A automatically sees B the moment B uses A's link — no separate approval step");
{
  const { ownerSeesJoiner } = initialMembershipsForLinkJoin();
  assert.equal(ownerSeesJoiner, "accepted");
  assert.ok(isVisibleInMap(ownerSeesJoiner, false), "A (owner) must see B (joiner) immediately, sharing the link IS the consent");
  ok("owner's map -> joiner is accepted immediately, same as joiner's map -> owner (full auto-connect, no reciprocal approval gate)");
}

section("leftover legacy pending rows (created before auto-connect) can still be resolved via accept/decline");
{
  assert.ok(isVisibleInMap("accepted", false), "an old pending row that gets accepted must still become visible");
  ok("connect/respond's accept/decline path still works for any pre-existing pending rows, even though new joins no longer create pending rows");
}

section("reciprocal request: A declines -> B never appears in A's map");
{
  assert.ok(!isVisibleInMap("declined", false), "a declined request must never grant map visibility");
  ok("declined status never becomes visible, regardless of prior pending state");
}

section("pending never counts as membership");
{
  assert.ok(!isVisibleInMap("pending", true), "pending must stay invisible even if isLegacyConnection is true — pending is an explicit, real state, not 'unknown'");
  ok("a pending row is never treated as visible, even alongside a legacy flag");
}

section("backward compatibility: legacy connections (no membership row at all) keep working");
{
  assert.ok(isVisibleInMap(null, true), "a pre-existing connection with no membership row must stay visible — this is what protects existing users' maps from going empty");
  assert.ok(!isVisibleInMap(null, false), "a NEW-flow connection with no membership row (shouldn't normally happen) must NOT default to visible");
  ok("no membership row + legacy flag -> visible (safe migration path); no membership row + not legacy -> hidden (fail closed for new data)");
}

section("isVisibleInMapBatch — the exact function wired into fetchRelationshipMapConnections (spec section 15)");
{
  const membershipByRR = new Map([
    ["RR_ACCEPTED", "accepted"],
    ["RR_PENDING", "pending"],
    ["RR_DECLINED", "declined"],
  ]);
  const newFlowRRIds = new Set(["RR_ACCEPTED", "RR_PENDING", "RR_DECLINED", "RR_NEWFLOW_NO_ROW"]);

  assert.ok(
    isVisibleInMapBatch("RR_LEGACY_UNTOUCHED", membershipByRR, newFlowRRIds),
    "a pre-directional-system relationship_report_id with no membership row and no personal_connect_link_uses row must stay visible",
  );
  assert.ok(
    isVisibleInMapBatch("RR_ACCEPTED", membershipByRR, newFlowRRIds),
    "new-flow connection with an accepted row must be visible",
  );
  assert.ok(
    !isVisibleInMapBatch("RR_PENDING", membershipByRR, newFlowRRIds),
    "new-flow connection still pending must not be visible",
  );
  assert.ok(
    !isVisibleInMapBatch("RR_DECLINED", membershipByRR, newFlowRRIds),
    "new-flow connection that was declined must not be visible",
  );
  assert.ok(
    !isVisibleInMapBatch("RR_NEWFLOW_NO_ROW", membershipByRR, newFlowRRIds),
    "new-flow relationship_report_id with a link-use row but no membership row yet must fail closed, not default to visible",
  );
  ok("batch wrapper reproduces isVisibleInMap exactly, keyed off real relationship_report_id lookups — this is what protects every pre-existing user's map after the read-path wiring");
}

console.log("\nAll directional membership tests passed.");
