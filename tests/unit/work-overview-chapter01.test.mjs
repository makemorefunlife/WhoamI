import test from "node:test";
import assert from "node:assert/strict";

import { buildWorkOverviewChapterBundle } from "../../lib/relationship/workColleague/workOverviewChapterEngine.ts";
import { buildCanonicalWorkStoryPlan } from "../../lib/relationship/workColleague/buildCanonicalWorkStoryPlan.ts";
import { buildWorkReportViewModel } from "../../lib/relationship/workColleague/viewModel/buildWorkReportViewModel.ts";
import { fullWorkColleagueReportFixture } from "../../lib/relationship/workColleague/viewModel/workColleagueReportFixtures.ts";

test("Chapter 01 Work Overview & Score Engine Suite", async (t) => {
  await t.test("1. Hero AI-summary and grade redundancy removed from opening", () => {
    const report = fullWorkColleagueReportFixture;
    const vm = buildWorkReportViewModel(report, {
      viewerIsReportA: true,
      myName: "Sera",
      partnerName: "동글",
      locale: "ko-KR",
    });

    assert.equal(vm.opening.headline, "Sera × 동글 업무 파트너십 분석");
    assert.equal(vm.opening.subtitle, "");
    assert.equal(vm.opening.grade, "");
  });

  await t.test("2. Chapter 01 overviewChapterBundle renders 3 cards with all 4 mandatory elements", () => {
    const report = fullWorkColleagueReportFixture;
    const vm = buildWorkReportViewModel(report, {
      viewerIsReportA: true,
      myName: "Sera",
      partnerName: "동글",
      locale: "ko-KR",
    });

    const bundle = vm.storyPlan?.overviewChapterBundle;
    assert.ok(bundle, "overviewChapterBundle must exist");

    // 1. Work Fit Card
    assert.ok(bundle.workFitCard.score > 0);
    assert.ok(bundle.workFitCard.qualitativeLabel.length > 0);
    assert.ok(bundle.workFitCard.measuresWhat.includes("서로의 업무 템포"));
    assert.ok(bundle.workFitCard.whyThisScore.length > 10);
    assert.ok(bundle.workFitCard.realWorkScene.length > 10);

    // 2. Synergy Card
    assert.ok(bundle.synergyCard.score > 0);
    assert.ok(bundle.synergyCard.qualitativeLabel.length > 0);
    assert.ok(bundle.synergyCard.measuresWhat.includes("서로 다른 강점"));
    assert.ok(bundle.synergyCard.whyThisScore.length > 10);
    assert.ok(bundle.synergyCard.realWorkScene.length > 10);

    // 3. Office Risk Card
    assert.ok(bundle.officeRiskCard.score > 0);
    assert.ok(bundle.officeRiskCard.qualitativeLabel.length > 0);
    assert.ok(bundle.officeRiskCard.measuresWhat.includes("번질 가능성"));
    assert.ok(bundle.officeRiskCard.whyThisScore.length > 10);
    assert.ok(bundle.officeRiskCard.realWorkScene.length > 10);
  });

  await t.test("3. Project Lifecycle Narrative and Team Portrait are generated for Chapter 01", () => {
    const report = fullWorkColleagueReportFixture;
    const vm = buildWorkReportViewModel(report, {
      viewerIsReportA: true,
      myName: "Sera",
      partnerName: "동글",
      locale: "ko-KR",
    });

    const bundle = vm.storyPlan?.overviewChapterBundle;
    assert.ok(bundle?.lifecycleNarrative.kickoff.body.length > 10);
    assert.ok(bundle?.lifecycleNarrative.inFlight.body.length > 10);
    assert.ok(bundle?.lifecycleNarrative.synergyMoment.body.length > 10);
    assert.ok(bundle?.lifecycleNarrative.frictionMoment.body.length > 10);

    assert.ok(bundle?.teamPortrait.headline.length > 5);
    assert.ok(bundle?.teamPortrait.body.length > 10);
  });

  await t.test("4. Zero raw Saju technical terms leak to user-facing output", () => {
    const report = fullWorkColleagueReportFixture;
    const vm = buildWorkReportViewModel(report, {
      viewerIsReportA: true,
      myName: "Sera",
      partnerName: "동글",
      locale: "ko-KR",
    });

    const bundle = vm.storyPlan?.overviewChapterBundle;
    const jsonStr = JSON.stringify(bundle);

    const forbiddenSaju = ["천간", "지지", "십성", "일간", "신살", "편관", "정관", "식신", "상관", "편인", "정인"];
    for (const term of forbiddenSaju) {
      assert.equal(jsonStr.includes(term), false, `Must not leak Saju term: ${term}`);
    }
  });

  await t.test("5. Korean particles are formatted properly with zero broken particles", () => {
    const report = fullWorkColleagueReportFixture;
    const vm = buildWorkReportViewModel(report, {
      viewerIsReportA: true,
      myName: "Sera",
      partnerName: "동글",
      locale: "ko-KR",
    });

    const bundle = vm.storyPlan?.overviewChapterBundle;
    const jsonStr = JSON.stringify(bundle);

    const brokenParticles = ["동글는", "동글가", "동글을", "Sera은", "Sera이"];
    for (const particle of brokenParticles) {
      assert.equal(jsonStr.includes(particle), false, `Must not contain broken particle: ${particle}`);
    }
  });

  await t.test("6. Cross-pair variance proof (Different evidence yields different explanations & scenes)", () => {
    const pair1 = buildWorkOverviewChapterBundle({
      nameA: "Sera",
      nameB: "동글",
      fitPct: 85,
      synergyPct: 82,
      riskPct: 15,
      psychA: { secondaryAxes: { self_control: 80, analytical_thinking: 75 } },
      psychB: { secondaryAxes: { self_control: 78, analytical_thinking: 70 } },
    });

    const pair2 = buildWorkOverviewChapterBundle({
      nameA: "민준",
      nameB: "서연",
      fitPct: 45,
      synergyPct: 55,
      riskPct: 70,
      psychA: { secondaryAxes: { self_control: 20, analytical_thinking: 30 } },
      psychB: { secondaryAxes: { self_control: 85, analytical_thinking: 90 } },
    });

    assert.notEqual(pair1.workFitCard.whyThisScore, pair2.workFitCard.whyThisScore);
    assert.notEqual(pair1.workFitCard.realWorkScene, pair2.workFitCard.realWorkScene);
    assert.notEqual(pair1.officeRiskCard.qualitativeLabel, pair2.officeRiskCard.qualitativeLabel);
    assert.notEqual(pair1.officeRiskCard.whyThisScore, pair2.officeRiskCard.whyThisScore);
  });
});
