import test from "node:test";
import assert from "node:assert/strict";

import { buildFamilyParentDna } from "../../lib/relationship/familyParent/familyParentDna.js";

const SAJU_BANNED_TERMS = [
  "십성", "일간", "지지", "천간", "육친", "비겁", "식상", "재성", "관성", "인성",
  "삼합", "방합", "육합", "천간합", "육형", "육충", "육해", "신살", "도화", "현침",
  "용신", "희신", "원국", "월지", "일지", "시지", "년지",
];

const BROKEN_PARTICLE_REGEX = /\((?:은|는|이|가|을|를|과|와)\)/;

function mockFamilyContext(overrides = {}) {
  return {
    nicknameA: "동글",
    nicknameB: "Sera",
    roles: { roleA: "child", roleB: "mother" },
    childNickname: "동글",
    parentNickname: "Sera",
    parentRole: "mother",
    parentType: "mother",
    sajuJsonParent: {},
    sajuJsonChild: {},
    pairAnalysis: {},
    familyPairAnalysis: {},
    tenGod: {
      parentDominantGod: "insoeng",
      countsParent: { insoeng: 3, gwanseong: 1, bigeob: 1 },
      countsChild: { siksang: 3, 재성: 2 },
    },
    killerSections: {},
    eventScores: { intimacy: { activation: 50, benefit: 50, risk: 20 }, stability: { activation: 80, benefit: 80, risk: 10 }, conflict: { activation: 30, benefit: 40, risk: 40 } },
    grade: "A",
    gradeReason: "Excellent synergy",
    masterScores: { bond: 78, synergy: 85, risk: 25 },
    uncertainItems: [],
    locale: "ko-KR",
    childIsViewer: false,
    pairLens: {},
    ...overrides,
  };
}

test("Parent DNA Profile & Pair Bridge Validation Suite", async (t) => {
  await t.test("1. Parent DNA generates 6 non-empty dimensions and Bridge generates 3 dimensions", () => {
    const ctx = mockFamilyContext();
    const { parentDna, parentChildBridge } = buildFamilyParentDna(ctx);

    assert.ok(parentDna.protection_style.length > 10);
    assert.ok(parentDna.anxiety_trigger_behavior.length > 10);
    assert.ok(parentDna.trust_autonomy_style.length > 10);
    assert.ok(parentDna.discipline_style.length > 10);
    assert.ok(parentDna.growth_support_style.length > 10);
    assert.ok(parentDna.shadow_side_warning.length > 10);

    assert.ok(parentChildBridge.best_harmony_point.length > 10);
    assert.ok(parentChildBridge.friction_risk_moment.length > 10);
    assert.ok(parentChildBridge.optimal_parent_position.length > 10);
  });

  await t.test("2. Zero raw Saju terminology leaks in Parent DNA or Pair Bridge", () => {
    const ctx = mockFamilyContext();
    const { parentDna, parentChildBridge } = buildFamilyParentDna(ctx);

    const allText = [
      ...Object.values(parentDna),
      ...Object.values(parentChildBridge),
    ].join(" ");

    for (const term of SAJU_BANNED_TERMS) {
      assert.equal(
        allText.includes(term),
        false,
        `Saju banned term '${term}' found in output text: "${allText}"`,
      );
    }
  });

  await t.test("3. Zero broken Korean particle placeholders in output", () => {
    const ctx = mockFamilyContext();
    const { parentDna, parentChildBridge } = buildFamilyParentDna(ctx);

    const allText = [
      ...Object.values(parentDna),
      ...Object.values(parentChildBridge),
    ].join(" ");

    assert.equal(
      BROKEN_PARTICLE_REGEX.test(allText),
      false,
      `Broken particle placeholder found in output: "${allText}"`,
    );
  });

  await t.test("4. Parent DNA uses parent-specific nicknames and particle formatting", () => {
    const ctx = mockFamilyContext({
      parentNickname: "지우",
      childNickname: "민준",
    });
    const { parentDna, parentChildBridge } = buildFamilyParentDna(ctx);

    const allText = [
      ...Object.values(parentDna),
      ...Object.values(parentChildBridge),
    ].join(" ");

    assert.ok(allText.includes("지우"));
    assert.ok(allText.includes("민준"));
    // check particle: 민준 -> 민준이가 / 민준이는
    assert.ok(allText.includes("민준이가") || allText.includes("민준이는") || allText.includes("민준이와"));
    // check particle: 지우 -> 지우가 / 지우는
    assert.ok(allText.includes("지우가") || allText.includes("지우는") || allText.includes("지우와"));
  });

  await t.test("5. Parent DNA responds to different parent Saju/TenGod profiles", () => {
    const ctxInsoeng = mockFamilyContext({
      tenGod: { parentDominantGod: "insoeng" },
    });
    const ctxGwanseong = mockFamilyContext({
      tenGod: { parentDominantGod: "gwanseong" },
    });

    const outInsoeng = buildFamilyParentDna(ctxInsoeng);
    const outGwanseong = buildFamilyParentDna(ctxGwanseong);

    assert.notEqual(
      outInsoeng.parentDna.protection_style,
      outGwanseong.parentDna.protection_style,
    );
    assert.notEqual(
      outInsoeng.parentDna.discipline_style,
      outGwanseong.parentDna.discipline_style,
    );
  });

  await t.test("6. Directionality is preserved (Parent -> Child)", () => {
    const ctx = mockFamilyContext({
      parentNickname: "Sera",
      childNickname: "동글",
    });
    const { parentDna, parentChildBridge } = buildFamilyParentDna(ctx);

    // Parent DNA is focused on Sera's parenting behavior
    assert.ok(parentDna.protection_style.includes("Sera"));
    assert.ok(parentChildBridge.optimal_parent_position.length > 5);
  });
});
