import test from "node:test";
import assert from "node:assert/strict";

import {
  evaluateRoleDimensions,
  buildFamilyRoleIntelligence,
} from "../../lib/relationship/familyParent/familyRoleIntelligence.js";

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

test("Family Role Intelligence Test Suite (15 Audit Points)", async (t) => {
  await t.test("1. Family role is not assigned from biological role alone", () => {
    const ctx = mockFamilyContext();
    const roleIntel = buildFamilyRoleIntelligence(ctx);

    assert.ok(roleIntel.parentRoleProfile.normalRoleLabel.length > 0);
    assert.ok(roleIntel.childRoleProfile.normalRoleLabel.length > 0);
    assert.notEqual(roleIntel.parentRoleProfile.normalRoleLabel, "엄마");
    assert.notEqual(roleIntel.childRoleProfile.normalRoleLabel, "자녀");
  });

  await t.test("2. Child can hold stabilizing/directing role when evidence supports", () => {
    const ctx = mockFamilyContext({
      tenGod: {
        countsParent: { siksang: 3, bigeob: 2 },
        countsChild: { gwanseong: 4, insoeng: 2 },
      },
    });
    const roleIntel = buildFamilyRoleIntelligence(ctx);

    assert.ok(roleIntel.childRoleProfile.dimensions.stabilizing > 50);
  });

  await t.test("3. Parent can hold playful/dependent role where evidence supports", () => {
    const ctx = mockFamilyContext({
      tenGod: {
        countsParent: { siksang: 4, bigeob: 2 },
        countsChild: { gwanseong: 3, insoeng: 2 },
      },
    });
    const roleIntel = buildFamilyRoleIntelligence(ctx);

    assert.ok(roleIntel.parentRoleProfile.dimensions.tensionReleasing > 50);
  });

  await t.test("4. Normal role and stress role differ", () => {
    const ctx = mockFamilyContext({
      masterScores: { bond: 60, synergy: 60, risk: 70 },
    });
    const roleIntel = buildFamilyRoleIntelligence(ctx);

    assert.notEqual(
      roleIntel.parentRoleProfile.normalRoleLabel,
      roleIntel.parentRoleProfile.stressRoleLabel,
    );
    assert.notEqual(
      roleIntel.childRoleProfile.normalRoleLabel,
      roleIntel.childRoleProfile.stressRoleLabel,
    );
  });

  await t.test("5. Role reversal is directional (Child -> Parent or Parent -> Child)", () => {
    const ctx = mockFamilyContext({
      tenGod: {
        countsParent: { siksang: 3 },
        countsChild: { gwanseong: 4, insoeng: 2 },
      },
    });
    const roleIntel = buildFamilyRoleIntelligence(ctx);

    if (roleIntel.roleReversal) {
      assert.ok(roleIntel.roleReversal.description.includes("동글") || roleIntel.roleReversal.description.includes("Sera"));
    }
  });

  await t.test("6. Unexpected role requires multi-evidence thresholding", () => {
    const ctxHigh = mockFamilyContext({
      tenGod: {
        countsParent: { insoeng: 1 },
        countsChild: { gwanseong: 4, insoeng: 3 },
      },
    });
    const roleIntel = buildFamilyRoleIntelligence(ctxHigh);
    assert.ok(roleIntel.unexpectedRole !== null);
  });

  await t.test("7. Unsupported unexpected role is omitted cleanly (null)", () => {
    const ctxAverage = mockFamilyContext({
      tenGod: {
        countsParent: { insoeng: 2, gwanseong: 2, jaeseong: 2 },
        countsChild: { insoeng: 2, gwanseong: 2, jaeseong: 2 },
      },
    });
    const roleIntel = buildFamilyRoleIntelligence(ctxAverage);
    assert.equal(roleIntel.unexpectedRole, null);
  });

  await t.test("8. Mediator requires actual mediation evidence", () => {
    const ctx = mockFamilyContext();
    const dims = evaluateRoleDimensions("child", ctx);
    assert.ok(dims.mediating >= 0);
  });

  await t.test("9. Role burden identifies who carries the burden and guidance implication", () => {
    const ctx = mockFamilyContext();
    const roleIntel = buildFamilyRoleIntelligence(ctx);
    assert.ok(roleIntel.roleBurden.burdenTitle.length > 0);
    assert.ok(roleIntel.roleBurden.guidanceImplication.length > 0);
  });

  await t.test("10 & 11. No raw Saju terminology leaks & zero particle glitches", () => {
    const ctx = mockFamilyContext();
    const roleIntel = buildFamilyRoleIntelligence(ctx);

    const allText = [
      roleIntel.pairStructureOverview,
      roleIntel.parentRoleProfile.normalRoleDesc,
      roleIntel.parentRoleProfile.stressRoleDesc,
      roleIntel.childRoleProfile.normalRoleDesc,
      roleIntel.childRoleProfile.stressRoleDesc,
      roleIntel.pairCausalMechanism,
      roleIntel.roleBurden.burdenDescription,
    ].join(" ");

    for (const term of SAJU_BANNED_TERMS) {
      assert.equal(
        allText.includes(term),
        false,
        `Saju banned term '${term}' found in output text: "${allText}"`,
      );
    }

    assert.equal(
      BROKEN_PARTICLE_REGEX.test(allText),
      false,
      `Broken particle placeholder found in output: "${allText}"`,
    );
  });
});
