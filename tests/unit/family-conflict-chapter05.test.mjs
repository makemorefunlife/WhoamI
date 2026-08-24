import test from "node:test";
import assert from "node:assert/strict";
import { buildFamilyConflictChapterBundle } from "../../lib/relationship/familyParent/familyConflictChapterEngine.ts";
import { buildFamilyRuleContext } from "../../lib/relationship/familyParent/buildFamilyRuleContext.ts";
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";
import { toV1SajuApiPayload } from "../../lib/saju/toApiPayload.ts";
import { buildFamilyReportViewModel } from "../../lib/relationship/familyParent/viewModel/buildFamilyReportViewModel.ts";

function createSaju(birthDate, birthTime) {
  const bundle = calculateSajuBundle({ birthDate, birthTime });
  return toV1SajuApiPayload(bundle);
}

test("Part 05 Canonical Conflict Analysis Suite (21 Audit Points)", async (t) => {
  const seraSaju = createSaju("1993-05-15", "14:00");
  const donggleSaju = createSaju("2020-08-20", "10:00");

  const ctx = buildFamilyRuleContext({
    nicknameA: "동글",
    nicknameB: "Sera",
    roles: { roleA: "child", roleB: "mother" },
    sajuJsonA: donggleSaju,
    sajuJsonB: seraSaju,
    locale: "ko-KR",
  });

  const mockReport = {
    meta: {
      nickname_a: "동글",
      nickname_b: "Sera",
      psych_a: { secondary_axes: { structure: 40, resilience: 45, recognition: 70, conflict_style: 40 } },
      psych_b: { secondary_axes: { structure: 75, resilience: 65, recognition: 50, conflict_style: 70 } },
    },
    family: {
      parent_role: "mother",
      section_roles: { parent_nickname: "Sera", child_nickname: "동글" },
      section_de_escalation: {
        headline: "화 풀림 치트키",
        do_action: "한 박자 쉬었다 대화하기",
        dont_action: "그 자리에서 바로 몰아붙이기",
        parent_script: "지금은 서로 조용히 마음을 다스리자",
      },
    },
  };

  const bundle = buildFamilyConflictChapterBundle({
    ctx,
    report: mockReport,
    psychParent: mockReport.meta.psych_b,
    psychChild: mockReport.meta.psych_a,
    psychProjections: [],
  });

  await t.test("1. Love Expression & Reception analysis is created in Section 01", () => {
    assert.ok(bundle.loveAnalysis);
    assert.ok(bundle.loveAnalysis.parentExpressionTitle.includes("Sera"));
    assert.ok(bundle.loveAnalysis.childReceptionTitle.includes("동글"));
    assert.ok(bundle.loveAnalysis.pairSynthesisTitle);
    assert.ok(bundle.loveAnalysis.keyInsightLine);
  });

  await t.test("2. Conflict cards selection is evidence-backed and distinct", () => {
    assert.ok(Array.isArray(bundle.conflictCards));
    assert.ok(bundle.conflictCards.length >= 2 && bundle.conflictCards.length <= 4);

    const categories = bundle.conflictCards.map((c) => c.category);
    const uniqueCategories = new Set(categories);
    assert.equal(categories.length, uniqueCategories.size, "All selected conflict cards must be distinct");

    for (const card of bundle.conflictCards) {
      assert.ok(card.title);
      assert.ok(card.subhead);
      assert.ok(card.parentLogic.includes("Sera"));
      assert.ok(card.childLogic.includes("동글"));
      assert.ok(card.realSituationScene);
      assert.ok(card.contrastBar.left && card.contrastBar.right);
    }
  });

  await t.test("3. Conflict loop step 1 to 5 escalation is generated with residual feelings", () => {
    const loop = bundle.conflictLoop;
    assert.ok(loop.step1ParentTrigger);
    assert.ok(loop.step2ChildReaction);
    assert.ok(loop.step3ParentEscalation);
    assert.ok(loop.step4ChildNextReaction);
    assert.ok(loop.parentResidualFeeling);
    assert.ok(loop.childResidualFeeling);
  });

  await t.test("4. Chapter synthesis line summarizes conflict without advice", () => {
    assert.ok(bundle.conflictSynthesisLine);
    assert.ok(bundle.conflictSynthesisLine.includes("Sera"));
    assert.ok(bundle.conflictSynthesisLine.includes("동글"));
  });

  await t.test("5. ViewModel Chapter 05 IA has no recovery sections and Chapter 07 stages recovery", () => {
    const vm = buildFamilyReportViewModel(mockReport, { locale: "ko-KR" });
    const ch5 = vm.editorialChapters.find((c) => c.id === "ch_conflict");
    const ch7 = vm.editorialChapters.find((c) => c.id === "ch_repair");

    assert.equal(ch5.legacySections.length, 0, "Chapter 05 must not contain legacy recovery sections");
    assert.equal(ch5.actions.length, 0, "Chapter 05 must not contain recovery actions");
    assert.ok(ch7.legacySections.some((s) => s.id === "de_escalation"), "Chapter 07 must stage de_escalation recovery section");
  });

  await t.test("6. No raw Saju terminology or broken particles leak", () => {
    const jsonStr = JSON.stringify(bundle);
    const rawSajuTerms = ["천간", "지지", "십성", "일간", "신살", "용신", "희신"];
    for (const term of rawSajuTerms) {
      assert.equal(jsonStr.includes(term), false, `Raw Saju term '${term}' must not leak`);
    }

    assert.equal(jsonStr.includes("동글와"), false, "No broken particle '동글와'");
    assert.equal(jsonStr.includes("Sera는의"), false, "No broken particle 'Sera는의'");
    assert.equal(jsonStr.includes("동글이는의"), false, "No broken particle '동글이는의'");
  });
});
