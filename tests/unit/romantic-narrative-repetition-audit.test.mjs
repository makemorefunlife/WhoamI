/**
 * Phase 5B Part 13 — repetition audit tool tests.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { auditNarrativeRepetition } from "../../lib/relationship/romantic/prototypeV4/romanticNarrativeRepetitionAudit.ts";

describe("auditNarrativeRepetition (spec Phase 5B Part 13)", () => {
  it("flags an identical sentence appearing in two different chapters", () => {
    const sections = [
      { chapterId: "c1_hero", blocks: [{ blockId: "a", body: "서로의 속도를 이해하는 것이 이 관계의 핵심입니다." }] },
      { chapterId: "c3_dynamics", blocks: [{ blockId: "b", body: "서로의 속도를 이해하는 것이 이 관계의 핵심입니다." }] },
    ];
    const result = auditNarrativeRepetition(sections);
    assert.equal(result.crossChapterFindings.length, 1);
    assert.equal(result.crossChapterFindings[0].kind, "identical");
  });

  it("flags a near-duplicate (not exact) sentence across chapters", () => {
    const sections = [
      { chapterId: "c1_hero", blocks: [{ blockId: "a", body: "서로의 속도를 이해하는 것이 이 관계의 핵심입니다." }] },
      { chapterId: "c3_dynamics", blocks: [{ blockId: "b", body: "서로의 속도를 이해하는 것이 이 관계에서 핵심입니다." }] },
    ];
    const result = auditNarrativeRepetition(sections);
    assert.ok(result.crossChapterFindings.some((f) => f.kind === "near_duplicate"));
  });

  it("does NOT flag the same sentence appearing twice within the SAME chapter", () => {
    const sections = [
      { chapterId: "c1_hero", blocks: [
        { blockId: "a", body: "서로의 속도를 이해하는 것이 이 관계의 핵심입니다." },
        { blockId: "b", body: "서로의 속도를 이해하는 것이 이 관계의 핵심입니다." },
      ] },
    ];
    const result = auditNarrativeRepetition(sections);
    assert.equal(result.crossChapterFindings.length, 0);
  });

  it("does NOT flag two genuinely different sentences about the same topic (legitimate layered reuse)", () => {
    const sections = [
      { chapterId: "c3_dynamics", blocks: [{ blockId: "a", body: "갈등이 시작되는 지점은 계획이 갑자기 바뀔 때입니다." }] },
      { chapterId: "c6_hidden_hearts", blocks: [{ blockId: "b", body: "그 순간 상대는 자신이 무시당했다고 느낄 수 있습니다." }] },
    ];
    const result = auditNarrativeRepetition(sections);
    assert.equal(result.crossChapterFindings.length, 0);
  });

  it("counts signature-phrase-bank hits only when they appear 3+ times report-wide", () => {
    const makeSection = (id) => ({ chapterId: id, blocks: [{ blockId: "x", body: "상호 보완적인 관계입니다." }] });
    const under = auditNarrativeRepetition([makeSection("c1_hero"), makeSection("c2_attraction")]);
    assert.equal(under.signaturePhraseHits.length, 0);

    const over = auditNarrativeRepetition([makeSection("c1_hero"), makeSection("c2_attraction"), makeSection("c3_dynamics")]);
    assert.ok(over.signaturePhraseHits.some((h) => h.phrase.includes("상호 보완적")));
  });

  it("ignores very short fragments below the minimum sentence length", () => {
    const sections = [
      { chapterId: "c1_hero", blocks: [{ blockId: "a", body: "네." }] },
      { chapterId: "c2_attraction", blocks: [{ blockId: "b", body: "네." }] },
    ];
    const result = auditNarrativeRepetition(sections);
    assert.equal(result.crossChapterFindings.length, 0);
  });

  it("totalCharCount sums all block body lengths — usable for before/after report-length comparison", () => {
    const sections = [{ chapterId: "c1_hero", blocks: [{ blockId: "a", body: "1234567890" }] }];
    const result = auditNarrativeRepetition(sections);
    assert.equal(result.totalCharCount, 10);
  });
});
