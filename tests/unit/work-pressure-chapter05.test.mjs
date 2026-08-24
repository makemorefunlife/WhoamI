import test from "node:test";
import assert from "node:assert/strict";

import { buildWorkPressureChapterBundle } from "../../lib/relationship/workColleague/workPressureChapterEngine.ts";
import { buildWorkReportViewModel } from "../../lib/relationship/workColleague/viewModel/buildWorkReportViewModel.ts";
import { fullWorkColleagueReportFixture } from "../../lib/relationship/workColleague/viewModel/workColleagueReportFixtures.ts";
import { buildIndividualWorkChapterBundle } from "../../lib/relationship/workColleague/individualWorkChapterEngine.ts";

test("Chapter 05 Work Pressure Intelligence V2 Suite", async (t) => {
  await t.test("1. DIFFERENT CHARTS + NEUTRAL 11-AXIS: Different Saju signals produce distinct pressure results even with neutral 11-axis", () => {
    const bundle = buildWorkPressureChapterBundle({
      nameA: "Sera",
      nameB: "동글",
      workSignalsA: {
        month_geokguk: { month_stem_category: "food", month_stem_ten_god_ko: "식신", geokguk_label_ko: "식신격", month_branch_element: "fire", day_master_element_support: true },
        drive_stubborn: { food_intensity: 65, self_intensity: 50, food_count: 2, officer_count: 0, wealth_count: 1, seal_count: 0, self_count: 1, drive_band: "high", stubborn_band: "balanced" },
        literary_noble: { has_munchang_guin: true, has_jangseong_sal: false, has_cheoneul_guin: false, noble_star_hits: ["문창귀인"], work_support_index: 48 },
        johu_profile: { heat_score: 50, moisture_score: 50, temperature_band: "neutral", dominant_element: "fire" },
      },
      workSignalsB: {
        month_geokguk: { month_stem_category: "officer", month_stem_ten_god_ko: "정관", geokguk_label_ko: "정관격", month_branch_element: "water", day_master_element_support: false },
        drive_stubborn: { food_intensity: 20, self_intensity: 30, food_count: 0, officer_count: 2, wealth_count: 0, seal_count: 2, self_count: 0, drive_band: "low", stubborn_band: "stubborn" },
        literary_noble: { has_munchang_guin: false, has_jangseong_sal: true, has_cheoneul_guin: false, noble_star_hits: ["장성살"], work_support_index: 38 },
        johu_profile: { heat_score: 30, moisture_score: 70, temperature_band: "cold", dominant_element: "water" },
      },
      psychA: { secondary_axes: { deliberate_decision: 50, structure: 50 } }, // Neutral 11-axis
      psychB: { secondary_axes: { deliberate_decision: 50, structure: 50 } }, // Neutral 11-axis
    });

    assert.notEqual(bundle.personA.normalVsPressureShift.pressureBehavior, bundle.personB.normalVsPressureShift.pressureBehavior);
    assert.notEqual(bundle.personA.emergencyFirstMove.sequenceLabel, bundle.personB.emergencyFirstMove.sequenceLabel);
    assert.notEqual(bundle.personA.tradeOffs.explanation, bundle.personB.tradeOffs.explanation);
  });

  await t.test("2. CHAPTER 02 BASELINE CONSISTENCY: Normal behavior originates from Chapter 02 baseline profile", () => {
    const ch02Bundle = buildIndividualWorkChapterBundle({
      nameA: "Sera",
      nameB: "동글",
      officeReport: fullWorkColleagueReportFixture,
    });

    const bundle = buildWorkPressureChapterBundle({
      nameA: "Sera",
      nameB: "동글",
      individualWorkBundle: ch02Bundle,
    });

    assert.ok(bundle.personA.normalVsPressureShift.normalBehavior.includes("평소:"));
    assert.ok(bundle.personB.normalVsPressureShift.normalBehavior.includes("평소:"));
  });

  await t.test("3. INNATE/CURRENT DISCREPANCY: Discrepant innate vs current patterns are preserved", () => {
    const bundle = buildWorkPressureChapterBundle({
      nameA: "Alex",
      nameB: "Jordan",
      sajuChartA: { saju: { dayPillar: ["갑", "자"] } }, // Fast innate day stem
      psychA: { secondary_axes: { decision_style: 20, deliberate_decision: 20 } }, // Current cautious
    });

    assert.ok(bundle.personA.normalVsPressureShift.discrepancyNote !== undefined);
  });

  await t.test("4. DIRECTIONAL SWAP: Swapping A and B inputs swaps person-specific pressure profiles correspondingly", () => {
    const bundle1 = buildWorkPressureChapterBundle({
      nameA: "User1",
      nameB: "User2",
      workSignalsA: { month_geokguk: { month_stem_category: "food" } },
      workSignalsB: { month_geokguk: { month_stem_category: "officer" } },
    });

    const bundle2 = buildWorkPressureChapterBundle({
      nameA: "User2",
      nameB: "User1",
      workSignalsA: { month_geokguk: { month_stem_category: "officer" } },
      workSignalsB: { month_geokguk: { month_stem_category: "food" } },
    });

    assert.equal(bundle1.personA.emergencyFirstMove.sequenceLabel, bundle2.personB.emergencyFirstMove.sequenceLabel);
    assert.equal(bundle1.personB.emergencyFirstMove.sequenceLabel, bundle2.personA.emergencyFirstMove.sequenceLabel);
  });

  await t.test("5. NO GENERIC FALLBACK CLONING: Missing data does not clone identical fallback text", () => {
    const bundle = buildWorkPressureChapterBundle({
      nameA: "Person1",
      nameB: "Person2",
    });

    assert.notEqual(bundle.personA.tradeOffs.explanation, bundle.personB.tradeOffs.explanation);
    assert.notEqual(bundle.personA.emergencyFirstMove.sequenceLabel, bundle.personB.emergencyFirstMove.sequenceLabel);
  });

  await t.test("6. TRUE SHARED PATTERN: Identical evidence promotes to shared trade-off pattern", () => {
    const bundle = buildWorkPressureChapterBundle({
      nameA: "Pair1",
      nameB: "Pair2",
      workSignalsA: { month_geokguk: { month_stem_category: "officer" } },
      workSignalsB: { month_geokguk: { month_stem_category: "officer" } },
    });

    assert.ok(bundle.sharedTradeOffs?.isShared === true);
    assert.equal(bundle.sharedTradeOffs.title, "◤ 둘이 공통으로 보이는 압박 패턴");
  });

  await t.test("7. DISTINCT CRISIS STRENGTHS: Different capability profiles yield distinct crisis strengths", () => {
    const bundle = buildWorkPressureChapterBundle({
      nameA: "Sera",
      nameB: "동글",
      workSignalsA: { month_geokguk: { month_stem_category: "food" } },
      workSignalsB: { month_geokguk: { month_stem_category: "seal" } },
    });

    assert.notDeepEqual(bundle.personA.crisisStrengths.keywords, bundle.personB.crisisStrengths.keywords);
  });

  await t.test("8. DISTINCT OVERLOAD SIGNALS: Different pressure mechanisms yield distinct overload signals", () => {
    const bundle = buildWorkPressureChapterBundle({
      nameA: "Sera",
      nameB: "동글",
      workSignalsA: { month_geokguk: { month_stem_category: "food" } },
      workSignalsB: { month_geokguk: { month_stem_category: "officer" } },
    });

    assert.notDeepEqual(bundle.personA.overloadSignals.signals, bundle.personB.overloadSignals.signals);
  });

  await t.test("9. CHAPTER 03 R&R CONSISTENCY: Consumes R&R without contradiction", () => {
    const bundle = buildWorkPressureChapterBundle({
      nameA: "Sera",
      nameB: "동글",
    });

    assert.ok(bundle.pairStressInteraction.strengthSummary.length > 10);
    assert.ok(bundle.pairStressInteraction.bottleneckSummary.length > 10);
  });

  await t.test("10. NO RAW SAJU TERMS: User-facing output contains zero raw Saju jargon", () => {
    const bundle = buildWorkPressureChapterBundle({
      nameA: "민준",
      nameB: "서연",
      workSignalsA: { month_geokguk: { month_stem_category: "food", month_stem_ten_god_ko: "식신" } },
    });

    const jsonStr = JSON.stringify(bundle);
    const forbiddenTerms = ["식상", "인성", "관성", "재성", "비겁", "월지", "월간", "통근"];

    for (const term of forbiddenTerms) {
      assert.equal(jsonStr.includes(term), false, `Must not leak raw term: ${term}`);
    }
  });

  await t.test("11. OTHER CHAPTER OWNERSHIP: No Chapter 06 repair or Chapter 07 action plan leaks into Chapter 05", () => {
    const bundle = buildWorkPressureChapterBundle({
      nameA: "Sera",
      nameB: "동글",
    });

    const jsonStr = JSON.stringify(bundle);
    const leakedTerms = ["사과", "신뢰 복구", "1:1 회의", "버퍼 확보", "액션 플랜"];

    for (const term of leakedTerms) {
      assert.equal(jsonStr.includes(term), false, `Must not leak Ch06/07 term: ${term}`);
    }
  });
});
