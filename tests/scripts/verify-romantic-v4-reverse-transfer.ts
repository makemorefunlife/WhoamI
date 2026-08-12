import { computeRomanticRelationshipNeedsEngine } from "../../lib/relationship/romantic/prototypeV4/romanticRelationshipNeedsEngine";
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

// 1. Matched Pair
const result1 = computeRomanticRelationshipNeedsEngine({
  nicknameA: "민준", nicknameB: "서연",
  countsA: { 정인: 1 }, countsB: { 식신: 1 },
  psychA: makePsych({ empathy: 75, structure: 40 }),
  psychB: makePsych({ stimulation: 75, recognition: 70 }),
});

// 2. Misaligned Love Expression Pair
const result2 = computeRomanticRelationshipNeedsEngine({
  nicknameA: "지훈", nicknameB: "수아",
  countsA: { 정관: 2 }, countsB: { 편인: 2 },
  psychA: makePsych({ structure: 85, empathy: 40 }),
  psychB: makePsych({ recognition: 85, resilience: 35 }),
  isLoveMisaligned: true,
  isPressureHigh: true,
});

console.log("=== 1. Matched Relationship Need x Actual Delivery ===");
console.log("A (민준 -> 서연) Innate Needs:", result1.needsA.innateNeeds.map(n => n.label));
console.log("A (민준 -> 서연) Well Supplied:", result1.needsA.wellSuppliedNeeds.map(n => n.label));
console.log("B (서연 -> 민준) Primary Needs:", result1.needsB.primaryNeeds.map(n => `${n.label} (${n.gapStatus})`));

console.log("\n=== 2. Misaligned & High Pressure Relationship Pair ===");
console.log("A (지훈) Primary Needs (Should NOT be Well Supplied):", result2.needsA.primaryNeeds.map(n => `${n.label} (${n.gapStatus})`));
console.log("B (수아) Primary Needs (Should be High Gap):", result2.needsB.primaryNeeds.map(n => `${n.label} (${n.gapStatus})`));
console.log("Overall Summary:", result2.overallSummary);
