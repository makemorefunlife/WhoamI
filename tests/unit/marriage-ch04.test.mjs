import test from "node:test";
import assert from "node:assert/strict";
import {
  buildMarriageChapter04Intelligence,
  createDefaultMarriageChapter04Intelligence,
} from "../../lib/relationship/marriage/marriageChapter04Intelligence.ts";
import { buildMarriageRuleContext } from "../../lib/relationship/marriage/buildMarriageRuleContext.ts";
import { buildMarriageReport } from "../../lib/relationship/marriage/buildMarriageReport.ts";
import { buildMarriageReportViewModel } from "../../lib/relationship/marriage/viewModel/buildMarriageReportViewModel.ts";
import { buildMarriageChapter01Intelligence } from "../../lib/relationship/marriage/marriageChapter01Intelligence.ts";

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

test("Marriage Chapter 04 V2 Full Rebuild Comprehensive Suite", async (t) => {

  await t.test("1. Love Transmission Match Types Reachability", () => {
    const ctx = mockCtx("Sera", "동글", saju1A, saju1B);
    const ch04 = buildMarriageChapter04Intelligence({ ctx });

    assert.ok(ch04.loveTransmission.length >= 2);
    for (const chan of ch04.loveTransmission) {
      assert.ok(["DIRECT_MATCH", "PARTIAL_MATCH", "MISSED_SIGNAL", "ADAPTIVE_EXPRESSION"].includes(chan.matchType));
      assert.ok(chan.senderNaturalExpression);
      assert.ok(chan.receiverReceptionNeed);
      assert.ok(chan.matchNarrative);
    }
  });

  await t.test("2. Saju Intimacy Pair 5-Dimension Audit", () => {
    const ctx = mockCtx("Sera", "동글", saju1A, saju1B);
    const ch04 = buildMarriageChapter04Intelligence({ ctx });

    assert.ok(ch04.sajuIntimacyPair.attractionInsight.title);
    assert.ok(ch04.sajuIntimacyPair.rhythmFit.title);
    assert.ok(ch04.sajuIntimacyPair.stabilityVsNovelty.title);
    assert.ok(ch04.sajuIntimacyPair.leadAndResponse.title);
    assert.ok(ch04.sajuIntimacyPair.comfortVsActivation.title);
  });

  await t.test("3. Bedroom Temperature Activation Modes", () => {
    const ctx = mockCtx("Sera", "동글", saju1A, saju1B, makePsych({ energy_style: 75 }), makePsych({ adaptability: 75 }));
    const ch04 = buildMarriageChapter04Intelligence({ ctx, psychA: makePsych({ energy_style: 75 }), psychB: makePsych({ adaptability: 75 }) });

    assert.ok(ch04.bedroomTemperature.personAMode.modeTitle);
    assert.ok(ch04.bedroomTemperature.personBMode.modeTitle);
    assert.ok(ch04.bedroomTemperature.temperatureRhythmNarrative);
  });

  await t.test("4. Desire Mismatch & Rejection Reconnection Audit", () => {
    const ctx = mockCtx("Sera", "동글", saju1A, saju1B);
    const ch04 = buildMarriageChapter04Intelligence({ ctx });

    assert.ok(ch04.desireMismatchAndRejection.personARejection.interpretation);
    assert.ok(ch04.desireMismatchAndRejection.personARejection.reconnectionNeed);
    assert.ok(ch04.desireMismatchAndRejection.mismatchAdvice);
  });

  await t.test("5. Shared Rejection Pattern Promotion", () => {
    const psychHighEmpathy = makePsych({ empathy: 80 });
    const ctx = mockCtx("Sera", "동글", saju1A, saju1B, psychHighEmpathy, psychHighEmpathy);
    const ch04 = buildMarriageChapter04Intelligence({ ctx, psychA: psychHighEmpathy, psychB: psychHighEmpathy });

    assert.equal(ch04.desireMismatchAndRejection.isSharedPattern, true);
    assert.ok(ch04.desireMismatchAndRejection.sharedPatternSummary);
  });

  await t.test("6. No Unsupported Sexual Performance Copy", () => {
    const ctx = mockCtx("Sera", "동글", saju1A, saju1B);
    const ch04 = buildMarriageChapter04Intelligence({ ctx });
    const str = JSON.stringify(ch04);

    const forbiddenSexual = [
      "마라톤형", "단거리 연출가형", "밤새 지치지 않는", "체력의 소유자",
      "화려한 테크닉", "절정에서 희열", "성관계", "발기",
    ];

    for (const word of forbiddenSexual) {
      assert.equal(str.includes(word), false, `Crude sexual performance jargon '${word}' found in Chapter 04!`);
    }
  });

  await t.test("7. No Raw Saju Jargon Leak", () => {
    const ctx = mockCtx("Sera", "동글", saju1A, saju1B);
    const ch04 = buildMarriageChapter04Intelligence({ ctx });
    const str = JSON.stringify(ch04);

    const forbiddenSaju = ["용신", "격국", "배우자궁", "십신", "정관", "편관", "합충형파해"];
    for (const word of forbiddenSaju) {
      assert.equal(str.includes(word), false, `Forbidden Saju jargon '${word}' found in Chapter 04!`);
    }
  });

  await t.test("8. Chapter 01 vs Chapter 04 Semantic Separation Audit", () => {
    const ctx = mockCtx("Sera", "동글", saju1A, saju1B);
    const ch01 = buildMarriageChapter01Intelligence({ ctx });
    const ch04 = buildMarriageChapter04Intelligence({ ctx });

    assert.notEqual(JSON.stringify(ch01.needsAndCapabilities), JSON.stringify(ch04.loveTransmission));
    assert.ok(ch04.loveTransmission[0].senderNaturalExpression);
    assert.ok(ch04.loveTransmission[0].receiverReceptionNeed);
  });

  await t.test("9. Fallback Helper Integrity", () => {
    const fallback = createDefaultMarriageChapter04Intelligence("Sera", "동글", false);
    assert.ok(fallback.loveTransmission.length >= 2);
    assert.ok(fallback.sajuIntimacyPair.attractionInsight.title);
    assert.ok(fallback.bedroomTemperature.personAMode.modeTitle);
  });

  await t.test("10. Full Integration & ViewModel Audit", () => {
    const report = buildMarriageReport({
      nicknameA: "Sera",
      nicknameB: "동글",
      sajuJsonA: saju1A,
      sajuJsonB: saju1B,
      psychMasterA: makePsych({ energy_style: 70 }),
      psychMasterB: makePsych({ energy_style: 40 }),
    });

    const vm = buildMarriageReportViewModel(report, { myName: "Sera", partnerName: "동글" });

    assert.ok(vm.canonicalBundle);
    assert.ok(vm.canonicalBundle.chapter04Intelligence);
    assert.ok(vm.canonicalBundle.chapter04Intelligence.loveTransmission.length >= 2);
  });

  await t.test("11. 6-Fixture Collapse Audit Table Generation", () => {
    const fixtures = [
      { name: "Fixture 1", sajuA: saju1A, sajuB: saju1B, psychA: makePsych({ energy_style: 80 }), psychB: makePsych({ empathy: 80 }) },
      { name: "Fixture 2", sajuA: saju2A, sajuB: saju2B, psychA: makePsych({ independence: 80 }), psychB: makePsych({ self_control: 80 }) },
      { name: "Fixture 3", sajuA: saju3A, sajuB: saju3B, psychA: makePsych({ practicality: 80 }), psychB: makePsych({ decision_style: 80 }) },
      { name: "Fixture 4", sajuA: saju4A, sajuB: saju4B, psychA: makePsych({ empathy: 80 }), psychB: makePsych({ independence: 80 }) },
      { name: "Fixture 5", sajuA: saju5A, sajuB: saju5B, psychA: makePsych({ self_control: 80 }), psychB: makePsych({ practicality: 80 }) },
      { name: "Fixture 6", sajuA: saju6A, sajuB: saju6B, psychA: makePsych({ decision_style: 30 }), psychB: makePsych({ empathy: 30 }) },
    ];

    console.log("\n=================== CHAPTER 04 6-FIXTURE COLLAPSE AUDIT TABLE ===================");
    console.log("| Fixture | Love A->B | Love B->A | Rhythm | Stability/Novelty | Temp A | Temp B | Reconnection A |");
    console.log("|---------|-----------|-----------|--------|-------------------|--------|--------|----------------|");

    for (const f of fixtures) {
      const ctx = mockCtx("Sera", "동글", f.sajuA, f.sajuB, f.psychA, f.psychB);
      const res = buildMarriageChapter04Intelligence({ ctx, psychA: f.psychA, psychB: f.psychB });

      const txA = res.loveTransmission[0].matchType;
      const txB = res.loveTransmission[1].matchType;
      const rhythm = res.sajuIntimacyPair.rhythmFit.classification;
      const stab = res.sajuIntimacyPair.stabilityVsNovelty.classification;
      const tempA = res.bedroomTemperature.personAMode.modeTitle.slice(0, 12);
      const tempB = res.bedroomTemperature.personBMode.modeTitle.slice(0, 12);
      const reconA = res.desireMismatchAndRejection.personARejection.reconnectionNeed.slice(0, 15) + "...";

      console.log(`| ${f.name} | ${txA} | ${txB} | ${rhythm} | ${stab} | ${tempA} | ${tempB} | ${reconA} |`);
    }
    console.log("=================================================================================\n");
  });
});
