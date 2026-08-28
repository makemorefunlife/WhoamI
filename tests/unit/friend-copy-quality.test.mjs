import assert from "node:assert/strict";
import { test, describe } from "node:test";
import { getRomanticV4CompareProse } from "../../lib/relationship/romantic/prototypeV4/romanticV4CompareInsights.ts";
import { computeRomanticV4GapBatchEngine } from "../../lib/relationship/romantic/prototypeV4/romanticV4GapBatchEngine.ts";
import { resolveHiddenHeartsLens } from "../../lib/relationship/romantic/prototypeV4/chapterLensResolvers.ts";

describe("Friend & Relationship Copy Quality & Safety", () => {
  test("Issue 1: Compare prose never produces broken particles like '표현이는'", () => {
    const prose = getRomanticV4CompareProse(
      "expression",
      "ko-KR",
      "Sera",
      "동글",
      "신중한 표현",
      "상황 맞춤",
      false
    );
    assert.match(prose.manifestation, /"신중한 표현" 쪽인 Sera와 "상황 맞춤" 쪽인 동글로/);
    assert.doesNotMatch(prose.manifestation, /표현이는/);
    assert.doesNotMatch(prose.manifestation, /맞춤이는/);
  });

  test("Issue 2: partnerReception outputs clean customer-facing Korean", () => {
    const batch = computeRomanticV4GapBatchEngine({
      empA: 70,
      empB: 40,
      structA: 50,
      structB: 45,
      roleAType: "empathetic_listener",
      roleBType: "anchored_pillar",
      nameA: "Sera",
      nameB: "동글",
      locale: "ko-KR",
    });
    assert.doesNotMatch(batch.wantedVsGivenLove.loveA.partnerReception, /긍정 수용함/);
    assert.match(batch.wantedVsGivenLove.loveA.partnerReception, /동글님은 이를 있는 그대로 따뜻하게 받아주는 편이에요/);
  });

  test("Issue 3: Perspective & Directional Swap Safety", () => {
    const proseA = getRomanticV4CompareProse("conflict", "ko-KR", "Sera", "동글", "직설적", "우회적", false);
    const proseB = getRomanticV4CompareProse("conflict", "ko-KR", "동글", "Sera", "우회적", "직설적", false);

    assert.match(proseA.manifestation, /"직설적" 쪽인 Sera와 "우회적" 쪽인 동글로/);
    assert.match(proseB.manifestation, /"우회적" 쪽인 동글와 "직설적" 쪽인 Sera로/);
  });

  test("Issue 4: Redundant '바라는 것은' prefix removed from unspokenNeed", () => {
    const res = resolveHiddenHeartsLens({
      names: { a: "Sera", b: "동글" },
      locale: "ko-KR",
      relCeA: {
        rawCategory: "healing",
        relationshipNeeds: [{ text: "자유와 독립적 공간" }],
        profile: {
          style: "soft",
          defense: "침묵",
          fear: "거절",
          recognitionNeed: "세심한 인정",
          healingAction: "경청",
        },
      },
      provenance: "saju_base",
    });

    assert.ok(res && res.length > 0);
    assert.doesNotMatch(res[0].unspokenNeed, /^말하지 않아도 가장 바라는 것은/);
  });

  test("Issue 5: Synergy complement text never produces broken dual/double particles", () => {
    const batch = computeRomanticV4GapBatchEngine({
      empA: 70,
      empB: 40,
      structA: 50,
      structB: 45,
      roleAType: "autonomy_keeper",
      roleBType: "relationship_regulator",
      nameA: "Sera",
      nameB: "동글",
      locale: "ko-KR",
    });
    const comp = batch.chapter06.roleMatrix.complement;
    assert.doesNotMatch(comp, /을\/를/);
    assert.doesNotMatch(comp, /템포를으로/);
    assert.match(comp, /Sera가 서로의 건강한 경계와 개인적 공간을 가져오면, 동글이가 여유 있는 리듬으로 그걸 받쳐주는 조합이에요/);
  });
});
