/**
 * Phase 5B Part 3 — Tier B safe target-detection + enrichment tests.
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

describe("applyTierBEnrichment (spec Phase 5B Part 3)", () => {
  it("appends the matched finding's claim to its target block's body, preserving the original text", () => {
    const sections = sectionsWithEvidence();
    const mappings = [{ findingId: "tb-1", suggestedChapter: "c4_conflict", targetBlockId: "loop.trigger", claim: "새로운 확장 문장입니다." }];
    const enriched = applyTierBEnrichment(sections, mappings, "ko-KR");
    const block = enriched[0].blocks.find((b) => b.blockId === "loop.trigger");
    assert.ok(block.body.includes("계획이 갑자기 틀어질 때"));
    assert.ok(block.body.includes("새로운 확장 문장입니다."));
  });

  it("does NOT create a new block — the enriched chapter has the same block count as before", () => {
    const sections = sectionsWithEvidence();
    const mappings = [{ findingId: "tb-1", suggestedChapter: "c4_conflict", targetBlockId: "loop.trigger", claim: "확장." }];
    const enriched = applyTierBEnrichment(sections, mappings, "ko-KR");
    assert.equal(enriched[0].blocks.length, sections[0].blocks.length);
  });

  it("preserves evidenceIds on the enriched block untouched", () => {
    const sections = sectionsWithEvidence();
    const mappings = [{ findingId: "tb-1", suggestedChapter: "c4_conflict", targetBlockId: "loop.trigger", claim: "확장." }];
    const enriched = applyTierBEnrichment(sections, mappings, "ko-KR");
    const block = enriched[0].blocks.find((b) => b.blockId === "loop.trigger");
    assert.deepEqual(block.evidenceIds, ["axisResults.conflict_style"]);
  });

  it("a mapping with targetBlockId=null is a no-op — no block is modified", () => {
    const sections = sectionsWithEvidence();
    const mappings = [{ findingId: "tb-1", suggestedChapter: "c4_conflict", targetBlockId: null, claim: "확장." }];
    const enriched = applyTierBEnrichment(sections, mappings, "ko-KR");
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
    applyTierBEnrichment(sections, [{ findingId: "tb-1", suggestedChapter: "c4_conflict", targetBlockId: "loop.trigger", claim: "확장." }], "ko-KR");
    assert.equal(JSON.stringify(sections), before);
  });
});
