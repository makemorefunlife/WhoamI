/**
 * Personal Premium Narrative Quality Singleton — Batch 3: Axis Semantic
 * Diversity.
 *
 * Real fresh-generation QA (this session, pre-Batch-3) showed
 * selectAxisHighlights() repeatedly selecting 2-3 axes from the same
 * thematic family (e.g. autonomy+growth+adaptability, all "self-directed
 * change" axes), producing gap_deep_dive entries that independently
 * converged on the same story (all three gives_you fields said "helps you
 * get along with others"). This file covers the cluster-aware selector
 * fix and its prompt-level self-drop companion instruction.
 *
 * Run: npx tsx --test tests/unit/personal-premium-batch3-axis-diversity.test.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";
import { selectAxisHighlights } from "../../lib/v2/analysis/axisComparison.ts";

function axis(axisKey, delta, magnitude = "wide") {
  return { axis: axisKey, delta, magnitude, direction: delta > 0 ? "current_higher" : delta < 0 ? "innate_higher" : "aligned" };
}

describe("selectAxisHighlights — thematic cluster diversity", () => {
  it("prefers 3 distinct-cluster axes over a same-cluster 3-of-a-kind when comparable-magnitude alternatives exist (reproduces the observed live-QA collapse)", () => {
    // All 3 clusters have a genuinely wide candidate here: autonomy/growth/
    // adaptability (self_directed_change), stability (order_and_predictability),
    // connection (relational) — a real 3-distinct-cluster choice is available.
    const comparisons = [
      axis("autonomy", 30),
      axis("growth", 25),
      axis("adaptability", 22),
      axis("stability", 20),
      axis("connection", 18),
      axis("structure", 1, "neutral"),
    ];
    const { gaps } = selectAxisHighlights(comparisons);
    const clusters = gaps.map((g) => g.axis);
    assert.equal(gaps.length, 3);
    assert.deepEqual(clusters, ["autonomy", "stability", "connection"], "the widest axis from each of the 3 distinct clusters should win, not a 2nd/3rd same-cluster axis");
    const selfDirectedCount = clusters.filter((a) => ["autonomy", "growth", "adaptability"].includes(a)).length;
    assert.ok(selfDirectedCount <= 1, "at most 1 self_directed_change axis should be selected when distinct-cluster alternatives exist");
  });

  it("still returns the widest axis from each cluster, not an arbitrary one", () => {
    // 3 distinct wide clusters available: self_directed_change (autonomy/
    // growth/adaptability, growth widest), order_and_predictability
    // (stability), relational (connection) — exactly 1 self_directed pick expected.
    const comparisons = [
      axis("autonomy", 15),
      axis("growth", 30), // widest self_directed_change candidate
      axis("adaptability", 20),
      axis("stability", 18),
      axis("connection", 12),
      axis("structure", 1, "neutral"),
    ];
    const { gaps } = selectAxisHighlights(comparisons);
    const selfDirected = gaps.filter((g) => ["autonomy", "growth", "adaptability"].includes(g.axis));
    assert.equal(selfDirected.length, 1);
    assert.equal(selfDirected[0].axis, "growth", "the widest same-cluster candidate (growth, delta 30) must be the one selected, not a narrower one");
  });

  it("reuses a cluster (rather than returning fewer than 3) only when there aren't 3 distinct-cluster wide gaps available", () => {
    // Only 2 clusters have any wide candidate at all: self_directed_change
    // (autonomy, growth) and order_and_predictability (stability). No
    // relational (connection) wide candidate exists.
    const comparisons = [
      axis("autonomy", 30),
      axis("growth", 28),
      axis("stability", 20),
      axis("connection", 3, "neutral"),
      axis("structure", 2, "neutral"),
      axis("adaptability", 1, "neutral"),
    ];
    const { gaps } = selectAxisHighlights(comparisons);
    assert.equal(gaps.length, 3, "with only 2 distinct clusters wide, the 3rd slot legitimately reuses a cluster rather than being left empty");
    assert.deepEqual(gaps.map((g) => g.axis), ["autonomy", "growth", "stability"]);
  });

  it("never pads past however many genuinely wide gaps exist, even with cluster diversity available", () => {
    const comparisons = [
      axis("autonomy", 30),
      axis("stability", 2, "neutral"),
      axis("connection", 1, "neutral"),
      axis("growth", 1, "neutral"),
      axis("structure", 1, "neutral"),
      axis("adaptability", 1, "neutral"),
    ];
    const { gaps } = selectAxisHighlights(comparisons);
    assert.equal(gaps.length, 1, "only 1 axis is genuinely wide — must not be padded to 2 or 3");
  });

  it("magnitude ranking is still the primary sort — a cluster is never preferred over strictly larger magnitude within reach of the 3-slot budget", () => {
    const comparisons = [
      axis("autonomy", 40), // largest overall
      axis("growth", 35),   // 2nd largest, same cluster as autonomy
      axis("stability", 15), // distinct cluster but much smaller
      axis("connection", 2, "neutral"),
      axis("structure", 1, "neutral"),
      axis("adaptability", 1, "neutral"),
    ];
    const { gaps } = selectAxisHighlights(comparisons);
    // autonomy must be first (largest), and since only autonomy+growth are
    // wide-and-same-cluster with stability being the only other wide
    // candidate, all 3 legitimately qualify — but autonomy must be present
    // and first by magnitude.
    assert.equal(gaps[0].axis, "autonomy");
  });

  it("alignment selection is unaffected by the cluster logic (still pure closeness-based, unchanged behavior)", () => {
    const comparisons = [
      axis("autonomy", 30),
      axis("growth", 25),
      axis("adaptability", 1, "neutral"),
      axis("stability", 20),
      axis("connection", 0, "neutral"),
      axis("structure", 1, "neutral"),
    ];
    const { alignment } = selectAxisHighlights(comparisons);
    assert.equal(alignment.axis, "connection", "the closest-to-zero-delta axis is still the alignment pick, regardless of cluster");
  });
});

describe("lib/prompts/deepEssenceStructured.ts — axis self-drop instruction (source wiring)", () => {
  const src = fs.readFileSync("lib/prompts/deepEssenceStructured.ts", "utf8");

  it("instructs comparing gap_deep_dive entries for convergent stories before finalizing", () => {
    assert.match(src, /SELF-DROP CHECK/);
    assert.match(src, /if two entries would tell the same underlying story in different words, do NOT force two separate full narratives/);
  });

  it("forbids inventing a new fact just to manufacture artificial variety", () => {
    assert.match(src, /Never solve this by inventing a new fact to manufacture a difference/);
  });
});
