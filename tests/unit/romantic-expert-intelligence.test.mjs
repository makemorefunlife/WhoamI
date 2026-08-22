/**
 * Phase 4A — Expert Intelligence layer unit tests.
 * The LLM is always mocked here — no live API calls, no dependency on
 * OPENAI_API_KEY. See tests/scripts/verify-romantic-expert-intelligence-live.ts
 * for the separate, manually-run live test against the real API.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  validateExpertFindings,
  buildRomanticExpertIntelligence,
  buildRomanticExpertIntelligenceSafe,
} from "../../lib/relationship/romantic/prototypeV4/romanticExpertIntelligence.ts";

function makeOpenAiMock(responses) {
  // responses: array of JSON-stringifiable objects, one per call, in order.
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

function minimalStoryPlan(overrides = {}) {
  return {
    attraction: { units: { mutual: { tensionBridge: null } }, provenance: [] },
    misreads: [],
    bilateralChanges: [],
    sharedStrength: "",
    repair: { sequence: [], provenance: [] },
    crossSignalInsightsV1: [
      { insightType: "hidden_collision", derivedMeaning: "비슷해서 편한 축이지만 갈등직면성에서는 둘 다 역할을 비워두는 위험이 됩니다.", evidenceRefs: ["axisResults.conflict_style"] },
    ],
    ...overrides,
  };
}

const minimalChart = {
  pillars: [],
  day_master: { stem: { code: "gap" }, day_branch: { code: "ja" }, element: "wood", yin_yang: "yang" },
  five_elements: { with_hidden_counts: { wood: 3, fire: 1, earth: 1, metal: 1, water: 2 }, dominant: "wood", weakest: "fire" },
  johu: { temperature_band: "neutral", moisture_band: "neutral" },
  strength: { label_code: "balanced" },
  rootedness: { day_stem_rooted_in_day_branch: true, rootedness_index: 0.5 },
  relations_intra: [],
};

describe("Expert Intelligence V1 — validateExpertFindings", () => {
  it("accepts a well-formed Mode A SUPPORTED_SYNTHESIS finding", () => {
    const out = validateExpertFindings(
      [
        {
          id: "test-1",
          mode: "evidence_synthesis",
          classification: "SUPPORTED_SYNTHESIS",
          insightType: "test",
          subjects: ["pair"],
          claim: "완전히 새로운 결론 문장입니다",
          evidenceRefs: ["axisResults.conflict_style"],
          sajuEvidence: [],
          deterministicEvidence: ["hidden_collision"],
          reasoning: "두 신호를 결합했을 때 이런 의미가 나옵니다.",
          confidence: "high",
          novelty: "genuinely_additive",
          claimBoundary: { supported: "X", notSupported: "Y" },
          suggestedChapter: "c4_conflict",
          renderEligible: true,
        },
      ],
      { mode: "evidence_synthesis", existingTexts: [], axisKeys: new Set() },
    );
    assert.equal(out.length, 1);
    assert.equal(out[0].classification, "SUPPORTED_SYNTHESIS");
    assert.equal(out[0].renderEligible, true);
    assert.equal(out[0].rejectionReason, undefined);
  });

  it("downgrades Mode A finding that claims EXPERT_DERIVED (wrong classification family for this mode)", () => {
    const out = validateExpertFindings(
      [
        {
          id: "test-2", mode: "evidence_synthesis", classification: "EXPERT_DERIVED",
          claim: "claim", evidenceRefs: [], sajuEvidence: ["일간 갑목"], deterministicEvidence: [],
          reasoning: "reasoning", confidence: "high", novelty: "genuinely_additive",
          claimBoundary: { supported: "X", notSupported: "Y" }, suggestedChapter: "c4_conflict",
        },
      ],
      { mode: "evidence_synthesis", existingTexts: [], axisKeys: new Set() },
    );
    assert.equal(out[0].classification, "SPECULATIVE");
    assert.equal(out[0].renderEligible, false);
    assert.match(out[0].rejectionReason, /cannot produce EXPERT_DERIVED/);
  });

  it("downgrades EXPERT_DERIVED with no sajuEvidence citations", () => {
    const out = validateExpertFindings(
      [
        {
          id: "test-3", mode: "saju_discovery", classification: "EXPERT_DERIVED",
          claim: "claim", evidenceRefs: [], sajuEvidence: [], deterministicEvidence: [],
          reasoning: "reasoning", confidence: "medium", novelty: "genuinely_additive",
          claimBoundary: { supported: "X", notSupported: "Y" }, suggestedChapter: "c2_attraction",
        },
      ],
      { mode: "saju_discovery", existingTexts: [], axisKeys: new Set() },
    );
    assert.equal(out[0].classification, "SPECULATIVE");
    assert.equal(out[0].renderEligible, false);
  });

  it("accepts EXPERT_DERIVED with real sajuEvidence citations", () => {
    const out = validateExpertFindings(
      [
        {
          id: "test-4", mode: "saju_discovery", classification: "EXPERT_DERIVED",
          claim: "일지 원진 관계가 친밀감과 자율성 사이 긴장을 만듭니다.",
          evidenceRefs: [], sajuEvidence: ["day_branch:ja x day_branch:mi wonjin"], deterministicEvidence: [],
          reasoning: "두 원국의 일지 조합이 이 긴장을 뒷받침합니다.", confidence: "medium", novelty: "genuinely_additive",
          claimBoundary: { supported: "X", notSupported: "Y" }, suggestedChapter: "c4_conflict",
        },
      ],
      { mode: "saju_discovery", existingTexts: [], axisKeys: new Set() },
    );
    assert.equal(out[0].classification, "EXPERT_DERIVED");
    assert.equal(out[0].renderEligible, true);
  });

  it("forces novelty=duplicate and renderEligible=false when claim text overlaps an existing finding, regardless of model's own novelty label", () => {
    const existing = "비슷해서 편한 축이지만 갈등직면성에서는 둘 다 역할을 비워두는 위험이 됩니다.";
    const out = validateExpertFindings(
      [
        {
          id: "test-5", mode: "evidence_synthesis", classification: "SUPPORTED_SYNTHESIS",
          claim: "비슷해서 편한 축이지만 갈등직면성에서는 둘 다 역할을 비워두는 위험이 됩니다.", // near-identical text
          evidenceRefs: ["x"], sajuEvidence: [], deterministicEvidence: [],
          reasoning: "reasoning", confidence: "high",
          novelty: "genuinely_additive", // model claims additive — must be overridden
          claimBoundary: { supported: "X", notSupported: "Y" }, suggestedChapter: "c4_conflict",
        },
      ],
      { mode: "evidence_synthesis", existingTexts: [existing], axisKeys: new Set() },
    );
    assert.equal(out[0].novelty, "duplicate");
    assert.equal(out[0].renderEligible, false);
  });

  it("drops findings missing required fields entirely (no silent partial acceptance)", () => {
    const out = validateExpertFindings(
      [{ id: "test-6", mode: "evidence_synthesis", classification: "SUPPORTED_SYNTHESIS" /* no claim, no claimBoundary, no reasoning */ }],
      { mode: "evidence_synthesis", existingTexts: [], axisKeys: new Set() },
    );
    assert.equal(out.length, 0);
  });

  it("downgrades psychCrossCheck CONFIRMED_BY_CURRENT to NOT_MEASURED when axisKey isn't a real axis in this report", () => {
    const out = validateExpertFindings(
      [
        {
          id: "test-7", mode: "saju_discovery", classification: "EXPERT_DERIVED",
          claim: "claim", evidenceRefs: [], sajuEvidence: ["evidence"], deterministicEvidence: [],
          reasoning: "reasoning", confidence: "medium", novelty: "genuinely_additive",
          claimBoundary: { supported: "X", notSupported: "Y" }, suggestedChapter: "c4_conflict",
          psychCrossCheck: { status: "CONFIRMED_BY_CURRENT", axisKey: "made_up_axis", note: "note" },
        },
      ],
      { mode: "saju_discovery", existingTexts: [], axisKeys: new Set(["conflict_style"]) },
    );
    assert.equal(out[0].psychCrossCheck.status, "NOT_MEASURED");
    assert.equal(out[0].psychCrossCheck.axisKey, null);
  });

  it("keeps psychCrossCheck CONTRADICTED_BY_CURRENT when axisKey is real", () => {
    const out = validateExpertFindings(
      [
        {
          id: "test-8", mode: "saju_discovery", classification: "EXPERT_DERIVED",
          claim: "claim", evidenceRefs: [], sajuEvidence: ["evidence"], deterministicEvidence: [],
          reasoning: "reasoning", confidence: "medium", novelty: "genuinely_additive",
          claimBoundary: { supported: "X", notSupported: "Y" }, suggestedChapter: "c4_conflict",
          psychCrossCheck: { status: "CONTRADICTED_BY_CURRENT", axisKey: "conflict_style", note: "note" },
        },
      ],
      { mode: "saju_discovery", existingTexts: [], axisKeys: new Set(["conflict_style"]) },
    );
    assert.equal(out[0].psychCrossCheck.status, "CONTRADICTED_BY_CURRENT");
    assert.equal(out[0].psychCrossCheck.axisKey, "conflict_style");
  });
});

describe("Expert Intelligence V1 — buildRomanticExpertIntelligence (mocked LLM)", () => {
  it("returns validated findings from both modes, meta.callCount=2", async () => {
    const openai = makeOpenAiMock([
      { findings: [{ id: "a1", mode: "evidence_synthesis", classification: "SUPPORTED_SYNTHESIS", claim: "새로운 결합 의미 A", evidenceRefs: ["x"], sajuEvidence: [], deterministicEvidence: ["y"], reasoning: "r", confidence: "high", novelty: "genuinely_additive", claimBoundary: { supported: "s", notSupported: "n" }, suggestedChapter: "c4_conflict" }] },
      { findings: [{ id: "b1", mode: "saju_discovery", classification: "EXPERT_DERIVED", claim: "새로운 사주 발견 B", evidenceRefs: [], sajuEvidence: ["일지 조합"], deterministicEvidence: [], reasoning: "r", confidence: "medium", novelty: "genuinely_additive", claimBoundary: { supported: "s", notSupported: "n" }, suggestedChapter: "c3_dynamics" }] },
    ]);
    const result = await buildRomanticExpertIntelligence({
      openai, storyPlan: minimalStoryPlan(), chartA: minimalChart, chartB: minimalChart,
      axisResults: [], names: NAMES, locale: "ko-KR",
    });
    assert.equal(result.meta.callCount, 2);
    assert.equal(result.meta.modeACount, 1);
    assert.equal(result.meta.modeBCount, 1);
    assert.equal(result.meta.failed, false);
    assert.equal(result.findings.length, 2);
  });

  it("failure mode: Mode A throws -> Mode B still attempted, meta.failed=true, does not throw", async () => {
    const openai = makeOpenAiMock([
      new Error("simulated network failure"),
      { findings: [] },
    ]);
    const result = await buildRomanticExpertIntelligence({
      openai, storyPlan: minimalStoryPlan(), chartA: minimalChart, chartB: minimalChart,
      axisResults: [], names: NAMES, locale: "ko-KR",
    });
    assert.equal(result.meta.failed, true);
    assert.match(result.meta.failureReason, /mode_a_failed/);
    assert.equal(result.meta.modeACount, 0);
  });

  it("failure mode: both calls fail -> empty findings, no throw", async () => {
    const openai = makeOpenAiMock([new Error("fail 1"), new Error("fail 2")]);
    const result = await buildRomanticExpertIntelligence({
      openai, storyPlan: minimalStoryPlan(), chartA: minimalChart, chartB: minimalChart,
      axisResults: [], names: NAMES, locale: "ko-KR",
    });
    assert.equal(result.findings.length, 0);
    assert.equal(result.meta.failed, true);
  });

  it("buildRomanticExpertIntelligenceSafe never throws even on a synchronous construction error", async () => {
    // Passing a broken "openai" whose .chat access itself throws synchronously.
    const brokenOpenai = { get chat() { throw new Error("boom"); } };
    const result = await buildRomanticExpertIntelligenceSafe({
      openai: brokenOpenai, storyPlan: minimalStoryPlan(), chartA: minimalChart, chartB: minimalChart,
      axisResults: [], names: NAMES, locale: "ko-KR",
    });
    assert.equal(result.findings.length, 0);
    assert.equal(result.meta.failed, true);
  });
});
