/**
 * Phase 5B Part 3 — Tier B safe target-detection.
 * Phase 5C Part 3 — applyTierBEnrichment now REPLACES the target block's
 * body when the claim is substantial enough to safely stand alone
 * (>= REPLACE_LENGTH_FLOOR of the original), falling back to append only
 * when the claim is too short to preserve the block's specificity.
 * Mocked/deterministic only, no LLM.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  selectUserVisibleExpertBlocks,
  applyTierBEnrichment,
} from "../../lib/relationship/romantic/prototypeV4/romanticExpertConsumptionPolicy.ts";

function tierBFinding(overrides = {}) {
  return {
    id: "tb-1",
    mode: "evidence_synthesis",
    classification: "SUPPORTED_SYNTHESIS",
    insightType: "test",
    subjects: ["pair"],
    claim: "완전히 새로운 결합 해석 문장입니다, 기존 블록과는 다른 표현으로 깊이를 더합니다.",
    evidenceRefs: ["axisResults.conflict_style"],
    sajuEvidence: [],
    deterministicEvidence: ["hidden_collision"],
    reasoning: "두 신호를 결합했을 때 이런 의미가 나옵니다.",
    confidence: "high",
    novelty: "deepens_existing",
    claimBoundary: { supported: "X", notSupported: "Y" },
    suggestedChapter: "c4_conflict",
    renderEligible: true,
    pairDependency: "",
    ...overrides,
  };
}

function mapping(overrides = {}) {
  return { findingId: "tb-1", suggestedChapter: "c4_conflict", targetBlockId: "loop.trigger", claim: "확장.", confidence: "medium", ...overrides };
}

function minimalStoryPlan() {
  return { crossSignalInsightsV1: [] };
}

function sectionsWithEvidence() {
  return [
    {
      chapterId: "c4_conflict",
      blocks: [
        { blockId: "loop.trigger", body: "이런 장면에서 나타날 가능성이 있어요: 계획이 갑자기 틀어질 때.", evidenceIds: ["axisResults.conflict_style"] },
        { blockId: "loop.steps", body: "1. 시작 2. 반복", evidenceIds: ["axisResults.recognition"] },
      ],
    },
    { chapterId: "c8_strength_vulnerability", blocks: [{ blockId: "shared.strength", body: "둘이 함께 만들어내는 가장 큰 강점입니다.", evidenceIds: [] }] },
  ];
}

describe("Tier B target detection (spec Phase 5B Part 3)", () => {
  it("a Tier B finding whose evidenceRefs overlap an existing block's evidenceIds is matched to that block", () => {
    const sections = sectionsWithEvidence();
    const selection = selectUserVisibleExpertBlocks([tierBFinding()], minimalStoryPlan(), sections, "ko-KR");
    assert.equal(selection.meta.tierBTargetMappings.length, 1);
    assert.equal(selection.meta.tierBTargetMappings[0].targetBlockId, "loop.trigger");
    assert.equal(selection.meta.tierBTargetMappings[0].confidence, "high");
  });

  it("a Tier B finding with no evidence overlap anywhere in its chapter has targetBlockId=null — stays internal, no forced fallback", () => {
    const sections = sectionsWithEvidence();
    const finding = tierBFinding({ evidenceRefs: ["axisResults.something_unrelated"] });
    const selection = selectUserVisibleExpertBlocks([finding], minimalStoryPlan(), sections, "ko-KR");
    assert.equal(selection.meta.tierBTargetMappings[0].targetBlockId, null);
  });

  it("Tier B findings never appear in blocksByChapter directly — only via applyTierBEnrichment", () => {
    const sections = sectionsWithEvidence();
    const selection = selectUserVisibleExpertBlocks([tierBFinding()], minimalStoryPlan(), sections, "ko-KR");
    assert.deepEqual(selection.blocksByChapter, {});
  });
});

describe("applyTierBEnrichment — replace path (spec Phase 5C Part 3)", () => {
  it("a substantial claim (>= 40% of the original body's length) REPLACES the block body, not appends", () => {
    const sections = sectionsWithEvidence();
    const original = sections[0].blocks[0].body;
    const claim = "이 갈등 루프는 계획이 갑자기 틀어질 때 시작되며, 이는 두 사람이 통제감을 잃는 순간에 대한 서로 다른 반응 방식에서 비롯됩니다.";
    assert.ok(claim.length >= original.length * 0.4);
    const mappings = [mapping({ claim })];
    const enriched = applyTierBEnrichment(sections, mappings, "ko-KR");
    const block = enriched[0].blocks.find((b) => b.blockId === "loop.trigger");
    assert.equal(block.body, claim);
    assert.ok(!block.body.includes("이런 장면에서 나타날 가능성이 있어요"), "original weaker prose must be gone, not just supplemented");
  });

  it("a short claim (< 40% of original length) falls back to append, preserving the original specific content", () => {
    const sections = sectionsWithEvidence();
    const mappings = [mapping({ claim: "짧은 요약." })]; // well under 40% of the ~33-char original
    const enriched = applyTierBEnrichment(sections, mappings, "ko-KR");
    const block = enriched[0].blocks.find((b) => b.blockId === "loop.trigger");
    assert.ok(block.body.includes("계획이 갑자기 틀어질 때"));
    assert.ok(block.body.includes("짧은 요약."));
  });

  it("when two findings map to the same block, only the higher-confidence one replaces — the other appends, never a double-replace", () => {
    const sections = sectionsWithEvidence();
    const low = mapping({ findingId: "low", confidence: "medium", claim: "중간 신뢰도의 더 짧은 대체 후보 문장입니다." });
    const high = mapping({ findingId: "high", confidence: "high", claim: "가장 높은 신뢰도를 가진, 이 블록 전체를 대체할 만큼 충분히 길고 구체적인 새 문장입니다." });
    const enriched = applyTierBEnrichment(sections, [low, high], "ko-KR");
    const block = enriched[0].blocks.find((b) => b.blockId === "loop.trigger");
    assert.ok(block.body.startsWith(high.claim), "the high-confidence finding must be the replacement, not the low one");
    assert.ok(block.body.includes(low.claim), "the second finding still appends rather than being dropped");
  });

  it("does NOT create a new block — the enriched chapter has the same block count as before", () => {
    const sections = sectionsWithEvidence();
    const enriched = applyTierBEnrichment(sections, [mapping()], "ko-KR");
    assert.equal(enriched[0].blocks.length, sections[0].blocks.length);
  });

  it("preserves evidenceIds on the replaced/enriched block untouched", () => {
    const sections = sectionsWithEvidence();
    const enriched = applyTierBEnrichment(sections, [mapping()], "ko-KR");
    const block = enriched[0].blocks.find((b) => b.blockId === "loop.trigger");
    assert.deepEqual(block.evidenceIds, ["axisResults.conflict_style"]);
  });

  it("a mapping with targetBlockId=null is a no-op — no block is modified", () => {
    const sections = sectionsWithEvidence();
    const enriched = applyTierBEnrichment(sections, [mapping({ targetBlockId: null })], "ko-KR");
    assert.deepEqual(enriched, sections);
  });

  it("empty mappings array returns the sections unchanged (same reference is fine, content must match)", () => {
    const sections = sectionsWithEvidence();
    const enriched = applyTierBEnrichment(sections, [], "ko-KR");
    assert.deepEqual(enriched, sections);
  });

  it("does not mutate the input sections array", () => {
    const sections = sectionsWithEvidence();
    const before = JSON.stringify(sections);
    applyTierBEnrichment(sections, [mapping()], "ko-KR");
    assert.equal(JSON.stringify(sections), before);
  });
});
