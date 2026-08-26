import assert from "node:assert/strict";
import {
  buildTimingFacts,
  buildTimingCanonicalEvidence,
  buildIndividualTimingResponse,
  buildCoupleTimingModel,
} from "../../lib/saju/timing/index.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`✓ ${name}`);
}

console.log("==========================================");
console.log("Saju Psych & Couple Timing Core Unit Test Suite");
console.log("==========================================");

// Fixture Setup
const seraFacts = buildTimingFacts({
  personId: "Sera",
  birthDate: "1990-05-15",
  gender: "F",
  fromYear: 2026,
  toYear: 2028,
});
const seraCE = buildTimingCanonicalEvidence(seraFacts);

const donggeulFacts = buildTimingFacts({
  personId: "Donggeul",
  birthDate: "1992-08-20",
  gender: "M",
  fromYear: 2026,
  toYear: 2028,
});
const donggeulCE = buildTimingCanonicalEvidence(donggeulFacts);

// ---------------------------------------------------------------------------
section("1. Same Timing + Similar Psych -> Aligned Response");
const psychAdaptable = {
  primary: { adaptability: 80, stability: 30, structure: 30 },
  secondary: { decision_style: 85, self_control: 40 },
};

const respA1 = buildIndividualTimingResponse({
  timingFacts: seraFacts,
  evidencePackage: seraCE,
  psychInput: psychAdaptable,
  targetYear: 2026,
});

assert.equal(respA1.responseProfile.changeResponse?.style, "fluid_adaptation");
ok("Fluid adaptation for high adaptability verified");

// ---------------------------------------------------------------------------
section("2. Same Timing + Different Psych -> Different Response");
const psychStructured = {
  primary: { adaptability: 40, stability: 80, structure: 85 },
  secondary: { decision_style: 30, self_control: 80 },
};

const respA2 = buildIndividualTimingResponse({
  timingFacts: seraFacts,
  evidencePackage: seraCE,
  psychInput: psychStructured,
  targetYear: 2026,
});

assert.equal(respA2.responseProfile.changeResponse?.style, "controlled_structured_change");
assert.notEqual(respA1.responseProfile.changeResponse?.style, respA2.responseProfile.changeResponse?.style);
ok("Different response styles for different psych profiles under same timing verified");

// ---------------------------------------------------------------------------
section("3. High Adaptability does NOT delete change_pressure Timing Fact");
assert.ok(respA1.timingContext.structuralSignals.includes("change_pressure"));
assert.ok(respA1.evidenceRefs.includes("change_pressure_2026"));
ok("Timing fact change_pressure preserved despite high adaptability");

// ---------------------------------------------------------------------------
section("4. Sparse Psych Data -> Softer Response & Medium Interpretation Confidence");
const respSparse = buildIndividualTimingResponse({
  timingFacts: seraFacts,
  evidencePackage: seraCE,
  psychInput: undefined,
  targetYear: 2026,
});

assert.equal(respSparse.interpretationConfidence, "MEDIUM");
assert.equal(respSparse.factConfidence, "HIGH");
ok("Sparse psych input produces softer response & MEDIUM interpretation confidence");

// ---------------------------------------------------------------------------
section("5. No Good/Bad Year Labels & No Modern-Life Outcomes");
const allSummaries = [
  respA1.responseProfile.changeResponse?.summary,
  respA2.responseProfile.changeResponse?.summary,
].join(" ");

assert.ok(!allSummaries.includes("좋은 해"), "Must not contain good year fortune label");
assert.ok(!allSummaries.includes("나쁜 해"), "Must not contain bad year fortune label");
assert.ok(!allSummaries.includes("이직"), "Must not contain career prediction");
assert.ok(!allSummaries.includes("이혼"), "Must not contain divorce prediction");
ok("Zero good/bad labels & zero modern-life predictions verified");

// ---------------------------------------------------------------------------
section("6. One-Partner Daewoon Transition Ownership (Donggeul 2027 -> 2028)");
const seraResponses = [2026, 2027, 2028].map((yr) =>
  buildIndividualTimingResponse({
    timingFacts: seraFacts,
    evidencePackage: seraCE,
    psychInput: psychStructured,
    targetYear: yr,
  }),
);

const donggeulResponses = [2026, 2027, 2028].map((yr) =>
  buildIndividualTimingResponse({
    timingFacts: donggeulFacts,
    evidencePackage: donggeulCE,
    psychInput: psychAdaptable,
    targetYear: yr,
  }),
);

const pairModel = buildCoupleTimingModel({
  personAFacts: seraFacts,
  personBFacts: donggeulFacts,
  personAResponses: seraResponses,
  personBResponses: donggeulResponses,
  targetYears: [2026, 2027, 2028],
});

const pair2027 = pairModel.yearlyStates.find((y) => y.year === 2027);
const pair2028 = pairModel.yearlyStates.find((y) => y.year === 2028);

assert.equal(pair2027?.pairState, "ONE_PARTNER_TRANSITION");
assert.equal(pair2027?.primaryChangingSide, "PERSON_B");
assert.equal(pair2027?.stabilizingSide, "PERSON_A");

assert.equal(pair2028?.pairState, "ONE_PARTNER_TRANSITION");
assert.equal(pair2028?.primaryChangingSide, "PERSON_B");

ok("Donggeul 2027->2028 ONE_PARTNER_TRANSITION ownership verified");

// ---------------------------------------------------------------------------
section("7. Pair A/B Swap Safety");
const swappedPairModel = buildCoupleTimingModel({
  personAFacts: donggeulFacts,
  personBFacts: seraFacts,
  personAResponses: donggeulResponses,
  personBResponses: seraResponses,
  targetYears: [2026, 2027, 2028],
});

const swapped2027 = swappedPairModel.yearlyStates.find((y) => y.year === 2027);
assert.equal(swapped2027?.pairState, "ONE_PARTNER_TRANSITION");
assert.equal(swapped2027?.primaryChangingSide, "PERSON_A"); // Donggeul is now Person A in swapped model
assert.equal(swapped2027?.stabilizingSide, "PERSON_B");

ok("A/B swap safety verified");

// ---------------------------------------------------------------------------
section("8. Both-Partner Transition Fixture (MUTUAL_TRANSITION)");
// Create a fake fixture where both partners transition in 2027
const bothTransitionPair = buildCoupleTimingModel({
  personAFacts: donggeulFacts,
  personBFacts: donggeulFacts,
  personAResponses: donggeulResponses,
  personBResponses: donggeulResponses,
  targetYears: [2027],
});

assert.equal(bothTransitionPair.yearlyStates[0].pairState, "MUTUAL_TRANSITION");
assert.equal(bothTransitionPair.yearlyStates[0].primaryChangingSide, "BOTH");
ok("MUTUAL_TRANSITION verified when both partners transition");

// ---------------------------------------------------------------------------
section("9. Pair Provenance Preservation");
assert.ok(pair2027.personAEvidenceIds.length > 0, "Person A evidence IDs must exist");
assert.ok(pair2027.personBEvidenceIds.length > 0, "Person B evidence IDs must exist");
assert.ok(pair2027.timingEvidenceB.length > 0, "Timing evidence B must include daewoon_shift");
ok("Pair conclusion provenance preservation verified");

// ---------------------------------------------------------------------------
section("10. Multi-Year Turning Point Candidate Derivation");
assert.equal(pair2027.isTurningPointCandidate, true, "2027 must be a turning point candidate for Donggeul's transition");
assert.ok(pair2027.turningPointReason.includes("10년 주기 배경 전환"), "Reason must cite 10-year background transition");
ok("Multi-year turning point candidate derivation verified");

console.log("\n==========================================");
console.log("ALL 10 PSYCH & PAIR TIMING TESTS PASSED!");
console.log("==========================================");
