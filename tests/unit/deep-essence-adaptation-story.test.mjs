/**
 * IA Batch 3 — Adaptation Story (adaptation_story). The report's central
 * synthesis: layered_identity + axis_interpretations + energy, already
 * generated earlier in the SAME Part A response, combined into one WHY
 * narrative — no new evidence Lens, no new LLM call.
 * Run: npx tsx --test tests/unit/deep-essence-adaptation-story.test.mjs
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
  hasAdaptationStoryEvidence,
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
    energyText: promptEvidence.energyText,
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
    adaptationStoryEligible: promptEvidence.adaptationStoryEligible,
  };
}

const EMPTY_LAYER_BUCKETS = {
  firstImpression: [],
  knownSelf: [],
  closePrivateSelf: [],
  naturalSelfAndDeepNeeds: [],
};

/** Synthetic packet fragments — precise control over the gate's independent-family conditions, independent of any real fixture's actual chart data. */
function fakePacket({
  hasWideGap,
  hasSecondWideGap = false,
  hasEnergyDimensionSignal = false,
  populatedLayerBucketCount = 0,
}) {
  return {
    axisComparisons: [
      { axis: "autonomy", magnitude: hasWideGap ? "wide" : "neutral", delta: hasWideGap ? 30 : 2, direction: "current_higher" },
      { axis: "connection", magnitude: hasSecondWideGap ? "wide" : "neutral", delta: hasSecondWideGap ? 28 : 1, direction: "current_higher" },
      { axis: "stability", magnitude: "neutral", delta: 1, direction: "aligned" },
      { axis: "growth", magnitude: "neutral", delta: 1, direction: "aligned" },
      { axis: "structure", magnitude: "neutral", delta: 1, direction: "aligned" },
      { axis: "adaptability", magnitude: "neutral", delta: 1, direction: "aligned" },
    ],
    dimensions: {
      allDimensions: [
        // Deliberately NOT one of the energy-relevant keys — proves "any CE
        // dimension anywhere" is no longer sufficient on its own (Batch 2).
        { dimension: "expression_style", evaluation: { value: "x", confidence: "medium", is_mixed: false } },
        {
          dimension: "pressure_response",
          evaluation: { value: "x", confidence: hasEnergyDimensionSignal ? "medium" : "insufficient", is_mixed: false },
        },
      ],
    },
    layeredIdentityCandidates: {
      firstImpression: populatedLayerBucketCount >= 1 ? [{ kind: "evidence", fact_path: "day_master", codes: ["x"], evidence: [] }] : [],
      knownSelf: populatedLayerBucketCount >= 2 ? [{ kind: "evidence", fact_path: "day_master", codes: ["x"], evidence: [] }] : [],
      closePrivateSelf: populatedLayerBucketCount >= 3 ? [{ kind: "evidence", fact_path: "day_master", codes: ["x"], evidence: [] }] : [],
      naturalSelfAndDeepNeeds: populatedLayerBucketCount >= 4 ? [{ kind: "evidence", fact_path: "day_master", codes: ["x"], evidence: [] }] : [],
    },
  };
}

describe("hasAdaptationStoryEvidence — gap + independent-family convergence gate (Batch 2 strengthened)", () => {
  it("a wide gap axis + a usable energy-relevant CE dimension → eligible", () => {
    assert.equal(
      hasAdaptationStoryEvidence(fakePacket({ hasWideGap: true, hasEnergyDimensionSignal: true })),
      true,
    );
  });

  it("no gap at all → not eligible, even with a usable energy-relevant CE dimension", () => {
    assert.equal(
      hasAdaptationStoryEvidence(fakePacket({ hasWideGap: false, hasEnergyDimensionSignal: true })),
      false,
    );
  });

  it("a wide gap exists but the ONLY usable CE dimension is unrelated to energy → not eligible (the old 'any CE dimension' gate is gone)", () => {
    assert.equal(
      hasAdaptationStoryEvidence(fakePacket({ hasWideGap: true, hasEnergyDimensionSignal: false })),
      false,
    );
  });

  it("a wide gap + a second wide gap axis (no energy/layer signal) → eligible via the second-gap independent family", () => {
    assert.equal(
      hasAdaptationStoryEvidence(fakePacket({ hasWideGap: true, hasSecondWideGap: true, hasEnergyDimensionSignal: false })),
      true,
    );
  });

  it("a wide gap + only 1 populated layered-identity bucket (below the 2-bucket threshold) → not eligible via that family alone", () => {
    assert.equal(
      hasAdaptationStoryEvidence(fakePacket({ hasWideGap: true, hasEnergyDimensionSignal: false, populatedLayerBucketCount: 1 })),
      false,
    );
  });

  it("a wide gap + 2 populated layered-identity buckets → eligible via the layered-identity independent family", () => {
    assert.equal(
      hasAdaptationStoryEvidence(fakePacket({ hasWideGap: true, hasEnergyDimensionSignal: false, populatedLayerBucketCount: 2 })),
      true,
    );
  });

  it("a null/undefined packet is never eligible (matches the existing ungrounded-path convention)", () => {
    assert.equal(hasAdaptationStoryEvidence(null), false);
    assert.equal(hasAdaptationStoryEvidence(undefined), false);
  });

  it("sanity check against a real fixture packet: the gate returns a genuine boolean without throwing", () => {
    const packet = buildFixturePacket("known_time");
    const result = hasAdaptationStoryEvidence(packet);
    assert.equal(typeof result, "boolean");
  });
});

describe("formatPart01EvidenceForPrompt — adaptationStoryKnownKeys / adaptationStoryEligible", () => {
  it("adaptationStoryKnownKeys is a subset built only from axis interpretation + layered identity + energy known keys", () => {
    const packet = buildFixturePacket("known_time");
    const result = formatPart01EvidenceForPrompt(packet);
    const allowed = new Set([
      ...result.axisInterpretation.innateEvidenceKnownKeys,
      ...result.axisInterpretation.gaps.flatMap((g) => [...g.currentKnownKeys]),
      ...(result.axisInterpretation.alignment ? [...result.axisInterpretation.alignment.currentKnownKeys] : []),
      ...result.layeredIdentity.synthesisKnownKeys,
      ...result.energyKnownKeys,
    ]);
    for (const k of result.adaptationStoryKnownKeys) {
      assert.ok(allowed.has(k), `adaptationStoryKnownKeys claimed a key outside its declared sources: ${k}`);
    }
  });

  it("adaptationStoryEligible matches hasAdaptationStoryEvidence's own verdict for the same packet", () => {
    const packet = buildFixturePacket("known_time");
    const result = formatPart01EvidenceForPrompt(packet);
    assert.equal(result.adaptationStoryEligible, hasAdaptationStoryEvidence(packet));
  });
});

describe("buildDeepEssenceStructuredPartAUserPrompt — adaptation_story additive contract", () => {
  it("omitted part01Evidence still reproduces the exact pre-adaptation-story prompt", () => {
    const withoutField = buildDeepEssenceStructuredPartAUserPrompt(BASE_PROMPT_INPUT);
    assert.ok(!withoutField.includes('"adaptation_story"'));
    assert.ok(!withoutField.includes("adaptation_story is the report's central synthesis"));
  });

  it("eligible=false suppresses the schema field and rule even when otherwise grounded", () => {
    const packet = buildFixturePacket("known_time");
    const promptEvidence = formatPart01EvidenceForPrompt(packet);
    const input = groundedEvidenceInput(promptEvidence);
    input.adaptationStoryEligible = false; // force-override regardless of the real fixture's own verdict
    const grounded = buildDeepEssenceStructuredPartAUserPrompt({
      ...BASE_PROMPT_INPUT,
      part01Evidence: input,
    });
    assert.ok(!grounded.includes('"adaptation_story"'));
    assert.ok(!grounded.includes("adaptation_story is the report's central synthesis"));
  });

  it("eligible=true includes the schema field, positioned after layered_identity and axis_interpretations, plus the grounding rule", () => {
    const packet = buildFixturePacket("known_time");
    const promptEvidence = formatPart01EvidenceForPrompt(packet);
    const input = groundedEvidenceInput(promptEvidence);
    input.adaptationStoryEligible = true; // force-override so this test doesn't depend on the fixture's real gate verdict
    const grounded = buildDeepEssenceStructuredPartAUserPrompt({
      ...BASE_PROMPT_INPUT,
      part01Evidence: input,
    });
    assert.ok(grounded.includes('"adaptation_story"'));
    assert.ok(grounded.includes("adaptation_story is the report's central synthesis"));
    assert.ok(grounded.includes("ZERO advice"));
    assert.ok(grounded.includes("고객님"));

    const layeredIdx = grounded.indexOf('"layered_identity"');
    const axisIdx = grounded.indexOf('"axis_interpretations"');
    const adaptationIdx = grounded.lastIndexOf('"adaptation_story"');
    assert.ok(layeredIdx > 0 && axisIdx > layeredIdx, "layered_identity must precede axis_interpretations");
    assert.ok(adaptationIdx > axisIdx, "adaptation_story must be positioned after axis_interpretations in the schema");

    // schema is still valid JSON once the template placeholders are filled in
    const schemaBlock = grounded.slice(
      grounded.indexOf("JSON schema:") + "JSON schema:".length,
      grounded.indexOf("Respond with exactly one JSON object"),
    );
    assert.doesNotThrow(() => JSON.parse(schemaBlock.trim()));
  });

  it("ko-KR and en-US both include the same adaptation_story schema/rule text (instructions are locale-invariant; only output language differs)", () => {
    const packet = buildFixturePacket("known_time");
    const promptEvidence = formatPart01EvidenceForPrompt(packet);
    for (const locale of ["ko-KR", "en-US"]) {
      const input = groundedEvidenceInput(promptEvidence);
      input.adaptationStoryEligible = true;
      const grounded = buildDeepEssenceStructuredPartAUserPrompt({
        ...BASE_PROMPT_INPUT,
        locale,
        part01Evidence: input,
      });
      assert.ok(grounded.includes('"adaptation_story"'), `locale ${locale} missing schema field`);
    }
  });
});

describe("coerceDeepEssencePartA — adaptation_story shape validation (Case D)", () => {
  it("keeps a non-empty narrative", () => {
    const { value } = coerceDeepEssencePartA(
      { summary: { core_mode: "X" }, adaptation_story: { narrative: "A real story." } },
      floor,
    );
    assert.equal(value.adaptation_story.narrative, "A real story.");
  });

  it("drops an empty/missing narrative", () => {
    const { value } = coerceDeepEssencePartA(
      { summary: { core_mode: "X" }, adaptation_story: { narrative: "" } },
      floor,
    );
    assert.ok(!("adaptation_story" in value));
  });

  it("is absent entirely when the LLM didn't return the field at all (backward compatible)", () => {
    const { value } = coerceDeepEssencePartA({ summary: { core_mode: "X" } }, floor);
    assert.ok(!("adaptation_story" in value));
    assert.equal(isDeepEssencePartA(value), true);
  });

  it("passes through evidence_refs only when present, filtering non-string entries", () => {
    const { value } = coerceDeepEssencePartA(
      {
        summary: { core_mode: "X" },
        adaptation_story: { narrative: "story", evidence_refs: ["day_master", 5, "axis:autonomy"] },
      },
      floor,
    );
    assert.deepEqual(value.adaptation_story.evidence_refs, ["day_master", "axis:autonomy"]);
  });

  it("still passes full Part A schema validation with adaptation_story present", () => {
    const { value } = coerceDeepEssencePartA(
      { summary: { core_mode: "X" }, adaptation_story: { narrative: "story" } },
      floor,
    );
    assert.equal(isDeepEssencePartA(value), true);
  });
});

describe("Case C — evidence_refs pass only through the adaptation-story known-key pool (reused filterKnownEvidenceRefs, not reinvented)", () => {
  it("accepts a key that belongs to the declared pool", () => {
    const pool = new Set(["axis:autonomy", "pillars.month.stem_ten_god"]);
    assert.deepEqual(filterKnownEvidenceRefs(["axis:autonomy"], pool), ["axis:autonomy"]);
  });

  it("rejects an invented key not present in the pool", () => {
    const pool = new Set(["axis:autonomy"]);
    assert.deepEqual(filterKnownEvidenceRefs(["axis:autonomy", "invented_fact"], pool), ["axis:autonomy"]);
  });

  it("runDeepEssenceStructuredLlm.ts wires adaptation_story.evidence_refs through filterKnownEvidenceRefs against adaptationStoryKnownKeys, AND defensively strips the whole field when adaptationStoryEligible is false (source wiring, no OpenAI call needed)", () => {
    const src = fs.readFileSync("lib/report/runDeepEssenceStructuredLlm.ts", "utf8");
    assert.match(
      src,
      /filterKnownEvidenceRefs\(\s*adaptationStory\.evidence_refs,\s*promptEvidence\.adaptationStoryKnownKeys,?\s*\)/,
      "must filter adaptation_story.evidence_refs against the dedicated known-key pool",
    );
    assert.match(
      src,
      /if \(adaptationStory && !promptEvidence\.adaptationStoryEligible\)/,
      "must defensively strip adaptation_story when the deterministic gate said this generation wasn't eligible",
    );
  });
});

describe("Case E — UI conditional rendering (pure-function level; full DOM render is covered by the fresh-generation verification script, not this suite)", () => {
  it("hasAdaptationStoryContent is false for undefined/empty-narrative input (Part 04 must not render)", async () => {
    const { hasAdaptationStoryContent } = await import(
      "../../components/results/deep/DeepEssenceAdaptationStory.tsx"
    );
    assert.equal(hasAdaptationStoryContent(undefined), false);
    assert.equal(hasAdaptationStoryContent({ narrative: "" }), false);
  });

  it("hasAdaptationStoryContent is true for a real narrative (Part 04 renders)", async () => {
    const { hasAdaptationStoryContent } = await import(
      "../../components/results/deep/DeepEssenceAdaptationStory.tsx"
    );
    assert.equal(hasAdaptationStoryContent({ narrative: "A real story." }), true);
  });

  it("DeepEssenceReport.tsx guards the adaptation-story section entry with hasAdaptationStory, same array-position-based numbering pattern as layered-identity/axis-interpretation (source wiring)", () => {
    const src = fs.readFileSync("components/results/deep/DeepEssenceReport.tsx", "utf8");
    assert.match(src, /const hasAdaptationStory = hasAdaptationStoryContent\(structured\.adaptation_story\)/);
    assert.match(src, /\.\.\.\(hasAdaptationStory\s*\n?\s*\?\s*\[/);
    // regression guard: the fixed `number={t.partN.num}` pattern must never reappear for any section
    assert.doesNotMatch(src, /number=\{t\.part\d\.num\}/);
    assert.match(src, /number=\{`Part \$\{String\(i \+ 1\)\.padStart\(2, "0"\)\}`\}/);
  });
});

describe("Case G — no new LLM call: Part A/B call count stays exactly 2 total", () => {
  it("runDeepEssenceStructuredLlm.ts still calls callLlmJson exactly twice (Part A, Part B) — adaptation_story rides inside the existing Part A call", () => {
    const src = fs.readFileSync("lib/report/runDeepEssenceStructuredLlm.ts", "utf8");
    const calls = src.match(/callLlmJson\(/g) ?? [];
    // one declaration (`async function callLlmJson(`) + exactly 2 call sites
    const callSites = src.match(/=>\s*callLlmJson\(openai,/g) ?? [];
    assert.equal(callSites.length, 2, `expected exactly 2 callLlmJson call sites (Part A + Part B), found ${callSites.length}`);
    assert.ok(calls.length >= 2);
  });
});
