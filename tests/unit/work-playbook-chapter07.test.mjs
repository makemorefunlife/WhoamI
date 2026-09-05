import test from "node:test";
import assert from "node:assert/strict";
import { buildWorkPlaybookChapterBundle } from "../../lib/relationship/workColleague/workPlaybookChapterEngine.ts";
import { buildWorkReportViewModel } from "../../lib/relationship/workColleague/viewModel/buildWorkReportViewModel.ts";
import { fullWorkColleagueReportFixture } from "../../lib/relationship/workColleague/viewModel/workColleagueReportFixtures.ts";

test("▶ Chapter 07 Work Playbook Consistency & QA Suite", async (t) => {
  await t.test("1. Chapter 07 bundle is generated in storyPlan and viewModel", () => {
    const vm = buildWorkReportViewModel(fullWorkColleagueReportFixture, {
      viewerIsReportA: true,
      myName: "Sera",
      partnerName: "동글",
    });

    assert.ok(vm.storyPlan?.playbookChapterBundle, "playbookChapterBundle should be defined");
    const bundle = vm.storyPlan.playbookChapterBundle;
    assert.strictEqual(typeof bundle.subtitle, "string");
    assert.ok(bundle.teamRules.length >= 3, "Should have at least 3 team rules");
    assert.ok(bundle.emergencyPlaybook.length >= 2, "Should have at least 2 emergency playbook items");
  });

  await t.test("2. Directional swap test: Swapping A and B swaps DO/DON'T and mutual growth", () => {
    const bundleNormal = buildWorkPlaybookChapterBundle({
      nameA: "Sera",
      nameB: "동글",
    });

    const bundleSwapped = buildWorkPlaybookChapterBundle({
      nameA: "동글",
      nameB: "Sera",
    });

    assert.strictEqual(bundleNormal.doDontA.personName, "Sera");
    assert.strictEqual(bundleNormal.doDontB.personName, "동글");
    assert.strictEqual(bundleSwapped.doDontA.personName, "동글");
    assert.strictEqual(bundleSwapped.doDontB.personName, "Sera");

    assert.strictEqual(bundleNormal.mutualGrowth.aFromB.personName, "Sera");
    assert.strictEqual(bundleNormal.mutualGrowth.aFromB.fromName, "동글");
    assert.strictEqual(bundleSwapped.mutualGrowth.aFromB.personName, "동글");
    assert.strictEqual(bundleSwapped.mutualGrowth.aFromB.fromName, "Sera");
  });

  await t.test("3. Chapter 03 & Emergency ownership consistency & No Owner/body contradiction", () => {
    const bundle = buildWorkPlaybookChapterBundle({
      nameA: "Sera",
      nameB: "동글",
    });

    bundle.emergencyPlaybook.forEach((item) => {
      // "두 사람" (shared) is a legitimate, real outcome — canonicalRoles'
      // *Owner fields resolve to "SHARED" whenever the two people's scores
      // are within 15 points, which is common. Requiring the owner to
      // always be a single nickname was enforcing the exact bug this fix
      // closes: a genuine tie silently collapsing onto nameA every time.
      assert.ok(
        item.ownerName === "Sera" || item.ownerName === "동글" || item.ownerName === "두 사람",
        `Emergency owner ${item.ownerName} must be one of the actual nicknames or the shared label`
      );
      assert.ok(
        item.responsibility.includes(item.ownerName),
        `Responsibility text must reference the exact ownerName (${item.ownerName}) without contradiction`
      );
    });
  });

  await t.test("4. Unsupported exact time precision ('30분 전', '24시간 전') is completely removed", () => {
    const bundle = buildWorkPlaybookChapterBundle({
      nameA: "Sera",
      nameB: "동글",
    });

    const jsonStr = JSON.stringify(bundle);
    assert.ok(!jsonStr.includes("24시간 전"), "Copy should not contain fake '24시간 전' timing precision");
    assert.ok(!jsonStr.includes("30분 전"), "Copy should not contain fake '30분 전' timing precision");
    assert.ok(!jsonStr.includes("월요일 오전 10분"), "Copy should not contain fake '월요일 오전 10분'");
  });

  await t.test("5. Zero raw Saju technical terms leak into user-facing copy", () => {
    const bundle = buildWorkPlaybookChapterBundle({
      nameA: "Sera",
      nameB: "동글",
    });

    const jsonStr = JSON.stringify(bundle);
    const bannedTerms = ["월지", "격국", "십성", "용신", "희신", "기신", "비견", "겁재", "편인", "정인", "관성", "식상", "재성", "인성", "비겁"];

    bannedTerms.forEach((term) => {
      assert.ok(!jsonStr.includes(term), `User-facing copy should not contain raw term: ${term}`);
    });
  });

  await t.test("6. Typo check: '결단력' (not '결동력')", () => {
    const bundle = buildWorkPlaybookChapterBundle({
      nameA: "Sera",
      nameB: "동글",
    });

    const jsonStr = JSON.stringify(bundle);
    assert.ok(!jsonStr.includes("결동력"), "Should not contain typo '결동력'");
    assert.ok(jsonStr.includes("결단력"), "Should contain correct word '결단력'");
  });

  await t.test("7. Single operating principle synthesizes pair direction", () => {
    const bundle = buildWorkPlaybookChapterBundle({
      nameA: "Sera",
      nameB: "동글",
    });

    assert.ok(bundle.singleOperatingPrinciple.principleTitle.length > 5);
    assert.ok(bundle.singleOperatingPrinciple.explanation.length > 10);
  });
});
