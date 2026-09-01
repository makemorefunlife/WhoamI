/**
 * "My Relationship Map" — Day-Master role engine regression tests.
 *
 * Independently re-derives the full 10x10 Ten-God matrix from the raw
 * Five-Element generation/control cycle + Yin-Yang polarity rule (NOT by
 * re-reading REF_TEN_GOD_RULES), then cross-checks:
 *   1. the canonical calculateTenGod() lookup table matches this independent
 *      derivation for all 100 (dayMaster, target) stem pairs;
 *   2. resolveDayMasterRelationshipRole() correctly wraps it into a role;
 *   3. the explicit viewer=丁(jeong) fixture from the spec;
 *   4. role(A,B) can differ from role(B,A) — the map is never symmetric.
 *
 * Run: npx tsx tests/unit/relationship-map-role-engine.test.mjs
 */
import assert from "node:assert/strict";

const { calculateTenGod } = await import("../../lib/saju/repository.ts");
const { resolveDayMasterRelationshipRole } = await import(
  "../../lib/relationship/map/resolveDayMasterRelationshipRole.ts"
);
const { getRelationshipRoleByTenGod, RELATIONSHIP_ROLES } = await import(
  "../../lib/relationship/map/relationshipRoleSsot.ts"
);

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

// Ground truth: the 10 Heavenly Stems in canonical order, each with its
// element and Yin/Yang polarity. Independent of lib/hardcoded/sajuReferenceData.ts.
const STEMS = [
  { code: "gap", element: "wood", yang: true },
  { code: "eul", element: "wood", yang: false },
  { code: "byeong", element: "fire", yang: true },
  { code: "jeong", element: "fire", yang: false },
  { code: "mu", element: "earth", yang: true },
  { code: "gi", element: "earth", yang: false },
  { code: "gyeong", element: "metal", yang: true },
  { code: "sin", element: "metal", yang: false },
  { code: "im", element: "water", yang: true },
  { code: "gye", element: "water", yang: false },
];

const GENERATES = {
  wood: "fire",
  fire: "earth",
  earth: "metal",
  metal: "water",
  water: "wood",
};
const CONTROLS = {
  wood: "earth",
  earth: "water",
  water: "fire",
  fire: "metal",
  metal: "wood",
};

/** Independently derive the Ten-God code for dayMaster -> target from raw Five-Element + Yin-Yang rules. */
function deriveTenGod(dayMaster, target) {
  const samePolarity = dayMaster.yang === target.yang;
  if (dayMaster.element === target.element) {
    return samePolarity ? "bigyeon" : "geopjae";
  }
  if (GENERATES[dayMaster.element] === target.element) {
    // dm produces target -> 식상
    return samePolarity ? "siksin" : "sanggwan";
  }
  if (GENERATES[target.element] === dayMaster.element) {
    // target produces dm -> 인성
    return samePolarity ? "pyeonin" : "jeongin";
  }
  if (CONTROLS[dayMaster.element] === target.element) {
    // dm controls target -> 재성
    return samePolarity ? "pyeonjae" : "jeongjae";
  }
  if (CONTROLS[target.element] === dayMaster.element) {
    // target controls dm -> 관성
    return samePolarity ? "pyeongwan" : "jeonggwan";
  }
  throw new Error(`unreachable stem pair: ${dayMaster.element}/${target.element}`);
}

const byCode = new Map(STEMS.map((s) => [s.code, s]));

section("100-combination matrix: calculateTenGod vs. independent derivation");
let checked = 0;
for (const dm of STEMS) {
  for (const target of STEMS) {
    const expected = deriveTenGod(dm, target);
    const actual = calculateTenGod(dm.code, target.code);
    assert.equal(
      actual,
      expected,
      `calculateTenGod(${dm.code}, ${target.code}) expected ${expected}, got ${actual}`,
    );
    checked += 1;
  }
}
assert.equal(checked, 100, "must check exactly 100 combinations");
ok(`all 100 (dayMaster, target) stem pairs match independent Five-Element/Yin-Yang derivation`);

section("resolveDayMasterRelationshipRole wraps calculateTenGod + role SSOT for all 100 pairs");
for (const dm of STEMS) {
  for (const target of STEMS) {
    const expectedTenGod = deriveTenGod(dm, target);
    const expectedRole = getRelationshipRoleByTenGod(expectedTenGod).roleId;
    const result = resolveDayMasterRelationshipRole({
      viewerDayMaster: dm.code,
      otherDayMaster: target.code,
    });
    assert.equal(result.tenGod, expectedTenGod);
    assert.equal(result.roleId, expectedRole);
  }
}
ok("resolveDayMasterRelationshipRole matches expected role for all 100 combinations");

section("explicit viewer=丁(jeong) fixture from spec");
const jeongFixture = [
  ["gap", "jeongin", "my_person"],
  ["eul", "pyeonin", "muse"],
  ["byeong", "geopjae", "spark"],
  ["jeong", "bigyeon", "twin"],
  ["mu", "sanggwan", "mic"],
  ["gi", "siksin", "couch"],
  ["gyeong", "jeongjae", "keeper"],
  ["sin", "pyeonjae", "explorer"],
  ["im", "jeonggwan", "compass"],
  ["gye", "pyeongwan", "growth_button"],
];
for (const [otherStem, tenGod, roleId] of jeongFixture) {
  const result = resolveDayMasterRelationshipRole({
    viewerDayMaster: "jeong",
    otherDayMaster: otherStem,
  });
  assert.equal(result.tenGod, tenGod, `jeong vs ${otherStem} tenGod`);
  assert.equal(result.roleId, roleId, `jeong vs ${otherStem} roleId`);
}
ok("viewer=jeong(丁) fixture matches all 10 spec rows exactly");

section("role SSOT sanity");
assert.equal(RELATIONSHIP_ROLES.length, 10, "exactly 10 canonical roles");
const tenGodSet = new Set(RELATIONSHIP_ROLES.map((r) => r.tenGod));
assert.equal(tenGodSet.size, 10, "10 distinct Ten God codes, no collisions");
ok("RELATIONSHIP_ROLES has exactly 10 entries with 10 distinct Ten God codes");

section("directional asymmetry: role(A,B) can differ from role(B,A)");
// byeong (fire, yang) viewing gap (wood, yang): wood generates fire, same
// polarity -> pyeonin -> "muse".
const forward = resolveDayMasterRelationshipRole({
  viewerDayMaster: "byeong",
  otherDayMaster: "gap",
});
// gap (wood, yang) viewing byeong (fire, yang): wood generates fire (dm
// produces target this time), same polarity -> siksin -> "couch".
const backward = resolveDayMasterRelationshipRole({
  viewerDayMaster: "gap",
  otherDayMaster: "byeong",
});
assert.equal(forward.roleId, "muse");
assert.equal(backward.roleId, "couch");
assert.notEqual(
  forward.roleId,
  backward.roleId,
  "role(byeong,gap) must differ from role(gap,byeong)",
);
ok(
  `role(byeong,gap)="${forward.roleId}" !== role(gap,byeong)="${backward.roleId}" — map is directional, never symmetric`,
);

console.log("\nAll relationship-map role engine tests passed.");
