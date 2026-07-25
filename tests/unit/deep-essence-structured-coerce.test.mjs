/**
 * Coercion keeps Inner Compass alive when LLM array lengths drift.
 * Run: npx tsx --test tests/unit/deep-essence-structured-coerce.test.mjs
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  coerceDeepEssencePartA,
  coerceDeepEssencePartB,
} from "../../lib/report/coerceDeepEssenceStructured.ts";
import {
  isDeepEssencePartA,
  isDeepEssencePartB,
  isDeepEssenceStructuredReport,
} from "../../lib/report/deepEssenceStructuredSchema.ts";

const floor = {
  autonomy: 40,
  connection: 50,
  stability: 45,
  growth: 55,
  structure: 35,
  adaptability: 60,
};

describe("coerceDeepEssenceStructured", () => {
  it("pads short Part A arrays into a valid Part A", () => {
    const { value, notes } = coerceDeepEssencePartA(
      {
        summary: { core_mode: "Deep water" },
        radar_potential: { autonomy: 70, connection: 80 },
        strengths: [{ title: "One", body: "Only one strength body." }],
        energy: {
          headline: "Headline",
          bars: [{ label: "A", value: 10, tone: "nope" }],
          fuels: ["a"],
        },
      },
      floor,
    );
    assert.ok(notes.length > 0);
    assert.equal(isDeepEssencePartA(value), true);
    assert.equal(value.strengths.length, 3);
    assert.equal(value.energy.bars[0].tone, "highlight");
  });

  it("pads checklist and compare into valid Part B", () => {
    const { value } = coerceDeepEssencePartB({
      relationships: { pattern: "Careful closeness", fit: ["a"] },
      checklist: ["one", "two"],
    });
    assert.equal(isDeepEssencePartB(value), true);
    assert.equal(value.checklist.length >= 8, true);
  });

  it("merged coerced parts pass full schema", () => {
    const a = coerceDeepEssencePartA({ summary: { core_mode: "X" } }, floor).value;
    const b = coerceDeepEssencePartB({}).value;
    assert.equal(isDeepEssenceStructuredReport({ ...a, ...b }), true);
  });
});
