/**
 * Batch 3 — Core Mode / Growth Edge grounding via the Part01 Identity
 * Evidence Packet (Batch 2). Prompt-contract / string-assertion level only —
 * no live LLM calls.
 * Run: npx tsx --test tests/unit/deep-essence-part01-grounding.test.mjs
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
import {
  coerceDeepEssencePartA,
  coerceDeepEssencePartB,
} from "../../lib/report/coerceDeepEssenceStructured.ts";
import {
  isDeepEssencePartA,
  isDeepEssenceStructuredReport,
} from "../../lib/report/deepEssenceStructuredSchema.ts";

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

const BASE_PROMPT_INPUT = {
  surveyAnalysis: "survey text",
  essenceAnalysisSummary: "essence text",
  birthEnergyContext: "birth energy text",
  currentAxisScores: CURRENT_PRIMARY,
  locale: "en-US",
};

describe("formatPart01EvidenceForPrompt", () => {
  it("returns null for a null/undefined packet (backward-compat fallback)", () => {
    assert.equal(formatPart01EvidenceForPrompt(null), null);
    assert.equal(formatPart01EvidenceForPrompt(undefined), null);
  });

  it("builds non-empty Core Mode / Growth Edge text + known-key sets from a real packet", () => {
    const packet = buildFixturePacket("known_time");
    const result = formatPart01EvidenceForPrompt(packet);
    assert.ok(result);
    assert.ok(result.coreModeText.length > 0);
    assert.ok(result.growthEdgeText.length > 0);
    assert.ok(result.coreModeKnownKeys.size > 0);
    assert.ok(result.growthEdgeKnownKeys.size > 0);
  });

  it("does not dump all 12 CE dimensions — Core Mode dimension keys are a subset of firstImpression/knownSelf only", () => {
    const packet = buildFixturePacket("known_time");
    const result = formatPart01EvidenceForPrompt(packet);

    const allowedDims = new Set(
      [...packet.layeredIdentityCandidates.firstImpression, ...packet.layeredIdentityCandidates.knownSelf]
        .filter((i) => i.kind === "dimension")
        .map((i) => `dimension:${i.dimension}`),
    );
    const seenDims = [...result.coreModeKnownKeys].filter((k) => k.startsWith("dimension:"));
    for (const k of seenDims) {
      assert.ok(allowedDims.has(k), `unexpected dimension key leaked into Core Mode evidence: ${k}`);
    }
    // and strictly fewer than all 12 CE dimensions
    assert.ok(seenDims.length < packet.dimensions.allDimensions.length);
  });

  it("Growth Edge dimension keys come only from growthCandidates.relevantDimensions, not all 12", () => {
    const packet = buildFixturePacket("known_time");
    const result = formatPart01EvidenceForPrompt(packet);

    const allowedDims = new Set(
      packet.growthCandidates.relevantDimensions.map((c) => `dimension:${c.dimension}`),
    );
    const seenDims = [...result.growthEdgeKnownKeys].filter((k) => k.startsWith("dimension:"));
    for (const k of seenDims) {
      assert.ok(allowedDims.has(k), `unexpected dimension key leaked into Growth Edge evidence: ${k}`);
    }
    assert.ok(seenDims.length <= packet.growthCandidates.relevantDimensions.length);
    assert.ok(seenDims.length < packet.dimensions.allDimensions.length);
  });

  it("Growth Edge evidence includes all 6 Current x Innate axes (gap alone must not pre-filter the axis set)", () => {
    const packet = buildFixturePacket("known_time");
    const result = formatPart01EvidenceForPrompt(packet);
    const axisKeys = [...result.growthEdgeKnownKeys].filter((k) => k.startsWith("axis:"));
    assert.equal(axisKeys.length, 6);
  });

  it("Growth Edge fact-level evidence comes only from growthCandidates.growthEvidence/cautionEvidence, not other buckets", () => {
    const packet = buildFixturePacket("known_time");
    const result = formatPart01EvidenceForPrompt(packet);
    const allowedPaths = new Set([
      ...packet.growthCandidates.growthEvidence.map((e) => e.fact_path),
      ...packet.growthCandidates.cautionEvidence.map((e) => e.fact_path),
    ]);
    const seenPaths = [...result.growthEdgeKnownKeys].filter(
      (k) => !k.startsWith("dimension:") && !k.startsWith("axis:"),
    );
    for (const p of seenPaths) {
      assert.ok(allowedPaths.has(p), `unexpected fact_path leaked into Growth Edge evidence: ${p}`);
    }
  });
});

describe("filterKnownEvidenceRefs", () => {
  const knownKeys = new Set(["day_master", "axis:autonomy", "dimension:decision_pace"]);

  it("keeps only keys present in the known-key set, in order", () => {
    const filtered = filterKnownEvidenceRefs(
      ["day_master", "invented_key", "axis:autonomy"],
      knownKeys,
    );
    assert.deepEqual(filtered, ["day_master", "axis:autonomy"]);
  });

  it("returns undefined when nothing survives filtering (never an empty array)", () => {
    assert.equal(filterKnownEvidenceRefs(["invented_a", "invented_b"], knownKeys), undefined);
  });

  it("returns undefined for non-array input or an empty/missing known-key set", () => {
    assert.equal(filterKnownEvidenceRefs("not-an-array", knownKeys), undefined);
    assert.equal(filterKnownEvidenceRefs(["day_master"], undefined), undefined);
    assert.equal(filterKnownEvidenceRefs(["day_master"], new Set()), undefined);
  });
});

describe("buildDeepEssenceStructuredPartAUserPrompt — Batch 3 additive contract", () => {
  it("omitted part01Evidence reproduces the exact pre-Batch-3 prompt", () => {
    const withoutField = buildDeepEssenceStructuredPartAUserPrompt(BASE_PROMPT_INPUT);
    const withNull = buildDeepEssenceStructuredPartAUserPrompt({
      ...BASE_PROMPT_INPUT,
      part01Evidence: null,
    });
    assert.equal(withoutField, withNull);
    assert.ok(!withoutField.includes("Part01 Identity Evidence"));
    assert.ok(!withoutField.includes("core_mode_evidence_refs"));
    assert.ok(!withoutField.includes("growth_edge_evidence_refs"));
  });

  it("a provided packet injects the grounding block additively without altering the rest of the prompt", () => {
    const withoutField = buildDeepEssenceStructuredPartAUserPrompt(BASE_PROMPT_INPUT);
    const grounded = buildDeepEssenceStructuredPartAUserPrompt({
      ...BASE_PROMPT_INPUT,
      part01Evidence: {
        coreModeText: "- [day_master] codes=갑,자,wood,yang",
        growthEdgeText: "- [axis:autonomy] current=70 innate=40 delta=30 direction=up magnitude=wide",
      },
    });
    assert.ok(grounded.includes("[Core Mode evidence]"));
    assert.ok(grounded.includes("[Growth Edge evidence]"));
    assert.ok(grounded.includes("day_master"));
    assert.ok(grounded.includes("core_mode_evidence_refs"));
    assert.ok(grounded.includes("growth_edge_evidence_refs"));
    assert.ok(grounded.includes("growth_edge_why"));
    // untouched sections still present verbatim
    assert.ok(grounded.includes(BASE_PROMPT_INPUT.surveyAnalysis));
    assert.ok(grounded.includes(BASE_PROMPT_INPUT.essenceAnalysisSummary));
    assert.ok(grounded.includes("energy.balance_pct must equal bars[1].value"));
    assert.notEqual(grounded, withoutField);
  });
});

describe("coerceDeepEssencePartA — Batch 3 optional provenance fields", () => {
  const floor = {
    autonomy: 40,
    connection: 50,
    stability: 45,
    growth: 55,
    structure: 35,
    adaptability: 60,
  };

  it("passes provenance fields through only when the LLM actually returned them", () => {
    const { value } = coerceDeepEssencePartA(
      {
        summary: {
          core_mode: "Deep water",
          growth_edge: "Decisiveness",
          core_mode_evidence_refs: ["day_master", 42, "axis:autonomy"],
          growth_edge_why: "  because reasons  ",
        },
      },
      floor,
    );
    assert.deepEqual(value.summary.core_mode_evidence_refs, ["day_master", "axis:autonomy"]);
    assert.equal(value.summary.growth_edge_why, "because reasons");
    assert.ok(!("growth_edge_evidence_refs" in value.summary));
    assert.ok(!("growth_edge_real_life_pattern" in value.summary));
  });

  it("stays fully valid Part A when no provenance fields are present (backward compatibility)", () => {
    const { value } = coerceDeepEssencePartA({ summary: { core_mode: "X" } }, floor);
    assert.ok(!("core_mode_evidence_refs" in value.summary));
    assert.equal(isDeepEssencePartA(value), true);
  });
});

describe("Deep Essence schema — Batch 3 fields stay optional (no regression)", () => {
  it("isDeepEssenceStructuredReport still accepts a report with none of the new fields", () => {
    const floor = {
      autonomy: 40,
      connection: 50,
      stability: 45,
      growth: 55,
      structure: 35,
      adaptability: 60,
    };
    const a = coerceDeepEssencePartA({ summary: { core_mode: "X" } }, floor).value;
    const b = coerceDeepEssencePartB({}).value;
    assert.equal(
      isDeepEssenceStructuredReport({
        ...a,
        strengths: [
          { title: "t", body: "b" },
          { title: "t", body: "b" },
          { title: "t", body: "b" },
        ],
        watchouts: [
          { title: "t", body: "b" },
          { title: "t", body: "b" },
          { title: "t", body: "b" },
        ],
        energy: {
          headline: "h",
          balance_pct: 50,
          bars: [
            { label: "a", value: 1, tone: "highlight" },
            { label: "b", value: 2, tone: "accent" },
            { label: "c", value: 3, tone: "ink" },
          ],
          summary: "s",
          fuels: ["a", "b", "c"],
          drains: ["a", "b", "c"],
          optimal: ["a", "b"],
        },
        ...b,
      }),
      true,
    );
  });
});
