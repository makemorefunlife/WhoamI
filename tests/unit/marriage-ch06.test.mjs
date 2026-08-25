import test from "node:test";
import assert from "node:assert/strict";

import { buildMarriageRuleContext } from "../../lib/relationship/marriage/buildMarriageRuleContext.ts";
import { buildMarriageChapter06Intelligence } from "../../lib/relationship/marriage/marriageChapter06Intelligence.ts";

const saju1A = { saju: { yearPillar: "경오", monthPillar: "신사", dayPillar: "경오", hourPillar: "계미" }, dayStemCode: "gyeong", dayBranchCode: "o" };
const saju1B = { saju: { yearPillar: "임신", monthPillar: "무신", dayPillar: "무자", hourPillar: "정사" }, dayStemCode: "mu", dayBranchCode: "ja" };

const saju2A = { saju: { yearPillar: "갑자", monthPillar: "병인", dayPillar: "갑자", hourPillar: "갑술" }, dayStemCode: "gap", dayBranchCode: "ja" };
const saju2B = { saju: { yearPillar: "을축", monthPillar: "정묘", dayPillar: "을축", hourPillar: "정해" }, dayStemCode: "eul", dayBranchCode: "chug" };

const saju3A = { saju: { yearPillar: "무진", monthPillar: "기사", dayPillar: "무술", hourPillar: "경신" }, dayStemCode: "mu", dayBranchCode: "sul" };
const saju3B = { saju: { yearPillar: "경신", monthPillar: "신유", dayPillar: "경신", hourPillar: "신유" }, dayStemCode: "gyeong", dayBranchCode: "sin" };

const saju4A = { saju: { yearPillar: "병오", monthPillar: "정미", dayPillar: "병오", hourPillar: "정유" }, dayStemCode: "byeong", dayBranchCode: "o" };
const saju4B = { saju: { yearPillar: "정사", monthPillar: "병오", dayPillar: "정사", hourPillar: "무신" }, dayStemCode: "jeong", dayBranchCode: "sa" };

const saju5A = { saju: { yearPillar: "임자", monthPillar: "계해", dayPillar: "임자", hourPillar: "계축" }, dayStemCode: "im", dayBranchCode: "ja" };
const saju5B = { saju: { yearPillar: "계해", monthPillar: "임자", dayPillar: "계해", hourPillar: "갑인" }, dayStemCode: "gye", dayBranchCode: "hae" };

const saju6A = { saju: { yearPillar: "무술", monthPillar: "경신", dayPillar: "무술", hourPillar: "임술" }, dayStemCode: "mu", dayBranchCode: "sul" };
const saju6B = { saju: { yearPillar: "기축", monthPillar: "신유", dayPillar: "기축", hourPillar: "계유" }, dayStemCode: "gi", dayBranchCode: "chug" };

function makePsych(overrides = {}) {
  const base = { stimulation: 50, structure: 50, empathy: 50, self_control: 50, energy_style: 50, decision_style: 50, autonomy: 50, stability: 50, growth: 50, practicality: 50, resilience: 50, adaptability: 50, connection: 50, conflict_style: 50 };
  return {
    survey_source: "v2_10q",
    secondary_axes: { ...base, ...overrides },
    scores: { growth: 50, connection: 50, autonomy: 50, stability: 50, structure: 50 },
    traits: { decision_style: 50, empathy: 50, independence: 50, self_control: 50, ...overrides },
    ocean_traits: { ...base, ...overrides },
    home_life_dna: { lifestyle_title: "체계적인 정리자", life_values_line: "안정된 공간" },
  };
}

function mockCtx(nameA = "Sera", nameB = "동글", sajuA = saju1A, sajuB = saju1B, psychA = makePsych(), psychB = makePsych()) {
  return buildMarriageRuleContext({
    nicknameA: nameA,
    nicknameB: nameB,
    sajuJsonA: sajuA,
    sajuJsonB: sajuB,
    psychMasterA: psychA,
    psychMasterB: psychB,
    locale: "ko-KR",
  });
}

test("Marriage Chapter 06 Family System Full Rebuild Suite", async (t) => {

  await t.test("1. All 7 Sections Reachability & Non-Empty Fields", () => {
    const ctx = mockCtx("Sera", "동글", saju1A, saju1B);
    const ch06 = buildMarriageChapter06Intelligence({ ctx });

    assert.ok(ch06.introQuestion);
    // 01. Couple Boundary
    assert.ok(ch06.coupleBoundary.title);
    assert.ok(ch06.coupleBoundary.profileA.editorialLabel);
    assert.ok(ch06.coupleBoundary.boundarySynthesis);

    // 02. Origin Family Dynamics
    assert.equal(ch06.originFamilyDynamics.pairRoles.length, 4);
    assert.ok(ch06.originFamilyDynamics.cautionMoment);

    // 03. Parenting DNA
    assert.ok(ch06.parentingDna.profileA.editorialIdentity);
    assert.ok(ch06.parentingDna.profileB.firstFocusKeywords.length > 0);

    // 04. Parenting Difference
    assert.ok(ch06.parentingDifference.situations.length >= 2);

    // 05. Pair Parenting System
    assert.ok(ch06.pairParentingSystem.headline);
    assert.ok(ch06.pairParentingSystem.oneLineSynthesis);

    // 06. Family Load Redistribution
    assert.equal(ch06.familyLoadRedistribution.pairRoles.length, 4);

    // 07. Family Identity
    assert.ok(ch06.familyIdentity.familyIdentityHeadline);
  });

  await t.test("2. Zero Fake Stress %, Zero Generic Advice & Zero Binary Rule/Empathy Claim Audit", () => {
    const ctx = mockCtx("Sera", "동글", saju1A, saju1B);
    const ch06 = buildMarriageChapter06Intelligence({ ctx });
    const str = JSON.stringify(ch06);

    const forbiddenStrings = [
      "스트레스 지수 45%", "규칙형 부모", "공감형 부모", "아이 앞에서는 절대", "완벽히 합의하세요", "외부 서비스"
    ];

    for (const word of forbiddenStrings) {
      assert.equal(str.includes(word), false, `Forbidden jargon/advice '${word}' found in Chapter 06!`);
    }
  });

  await t.test("3. Directional Swap Test (Swapping A and B Inverts Profiles and Roles Correctly)", () => {
    const ctxNormal = mockCtx("Sera", "동글", saju3A, saju1B, makePsych({ autonomy: 80 }), makePsych({ connection: 80 }));
    const ch06Normal = buildMarriageChapter06Intelligence({ ctx: ctxNormal, psychA: makePsych({ autonomy: 80 }), psychB: makePsych({ connection: 80 }) });

    const ctxSwapped = mockCtx("동글", "Sera", saju1B, saju3A, makePsych({ connection: 80 }), makePsych({ autonomy: 80 }));
    const ch06Swapped = buildMarriageChapter06Intelligence({ ctx: ctxSwapped, psychA: makePsych({ connection: 80 }), psychB: makePsych({ autonomy: 80 }) });

    assert.equal(ch06Normal.coupleBoundary.profileA.editorialLabel, ch06Swapped.coupleBoundary.profileB.editorialLabel);
    assert.equal(ch06Normal.parentingDna.profileA.editorialIdentity, ch06Swapped.parentingDna.profileB.editorialIdentity);
  });

  await t.test("4. 6-Fixture Diversity Audit Table Generation for Family System Intelligence", () => {
    const fixtures = [
      { name: "Fixture 1", sajuA: saju1A, sajuB: saju1B, psychA: makePsych({ autonomy: 80, growth: 80 }), psychB: makePsych({ connection: 80, structure: 80 }) },
      { name: "Fixture 2", sajuA: saju2A, sajuB: saju2B, psychA: makePsych({ empathy: 80 }), psychB: makePsych({ decision_style: 80 }) },
      { name: "Fixture 3", sajuA: saju3A, sajuB: saju3B, psychA: makePsych({ structure: 80 }), psychB: makePsych({ adaptability: 80 }) },
      { name: "Fixture 4", sajuA: saju4A, sajuB: saju4B, psychA: makePsych({ stimulation: 80 }), psychB: makePsych({ stability: 80 }) },
      { name: "Fixture 5", sajuA: saju5A, sajuB: saju5B, psychA: makePsych({ self_control: 80 }), psychB: makePsych({ growth: 80 }) },
      { name: "Fixture 6", sajuA: saju6A, sajuB: saju6B, psychA: makePsych({ conflict_style: 30 }), psychB: makePsych({ empathy: 30 }) },
    ];

    console.log("\n=================== CHAPTER 06 V3 6-FIXTURE FAMILY SYSTEM TABLE ===================");
    console.log("| Fixture | Refuse Parents | Spouse Protector | Sera Parenting DNA | Donggeul Parenting DNA |");
    console.log("|---------|----------------|------------------|---------------------|------------------------|");

    for (const f of fixtures) {
      const ctx = mockCtx("Sera", "동글", f.sajuA, f.sajuB, f.psychA, f.psychB);
      const res = buildMarriageChapter06Intelligence({ ctx, psychA: f.psychA, psychB: f.psychB });

      const roles = res.originFamilyDynamics.pairRoles;
      const ref = roles[0].personName;
      const prot = roles[1].personName;
      const dnaA = res.parentingDna.profileA.editorialIdentity;
      const dnaB = res.parentingDna.profileB.editorialIdentity;

      console.log(`| ${f.name} | ${ref} | ${prot} | ${dnaA} | ${dnaB} |`);
    }
    console.log("===================================================================================\n");
  });

});
