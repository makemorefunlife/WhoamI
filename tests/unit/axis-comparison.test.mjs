/**
 * Batch 1 — deterministic Current × Innate Primary-6 AxisComparison layer.
 * Run: npx tsx --test tests/unit/axis-comparison.test.mjs
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildAxisComparisons, selectAxisHighlights } from "../../lib/v2/analysis/axisComparison.ts";
import { PRIMARY_AXIS_KEYS } from "../../lib/v2/survey/types.ts";
import { gapDeltaTone } from "../../lib/v2/analysis/gap.ts";

const SECONDARY_ZERO = {
  stimulation: 50,
  self_control: 50,
  practicality: 50,
  structure: 50,
  empathy: 50,
  conflict_style: 50,
  resilience: 50,
  recognition: 50,
  energy_style: 50,
  thinking_style: 50,
  decision_style: 50,
};

function primary(overrides = {}) {
  return {
    autonomy: 50,
    connection: 50,
    stability: 50,
    growth: 50,
    structure: 50,
    adaptability: 50,
    ...overrides,
  };
}

describe("buildAxisComparisons", () => {
  it("generates all 6 primary axes", () => {
    const result = buildAxisComparisons(primary(), SECONDARY_ZERO, primary());
    assert.equal(result.length, 6);
    const axes = result.map((r) => r.axis).sort();
    assert.deepEqual(axes, [...PRIMARY_AXIS_KEYS].sort());
  });

  it("preserves current/innate scores exactly (no recomputation)", () => {
    const current = primary({ autonomy: 72, connection: 30 });
    const innate = primary({ autonomy: 40, connection: 65 });
    const result = buildAxisComparisons(current, SECONDARY_ZERO, innate);

    const autonomy = result.find((r) => r.axis === "autonomy");
    assert.equal(autonomy.current.score, 72);
    assert.equal(autonomy.innate.score, 40);

    const connection = result.find((r) => r.axis === "connection");
    assert.equal(connection.current.score, 30);
    assert.equal(connection.innate.score, 65);
  });

  it("computes positive delta and current_higher direction", () => {
    const current = primary({ growth: 80 });
    const innate = primary({ growth: 50 });
    const [row] = buildAxisComparisons(current, SECONDARY_ZERO, innate).filter(
      (r) => r.axis === "growth",
    );
    assert.equal(row.delta, 30);
    assert.equal(row.direction, "current_higher");
  });

  it("computes negative delta and innate_higher direction", () => {
    const current = primary({ growth: 30 });
    const innate = primary({ growth: 70 });
    const [row] = buildAxisComparisons(current, SECONDARY_ZERO, innate).filter(
      (r) => r.axis === "growth",
    );
    assert.equal(row.delta, -40);
    assert.equal(row.direction, "innate_higher");
  });

  it("computes zero delta and aligned direction", () => {
    const current = primary({ structure: 55 });
    const innate = primary({ structure: 55 });
    const [row] = buildAxisComparisons(current, SECONDARY_ZERO, innate).filter(
      (r) => r.axis === "structure",
    );
    assert.equal(row.delta, 0);
    assert.equal(row.direction, "aligned");
  });

  it("magnitude matches gapDeltaTone exactly at the boundary (absDelta<=10 neutral, >10 wide)", () => {
    const current = primary({ stability: 60 });
    const innateAt10 = primary({ stability: 50 });
    const innateAt11 = primary({ stability: 49 });

    const [rowAt10] = buildAxisComparisons(
      current,
      SECONDARY_ZERO,
      innateAt10,
    ).filter((r) => r.axis === "stability");
    const [rowAt11] = buildAxisComparisons(
      current,
      SECONDARY_ZERO,
      innateAt11,
    ).filter((r) => r.axis === "stability");

    assert.equal(rowAt10.magnitude, gapDeltaTone(10));
    assert.equal(rowAt10.magnitude, "neutral");
    assert.equal(rowAt11.magnitude, gapDeltaTone(11));
    assert.equal(rowAt11.magnitude, "wide");
  });

  it("raw delta is preserved independently of magnitude bucketing", () => {
    const current = primary({ adaptability: 95 });
    const innate = primary({ adaptability: 5 });
    const [row] = buildAxisComparisons(current, SECONDARY_ZERO, innate).filter(
      (r) => r.axis === "adaptability",
    );
    // magnitude collapses to "wide", but delta must retain the exact raw value
    assert.equal(row.magnitude, "wide");
    assert.equal(row.delta, 90);
  });

  it("attaches secondary evidence only to the current side, for axes with a known mapping", () => {
    const secondary = { ...SECONDARY_ZERO, empathy: 88, energy_style: 42 };
    const result = buildAxisComparisons(primary(), secondary, primary());
    const connection = result.find((r) => r.axis === "connection");

    assert.deepEqual(
      connection.current.secondaryEvidence.map((e) => e.axis).sort(),
      ["empathy", "energy_style"],
    );
    const empathyEntry = connection.current.secondaryEvidence.find(
      (e) => e.axis === "empathy",
    );
    assert.equal(empathyEntry.score, 88);

    // innate side must never carry secondaryEvidence
    assert.equal(connection.innate.secondaryEvidence, undefined);
  });

  it("autonomy has no fabricated secondary evidence (no mapping exists upstream)", () => {
    const result = buildAxisComparisons(primary(), SECONDARY_ZERO, primary());
    const autonomy = result.find((r) => r.axis === "autonomy");
    assert.deepEqual(autonomy.current.secondaryEvidence, []);
  });

  it("does not fabricate a confidence value when no evidence source is wired", () => {
    const result = buildAxisComparisons(primary(), SECONDARY_ZERO, primary());
    for (const row of result) {
      assert.equal(row.confidence, undefined);
    }
  });

  it("includes a human_meaning string sourced from the existing PRIMARY_AXIS_DEFINITIONS SSOT", () => {
    const result = buildAxisComparisons(primary(), SECONDARY_ZERO, primary());
    for (const row of result) {
      assert.equal(typeof row.human_meaning, "string");
      assert.ok(row.human_meaning.length > 0);
    }
  });
});

describe("selectAxisHighlights", () => {
  it("selects up to 3 widest-gap axes sorted by |delta| descending, using the existing wide/neutral threshold", () => {
    const current = primary({ structure: 90, connection: 80, stability: 70, growth: 55 });
    const innate = primary({ structure: 30, connection: 35, stability: 50, growth: 50 });
    const result = buildAxisComparisons(current, SECONDARY_ZERO, innate);
    const { gaps } = selectAxisHighlights(result);
    // structure |delta|=60, connection |delta|=45, stability |delta|=20 (all "wide"); growth |delta|=5 ("neutral")
    assert.deepEqual(gaps.map((g) => g.axis), ["structure", "connection", "stability"]);
  });

  it("never forces a count — returns fewer than 3 (even 0) when fewer axes are genuinely wide", () => {
    const current = primary({ structure: 90 });
    const innate = primary({ structure: 30 });
    const result = buildAxisComparisons(current, SECONDARY_ZERO, innate);
    const { gaps } = selectAxisHighlights(result);
    assert.equal(gaps.length, 1);
    assert.equal(gaps[0].axis, "structure");
  });

  it("returns an empty gaps array when every axis is neutral (no gap padded in)", () => {
    const result = buildAxisComparisons(primary(), SECONDARY_ZERO, primary());
    const { gaps } = selectAxisHighlights(result);
    assert.deepEqual(gaps, []);
  });

  it("selects the single closest-aligned axis as alignment, independent of the gap list", () => {
    const current = primary({
      structure: 90,
      autonomy: 60,
      connection: 40,
      stability: 65,
      growth: 45,
      adaptability: 51,
    });
    const innate = primary({
      structure: 30,
      autonomy: 45,
      connection: 60,
      stability: 48,
      growth: 62,
      adaptability: 50,
    });
    const result = buildAxisComparisons(current, SECONDARY_ZERO, innate);
    const { alignment } = selectAxisHighlights(result);
    assert.equal(alignment.axis, "adaptability");
  });

  it("never lets the same axis appear in both gaps and alignment", () => {
    const result = buildAxisComparisons(primary(), SECONDARY_ZERO, primary());
    const { gaps, alignment } = selectAxisHighlights(result);
    if (alignment) {
      assert.ok(!gaps.some((g) => g.axis === alignment.axis));
    }
  });

  it("caps gaps at 3 even if more than 3 axes are wide", () => {
    const current = primary({ structure: 95, connection: 90, stability: 85, growth: 80, adaptability: 75 });
    const innate = primary({ structure: 5, connection: 10, stability: 15, growth: 20, adaptability: 25 });
    const result = buildAxisComparisons(current, SECONDARY_ZERO, innate);
    const { gaps } = selectAxisHighlights(result);
    assert.equal(gaps.length, 3);
    assert.deepEqual(gaps.map((g) => g.axis), ["structure", "connection", "stability"]);
  });
});
