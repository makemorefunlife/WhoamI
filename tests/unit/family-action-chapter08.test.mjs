import test from "node:test";
import assert from "node:assert/strict";

import { buildFamilyActionChapterBundle } from "../../lib/relationship/familyParent/familyActionChapterEngine.ts";
import { buildFamilyReportViewModel } from "../../lib/relationship/familyParent/viewModel/buildFamilyReportViewModel.ts";

test("Part 08 Canonical Family Action & Synthesis Suite (54 Requirements)", async (t) => {
  await t.test("1. Report renders exactly 8 chapters and old Chapter 08 (ch_deep) is removed", () => {
    const mockReport = {
      locale: "ko-KR",
      opening: { names: ["동글", "Sera"] },
    };

    const vm = buildFamilyReportViewModel(mockReport, { locale: "ko-KR" });

    assert.equal(vm.editorialChapters.length, 8, "Report must contain exactly 8 chapters");
    
    const chDeep = vm.editorialChapters.find(c => c.id === "ch_deep");
    assert.equal(chDeep, undefined, "Old standalone Chapter 08 (ch_deep) must not render");

    const finalCh = vm.editorialChapters[7];
    assert.equal(finalCh.id, "ch_action", "Final chapter ID must be ch_action");
    assert.equal(finalCh.number, "08", "Final chapter number must be 08");
    assert.equal(finalCh.title, "08. 앞으로, 우리는 이렇게 지내면 좋아요");
    assert.equal(finalCh.subtitle, "서로를 더 잘 이해한 다음, 실제 관계에서 바꿔볼 것들");
  });

  await t.test("2. Selected parent/child evidence drives Chapter 08 (Dynamic Generation)", () => {
    const bundleA = buildFamilyActionChapterBundle({
      childNickname: "동글",
      parentNickname: "Sera",
      psychChild: { secondaryAxes: { autonomy: 85, stimulation: 80 } },
      psychParent: { secondaryAxes: { structure: 75 } },
    });

    const bundleB = buildFamilyActionChapterBundle({
      childNickname: "민우",
      parentNickname: "지훈",
      psychChild: { secondaryAxes: { analytical_thinking: 85, self_control: 80 } },
      psychParent: { secondaryAxes: { practicality: 80 } },
    });

    assert.notEqual(
      bundleA.finalTakeaway.childNeedTitle,
      bundleB.finalTakeaway.childNeedTitle,
      "Child need title must differ between autonomy child and analytical child"
    );
    assert.notEqual(
      bundleA.customActions.parentActions[0].title,
      bundleB.customActions.parentActions[0].title,
      "Parent actions must differ based on child psychology"
    );
  });

  await t.test("3. Unsupported precise routine times (월 1회 20분, 밤 11시) NEVER appear", () => {
    const bundle = buildFamilyActionChapterBundle({
      childNickname: "동글",
      parentNickname: "Sera",
    });

    const jsonText = JSON.stringify(bundle);
    assert.equal(jsonText.includes("월 1회 20분"), false, "Must not contain hardcoded '월 1회 20분'");
    assert.equal(jsonText.includes("밤 11시"), false, "Must not contain hardcoded '밤 11시'");
  });

  await t.test("4. Single pair affinity signal includes safety disclaimer", () => {
    const bundle = buildFamilyActionChapterBundle({
      childNickname: "동글",
      parentNickname: "Sera",
    });

    assert.ok(
      bundle.affinitySignal.disclaimer.includes("다른 자녀와의 실제 비교 데이터 없이"),
      "Single pair affinity signal must include safety disclaimer"
    );
  });

  await t.test("5. Zero raw Saju technical terms leak to user-facing output", () => {
    const bundle = buildFamilyActionChapterBundle({
      childNickname: "동글",
      parentNickname: "Sera",
      countsChild: { food: 2, seal: 2, self: 1, officer: 1, wealth: 1 },
      countsParent: { food: 2, seal: 2, self: 1, officer: 1, wealth: 1 },
    });

    const sajuForbidden = [
      "천간", "지지", "십성", "일간", "신살", "도화", "현침", "비견", "겁재",
      "식신", "상관", "편재", "정재", "편관", "정관", "편인", "정인", "용신", "희신"
    ];

    const jsonText = JSON.stringify(bundle);
    for (const term of sajuForbidden) {
      assert.equal(
        jsonText.includes(term),
        false,
        `Forbidden raw Saju term "${term}" found in Chapter 08 bundle`
      );
    }
  });

  await t.test("6. Korean particles are formatted properly with zero broken particles", () => {
    const bundle = buildFamilyActionChapterBundle({
      childNickname: "동글",
      parentNickname: "Sera",
    });

    const jsonText = JSON.stringify(bundle);
    assert.equal(jsonText.includes("동글는"), false, "Must not contain '동글는'");
    assert.equal(jsonText.includes("동글가"), false, "Must not contain '동글가'");
    assert.equal(jsonText.includes("Sera와(과)"), false, "Must not contain 'Sera와(과)'");
  });
});
