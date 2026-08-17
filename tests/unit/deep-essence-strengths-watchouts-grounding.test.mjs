/**
 * Batch 6 — Strengths/Watchouts grounding via the Part01 Identity Evidence
 * Packet, reusing the Batch 3/4 formatter/wiring pattern. Unlike the 4
 * Layered Identity layers, strengths and watchouts intentionally share ONE
 * evidence block/known-key set so the LLM can notice a trait's positive/
 * shadow duality without being forced into 1:1 pairing.
 * Run: npx tsx --test tests/unit/deep-essence-strengths-watchouts-grounding.test.mjs
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  runPersonalContextEngine,
  buildPersonalCeFixtureChart,
} from "../../lib/personCore/personalContextEngine/index.ts";
import { buildPart01IdentityEvidencePacket } from "../../lib/v1/slim/part01IdentityEvidence.ts";
import {
  formatPart01EvidenceForPrompt,
  filterKnownEvidenceRefs,
} from "../../lib/report/formatPart01EvidenceForPrompt.ts";
import { buildDeepEssenceStructuredPartAUserPrompt } from "../../lib/prompts/deepEssenceStructured.ts";
import { coerceDeepEssencePartA } from "../../lib/report/coerceDeepEssenceStructured.ts";
import { isDeepEssencePartA } from "../../lib/report/deepEssenceStructuredSchema.ts";

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
  return buildPart01IdentityEvidencePacket({
    chart,
    personalContext,
    currentPrimary: CURRENT_PRIMARY,
    currentSecondary: CURRENT_SECONDARY,
    innatePrimary: INNATE_PRIMARY,
  });
}

const floor = {
  autonomy: 40,
  connection: 50,
  stability: 45,
  growth: 55,
  structure: 35,
  adaptability: 60,
};

const BASE_PROMPT_INPUT = {
  surveyAnalysis: "survey text",
  essenceAnalysisSummary: "essence text",
  birthEnergyContext: "birth energy text",
  currentAxisScores: CURRENT_PRIMARY,
  locale: "en-US",
};

function groundedEvidenceInput(promptEvidence) {
  return {
    coreModeText: promptEvidence.coreModeText,
    growthEdgeText: promptEvidence.growthEdgeText,
    layeredIdentity: {
      firstImpressionText: promptEvidence.layeredIdentity.firstImpression.text,
      knownSelfText: promptEvidence.layeredIdentity.knownSelf.text,
      closePrivateSelfText: promptEvidence.layeredIdentity.closePrivateSelf.text,
      naturalSelfAndDeepNeedsText: promptEvidence.layeredIdentity.naturalSelfAndDeepNeeds.text,
    },
    strengthsWatchoutsText: promptEvidence.strengthsWatchoutsText,
    axisInterpretation: {
      innateEvidenceText: promptEvidence.axisInterpretation.innateEvidenceText,
      gaps: promptEvidence.axisInterpretation.gaps.map((g) => ({
        axis: g.axis,
        subjectText: g.subjectText,
        currentText: g.currentText,
      })),
      alignment: promptEvidence.axisInterpretation.alignment
        ? {
            axis: promptEvidence.axisInterpretation.alignment.axis,
            subjectText: promptEvidence.axisInterpretation.alignment.subjectText,
            currentText: promptEvidence.axisInterpretation.alignment.currentText,
          }
        : null,
    },
  };
}

describe("formatPart01EvidenceForPrompt — strengthsWatchouts", () => {
  it("builds a non-empty shared evidence text + known-key set", () => {
    const packet = buildFixturePacket("known_time");
    const result = formatPart01EvidenceForPrompt(packet);
    assert.ok(result.strengthsWatchoutsText.length > 0);
    assert.ok(result.strengthsWatchoutsKnownKeys.size > 0);
  });

  it("includes all 6 Current x Innate axes (both alignment and gap are usable here, unlike Growth Edge)", () => {
    const packet = buildFixturePacket("known_time");
    const result = formatPart01EvidenceForPrompt(packet);
    const axisKeys = [...result.strengthsWatchoutsKnownKeys].filter((k) => k.startsWith("axis:"));
    assert.equal(axisKeys.length, 6);
  });

  it("does not dump any CE dimension_evaluations key (no dimension: keys at all)", () => {
    const packet = buildFixturePacket("known_time");
    const result = formatPart01EvidenceForPrompt(packet);
    const dimKeys = [...result.strengthsWatchoutsKnownKeys].filter((k) => k.startsWith("dimension:"));
    assert.equal(dimKeys.length, 0);
  });

  it("fact-level keys come only from identity/element facts + CE strengths/growth/cautions groups", () => {
    const packet = buildFixturePacket("known_time");
    const result = formatPart01EvidenceForPrompt(packet);
    const allowedPaths = new Set([
      ...packet.innate.identityFacts.map((e) => e.fact_path),
      ...packet.innate.elementEvidence.map((e) => e.fact_path),
      ...packet.innate.ceStrengthSignals.map((e) => e.fact_path),
      ...packet.growthCandidates.growthEvidence.map((e) => e.fact_path),
      ...packet.growthCandidates.cautionEvidence.map((e) => e.fact_path),
    ]);
    const seenPaths = [...result.strengthsWatchoutsKnownKeys].filter((k) => !k.startsWith("axis:"));
    for (const p of seenPaths) {
      assert.ok(allowedPaths.has(p), `unexpected fact_path leaked into Strengths/Watchouts evidence: ${p}`);
    }
  });
});

describe("buildDeepEssenceStructuredPartAUserPrompt — Batch 6 additive contract", () => {
  it("omitted part01Evidence still reproduces the exact pre-Batch-6 prompt", () => {
    const withoutField = buildDeepEssenceStructuredPartAUserPrompt(BASE_PROMPT_INPUT);
    assert.ok(!withoutField.includes("Strengths & Watchouts evidence"));
    assert.ok(!withoutField.includes('"evidence_refs"'));
  });

  it("a provided packet injects the Strengths/Watchouts evidence block + schema field additively, existing title/body unchanged", () => {
    const packet = buildFixturePacket("known_time");
    const promptEvidence = formatPart01EvidenceForPrompt(packet);
    const grounded = buildDeepEssenceStructuredPartAUserPrompt({
      ...BASE_PROMPT_INPUT,
      part01Evidence: groundedEvidenceInput(promptEvidence),
    });
    assert.ok(grounded.includes("[Strengths & Watchouts evidence]"));
    assert.ok(grounded.includes('natural capability in action'));
    assert.ok(grounded.includes('strength/adaptation overuse pattern'));
    assert.ok(grounded.includes('"body": "5-7 sentences with concrete situations and grounds'));
    assert.ok(grounded.includes('"body": "4-6 sentences'));
    // schema is still valid JSON once the template placeholders are filled in
    const schemaBlock = grounded.slice(
      grounded.indexOf("JSON schema:") + "JSON schema:".length,
      grounded.indexOf("Respond with exactly one JSON object"),
    );
    assert.doesNotThrow(() => JSON.parse(schemaBlock.trim()));
    const schema = JSON.parse(schemaBlock.trim());
    assert.equal(schema.strengths.length, 3);
    assert.equal(schema.watchouts.length, 3);
    assert.ok("evidence_refs" in schema.strengths[0]);
    assert.ok("evidence_refs" in schema.watchouts[0]);
  });
});

describe("filterKnownEvidenceRefs — shared strengths/watchouts known-key set allows cross-reuse", () => {
  it("the same key can validly ground both a strengths item and a watchouts item (no forced pairing, no isolation)", () => {
    const knownKeys = new Set(["day_master", "axis:autonomy"]);
    const strengthRefs = filterKnownEvidenceRefs(["day_master"], knownKeys);
    const watchoutRefs = filterKnownEvidenceRefs(["day_master", "axis:autonomy"], knownKeys);
    assert.deepEqual(strengthRefs, ["day_master"]);
    assert.deepEqual(watchoutRefs, ["day_master", "axis:autonomy"]);
  });

  it("an invented key is dropped from either side", () => {
    const knownKeys = new Set(["day_master"]);
    assert.equal(filterKnownEvidenceRefs(["invented"], knownKeys), undefined);
  });
});

describe("coerceDeepEssencePartA — Batch 6 strengths/watchouts evidence_refs", () => {
  it("passes through per-item evidence_refs only when present, filtering non-string entries", () => {
    const { value } = coerceDeepEssencePartA(
      {
        summary: { core_mode: "X" },
        strengths: [
          { title: "A", body: "body a", evidence_refs: ["day_master", 5, "axis:autonomy"] },
          { title: "B", body: "body b" },
          { title: "C", body: "body c" },
        ],
        watchouts: [
          { title: "D", body: "body d" },
          { title: "E", body: "body e", evidence_refs: ["axis:autonomy"] },
          { title: "F", body: "body f" },
        ],
      },
      floor,
    );
    assert.deepEqual(value.strengths[0].evidence_refs, ["day_master", "axis:autonomy"]);
    assert.ok(!("evidence_refs" in value.strengths[1]));
    assert.ok(!("evidence_refs" in value.watchouts[0]));
    assert.deepEqual(value.watchouts[1].evidence_refs, ["axis:autonomy"]);
  });

  it("stays fully valid Part A / unchanged title+body shape when no evidence_refs present (backward compatible)", () => {
    const { value } = coerceDeepEssencePartA(
      { summary: { core_mode: "X" }, strengths: [{ title: "A", body: "b" }] },
      floor,
    );
    assert.equal(value.strengths.length, 3);
    for (const s of value.strengths) {
      assert.ok(!("evidence_refs" in s));
      assert.ok(typeof s.title === "string");
      assert.ok(typeof s.body === "string");
    }
    assert.equal(isDeepEssencePartA(value), true);
  });
});
