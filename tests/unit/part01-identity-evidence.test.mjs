/**
 * Batch 2 — Part 01 Identity Lens (Personal CE → Part01 Evidence Packet).
 * Run: npx tsx --test tests/unit/part01-identity-evidence.test.mjs
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runPersonalContextEngine, buildPersonalCeFixtureChart } from "../../lib/personCore/personalContextEngine/index.ts";
import { buildPart01IdentityEvidencePacket } from "../../lib/v1/slim/part01IdentityEvidence.ts";
import { PRIMARY_AXIS_KEYS } from "../../lib/v2/survey/types.ts";

const CURRENT_PRIMARY = {
  autonomy: 70,
  connection: 40,
  stability: 55,
  growth: 60,
  structure: 45,
  adaptability: 65,
};
const CURRENT_SECONDARY = {
  stimulation: 60,
  self_control: 50,
  practicality: 55,
  structure: 45,
  empathy: 65,
  conflict_style: 40,
  resilience: 70,
  recognition: 50,
  energy_style: 55,
  thinking_style: 60,
  decision_style: 45,
};
const INNATE_PRIMARY = {
  autonomy: 40,
  connection: 60,
  stability: 65,
  growth: 50,
  structure: 55,
  adaptability: 45,
};

function buildFixturePacket(fixtureId) {
  const chart = buildPersonalCeFixtureChart(fixtureId);
  const personalContext = runPersonalContextEngine({ chart });
  const packet = buildPart01IdentityEvidencePacket({
    chart,
    personalContext,
    currentPrimary: CURRENT_PRIMARY,
    currentSecondary: CURRENT_SECONDARY,
    innatePrimary: INNATE_PRIMARY,
  });
  return { chart, personalContext, packet };
}

describe("buildPart01IdentityEvidencePacket", () => {
  it("1. builds an evidence packet successfully with all top-level sections", () => {
    const { packet } = buildFixturePacket("known_time");
    assert.ok(packet);
    for (const key of [
      "axisComparisons",
      "currentBehavior",
      "innate",
      "dimensions",
      "layeredIdentityCandidates",
      "growthCandidates",
      "provenance",
    ]) {
      assert.ok(key in packet, `missing top-level key: ${key}`);
    }
  });

  it("2. preserves all 6 Batch 1 AxisComparison axes", () => {
    const { packet } = buildFixturePacket("known_time");
    assert.equal(packet.axisComparisons.length, 6);
    const axes = packet.axisComparisons.map((a) => a.axis).sort();
    assert.deepEqual(axes, [...PRIMARY_AXIS_KEYS].sort());
    // and the underlying scores are untouched (no recomputation)
    const autonomy = packet.axisComparisons.find((a) => a.axis === "autonomy");
    assert.equal(autonomy.current.score, CURRENT_PRIMARY.autonomy);
    assert.equal(autonomy.innate.score, INNATE_PRIMARY.autonomy);
  });

  it("3. Personal CE dimensions keep confidence / is_mixed / contributing_sources intact", () => {
    const { personalContext, packet } = buildFixturePacket("known_time");
    const rawDims = personalContext.aggregates.relational_profile?.dimension_evaluations ?? {};
    assert.ok(packet.dimensions.allDimensions.length > 0);
    for (const cand of packet.dimensions.allDimensions) {
      const raw = rawDims[cand.dimension];
      assert.ok(raw, `no raw evaluation for ${cand.dimension}`);
      assert.deepEqual(cand.evaluation, raw, `evaluation for ${cand.dimension} was altered`);
      assert.ok(
        typeof cand.evaluation.confidence === "string" &&
          typeof cand.evaluation.is_mixed === "boolean" &&
          typeof cand.evaluation.is_abstaining === "boolean" &&
          Array.isArray(cand.evaluation.contributing_sources),
      );
    }
  });

  it("4. all 4 Layered Identity buckets receive candidates", () => {
    const { packet } = buildFixturePacket("known_time");
    const { firstImpression, knownSelf, closePrivateSelf, naturalSelfAndDeepNeeds } =
      packet.layeredIdentityCandidates;
    assert.ok(firstImpression.length > 0, "firstImpression empty");
    assert.ok(knownSelf.length > 0, "knownSelf empty");
    assert.ok(closePrivateSelf.length > 0, "closePrivateSelf empty");
    assert.ok(naturalSelfAndDeepNeeds.length > 0, "naturalSelfAndDeepNeeds empty");
  });

  it("5. month pillar evidence lands in firstImpression, day pillar evidence lands in closePrivateSelf", () => {
    const { chart, packet } = buildFixturePacket("known_time");
    const month = chart.pillars.find((p) => p.slot === "month");
    const day = chart.pillars.find((p) => p.slot === "day");

    const firstImpressionPaths = packet.layeredIdentityCandidates.firstImpression
      .filter((i) => i.kind === "evidence")
      .map((i) => i.fact_path);
    assert.ok(firstImpressionPaths.includes("pillars.month.stem_ten_god"));
    const monthItem = packet.layeredIdentityCandidates.firstImpression.find(
      (i) => i.kind === "evidence" && i.fact_path === "pillars.month.stem_ten_god",
    );
    assert.deepEqual(monthItem.codes, [month.stem_ten_god.code]);

    const closePrivatePaths = packet.layeredIdentityCandidates.closePrivateSelf
      .filter((i) => i.kind === "evidence")
      .map((i) => i.fact_path);
    assert.ok(closePrivatePaths.includes("pillars.day.branch"));
    const dayItem = packet.layeredIdentityCandidates.closePrivateSelf.find(
      (i) => i.kind === "evidence" && i.fact_path === "pillars.day.branch",
    );
    assert.deepEqual(dayItem.codes, [day.branch.code]);

    // and month pillar evidence must NOT leak into closePrivateSelf, day pillar must NOT leak into firstImpression
    assert.ok(!closePrivatePaths.includes("pillars.month.stem_ten_god"));
    assert.ok(!firstImpressionPaths.includes("pillars.day.branch"));
  });

  it("6. growth/cautions CE packets flow into growthCandidates without re-grouping", () => {
    const { personalContext, packet } = buildFixturePacket("known_time");
    const expectedGrowthPaths = personalContext.groups.growth.map((p) => p.fact_path).sort();
    const expectedCautionPaths = personalContext.groups.cautions.map((p) => p.fact_path).sort();
    const actualGrowthPaths = packet.growthCandidates.growthEvidence.map((e) => e.fact_path).sort();
    const actualCautionPaths = packet.growthCandidates.cautionEvidence.map((e) => e.fact_path).sort();
    assert.deepEqual(actualGrowthPaths, expectedGrowthPaths);
    assert.deepEqual(actualCautionPaths, expectedCautionPaths);
    // axisEvidence carries the full unfiltered 6-axis comparison, not a pre-picked "growth edge"
    assert.equal(packet.growthCandidates.axisEvidence.length, 6);
  });

  it("7. no evidence or dimension item carries a synthesized conclusion field", () => {
    const { packet } = buildFixturePacket("known_time");
    const forbiddenKeys = ["conclusion", "narrative", "label", "meaning", "summary_text"];
    const allBuckets = [
      ...packet.innate.identityFacts,
      ...packet.innate.elementEvidence,
      ...packet.innate.tenGodEvidence,
      ...packet.innate.strengthEvidence,
      ...packet.innate.climateEvidence,
      ...packet.innate.pillarEvidence,
      ...packet.innate.relationEvidence,
      ...packet.innate.optionalSignals,
      ...packet.layeredIdentityCandidates.firstImpression,
      ...packet.layeredIdentityCandidates.knownSelf,
      ...packet.layeredIdentityCandidates.closePrivateSelf,
      ...packet.layeredIdentityCandidates.naturalSelfAndDeepNeeds,
    ];
    for (const item of allBuckets) {
      for (const forbidden of forbiddenKeys) {
        assert.ok(!(forbidden in item), `found forbidden conclusion-like key "${forbidden}" on ${JSON.stringify(item)}`);
      }
    }
  });

  it("8. every dimension_evaluations entry (incl. mixed/insufficient/abstained) survives into dimensions.allDimensions", () => {
    const { personalContext, packet } = buildFixturePacket("unknown_time");
    const rawDims = personalContext.aggregates.relational_profile?.dimension_evaluations ?? {};
    const rawKeys = Object.keys(rawDims).sort();
    const packetKeys = packet.dimensions.allDimensions.map((c) => c.dimension).sort();
    assert.deepEqual(packetKeys, rawKeys, "dimensions.allDimensions must include every dimension the CE evaluated, regardless of status");
  });

  it("9. no duplicate fact_path within a single evidence bucket", () => {
    const { packet } = buildFixturePacket("known_time");
    const buckets = [
      packet.innate.identityFacts,
      packet.innate.elementEvidence,
      packet.innate.tenGodEvidence,
      packet.innate.strengthEvidence,
      packet.innate.climateEvidence,
      packet.innate.pillarEvidence,
      packet.innate.relationEvidence,
      packet.innate.optionalSignals,
      packet.growthCandidates.growthEvidence,
      packet.growthCandidates.cautionEvidence,
    ];
    for (const bucket of buckets) {
      const paths = bucket.map((e) => e.fact_path);
      assert.equal(new Set(paths).size, paths.length, `duplicate fact_path found in bucket: ${JSON.stringify(paths)}`);
    }
  });

  it("does not fabricate confidence for facts with no native confidence (day_master, pillars, relations_intra)", () => {
    const { packet } = buildFixturePacket("known_time");
    for (const item of packet.innate.identityFacts) {
      assert.equal(item.confidence, undefined);
    }
    for (const item of packet.innate.relationEvidence) {
      assert.equal(item.confidence, undefined);
    }
  });

  it("carries native confidence through unmodified for facts that do have one (five_elements)", () => {
    const { chart, packet } = buildFixturePacket("known_time");
    const elementItem = packet.innate.elementEvidence.find((e) => e.fact_path === "five_elements");
    assert.equal(elementItem.confidence, chart.five_elements.confidence);
  });
});
