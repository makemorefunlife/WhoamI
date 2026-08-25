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

test("Marriage Chapter 04 Final V3 Multi-Evidence Suite", async (t) => {

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

  await t.test("2. Pair Intimacy Chemistry (HERO) Section Audit", () => {
    const ctx = mockCtx("Sera", "동글", saju1A, saju1B);
    const ch04 = buildMarriageChapter04Intelligence({ ctx });

    assert.ok(ch04.pairChemistry.heroIdentity);
    assert.ok(ch04.pairChemistry.synthesisNarrative);
    assert.ok(ch04.pairChemistry.attractionNarrative);
    assert.ok(ch04.pairChemistry.comfortNarrative);
    assert.ok(["HIGH_PULL", "STEADY_BOND", "MODERATE_PULL", "SLOW_WARMING"].includes(ch04.pairChemistry.attractionLevel));
    assert.ok(["HIGH_SAFETY", "MODERATE_SAFETY", "BUILDING_TRUST"].includes(ch04.pairChemistry.safetyLevel));
  });

  await t.test("3. Stability vs Novelty Multi-Evidence Diversity", () => {
    const pNov = makePsych({ stimulation: 75 });
    const pStab = makePsych({ stimulation: 35 });

    const ctxGap = mockCtx("Sera", "동글", saju4A, saju5B, pNov, pStab);
    const intelGap = buildMarriageChapter04Intelligence({ ctx: ctxGap, psychA: pNov, psychB: pStab });

    assert.ok(["NOVELTY_GAP_A", "NOVELTY_GAP_B", "NOVELTY_MATCH", "STABILITY_MATCH", "BALANCED"].includes(intelGap.stabilityVsNovelty.classification));
    assert.ok(intelGap.stabilityVsNovelty.headline);
    assert.ok(intelGap.stabilityVsNovelty.personAInnate);
    assert.ok(intelGap.stabilityVsNovelty.personACurrent);
  });

  await t.test("4. Activation Modes & Intimacy Rhythm Multi-Evidence Audit", () => {
    const pFast = makePsych({ energy_style: 80, stimulation: 80 });
    const pSlow = makePsych({ energy_style: 30, stimulation: 30 });

    const ctxDiff = mockCtx("Sera", "동글", saju1A, saju2B, pFast, pSlow);
    const intelDiff = buildMarriageChapter04Intelligence({ ctx: ctxDiff, psychA: pFast, psychB: pSlow });

    assert.ok(intelDiff.activationAndRhythm.personAMode.modeTitle);
    assert.ok(intelDiff.activationAndRhythm.personBMode.modeTitle);
    assert.ok(["MATCHED_RHYTHM", "A_FAST_B_SLOW", "B_FAST_A_SLOW", "CONTEXT_DEPENDENT", "UNCERTAIN"].includes(intelDiff.activationAndRhythm.rhythmFitClassification));
    assert.ok(intelDiff.activationAndRhythm.headline);
  });

  await t.test("5. Initiation, Lead & Response Multi-Evidence Audit", () => {
    const pInit = makePsych({ decision_style: 85, energy_style: 80 });
    const pWait = makePsych({ decision_style: 30, energy_style: 30 });

    const ctxInit = mockCtx("Sera", "동글", saju3A, saju1B, pInit, pWait);
    const intelInit = buildMarriageChapter04Intelligence({ ctx: ctxInit, psychA: pInit, psychB: pWait });

    assert.ok(["A_INITIATES_B_RESPONDS", "B_INITIATES_A_RESPONDS", "MUTUAL_INITIATION", "MUTUAL_WAITING", "CONTEXT_SWITCHING", "UNCERTAIN"].includes(intelInit.initiationLeadResponse.classification));
    assert.ok(intelInit.initiationLeadResponse.personAAgency);
    assert.ok(intelInit.initiationLeadResponse.personBAgency);
  });

  await t.test("6. Intimate Attunement Section Audit", () => {
    const ctx = mockCtx("Sera", "동글", saju1A, saju1B);
    const ch04 = buildMarriageChapter04Intelligence({ ctx });

    assert.ok(ch04.intimateAttunement.personAAttunement.styleTitle);
    assert.ok(ch04.intimateAttunement.personBAttunement.styleTitle);
    assert.ok(ch04.intimateAttunement.attunementInsight);
  });

  await t.test("7. Desire Mismatch & Shared Rejection Pattern Promotion", () => {
    const psychHighEmpathy = makePsych({ empathy: 80 });
    const ctx = mockCtx("Sera", "동글", saju1A, saju1B, psychHighEmpathy, psychHighEmpathy);
    const ch04 = buildMarriageChapter04Intelligence({ ctx, psychA: psychHighEmpathy, psychB: psychHighEmpathy });

    assert.equal(ch04.desireMismatchAndRejection.isSharedPattern, true);
    assert.ok(ch04.desireMismatchAndRejection.sharedPatternSummary);
  });

  await t.test("8. Pair Intimacy Paradox Derivation", () => {
    const ctx = mockCtx("Sera", "동글", saju1A, saju1B);
    const ch04 = buildMarriageChapter04Intelligence({ ctx });

    assert.ok(ch04.pairIntimacyParadox);
    assert.ok(ch04.pairIntimacyParadox.headline);
    assert.ok(ch04.pairIntimacyParadox.whenThriving);
    assert.ok(ch04.pairIntimacyParadox.whenFriction);
  });

  await t.test("9. BONUS Sleep Compatibility (Single Sentence Interpretation & Confidence Gate OMIT)", () => {
    const ctx = mockCtx("Sera", "동글", saju4A, saju1B);
    const ch04 = buildMarriageChapter04Intelligence({ ctx });

    assert.ok(ch04.sleepCompatibility);
    assert.equal(typeof ch04.sleepCompatibility.pairInterpretation, "string");
    assert.ok(ch04.sleepCompatibility.pairInterpretation.length > 10);
    assert.ok(ch04.sleepCompatibility.isSupported);

    // Verify it is a single sentence (at most 1 period/sentence structure)
    const sentenceCount = ch04.sleepCompatibility.pairInterpretation.split(".").filter(s => s.trim().length > 0).length;
    assert.ok(sentenceCount <= 1, `Expected single sentence interpretation, got ${sentenceCount} sentences!`);

    const str = JSON.stringify(ch04.sleepCompatibility);
    const forbiddenMedicalOrAdvice = [
      "불면증", "수면 장애", "침대 분리", "매트리스 분리", "의학적",
      "수면 가이드", "수면 처방", "맞추세요", "취침 템포가 잘 맞는다", "소리에 잘 깬다", "피로를 잘 회복한다"
    ];
    for (const word of forbiddenMedicalOrAdvice) {
      assert.equal(str.includes(word), false, `Forbidden medical/advice/overclaiming copy '${word}' found in sleepCompatibility!`);
    }
  });

  await t.test("10. Zero Crude Sexual Performance Copy & Saju Jargon Audit", () => {
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

    const forbiddenSaju = ["용신", "격국", "배우자궁", "십신", "정관", "편관", "합충형파해"];
    for (const word of forbiddenSaju) {
      assert.equal(str.includes(word), false, `Forbidden Saju jargon '${word}' found in Chapter 04!`);
    }
  });

  await t.test("11. Chapter 01 vs Chapter 04 Semantic Separation Audit", () => {
    const ctx = mockCtx("Sera", "동글", saju1A, saju1B);
    const ch01 = buildMarriageChapter01Intelligence({ ctx });
    const ch04 = buildMarriageChapter04Intelligence({ ctx });

    assert.notEqual(JSON.stringify(ch01.needsAndCapabilities), JSON.stringify(ch04.loveTransmission));
    assert.ok(ch04.loveTransmission[0].senderNaturalExpression);
    assert.ok(ch04.loveTransmission[0].receiverReceptionNeed);
  });

  await t.test("12. 6-Fixture Diversity Audit Table Generation", () => {
    const fixtures = [
      { name: "Fixture 1", sajuA: saju1A, sajuB: saju1B, psychA: makePsych({ stimulation: 80, energy_style: 80 }), psychB: makePsych({ empathy: 80, stimulation: 30 }) },
      { name: "Fixture 2", sajuA: saju2A, sajuB: saju2B, psychA: makePsych({ decision_style: 80 }), psychB: makePsych({ self_control: 80 }) },
      { name: "Fixture 3", sajuA: saju3A, sajuB: saju3B, psychA: makePsych({ practicality: 80 }), psychB: makePsych({ decision_style: 80 }) },
      { name: "Fixture 4", sajuA: saju4A, sajuB: saju4B, psychA: makePsych({ empathy: 80 }), psychB: makePsych({ independence: 80 }) },
      { name: "Fixture 5", sajuA: saju5A, sajuB: saju5B, psychA: makePsych({ self_control: 80 }), psychB: makePsych({ practicality: 80 }) },
      { name: "Fixture 6", sajuA: saju6A, sajuB: saju6B, psychA: makePsych({ decision_style: 30 }), psychB: makePsych({ empathy: 30 }) },
    ];

    console.log("\n=================== CHAPTER 04 V3 6-FIXTURE DIVERSITY AUDIT TABLE ===================");
    console.log("| Fixture | Hero Chemistry | Stability/Novelty | Rhythm | Initiation | Paradox |");
    console.log("|---------|----------------|-------------------|--------|------------|---------|");

    for (const f of fixtures) {
      const ctx = mockCtx("Sera", "동글", f.sajuA, f.sajuB, f.psychA, f.psychB);
      const res = buildMarriageChapter04Intelligence({ ctx, psychA: f.psychA, psychB: f.psychB });

      const hero = res.pairChemistry.heroIdentity.slice(0, 15) + "...";
      const nov = res.stabilityVsNovelty.classification;
      const rhythm = res.activationAndRhythm.rhythmFitClassification;
      const init = res.initiationLeadResponse.classification;
      const paradox = res.pairIntimacyParadox.paradoxType;

      console.log(`| ${f.name} | ${hero} | ${nov} | ${rhythm} | ${init} | ${paradox} |`);
    }
    console.log("=====================================================================================\n");
  });
});
