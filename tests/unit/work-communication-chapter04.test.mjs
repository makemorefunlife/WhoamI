import test from "node:test";
import assert from "node:assert/strict";

import { buildWorkCommunicationChapterBundle } from "../../lib/relationship/workColleague/workCommunicationChapterEngine.ts";
import { buildWorkReportViewModel } from "../../lib/relationship/workColleague/viewModel/buildWorkReportViewModel.ts";
import { fullWorkColleagueReportFixture } from "../../lib/relationship/workColleague/viewModel/workColleagueReportFixtures.ts";

test("Chapter 04 Work Communication & Decision Suite", async (t) => {
  await t.test("1. Chapter 04 bundle is generated in storyPlan and viewModel", () => {
    const report = fullWorkColleagueReportFixture;
    const vm = buildWorkReportViewModel(report, {
      viewerIsReportA: true,
      myName: "Sera",
      partnerName: "동글",
      locale: "ko-KR",
    });

    const bundle = vm.storyPlan?.communicationChapterBundle;
    assert.ok(bundle, "communicationChapterBundle must exist in storyPlan");
    assert.equal(bundle.personA.name, "Sera");
    assert.equal(bundle.personB.name, "동글");
  });

  await t.test("2. All 7 canonical Chapter 04 subsections are populated with person-specific data", () => {
    const bundle = buildWorkCommunicationChapterBundle({
      nameA: "Alex",
      nameB: "Jordan",
      psychA: { secondary_axes: { thinking_style: 80, external_energy: 75, deliberate_decision: 30, structure: 40 } },
      psychB: { secondary_axes: { thinking_style: 30, external_energy: 25, deliberate_decision: 80, structure: 85 } },
    });

    // 1. 생각을 정리하는 방식
    assert.ok(bundle.personA.thinkMode.shortLabel.length > 0);
    assert.notEqual(bundle.personA.thinkMode.shortLabel, bundle.personB.thinkMode.shortLabel);
    assert.ok(bundle.thinkModePairSynthesis.summary.length > 5);

    // 2. 회의에서 의견을 내는 방식
    assert.ok(bundle.personA.meetingStyle.description.length > 0);
    assert.ok(bundle.meetingStylePairManifestation.summary.length > 5);

    // 3. 보고하고 공유하는 방식 (separated from feedback)
    assert.ok(bundle.personA.reportingStyle.dimensions.length >= 2);
    assert.ok(bundle.reportingMismatchNote.summary.length > 5);

    // 4. 피드백을 주고받는 방식 (independent conditions)
    assert.ok(bundle.personA.feedbackStyle.easyConditionTitle.length > 0);
    assert.ok(bundle.feedbackPairInsight.summary.length > 5);

    // 5. 의견이 다를 때 무엇을 보고 결정할까
    assert.ok(bundle.personA.decisionCriteria.length >= 1);
    assert.ok(bundle.decisionTension.summary.length > 5);

    // 6. 누가 언제 결정을 확정하는 게 좋을까 (consumes Ch03 R&R)
    assert.ok(bundle.decisionFlowItems.length >= 2);
    assert.ok(bundle.decisionFlowItems[0].primaryOwner.length > 0);

    // 7. 이 둘에게 잘 맞는 소통 리듬
    assert.equal(bundle.communicationRhythmSteps.length, 4);
  });

  await t.test("3. Zero raw Saju technical terms or raw taxonomy constants leak to user-facing copy", () => {
    const bundle = buildWorkCommunicationChapterBundle({
      nameA: "민준",
      nameB: "서연",
      sajuChartA: { saju: { dayPillar: ["갑", "자"] } },
      psychA: { secondary_axes: { thinking_style: 70 } },
    });

    const jsonStr = JSON.stringify(bundle);

    const forbiddenTerms = [
      "식상", "인성", "관성", "재성", "비겁", "월지", "월간", "천간충", "지지충", "삼형", "도화", "현침",
      "MIXED_CONTEXTUAL", "THINK_THEN_DISCUSS", "DISCUSS_THEN_THINK"
    ];

    for (const term of forbiddenTerms) {
      assert.equal(jsonStr.includes(term), false, `Must not leak raw term: ${term}`);
    }
  });

  await t.test("4. Innate vs Current disagreement produces adaptation synthesis", () => {
    const bundle = buildWorkCommunicationChapterBundle({
      nameA: "Chris",
      nameB: "Pat",
      sajuChartA: { saju: { dayPillar: ["갑", "인"] } }, // Fast Yang innate
      psychA: { secondary_axes: { external_energy: 20, deliberate_decision: 80 } }, // Slow cautious current
    });

    assert.equal(bundle.personA.thinkMode.innateVsCurrent.status, "adapted");
    assert.ok(bundle.personA.thinkMode.innateVsCurrent.synthesisSentence.includes("적응형"));
  });

  await t.test("5. Different pair fixtures produce meaningfully different Chapter 04 results with zero hardcoding", () => {
    // decisionFlowItems[0].primaryOwner traces to canonicalRoles.executionOwner,
    // which is itself derived from decision_style (the REAL secondary-axis
    // key — "external_energy"/"deliberate_decision" below don't exist on
    // PsychSecondaryAxesScores and used to silently no-op to the 50/50
    // default, making both fixtures land on "SHARED" regardless of the
    // values written here; a prior version of this test passed only
    // because "SHARED" was buggily collapsed to nameA, so two DIFFERENT
    // nameA strings looked like "meaningfully different" even though the
    // underlying signal was dead). Using the real key here actually
    // exercises the A/B split this test claims to verify.
    // thinkMode.shortLabel is driven by thinking_style (real) — also set
    // here so personA's label genuinely differs between the two fixtures,
    // not just decisionFlowItems[0].primaryOwner.
    const bundle1 = buildWorkCommunicationChapterBundle({
      nameA: "PairA1",
      nameB: "PairA2",
      psychA: { secondary_axes: { decision_style: 85, thinking_style: 85 } },
      psychB: { secondary_axes: { decision_style: 15, thinking_style: 15 } },
    });

    const bundle2 = buildWorkCommunicationChapterBundle({
      nameA: "PairB1",
      nameB: "PairB2",
      psychA: { secondary_axes: { decision_style: 15, thinking_style: 30, structure: 30 } },
      psychB: { secondary_axes: { decision_style: 85, thinking_style: 85 } },
    });

    assert.notEqual(bundle1.personA.thinkMode.shortLabel, bundle2.personA.thinkMode.shortLabel);
    assert.notEqual(bundle1.decisionFlowItems[0].primaryOwner, bundle2.decisionFlowItems[0].primaryOwner);
  });
});
