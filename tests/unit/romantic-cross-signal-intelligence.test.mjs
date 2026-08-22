/**
 * Phase 3 — Cross-Signal Intelligence V1 unit tests.
 * Synthetic, deliberately contrasting fixtures (not Sera x 동글) — see
 * decisions/Phase-3 spec §11. Tests the module directly, not the full pipeline
 * (romantic-canonical-report.test.mjs / verify-romantic-v4-rendered-ce.ts
 * already cover end-to-end wiring).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildRomanticCrossSignalIntelligence } from "../../lib/relationship/romantic/prototypeV4/romanticCrossSignalIntelligence.ts";

const NAMES = { a: "지민", b: "정우" };

function makeStoryPlan(overrides = {}) {
  return {
    attraction: {
      units: {
        mutual: {
          subject: "mutual",
          recognition: "서로 다른 리듬이 자연스럽게 맞물리는 감각",
          emotionalMeaning: "말없이도 편안한 느낌",
          partnerEvidence: [],
          scene: null,
          pairSpecificEffect: null,
          tensionBridge: null,
          evidenceIds: ["evidence.attraction.mutual"],
          confidence: "high",
          usedClaims: [],
        },
      },
      provenance: [],
    },
    misreads: [],
    bilateralChanges: [],
    sharedStrength: "",
    repair: { sequence: [], provenance: [] },
    ...overrides,
  };
}

function relCe(overrides = {}) {
  return {
    stressResponse: { text: "타고난 스트레스 대응: 침묵 속에서 정리하는 편" },
    careExpression: { text: "타고난 애정 표현: 실질적인 챙김으로 마음을 전함" },
    personalCeAlignment: undefined,
    ...overrides,
  };
}

function axisRow(axis_key, score_a, score_b, match_type, gap) {
  return { axis_key, score_a, score_b, match_type, gap: gap ?? Math.abs(score_a - score_b) };
}

describe("Cross-Signal Intelligence V1 — Innate x Current", () => {
  it("alignment: ceAuthoritative + agrees=true -> ALIGNED, high confidence", () => {
    const relCeA = relCe({
      personalCeAlignment: {
        stressResponse: { legacyBand: "cold", ceBand: "cold", ceAuthoritative: true, agrees: true },
        careExpression: { legacyBand: "action_gift", ceBand: null, ceAuthoritative: false, agrees: true },
      },
    });
    const out = buildRomanticCrossSignalIntelligence({
      storyPlan: makeStoryPlan(),
      relCeA,
      relCeB: relCe(),
      axisResults: [],
      names: NAMES,
      locale: "ko-KR",
    });
    const insight = out.find((i) => i.insightType === "innate_current" && i.subject === "a" && i.domain === "stress_response");
    assert.ok(insight, "expected an aligned innate_current insight for stress_response");
    assert.equal(insight.category, "ALIGNED");
    assert.equal(insight.confidence, "high");
    // care_expression must NOT fire: ceAuthoritative is false there
    assert.ok(!out.some((i) => i.insightType === "innate_current" && i.subject === "a" && i.domain === "care_expression"));
  });

  it("contradiction: ceAuthoritative + agrees=false -> CONTEXT_SHIFT, claimBoundary states the unproven causal claim", () => {
    const relCeA = relCe({
      personalCeAlignment: {
        stressResponse: { legacyBand: "cold", ceBand: "hot", ceAuthoritative: true, agrees: false },
        careExpression: { legacyBand: "action_gift", ceBand: "emotional_care", ceAuthoritative: true, agrees: false },
      },
    });
    const out = buildRomanticCrossSignalIntelligence({
      storyPlan: makeStoryPlan(),
      relCeA,
      relCeB: relCe(),
      axisResults: [],
      names: NAMES,
      locale: "ko-KR",
    });
    const insight = out.find((i) => i.insightType === "innate_current" && i.subject === "a" && i.domain === "stress_response");
    assert.ok(insight);
    assert.equal(insight.category, "CONTEXT_SHIFT");
    assert.match(insight.claimBoundary.notSupported, /어느 쪽|스트레스나 친밀감/);
    // must not assert a "reverts under stress" causal claim anywhere in the rendered text
    assert.doesNotMatch(insight.derivedMeaning, /스트레스.*(돌아|회귀)/);
  });

  it("insufficient evidence: ceAuthoritative=false -> abstains entirely for that domain/person", () => {
    const relCeA = relCe({
      personalCeAlignment: {
        stressResponse: { legacyBand: "cold", ceBand: null, ceAuthoritative: false, agrees: true },
        careExpression: { legacyBand: "action_gift", ceBand: null, ceAuthoritative: false, agrees: true },
      },
    });
    const out = buildRomanticCrossSignalIntelligence({
      storyPlan: makeStoryPlan(),
      relCeA,
      relCeB: relCe({ personalCeAlignment: undefined }),
      axisResults: [],
      names: NAMES,
      locale: "ko-KR",
    });
    assert.equal(out.filter((i) => i.insightType === "innate_current").length, 0);
  });
});

describe("Cross-Signal Intelligence V1 — Hidden Collision", () => {
  it("strong collision-prone similarity: both conflict_style <=40 -> fires with real magnitude in text", () => {
    const out = buildRomanticCrossSignalIntelligence({
      storyPlan: makeStoryPlan(),
      relCeA: relCe(),
      relCeB: relCe(),
      axisResults: [axisRow("conflict_style", 25, 30, "similarity")],
      names: NAMES,
      locale: "ko-KR",
    });
    const insight = out.find((i) => i.insightType === "hidden_collision");
    assert.ok(insight);
    assert.equal(insight.axisKey, "conflict_style");
    assert.match(insight.similarityEvidence, /25.*30|30.*25/);
  });

  it("benign similarity: axis not on the collision-prone whitelist -> abstains", () => {
    const out = buildRomanticCrossSignalIntelligence({
      storyPlan: makeStoryPlan(),
      relCeA: relCe(),
      relCeB: relCe(),
      axisResults: [axisRow("thinking_style", 70, 75, "similarity")],
      names: NAMES,
      locale: "ko-KR",
    });
    assert.equal(out.filter((i) => i.insightType === "hidden_collision").length, 0);
  });

  it("insufficient magnitude: similarity in the mid-band (41-59) on a whitelisted axis -> abstains", () => {
    const out = buildRomanticCrossSignalIntelligence({
      storyPlan: makeStoryPlan(),
      relCeA: relCe(),
      relCeB: relCe(),
      axisResults: [axisRow("conflict_style", 48, 52, "similarity")],
      names: NAMES,
      locale: "ko-KR",
    });
    assert.equal(out.filter((i) => i.insightType === "hidden_collision").length, 0);
  });
});

describe("Cross-Signal Intelligence V1 — Paradox", () => {
  it("attraction + qualifying friction (tensionBridge + real bonding) -> fires", () => {
    const out = buildRomanticCrossSignalIntelligence({
      storyPlan: makeStoryPlan({
        attraction: {
          units: {
            mutual: {
              subject: "mutual",
              recognition: "말없이도 통하는 리듬",
              emotionalMeaning: "편안함",
              partnerEvidence: [],
              scene: null,
              pairSpecificEffect: null,
              tensionBridge: "그 편안함이 무심함으로 느껴지는 순간 마찰이 됩니다.",
              evidenceIds: ["evidence.attraction.mutual"],
              confidence: "high",
              usedClaims: [],
            },
          },
          provenance: [],
        },
      }),
      relCeA: relCe(),
      relCeB: relCe(),
      axisResults: [],
      bonding: { count: 2, packets: [] },
      names: NAMES,
      locale: "ko-KR",
    });
    const insight = out.find((i) => i.insightType === "paradox");
    assert.ok(insight);
    assert.equal(insight.suggestedChapter, "c2_attraction");
  });

  it("attraction without qualifying friction (no tensionBridge) -> abstains", () => {
    const out = buildRomanticCrossSignalIntelligence({
      storyPlan: makeStoryPlan(), // mutual.tensionBridge is null in the default fixture
      relCeA: relCe(),
      relCeB: relCe(),
      axisResults: [],
      bonding: { count: 3, packets: [] },
      names: NAMES,
      locale: "ko-KR",
    });
    assert.equal(out.filter((i) => i.insightType === "paradox").length, 0);
  });
});

describe("Cross-Signal Intelligence V1 — Difference -> Rescue", () => {
  it("qualifying difference (gap>=25 on eligible axis) + real repair sequence -> fires", () => {
    const out = buildRomanticCrossSignalIntelligence({
      storyPlan: makeStoryPlan({
        repair: { sequence: ["30분 쿨링다운", "필요만 말하기"], provenance: [] },
      }),
      relCeA: relCe(),
      relCeB: relCe(),
      axisResults: [axisRow("decision_style", 20, 80, "tension")],
      names: NAMES,
      locale: "ko-KR",
    });
    const insight = out.find((i) => i.insightType === "difference_rescue");
    assert.ok(insight);
    assert.equal(insight.suggestedChapter, "c7_repair");
  });

  it("difference with no supported rescue (empty repair.sequence) -> abstains", () => {
    const out = buildRomanticCrossSignalIntelligence({
      storyPlan: makeStoryPlan({ repair: { sequence: [], provenance: [] } }),
      relCeA: relCe(),
      relCeB: relCe(),
      axisResults: [axisRow("decision_style", 20, 80, "tension")],
      names: NAMES,
      locale: "ko-KR",
    });
    assert.equal(out.filter((i) => i.insightType === "difference_rescue").length, 0);
  });
});

describe("Cross-Signal Intelligence V1 — Bidirectional Blind Spot", () => {
  const misreadAB = {
    direction: "a_observes_b",
    observedBehavior: "정우가 침묵한다",
    observerFelt: "",
    commonNegativeReading: "무관심하다고 오해하기 쉽다",
    actorPossibleNeed: "",
    meaningGap: "",
    betterExpression: "",
    helpfulResponse: "",
    provenance: [{ evidenceId: "misread.a_observes_b" }],
    confidence: "high",
  };
  const misreadBA = {
    direction: "b_observes_a",
    observedBehavior: "지민이 다급하게 확인한다",
    observerFelt: "",
    commonNegativeReading: "몰아붙인다고 오해하기 쉽다",
    actorPossibleNeed: "",
    meaningGap: "",
    betterExpression: "",
    helpfulResponse: "",
    provenance: [{ evidenceId: "misread.b_observes_a" }],
    confidence: "high",
  };

  it("both directions present -> fires with a NEW conclusion, not a verbatim repeat", () => {
    const out = buildRomanticCrossSignalIntelligence({
      storyPlan: makeStoryPlan({ misreads: [misreadAB, misreadBA] }),
      relCeA: relCe(),
      relCeB: relCe(),
      axisResults: [],
      names: NAMES,
      locale: "ko-KR",
    });
    const insight = out.find((i) => i.insightType === "blind_spot");
    assert.ok(insight);
    assert.notEqual(insight.crossSignalResult, misreadAB.commonNegativeReading);
    assert.notEqual(insight.crossSignalResult, misreadBA.commonNegativeReading);
    assert.equal(insight.suggestedChapter, "c6_hidden_hearts");
  });

  it("one direction missing -> no pair-level blind spot", () => {
    const out = buildRomanticCrossSignalIntelligence({
      storyPlan: makeStoryPlan({ misreads: [misreadAB] }),
      relCeA: relCe(),
      relCeB: relCe(),
      axisResults: [],
      names: NAMES,
      locale: "ko-KR",
    });
    assert.equal(out.filter((i) => i.insightType === "blind_spot").length, 0);
  });
});

describe("Cross-Signal Intelligence V1 — Superpower", () => {
  it("multiple pair-level signals (bonding + combine + sharedStrength) -> fires as A x B, not A+B", () => {
    const out = buildRomanticCrossSignalIntelligence({
      storyPlan: makeStoryPlan({ sharedStrength: "둘이 함께일 때 발휘되는 단단한 팀워크" }),
      relCeA: relCe(),
      relCeB: relCe(),
      axisResults: [],
      bonding: { count: 2, packets: [] },
      stemCombineHitCount: 1,
      names: NAMES,
      locale: "ko-KR",
    });
    const insight = out.find((i) => i.insightType === "superpower");
    assert.ok(insight);
    assert.ok(insight.supportingSignalCount >= 2);
  });

  it("only one independent pair-level signal -> abstains (does not fake it from two personal descriptions)", () => {
    const out = buildRomanticCrossSignalIntelligence({
      storyPlan: makeStoryPlan({ sharedStrength: "둘이 함께일 때 발휘되는 단단한 팀워크" }),
      relCeA: relCe(),
      relCeB: relCe(),
      axisResults: [],
      bonding: { count: 0, packets: [] },
      stemCombineHitCount: 0,
      sixCombineHitCount: 0,
      names: NAMES,
      locale: "ko-KR",
    });
    assert.equal(out.filter((i) => i.insightType === "superpower").length, 0);
  });
});

describe("Cross-Signal Intelligence V1 — A/B swap integrity", () => {
  it("swapping which side is 'a' and which is 'b' preserves the same semantic meaning (roles swap, structure doesn't break)", () => {
    const relCeHot = relCe({
      personalCeAlignment: {
        stressResponse: { legacyBand: "hot", ceBand: "hot", ceAuthoritative: true, agrees: true },
        careExpression: { legacyBand: "action_gift", ceBand: null, ceAuthoritative: false, agrees: true },
      },
    });
    const relCeCold = relCe({
      personalCeAlignment: {
        stressResponse: { legacyBand: "cold", ceBand: "cold", ceAuthoritative: true, agrees: true },
        careExpression: { legacyBand: "action_gift", ceBand: null, ceAuthoritative: false, agrees: true },
      },
    });

    const forward = buildRomanticCrossSignalIntelligence({
      storyPlan: makeStoryPlan(),
      relCeA: relCeHot,
      relCeB: relCeCold,
      axisResults: [axisRow("conflict_style", 30, 35, "similarity")],
      names: { a: "지민", b: "정우" },
      locale: "ko-KR",
    });
    const swapped = buildRomanticCrossSignalIntelligence({
      storyPlan: makeStoryPlan(),
      relCeA: relCeCold,
      relCeB: relCeHot,
      axisResults: [axisRow("conflict_style", 35, 30, "similarity")],
      names: { a: "정우", b: "지민" },
      locale: "ko-KR",
    });

    const forwardStressA = forward.find((i) => i.insightType === "innate_current" && i.subject === "a" && i.domain === "stress_response");
    const swappedStressB = swapped.find((i) => i.insightType === "innate_current" && i.subject === "b" && i.domain === "stress_response");
    assert.equal(forwardStressA.category, swappedStressB.category, "same person's category must not change just because they moved from slot a to slot b");
    assert.equal(forwardStressA.innateSignal, swappedStressB.innateSignal);

    // Hidden collision must fire identically regardless of which side is a/b (score_a/score_b just swap).
    const forwardCollision = forward.find((i) => i.insightType === "hidden_collision");
    const swappedCollision = swapped.find((i) => i.insightType === "hidden_collision");
    assert.ok(forwardCollision && swappedCollision);
    assert.equal(forwardCollision.axisKey, swappedCollision.axisKey);
  });
});
