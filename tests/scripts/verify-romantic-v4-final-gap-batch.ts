import { computeRomanticV4GapBatchEngine } from "../../lib/relationship/romantic/prototypeV4/romanticV4GapBatchEngine";
import type { PsychMasterJson } from "../../lib/personCore/types/psychMaster";

function makePsych(overrides: Record<string, number>): PsychMasterJson {
  const base = {
    stimulation: 50, self_control: 50, practicality: 50, structure: 50, empathy: 50,
    conflict_style: 50, resilience: 50, recognition: 50, energy_style: 50,
    thinking_style: 50, decision_style: 50,
  };
  return {
    survey_source: "v2_10q",
    secondary_axes: { ...base, ...overrides },
  } as unknown as PsychMasterJson;
}

// Variation 1: Attraction strong + Needs gap high
const pair1 = computeRomanticV4GapBatchEngine({
  nameA: "민준", nameB: "서연",
  psychA: makePsych({ empathy: 80, structure: 35 }),
  psychB: makePsych({ structure: 85, empathy: 35 }),
});

// Variation 2: Emotionally matched + Lifestyle mismatch
const pair2 = computeRomanticV4GapBatchEngine({
  nameA: "지훈", nameB: "수아",
  psychA: makePsych({ empathy: 75, stimulation: 85 }),
  psychB: makePsych({ empathy: 75, stimulation: 30 }),
});

// Variation 3: High conflict + Strong repair
const pair3 = computeRomanticV4GapBatchEngine({
  nameA: "현우", nameB: "유진",
  psychA: makePsych({ conflict_style: 80, empathy: 75 }),
  psychB: makePsych({ conflict_style: 80, empathy: 75 }),
});

// Variation 4: Stable long-term pair
const pair4 = computeRomanticV4GapBatchEngine({
  nameA: "도현", nameB: "은서",
  psychA: makePsych({ structure: 65, empathy: 65 }),
  psychB: makePsych({ structure: 65, empathy: 65 }),
});

console.log("=== Variation 1: Role Matrix & Growth ===");
console.log("Pair 1 Role A:", pair1.chapter06.roleMatrix.roleA.title);
console.log("Pair 1 Role B:", pair1.chapter06.roleMatrix.roleB.title);
console.log("Pair 1 Growth A->B:", pair1.chapter06.growth.aLearnsFromB);

console.log("\n=== Variation 2: What Not to Expect & When Needed ===");
console.log("Pair 2 Not to Expect A->B:", pair2.whatNotToExpect.notToExpectAFromB.map(n => n.title));
console.log("Pair 2 When Needed B:", pair2.whenWeNeedEachOtherMost.whenBNeedsA.map(n => n.sceneTitle));

console.log("\n=== Variation 3: Emergency SOS Scripts ===");
console.log("Pair 3 SOS A->B First line:", pair3.emergencySos.sosAtoB.firstLine);
console.log("Pair 3 SOS B->A Reconnection:", pair3.emergencySos.sosBtoA.reconnectionLine);

console.log("\n=== Variation 4: Long-Term Bond Rituals & Conflict Canonicalization ===");
console.log("Pair 4 Rituals:", pair4.longTermBond.relationshipRitual);
console.log("Pair 4 Transition A Summary:", pair4.conflictTransitions.transitionA.canonicalSummary);
