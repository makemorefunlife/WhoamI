import test from "node:test";
import assert from "node:assert/strict";

import { buildRomanticV4PrototypePayload } from "../../lib/relationship/romantic/prototypeV4/buildRomanticV4PrototypePayload.ts";
import { computeRomanticV4GapBatchEngine } from "../../lib/relationship/romantic/prototypeV4/romanticV4GapBatchEngine.ts";
import { buildMarriageLoveDeliveryMatch } from "../../lib/relationship/marriage/marriageLoveDeliveryMatch.ts";
import { buildCoupleLifePartnerRoleP1 } from "../../lib/relationship/marriage/buildCoupleV5DomainModels.ts";

const dummyBirthA = { birthDate: "1995-05-15", birthTime: "12:00" };
const dummyBirthB = { birthDate: "1996-08-20", birthTime: "12:00" };

test("Directional Swap Integrity — Romantic VNext Weekend Planning & Reply Delay", () => {
  // Fixture X: High Energy / Fast Expression (A) x Low Energy / Slow Expression (B)
  const psychHighA = {
    secondary_axes: {
      energy_style: 85,
      expression_style: 85,
      stimulation: 80,
      structure: 35,
      empathy: 40,
    },
  };

  const psychLowB = {
    secondary_axes: {
      energy_style: 30,
      expression_style: 30,
      stimulation: 30,
      structure: 80,
      empathy: 75,
    },
  };

  // Case 1: Person A = High, Person B = Low
  const payload1 = buildRomanticV4PrototypePayload("complete", "ko-KR", {
    pairSajuInput: { mode: "real", nameA: "민준", nameB: "지은", birthA: dummyBirthA, birthB: dummyBirthB },
    surveyInput: {
      mode: "real",
      nameA: "민준",
      nameB: "지은",
      psychA: psychHighA,
      psychB: psychLowB,
    },
  });

  const weekendDomain1 = payload1.storyPlan?.realLifeDomains?.find(d => d.domainId === "weekend");
  const replyDomain1 = payload1.storyPlan?.realLifeDomains?.find(d => d.domainId === "reply_delay");

  assert.ok(weekendDomain1, "weekend domain should exist");
  assert.ok(weekendDomain1.difference.includes("민준"), "High energy person (민준) should be assigned active weekend out");
  assert.ok(weekendDomain1.difference.includes("지은"), "Low energy person (지은) should be assigned home recharge");

  assert.ok(replyDomain1, "reply_delay domain should exist");
  assert.ok(replyDomain1.difference.includes("민준"), "Fast expression person (민준) should be assigned fast reply");

  // Case 2: SWAPPED — Person A = Low (지은), Person B = High (민준)
  const payload2 = buildRomanticV4PrototypePayload("complete", "ko-KR", {
    pairSajuInput: { mode: "real", nameA: "지은", nameB: "민준", birthA: dummyBirthB, birthB: dummyBirthA },
    surveyInput: {
      mode: "real",
      nameA: "지은",
      nameB: "민준",
      psychA: psychLowB,
      psychB: psychHighA,
    },
  });

  const weekendDomain2 = payload2.storyPlan?.realLifeDomains?.find(d => d.domainId === "weekend");
  const replyDomain2 = payload2.storyPlan?.realLifeDomains?.find(d => d.domainId === "reply_delay");

  assert.ok(weekendDomain2, "weekend domain should exist in swapped payload");
  assert.ok(weekendDomain2.difference.includes("민준"), "High energy person (민준) should STILL be assigned active weekend out even when in position B");
  assert.ok(weekendDomain2.difference.includes("지은"), "Low energy person (지은) should STILL be assigned home recharge even when in position A");

  assert.ok(replyDomain2, "reply_delay domain should exist in swapped payload");
  assert.ok(replyDomain2.difference.includes("민준"), "Fast expression person (민준) should STILL be assigned fast reply when in position B");
});

test("Directional Swap Integrity — Romantic VNext Similar Energy (No Forced Polarization)", () => {
  const psychEqualA = {
    secondary_axes: {
      energy_style: 50,
      expression_style: 50,
    },
  };
  const psychEqualB = {
    secondary_axes: {
      energy_style: 52,
      expression_style: 48,
    },
  };

  const payload = buildRomanticV4PrototypePayload("complete", "ko-KR", {
    pairSajuInput: { mode: "real", nameA: "태민", nameB: "수빈", birthA: dummyBirthA, birthB: dummyBirthB },
    surveyInput: {
      mode: "real",
      nameA: "태민",
      nameB: "수빈",
      psychA: psychEqualA,
      psychB: psychEqualB,
    },
  });

  const weekendDomain = payload.storyPlan?.realLifeDomains?.find(d => d.domainId === "weekend");
  assert.ok(weekendDomain);
  assert.ok(
    weekendDomain.difference.includes("휴식 리듬이 비슷하여"),
    "Similar energy pair should render a balanced symmetric statement without forced polarization"
  );
});

test("Directional Swap Integrity — Conflict State Transitions Swap", () => {
  const psychAnxious = {
    secondary_axes: { empathy: 75, recognition: 80, structure: 40, self_control: 50 },
  };
  const psychLogical = {
    secondary_axes: { structure: 80, self_control: 75, empathy: 35, recognition: 30 },
  };

  // Run 1: A = Anxious, B = Logical
  const res1 = computeRomanticV4GapBatchEngine({
    nameA: "하나",
    nameB: "도윤",
    psychA: psychAnxious,
    psychB: psychLogical,
  });

  assert.equal(res1.conflictTransitions.transitionA.personName, "하나");
  assert.ok(res1.conflictTransitions.transitionA.canonicalSummary.includes("불안 임계점"), "하나 should have expressive anxious pattern");
  assert.equal(res1.conflictTransitions.transitionB.personName, "도윤");
  assert.ok(res1.conflictTransitions.transitionB.canonicalSummary.includes("침묵과 거리두기"), "도윤 should have logical withdrawing pattern");

  // Run 2: SWAPPED — A = Logical (도윤), B = Anxious (하나)
  const res2 = computeRomanticV4GapBatchEngine({
    nameA: "도윤",
    nameB: "하나",
    psychA: psychLogical,
    psychB: psychAnxious,
  });

  assert.equal(res2.conflictTransitions.transitionA.personName, "도윤");
  assert.ok(res2.conflictTransitions.transitionA.canonicalSummary.includes("침묵과 거리두기"), "도윤 (position A) should STILL have logical withdrawing pattern");
  assert.equal(res2.conflictTransitions.transitionB.personName, "하나");
  assert.ok(res2.conflictTransitions.transitionB.canonicalSummary.includes("불안 임계점"), "하나 (position B) should STILL have expressive anxious pattern");
});

test("Directional Swap Integrity — Marriage Love Delivery Match & Life Partner Roles", () => {
  const psychEmpathyA = { secondary_axes: { empathy: 80, structure: 30, practicality: 40 } };
  const psychStructureB = { secondary_axes: { empathy: 30, structure: 80, practicality: 75 } };

  // Love Delivery Match
  const match1 = buildMarriageLoveDeliveryMatch(psychEmpathyA, psychStructureB, "소율", "현우", "ko-KR");
  assert.equal(match1.matchAtoB.receiverName, "소율");
  assert.equal(match1.matchAtoB.giverName, "현우");
  assert.equal(match1.matchBtoA.receiverName, "현우");
  assert.equal(match1.matchBtoA.giverName, "소율");

  // Swapped
  const match2 = buildMarriageLoveDeliveryMatch(psychStructureB, psychEmpathyA, "현우", "소율", "ko-KR");
  assert.equal(match2.matchAtoB.receiverName, "현우");
  assert.equal(match2.matchAtoB.giverName, "소율");
  assert.equal(match2.matchBtoA.receiverName, "소율");
  assert.equal(match2.matchBtoA.giverName, "현우");

  // Life Partner Roles
  const roleAisLead = buildCoupleLifePartnerRoleP1({
    nameA: "소율",
    nameB: "현우",
    homeReport: { cfo: { leader_side: "a" } },
  });
  assert.ok(roleAisLead.selfRole.includes("소율는 가정의 장기적 방향성"), "A is CFO lead -> A gets guide role");

  const roleBisLead = buildCoupleLifePartnerRoleP1({
    nameA: "소율",
    nameB: "현우",
    homeReport: { cfo: { leader_side: "b" } },
  });
  assert.ok(roleBisLead.partnerRole.includes("현우는 가정의 장기적 방향성"), "B is CFO lead -> B gets guide role");
});
