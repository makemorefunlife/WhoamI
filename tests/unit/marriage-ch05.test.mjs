import test from "node:test";
import assert from "node:assert/strict";

import { buildMarriageRuleContext } from "../../lib/relationship/marriage/buildMarriageRuleContext.ts";
import { buildMarriageChapter05Intelligence } from "../../lib/relationship/marriage/marriageChapter05Intelligence.ts";

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
  const base = { stimulation: 50, structure: 50, empathy: 50, self_control: 50, energy_style: 50, decision_style: 50, autonomy: 50, stability: 50, growth: 50, practicality: 50, resilience: 50, adaptability: 50 };
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

test("Marriage Chapter 05 Household Operating System Full Rebuild Suite", async (t) => {

  await t.test("1. All 7 Sections + ENDING Structure Reachability & Non-Empty Fields", () => {
    const ctx = mockCtx("Sera", "동글", saju1A, saju1B);
    const ch05 = buildMarriageChapter05Intelligence({ ctx });

    assert.ok(ch05.introQuestion);
    // 01. Operating System
    assert.ok(ch05.coupleOperatingSystem.title);
    assert.equal(ch05.coupleOperatingSystem.capabilities.length, 6);
    assert.ok(ch05.coupleOperatingSystem.pairInsight);

    // 02. Money Behavior
    assert.ok(ch05.moneyBehavior.importantValueA);
    assert.ok(ch05.moneyBehavior.togetherInsight);

    // 03. Wealth Building Style
    assert.ok(ch05.wealthBuildingStyle.naturalDirectionA);
    assert.ok(ch05.wealthBuildingStyle.pairSynergyInsight);

    // 04. Major Money Decisions
    assert.ok(ch05.majorMoneyDecisions.optionProposer);
    assert.ok(ch05.majorMoneyDecisions.decisionPatternSummary);

    // 05. Financial Operation
    assert.ok(ch05.financialOperation.operationStyle);
    assert.ok(ch05.financialOperation.operationInsight);

    // 06. Practical Life Competence
    assert.ok(ch05.practicalLifeCompetence.profileA.notice);
    assert.ok(ch05.practicalLifeCompetence.pairSynergyInsight);

    // 07. Mental Load
    assert.ok(ch05.mentalLoad.noticer);
    assert.ok(ch05.mentalLoad.closer);

    // ENDING
    assert.ok(ch05.householdMapEnding.moneyBehaviorSummary);
    assert.ok(ch05.householdMapEnding.wealthStyleSummary);
  });

  await t.test("2. Zero Crude Jargon, Zero Specific Stock Advice & Zero Chore % Claims Audit", () => {
    const ctx = mockCtx("Sera", "동글", saju1A, saju1B);
    const ch05 = buildMarriageChapter05Intelligence({ ctx });
    const str = JSON.stringify(ch05);

    const forbiddenStrings = [
      "주식 매수", "부동산 투자 추천", "401k 가입", "가사 70%", "집안일 80%",
      "CFO 지정", "CFO 권한", "가정 CFO", "주간 가사 회의 15분", "이렇게 말해보세요"
    ];

    for (const word of forbiddenStrings) {
      assert.equal(str.includes(word), false, `Forbidden copy/jargon/advice '${word}' found in Chapter 05!`);
    }
  });

  await t.test("3. Directional Swap Test (Swapping A and B Inverts Role Actors Correctly)", () => {
    const ctxNormal = mockCtx("Sera", "동글", saju3A, saju1B, makePsych({ structure: 80 }), makePsych({ structure: 30 }));
    const ch05Normal = buildMarriageChapter05Intelligence({ ctx: ctxNormal, psychA: makePsych({ structure: 80 }), psychB: makePsych({ structure: 30 }) });

    const ctxSwapped = mockCtx("동글", "Sera", saju1B, saju3A, makePsych({ structure: 30 }), makePsych({ structure: 80 }));
    const ch05Swapped = buildMarriageChapter05Intelligence({ ctx: ctxSwapped, psychA: makePsych({ structure: 30 }), psychB: makePsych({ structure: 80 }) });

    assert.equal(ch05Normal.coupleOperatingSystem.capabilities[0].actor, "A_DOMINANT");
    assert.equal(ch05Swapped.coupleOperatingSystem.capabilities[0].actor, "B_DOMINANT");
  });

  await t.test("4. 6-Fixture Diversity Audit Table Generation", () => {
    const fixtures = [
      { name: "Fixture 1", sajuA: saju1A, sajuB: saju1B, psychA: makePsych({ growth: 80, structure: 80 }), psychB: makePsych({ stability: 80, self_control: 80 }) },
      { name: "Fixture 2", sajuA: saju2A, sajuB: saju2B, psychA: makePsych({ decision_style: 80 }), psychB: makePsych({ energy_style: 80 }) },
      { name: "Fixture 3", sajuA: saju3A, sajuB: saju3B, psychA: makePsych({ practicality: 80 }), psychB: makePsych({ adaptability: 80 }) },
      { name: "Fixture 4", sajuA: saju4A, sajuB: saju4B, psychA: makePsych({ stimulation: 80 }), psychB: makePsych({ stability: 80 }) },
      { name: "Fixture 5", sajuA: saju5A, sajuB: saju5B, psychA: makePsych({ self_control: 80 }), psychB: makePsych({ growth: 80 }) },
      { name: "Fixture 6", sajuA: saju6A, sajuB: saju6B, psychA: makePsych({ decision_style: 30 }), psychB: makePsych({ empathy: 30 }) },
    ];

    console.log("\n=================== CHAPTER 05 V3 6-FIXTURE DIVERSITY AUDIT TABLE ===================");
    console.log("| Fixture | Team Type | Money Value (A/B) | Wealth Synergies | Major Decisions | Operation Style |");
    console.log("|---------|-----------|-------------------|------------------|-----------------|-----------------|");

    for (const f of fixtures) {
      const ctx = mockCtx("Sera", "동글", f.sajuA, f.sajuB, f.psychA, f.psychB);
      const res = buildMarriageChapter05Intelligence({ ctx, psychA: f.psychA, psychB: f.psychB });

      const team = res.coupleOperatingSystem.teamTypeTitle;
      const moneyVal = `${res.moneyBehavior.importantValueA.slice(0, 5)} / ${res.moneyBehavior.importantValueB.slice(0, 5)}`;
      const wealthSyn = res.wealthBuildingStyle.pairSynergyInsight.slice(0, 15) + "...";
      const major = res.majorMoneyDecisions.optionProposer.slice(0, 12);
      const opStyle = res.financialOperation.operationStyle;

      console.log(`| ${f.name} | ${team} | ${moneyVal} | ${wealthSyn} | ${major} | ${opStyle} |`);
    }
    console.log("=====================================================================================\n");
  });

});
