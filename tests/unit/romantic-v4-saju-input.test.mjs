/**
 * Romantic V4 — real A/B birth input wiring (replaces the hardcoded
 * 지민/정우 demo pair with explicit RomanticV4PairSajuInput).
 *
 * Run: npx tsx tests/unit/romantic-v4-saju-input.test.mjs
 */
import assert from "node:assert/strict";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

const { buildActualFourCeContract } = await import(
  "../../lib/relationship/romantic/prototypeV4/buildActualFourCeContract.ts"
);
const { buildRomanticV4PrototypePayload } = await import(
  "../../lib/relationship/romantic/prototypeV4/buildRomanticV4PrototypePayload.ts"
);
const { buildNeutralV2Profile } = await import("../../lib/v2/survey/neutralProfile.ts");

function makeProfile(overrides) {
  const base = buildNeutralV2Profile();
  return { ...base, secondary_axes: { ...base.secondary_axes, ...overrides } };
}

const BIRTH_A = { birthDate: "1985-01-10", birthTime: "03:00", birthTimeUnknown: false };
const BIRTH_B = { birthDate: "1985-01-10", birthTime: "15:00", birthTimeUnknown: false };
const BIRTH_A_ALT = { birthDate: "1999-07-22", birthTime: "21:45", birthTimeUnknown: false };
const BIRTH_B_ALT = { birthDate: "2001-11-03", birthTime: "06:20", birthTimeUnknown: false };

// ---------------------------------------------------------------------------
section("1) Real mode cannot use demo Saju data");

for (const bad of [
  { mode: "real", birthA: null, birthB: BIRTH_B },
  { mode: "real", birthA: BIRTH_A, birthB: null },
  { mode: "real", birthA: null, birthB: null },
]) {
  assert.throws(
    () => buildActualFourCeContract("ko-KR", bad),
    /requires both birthA and birthB/,
    `mode real with missing birth (${JSON.stringify(bad)}) must throw, never silently use the demo pair`,
  );
}

const demo = buildActualFourCeContract("ko-KR"); // no pairSajuInput -> dev_fixture
const real = buildActualFourCeContract("ko-KR", { mode: "real", birthA: BIRTH_A, birthB: BIRTH_B });
assert.notDeepEqual(
  real.romanticSignalsA,
  demo.romanticSignalsA,
  "real mode with different birth data must not coincidentally match the demo pair's Saju signals",
);
ok("mode real throws without both birth inputs; with real birth data its Saju signals differ from the demo pair");

// ---------------------------------------------------------------------------
section("2) Dev-fixture mode is explicitly marked sample");

assert.equal(demo.pairSajuProvenance.source, "dev_fixture");
assert.equal(demo.pairSajuProvenance.isSampleData, true);
assert.equal(real.pairSajuProvenance.source, "real");
assert.equal(real.pairSajuProvenance.isSampleData, false);
ok("dev_fixture provenance is isSampleData: true; real provenance is isSampleData: false");

// ---------------------------------------------------------------------------
section("3) A/B birth inputs propagate through all CE layers");

const realAlt = buildActualFourCeContract("ko-KR", { mode: "real", birthA: BIRTH_A_ALT, birthB: BIRTH_B_ALT });
assert.notDeepEqual(real.individualCeA, realAlt.individualCeA, "individualCeA must change with birthA/B");
assert.notDeepEqual(real.individualCeB, realAlt.individualCeB, "individualCeB must change with birthA/B");
assert.notDeepEqual(real.personalCeA, realAlt.personalCeA, "personalCeA must change with birthA/B");
assert.notDeepEqual(real.personalCeB, realAlt.personalCeB, "personalCeB must change with birthA/B");
assert.notDeepEqual(real.personalRelationshipCeA, realAlt.personalRelationshipCeA);
assert.notDeepEqual(real.personalRelationshipCeB, realAlt.personalRelationshipCeB);
assert.notDeepEqual(real.pairCe, realAlt.pairCe, "pairCe must change with birthA/B");
assert.notDeepEqual(real.romanticPairLens, realAlt.romanticPairLens, "romanticPairLens must change with birthA/B");
assert.notDeepEqual(real.romanticSignalsA, realAlt.romanticSignalsA);
assert.notDeepEqual(real.romanticSignalsB, realAlt.romanticSignalsB);
ok("individualCe/personalCe/personalRelationshipCe/pairCe/romanticPairLens/romanticSignals all change with real birth input");

// ---------------------------------------------------------------------------
section("4) Changing only A's chart changes A's Saju-derived bands, and only A's");

const realBOnlyChanged = buildActualFourCeContract("ko-KR", { mode: "real", birthA: BIRTH_A, birthB: BIRTH_B_ALT });
assert.deepEqual(
  realBOnlyChanged.romanticSignalsA,
  real.romanticSignalsA,
  "changing only B's birth must not change A's Saju signals",
);
assert.notDeepEqual(
  realBOnlyChanged.romanticSignalsB,
  real.romanticSignalsB,
  "changing only B's birth must change B's Saju signals",
);

const realAOnlyChanged = buildActualFourCeContract("ko-KR", { mode: "real", birthA: BIRTH_A_ALT, birthB: BIRTH_B });
assert.deepEqual(
  realAOnlyChanged.romanticSignalsB,
  real.romanticSignalsB,
  "changing only A's birth must not change B's Saju signals",
);
assert.notDeepEqual(
  realAOnlyChanged.romanticSignalsA,
  real.romanticSignalsA,
  "changing only A's birth must change A's Saju signals",
);
ok("each person's Saju-derived signals depend only on their own birth input, not their partner's");

// ---------------------------------------------------------------------------
section("5) No identity cross-wiring: swapping birthA/birthB swaps the resulting signals");

const swapped = buildActualFourCeContract("ko-KR", { mode: "real", birthA: BIRTH_B, birthB: BIRTH_A });
assert.deepEqual(
  swapped.romanticSignalsA,
  real.romanticSignalsB,
  "swapping birthA<->birthB must swap romanticSignalsA<->romanticSignalsB exactly (person A always reflects birthA)",
);
assert.deepEqual(
  swapped.romanticSignalsB,
  real.romanticSignalsA,
  "swapping birthA<->birthB must swap romanticSignalsA<->romanticSignalsB exactly (person B always reflects birthB)",
);
ok("birthA always drives person A's signals and birthB always drives person B's — verified by an exact swap");

// ---------------------------------------------------------------------------
section("6) Real survey stays paired with the matching real person (through the full payload)");

const profileA = makeProfile({ conflict_style: 12 });
const profileB = makeProfile({ conflict_style: 88 });
const payload = buildRomanticV4PrototypePayload("complete", "ko-KR", {
  surveyInput: { mode: "real", profileA, profileB },
  pairSajuInput: { mode: "real", birthA: BIRTH_A, birthB: BIRTH_B },
});
const conflictRow = payload.comparisonTableEvidence.find((r) => r.rowKey === "conflict");
assert.equal(conflictRow.sajuInputsA.conflict_style, 12, "person A's survey axis must reach person A's comparison row");
assert.equal(conflictRow.sajuInputsB.conflict_style, 88, "person B's survey axis must reach person B's comparison row");
const structureAxisRow = payload.axisOverview.find((r) => r.axis_key === "conflict_style");
assert.equal(structureAxisRow.score_a, 12);
assert.equal(structureAxisRow.score_b, 88);
ok("profileA's axis values land on person A everywhere (axisOverview and comparisonTable), never swapped to B");

// ---------------------------------------------------------------------------
section("7) All six comparison rows are available (no undocumented drop)");

const ALL_SIX = ["conflict", "affection", "stress", "decision", "expression", "communication"];
assert.equal(payload.comparisonTableEvidence.length, 6);
for (const key of ALL_SIX) {
  assert.ok(
    payload.comparisonTableEvidence.some((r) => r.rowKey === key),
    `comparisonTableEvidence must include row ${key}`,
  );
}
assert.equal(payload.comparisonTable.length, 6, "display comparisonTable must show all 6 rows, not cap at 5");
for (const key of ALL_SIX) {
  assert.ok(
    payload.comparisonTable.some((r) => r.rowId === `compare.${key}`),
    `comparisonTable display rows must include ${key}`,
  );
}
const devPayload = buildRomanticV4PrototypePayload("complete", "ko-KR");
assert.equal(devPayload.comparisonTable.length, 6, "dev_fixture mode must also show all 6 rows, not cap at 5");
ok("all 6 rows (conflict/affection/stress/decision/expression/communication) present in both real and dev_fixture modes");

console.log("\nOK: romantic-v4-saju-input tests passed");
