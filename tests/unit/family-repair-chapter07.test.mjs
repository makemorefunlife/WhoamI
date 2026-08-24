import test from "node:test";
import assert from "node:assert/strict";

import { buildFamilyRepairChapterBundle } from "../../lib/relationship/familyParent/familyRepairChapterEngine.ts";
import { buildFamilyRuleContext } from "../../lib/relationship/familyParent/buildFamilyRuleContext.ts";
import { buildFamilyParentReport } from "../../lib/relationship/familyParent/buildFamilyParentReport.ts";
import { buildCanonicalFamilyStoryPlan } from "../../lib/relationship/familyParent/buildCanonicalFamilyStoryPlan.ts";
import { buildFamilyReportViewModel } from "../../lib/relationship/familyParent/viewModel/buildFamilyReportViewModel.ts";

test("Part 07 Canonical Family Recovery Intelligence Suite", async (t) => {
  await t.test("1. Selected parent/child evidence drives Part 07 (Dynamic Generation)", () => {
    const bundleA = buildFamilyRepairChapterBundle({
      childNickname: "동글",
      parentNickname: "Sera",
      countsChild: { food: 3, self: 0, seal: 0 },
      psychChild: { secondaryAxes: { stimulation: 80, external_energy: 75, resilience: 70 } },
      countsParent: { seal: 2, officer: 2 },
      psychParent: { secondaryAxes: { analytical_thinking: 75, structure: 70 } },
    });

    const bundleB = buildFamilyRepairChapterBundle({
      childNickname: "민우",
      parentNickname: "지훈",
      countsChild: { seal: 3, self: 0, food: 0 },
      psychChild: { secondaryAxes: { analytical_thinking: 85, resilience: 30, self_control: 80 } },
      countsParent: { wealth: 3 },
      psychParent: { secondaryAxes: { practicality: 80 } },
    });

    assert.notEqual(
      bundleA.recoveryRhythms.childHeadline,
      bundleB.recoveryRhythms.childHeadline,
      "Child recovery rhythm must differ between food/stimulation child and seal/analytical child"
    );
    assert.notEqual(
      bundleA.recoveryRhythms.parentHeadline,
      bundleB.recoveryRhythms.parentHeadline,
      "Parent recovery rhythm must differ between analytical parent and practical parent"
    );
  });

  await t.test("2. Parent and child recovery rhythms are distinct when evidence differs", () => {
    const bundle = buildFamilyRepairChapterBundle({
      childNickname: "동글",
      parentNickname: "Sera",
      countsChild: { seal: 2 },
      psychChild: { secondaryAxes: { analytical_thinking: 75 } },
      countsParent: { food: 2 },
      psychParent: { secondaryAxes: { stimulation: 70 } },
    });

    assert.notEqual(
      bundle.recoveryRhythms.parentHeadline,
      bundle.recoveryRhythms.childHeadline,
      "Parent and child headlines must be distinct"
    );
  });

  await t.test("3. Part 05 Conflict Loop feeds Part 07 recovery selection", () => {
    const bundle = buildFamilyRepairChapterBundle({
      childNickname: "동글",
      parentNickname: "Sera",
      countsChild: { self: 2 },
      psychChild: { secondaryAxes: { autonomy: 80 } },
      conflictLoop: {
        triggerEvidenceIds: ["ev_1"],
        parentTrigger: "부모의 즉각 확인 시도",
        childReaction: "자녀의 방어적 침묵",
        confidence: "high",
      },
    });

    assert.ok(
      bundle.doAndDontRepair.harmfulReason.includes("갈등 증폭 루프"),
      "Harmful repair must connect to Part 05 Conflict Loop"
    );
  });

  await t.test("4. Unsupported precise wait times (3시간, 30분, 24시간) NEVER appear", () => {
    const bundle = buildFamilyRepairChapterBundle({
      childNickname: "동글",
      parentNickname: "Sera",
      countsChild: { seal: 3 },
    });

    const fullText = JSON.stringify(bundle);
    assert.equal(fullText.includes("3시간"), false, "Must not contain hardcoded '3시간'");
    assert.equal(fullText.includes("30분"), false, "Must not contain hardcoded '30분'");
    assert.equal(fullText.includes("24시간"), false, "Must not contain hardcoded '24시간'");
  });

  await t.test("5. Zero raw Saju technical terms leak to user-facing output", () => {
    const bundle = buildFamilyRepairChapterBundle({
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
        `Forbidden raw Saju term "${term}" found in Part 07 bundle`
      );
    }
  });

  await t.test("6. Korean particles are formatted properly with zero broken particles", () => {
    const bundle = buildFamilyRepairChapterBundle({
      childNickname: "동글",
      parentNickname: "Sera",
      countsChild: { food: 2 },
    });

    const jsonText = JSON.stringify(bundle);
    assert.equal(jsonText.includes("동글는"), false, "Must not contain '동글는'");
    assert.equal(jsonText.includes("동글가"), false, "Must not contain '동글가'");
    assert.equal(jsonText.includes("Sera와(과)"), false, "Must not contain 'Sera와(과)'");
  });

  await t.test("7. FullViewModel Integration: SOS rule moved out of Part 07, Chapter 08 legacySections cleared", () => {
    const mockStoryPlan = {
      repairChapterBundle: buildFamilyRepairChapterBundle({
        childNickname: "동글",
        parentNickname: "Sera",
      }),
    };
    const mockReport = {
      locale: "ko-KR",
      opening: { names: ["동글", "Sera"] },
    };

    const vm = buildFamilyReportViewModel(mockReport, { storyPlan: mockStoryPlan, locale: "ko-KR" });

    const ch7 = vm.editorialChapters.find(c => c.id === "ch_repair");
    assert.ok(ch7, "Chapter 07 (ch_repair) must exist");
    assert.equal(ch7.number, "07");
    assert.equal(ch7.title, "07. 싸운 뒤, 우리는 어떻게 다시 가까워질까요?");
    assert.equal(ch7.subtitle, "감정을 가라앉히는 방식부터 다시 마음을 여는 순간까지");
    assert.equal(ch7.legacySections.length, 0, "Chapter 07 legacySections must be cleared to prevent old cards");

    const ch8 = vm.editorialChapters.find(c => c.id === "ch_action");
    assert.ok(ch8, "Chapter 08 (ch_action) must exist");
    assert.equal(ch8.legacySections.length, 0, "Chapter 08 legacySections must be cleared");
  });
});
