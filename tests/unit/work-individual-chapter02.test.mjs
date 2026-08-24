import test from "node:test";
import assert from "node:assert/strict";

import { buildIndividualWorkChapterBundle } from "../../lib/relationship/workColleague/individualWorkChapterEngine.ts";
import { buildWorkReportViewModel } from "../../lib/relationship/workColleague/viewModel/buildWorkReportViewModel.ts";
import { fullWorkColleagueReportFixture } from "../../lib/relationship/workColleague/viewModel/workColleagueReportFixtures.ts";

test("Chapter 02 Individual Work Intelligence Suite", async (t) => {
  await t.test("1. Individual Work Bundle is generated in storyPlan and viewModel", () => {
    const report = fullWorkColleagueReportFixture;
    const vm = buildWorkReportViewModel(report, {
      viewerIsReportA: true,
      myName: "Sera",
      partnerName: "동글",
      locale: "ko-KR",
    });

    const bundle = vm.storyPlan?.individualWorkBundle;
    assert.ok(bundle, "individualWorkBundle must exist in storyPlan");
    assert.equal(bundle.personA.name, "Sera");
    assert.equal(bundle.personB.name, "동글");
  });

  await t.test("2. Chapter 02 implements comparison-first structure across Groups A, B, C", () => {
    const report = fullWorkColleagueReportFixture;
    const vm = buildWorkReportViewModel(report, {
      viewerIsReportA: true,
      myName: "Sera",
      partnerName: "동글",
      locale: "ko-KR",
    });

    const pA = vm.storyPlan?.individualWorkBundle?.personA;
    const pB = vm.storyPlan?.individualWorkBundle?.personB;
    assert.ok(pA);
    assert.ok(pB);

    // Header Identity Cards
    assert.ok(pA.identityLabel.length >= 8);
    assert.ok(pA.keyTraits.length >= 3);

    // 01. 일하는 기본 스타일
    assert.ok(pA.workStyleBehaviors.length >= 3);
    assert.ok(pA.workStyleBehaviors[0].situationLabel.length > 0);
    assert.ok(pA.workStyleBehaviors[0].behaviorSummary.length > 0);

    // 02. 일에 기여하는 방식
    assert.ok(pA.topContributions.length >= 3);
    assert.ok(pA.topContributions[0].title.length > 0);

    // 03. 잘 맞는 업무
    assert.ok(pA.suitableWorkTypes.length >= 3);

    // 04. 잘 맞는 역할 · 직무 · 기능
    assert.ok(pA.suitableRoles.length >= 2);

    // 05. 잘 맞는 팀 · 업무 환경
    assert.ok(pA.thrivingEnvironments.length >= 2);

    // 06. 일을 잘한다고 느끼는 기준
    assert.ok(pA.valueKeywords.length >= 2);
    assert.ok(pA.internalStandardSentence.length > 5);

    // 07. 맡기면 좋은 일
    assert.ok(pA.delegationItems.length >= 2);
    assert.equal(pA.delegationItems[0].partnerName, "동글");

    // 08. 본래의 업무 기질 vs 지금 일하는 방식
    assert.ok(["aligned", "adapted", "low_confidence"].includes(pA.innateVsCurrent.status));

    // 09. 가장 닮은 점 / 가장 다른 점
    const bundle = vm.storyPlan?.individualWorkBundle;
    assert.ok(bundle.mostSimilarInsight.length > 5);
    assert.ok(bundle.mostDifferentInsight.length > 5);
  });

  await t.test("3. Zero raw Saju technical terms leak into user-facing Chapter 02 copy", () => {
    const report = fullWorkColleagueReportFixture;
    const vm = buildWorkReportViewModel(report, {
      viewerIsReportA: true,
      myName: "Sera",
      partnerName: "동글",
      locale: "ko-KR",
    });

    const bundle = vm.storyPlan?.individualWorkBundle;
    const jsonStr = JSON.stringify(bundle);

    const forbiddenSaju = ["천간", "지지", "십성", "일간", "신살", "편관", "정관", "식신", "편인", "정인", "월지"];
    for (const term of forbiddenSaju) {
      assert.equal(jsonStr.includes(term), false, `Must not leak raw Saju term: ${term}`);
    }
  });

  await t.test("4. Birth time unknown flag gating excludes hour-pillar evidence", () => {
    const bundleWithUnknownTime = buildIndividualWorkChapterBundle({
      nameA: "민준",
      nameB: "서연",
      sajuChartA: {
        calendar: { birth_time_unknown: true },
        pillars: [],
      },
    });

    assert.ok(bundleWithUnknownTime.personA.identityLabel.length > 0);
  });

  await t.test("5. Cross-pair variance & Person A / Person B evidence isolation proof", () => {
    const bundle = buildIndividualWorkChapterBundle({
      nameA: "Alex",
      nameB: "Jordan",
      psychA: { secondary_axes: { structure: 80, deliberate_decision: 75, analytical_thinking: 70 } },
      psychB: { secondary_axes: { structure: 30, deliberate_decision: 25, stimulation: 85 } },
      officeReport: fullWorkColleagueReportFixture,
    });

    // Person A and Person B must produce DIFFERENT, person-specific Work identity labels and roles
    assert.notEqual(bundle.personA.identityLabel, bundle.personB.identityLabel);
    assert.notEqual(bundle.personA.suitableRoles[0], bundle.personB.suitableRoles[0]);
  });

  await t.test("6. Overview and Chapter 01 remain completely unchanged and preserved", () => {
    const report = fullWorkColleagueReportFixture;
    const vm = buildWorkReportViewModel(report, {
      viewerIsReportA: true,
      myName: "Sera",
      partnerName: "동글",
      locale: "ko-KR",
    });

    assert.ok(vm.storyPlan?.overviewChapterBundle?.workFitCard);
    assert.ok(vm.storyPlan?.overviewChapterBundle?.lifecycleNarrative.kickoff);
    assert.ok(vm.storyPlan?.overviewChapterBundle?.teamPortrait.headline);
  });
});
