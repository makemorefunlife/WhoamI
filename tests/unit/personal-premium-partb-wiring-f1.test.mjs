/**
 * Personal Premium Latency Architecture Audit — F1 wiring fix.
 *
 * The audit confirmed three Part B prompt rules referenced Part A content
 * that buildPartAExcerpt never actually included: checklist's anchor list
 * ("the primary/widest axis gap (gap_deep_dive)", "the adaptation tension
 * named in adaptation_story"), relationships.pattern's "already-provided
 * gap/alignment axis" thread, and closing's "natural_tendency/current_
 * pattern material". This is a pure wiring fix — buildPartAExcerpt now
 * extracts the primary (widest) gap axis, the alignment axis, and a short
 * adaptation-recognition line from Part A's ACTUAL generated output, using
 * the same deterministic "widest gap first" selection
 * (promptEvidence.axisInterpretation.gaps[0]) that already decided which
 * axes Part A itself was asked to interpret. No new analysis, no new LLM
 * call, no change to Part A -> Part B sequencing.
 *
 * Run: npx tsx --test tests/unit/personal-premium-partb-wiring-f1.test.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";
import { buildPartAExcerpt } from "../../lib/report/runDeepEssenceStructuredLlm.ts";

const runnerSrc = fs.readFileSync("lib/report/runDeepEssenceStructuredLlm.ts", "utf8");
const promptSrc = fs.readFileSync("lib/prompts/deepEssenceStructured.ts", "utf8");

function fakePromptEvidence({ gaps = [], alignment = null } = {}) {
  return {
    axisInterpretation: {
      gaps: gaps.map((axis) => ({ axis })),
      alignment: alignment ? { axis: alignment } : null,
    },
  };
}

function fakePartA({ gapDeepDive, alignmentHighlight, adaptationNarrative } = {}) {
  return {
    summary: { core_mode: "x", energy_balance: "50 / 50", growth_edge: "y" },
    strengths: [{ title: "s1" }, { title: "s2" }, { title: "s3" }],
    watchouts: [{ title: "w1" }, { title: "w2" }, { title: "w3" }],
    energy: { headline: "h", optimal: ["o1", "o2"] },
    ...(gapDeepDive || alignmentHighlight
      ? {
          axis_interpretations: {
            ...(gapDeepDive ? { gap_deep_dive: gapDeepDive } : {}),
            ...(alignmentHighlight ? { alignment_highlight: alignmentHighlight } : {}),
          },
        }
      : {}),
    ...(adaptationNarrative ? { adaptation_story: { narrative: adaptationNarrative } } : {}),
  };
}

describe("buildPartAExcerpt — Part B receives the fields its prompt claims are available", () => {
  it("includes primary_gap_axis from the WIDEST gap axis (gaps[0]), using Part A's actual generated values", () => {
    const promptEvidence = fakePromptEvidence({ gaps: ["autonomy", "connection"] });
    const partA = fakePartA({
      gapDeepDive: {
        autonomy: { natural_tendency: "NT-auto", current_pattern: "CP-auto", may_cost: "cost-auto" },
        connection: { natural_tendency: "NT-conn", current_pattern: "CP-conn", may_cost: "cost-conn" },
      },
    });
    const excerpt = JSON.parse(buildPartAExcerpt(partA, promptEvidence));
    assert.deepEqual(excerpt.primary_gap_axis, {
      axis: "autonomy",
      natural_tendency: "NT-auto",
      current_pattern: "CP-auto",
      cost: "cost-auto",
    });
    // The narrower (non-widest) gap axis must NOT be surfaced — compact
    // excerpt, not a full dump.
    assert.equal(Object.keys(excerpt).includes("secondary_gap_axis"), false);
  });

  it("includes alignment_axis from Part A's actual generated alignment_highlight", () => {
    const promptEvidence = fakePromptEvidence({ alignment: "stability" });
    const partA = fakePartA({
      alignmentHighlight: {
        stability: { natural_tendency: "NT-stab", current_pattern: "CP-stab" },
      },
    });
    const excerpt = JSON.parse(buildPartAExcerpt(partA, promptEvidence));
    assert.deepEqual(excerpt.alignment_axis, {
      axis: "stability",
      natural_tendency: "NT-stab",
      current_pattern: "CP-stab",
    });
  });

  it("includes adaptation_recognition as the LAST paragraph of adaptation_story.narrative (no new summarization)", () => {
    const partA = fakePartA({
      adaptationNarrative: "Paragraph one.\n\nParagraph two.\n\nFinal recognition paragraph.",
    });
    const excerpt = JSON.parse(buildPartAExcerpt(partA, null));
    assert.equal(excerpt.adaptation_recognition, "Final recognition paragraph.");
    // Must not include the full narrative — compact only.
    assert.equal(JSON.stringify(excerpt).includes("Paragraph one"), false);
  });

  it("still preserves the pre-existing excerpt fields unchanged", () => {
    const partA = fakePartA();
    const excerpt = JSON.parse(buildPartAExcerpt(partA, null));
    assert.deepEqual(excerpt.summary, partA.summary);
    assert.deepEqual(excerpt.strengths, ["s1", "s2", "s3"]);
    assert.deepEqual(excerpt.watchouts, ["w1", "w2", "w3"]);
    assert.equal(excerpt.energy_headline, "h");
    assert.deepEqual(excerpt.energy_optimal, ["o1", "o2"]);
  });
});

describe("buildPartAExcerpt — missing optional Part A fields never crash and never fabricate", () => {
  it("promptEvidence null (ungrounded/legacy path) produces a valid excerpt with no gap/alignment/adaptation keys", () => {
    const partA = fakePartA();
    const excerpt = JSON.parse(buildPartAExcerpt(partA, null));
    assert.equal("primary_gap_axis" in excerpt, false);
    assert.equal("alignment_axis" in excerpt, false);
    assert.equal("adaptation_recognition" in excerpt, false);
  });

  it("promptEvidence has gaps but Part A never actually populated gap_deep_dive for that axis — omitted, not fabricated", () => {
    const promptEvidence = fakePromptEvidence({ gaps: ["autonomy"] });
    const partA = fakePartA(); // no axis_interpretations at all
    const excerpt = JSON.parse(buildPartAExcerpt(partA, promptEvidence));
    assert.equal("primary_gap_axis" in excerpt, false);
  });

  it("no gaps and no alignment in promptEvidence (e.g. all axes aligned) — no crash, both keys omitted", () => {
    const promptEvidence = fakePromptEvidence({ gaps: [], alignment: null });
    const partA = fakePartA();
    assert.doesNotThrow(() => buildPartAExcerpt(partA, promptEvidence));
    const excerpt = JSON.parse(buildPartAExcerpt(partA, promptEvidence));
    assert.equal("primary_gap_axis" in excerpt, false);
    assert.equal("alignment_axis" in excerpt, false);
  });

  it("no adaptation_story field at all — adaptation_recognition omitted, no crash", () => {
    const partA = fakePartA();
    assert.doesNotThrow(() => buildPartAExcerpt(partA, null));
    const excerpt = JSON.parse(buildPartAExcerpt(partA, null));
    assert.equal("adaptation_recognition" in excerpt, false);
  });

  it("adaptation_story.narrative is an empty string — omitted, not fabricated as an empty/placeholder string", () => {
    const partA = fakePartA({ adaptationNarrative: "" });
    const excerpt = JSON.parse(buildPartAExcerpt(partA, null));
    assert.equal("adaptation_recognition" in excerpt, false);
  });

  it("malformed partA (missing everything) never throws — returns a string, worst case empty", () => {
    assert.doesNotThrow(() => buildPartAExcerpt({}, null));
    assert.equal(typeof buildPartAExcerpt({}, null), "string");
  });
});

describe("Decoupled Part A -> Part 04 + Part B architecture (source wiring)", () => {
  it("exactly 3 callLlmJson call sites (Part A, Part 04 synthesis, Part B)", () => {
    const calls = runnerSrc.match(/callLlmJson\(openai,/g) ?? [];
    assert.equal(calls.length, 3, "Batch 4D architecture uses exactly 3 LLM call sites");
  });

  it("Promise.all executes Part 04 and Part B in parallel", () => {
    assert.ok(runnerSrc.includes("Promise.all([part04Promise, partBPromise])"));
  });

  it("buildPartAExcerpt is called with Part A's already-coerced value, after coerceDeepEssencePartA", () => {
    const coerceIdx = runnerSrc.indexOf("coerceDeepEssencePartA(partARaw");
    const excerptIdx = runnerSrc.indexOf("buildPartAExcerpt(partA, promptEvidence)");
    assert.ok(coerceIdx > -1 && excerptIdx > -1);
    assert.ok(excerptIdx > coerceIdx, "excerpt must be built from partA's coerced value, after Part A fully resolves");
  });

  it("promptEvidence is computed once, before Part A's own call (not duplicated for Part B)", () => {
    const promptEvidenceCalls = runnerSrc.match(/formatPart01EvidenceForPrompt\(/g) ?? [];
    assert.equal(promptEvidenceCalls.length, 1, "must reuse the single promptEvidence computed before Part A, not recompute it for Part B");
  });
});

describe("Prompt contract — F1 references now point at fields Part B actually receives", () => {
  it("checklist anchor list references primary_gap_axis / adaptation_recognition in the excerpt, not gap_deep_dive / adaptation_story", () => {
    assert.match(promptSrc, /primary_gap_axis in the excerpt above/);
    assert.match(promptSrc, /adaptation_recognition in the excerpt above/);
  });

  it("relationships.pattern's optional thread references primary_gap_axis / alignment_axis from the excerpt", () => {
    assert.match(promptSrc, /using primary_gap_axis \/ alignment_axis from the excerpt above/);
  });

  it("closing's Sentence 1 instruction references primary_gap_axis, with a self-contained fallback when absent", () => {
    assert.match(promptSrc, /built fresh from primary_gap_axis's natural_tendency\/current_pattern in the excerpt above when present/);
    assert.match(promptSrc, /otherwise build it from what you yourself already wrote in relationships\/playbook\/future/);
  });
});
