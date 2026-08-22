import test from "node:test";
import assert from "node:assert/strict";

import { computeRomanticV4GapBatchEngine } from "../../lib/relationship/romantic/prototypeV4/romanticV4GapBatchEngine.ts";

function makePsych(secondaryOverrides) {
  if (!secondaryOverrides) return null;
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

test("Ch07 Abstention A — Both A and B have qualifying evidence", () => {
  const psychA = makePsych({ empathy: 75, structure: 35 });
  const psychB = makePsych({ structure: 75, empathy: 35 });

  const res = computeRomanticV4GapBatchEngine({
    nameA: "지민",
    nameB: "정우",
    psychA,
    psychB,
  });

  assert.ok(res.whatNotToExpect.notToExpectAFromB.length > 0, "A->B expectations should be populated when B has qualifying evidence");
  assert.ok(res.whatNotToExpect.notToExpectBFromA.length > 0, "B->A expectations should be populated when A has qualifying evidence");
});

test("Ch07 Abstention B — Only A direction supported", () => {
  const psychA = makePsych({ empathy: 75, structure: 35 });
  const psychB = makePsych({}); // neutral unqualifying

  const res = computeRomanticV4GapBatchEngine({
    nameA: "지민",
    nameB: "정우",
    psychA,
    psychB,
  });

  assert.equal(res.whatNotToExpect.notToExpectAFromB.length, 0, "A->B expectations must abstain when B lacks qualifying evidence");
  assert.ok(res.whatNotToExpect.notToExpectBFromA.length > 0, "B->A expectations should be populated when A has evidence");
});

test("Ch07 Abstention C — Only B direction supported", () => {
  const psychA = makePsych({}); // neutral unqualifying
  const psychB = makePsych({ structure: 75, empathy: 35 });

  const res = computeRomanticV4GapBatchEngine({
    nameA: "지민",
    nameB: "정우",
    psychA,
    psychB,
  });

  assert.ok(res.whatNotToExpect.notToExpectAFromB.length > 0, "A->B expectations should be populated when B has evidence");
  assert.equal(res.whatNotToExpect.notToExpectBFromA.length, 0, "B->A expectations must abstain when A lacks qualifying evidence");
});

test("Ch07 Abstention D — Neither direction supported (zero personalized expectations)", () => {
  const res = computeRomanticV4GapBatchEngine({
    nameA: "지민",
    nameB: "정우",
    psychA: null,
    psychB: null,
  });

  assert.equal(res.whatNotToExpect.notToExpectAFromB.length, 0, "A->B expectations must be zero when evidence is unobserved");
  assert.equal(res.whatNotToExpect.notToExpectBFromA.length, 0, "B->A expectations must be zero when evidence is unobserved");
});

test("Ch07 Abstention E — A/B Swap Integrity", () => {
  const psychHighA = makePsych({ empathy: 80, recognition: 75, structure: 30 });
  const psychHighB = makePsych({ structure: 80, self_control: 75, empathy: 30 });

  const res1 = computeRomanticV4GapBatchEngine({
    nameA: "민준",
    nameB: "지은",
    psychA: psychHighA,
    psychB: psychHighB,
  });

  const res2 = computeRomanticV4GapBatchEngine({
    nameA: "지은",
    nameB: "민준",
    psychA: psychHighB,
    psychB: psychHighA,
  });

  assert.deepEqual(
    res1.whatNotToExpect.notToExpectAFromB.map(i => i.title),
    res2.whatNotToExpect.notToExpectBFromA.map(i => i.title),
    "Swapping A/B inputs must cleanly swap A->B and B->A expectation titles"
  );
});
