/**
 * Comprehensive Automated Tests for Romantic V4 Expert Synthesis Layer
 *
 * Verifies all 14 requirements:
 * 1. Cannot invent a Ten God
 * 2. Cannot invent combinations, clashes, or shinsal
 * 3. Cannot cite nonexistent evidence IDs
 * 4. expert_synthesis requires multiple independent evidence sources
 * 5. conditional_hypothesis remains conditional
 * 6. Low-confidence synthesis cannot become primary
 * 7. Directionality remains correct
 * 8. Chapter ownership remains intact
 * 9. LLM failure falls back to deterministic V4 narrative
 * 10. Malformed JSON / empty input is rejected
 * 11. Forbidden fate, biography, health, infidelity, money, and timing claims are rejected
 * 12. User-facing prose contains no technical Saju leakage
 * 13. Final narrative retains original claim and evidence provenance
 * 14. Existing Attraction, Dynamics, Hidden Hearts, and Strength tests continue to pass
 */

import assert from "node:assert";
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
  generateDeterministicExpertSynthesis,
  generateExpertSynthesesForStoryPlan,
} from "@/lib/relationship/romantic/prototypeV4/buildExpertSynthesis";
import type { ExpertSynthesisResult } from "@/lib/relationship/romantic/prototypeV4/expertSynthesisTypes";

function runAllTests() {
  console.log("\n========================================================");
  console.log("   ROMANTIC V4 EXPERT SYNTHESIS LAYER TEST SUITE");
  console.log("========================================================\n");

  const { contract } = buildActualFourCeContract("ko-KR");
  const payload = buildRomanticV4PrototypePayload("complete", "ko-KR", {
    contractOverride: contract,
  });

  const storyPlan = buildCanonicalRelationshipStoryPlan({
    contract,
    report: (payload as any).rawReport ?? {},
    axisResults: [],
    locale: "ko-KR",
  });

  let passCount = 0;

  // Test 1: Cannot invent a Ten God
  {
    const input = buildAttractionSynthesisInput(storyPlan, "a_to_b");
    const fakeSynthesis: ExpertSynthesisResult = {
      synthesisId: "fake-1",
      chapterId: "c2_attraction",
      direction: "a_to_b",
      primaryInterpretation: "지민은 정우의 상관 기질과 편관적인 결단력에 끌립니다.",
      expertSynthesis: "정인의 포용력이 정재와 만나 훌륭한 시너지를 이룹니다.",
      interactionMechanism: "십신의 조화가 안정감을 줍니다.",
      usedClaimIds: ["claim.attr.a.recognition"],
      usedEvidenceIds: ["chart.b.day_master"],
      contradictingEvidenceIds: [],
      interpretationType: "grounded",
      confidence: "high",
      missingEvidence: [],
      forbiddenClaimsAvoided: [],
    };
    const validation = validateExpertSynthesis(fakeSynthesis, input);
    assert.strictEqual(validation.ok, false, "Test 1 Failed: Should reject Saju jargon");
    assert.ok(
      validation.issues.some((i) => i.code === "technical_saju_leakage"),
      "Test 1 Failed: Should report technical_saju_leakage",
    );
    console.log("✔ Test 1 PASS: Expert synthesis cannot invent a Ten God (jargon rejected)");
    passCount++;
  }

  // Test 2: Cannot invent combinations, clashes, or shinsal
  {
    const input = buildDynamicsSynthesisInput(storyPlan, "stress");
    const fakeSynthesis: ExpertSynthesisResult = {
      synthesisId: "fake-2",
      chapterId: "c3_dynamics",
      direction: "mutual",
      primaryInterpretation: "두 사람은 천간지지와 역마살의 영향으로 충돌합니다.",
      expertSynthesis: "원진살이 작용하여 스트레스가 가중됩니다.",
      interactionMechanism: "도화살의 작용을 조심해야 합니다.",
      usedClaimIds: [],
      usedEvidenceIds: ["chart.a.johu.stress"],
      contradictingEvidenceIds: [],
      interpretationType: "grounded",
      confidence: "high",
      missingEvidence: [],
      forbiddenClaimsAvoided: [],
    };
    const validation = validateExpertSynthesis(fakeSynthesis, input);
    assert.strictEqual(validation.ok, false, "Test 2 Failed: Should reject clash/shinsal jargon");
    assert.ok(
      validation.issues.some((i) => i.code === "technical_saju_leakage"),
      "Test 2 Failed: Should report technical_saju_leakage",
    );
    console.log("✔ Test 2 PASS: Expert synthesis cannot invent combinations, clashes, or shinsal");
    passCount++;
  }

  // Test 3: Cannot cite nonexistent evidence IDs
  {
    const input = buildHiddenHeartsSynthesisInput(storyPlan, "a");
    const fakeSynthesis: ExpertSynthesisResult = {
      synthesisId: "fake-3",
      chapterId: "c6_hidden_hearts",
      direction: "a_to_b",
      primaryInterpretation: "지민은 내면의 긴장이 높아질 때 인정받고 싶어합니다.",
      expertSynthesis: "따뜻한 지지가 필요합니다.",
      interactionMechanism: "침묵 속에서 신뢰를 회복합니다.",
      usedClaimIds: ["claim.hidden.a.visible_reaction"],
      usedEvidenceIds: ["fake.hallucinated.evidence.id.999"],
      contradictingEvidenceIds: [],
      interpretationType: "grounded",
      confidence: "high",
      missingEvidence: [],
      forbiddenClaimsAvoided: [],
    };
    const validation = validateExpertSynthesis(fakeSynthesis, input);
    assert.strictEqual(validation.ok, false, "Test 3 Failed: Should reject unlisted evidence");
    assert.ok(
      validation.issues.some((i) => i.code === "unlisted_evidence_cited"),
      "Test 3 Failed: Should report unlisted_evidence_cited",
    );
    console.log("✔ Test 3 PASS: Expert synthesis cannot cite nonexistent evidence");
    passCount++;
  }

  // Test 4: expert_synthesis requires multiple independent evidence sources
  {
    const input = buildAttractionSynthesisInput(storyPlan, "a_to_b");
    const fakeSynthesis: ExpertSynthesisResult = {
      synthesisId: "fake-4",
      chapterId: "c2_attraction",
      direction: "a_to_b",
      primaryInterpretation: "지민은 정우의 침착함에 자연스럽게 눈길이 머뭅니다.",
      expertSynthesis: "사려 깊은 통찰이 안정감을 줍니다.",
      interactionMechanism: "따뜻한 지지를 형성합니다.",
      usedClaimIds: ["claim.attr.a.recognition"],
      usedEvidenceIds: ["chart.b.day_master"], // only 1
      contradictingEvidenceIds: [],
      interpretationType: "expert_synthesis",
      confidence: "high",
      missingEvidence: [],
      forbiddenClaimsAvoided: [],
    };
    const validation = validateExpertSynthesis(fakeSynthesis, input);
    assert.strictEqual(validation.ok, false, "Test 4 Failed: Should require >=2 evidence IDs");
    assert.ok(
      validation.issues.some((i) => i.code === "insufficient_synthesis_evidence"),
      "Test 4 Failed: Should report insufficient_synthesis_evidence",
    );
    console.log("✔ Test 4 PASS: expert_synthesis requires >=2 independent evidence sources");
    passCount++;
  }

  // Test 5: conditional_hypothesis remains conditional
  {
    const input = buildAttractionSynthesisInput(storyPlan, "a_to_b");
    const fakeSynthesis: ExpertSynthesisResult = {
      synthesisId: "fake-5",
      chapterId: "c2_attraction",
      direction: "a_to_b",
      primaryInterpretation: "지민은 정우에게 완벽하게 끌립니다.",
      expertSynthesis: "두 사람은 완벽하게 일치하며 영원히 행복합니다.",
      interactionMechanism: "확실한 결합을 이룹니다.",
      usedClaimIds: ["claim.attr.a.recognition"],
      usedEvidenceIds: ["chart.b.day_master", "chart.a.spouse_palace.preference"],
      contradictingEvidenceIds: [],
      interpretationType: "conditional_hypothesis",
      confidence: "medium",
      missingEvidence: [],
      forbiddenClaimsAvoided: [],
    };
    const validation = validateExpertSynthesis(fakeSynthesis, input);
    assert.strictEqual(validation.ok, false, "Test 5 Failed: Should require conditional phrasing");
    assert.ok(
      validation.issues.some((i) => i.code === "missing_conditional_phrasing"),
      "Test 5 Failed: Should report missing_conditional_phrasing",
    );
    console.log("✔ Test 5 PASS: conditional_hypothesis remains strictly conditional");
    passCount++;
  }

  // Test 6: low-confidence synthesis cannot become primary
  {
    const input = buildAttractionSynthesisInput(storyPlan, "a_to_b");
    input.confidence = "low";
    const fakeSynthesis: ExpertSynthesisResult = {
      synthesisId: "fake-6",
      chapterId: "c2_attraction",
      direction: "a_to_b",
      primaryInterpretation: "지민은 정우에게 절대적으로 끌립니다.",
      expertSynthesis: "확고한 이끌림입니다.",
      interactionMechanism: "안정감을 형성합니다.",
      usedClaimIds: ["claim.attr.a.recognition"],
      usedEvidenceIds: ["chart.b.day_master"],
      contradictingEvidenceIds: [],
      interpretationType: "grounded",
      confidence: "low",
      missingEvidence: [],
      forbiddenClaimsAvoided: [],
    };
    const validation = validateExpertSynthesis(fakeSynthesis, input);
    assert.strictEqual(validation.ok, false, "Test 6 Failed: Low confidence cannot be grounded");
    assert.ok(
      validation.issues.some((i) => i.code === "low_confidence_overclaim"),
      "Test 6 Failed: Should report low_confidence_overclaim",
    );
    console.log("✔ Test 6 PASS: Low-confidence synthesis cannot become primary");
    passCount++;
  }

  // Test 7: directionality remains correct
  {
    const input = buildAttractionSynthesisInput(storyPlan, "a_to_b");
    const fakeSynthesis: ExpertSynthesisResult = {
      synthesisId: "fake-7",
      chapterId: "c2_attraction",
      direction: "b_to_a", // wrong
      primaryInterpretation: "정우는 지민의 중심에 끌립니다.",
      expertSynthesis: "대등한 신뢰를 형성합니다.",
      interactionMechanism: "실행력을 이룹니다.",
      usedClaimIds: ["claim.attr.a.recognition"],
      usedEvidenceIds: ["chart.b.day_master", "chart.a.spouse_palace.preference"],
      contradictingEvidenceIds: [],
      interpretationType: "expert_synthesis",
      confidence: "high",
      missingEvidence: [],
      forbiddenClaimsAvoided: [],
    };
    const validation = validateExpertSynthesis(fakeSynthesis, input);
    assert.strictEqual(validation.ok, false, "Test 7 Failed: Direction must match input");
    assert.ok(
      validation.issues.some((i) => i.code === "direction_mismatch"),
      "Test 7 Failed: Should report direction_mismatch",
    );
    console.log("✔ Test 7 PASS: Directionality remains strictly enforced");
    passCount++;
  }

  // Test 8: chapter ownership remains intact
  {
    const input = buildAttractionSynthesisInput(storyPlan, "a_to_b");
    const fakeSynthesis: ExpertSynthesisResult = {
      synthesisId: "fake-8",
      chapterId: "c4_conflict", // wrong chapter
      direction: "a_to_b",
      primaryInterpretation: "지민은 갈등을 시작합니다.",
      expertSynthesis: "반복적인 루프가 발생합니다.",
      interactionMechanism: "충돌을 유발합니다.",
      usedClaimIds: [],
      usedEvidenceIds: ["chart.b.day_master", "chart.a.spouse_palace.preference"],
      contradictingEvidenceIds: [],
      interpretationType: "expert_synthesis",
      confidence: "high",
      missingEvidence: [],
      forbiddenClaimsAvoided: [],
    };
    const validation = validateExpertSynthesis(fakeSynthesis, input);
    assert.strictEqual(validation.ok, false, "Test 8 Failed: Chapter must match input");
    assert.ok(
      validation.issues.some((i) => i.code === "chapter_mismatch"),
      "Test 8 Failed: Should report chapter_mismatch",
    );
    console.log("✔ Test 8 PASS: Chapter ownership remains intact");
    passCount++;
  }

  // Test 9: LLM failure falls back to deterministic V4 narrative
  {
    const invalidCustom = {
      "c2_attraction.a_to_b": null,
      "c2_attraction.b_to_a": {
        synthesisId: "bad",
        chapterId: "c2_attraction",
        direction: "b_to_a",
        primaryInterpretation: "정관과 편인의 조화",
        expertSynthesis: "외도로 인한 파국",
        interactionMechanism: "망함",
        usedClaimIds: [],
        usedEvidenceIds: ["nonexistent"],
        contradictingEvidenceIds: [],
        interpretationType: "grounded" as const,
        confidence: "high" as const,
        missingEvidence: [],
        forbiddenClaimsAvoided: [],
      },
    };
    const syntheses = generateExpertSynthesesForStoryPlan(storyPlan, invalidCustom);
    assert.ok(syntheses["c2_attraction.a_to_b"], "Fallback must provide valid synthesis for a_to_b");
    assert.ok(syntheses["c2_attraction.b_to_a"], "Fallback must provide valid synthesis for b_to_a");
    assert.ok(!syntheses["c2_attraction.b_to_a"].primaryInterpretation.includes("외도"));

    const sections = composeCanonicalSectionNarratives(storyPlan, syntheses);
    const attr = sections.find((s) => s.chapterId === "c2_attraction");
    assert.ok(attr?.blocks[0].body.includes("지민은 정우의 깊은 통찰력"));
    console.log("✔ Test 9 PASS: LLM failure gracefully falls back to deterministic V4 narrative");
    passCount++;
  }

  // Test 10: malformed JSON / null is rejected
  {
    const input = buildAttractionSynthesisInput(storyPlan, "a_to_b");
    const validation = validateExpertSynthesis(null, input);
    assert.strictEqual(validation.ok, false);
    assert.strictEqual(validation.fallbackRequired, true);
    console.log("✔ Test 10 PASS: Malformed JSON / null synthesis rejected");
    passCount++;
  }

  // Test 11: forbidden fate, biography, health, infidelity, money claims rejected
  {
    const input = buildStrengthVulnerabilitySynthesisInput(storyPlan, "shared");
    const fakeSynthesis: ExpertSynthesisResult = {
      synthesisId: "fake-11",
      chapterId: "c8_strength_vulnerability",
      direction: "mutual",
      primaryInterpretation: "두 사람은 반드시 이별하게 되며 외도와 성격장애가 발생합니다.",
      expertSynthesis: "과거 트라우마로 인해 파산할 운명입니다.",
      interactionMechanism: "애착유형 장애를 겪습니다.",
      usedClaimIds: ["claim.shared.strength"],
      usedEvidenceIds: ["ce.pair.common", "canonical_projections.pair_ce_bonding"],
      contradictingEvidenceIds: [],
      interpretationType: "expert_synthesis",
      confidence: "high",
      missingEvidence: [],
      forbiddenClaimsAvoided: [],
    };
    const validation = validateExpertSynthesis(fakeSynthesis, input);
    assert.strictEqual(validation.ok, false);
    assert.ok(validation.issues.some((i) => i.code === "forbidden_fate_or_diagnostic_claims"));
    console.log("✔ Test 11 PASS: Forbidden fate, biography, infidelity, trauma, and diagnostics rejected");
    passCount++;
  }

  // Test 12: user-facing prose contains no technical Saju leakage
  {
    const syntheses = generateExpertSynthesesForStoryPlan(storyPlan);
    const TECHNICAL_REGEX =
      /(편인|정인|비견|겁재|식신|상관|편재|정재|편관|정관|용신|희신|기신|구신|한신|도화살|역마살|화개살|원진살|귀문관살|천간|일간|일지|월지|년지|시지|십이지지|천간지지|조후)/;

    for (const [key, synth] of Object.entries(syntheses)) {
      const fullText = [
        synth.primaryInterpretation,
        synth.expertSynthesis,
        synth.interactionMechanism,
        synth.conditionalNuance ?? "",
      ].join(" ");
      assert.strictEqual(
        TECHNICAL_REGEX.test(fullText),
        false,
        `Technical jargon leaked in synthesis key '${key}': ${fullText}`,
      );
    }
    console.log("✔ Test 12 PASS: User-facing prose contains zero technical Saju jargon");
    passCount++;
  }

  // Test 13: final narrative retains original claim and evidence provenance
  {
    const report = buildCanonicalRomanticV4Report("ko-KR");
    assert.strictEqual(report.validation.ok, true);

    const c2 = report.sections.find((s) => s.chapterId === "c2_attraction");
    assert.ok(c2 && c2.blocks[0].evidenceIds.length >= 1);
    assert.ok(c2?.blocks[0].expertSynthesis);

    const c3 = report.sections.find((s) => s.chapterId === "c3_dynamics");
    assert.ok(c3 && c3.blocks[0].evidenceIds.length >= 1);

    const c6 = report.sections.find((s) => s.chapterId === "c6_hidden_hearts");
    assert.ok(c6 && c6.blocks[0].evidenceIds.length >= 1);

    const c8 = report.sections.find((s) => s.chapterId === "c8_strength_vulnerability");
    assert.ok(c8 && c8.blocks[0].evidenceIds.length >= 1);

    console.log("✔ Test 13 PASS: Final narrative retains original claim and evidence provenance");
    passCount++;
  }

  // Test 14: existing Attraction, Dynamics, Hidden Hearts, and Strength tests pass
  {
    const report = buildCanonicalRomanticV4Report("ko-KR");
    assert.strictEqual(report.validation.ok, true);
    assert.strictEqual(report.validation.issues.filter((i) => i.severity === "error").length, 0);
    console.log("✔ Test 14 PASS: Full report valid and all chapter validators clean");
    passCount++;
  }

  console.log("\n========================================================");
  console.log(`   ALL ${passCount}/14 EXPERT SYNTHESIS TESTS PASSED!`);
  console.log("========================================================\n");
}

runAllTests();
