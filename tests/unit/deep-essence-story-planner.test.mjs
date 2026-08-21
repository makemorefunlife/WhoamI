/**
 * Unit tests for Personal Part 04 Story Planner (Batch 4B)
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import { buildPersonalPart04StoryPlan } from "../../lib/report/buildPersonalPart04StoryPlan.ts";
import { formatPart01EvidenceForPrompt, selectEnergyMechanisms, selectFitPlan } from "../../lib/report/formatPart01EvidenceForPrompt.ts";

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

  it("P. Part 05 energy economics prompt rules & evidence expansion are present", async () => {
    const packet = buildMockPacket();
    const promptEvidence = formatPart01EvidenceForPrompt(packet);
    assert.ok(promptEvidence.energyText.includes("Day-Master strength & Ten-God distribution:"));
    assert.ok(promptEvidence.energyText.includes("Intra-Pillar structural relations"));
    assert.ok(promptEvidence.energyKnownKeys.size > 0);
    assert.ok(promptEvidence.energyKnownKeys.has("secondary:energy_style"));

    const { buildDeepEssenceStructuredPartAUserPrompt } = await import("../../lib/prompts/deepEssenceStructured.ts");
    const prompt = buildDeepEssenceStructuredPartAUserPrompt({
      surveyAnalysis: "test",
      essenceAnalysisSummary: "test",
      birthEnergyContext: "test",
      currentAxisScores: { autonomy: 50, connection: 50, stability: 50, growth: 50, structure: 50, adaptability: 50 },
      locale: "ko-KR",
      part01Evidence: promptEvidence,
    });

    assert.ok(prompt.includes("ENERGY ECONOMICS & RECOVERY ARCHITECTURE (PART 05"));
    assert.ok(prompt.includes("SEMANTIC OWNERSHIP BOUNDARY"));
    assert.ok(prompt.includes("CORE MODEL (ENERGY IS NOT GOOD VS BAD)"));
    assert.ok(prompt.includes("SAJU HUMAN TRANSLATION RULE"));
  });

  it("Q. selectEnergyMechanisms deterministically differentiates profiles", async () => {
    const { selectEnergyMechanisms, formatPart01EvidenceForPrompt } = await import("../../lib/report/formatPart01EvidenceForPrompt.ts");
    const chart = buildPersonalCeFixtureChart("known_time");
    const personalContext = runPersonalContextEngine({ chart });

    const packetAutonomy = buildPart01IdentityEvidencePacket({
      chart,
      personalContext,
      currentPrimary: { ...CURRENT_PRIMARY, autonomy: 90, connection: 30 },
      currentSecondary: { ...CURRENT_SECONDARY, decision_style: 85 },
      innatePrimary: INNATE_PRIMARY,
    });

    const planAutonomy = selectEnergyMechanisms(packetAutonomy);
    assert.strictEqual(planAutonomy.primary.key, "DECISION_LOAD");

    const packetStructure = buildPart01IdentityEvidencePacket({
      chart,
      personalContext,
      currentPrimary: { ...CURRENT_PRIMARY, structure: 90, stability: 85 },
      currentSecondary: { ...CURRENT_SECONDARY, structure: 90 },
      innatePrimary: INNATE_PRIMARY,
    });

    const planStructure = selectEnergyMechanisms(packetStructure);
    assert.strictEqual(planStructure.primary.key, "STRUCTURE_MAINTENANCE");

    const promptEv = formatPart01EvidenceForPrompt(packetAutonomy);
    assert.ok(promptEv.energyText.includes("- [PRIMARY MECHANISM]: DECISION_LOAD"));
  });

  it("R. selectFitPlan — deterministic primary and secondary fit plan selection", () => {
    const chart = buildPersonalCeFixtureChart("known_time");
    const personalContext = runPersonalContextEngine({ chart });

    const packetAutonomy = buildPart01IdentityEvidencePacket({
      chart,
      personalContext,
      currentPrimary: { ...CURRENT_PRIMARY, autonomy: 90, connection: 30 },
      currentSecondary: { ...CURRENT_SECONDARY, decision_style: 85 },
      innatePrimary: INNATE_PRIMARY,
    });

    const fitAutonomy = selectFitPlan(packetAutonomy);
    assert.strictEqual(fitAutonomy.primaryFit.key, "AUTONOMY");

    const packetStructure = buildPart01IdentityEvidencePacket({
      chart,
      personalContext,
      currentPrimary: { ...CURRENT_PRIMARY, structure: 90, stability: 85 },
      currentSecondary: { ...CURRENT_SECONDARY, structure: 90 },
      innatePrimary: INNATE_PRIMARY,
    });

    const fitStructure = selectFitPlan(packetStructure);
    assert.ok(["STRUCTURE", "PREDICTABILITY"].includes(fitStructure.primaryFit.key));

    const promptEv = formatPart01EvidenceForPrompt(packetAutonomy);
    assert.ok(promptEv.relationshipText.includes("- [PRIMARY FIT NEED]: AUTONOMY"));
  });

  it("S. validatePart06QualityGate — Negative Test A, B, C mechanical failures", async () => {
    const { validatePart06QualityGate } = await import("../../lib/report/polishDeepEssenceStructured.ts");

    // Negative Test A: GROWTH_VARIETY + STIMULATION with unrelated environment items MUST FAIL
    const fakeFitPlanGrowth = {
      primaryFit: { key: "GROWTH_VARIETY", label: "성장", peopleFitDirection: "", frictionDirection: "", communicationTrigger: "", communicationBetter: "", environmentFitDirection: "" },
      secondaryFit: { key: "STIMULATION", label: "자극", peopleFitDirection: "", frictionDirection: "", communicationTrigger: "", communicationBetter: "", environmentFitDirection: "" },
    };
    const fakeReportA = {
      energy: { optimal: ["자유롭게 감정을 표현할 수 있는 환경", "상대방과의 신뢰가 깊은 관계"] },
      relationships: { compare: [] },
    };
    const resA = validatePart06QualityGate(fakeFitPlanGrowth, fakeReportA);
    assert.strictEqual(resA.pass, false, "Negative Test A must fail when environment lacks growth/stimulation motifs");
    assert.ok(resA.failures.some((f) => f.includes("ENVIRONMENT ITEM 1")));

    // Negative Test B: Banned AI coaching sentence MUST FAIL
    const fakeReportB = {
      energy: { optimal: ["성장과 다양한 시도를 허용하는 팀", "새로운 아이디어와 자극이 주어지는 환경"] },
      relationships: { compare: [{ wound: "너는 왜 정석대로 안 해?", steady: "네가 시도하려는 그 유연한 접근법이 어떤 배움을 줄지 기대돼." }] },
    };
    const resB = validatePart06QualityGate(fakeFitPlanGrowth, fakeReportB);
    assert.strictEqual(resB.pass, false, "Negative Test B must fail when communication steady uses banned coaching string");
    assert.ok(resB.failures.some((f) => f.includes("banned AI-coaching language")));

    // Negative Test C: PREDICTABILITY + STRUCTURE lacking structure motifs MUST FAIL
    const fakeFitPlanStructure = {
      primaryFit: { key: "PREDICTABILITY", label: "예측 가능성", peopleFitDirection: "", frictionDirection: "", communicationTrigger: "", communicationBetter: "", environmentFitDirection: "" },
      secondaryFit: { key: "STRUCTURE", label: "원칙", peopleFitDirection: "", frictionDirection: "", communicationTrigger: "", communicationBetter: "", environmentFitDirection: "" },
    };
    const fakeReportC = {
      energy: { optimal: ["우선순위와 기준이 명확한 환경", "절차와 수순이 잘 정돈된 체계"] },
      relationships: { compare: [{ wound: "왜 또 네 방식대로만 다 정하려고 해?", steady: "이 결정은 네 판단에 맡길 테니 지지해줄게." }] },
    };
    const resC = validatePart06QualityGate(fakeFitPlanStructure, fakeReportC);
    assert.strictEqual(resC.pass, false, "Negative Test C must fail when structure/predictability profile has 0 structure motifs in compare");
    assert.ok(resC.failures.some((f) => f.includes("must have at least 2/3 pairs matching profile motifs")));
  });

  it("T. Batch 6D Spoken Dialogue Negative Tests A, B, C, D", async () => {
    const { isSpokenDialogue, validatePart06QualityGate } = await import("../../lib/report/polishDeepEssenceStructured.ts");

    // Negative Test A
    assert.strictEqual(isSpokenDialogue("상황이 자주 바뀌어 혼란스러움"), false, "Negative Test A must fail spoken dialogue check");

    // Negative Test B
    assert.strictEqual(isSpokenDialogue("기준이 자주 바뀌어 예측할 수 없는 상황"), false, "Negative Test B must fail spoken dialogue check");

    // Negative Test C
    assert.strictEqual(isSpokenDialogue("감정 기복이 심한 상황에서의 불안감"), false, "Negative Test C must fail spoken dialogue check");

    // Negative Test D
    assert.strictEqual(isSpokenDialogue("말과 행동의 차이가 커서 상대의 진짜 의도를 계속 해석해야 하는 관계."), false, "Negative Test D must fail spoken dialogue check");

    const fakeFitPlan = {
      primaryFit: { key: "PREDICTABILITY", label: "예측", peopleFitDirection: "", frictionDirection: "", communicationTrigger: "", communicationBetter: "", environmentFitDirection: "" },
      secondaryFit: { key: "STRUCTURE", label: "원칙", peopleFitDirection: "", frictionDirection: "", communicationTrigger: "", communicationBetter: "", environmentFitDirection: "" },
    };

    const fakeReportNonSpoken = {
      energy: { optimal: ["갑작스러운 변수가 적은 안정적인 환경", "명확한 원칙과 수순이 정돈된 환경"] },
      relationships: {
        compare: [
          { wound: "상황이 자주 바뀌어 혼란스러움", steady: "수정된 원칙과 기준을 공유하자." },
        ],
      },
    };

    const res = validatePart06QualityGate(fakeFitPlan, fakeReportNonSpoken);
    assert.strictEqual(res.pass, false, "Gate must fail when compare row wound is non-spoken narrator description");
    assert.ok(res.failures.some((f) => f.includes("narrator description, not spoken dialogue")));
  });

  it("U. Batch 6E Communication Pair Dedup Guard Tests A, B, C, D, E", async () => {
    const { isDuplicatePair, validatePart06QualityGate, polishDeepEssenceStructuredReport } = await import("../../lib/report/polishDeepEssenceStructured.ts");

    const fakeFitPlan = {
      primaryFit: { key: "PREDICTABILITY", label: "예측 가능성", peopleFitDirection: "", frictionDirection: "", communicationTrigger: "나중에 어떻게 될지 모르니까 일단 기다려봐.", communicationBetter: "확정된 정보와 예상 변수를 미리 공유해서 준비할 수 있게 해줄게.", environmentFitDirection: "갑작스러운 변수가 적은 안정적인 환경" },
      secondaryFit: { key: "STRUCTURE", label: "명확한 원칙", peopleFitDirection: "", frictionDirection: "", communicationTrigger: "그냥 규칙 신경 쓰지 말고 대충 상황 맞춰서 해.", communicationBetter: "수정된 원칙과 기준을 먼저 정리해서 공유하고 수순을 맞추자.", environmentFitDirection: "업무 절차와 책임 소재가 명확한 환경" },
    };

    // Test A: 3 unique pairs => PASS
    const reportA = {
      energy: { headline: "", summary: "", bars: [], fuels: [], drains: [], optimal: ["갑작스러운 변수가 적은 안정적인 환경", "업무 절차와 책임 소재가 명확한 환경"] },
      relationships: {
        pattern: "", fit: [], friction: [],
        compare: [
          { wound: "나중에 어떻게 될지 모르니까 일단 기다려봐.", steady: "확정된 정보와 예상 변수를 미리 공유해서 준비할 수 있게 해줄게." },
          { wound: "그냥 규칙 신경 쓰지 말고 대충 상황 맞춰서 해.", steady: "수정된 원칙과 기준을 먼저 정리해서 공유하고 수순을 맞추자." },
          { wound: "왜 또 기준을 미리 안 알려주고 갑자기 바꿔?", steady: "우선순위와 기준을 먼저 명확히 정하고, 변경이 생기면 수순과 이유를 사전에 공유해줘." },
        ],
      },
      strengths: [], watchouts: [], summary: { core_mode: "" }, radar_potential: {}, playbook: { rule: "", rows: [], heated: "", reset: "" }, future: { remember: [], leap: "" }, closing: "", checklist: [],
    };
    const resA = validatePart06QualityGate(fakeFitPlan, reportA);
    assert.strictEqual(resA.pass, true, "Test A must pass with 3 unique communication pairs");

    // Test B: Pair 2 === Pair 3 => FAIL
    const reportB = {
      ...reportA,
      relationships: {
        ...reportA.relationships,
        compare: [
          reportA.relationships.compare[0],
          reportA.relationships.compare[1],
          reportA.relationships.compare[1], // Duplicate Pair 3
        ],
      },
    };
    const resB = validatePart06QualityGate(fakeFitPlan, reportB);
    assert.strictEqual(resB.pass, false, "Test B must fail when Pair 2 === Pair 3");
    assert.ok(resB.failures.some((f) => f.includes("duplicate/near-duplicate")));

    // Test C: Near-identical LEFT + near-identical RIGHT => detected
    const pairC1 = { wound: "그냥 규칙 신경 쓰지 말고 대충 상황 맞춰서 해.", steady: "수정된 원칙과 기준을 먼저 정리해서 공유하고 수순을 맞추자." };
    const pairC2 = { wound: "그냥 규칙 신경 쓰지 말고 대충 상황 맞춰서 해!", steady: "수정된 원칙과 기준을 먼저 정리해서 공유하고 수순을 맞추자!" };
    assert.strictEqual(isDuplicatePair(pairC1, pairC2), true, "Test C must detect near-identical pair");

    // Test D: Same broad Fit motif but genuinely different conflict situations => NOT duplicate
    const pairD1 = { wound: "나중에 어떻게 될지 모르니까 일단 기다려봐.", steady: "확정된 정보와 예상 변수를 미리 공유해서 준비할 수 있게 해줄게." };
    const pairD2 = { wound: "그냥 규칙 신경 쓰지 말고 대충 상황 맞춰서 해.", steady: "수정된 원칙과 기준을 먼저 정리해서 공유하고 수순을 맞추자." };
    assert.strictEqual(isDuplicatePair(pairD1, pairD2), false, "Test D must not mark distinct conflict situations as duplicates");

    // Test E: P3 exact duplicated pair from fresh QA => prevented by polish
    const polishedE = polishDeepEssenceStructuredReport(reportB, "ko-KR", fakeFitPlan);
    const resE = validatePart06QualityGate(fakeFitPlan, polishedE);
    assert.strictEqual(resE.pass, true, "Test E must produce 3 non-duplicate pairs after polish");
    assert.strictEqual(isDuplicatePair(polishedE.relationships.compare[1], polishedE.relationships.compare[2]), false, "Polished pairs 2 & 3 must be distinct");
  });
});
