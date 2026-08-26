import { buildMarriageChapter07Intelligence } from "../../lib/relationship/marriage/marriageChapter07Intelligence.ts";
import assert from "node:assert";

console.log("==========================================");
console.log("Marriage Chapter 07 Final IA Unit Test Suite");
console.log("==========================================");

// Sample Fixtures
const countsSera = { "정인": 2, "정관": 2, "비견": 1 };
const countsDonggeul = { "식신": 2, "상관": 1, "비견": 2 };

const psychSera = {
  secondary_axes: {
    conflict_style: 65,
    self_control: 60,
    resilience: 70,
    thinking_style: 75,
    empathy: 60,
  },
};

const psychDonggeul = {
  secondary_axes: {
    conflict_style: 40,
    self_control: 50,
    resilience: 55,
    thinking_style: 45,
    empathy: 50,
  },
};

// 1. Basic Generation & 7-Section IA Test
const ch07Forward = buildMarriageChapter07Intelligence({
  nameA: "Sera",
  nameB: "동글",
  psychA: psychSera,
  psychB: psychDonggeul,
  countsA: countsSera,
  countsB: countsDonggeul,
});

console.log("✓ 1. Basic 7-Section Generation: SUCCESS");
assert.ok(ch07Forward.introNarrative, "Intro narrative missing");
assert.ok(ch07Forward.section01_journey.personA.baseline, "Section 01 person A baseline missing");
assert.ok(ch07Forward.section01_journey.personA.activation, "Section 01 person A activation missing");
assert.ok(ch07Forward.section01_journey.personA.overload, "Section 01 person A overload missing");
assert.ok(ch07Forward.section01_journey.personA.innerNeed, "Section 01 person A innerNeed missing");
assert.ok(ch07Forward.section02_conflictLoop.headline, "Loop headline missing");
assert.ok(ch07Forward.section04_repair.personA.howToApproach, "Repair A approach missing");
assert.ok(ch07Forward.section05_expectationsToRelease.expectationAtoB.headline, "Expectation A->B missing");
assert.ok(ch07Forward.section06_relationshipProtection.protectiveAsset.headline, "Protection asset missing");
assert.ok(ch07Forward.section07_directionalActions.actionAtoB.dos.length >= 2, "Action A->B DOs < 2");
assert.ok(ch07Forward.section07_directionalActions.actionBtoA.dos.length >= 2, "Action B->A DOs < 2");

// 2. Person Evidence Ownership & Section 01 Failsafe Test
assert.ok(
  ch07Forward.section01_journey.personA.activation.includes("단정") ||
  ch07Forward.section01_journey.personA.activation.includes("이유"),
  "Sera activation must align with direct clarity"
);
assert.ok(
  ch07Forward.section01_journey.personB.activation.includes("말수") ||
  ch07Forward.section01_journey.personB.activation.includes("관망"),
  "Donggeul activation must align with space/quiet"
);
console.log("✓ 2. Person Evidence Ownership & Section 01 Failsafe: SUCCESS");

// 3. Directional Swap Safety Test (A/B position swap)
const ch07Reverse = buildMarriageChapter07Intelligence({
  nameA: "동글",
  nameB: "Sera",
  psychA: psychDonggeul,
  psychB: psychSera,
  countsA: countsDonggeul,
  countsB: countsSera,
});

assert.strictEqual(
  ch07Forward.section01_journey.personA.overload,
  ch07Reverse.section01_journey.personB.overload,
  "Sera's overload narrative must be identical regardless of whether Sera is A or B"
);
assert.strictEqual(
  ch07Forward.section01_journey.personB.overload,
  ch07Reverse.section01_journey.personA.overload,
  "Donggeul's overload narrative must be identical regardless of whether Donggeul is A or B"
);
assert.strictEqual(
  ch07Forward.section07_directionalActions.actionAtoB.actorName,
  ch07Reverse.section07_directionalActions.actionBtoA.actorName,
  "Section 07 action actor must swap ownership accurately"
);
console.log("✓ 3. Directional Swap Safety: SUCCESS");

// 4. Cross-Section Story Chain Consistency Test (01 -> 02 -> 03 -> 04 -> 05 -> 06 -> 07)
assert.ok(
  ch07Forward.section01_journey.personB.innerNeed.includes("시간") ||
  ch07Forward.section01_journey.personB.innerNeed.includes("수고"),
  "Donggeul inner need must align with space/acknowledgment"
);
assert.ok(
  ch07Forward.section04_repair.personB.firstNeed.includes("시간") ||
  ch07Forward.section04_repair.personB.firstNeed.includes("인정"),
  "Section 04 repair guide first need must match Section 01 inner need"
);
console.log("✓ 4. Cross-Section Story Chain Consistency: SUCCESS");

// 5. No Fake Precision Numbers Test
const jsonString = JSON.stringify(ch07Forward);
const forbiddenNumbers = ["20분", "30분", "24시간", "각방 2일"];
for (const num of forbiddenNumbers) {
  assert.ok(!jsonString.includes(num), `Forbidden fake precision number found: ${num}`);
}
console.log("✓ 5. No Fake Precision Numbers: SUCCESS");

// 6. Sample Name Hardcoding Check
const genericTest = buildMarriageChapter07Intelligence({
  nameA: "Alice",
  nameB: "Bob",
  psychA: psychSera,
  psychB: psychDonggeul,
  countsA: countsSera,
  countsB: countsDonggeul,
});

const genericJson = JSON.stringify(genericTest);
assert.ok(!genericJson.includes("Sera"), "Sample name 'Sera' hardcoded in generic output");
assert.ok(!genericJson.includes("동글"), "Sample name '동글' hardcoded in generic output");
console.log("✓ 6. No Sample-Name Hardcoding: SUCCESS");

console.log("==========================================");
console.log("ALL 6 CRITICAL INTEGRITY TESTS PASSED!");
console.log("==========================================");
