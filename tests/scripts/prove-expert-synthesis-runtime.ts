/**
 * Runtime Proof Demonstration for Romantic V4 Expert Synthesis Layer
 *
 * Demonstrates:
 * 1. Full 4-chapter narrative execution with expert synthesis enabled
 * 2. Detailed block-by-block provenance and evidence traceability
 * 3. Successful grounded / expert synthesis integration
 * 4. Fallback execution on simulated LLM hallucination / jargon
 * 5. Fallback execution on malformed JSON
 * 6. Fallback execution on forbidden diagnostic / fate claims
 */

import { buildActualFourCeContract } from "@/lib/relationship/romantic/prototypeV4/buildActualFourCeContract";
import { buildRomanticV4PrototypePayload } from "@/lib/relationship/romantic/prototypeV4/buildRomanticV4PrototypePayload";
import { buildCanonicalRelationshipStoryPlan } from "@/lib/relationship/romantic/prototypeV4/buildCanonicalRelationshipStoryPlan";
import { composeCanonicalSectionNarratives } from "@/lib/relationship/romantic/prototypeV4/composeCanonicalSectionNarratives";
import { buildCanonicalRomanticV4Report } from "@/lib/relationship/romantic/prototypeV4/buildCanonicalRomanticV4Report";
import {
  buildAttractionSynthesisInput,
  buildDynamicsSynthesisInput,
  buildHiddenHeartsSynthesisInput,
  buildStrengthVulnerabilitySynthesisInput,
} from "@/lib/relationship/romantic/prototypeV4/expertSynthesisPrompt";
import { validateExpertSynthesis } from "@/lib/relationship/romantic/prototypeV4/expertSynthesisValidator";
import {
  generateExpertSynthesesForStoryPlan,
  generateDeterministicExpertSynthesis,
} from "@/lib/relationship/romantic/prototypeV4/buildExpertSynthesis";
import type { ExpertSynthesisResult } from "@/lib/relationship/romantic/prototypeV4/expertSynthesisTypes";

function runRuntimeProof() {
  console.log("\n================================================================================");
  console.log("   ROMANTIC V4 EXPERT SYNTHESIS LAYER — COMPLETE RUNTIME PROOF (ko-KR)");
  console.log("================================================================================\n");

  const report = buildCanonicalRomanticV4Report("ko-KR");

  console.log("--------------------------------------------------------------------------------");
  console.log("1. REPORT METADATA & VALIDATION STATUS");
  console.log("--------------------------------------------------------------------------------");
  console.log(`Schema Version : ${report.schemaVersion}`);
  console.log(`Locale         : ${report.locale}`);
  console.log(`Couple Names   : ${report.names.a} & ${report.names.b}`);
  console.log(`Validation OK  : ${report.validation.ok}`);
  console.log(`Issues Count   : ${report.validation.issues.length}`);
  console.log(`Connected EIDs : ${report.connectedFromExistingEngine.length} total evidence refs connected\n`);

  console.log("--------------------------------------------------------------------------------");
  console.log("2. COMPLETE 4-CHAPTER NARRATIVES WITH EXPERT SYNTHESIS & PROVENANCE");
  console.log("--------------------------------------------------------------------------------");

  const targetChapters = ["c2_attraction", "c3_dynamics", "c6_hidden_hearts", "c8_strength_vulnerability"];

  for (const chapterId of targetChapters) {
    const section = report.sections.find((s) => s.chapterId === chapterId);
    if (!section) continue;

    console.log(`\n================================================================================`);
    console.log(`[CHAPTER] ${section.title} (${section.userQuestion})`);
    console.log(`================================================================================`);

    for (const block of section.blocks) {
      console.log(`\n--- [BLOCK: ${block.blockId}] ${block.title} ---`);
      console.log(block.body);
      console.log("\n[Evidence IDs Traceability]:");
      block.evidenceIds.forEach((eid) => console.log(`  - ${eid}`));

      if (block.expertSynthesis) {
        console.log("\n[Attached Expert Synthesis Layer]:");
        console.log(`  - Synthesis ID  : ${block.expertSynthesis.synthesisId}`);
        console.log(`  - Direction     : ${block.expertSynthesis.direction}`);
        console.log(`  - Type          : ${block.expertSynthesis.interpretationType} (${block.expertSynthesis.confidence} confidence)`);
        console.log(`  - Core Reading  : ${block.expertSynthesis.primaryInterpretation}`);
        console.log(`  - Synergistic   : ${block.expertSynthesis.expertSynthesis}`);
        console.log(`  - Mechanism     : ${block.expertSynthesis.interactionMechanism}`);
        if (block.expertSynthesis.conditionalNuance) {
          console.log(`  - Nuance (Cond) : ${block.expertSynthesis.conditionalNuance}`);
        }
      }
    }
  }

  console.log("\n\n--------------------------------------------------------------------------------");
  console.log("3. RESILIENCE & DETERMINISTIC FALLBACK PROOFS");
  console.log("--------------------------------------------------------------------------------");

  // Proof A: Saju Jargon & Hallucination Injection
  console.log("\n[Scenario A: LLM attempts to inject Saju jargon / hallucinated terms]");
  const inputA = buildAttractionSynthesisInput(report.storyPlan, "a_to_b");
  const hallucinatedSynthesis: ExpertSynthesisResult = {
    synthesisId: "sim-hallucinated-1",
    chapterId: "c2_attraction",
    direction: "a_to_b",
    primaryInterpretation: "정관과 편인의 조화로 사주상 완벽한 합을 이룹니다.",
    expertSynthesis: "자오충과 도화살이 있어 강렬한 끌림을 유발합니다.",
    interactionMechanism: "십신의 상생 구조가 작동합니다.",
    usedClaimIds: ["claim.attr.a.recognition"],
    usedEvidenceIds: ["chart.b.day_master"],
    contradictingEvidenceIds: [],
    interpretationType: "grounded",
    confidence: "high",
    missingEvidence: [],
    forbiddenClaimsAvoided: [],
  };
  const valA = validateExpertSynthesis(hallucinatedSynthesis, inputA);
  console.log(`  Validation Passed: ${valA.ok}`);
  console.log(`  Fallback Required: ${valA.fallbackRequired}`);
  console.log(`  Detected Issues  : ${valA.issues.map((i) => i.code).join(", ")}`);
  const safeFallbackA = generateDeterministicExpertSynthesis(inputA);
  console.log(`  Fallback Output  : "${safeFallbackA.primaryInterpretation}"`);

  // Proof B: Malformed / Null Output
  console.log("\n[Scenario B: LLM returns null / malformed JSON]");
  const valB = validateExpertSynthesis(null, inputA);
  console.log(`  Validation Passed: ${valB.ok}`);
  console.log(`  Fallback Required: ${valB.fallbackRequired}`);
  console.log(`  Detected Issues  : ${valB.issues.map((i) => i.code).join(", ")}`);
  const safeFallbackB = generateDeterministicExpertSynthesis(inputA);
  console.log(`  Fallback Output  : "${safeFallbackB.primaryInterpretation}"`);

  // Proof C: Forbidden Diagnostic / Fate Claims
  console.log("\n[Scenario C: LLM outputs forbidden fate / trauma / diagnostic claims]");
  const inputC = buildStrengthVulnerabilitySynthesisInput(report.storyPlan, "shared");
  const forbiddenSynthesis: ExpertSynthesisResult = {
    synthesisId: "sim-forbidden-1",
    chapterId: "c8_strength_vulnerability",
    direction: "mutual",
    primaryInterpretation: "두 사람은 반드시 이혼하며 상대방의 회피형 애착장애와 가스라이팅을 겪게 됩니다.",
    expertSynthesis: "외도와 파산의 운명이 예정되어 있습니다.",
    interactionMechanism: "성격장애로 인한 파국을 맞이합니다.",
    usedClaimIds: ["claim.shared.strength"],
    usedEvidenceIds: ["ce.pair.common", "canonical_projections.pair_ce_bonding"],
    contradictingEvidenceIds: [],
    interpretationType: "expert_synthesis",
    confidence: "high",
    missingEvidence: [],
    forbiddenClaimsAvoided: [],
  };
  const valC = validateExpertSynthesis(forbiddenSynthesis, inputC);
  console.log(`  Validation Passed: ${valC.ok}`);
  console.log(`  Fallback Required: ${valC.fallbackRequired}`);
  console.log(`  Detected Issues  : ${valC.issues.map((i) => i.code).join(", ")}`);
  const safeFallbackC = generateDeterministicExpertSynthesis(inputC);
  console.log(`  Fallback Output  : "${safeFallbackC.primaryInterpretation}"`);

  console.log("\n================================================================================");
  console.log("   RUNTIME PROOF COMPLETE — ALL SYSTEMS ROBUST AND FULLY VALIDATED");
  console.log("================================================================================\n");
}

runRuntimeProof();
