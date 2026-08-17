/**
 * Batch 4 — Layered Identity (4-layer) grounding via the Part01 Identity
 * Evidence Packet buckets (Batch 2's layeredIdentityCandidates). Reuses
 * Batch 3's formatter/wiring pattern. Prompt-contract / string-assertion
 * level only — no live LLM calls.
 * Run: npx tsx --test tests/unit/deep-essence-layered-identity.test.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";
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

const LAYER_NAMES = ["firstImpression", "knownSelf", "closePrivateSelf", "naturalSelfAndDeepNeeds"];

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

describe("formatPart01EvidenceForPrompt — layeredIdentity", () => {
  it("builds one text + known-key set per layer, each independent of the others", () => {
    const packet = buildFixturePacket("known_time");
    const result = formatPart01EvidenceForPrompt(packet);
    assert.ok(result.layeredIdentity);
    for (const layer of LAYER_NAMES) {
      assert.ok(typeof result.layeredIdentity[layer].text === "string");
      assert.ok(result.layeredIdentity[layer].knownKeys instanceof Set);
    }
  });

  it("each layer's known keys are a subset of that layer's own candidate bucket only (no cross-layer bleed)", () => {
    const packet = buildFixturePacket("known_time");
    const result = formatPart01EvidenceForPrompt(packet);

    for (const layer of LAYER_NAMES) {
      const bucket = packet.layeredIdentityCandidates[layer];
      const allowedKeys = new Set(
        bucket.map((i) => (i.kind === "evidence" ? i.fact_path : `dimension:${i.dimension}`)),
      );
      for (const k of result.layeredIdentity[layer].knownKeys) {
        assert.ok(allowedKeys.has(k), `layer ${layer} claimed a key outside its own bucket: ${k}`);
      }
    }
  });

  it("firstImpression and closePrivateSelf never share keys sourced from the other's pillar-specific evidence", () => {
    const packet = buildFixturePacket("known_time");
    const result = formatPart01EvidenceForPrompt(packet);
    const fiKeys = result.layeredIdentity.firstImpression.knownKeys;
    const cpsKeys = result.layeredIdentity.closePrivateSelf.knownKeys;
    // month-pillar-only fact paths must not appear in closePrivateSelf, and vice versa for day-pillar-only
    for (const k of fiKeys) {
      if (k.startsWith("pillars.month.")) assert.ok(!cpsKeys.has(k));
    }
    for (const k of cpsKeys) {
      if (k.startsWith("pillars.day.")) assert.ok(!fiKeys.has(k));
    }
  });

  it("does not dump all 12 CE dimensions across the 4 layers combined", () => {
    const packet = buildFixturePacket("known_time");
    const result = formatPart01EvidenceForPrompt(packet);
    const allDimKeysUsed = new Set();
    for (const layer of LAYER_NAMES) {
      for (const k of result.layeredIdentity[layer].knownKeys) {
        if (k.startsWith("dimension:")) allDimKeysUsed.add(k);
      }
    }
    assert.ok(allDimKeysUsed.size < packet.dimensions.allDimensions.length);
  });
});

describe("buildDeepEssenceStructuredPartAUserPrompt — Batch 4 additive contract", () => {
  it("omitted part01Evidence still reproduces the exact pre-Batch-3/4 prompt", () => {
    const withoutField = buildDeepEssenceStructuredPartAUserPrompt(BASE_PROMPT_INPUT);
    assert.ok(!withoutField.includes("layered_identity"));
    assert.ok(!withoutField.includes("First Impression evidence"));
  });

  it("a provided packet injects all 4 layer evidence blocks + schema field additively", () => {
    const packet = buildFixturePacket("known_time");
    const promptEvidence = formatPart01EvidenceForPrompt(packet);
    const grounded = buildDeepEssenceStructuredPartAUserPrompt({
      ...BASE_PROMPT_INPUT,
      part01Evidence: groundedEvidenceInput(promptEvidence),
    });
    assert.ok(grounded.includes("[First Impression evidence]"));
    assert.ok(grounded.includes("[Known Self evidence]"));
    assert.ok(grounded.includes("[Close Private Self evidence]"));
    assert.ok(grounded.includes("[Natural Self & Deep Needs evidence]"));
    assert.ok(grounded.includes('"layered_identity"'));
    assert.ok(grounded.includes('"first_impression"'));
    assert.ok(grounded.includes('"known_self"'));
    assert.ok(grounded.includes('"close_private_self"'));
    assert.ok(grounded.includes('"natural_self_and_deep_needs"'));
    // schema is still valid JSON once the template placeholders are filled in
    const schemaBlock = grounded.slice(grounded.indexOf("JSON schema:") + "JSON schema:".length, grounded.indexOf("Respond with exactly one JSON object"));
    assert.doesNotThrow(() => JSON.parse(schemaBlock.trim()));
    // untouched sections still present
    assert.ok(grounded.includes(BASE_PROMPT_INPUT.surveyAnalysis));
    assert.ok(grounded.includes("energy.balance_pct must equal bars[1].value"));
  });
});

describe("coerceDeepEssencePartA — Batch 4 layered_identity", () => {
  it("omits a layer entirely when its narrative is missing (never fabricated/padded)", () => {
    const { value } = coerceDeepEssencePartA(
      {
        summary: { core_mode: "X" },
        layered_identity: {
          first_impression: { title: "Warm", narrative: "You come across as warm and open." },
          known_self: { narrative: "" },
        },
      },
      floor,
    );
    assert.ok(value.layered_identity.first_impression);
    assert.equal(value.layered_identity.first_impression.title, "Warm");
    assert.ok(!("known_self" in value.layered_identity));
    assert.ok(!("close_private_self" in value.layered_identity));
    assert.ok(!("natural_self_and_deep_needs" in value.layered_identity));
  });

  it("omits layered_identity entirely when no layer has a usable narrative (backward compatible)", () => {
    const { value } = coerceDeepEssencePartA({ summary: { core_mode: "X" } }, floor);
    assert.ok(!("layered_identity" in value));
    assert.equal(isDeepEssencePartA(value), true);
  });

  it("passes through per-layer evidence_refs only when present, filtering non-string entries", () => {
    const { value } = coerceDeepEssencePartA(
      {
        summary: { core_mode: "X" },
        layered_identity: {
          first_impression: {
            narrative: "narrative text",
            evidence_refs: ["day_master", 7, "pillars.month.stem_ten_god"],
          },
        },
      },
      floor,
    );
    assert.deepEqual(value.layered_identity.first_impression.evidence_refs, [
      "day_master",
      "pillars.month.stem_ten_god",
    ]);
  });

  it("still passes full Part A schema validation with layered_identity present", () => {
    const { value } = coerceDeepEssencePartA(
      {
        summary: { core_mode: "X" },
        layered_identity: {
          first_impression: { narrative: "n" },
          known_self: { narrative: "n" },
          close_private_self: { narrative: "n" },
          natural_self_and_deep_needs: { narrative: "n" },
        },
      },
      floor,
    );
    assert.equal(isDeepEssencePartA(value), true);
  });
});

/**
 * IA Batch 2 — layer-to-layer synthesis (layered_identity.synthesis).
 *
 * Root design constraint under test: synthesis is a statement about the
 * CHANGE between layers, so it needs >= 2 populated layers to mean anything.
 * The server enforces this in coerceDeepEssencePartA regardless of what the
 * LLM returns — Cases A-E below are the exhaustive 4/3/2/1/0-layer matrix
 * the task specified, proving the server-side guard (not just the prompt
 * instruction) actually holds the line.
 */
function withSynthesis(layers, synthesisNarrative = "The shift narrative.") {
  return {
    summary: { core_mode: "X" },
    layered_identity: {
      ...layers,
      synthesis: { narrative: synthesisNarrative },
    },
  };
}

const FOUR_LAYERS = {
  first_impression: { narrative: "n1" },
  known_self: { narrative: "n2" },
  close_private_self: { narrative: "n3" },
  natural_self_and_deep_needs: { narrative: "n4" },
};

describe("coerceDeepEssencePartA — IA Batch 2 layered_identity.synthesis", () => {
  it("Case A (4 layers): synthesis is kept", () => {
    const { value } = coerceDeepEssencePartA(withSynthesis(FOUR_LAYERS), floor);
    assert.equal(value.layered_identity.synthesis.narrative, "The shift narrative.");
  });

  it("Case B (3 layers): synthesis is kept", () => {
    const { first_impression, known_self, close_private_self } = FOUR_LAYERS;
    const { value } = coerceDeepEssencePartA(
      withSynthesis({ first_impression, known_self, close_private_self }),
      floor,
    );
    assert.equal(value.layered_identity.synthesis.narrative, "The shift narrative.");
  });

  it("Case C (2 layers): synthesis is kept", () => {
    const { first_impression, known_self } = FOUR_LAYERS;
    const { value } = coerceDeepEssencePartA(
      withSynthesis({ first_impression, known_self }),
      floor,
    );
    assert.equal(value.layered_identity.synthesis.narrative, "The shift narrative.");
  });

  it("Case D (1 layer): synthesis is dropped even though the LLM returned one (server-enforced minimum, not prompt-trusted)", () => {
    const { first_impression } = FOUR_LAYERS;
    const { value } = coerceDeepEssencePartA(withSynthesis({ first_impression }), floor);
    assert.ok(!("synthesis" in value.layered_identity));
    assert.ok(value.layered_identity.first_impression);
  });

  it("Case E (0 layers): synthesis is dropped and layered_identity is absent entirely (existing Batch 1 conditional behavior preserved)", () => {
    const { value } = coerceDeepEssencePartA(
      { summary: { core_mode: "X" }, layered_identity: { synthesis: { narrative: "orphan" } } },
      floor,
    );
    assert.ok(!("layered_identity" in value));
    assert.equal(isDeepEssencePartA(value), true);
  });

  it("a synthesis with no narrative is dropped regardless of layer count (shape validation, same rule as a layer)", () => {
    const { value } = coerceDeepEssencePartA(
      {
        summary: { core_mode: "X" },
        layered_identity: { ...FOUR_LAYERS, synthesis: { narrative: "" } },
      },
      floor,
    );
    assert.ok(!("synthesis" in value.layered_identity));
  });

  it("passes through synthesis evidence_refs only when present, filtering non-string entries (same rule as a layer)", () => {
    const { value } = coerceDeepEssencePartA(
      {
        summary: { core_mode: "X" },
        layered_identity: {
          ...FOUR_LAYERS,
          synthesis: { narrative: "shift", evidence_refs: ["day_master", 7, "pillars.month.stem_ten_god"] },
        },
      },
      floor,
    );
    assert.deepEqual(value.layered_identity.synthesis.evidence_refs, [
      "day_master",
      "pillars.month.stem_ten_god",
    ]);
  });

  it("still passes full Part A schema validation with synthesis present (schema itself never required synthesis)", () => {
    const { value } = coerceDeepEssencePartA(withSynthesis(FOUR_LAYERS), floor);
    assert.equal(isDeepEssencePartA(value), true);
  });
});

describe("formatPart01EvidenceForPrompt — IA Batch 2 synthesisKnownKeys", () => {
  it("synthesisKnownKeys is the union of all four layers' own known keys", () => {
    const packet = buildFixturePacket("known_time");
    const result = formatPart01EvidenceForPrompt(packet);
    const expectedUnion = new Set([
      ...result.layeredIdentity.firstImpression.knownKeys,
      ...result.layeredIdentity.knownSelf.knownKeys,
      ...result.layeredIdentity.closePrivateSelf.knownKeys,
      ...result.layeredIdentity.naturalSelfAndDeepNeeds.knownKeys,
    ]);
    assert.deepEqual(
      [...result.layeredIdentity.synthesisKnownKeys].sort(),
      [...expectedUnion].sort(),
    );
  });
});

describe("Case F — synthesis evidence_refs pass only through the known-key union (reused filterKnownEvidenceRefs mechanism, not reinvented)", () => {
  it("accepts a ref that belongs to any one of the four layers (not isolated to one, unlike a normal layer)", () => {
    const union = new Set(["pillars.month.stem_ten_god", "dimension:solitude_autonomy"]);
    const filtered = filterKnownEvidenceRefs(
      ["pillars.month.stem_ten_god", "dimension:solitude_autonomy"],
      union,
    );
    assert.deepEqual(filtered, ["pillars.month.stem_ten_god", "dimension:solitude_autonomy"]);
  });

  it("rejects an invented key not present in any layer's evidence", () => {
    const union = new Set(["pillars.month.stem_ten_god"]);
    const filtered = filterKnownEvidenceRefs(["pillars.month.stem_ten_god", "made_up_fact"], union);
    assert.deepEqual(filtered, ["pillars.month.stem_ten_god"]);
  });

  it("returns undefined (not an empty array) when nothing survives filtering", () => {
    const union = new Set(["pillars.month.stem_ten_god"]);
    const filtered = filterKnownEvidenceRefs(["made_up_fact"], union);
    assert.equal(filtered, undefined);
  });

  it("runDeepEssenceStructuredLlm.ts actually wires synthesis.evidence_refs through filterKnownEvidenceRefs against synthesisKnownKeys (source wiring, no OpenAI call needed)", () => {
    const src = fs.readFileSync("lib/report/runDeepEssenceStructuredLlm.ts", "utf8");
    assert.match(
      src,
      /filterKnownEvidenceRefs\(\s*synthesis\.evidence_refs,\s*promptEvidence\.layeredIdentity\.synthesisKnownKeys,?\s*\)/,
      "runDeepEssenceStructuredLlm.ts must filter synthesis.evidence_refs against the union known-key set",
    );
  });
});

describe("Case G — locale regression: synthesis schema/instructions are present in the prompt regardless of output locale", () => {
  it("ko-KR grounded prompt still includes the synthesis schema field and grounding rule", () => {
    const packet = buildFixturePacket("known_time");
    const promptEvidence = formatPart01EvidenceForPrompt(packet);
    const grounded = buildDeepEssenceStructuredPartAUserPrompt({
      ...BASE_PROMPT_INPUT,
      locale: "ko-KR",
      part01Evidence: groundedEvidenceInput(promptEvidence),
    });
    assert.ok(grounded.includes('"synthesis"'));
    assert.ok(grounded.includes("layered_identity.synthesis"));
  });

  it("en-US grounded prompt includes the same synthesis schema field and grounding rule", () => {
    const packet = buildFixturePacket("known_time");
    const promptEvidence = formatPart01EvidenceForPrompt(packet);
    const grounded = buildDeepEssenceStructuredPartAUserPrompt({
      ...BASE_PROMPT_INPUT,
      locale: "en-US",
      part01Evidence: groundedEvidenceInput(promptEvidence),
    });
    assert.ok(grounded.includes('"synthesis"'));
    assert.ok(grounded.includes("layered_identity.synthesis"));
    // schema is still valid JSON once the template placeholders are filled in
    const schemaBlock = grounded.slice(
      grounded.indexOf("JSON schema:") + "JSON schema:".length,
      grounded.indexOf("Respond with exactly one JSON object"),
    );
    assert.doesNotThrow(() => JSON.parse(schemaBlock.trim()));
  });

  it("omitted part01Evidence still reproduces the exact pre-synthesis prompt (no synthesis field leaks into the ungrounded path)", () => {
    const withoutField = buildDeepEssenceStructuredPartAUserPrompt(BASE_PROMPT_INPUT);
    assert.ok(!withoutField.includes('"synthesis"'));
    assert.ok(!withoutField.includes("layered_identity.synthesis"));
  });
});
