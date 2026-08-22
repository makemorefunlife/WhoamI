/**
 * Phase 5C Part 2/9 — narrative ownership regression tests. Chapter 05
 * (c6_hidden_hearts) must not restate the raw stress/visible-reaction
 * sentence that Chapter 01 (c3_dynamics/face.stress) and Chapter 04
 * (c5_misunderstanding/misread) already state verbatim — its job is WHY IT
 * FEELS THAT WAY, not a third repetition of WHAT HAPPENS.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildCanonicalRomanticV4Report } from "../../lib/relationship/romantic/prototypeV4/buildCanonicalRomanticV4Report.ts";

function makePsych(overrides) {
  const base = {
    stimulation: 50, self_control: 50, practicality: 50, structure: 50, empathy: 50,
    conflict_style: 50, resilience: 50, recognition: 50, energy_style: 50,
    thinking_style: 50, decision_style: 50,
  };
  return { survey_source: "v2_10q", secondary_axes: { ...base, ...overrides } };
}

describe("Narrative ownership — c6_hidden_hearts no longer restates c3_dynamics/c5_misunderstanding verbatim", () => {
  it("hidden.a/hidden.b block bodies do not contain the literal visibleReaction sentence already stated elsewhere", () => {
    const report = buildCanonicalRomanticV4Report("ko-KR", 2026, {
      pairSajuInput: { nameA: "Sera", nameB: "동글" },
      surveyInput: { psychA: makePsych({ self_control: 70 }), psychB: makePsych({ structure: 75 }) },
    });
    const hiddenHeartsSection = report.sections.find((s) => s.chapterId === "c6_hidden_hearts");
    assert.ok(hiddenHeartsSection);
    for (const block of hiddenHeartsSection.blocks) {
      if (!block.blockId.startsWith("hidden.")) continue;
      assert.ok(!block.body.includes("겉으로 드러나는 모습"), `${block.blockId} must not restate the visible-reaction opening line`);
    }
  });

  it("hidden.a/hidden.b still contain their own unique layers (innerFeeling, fear, unspokenNeed, whatHelps)", () => {
    const report = buildCanonicalRomanticV4Report("ko-KR", 2026, {
      pairSajuInput: { nameA: "Sera", nameB: "동글" },
      surveyInput: { psychA: makePsych({ self_control: 70 }), psychB: makePsych({ structure: 75 }) },
    });
    const hiddenHeartsSection = report.sections.find((s) => s.chapterId === "c6_hidden_hearts");
    const hiddenA = hiddenHeartsSection.blocks.find((b) => b.blockId === "hidden.a");
    assert.ok(hiddenA.body.includes("마음 깊은 곳의 실제 감정"));
    assert.ok(hiddenA.body.includes("가장 조심스러운 두려움"));
    assert.ok(hiddenA.body.includes("상대가 알아주었으면 하는"));
    assert.ok(hiddenA.body.includes("상대에게 진정으로 도움이 되는"));
  });

  it("the raw visibleReaction fact is still available internally via structuredData, for provenance — only the rendered restatement is removed", () => {
    const report = buildCanonicalRomanticV4Report("ko-KR", 2026, {
      pairSajuInput: { nameA: "Sera", nameB: "동글" },
      surveyInput: { psychA: makePsych({ self_control: 70 }), psychB: makePsych({ structure: 75 }) },
    });
    const hiddenHeartsSection = report.sections.find((s) => s.chapterId === "c6_hidden_hearts");
    const hiddenA = hiddenHeartsSection.blocks.find((b) => b.blockId === "hidden.a");
    assert.ok(typeof hiddenA.structuredData.visibleReaction === "string" && hiddenA.structuredData.visibleReaction.length > 0);
  });
});
