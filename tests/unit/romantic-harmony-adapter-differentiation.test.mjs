/**
 * Final Evidence-to-Voice pass, item 1 — computeConflictStateTransitionPair
 * must never return two byte-identical Pattern-4 (Harmony Adapter) person
 * cards just because both people fell into the same unconditional fallback.
 */
import test from "node:test";
import assert from "node:assert/strict";

import { computeRomanticV4GapBatchEngine } from "../../lib/relationship/romantic/prototypeV4/romanticV4GapBatchEngine.ts";

function makePsych(secondaryOverrides) {
  const secondaryBase = {
    stimulation: 50, self_control: 50, practicality: 50, structure: 50, empathy: 50,
    conflict_style: 50, resilience: 50, recognition: 50, energy_style: 50,
    thinking_style: 50, decision_style: 50,
  };
  return {
    profile_type: "current_self",
    primary_axes: { autonomy: 50, connection: 50, stability: 50, growth: 50, structure: 50, adaptability: 50 },
    secondary_axes: { ...secondaryBase, ...secondaryOverrides },
    personalization: { primary_concern: null },
    meta: { survey_version: "v2", completed_at: new Date().toISOString(), completion_time_seconds: null },
  };
}

test("Harmony Adapter — truly similar pair gets ONE shared baseline, not two independently-labeled identical cards", () => {
  const res = computeRomanticV4GapBatchEngine({
    nameA: "지민", nameB: "정우",
    psychA: makePsych({}), // neutral, both land in Pattern 4
    psychB: makePsych({}),
  });
  assert.equal(res.conflictTransitions.sharedBaseline, "둘 다 관계의 평화와 조화를 중요하게 여기는 편입니다.");
  assert.equal(res.conflictTransitions.transitionA.normalState, res.conflictTransitions.sharedBaseline);
  assert.equal(res.conflictTransitions.transitionB.normalState, res.conflictTransitions.sharedBaseline);
});

test("Harmony Adapter — a real secondary-axis gap (self_control) produces differentiated tension/overload/recovery, not identical text", () => {
  const res = computeRomanticV4GapBatchEngine({
    nameA: "지민", nameB: "정우",
    // Both stay under Pattern 1-3's thresholds, but self_control gap is 40 (>= the 20 threshold)
    psychA: makePsych({ self_control: 55, empathy: 45, recognition: 45 }),
    psychB: makePsych({ self_control: 15, empathy: 45, recognition: 45 }),
  });
  assert.equal(res.conflictTransitions.sharedBaseline, null);
  const { transitionA, transitionB } = res.conflictTransitions;
  assert.notEqual(transitionA.tensionRising, transitionB.tensionRising);
  assert.notEqual(transitionA.overloadState, transitionB.overloadState);
  assert.notEqual(transitionA.recoveryState, transitionB.recoveryState);
});

test("Harmony Adapter — the higher-self_control person always gets the internalizing text, regardless of A/B slot (swap integrity)", () => {
  const forward = computeRomanticV4GapBatchEngine({
    nameA: "지민", nameB: "정우",
    psychA: makePsych({ self_control: 55, empathy: 45, recognition: 45 }),
    psychB: makePsych({ self_control: 15, empathy: 45, recognition: 45 }),
  });
  const swapped = computeRomanticV4GapBatchEngine({
    nameA: "정우", nameB: "지민",
    psychA: makePsych({ self_control: 15, empathy: 45, recognition: 45 }),
    psychB: makePsych({ self_control: 55, empathy: 45, recognition: 45 }),
  });
  // 지민 (self_control=55, higher) should get the same tensionRising text
  // whether they're in the A slot or the B slot.
  assert.equal(forward.conflictTransitions.transitionA.tensionRising, swapped.conflictTransitions.transitionB.tensionRising);
  assert.equal(forward.conflictTransitions.transitionB.tensionRising, swapped.conflictTransitions.transitionA.tensionRising);
});

test("Harmony Adapter — never returns fully identical transitionA/transitionB objects when a real gap exists", () => {
  const res = computeRomanticV4GapBatchEngine({
    nameA: "지민", nameB: "정우",
    psychA: makePsych({ self_control: 55, empathy: 45, recognition: 45 }),
    psychB: makePsych({ self_control: 15, empathy: 45, recognition: 45 }),
  });
  const { transitionA, transitionB } = res.conflictTransitions;
  const aWithoutName = { ...transitionA, personName: undefined };
  const bWithoutName = { ...transitionB, personName: undefined };
  assert.notDeepEqual(aWithoutName, bWithoutName);
});

test("Someone who clears Pattern 1/2/3 on their own is unaffected — sharedBaseline stays null, existing per-person text unchanged", () => {
  const res = computeRomanticV4GapBatchEngine({
    nameA: "지민", nameB: "정우",
    psychA: makePsych({ conflict_style: 80 }), // clears Pattern 3 on its own
    psychB: makePsych({}), // Pattern 4
  });
  assert.equal(res.conflictTransitions.sharedBaseline, null);
  assert.match(res.conflictTransitions.transitionA.normalState, /솔직하고 명확하며/);
});
