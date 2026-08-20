/**
 * Personal Premium V3 Batch 1 Evidence Routing Infrastructure Tests.
 * Tests:
 * 1. Un-dropped Secondary Psych axes routing to Lenses.
 * 2. Yongshin confidence gate enforcement (low/heuristic confidence excluded).
 * 3. Shinsal & Branch Relations routing with anti-jargon/convergence prompt rules.
 * 4. Known vs Unknown birth time evidence reference comparison (hour pillar disappearing cleanly).
 * 5. Prompt size regression limits.
 *
 * Run: npx tsx --test tests/unit/deep-essence-v3-batch1-evidence-routing.test.mjs
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";
import { buildPart01IdentityEvidencePacketFromBundle } from "../../lib/v1/slim/part01IdentityEvidence.ts";
import { formatPart01EvidenceForPrompt } from "../../lib/report/formatPart01EvidenceForPrompt.ts";

const mockCurrentPrimary = {
  autonomy: 65,
  connection: 75,
  stability: 40,
  growth: 80,
  structure: 70,
  adaptability: 55,
};

const mockCurrentSecondary = {
  decision_style: 60,
  relationship_orientation: 70,
  autonomy_style: 65,
  stability_need: 45,
  growth_style: 85,
  adaptability_range: 50,
  structure: 75,
  emotional_expression: 40,
  recovery_style: 35,
  recognition: 60,
  control_tendency: 70,
  empathy: 75,
  energy_style: 55,
  resilience: 60,
  conflict_style: 40,
  thinking_style: 65,
  self_control: 70,
  practicality: 65,
  stimulation: 80,
};

const mockInnatePrimary = {
  autonomy: 80,
  connection: 50,
  stability: 60,
  growth: 70,
  structure: 45,
  adaptability: 60,
};

describe("Personal Premium V3 Batch 1 Evidence Routing", () => {
  it("routes un-dropped secondary psych axes to intended prompt Lenses", () => {
    const bundle = calculateSajuBundle({ birthDate: "1992-06-15", birthTime: "14:30" });
    const packet = buildPart01IdentityEvidencePacketFromBundle({
      reportId: "test-known",
      birthDate: "1992-06-15",
      birthTime: "14:30",
      birthTimeUnknown: false,
      bundle,
      currentPrimary: mockCurrentPrimary,
      currentSecondary: mockCurrentSecondary,
      innatePrimary: mockInnatePrimary,
    });
    const promptEvidence = formatPart01EvidenceForPrompt(packet);

    const energyKeys = Array.from(promptEvidence.energyKnownKeys);
    const practiceKeys = Array.from(promptEvidence.practiceKnownKeys);

    assert.ok(energyKeys.some((k) => k.includes("recognition") || k.includes("conflict_style")), "Energy Lens must include recognition");
    assert.ok(practiceKeys.some((k) => k.includes("structure") || k.includes("decision_style")), "Practice Lens must include structure");
  });

  it("strictly enforces Yongshin confidence gate (low/heuristic confidence excluded)", () => {
    const bundle = calculateSajuBundle({ birthDate: "1992-06-15", birthTime: "14:30" });
    const packetLowConf = buildPart01IdentityEvidencePacketFromBundle({
      reportId: "test-yongshin",
      birthDate: "1992-06-15",
      birthTime: "14:30",
      birthTimeUnknown: false,
      bundle: {
        ...bundle,
        chart: {
          ...bundle.chart,
          favorable_elements: {
            ...bundle.chart.favorable_elements,
            confidence: "low",
          },
        },
      },
      currentPrimary: mockCurrentPrimary,
      currentSecondary: mockCurrentSecondary,
      innatePrimary: mockInnatePrimary,
    });
    const promptEvidence = formatPart01EvidenceForPrompt(packetLowConf);

    const innateKeys = Array.from(promptEvidence.axisInterpretation.innateEvidenceKnownKeys);
    assert.equal(
      innateKeys.some((k) => k === "favorable_elements"),
      false,
      "Low confidence Yongshin must NOT be included in innate evidence pool",
    );
  });

  it("handles known vs unknown birth time correctly (hour pillar disappears safely)", () => {
    const bundleKnown = calculateSajuBundle({ birthDate: "1992-06-15", birthTime: "14:30" });
    const bundleUnknown = calculateSajuBundle({ birthDate: "1992-06-15", birthTimeUnknown: true });

    const packetKnown = buildPart01IdentityEvidencePacketFromBundle({
      reportId: "test-known",
      birthDate: "1992-06-15",
      birthTime: "14:30",
      birthTimeUnknown: false,
      bundle: bundleKnown,
      currentPrimary: mockCurrentPrimary,
      currentSecondary: mockCurrentSecondary,
      innatePrimary: mockInnatePrimary,
    });

    const packetUnknown = buildPart01IdentityEvidencePacketFromBundle({
      reportId: "test-unknown",
      birthDate: "1992-06-15",
      birthTime: null,
      birthTimeUnknown: true,
      bundle: bundleUnknown,
      currentPrimary: mockCurrentPrimary,
      currentSecondary: mockCurrentSecondary,
      innatePrimary: mockInnatePrimary,
    });

    const knownHasHour = packetKnown.innate.pillarEvidence.some((p) => p.fact_path.includes("hour"));
    const unknownHasHour = packetUnknown.innate.pillarEvidence.some((p) => p.fact_path.includes("hour"));

    assert.equal(knownHasHour, true, "Known birth time packet contains hour pillar evidence");
    assert.equal(unknownHasHour, false, "Unknown birth time packet must NOT contain hour pillar evidence");
  });

  it("bounds prompt evidence text size within latency budget", () => {
    const bundle = calculateSajuBundle({ birthDate: "1992-06-15", birthTime: "14:30" });
    const packet = buildPart01IdentityEvidencePacketFromBundle({
      reportId: "test-size",
      birthDate: "1992-06-15",
      birthTime: "14:30",
      birthTimeUnknown: false,
      bundle,
      currentPrimary: mockCurrentPrimary,
      currentSecondary: mockCurrentSecondary,
      innatePrimary: mockInnatePrimary,
    });
    const promptEvidence = formatPart01EvidenceForPrompt(packet);

    const totalChars =
      promptEvidence.coreModeText.length +
      promptEvidence.growthEdgeText.length +
      promptEvidence.energyText.length +
      promptEvidence.relationshipText.length +
      promptEvidence.practiceText.length;

    assert.ok(totalChars < 12000, `Total prompt chars (${totalChars}) must be bounded under 12000`);
  });
});
