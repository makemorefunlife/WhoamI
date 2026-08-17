/**
 * Personal Premium Narrative Quality Singleton — Batch 4: Legacy Silent
 * Fallback Cleanup.
 *
 * Audit finding: relationships.fit/friction padding in
 * coerceDeepEssencePartB was completely silent (no notes.push at all,
 * unlike strengths/watchouts in Part A, which already tracked
 * strengths_len_/watchouts_len_). The schema requires fit/friction to be
 * exactly 3 items (isFixedLenList in deepEssenceStructuredSchema.ts) —
 * true omission-on-shortfall isn't schema-safe without a larger change
 * (a report failing validation falls back to full prose, which is worse
 * than one generic-but-present item), so the safe minimal Batch 4 fix is
 * observability: log when padding actually fires, matching the existing
 * pattern already used for strengths/watchouts/checklist.
 *
 * Run: npx tsx --test tests/unit/personal-premium-batch4-fallback-observability.test.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";
import { coerceDeepEssencePartB } from "../../lib/report/coerceDeepEssenceStructured.ts";

function fullPartBInput(overrides = {}) {
  return {
    relationships: {
      pattern: "pattern text",
      fit: ["a", "b", "c"],
      friction: ["d", "e", "f"],
      compare: [
        { wound: "w1", steady: "s1" },
        { wound: "w2", steady: "s2" },
        { wound: "w3", steady: "s3" },
      ],
    },
    playbook: {
      rule: "rule text",
      rows: [
        { situation: "s1", old: "o1", better: "b1" },
        { situation: "s2", old: "o2", better: "b2" },
        { situation: "s3", old: "o3", better: "b3" },
      ],
      heated: "heated text",
      reset: "reset text",
    },
    future: { remember: ["r1", "r2", "r3"], leap: "leap text" },
    closing: "closing text",
    checklist: ["one item"],
    ...overrides,
  };
}

describe("coerceDeepEssencePartB — relationships.fit/friction padding is now observable", () => {
  it("logs relationships.fit_len_N when the LLM returns fewer than 3 fit items (previously completely silent)", () => {
    const input = fullPartBInput();
    input.relationships.fit = ["only one"];
    const { notes, value } = coerceDeepEssencePartB(input);
    assert.ok(notes.some((n) => n === "relationships.fit_len_1"), `expected a fit_len_1 note, got: ${JSON.stringify(notes)}`);
    // Padding still fires (schema requires exactly 3) — value must still be valid shape.
    assert.equal(value.relationships.fit.length, 3);
  });

  it("logs relationships.friction_len_N when the LLM returns fewer than 3 friction items", () => {
    const input = fullPartBInput();
    input.relationships.friction = [];
    const { notes, value } = coerceDeepEssencePartB(input);
    assert.ok(notes.some((n) => n === "relationships.friction_len_0"), `expected a friction_len_0 note, got: ${JSON.stringify(notes)}`);
    assert.equal(value.relationships.friction.length, 3);
  });

  it("logs relationships.fit_len_N when the LLM returns MORE than 3 (also a mismatch worth tracking)", () => {
    const input = fullPartBInput();
    input.relationships.fit = ["a", "b", "c", "d", "e"];
    const { notes } = coerceDeepEssencePartB(input);
    assert.ok(notes.some((n) => n === "relationships.fit_len_5"), `expected a fit_len_5 note, got: ${JSON.stringify(notes)}`);
  });

  it("produces NO fit/friction notes when the LLM already returned exactly 3 items each (no padding needed, nothing to log)", () => {
    const input = fullPartBInput();
    const { notes } = coerceDeepEssencePartB(input);
    assert.ok(!notes.some((n) => n.startsWith("relationships.fit_len_")));
    assert.ok(!notes.some((n) => n.startsWith("relationships.friction_len_")));
  });

  it("still produces valid, schema-shaped output even when both fit and friction are short (padding is a safety net, not removed)", () => {
    const input = fullPartBInput();
    input.relationships.fit = ["only one"];
    input.relationships.friction = [];
    const { value } = coerceDeepEssencePartB(input);
    assert.equal(value.relationships.fit.length, 3);
    assert.equal(value.relationships.friction.length, 3);
  });
});

describe("runDeepEssenceStructuredLlm.ts — Part B notes are already logged end-to-end (confirms no new plumbing was needed)", () => {
  const src = fs.readFileSync("lib/report/runDeepEssenceStructuredLlm.ts", "utf8");

  it("logs coercedB.notes via logServerEvent (pre-existing infrastructure, now actually populated for fit/friction)", () => {
    assert.match(src, /coercedB\.notes/);
    assert.match(src, /logServerEvent\("runDeepEssenceStructuredLlm", "part_b_coerced"/);
  });
});

describe("deepEssenceStructuredSchema.ts — confirms WHY omission-on-shortfall isn't schema-safe (documents the constraint, not a behavior test)", () => {
  const src = fs.readFileSync("lib/report/deepEssenceStructuredSchema.ts", "utf8");

  it("relationships.fit/friction are validated as fixed-length-3 lists, not a min/max range", () => {
    assert.match(src, /isFixedLenList\(relationships\.fit, 3, isNonEmptyString\)/);
    assert.match(src, /isFixedLenList\(relationships\.friction, 3, isNonEmptyString\)/);
  });
});
