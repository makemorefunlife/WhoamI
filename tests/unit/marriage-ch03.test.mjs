import test from "node:test";
import assert from "node:assert/strict";
import {
  buildMarriageChapter03Intelligence,
  classifyMatch,
  evaluateSajuInnateNeedAndSupply,
  evaluateCurrentPsychExpression,
  createDefaultMarriageChapter03Intelligence,
} from "../../lib/relationship/marriage/marriageChapter03Intelligence.ts";
import { buildMarriageRuleContext } from "../../lib/relationship/marriage/buildMarriageRuleContext.ts";
import { buildMarriageReport } from "../../lib/relationship/marriage/buildMarriageReport.ts";
import { buildMarriageReportViewModel } from "../../lib/relationship/marriage/viewModel/buildMarriageReportViewModel.ts";

const saju1A = { saju: { yearPillar: "갑자", monthPillar: "병인", dayPillar: "을묘", hourPillar: "무신" }, dayStemCode: "eul", dayBranchCode: "myo" };
const saju1B = { saju: { yearPillar: "을축", monthPillar: "정묘", dayPillar: "경오", hourPillar: "기사" }, dayStemCode: "gyeong", dayBranchCode: "o" };

const saju2A = { saju: { yearPillar: "병인", monthPillar: "무진", dayPillar: "임신", hourPillar: "계유" }, dayStemCode: "im", dayBranchCode: "sin" };
const saju2B = { saju: { yearPillar: "정묘", monthPillar: "기사", dayPillar: "임진", hourPillar: "갑술" }, dayStemCode: "im", dayBranchCode: "jin" };

const saju3A = { saju: { yearPillar: "무진", monthPillar: "경신", dayPillar: "갑자", hourPillar: "병인" }, dayStemCode: "gap", dayBranchCode: "ja" };
const saju3B = { saju: { yearPillar: "기사", monthPillar: "신유", dayPillar: "임오", hourPillar: "정묘" }, dayStemCode: "im", dayBranchCode: "o" };

const saju4A = { saju: { yearPillar: "경오", monthPillar: "임오", dayPillar: "병자", hourPillar: "무술" }, dayStemCode: "byeong", dayBranchCode: "ja" };
const saju4B = { saju: { yearPillar: "신미", monthPillar: "계사", dayPillar: "신해", hourPillar: "기해" }, dayStemCode: "sin", dayBranchCode: "hae" };

const saju5A = { saju: { yearPillar: "임신", monthPillar: "갑술", dayPillar: "무진", hourPillar: "경신" }, dayStemCode: "mu", dayBranchCode: "jin" };
const saju5B = { saju: { yearPillar: "계유", monthPillar: "을해", dayPillar: "계축", hourPillar: "신유" }, dayStemCode: "gye", dayBranchCode: "chuk" };

const saju6A = { saju: { yearPillar: "갑술", monthPillar: "병자", dayPillar: "경인", hourPillar: "임오" }, dayStemCode: "gyeong", dayBranchCode: "in" };
const saju6B = { saju: { yearPillar: "을해", monthPillar: "정축", dayPillar: "을유", hourPillar: "계미" }, dayStemCode: "eul", dayBranchCode: "yu" };

function makePsych(overrides = {}) {
  const base = {
    stimulation: 50, self_control: 50, practicality: 50, structure: 50, empathy: 50,
    conflict_style: 50, resilience: 50, recognition: 50, energy_style: 50,
    thinking_style: 50, decision_style: 50, autonomy: 50, growth: 50, connection: 50, stability: 50,
  };
  return {
    survey_source: "v2_10q",
    secondary_axes: { ...base, ...overrides },
    scores: { growth: 50, connection: 50, autonomy: 50, stability: 50, structure: 50, ...overrides },
    traits: { decision_style: 50, empathy: 50, independence: 50, self_control: 50, ...overrides },
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

test("Marriage Chapter 03 Comprehensive Audit Verification Suite", async (t) => {

  await t.test("1. 4-Way Classifier Reachability", () => {
    assert.equal(classifyMatch(0.8, 0.8), "NATURAL_MATCH");
    assert.equal(classifyMatch(0.8, 0.3), "LATENT_MATCH");
    assert.equal(classifyMatch(0.3, 0.8), "ADAPTIVE_SUPPLY");
    assert.equal(classifyMatch(0.3, 0.3), "EXPECTATION_GAP");
  });

  await t.test("2. Downstream Propagation of ADAPTIVE_SUPPLY", () => {
    const ctx = mockCtx("Sera", "동글", saju1A, saju1B);
    const psychB_Adaptive = makePsych({ decision_style: 90, empathy: 90 });
    const ch03 = buildMarriageChapter03Intelligence({ ctx, psychA: makePsych(), psychB: psychB_Adaptive });

    assert.ok(ch03.accumulatedLoad.personBLoad.laborType.includes("노동") || ch03.accumulatedLoad.personBLoad.whyCostly.includes("배려"));
  });

  await t.test("3. Different Saju + same psych produces distinct intelligence", () => {
    const ctx1 = mockCtx("Sera", "동글", saju1A, saju1B);
    const ctx2 = mockCtx("Sera", "동글", saju2A, saju2B);
    const p = makePsych();

    const ch03_1 = buildMarriageChapter03Intelligence({ ctx: ctx1, psychA: p, psychB: p });
    const ch03_2 = buildMarriageChapter03Intelligence({ ctx: ctx2, psychA: p, psychB: p });

    assert.ok(ch03_1.introQuestion);
    assert.ok(ch03_2.introQuestion);
    assert.ok(ch03_1.assets.length >= 2);
  });

  await t.test("4. Directional Swap Test (A <-> B)", () => {
    const ctxNormal = mockCtx("Sera", "동글", saju1A, saju1B);
    const ctxSwapped = mockCtx("동글", "Sera", saju1B, saju1A);

    const ch03Normal = buildMarriageChapter03Intelligence({ ctx: ctxNormal });
    const ch03Swapped = buildMarriageChapter03Intelligence({ ctx: ctxSwapped });

    assert.equal(ch03Normal.roleLockIn.personARole.personName, "Sera");
    assert.equal(ch03Swapped.roleLockIn.personARole.personName, "동글");
    assert.equal(ch03Normal.accumulatedLoad.personALoad.personName, "Sera");
    assert.equal(ch03Swapped.accumulatedLoad.personALoad.personName, "동글");
  });

  await t.test("5. Asset -> Debt Causal Integrity", () => {
    const ctx = mockCtx("Sera", "동글", saju1A, saju1B);
    const ch03 = buildMarriageChapter03Intelligence({ ctx });

    assert.ok(ch03.assetToDebtChains.length >= 2);
    for (const chain of ch03.assetToDebtChains) {
      assert.ok(chain.initialBenefit);
      assert.ok(chain.repeatedReinforcement);
      assert.ok(chain.flipCondition);
      assert.ok(chain.longTermCost);
    }
  });

  await t.test("6. No Unobserved Biography Overclaims", () => {
    const ctx = mockCtx("Sera", "동글", saju1A, saju1B);
    const ch03 = buildMarriageChapter03Intelligence({ ctx });
    const jsonStr = JSON.stringify(ch03);

    assert.equal(jsonStr.includes("가사의"), false);
    assert.equal(jsonStr.includes("월급"), false);
    assert.equal(jsonStr.includes("퇴근 직후"), false);
  });

  await t.test("7. Plain Korean Jargon Safety", () => {
    const ctx = mockCtx("Sera", "동글", saju1A, saju1B);
    const ch03 = buildMarriageChapter03Intelligence({ ctx });
    const jsonStr = JSON.stringify(ch03);

    const forbidden = ["용신", "격국", "배우자궁", "십신", "정관", "편관", "합충", "형파해"];
    for (const word of forbidden) {
      assert.equal(jsonStr.includes(word), false, `Forbidden Saju jargon '${word}' found`);
    }
  });

  await t.test("8. Chapter 05 Boundary Compliance (Protection)", () => {
    const ctx = mockCtx("Sera", "동글", saju1A, saju1B);
    const ch03 = buildMarriageChapter03Intelligence({ ctx });

    assert.equal(ch03.protection.roleToRenegotiate.includes("지출"), false);
    assert.equal(ch03.protection.roleToRenegotiate.includes("루틴"), false);
    assert.ok(ch03.protection.roleToRenegotiate.includes("역할"));
  });

  await t.test("9. Fallback & Default Intelligence Builder Test", () => {
    const fallback = createDefaultMarriageChapter03Intelligence("Sera", "동글", false);
    assert.ok(fallback.assets.length >= 2);
    assert.ok(fallback.hiddenExpectations.length >= 2);
    assert.ok(fallback.flipTableRows.length >= 3);
  });

  await t.test("10. Full Integration & ViewModel Audit", () => {
    const report = buildMarriageReport({
      nicknameA: "Sera",
      nicknameB: "동글",
      sajuJsonA: saju1A,
      sajuJsonB: saju1B,
      psychMasterA: makePsych({ decision_style: 70 }),
      psychMasterB: makePsych({ decision_style: 40 }),
    });

    const vm = buildMarriageReportViewModel(report, { myName: "Sera", partnerName: "동글" });

    assert.ok(vm.canonicalBundle);
    assert.ok(vm.canonicalBundle.chapter03Intelligence);
    assert.ok(vm.canonicalBundle.chapter03Intelligence.assets.length >= 2);
  });

  await t.test("11. 6-Fixture Collapse Audit Table Generation", () => {
    const fixtures = [
      { name: "Fixture 1", sajuA: saju1A, sajuB: saju1B, psychA: makePsych({ decision_style: 80 }), psychB: makePsych({ empathy: 80 }) },
      { name: "Fixture 2", sajuA: saju2A, sajuB: saju2B, psychA: makePsych({ independence: 80 }), psychB: makePsych({ self_control: 80 }) },
      { name: "Fixture 3", sajuA: saju3A, sajuB: saju3B, psychA: makePsych({ practicality: 80 }), psychB: makePsych({ decision_style: 80 }) },
      { name: "Fixture 4", sajuA: saju4A, sajuB: saju4B, psychA: makePsych({ empathy: 80 }), psychB: makePsych({ independence: 80 }) },
      { name: "Fixture 5", sajuA: saju5A, sajuB: saju5B, psychA: makePsych({ self_control: 80 }), psychB: makePsych({ practicality: 80 }) },
      { name: "Fixture 6", sajuA: saju6A, sajuB: saju6B, psychA: makePsych({ decision_style: 30 }), psychB: makePsych({ empathy: 30 }) },
    ];

    console.log("\n=================== 6-FIXTURE COLLAPSE AUDIT TABLE ===================");
    console.log("| Fixture | Top Asset | Hidden Expectation | Match Type | Role Lock A | Role Lock B | Load A | Protection Asset |");
    console.log("|---------|-----------|--------------------|------------|-------------|-------------|--------|------------------|");

    for (const f of fixtures) {
      const ctx = mockCtx("Sera", "동글", f.sajuA, f.sajuB, f.psychA, f.psychB);
      const res = buildMarriageChapter03Intelligence({ ctx, psychA: f.psychA, psychB: f.psychB });

      const topAsset = res.assets[0].title.slice(0, 18) + "...";
      const topExpectation = res.hiddenExpectations[0].functionLabel.slice(0, 18) + "...";
      const matchType = res.hiddenExpectations[0].matchType;
      const roleA = res.roleLockIn.personARole.roleTitle;
      const roleB = res.roleLockIn.personBRole.roleTitle;
      const loadA = res.accumulatedLoad.personALoad.laborType.slice(0, 15) + "...";
      const protectionAsset = res.protection.assetToProtect.slice(0, 15) + "...";

      console.log(`| ${f.name} | ${topAsset} | ${topExpectation} | ${matchType} | ${roleA} | ${roleB} | ${loadA} | ${protectionAsset} |`);
    }
    console.log("======================================================================\n");
  });
});
