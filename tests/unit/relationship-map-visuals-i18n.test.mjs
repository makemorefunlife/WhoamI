/**
 * "My Relationship Map" — planet visuals + locale-leakage regression tests.
 *
 * Covers the bug this session actually hit (two roles assigned the same
 * orbit angle mod 360, causing an overlapping planet in the browser) plus
 * the spec's KR/EN leakage requirement (section 53) as applied to the role
 * SSOT and the i18n catalog's new `relationshipMap` namespace.
 *
 * Run: npx tsx tests/unit/relationship-map-visuals-i18n.test.mjs
 */
import assert from "node:assert/strict";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

const HANGUL = /[가-힣]/;

const { RELATIONSHIP_ROLES } = await import(
  "../../lib/relationship/map/relationshipRoleSsot.ts"
);
const { PLANET_VISUALS, planetDiameterPx } = await import(
  "../../lib/relationship/map/planetVisuals.ts"
);
const { messagesKoKR } = await import("../../lib/i18n/messages/ko-KR.ts");
const { messagesEnUS } = await import("../../lib/i18n/messages/en-US.ts");

section("planet orbit angles never collide (mod 360)");
// 28deg is not arbitrary: live 375px QA during gap-closure caught real label
// crowding (Compass/Muse, Twin/Explorer) at ~23-27deg separation. This bar
// is set just above that observed failure point, not just above "touching."
const MIN_SEPARATION_DEG = 28;
const angles = RELATIONSHIP_ROLES.map((r) => {
  const a = PLANET_VISUALS[r.roleId].angleDeg;
  return ((a % 360) + 360) % 360;
});
for (let i = 0; i < angles.length; i++) {
  for (let j = i + 1; j < angles.length; j++) {
    const diff = Math.abs(angles[i] - angles[j]);
    const separation = Math.min(diff, 360 - diff);
    assert.ok(
      separation >= MIN_SEPARATION_DEG,
      `roles ${RELATIONSHIP_ROLES[i].roleId} and ${RELATIONSHIP_ROLES[j].roleId} are only ${separation}deg apart (angles ${angles[i]}, ${angles[j]}) — below the ${MIN_SEPARATION_DEG}deg bar that caught real 375px label crowding`,
    );
  }
}
ok(`all 10 planet orbit angles are at least ${MIN_SEPARATION_DEG}deg apart, no overlaps`);

section("planet sizing: bounded nonlinear growth (spec section 6)");
assert.equal(planetDiameterPx(0), planetDiameterPx(0), "deterministic");
const sizes = [0, 1, 2, 5, 10, 50, 100, 1000].map(planetDiameterPx);
for (let i = 1; i < sizes.length; i++) {
  assert.ok(sizes[i] >= sizes[i - 1], "size must never shrink as count grows");
}
assert.ok(sizes[sizes.length - 1] <= 108, "size must stay clamped even at 1000 people");
assert.ok(sizes[0] >= 30, "zero-count planets must still render at a visible minimum size");
ok(`sizes for [0,1,2,5,10,50,100,1000] people: ${sizes.join(", ")}px — monotonic and bounded`);

section("role SSOT: zero Korean leakage in EN fields, zero missing Korean in KR fields");
for (const role of RELATIONSHIP_ROLES) {
  assert.ok(!HANGUL.test(role.labelEn), `EN label for ${role.roleId} contains Hangul: "${role.labelEn}"`);
  assert.ok(!HANGUL.test(role.descriptionEn), `EN description for ${role.roleId} contains Hangul`);
  assert.ok(HANGUL.test(role.labelKo), `KR label for ${role.roleId} has no Hangul: "${role.labelKo}"`);
  assert.ok(HANGUL.test(role.descriptionKo), `KR description for ${role.roleId} has no Hangul`);
}
ok("all 10 roles: EN fields are Hangul-free, KR fields contain Hangul");

section("relationshipMap i18n catalog: zero Korean leakage in EN, present in KR");
const enFlat = [
  messagesEnUS.relationshipMap.title,
  messagesEnUS.relationshipMap.subtitle,
  messagesEnUS.relationshipMap.meLabel,
  messagesEnUS.relationshipMap.emptyTitle,
  messagesEnUS.relationshipMap.emptyCta,
  messagesEnUS.relationshipMap.inviteCtaTitle,
  messagesEnUS.relationshipMap.inviteCtaSubtitle,
  messagesEnUS.relationshipMap.dayMasterDisclaimer,
  messagesEnUS.relationshipMap.forMeLabel,
  messagesEnUS.relationshipMap.exploreRelationshipCta,
  messagesEnUS.relationshipMap.peopleMoreCount(3),
  messagesEnUS.relationshipMap.personCount(1),
  messagesEnUS.relationshipMap.personCount(2),
  messagesEnUS.relationshipMap.reportShare.sectionTitle,
  messagesEnUS.relationshipMap.reportShare.prompt("Alex"),
  messagesEnUS.relationshipMap.reportShare.explain("Alex"),
  messagesEnUS.relationshipMap.reportShare.shareButton("Alex"),
  messagesEnUS.relationshipMap.reportShare.reassurance,
  messagesEnUS.relationshipMap.reportShare.linkReadyTitle,
  messagesEnUS.relationshipMap.reportShare.stopSharingCta,
  messagesEnUS.relationshipMap.reportShare.stopSharingConfirm,
  messagesEnUS.relationshipMap.reportShare.stopSharingDone,
  messagesEnUS.relationshipMap.reportShare.accessDeniedTitle,
  messagesEnUS.relationshipMap.reportShare.accessDeniedBody,
  messagesEnUS.relationshipMap.reportShare.authRequiredBody,
  messagesEnUS.relationshipMap.reportShare.createFailed,
];
for (const s of enFlat) {
  assert.equal(typeof s, "string");
  assert.ok(!HANGUL.test(s), `EN catalog string contains Hangul: "${s}"`);
}
assert.equal(messagesEnUS.relationshipMap.personCount(1), "1 person");
assert.equal(messagesEnUS.relationshipMap.personCount(2), "2 people");
assert.equal(messagesEnUS.relationshipMap.personCount(28), "28 people");
ok("all relationshipMap EN strings are Hangul-free; person-count pluralizes 1 vs N");

const krFlat = [
  messagesKoKR.relationshipMap.title,
  messagesKoKR.relationshipMap.subtitle,
  messagesKoKR.relationshipMap.emptyTitle,
  messagesKoKR.relationshipMap.inviteCtaTitle,
  messagesKoKR.relationshipMap.dayMasterDisclaimer,
  messagesKoKR.relationshipMap.forMeLabel,
  messagesKoKR.relationshipMap.exploreRelationshipCta,
  messagesKoKR.relationshipMap.reportShare.sectionTitle,
  messagesKoKR.relationshipMap.reportShare.prompt("동글"),
  messagesKoKR.relationshipMap.reportShare.reassurance,
];
for (const s of krFlat) {
  assert.ok(HANGUL.test(s), `KR catalog string missing Hangul: "${s}"`);
}
assert.equal(messagesKoKR.relationshipMap.personCount(1), "1명");
assert.equal(messagesKoKR.relationshipMap.personCount(28), "28명");
ok("all relationshipMap KR strings contain Hangul; person-count is locale-correct (N명)");

console.log("\nAll relationship-map visuals/i18n tests passed.");
