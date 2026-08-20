/**
 * Batch 8 — Current x Innate Axis Interpretation UX rework: deterministic
 * gap/alignment ranking (never LLM-chosen), only the selected axes get
 * evidence/schema at all, 4-part gap structure (natural_tendency ->
 * current_pattern -> gives_you -> may_cost [-> may_work_better]) and a
 * 3-part alignment structure. Replaces Batch 7's "all 6 axes, flat
 * meaning/current_self/innate_self/synthesis" shape entirely.
 * Prompt-contract / string-assertion level only — no live LLM calls.
 * Run: npx tsx --test tests/unit/deep-essence-axis-interpretation.test.mjs
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  runPersonalContextEngine,
  buildPersonalCeFixtureChart,
} from "../../lib/personCore/personalContextEngine/index.ts";
import { buildPart01IdentityEvidencePacket } from "../../lib/v1/slim/part01IdentityEvidence.ts";
import { formatPart01EvidenceForPrompt } from "../../lib/report/formatPart01EvidenceForPrompt.ts";
import { buildDeepEssenceStructuredPartAUserPrompt } from "../../lib/prompts/deepEssenceStructured.ts";
import { coerceDeepEssencePartA } from "../../lib/report/coerceDeepEssenceStructured.ts";
import { isDeepEssencePartA } from "../../lib/report/deepEssenceStructuredSchema.ts";

// Deliberately wide gaps on structure/connection/autonomy (autonomy has no
// Secondary-11 mapping — exercises that fallback), neutral elsewhere, so
// selectAxisHighlights has a real 3-gap + 1-alignment case to pick from.
const CURRENT_PRIMARY = {
  autonomy: 85,
  connection: 40,
  stability: 55,
  growth: 60,
  structure: 85,
  adaptability: 50,
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
  autonomy: 45,
  connection: 65,
  stability: 60,
  growth: 55,
  structure: 30,
  adaptability: 48,
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

describe("formatPart01EvidenceForPrompt — axisInterpretation (Batch 8 selection)", () => {
  it("builds evidence only for the deterministically-selected gap axes + the one alignment axis, not all 6", () => {
    const packet = buildFixturePacket("known_time");
    const result = formatPart01EvidenceForPrompt(packet);
    assert.ok(result.axisInterpretation.gaps.length > 0);
    assert.ok(result.axisInterpretation.gaps.length <= 3);
    const gapAxes = result.axisInterpretation.gaps.map((g) => g.axis);
    assert.ok(gapAxes.includes("structure"));
    assert.ok(!gapAxes.includes("stability")); // stability is neutral in this fixture
    if (result.axisInterpretation.alignment) {
      assert.ok(!gapAxes.includes(result.axisInterpretation.alignment.axis));
    }
  });

  it("each gap entry carries an explicit, non-numeric-only Direction fact respecting the deterministic direction", () => {
    const packet = buildFixturePacket("known_time");
    const result = formatPart01EvidenceForPrompt(packet);
    const structureGap = result.axisInterpretation.gaps.find((g) => g.axis === "structure");
    assert.ok(structureGap);
    assert.ok(structureGap.subjectText.includes("Direction fact"));
    // structure current(85) > innate(30) in this fixture -> current_higher
    assert.ok(structureGap.subjectText.includes("Current is HIGHER than Innate"));
  });

  it("autonomy (no Secondary-11 mapping) still gets a non-crashing empty Current known-key set if it's selected", () => {
    const packet = buildFixturePacket("known_time");
    const result = formatPart01EvidenceForPrompt(packet);
    const autonomyGap = result.axisInterpretation.gaps.find((g) => g.axis === "autonomy");
    assert.ok(autonomyGap, "autonomy should be a wide gap in this fixture");
    assert.equal(autonomyGap.currentKnownKeys.size, 0);
    assert.ok(autonomyGap.currentText.includes("no Secondary-11"));
  });

  it("a mapped gap axis (structure) gets isolated secondary: keys matching only its own PRIMARY_TO_SECONDARY_AXIS_KEYS subset", () => {
    const packet = buildFixturePacket("known_time");
    const result = formatPart01EvidenceForPrompt(packet);
    const structureGap = result.axisInterpretation.gaps.find((g) => g.axis === "structure");
    const keys = [...structureGap.currentKnownKeys];
    assert.deepEqual(
      keys.sort(),
      ["secondary:decision_style", "secondary:structure", "secondary:thinking_style"].sort(),
    );
  });

  it("Current known keys never leak across selected axes", () => {
    const packet = buildFixturePacket("known_time");
    const result = formatPart01EvidenceForPrompt(packet);
    const [a, b] = result.axisInterpretation.gaps;
    if (a && b) {
      for (const k of a.currentKnownKeys) {
        assert.ok(!b.currentKnownKeys.has(k), `key ${k} leaked between ${a.axis} and ${b.axis}`);
      }
    }
  });

  it("Innate pool contains no dimension:, axis:, or secondary: keys (no allDimensions dump, no Current mixed in)", () => {
    const packet = buildFixturePacket("known_time");
    const result = formatPart01EvidenceForPrompt(packet);
    const keys = [...result.axisInterpretation.innateEvidenceKnownKeys];
    assert.ok(
      keys.every((k) => !k.startsWith("dimension:") && !k.startsWith("axis:") && !k.startsWith("secondary:")),
    );
    assert.ok(result.axisInterpretation.innateEvidenceText.includes("General identity facts:"));
  });

  it("with an all-neutral profile, gaps is empty and alignment is still populated (never forced/never null)", () => {
    const chart = buildPersonalCeFixtureChart("known_time");
    const personalContext = runPersonalContextEngine({ chart });
    const flat = { autonomy: 50, connection: 50, stability: 50, growth: 50, structure: 50, adaptability: 50 };
    const packet = buildPart01IdentityEvidencePacket({
      chart,
      personalContext,
      currentPrimary: flat,
      currentSecondary: CURRENT_SECONDARY,
      innatePrimary: flat,
    });
    const result = formatPart01EvidenceForPrompt(packet);
    assert.deepEqual(result.axisInterpretation.gaps, []);
    assert.ok(result.axisInterpretation.alignment);
  });
});

describe("buildDeepEssenceStructuredPartAUserPrompt — Batch 8 additive contract", () => {
  it("omitted part01Evidence still reproduces the exact pre-grounding prompt", () => {
    const withoutField = buildDeepEssenceStructuredPartAUserPrompt(BASE_PROMPT_INPUT);
    assert.ok(!withoutField.includes("axis_interpretations"));
    assert.ok(!withoutField.includes("[Axis Gap:"));
    assert.ok(!withoutField.includes("[Axis Alignment:"));
    assert.ok(!withoutField.includes("Innate Self evidence"));
  });

  it("a provided packet injects only the selected gap/alignment axis blocks + schema field, never all 6", () => {
    const packet = buildFixturePacket("known_time");
    const promptEvidence = formatPart01EvidenceForPrompt(packet);
    const evidence = groundedEvidenceInput(promptEvidence);
    const grounded = buildDeepEssenceStructuredPartAUserPrompt({
      ...BASE_PROMPT_INPUT,
      part01Evidence: evidence,
    });
    for (const g of evidence.axisInterpretation.gaps) {
      assert.ok(grounded.includes(`[Axis Gap: ${g.axis}]`), `missing gap block for ${g.axis}`);
    }
    assert.ok(!grounded.includes("[Axis Gap: stability]"), "stability should not be a selected gap in this fixture");
    if (evidence.axisInterpretation.alignment) {
      assert.ok(grounded.includes(`[Axis Alignment: ${evidence.axisInterpretation.alignment.axis}]`));
    }
    assert.ok(grounded.includes("[Innate Self evidence"));
    assert.ok(grounded.includes('"axis_interpretations"'));
    assert.ok(grounded.includes('"gap_deep_dive"'));
    assert.ok(grounded.includes("natural_tendency"));
    assert.ok(grounded.includes("current_pattern"));
    assert.ok(grounded.includes("gives_you"));
    assert.ok(grounded.includes("may_cost"));
    // schema is still valid JSON once the template placeholders are filled in
    const schemaBlock = grounded.slice(
      grounded.indexOf("JSON schema:") + "JSON schema:".length,
      grounded.indexOf("Respond with exactly one JSON object"),
    );
    const schema = JSON.parse(schemaBlock.trim());
    assert.deepEqual(
      Object.keys(schema.axis_interpretations.gap_deep_dive).sort(),
      evidence.axisInterpretation.gaps.map((g) => g.axis).sort(),
    );
    if (evidence.axisInterpretation.alignment) {
      assert.deepEqual(Object.keys(schema.axis_interpretations.alignment_highlight), [
        evidence.axisInterpretation.alignment.axis,
      ]);
    }
    // untouched sections still present
    assert.ok(grounded.includes(BASE_PROMPT_INPUT.surveyAnalysis));
    assert.ok(grounded.includes("energy.balance_pct must equal bars[1].value"));
  });

  it("the shared Innate pool text appears exactly once, not repeated per selected axis (token compactness)", () => {
    const packet = buildFixturePacket("known_time");
    const promptEvidence = formatPart01EvidenceForPrompt(packet);
    const marker = "UNIQUE_INNATE_MARKER_XYZ";
    const evidence = groundedEvidenceInput(promptEvidence);
    evidence.axisInterpretation.innateEvidenceText = marker;
    const grounded = buildDeepEssenceStructuredPartAUserPrompt({
      ...BASE_PROMPT_INPUT,
      part01Evidence: evidence,
    });
    const occurrences = grounded.split(marker).length - 1;
    assert.equal(occurrences, 1);
  });

  it("directs the LLM to never contradict the Direction fact and to avoid fatalistic identity language", () => {
    const packet = buildFixturePacket("known_time");
    const promptEvidence = formatPart01EvidenceForPrompt(packet);
    const grounded = buildDeepEssenceStructuredPartAUserPrompt({
      ...BASE_PROMPT_INPUT,
      part01Evidence: groundedEvidenceInput(promptEvidence),
    });
    assert.ok(grounded.includes("Direction fact"));
    assert.ok(grounded.toLowerCase().includes("true self"));
    assert.ok(grounded.includes("진짜 나"));
    assert.ok(grounded.toLowerCase().includes("never frame the gap"));
  });
});

describe("coerceDeepEssencePartA — Batch 8 axis_interpretations (gap_deep_dive / alignment_highlight)", () => {
  it("drops a gap entry missing any required field (never fabricated/padded), keeps a complete one", () => {
    const { value } = coerceDeepEssencePartA(
      {
        summary: { core_mode: "X" },
        axis_interpretations: {
          gap_deep_dive: {
            structure: {
              natural_tendency: "n",
              current_pattern: "c",
              gives_you: "g",
              may_cost: "m",
            },
            connection: {
              natural_tendency: "n",
              current_pattern: "c",
              gives_you: "",
              may_cost: "m",
            },
          },
        },
      },
      floor,
    );
    assert.ok(value.axis_interpretations.gap_deep_dive.structure);
    assert.ok(!("connection" in value.axis_interpretations.gap_deep_dive));
  });

  it("may_work_better is passed through only when present (optional field)", () => {
    const { value } = coerceDeepEssencePartA(
      {
        summary: { core_mode: "X" },
        axis_interpretations: {
          gap_deep_dive: {
            structure: {
              natural_tendency: "n",
              current_pattern: "c",
              gives_you: "g",
              may_cost: "m",
              may_work_better: "w",
            },
          },
        },
      },
      floor,
    );
    assert.equal(value.axis_interpretations.gap_deep_dive.structure.may_work_better, "w");
  });

  it("drops an alignment entry missing any required field", () => {
    const { value } = coerceDeepEssencePartA(
      {
        summary: { core_mode: "X" },
        axis_interpretations: {
          alignment_highlight: {
            adaptability: { natural_tendency: "n", current_pattern: "c", why_it_feels_easy: "" },
          },
        },
      },
      floor,
    );
    assert.ok(!("axis_interpretations" in value));
  });

  it("keeps a complete alignment entry", () => {
    const { value } = coerceDeepEssencePartA(
      {
        summary: { core_mode: "X" },
        axis_interpretations: {
          alignment_highlight: {
            adaptability: { natural_tendency: "n", current_pattern: "c", why_it_feels_easy: "e" },
          },
        },
      },
      floor,
    );
    assert.ok(value.axis_interpretations.alignment_highlight.adaptability);
  });

  it("omits axis_interpretations entirely when the LLM returned nothing usable (backward compatible)", () => {
    const { value } = coerceDeepEssencePartA({ summary: { core_mode: "X" } }, floor);
    assert.ok(!("axis_interpretations" in value));
    assert.equal(isDeepEssencePartA(value), true);
  });

  it("passes through current_evidence_refs / innate_evidence_refs only when present, filtering non-strings", () => {
    const { value } = coerceDeepEssencePartA(
      {
        summary: { core_mode: "X" },
        axis_interpretations: {
          gap_deep_dive: {
            structure: {
              natural_tendency: "n",
              current_pattern: "c",
              gives_you: "g",
              may_cost: "m",
              current_evidence_refs: ["secondary:structure", 3],
              innate_evidence_refs: ["day_master"],
            },
          },
        },
      },
      floor,
    );
    assert.deepEqual(value.axis_interpretations.gap_deep_dive.structure.current_evidence_refs, [
      "secondary:structure",
    ]);
    assert.deepEqual(value.axis_interpretations.gap_deep_dive.structure.innate_evidence_refs, ["day_master"]);
  });

  it("still passes full Part A schema validation with axis_interpretations present", () => {
    const { value } = coerceDeepEssencePartA(
      {
        summary: { core_mode: "X" },
        axis_interpretations: {
          gap_deep_dive: {
            structure: { natural_tendency: "n", current_pattern: "c", gives_you: "g", may_cost: "m" },
          },
          alignment_highlight: {
            adaptability: { natural_tendency: "n", current_pattern: "c", why_it_feels_easy: "e" },
          },
        },
      },
      floor,
    );
    assert.equal(isDeepEssencePartA(value), true);
  });

  describe("Personal Premium V3 Batch 3 — Part 03 Current x Innate Contracts", () => {
    it("A. Prompt requires frozen semantic labels in gap and alignment contracts", () => {
      const packet = buildFixturePacket("known_time");
      const promptEvidence = formatPart01EvidenceForPrompt(packet);
      const userPrompt = buildDeepEssenceStructuredPartAUserPrompt({
        ...BASE_PROMPT_INPUT,
        part01Evidence: groundedEvidenceInput(promptEvidence),
      });

      assert.ok(userPrompt.includes('natural_tendency ("본래 더 편한 방식")'));
      assert.ok(userPrompt.includes('current_pattern ("현실에서 익숙해진 방식")'));
      assert.ok(userPrompt.includes('gives_you ("그 과정에서 얻은 힘")'));
      assert.ok(userPrompt.includes('may_cost ("대신 더 많이 쓰게 된 에너지")'));
      assert.ok(userPrompt.includes('why_it_feels_easy ("그래서 힘을 덜 들이고 잘 쓰는 부분")'));
    });

    it("B. Prompt forbids advice, traditional Saju jargon, true-self/fake-self, invented biography, and repetition", () => {
      const packet = buildFixturePacket("known_time");
      const promptEvidence = formatPart01EvidenceForPrompt(packet);
      const userPrompt = buildDeepEssenceStructuredPartAUserPrompt({
        ...BASE_PROMPT_INPUT,
        part01Evidence: groundedEvidenceInput(promptEvidence),
      });

      assert.ok(userPrompt.includes("ZERO ADVICE BAN"));
      assert.ok(userPrompt.includes("NO TRADITIONAL SAJU JARGON LEAKAGE"));
      assert.ok(userPrompt.includes("NO TRUE-SELF / FAKE-SELF LANGUAGE"));
      assert.ok(userPrompt.includes("NO INVENTED BIOGRAPHY & NO LIFE-STORY SYNTHESIS"));
      assert.ok(userPrompt.includes("NO CROSS-AXIS MECHANISM REPETITION"));
    });
  });
});
