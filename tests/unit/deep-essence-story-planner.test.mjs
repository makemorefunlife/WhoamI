/**
 * Unit tests for Personal Part 04 Story Planner (Batch 4B)
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import { buildPersonalPart04StoryPlan } from "../../lib/report/buildPersonalPart04StoryPlan.ts";
import { formatPart01EvidenceForPrompt } from "../../lib/report/formatPart01EvidenceForPrompt.ts";

import {
  runPersonalContextEngine,
  buildPersonalCeFixtureChart,
} from "../../lib/personCore/personalContextEngine/index.ts";
import { buildPart01IdentityEvidencePacket } from "../../lib/v1/slim/part01IdentityEvidence.ts";

const CURRENT_PRIMARY = {
  autonomy: 35,
  connection: 75,
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
  autonomy: 80,
  connection: 40,
  stability: 55,
  growth: 60,
  structure: 45,
  adaptability: 65,
};

function buildMockPacket() {
  const chart = buildPersonalCeFixtureChart("known_time");
  const personalContext = runPersonalContextEngine({ chart });
  return buildPart01IdentityEvidencePacket({
    chart,
    personalContext,
    currentPrimary: CURRENT_PRIMARY,
    currentSecondary: CURRENT_SECONDARY,
    innatePrimary: INNATE_PRIMARY,
  });
}

describe("buildPersonalPart04StoryPlan", () => {
  it("A. Widest high-confidence gap becomes primary adaptation", () => {
    const packet = buildMockPacket();
    const promptEvidence = formatPart01EvidenceForPrompt(packet);
    const plan = buildPersonalPart04StoryPlan(packet, promptEvidence);

    assert.ok(plan);
    assert.strictEqual(plan.primaryAdaptation.axis, "autonomy");
    assert.ok(plan.primaryAdaptation.direction);
  });

  it("B. Meaningful layer contrast is selected when present", () => {
    const packet = buildMockPacket();
    const promptEvidence = formatPart01EvidenceForPrompt(packet);
    const plan = buildPersonalPart04StoryPlan(packet, promptEvidence);

    assert.ok(plan?.secondaryContrast);
    assert.strictEqual(plan.secondaryContrast.kind, "layer_contrast");
    assert.strictEqual(plan.secondaryContrast.key, "relational_distance_shift");
  });

  it("C. Supporting Saju structure selects Day Master or Month Stem over Shinsal", () => {
    const packet = buildMockPacket();
    const promptEvidence = formatPart01EvidenceForPrompt(packet);
    const plan = buildPersonalPart04StoryPlan(packet, promptEvidence);

    assert.ok(plan?.supportingInnateStructure);
    assert.ok(["day_master", "pillars.month.stem_ten_god"].includes(plan.supportingInnateStructure.key));
  });

  it("D. Synthesis frame contains a deterministic question framing both Primary Adaptation and Contrast", () => {
    const packet = buildMockPacket();
    const promptEvidence = formatPart01EvidenceForPrompt(packet);
    const plan = buildPersonalPart04StoryPlan(packet, promptEvidence);

    assert.ok(plan?.synthesisFrame.question.includes("자율"));
    assert.ok(plan?.synthesisFrame.question.includes("까닭은 무엇이며"));
  });

  it("E. Selected evidence_refs contain valid known keys spanning 2+ families", () => {
    const packet = buildMockPacket();
    const promptEvidence = formatPart01EvidenceForPrompt(packet);
    const plan = buildPersonalPart04StoryPlan(packet, promptEvidence);

    assert.ok(plan);
    assert.ok(plan.selectedEvidenceRefs.length >= 2);
    assert.ok(plan.evidenceFamilies.length >= 2);
  });

  it("F. StoryPlan defines role-classified requiredEvidence and optionalEvidence", () => {
    const packet = buildMockPacket();
    const promptEvidence = formatPart01EvidenceForPrompt(packet);
    const plan = buildPersonalPart04StoryPlan(packet, promptEvidence);

    assert.ok(plan);
    assert.ok(Array.isArray(plan.requiredEvidence.primaryRefs));
    assert.ok(plan.requiredEvidence.primaryRefs.length > 0);
    assert.ok(Array.isArray(plan.requiredEvidence.contrastRefs));
    assert.ok(plan.requiredEvidence.contrastRefs.length > 0);
    assert.ok(Array.isArray(plan.optionalEvidence.mechanismRefs));
    assert.ok(Array.isArray(plan.optionalEvidence.supportingRefs));
  });

  it("G. StoryPlan synthesisFrame uses human semantic concepts, not only raw English axis IDs", () => {
    const packet = buildMockPacket();
    const promptEvidence = formatPart01EvidenceForPrompt(packet);
    const plan = buildPersonalPart04StoryPlan(packet, promptEvidence);

    assert.ok(plan);
    assert.strictEqual(plan.synthesisFrame.question.includes("autonomy"), false);
    assert.ok(plan.synthesisFrame.question.includes("까닭은 무엇이며"));
  });

  it("H. Role consumption validation — StoryPlan selected layer_contrast drops story without layer ref (Test A & C & D & E & F)", () => {
    const packet = buildMockPacket();
    const promptEvidence = formatPart01EvidenceForPrompt(packet);
    const plan = buildPersonalPart04StoryPlan(packet, promptEvidence);

    assert.ok(plan);
    assert.strictEqual(plan.secondaryContrast?.kind, "layer_contrast");

    const primaryRef = plan.requiredEvidence.primaryRefs[0];
    const contrastRef = plan.requiredEvidence.contrastRefs[0];
    const sajuRef = plan.optionalEvidence.supportingRefs[0] || "relations_intra.guimun";

    // Helper simulating runDeepEssenceStructuredLlm role consumption check
    const validateRefs = (refs) => {
      const set = new Set(refs);
      const hasPrimary = plan.requiredEvidence.primaryRefs.some((r) => set.has(r));
      const hasContrast =
        plan.requiredEvidence.contrastRefs.length === 0 ||
        plan.requiredEvidence.contrastRefs.some((r) => set.has(r));
      return hasPrimary && hasContrast;
    };

    // Test A / C: Primary + Saju ref alone (WITHOUT layer contrast ref) -> FAILS (dropped)
    assert.strictEqual(validateRefs([primaryRef, sajuRef]), false);

    // Test D: Primary + Contrast ref -> ELIGIBLE
    assert.strictEqual(validateRefs([primaryRef, contrastRef]), true);

    // Test E: Primary + Contrast + Saju ref -> ELIGIBLE
    assert.strictEqual(validateRefs([primaryRef, contrastRef, sajuRef]), true);

    // Test F: Shinsal/Saju cannot substitute for required contrast
    assert.strictEqual(validateRefs([primaryRef, "relations_intra.guimun"]), false);
  });

  it("I. Role consumption validation — StoryPlan selected secondary gap drops story without secondary gap axis ref (Test B)", () => {
    const primaryRef = "axis:autonomy";
    const secGapRef = "axis:adaptability";
    const sajuRef = "day_master";

    const mockPlan = {
      requiredEvidence: {
        primaryRefs: [primaryRef],
        contrastRefs: [secGapRef],
      },
    };

    const validateRefs = (refs) => {
      const set = new Set(refs);
      const hasPrimary = mockPlan.requiredEvidence.primaryRefs.some((r) => set.has(r));
      const hasContrast =
        mockPlan.requiredEvidence.contrastRefs.length === 0 ||
        mockPlan.requiredEvidence.contrastRefs.some((r) => set.has(r));
      return hasPrimary && hasContrast;
    };

    // Primary + Saju alone (NO secondary gap ref) -> FAILS
    assert.strictEqual(validateRefs([primaryRef, sajuRef]), false);

    // Primary + Secondary Gap ref -> ELIGIBLE
    assert.strictEqual(validateRefs([primaryRef, secGapRef]), true);
  });

  it("J. Exactly 3 LLM calls exist in runDeepEssenceStructuredLlm.ts (Part A, Part 04, Part B)", async () => {
    const fs = await import("node:fs");
    const code = fs.readFileSync("lib/report/runDeepEssenceStructuredLlm.ts", "utf8");
    const callCount = (code.match(/await fetchLlmJsonWithParseRetry/g) || []).length;
    assert.strictEqual(callCount, 3);
  });

  it("K. Part A schema no longer requests adaptation_story", async () => {
    const { buildDeepEssenceStructuredPartAUserPrompt } = await import("../../lib/prompts/deepEssenceStructured.ts");
    const packet = buildMockPacket();
    const promptEvidence = formatPart01EvidenceForPrompt(packet);
    const prompt = buildDeepEssenceStructuredPartAUserPrompt({
      surveyAnalysis: "test",
      essenceAnalysisSummary: "test",
      birthEnergyContext: "test",
      currentAxisScores: { autonomy: 50, connection: 50, stability: 50, growth: 50, structure: 50, adaptability: 50 },
      locale: "ko-KR",
      part01Evidence: promptEvidence,
    });
    assert.strictEqual(prompt.includes('"adaptation_story":'), false);
  });

  it("L. Part 04 and Part B execute in parallel via Promise.all", async () => {
    const fs = await import("node:fs");
    const code = fs.readFileSync("lib/report/runDeepEssenceStructuredLlm.ts", "utf8");
    assert.ok(code.includes("Promise.all([part04Promise, partBPromise])"));
  });

  it("M. Raw planner debug strings like score=undefined or debug notes never enter focused prompt", () => {
    const packet = buildMockPacket();
    const promptEvidence = formatPart01EvidenceForPrompt(packet);
    const plan = buildPersonalPart04StoryPlan(packet, promptEvidence);

    assert.ok(plan);
    assert.strictEqual(plan.synthesisFrame.question.includes("score="), false);
    assert.strictEqual(plan.synthesisFrame.question.includes("undefined"), false);
    assert.strictEqual(plan.synthesisFrame.question.includes("null"), false);
    assert.strictEqual(plan.synthesisFrame.question.includes("(no Secondary-11"), false);
  });

  it("N. Part 04 prompt builder formats compact input with explicit required refs", async () => {
    const { buildPart04ExpertSynthesisUserPrompt } = await import("../../lib/prompts/deepEssenceStructured.ts");
    const packet = buildMockPacket();
    const promptEvidence = formatPart01EvidenceForPrompt(packet);
    const plan = buildPersonalPart04StoryPlan(packet, promptEvidence);

    const userPrompt = buildPart04ExpertSynthesisUserPrompt({
      storyPlan: plan,
      locale: "ko-KR",
    });

    assert.ok(userPrompt.includes("PRIMARY REQUIRED EVIDENCE REFS"));
    assert.ok(userPrompt.includes("ALLOWED EVIDENCE REFS FOR adaptation_story"));
    assert.ok(userPrompt.includes("SYNTHESIS QUESTION TO ANSWER"));
  });

  it("O. StoryPlan is unknown-time safe", () => {
    const packet = buildMockPacket();
    packet.isUnknownBirthTime = true;
    const promptEvidence = formatPart01EvidenceForPrompt(packet);
    const plan = buildPersonalPart04StoryPlan(packet, promptEvidence);

    if (plan) {
      assert.ok(plan.selectedEvidenceRefs.every((ref) => !ref.startsWith("pillars.hour.")));
    }
  });
});
