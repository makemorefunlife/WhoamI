/**
 * Romantic V4 — comparison table fusion wiring (Saju base band + survey
 * correction, restored from the production compare*Composite chain).
 *
 * Exact-value characterization: cross-checks buildRomanticV4ComparisonFusion's
 * 6 rows against directly calling the same refineCompare*Pair functions V1
 * uses, for observed / partial_inference (both directions) / unobserved.
 *
 * Run: npx tsx tests/unit/romantic-v4-comparison-fusion.test.mjs
 */
import assert from "node:assert/strict";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

const { buildRomanticV4ComparisonFusion } = await import(
  "../../lib/relationship/romantic/prototypeV4/romanticV4ComparisonFusion.ts"
);
const { refineCompareConflictPair } = await import("../../lib/relationship/romantic/compareConflictComposite.ts");
const { refineCompareAffectionPair } = await import("../../lib/relationship/romantic/compareAffectionComposite.ts");
const { refineCompareStressPair } = await import("../../lib/relationship/romantic/compareStressComposite.ts");
const { refineCompareDecisionPair } = await import("../../lib/relationship/romantic/compareDecisionComposite.ts");
const { refineCompareExpressionPair } = await import("../../lib/relationship/romantic/compareExpressionComposite.ts");
const { refineCompareCommunicationPair } = await import("../../lib/relationship/romantic/compareCommunicationComposite.ts");
const { buildNeutralV2Profile } = await import("../../lib/v2/survey/neutralProfile.ts");

// Two "locked" (strong Saju), opposite-leaning people — mirrors the
// existing prototype narrative (지민: expressive/direct/action_gift/
// explosive/independent/direct; 정우: the mirror image).
const signalsA = {
  expression_style: { food_count: 3, expression_band: "expressive" },
  conflict_response: {
    officer_count: 5,
    food_count: 1,
    day_branch_tension_hits: [],
    conflict_band: "principled",
  },
  affection_language: { wealth_count: 4, seal_count: 0, affection_band: "action_gift" },
  stress_pattern: { heat_score: 80, temperature_band: "hot", stress_band: "explosive" },
  decision_making: { strength_label: "신강", decision_band: "independent" },
  communication_style: { self_count: 5, seal_count: 0, communication_band: "direct" },
};
const signalsB = {
  expression_style: { food_count: 0, expression_band: "reserved" },
  conflict_response: {
    officer_count: 1,
    food_count: 5,
    day_branch_tension_hits: [],
    conflict_band: "direct",
  },
  affection_language: { wealth_count: 0, seal_count: 4, affection_band: "emotional_care" },
  stress_pattern: { heat_score: 15, temperature_band: "cold", stress_band: "withdrawn" },
  decision_making: { strength_label: "신약", decision_band: "consultative" },
  communication_style: { self_count: 0, seal_count: 5, communication_band: "considerate" },
};

function makeProfile(overrides) {
  const base = buildNeutralV2Profile();
  return { ...base, secondary_axes: { ...base.secondary_axes, ...overrides } };
}

const profileA = makeProfile({
  conflict_style: 25,
  empathy: 30,
  self_control: 20,
  decision_style: 15,
  energy_style: 90,
  structure: 10,
});
const profileB = makeProfile({
  conflict_style: 95,
  empathy: 88,
  self_control: 92,
  decision_style: 85,
  energy_style: 5,
  structure: 97,
});

const ROW_FNS = {
  conflict: (pA, pB) =>
    refineCompareConflictPair({
      conflictA: signalsA.conflict_response,
      conflictB: signalsB.conflict_response,
      profileA: pA,
      profileB: pB,
    }),
  affection: (pA, pB) =>
    refineCompareAffectionPair({
      affectionA: signalsA.affection_language,
      affectionB: signalsB.affection_language,
      profileA: pA,
      profileB: pB,
    }),
  stress: (pA, pB) =>
    refineCompareStressPair({
      stressA: signalsA.stress_pattern,
      stressB: signalsB.stress_pattern,
      profileA: pA,
      profileB: pB,
    }),
  decision: (pA, pB) =>
    refineCompareDecisionPair({
      decisionA: signalsA.decision_making,
      decisionB: signalsB.decision_making,
      profileA: pA,
      profileB: pB,
    }),
  expression: (pA, pB) =>
    refineCompareExpressionPair({
      expressionA: signalsA.expression_style,
      expressionB: signalsB.expression_style,
      profileA: pA,
      profileB: pB,
    }),
  communication: (pA, pB) =>
    refineCompareCommunicationPair({
      communicationA: signalsA.communication_style,
      communicationB: signalsB.communication_style,
      profileA: pA,
      profileB: pB,
    }),
};

function assertRowMatchesComposite(row, expected, label) {
  assert.equal(row.leanA, expected.leanA, `${label}: leanA`);
  assert.equal(row.leanB, expected.leanB, `${label}: leanB`);
  assert.equal(row.baseA, expected.baseA, `${label}: baseA`);
  assert.equal(row.baseB, expected.baseB, `${label}: baseB`);
  assert.equal(row.flippedA, expected.flippedA, `${label}: flippedA`);
  assert.equal(row.flippedB, expected.flippedB, `${label}: flippedB`);
  assert.equal(row.align, expected.align, `${label}: align`);
  assert.equal(row.confidence, expected.confidence, `${label}: confidence`);
  assert.deepEqual(row.sajuInputsA, expected.personA.scores, `${label}: sajuInputsA`);
  assert.deepEqual(row.sajuInputsB, expected.personB.scores, `${label}: sajuInputsB`);
}

// ---------------------------------------------------------------------------
section("1) Observed (both real) — exact match against direct refineCompare*Pair calls");

const observedRows = buildRomanticV4ComparisonFusion({ signalsA, signalsB, profileA, profileB });
assert.equal(observedRows.length, 6);
for (const row of observedRows) {
  const expected = ROW_FNS[row.rowKey](profileA, profileB);
  assert.ok(expected, `${row.rowKey}: reference composite must not be null when both profiles are real`);
  assertRowMatchesComposite(row, expected, row.rowKey);
  assert.equal(row.source, "saju_plus_survey");
  assert.equal(row.personASource, "survey");
  assert.equal(row.personBSource, "survey");
}
ok("all 6 rows match direct refineCompare*Pair output field-for-field, tagged saju_plus_survey/survey");

// ---------------------------------------------------------------------------
section("2) Partial inference — A missing, B real");

const neutral = buildNeutralV2Profile();
const partialARows = buildRomanticV4ComparisonFusion({
  signalsA,
  signalsB,
  profileA: null,
  profileB,
});
for (const row of partialARows) {
  const expected = ROW_FNS[row.rowKey](neutral, profileB);
  assertRowMatchesComposite(row, expected, row.rowKey);
  assert.equal(row.source, "saju_plus_partial_survey");
  assert.equal(row.personASource, "synthetic_neutral");
  assert.equal(row.personBSource, "survey");
  // The synthetic side's neutral 50 always lands in every row's "mid" psych
  // band, which resolveCompareCompositeLean always resolves to lean=base,
  // flipped=false — a synthetic 50 must never flip the Saju base.
  assert.equal(row.baseA, row.leanA, `${row.rowKey}: synthetic side must keep Saju base (never flips)`);
  assert.equal(row.flippedA, false, `${row.rowKey}: synthetic side flippedA must be false`);
  // Pair alignment requires both sides "confirms"/"high"; the synthetic
  // side is always "caution"/"low" so the pair result is always low confidence.
  assert.equal(row.align, "caution", `${row.rowKey}: partial_inference pair align must be caution`);
  assert.equal(row.confidence, "low", `${row.rowKey}: partial_inference pair confidence must be low`);
}
ok("A missing / B real: synthetic side never flips base, pair is always caution/low, matches reference composite");

// ---------------------------------------------------------------------------
section("3) Partial inference — A real, B missing");

const partialBRows = buildRomanticV4ComparisonFusion({
  signalsA,
  signalsB,
  profileA,
  profileB: null,
});
for (const row of partialBRows) {
  const expected = ROW_FNS[row.rowKey](profileA, neutral);
  assertRowMatchesComposite(row, expected, row.rowKey);
  assert.equal(row.source, "saju_plus_partial_survey");
  assert.equal(row.personASource, "survey");
  assert.equal(row.personBSource, "synthetic_neutral");
  assert.equal(row.baseB, row.leanB, `${row.rowKey}: synthetic side must keep Saju base (never flips)`);
  assert.equal(row.flippedB, false, `${row.rowKey}: synthetic side flippedB must be false`);
  assert.equal(row.align, "caution", `${row.rowKey}: partial_inference pair align must be caution`);
  assert.equal(row.confidence, "low", `${row.rowKey}: partial_inference pair confidence must be low`);
}
ok("A real / B missing: synthetic side never flips base, pair is always caution/low, matches reference composite");

// ---------------------------------------------------------------------------
section("4) Both missing — Saju-only bands, survey refinement unavailable");

const unobservedRows = buildRomanticV4ComparisonFusion({
  signalsA,
  signalsB,
  profileA: null,
  profileB: null,
});
const expectedBands = {
  conflict: [signalsA.conflict_response.conflict_band, signalsB.conflict_response.conflict_band],
  affection: [signalsA.affection_language.affection_band, signalsB.affection_language.affection_band],
  stress: [signalsA.stress_pattern.stress_band, signalsB.stress_pattern.stress_band],
  decision: [signalsA.decision_making.decision_band, signalsB.decision_making.decision_band],
  expression: [signalsA.expression_style.expression_band, signalsB.expression_style.expression_band],
  communication: [signalsA.communication_style.communication_band, signalsB.communication_style.communication_band],
};
for (const row of unobservedRows) {
  const [bandA, bandB] = expectedBands[row.rowKey];
  assert.equal(row.leanA, bandA, `${row.rowKey}: leanA must be the raw Saju band`);
  assert.equal(row.leanB, bandB, `${row.rowKey}: leanB must be the raw Saju band`);
  assert.equal(row.baseA, bandA);
  assert.equal(row.baseB, bandB);
  assert.equal(row.flippedA, false);
  assert.equal(row.flippedB, false);
  assert.equal(row.align, null, `${row.rowKey}: no fused align without any survey`);
  assert.equal(row.confidence, "insufficient", `${row.rowKey}: survey refinement must read insufficient, not silently high/low`);
  assert.equal(row.source, "saju_only");
  assert.equal(row.personASource, "synthetic_neutral");
  assert.equal(row.personBSource, "synthetic_neutral");
}
ok("both missing: every row is the raw Saju band, align null, confidence insufficient, source saju_only");

// ---------------------------------------------------------------------------
section("5) Saju-only confidence stays intact — only the fused refinement is downgraded");

// Same Saju signals, only survey availability differs across the 4 scenarios,
// yet the *base* band (the pure Saju read) is identical in every scenario.
for (const key of Object.keys(expectedBands)) {
  const [bandA, bandB] = expectedBands[key];
  const observed = observedRows.find((r) => r.rowKey === key);
  const partialA = partialARows.find((r) => r.rowKey === key);
  const partialB = partialBRows.find((r) => r.rowKey === key);
  const unobserved = unobservedRows.find((r) => r.rowKey === key);
  assert.equal(observed.baseA, bandA);
  assert.equal(partialA.baseA, bandA);
  assert.equal(partialB.baseA, bandA);
  assert.equal(unobserved.baseA, bandA);
  assert.equal(observed.baseB, bandB);
  assert.equal(partialA.baseB, bandB);
  assert.equal(partialB.baseB, bandB);
  assert.equal(unobserved.baseB, bandB);
}
ok("Saju base band is identical across all 4 survey-availability scenarios — never downgraded by missing survey");

console.log("\nOK: romantic-v4-comparison-fusion tests passed");
