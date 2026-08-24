import test from "node:test";
import assert from "node:assert/strict";
import { buildFamilyGrowthChapterBundle } from "../../lib/relationship/familyParent/familyGrowthChapterEngine.ts";

test("Part 06 Canonical Child Growth Intelligence Suite (20 Audit Points)", async (t) => {
  // Fixture A: High Stimulation, High Autonomy Child
  const childA = {
    childNickname: "동글",
    parentNickname: "Sera",
    psychChild: {
      secondaryAxes: {
        stimulation: 85,
        autonomy: 80,
        recognition: 40,
        analytical_thinking: 45,
        external_energy: 75,
        practicality: 70,
        stability_orientation: 35,
        growth_orientation: 75,
        self_control: 40,
        resilience: 45,
        adaptability: 80,
        structure: 35,
      },
    },
    psychParent: {
      secondaryAxes: {
        structure: 75,
        stability_orientation: 80,
      },
    },
    countsChild: { food: 3, seal: 0, wealth: 1, officer: 0, self: 1 },
  };

  // Fixture B: Low Stimulation, High Analytical, High Recognition Child
  const childB = {
    childNickname: "민우",
    parentNickname: "Sera",
    psychChild: {
      secondaryAxes: {
        stimulation: 30,
        autonomy: 40,
        recognition: 85,
        analytical_thinking: 85,
        external_energy: 35,
        practicality: 40,
        stability_orientation: 75,
        growth_orientation: 80,
        self_control: 75,
        resilience: 70,
        adaptability: 40,
        structure: 80,
      },
    },
    psychParent: {
      secondaryAxes: {
        structure: 75,
        stability_orientation: 80,
      },
    },
    countsChild: { food: 0, seal: 3, wealth: 0, officer: 2, self: 0 },
  };

  await t.test("1. Selected child's identity drives Part 06 (Dynamic Generation)", () => {
    const bundleA = buildFamilyGrowthChapterBundle(childA);
    const bundleB = buildFamilyGrowthChapterBundle(childB);

    assert.ok(bundleA.motivation.driveTitle.includes("동글"), "Child A name should be inserted in title");
    assert.ok(bundleB.motivation.driveTitle.includes("민우"), "Child B name should be inserted in title");
    assert.notEqual(bundleA.motivation.driveTitle, bundleB.motivation.driveTitle, "Outputs MUST differ between children");
  });

  await t.test("2. High vs Low stimulation semantics produce distinct learning environments", () => {
    const bundleA = buildFamilyGrowthChapterBundle(childA);
    const bundleB = buildFamilyGrowthChapterBundle(childB);

    assert.ok(bundleA.learning.focusEnvironment.includes("활동적") || bundleA.learning.focusEnvironment.includes("프로젝트"), "High stimulation should support active/varied environment");
    assert.ok(bundleB.learning.focusEnvironment.includes("고요") || bundleB.learning.focusEnvironment.includes("개별 공간"), "Low stimulation + high analytical should support quiet focus");
  });

  await t.test("3. High vs Low recognition need changes feedback guidance", () => {
    const bundleA = buildFamilyGrowthChapterBundle(childA);
    const bundleB = buildFamilyGrowthChapterBundle(childB);

    assert.ok(bundleA.motivationAndExpectation.praiseGuidanceTitle.includes("자율권") || bundleA.motivationAndExpectation.praiseGuidanceTitle.includes("신뢰"), "Low recognition child should prefer self-defined competence/trust");
    assert.ok(bundleB.motivationAndExpectation.praiseGuidanceTitle.includes("인정") || bundleB.motivationAndExpectation.praiseGuidanceTitle.includes("연료"), "High recognition child should receive immediate recognition guidance");
  });

  await t.test("4. Parent swap does NOT rewrite child's intrinsic growth profile, but DOES update parent guidance", () => {
    const childA_Parent2 = {
      ...childA,
      parentNickname: "철수",
      psychParent: {
        secondaryAxes: {
          structure: 30,
          stability_orientation: 35,
        },
      },
    };

    const bundleA1 = buildFamilyGrowthChapterBundle(childA);
    const bundleA2 = buildFamilyGrowthChapterBundle(childA_Parent2);

    // Intrinsic child learning style remains identical
    assert.equal(bundleA1.learning.oneLineStudyType, bundleA2.learning.oneLineStudyType, "Child intrinsic study type must remain identical");
    assert.equal(bundleA1.motivation.driveTitle, bundleA2.motivation.driveTitle, "Child intrinsic drive title must remain identical");

    // Parent guidance uses new parent nickname correctly
    assert.ok(bundleA2.parentGuidance.pushForward.includes("동글"), "Parent guidance must reference child");
  });

  await t.test("5. Upgraded 공부 타입 & 성공 그릇 are integrated without vague labels", () => {
    const bundleA = buildFamilyGrowthChapterBundle(childA);
    assert.ok(bundleA.learning.oneLineStudyType.startsWith("한 줄 타입:"), "Study type must have clear Korean label");
    assert.ok(bundleA.potentialPace?.potentialTitle.includes("성장형") || bundleA.potentialPace?.potentialTitle.includes("응용형"), "Potential pace must explain growth style");
  });

  await t.test("6. Temporal current-year growth layer is present and explicit", () => {
    const bundleA = buildFamilyGrowthChapterBundle(childA);
    assert.ok(bundleA.yearlyGrowth, "Yearly growth section must be present");
    assert.ok(bundleA.yearlyGrowth.yearlyTheme, "Yearly theme must exist");
    assert.ok(bundleA.yearlyGrowth.reassuranceNote.includes("안심"), "Reassurance note must exist");
  });

  await t.test("7. Zero raw Saju technical terms leak to user-facing output", () => {
    const rawTerms = ["천간", "십성", "일간", "신살", "식상", "인성", "재성", "관성", "비겁", "용신", "격국", "식신", "상관", "정관", "편관", "정재", "편재"];
    const bundleA = buildFamilyGrowthChapterBundle(childA);
    const textOutput = JSON.stringify(bundleA);

    for (const term of rawTerms) {
      assert.equal(textOutput.includes(term), false, `Raw Saju term "${term}" must NOT leak into user-facing output`);
    }
  });

  await t.test("8. Korean particles are formatted properly", () => {
    const bundleA = buildFamilyGrowthChapterBundle(childA);
    const textOutput = JSON.stringify(bundleA);

    assert.equal(textOutput.includes("동글는"), false, "Particle bug '동글는' must not exist");
    assert.equal(textOutput.includes("동글가"), false, "Particle bug '동글가' must not exist");
    assert.equal(textOutput.includes("동글은(는)"), false, "Particle bug '동글은(는)' must not exist");
    assert.equal(textOutput.includes("Sera와(과)"), false, "Particle bug 'Sera와(과)' must not exist");
  });
});
