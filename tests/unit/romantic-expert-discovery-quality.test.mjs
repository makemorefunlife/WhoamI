/**
 * Phase 5A — Expert Discovery Quality unit tests. Mocked LLM only, no live
 * API calls. Covers the new quota-free / pair-specificity / genericness /
 * multi-evidence-preference behavior added on top of Phase 4A's
 * validateExpertFindings and Phase 4B's consumption policy.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  validateExpertFindings,
  buildRomanticExpertIntelligence,
} from "../../lib/relationship/romantic/prototypeV4/romanticExpertIntelligence.ts";
import { selectUserVisibleExpertBlocks } from "../../lib/relationship/romantic/prototypeV4/romanticExpertConsumptionPolicy.ts";

function makeOpenAiMock(responses) {
  let call = 0;
  return {
    chat: {
      completions: {
        create: async () => {
          const r = responses[call++];
          if (r instanceof Error) throw r;
          return { choices: [{ message: { content: JSON.stringify(r) } }] };
        },
      },
    },
  };
}

const NAMES = { a: "지민", b: "정우" };
const minimalChart = {
  pillars: [],
  day_master: { stem: { code: "gap" }, day_branch: { code: "ja" }, element: "wood", yin_yang: "yang" },
  five_elements: { with_hidden_counts: { wood: 3, fire: 1, earth: 1, metal: 1, water: 2 }, dominant: "wood", weakest: "fire" },
  johu: { temperature_band: "neutral", moisture_band: "neutral" },
  strength: { label_code: "balanced" },
  rootedness: { day_stem_rooted_in_day_branch: true, rootedness_index: 0.5 },
  relations_intra: [],
};

function minimalStoryPlan() {
  return {
    attraction: { units: { mutual: { tensionBridge: null } }, provenance: [] },
    misreads: [],
    bilateralChanges: [],
    sharedStrength: "",
    repair: { sequence: [], provenance: [] },
    crossSignalInsightsV1: [],
  };
}

function baseFinding(overrides = {}) {
  return {
    id: "f-1",
    mode: "saju_discovery",
    classification: "EXPERT_DERIVED",
    claim: "지민의 배우자궁과 정우의 배우자궁 사이에 형성된 육합 구조가, 두 사람의 친밀감 형성 속도를 서로 다르게 조율하는 지점으로 작용할 수 있습니다.",
    evidenceRefs: [],
    sajuEvidence: ["AB: day_branch spouse-palace six_combine[yu,jin]"],
    deterministicEvidence: [],
    reasoning: "배우자궁끼리의 육합은 두 원국 모두에서 나타나는 상호작용이며, 개별 사실이 아닙니다.",
    confidence: "high",
    novelty: "genuinely_additive",
    claimBoundary: { supported: "차트 구조상 조율 가능성", notSupported: "실제 친밀감 속도 확인" },
    suggestedChapter: "c2_attraction",
    pairDependency: "이 육합은 두 배우자궁이 함께 있을 때만 성립하며, 한쪽 원국만으로는 존재하지 않습니다.",
    ...overrides,
  };
}

describe("Discovery Quality — quota-free (spec §2/§11)", () => {
  it("zero findings is a valid, fully-processed result (not an error, not padded)", async () => {
    const openai = makeOpenAiMock([{ findings: [] }, { findings: [] }]);
    const result = await buildRomanticExpertIntelligence({
      openai, storyPlan: minimalStoryPlan(), chartA: minimalChart, chartB: minimalChart,
      axisResults: [], names: NAMES, locale: "ko-KR",
    });
    assert.equal(result.meta.failed, false);
    assert.equal(result.findings.length, 0);
    assert.equal(result.meta.modeBCount, 0);
  });

  it("a variable count (1, then 3) is accepted as-is — no padding, no truncation", async () => {
    const one = validateExpertFindings([baseFinding({ id: "only-one" })], { mode: "saju_discovery", existingTexts: [], axisKeys: new Set() });
    assert.equal(one.length, 1);

    const three = validateExpertFindings(
      [
        baseFinding({ id: "f-a", claim: "발견 A: 배우자궁 육합", sajuEvidence: ["AB: spouse-palace six_combine"] }),
        baseFinding({ id: "f-b", claim: "발견 B: 오행 상호 압박 구조", sajuEvidence: ["AB: element pressure structure"] }),
        baseFinding({ id: "f-c", claim: "발견 C: 십신 교차 해석", sajuEvidence: ["AB: ten-god cross interaction"] }),
      ],
      { mode: "saju_discovery", existingTexts: [], axisKeys: new Set() },
    );
    assert.equal(three.length, 3);
    assert.ok(three.every((f) => f.renderEligible));
  });
});

describe("Discovery Quality — pair-specificity gate (spec §3/§4/§5)", () => {
  it("a real chart fact about only ONE person's chart is downgraded to INDIVIDUAL_ONLY, not treated as a pair-level finding", () => {
    const out = validateExpertFindings(
      [baseFinding({ id: "solo-fact", sajuEvidence: ["A: 오행 water가 강함(4.5)"], claim: "지민은 수(水)의 기운이 강합니다." })],
      { mode: "saju_discovery", existingTexts: [], axisKeys: new Set() },
    );
    assert.equal(out[0].classification, "INDIVIDUAL_ONLY");
    assert.equal(out[0].renderEligible, false);
    assert.match(out[0].rejectionReason, /individual fact/);
  });

  it("missing pairDependency also downgrades to INDIVIDUAL_ONLY even with cross-chart evidence", () => {
    const out = validateExpertFindings(
      [baseFinding({ id: "no-dep", pairDependency: undefined })],
      { mode: "saju_discovery", existingTexts: [], axisKeys: new Set() },
    );
    assert.equal(out[0].classification, "INDIVIDUAL_ONLY");
    assert.equal(out[0].renderEligible, false);
  });

  it("INDIVIDUAL_ONLY never reaches the user-visible consumption tier", () => {
    const out = validateExpertFindings(
      [baseFinding({ id: "solo", sajuEvidence: ["B: 오행 earth가 강함"] })],
      { mode: "saju_discovery", existingTexts: [], axisKeys: new Set() },
    );
    const selection = selectUserVisibleExpertBlocks(out, minimalStoryPlan(), [], "ko-KR");
    assert.equal(selection.meta.selectedCount, 0);
  });
});

describe("Discovery Quality — genericness gate (spec §9)", () => {
  it("a chart-grounded but generic conclusion is rejected (fails the 'swap the names' test)", () => {
    const out = validateExpertFindings(
      [baseFinding({ id: "generic-1", claim: "서로 다른 오행의 균형을 통해 상호 보완적인 관계를 형성합니다." })],
      { mode: "saju_discovery", existingTexts: [], axisKeys: new Set() },
    );
    assert.equal(out[0].classification, "SPECULATIVE");
    assert.equal(out[0].renderEligible, false);
    assert.match(out[0].rejectionReason, /generic/);
  });

  it("a specific, pair-mechanism claim is NOT flagged as generic", () => {
    const out = validateExpertFindings([baseFinding({ id: "specific-1" })], { mode: "saju_discovery", existingTexts: [], axisKeys: new Set() });
    assert.equal(out[0].discoveryQuality.genericnessRisk, "low");
    assert.equal(out[0].classification, "EXPERT_DERIVED");
  });
});

describe("Discovery Quality — multi-evidence preference (spec §6/§14)", () => {
  it("evidenceStrength is 'multi' when 2+ sajuEvidence items are cited, 'single' otherwise", () => {
    const single = validateExpertFindings([baseFinding({ id: "s1" })], { mode: "saju_discovery", existingTexts: [], axisKeys: new Set() });
    assert.equal(single[0].discoveryQuality.evidenceStrength, "single");

    const multi = validateExpertFindings(
      [baseFinding({ id: "m1", sajuEvidence: ["AB: spouse-palace six_combine", "AB: element pressure structure"] })],
      { mode: "saju_discovery", existingTexts: [], axisKeys: new Set() },
    );
    assert.equal(multi[0].discoveryQuality.evidenceStrength, "multi");
  });

  it("when two Tier-A candidates share a chapter with equal confidence, the multi-evidence one wins the slot", () => {
    const single = baseFinding({
      id: "single-ev", claim: "발견 단일: 하나의 지지 충돌만 인용합니다 이것도 충분히 구체적입니다.",
      sajuEvidence: ["AB: branch_clash[yu,myo]"],
    });
    const multi = baseFinding({
      id: "multi-ev", claim: "발견 복수: 배우자궁 충돌과 오행 압박이 함께 나타나는 구조입니다 이것도 구체적입니다.",
      sajuEvidence: ["AB: spouse-palace branch_clash[yu,myo]", "AB: element pressure earth-vs-water"],
    });
    const validated = validateExpertFindings([single, multi], { mode: "saju_discovery", existingTexts: [], axisKeys: new Set() });
    const selection = selectUserVisibleExpertBlocks(validated, minimalStoryPlan(), [], "ko-KR");
    assert.equal(selection.blocksByChapter.c2_attraction[0].structuredData.expertFindingId, "multi-ev");
  });
});

describe("Discovery Quality — psych contradiction preserved (spec §7)", () => {
  it("CONTRADICTED_BY_CURRENT survives validation ungrounded-out only when the axis is real, and is never silently erased", () => {
    const out = validateExpertFindings(
      [baseFinding({ id: "contra-1", psychCrossCheck: { status: "CONTRADICTED_BY_CURRENT", axisKey: "conflict_style", note: "실제로는 회피형으로 나타납니다." } })],
      { mode: "saju_discovery", existingTexts: [], axisKeys: new Set(["conflict_style"]) },
    );
    assert.equal(out[0].psychCrossCheck.status, "CONTRADICTED_BY_CURRENT");
    assert.equal(out[0].psychCrossCheck.note, "실제로는 회피형으로 나타납니다.");
  });
});

describe("Discovery Quality — existing safeguards remain intact", () => {
  it("dedup against existing texts still forces novelty=duplicate regardless of pairDependency/cross-chart quality", () => {
    const existing = "기존에 이미 발견된 문장입니다 배우자궁 육합 구조.";
    const out = validateExpertFindings(
      [baseFinding({ id: "dup-1", claim: existing })],
      { mode: "saju_discovery", existingTexts: [existing], axisKeys: new Set() },
    );
    assert.equal(out[0].novelty, "duplicate");
    assert.equal(out[0].renderEligible, false);
  });

  it("unsupported behavioral extrapolation (SPECULATIVE with no evidence) still never renders", () => {
    const out = validateExpertFindings(
      [
        {
          id: "spec-1", mode: "saju_discovery", classification: "EXPERT_DERIVED",
          claim: "정우가 문자를 늦게 읽으면 지민이 질투할 것입니다.",
          evidenceRefs: [], sajuEvidence: [], deterministicEvidence: [],
          reasoning: "추측입니다.", confidence: "low", novelty: "genuinely_additive",
          claimBoundary: { supported: "차트상 근거 없음", notSupported: "구체적 행동 예측" }, suggestedChapter: "c4_conflict",
        },
      ],
      { mode: "saju_discovery", existingTexts: [], axisKeys: new Set() },
    );
    assert.equal(out[0].classification, "SPECULATIVE");
    assert.equal(out[0].renderEligible, false);
  });

  it("Expert failure fallback is unchanged: a thrown error still yields empty findings, never a partial/broken result", async () => {
    const openai = makeOpenAiMock([new Error("mode a down"), new Error("mode b down")]);
    const result = await buildRomanticExpertIntelligence({
      openai, storyPlan: minimalStoryPlan(), chartA: minimalChart, chartB: minimalChart,
      axisResults: [], names: NAMES, locale: "ko-KR",
    });
    assert.equal(result.findings.length, 0);
    assert.equal(result.meta.failed, true);
  });
});
