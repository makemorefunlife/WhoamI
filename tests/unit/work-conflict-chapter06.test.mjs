import test from "node:test";
import assert from "node:assert/strict";
import { buildWorkConflictChapterBundle } from "../../lib/relationship/workColleague/workConflictChapterEngine.ts";
import { buildWorkReportViewModel } from "../../lib/relationship/workColleague/viewModel/buildWorkReportViewModel.ts";
import { fullWorkColleagueReportFixture } from "../../lib/relationship/workColleague/viewModel/workColleagueReportFixtures.ts";

test("▶ Chapter 06 Work Conflict & Trust Repair Suite", async (t) => {
  await t.test("1. Chapter 06 bundle is generated in storyPlan and viewModel", () => {
    const vm = buildWorkReportViewModel(fullWorkColleagueReportFixture, {
      viewerIsReportA: true,
      myName: "Sera",
      partnerName: "동글",
    });

    assert.ok(vm.storyPlan?.conflictChapterBundle, "conflictChapterBundle should be defined");
    const bundle = vm.storyPlan.conflictChapterBundle;
    assert.strictEqual(typeof bundle.subtitle, "string");
    assert.ok(bundle.conflictThemes.length >= 2, "Should have at least 2 conflict themes");
  });

  await t.test("2. Directional swap test: Swapping A and B swaps sensitivities and repair sequences", () => {
    const bundleNormal = buildWorkConflictChapterBundle({
      nameA: "Sera",
      nameB: "동글",
    });

    const bundleSwapped = buildWorkConflictChapterBundle({
      nameA: "동글",
      nameB: "Sera",
    });

    assert.strictEqual(bundleNormal.sensitivityAtoB.personName, "Sera");
    assert.strictEqual(bundleNormal.sensitivityBtoA.personName, "동글");

    assert.strictEqual(bundleSwapped.sensitivityAtoB.personName, "동글");
    assert.strictEqual(bundleSwapped.sensitivityBtoA.personName, "Sera");
  });

  await t.test("3. Directional repair independence: A->B and B->A sequences are distinct", () => {
    const bundle = buildWorkConflictChapterBundle({
      nameA: "Sera",
      nameB: "동글",
    });

    assert.strictEqual(bundle.repairSequenceAtoB.fromName, "Sera");
    assert.strictEqual(bundle.repairSequenceAtoB.toName, "동글");
    assert.strictEqual(bundle.repairSequenceBtoA.fromName, "동글");
    assert.strictEqual(bundle.repairSequenceBtoA.toName, "Sera");

    assert.notDeepStrictEqual(
      bundle.repairSequenceAtoB.steps,
      bundle.repairSequenceBtoA.steps,
      "Directional repair steps must be distinct"
    );
  });

  await t.test("4. Trust currency taxonomy validity: Currencies use semantic taxonomy", () => {
    const bundle = buildWorkConflictChapterBundle({
      nameA: "Sera",
      nameB: "동글",
    });

    const validKeywords = [
      "책임",
      "결과",
      "투명성",
      "전문성",
      "판단력",
      "약속",
      "일관성",
      "존중",
      "속도",
      "준비",
      "정확성",
    ];

    bundle.trustCurrencyA.topCurrencies.forEach((tc) => {
      assert.ok(validKeywords.includes(tc.keyword), `Keyword ${tc.keyword} must be in taxonomy`);
    });

    bundle.trustCurrencyB.topCurrencies.forEach((tc) => {
      assert.ok(validKeywords.includes(tc.keyword), `Keyword ${tc.keyword} must be in taxonomy`);
    });
  });

  await t.test("5. No raw Saju technical terms leak into user-facing copy", () => {
    const bundle = buildWorkConflictChapterBundle({
      nameA: "Sera",
      nameB: "동글",
    });

    const jsonStr = JSON.stringify(bundle);
    const bannedTerms = ["월지", "격국", "십성", "용신", "희신", "기신", "비견", "겁재", "편인", "정인"];

    bannedTerms.forEach((term) => {
      assert.ok(!jsonStr.includes(term), `User-facing copy should not contain raw term: ${term}`);
    });
  });

  await t.test("6. No generic fallback cloning: A and B repair languages are distinct", () => {
    const bundle = buildWorkConflictChapterBundle({
      nameA: "Sera",
      nameB: "동글",
    });

    assert.notStrictEqual(
      bundle.repairLanguageA.preferredStyle,
      bundle.repairLanguageB.preferredStyle,
      "Repair language preferred style must be distinct per person"
    );

    assert.notDeepStrictEqual(
      bundle.repairLanguageA.effectivePhrases,
      bundle.repairLanguageB.effectivePhrases,
      "Effective phrases must be distinct per person"
    );
  });
});
