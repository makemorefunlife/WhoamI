import { describe, it, expect } from "vitest";
import { buildActualFourCeContract } from "../../lib/relationship/romantic/prototypeV4/buildActualFourCeContract";
import { buildRomanticV4PrototypePayload } from "../../lib/relationship/romantic/prototypeV4/buildRomanticV4PrototypePayload";
import { buildCanonicalRelationshipStoryPlan } from "../../lib/relationship/romantic/prototypeV4/buildCanonicalRelationshipStoryPlan";
import { composeCanonicalSectionNarratives } from "../../lib/relationship/romantic/prototypeV4/composeCanonicalSectionNarratives";
import { buildCanonicalRomanticV4Report } from "../../lib/relationship/romantic/prototypeV4/buildCanonicalRomanticV4Report";
import {
  buildAttractionSynthesisInput,
  buildDynamicsSynthesisInput,
  buildHiddenHeartsSynthesisInput,
  buildStrengthVulnerabilitySynthesisInput,
} from "../../lib/relationship/romantic/prototypeV4/expertSynthesisPrompt";
import { validateExpertSynthesis } from "../../lib/relationship/romantic/prototypeV4/expertSynthesisValidator";
import {
  generateDeterministicExpertSynthesis,
  generateExpertSynthesesForStoryPlan,
} from "../../lib/relationship/romantic/prototypeV4/buildExpertSynthesis";
import type { ExpertSynthesisResult } from "../../lib/relationship/romantic/prototypeV4/expertSynthesisTypes";

describe("Romantic V4 Expert Synthesis Layer", () => {
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

  // 1. Expert synthesis cannot invent a Ten God (jargon/unsupported signal)
  it("1. Rejects synthesis containing invented Ten Gods or raw Saju terms in visible prose", () => {
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
    expect(validation.ok).toBe(false);
    expect(validation.issues.some((i) => i.code === "technical_saju_leakage")).toBe(true);
    expect(validation.fallbackRequired).toBe(true);
  });

  // 2. Expert synthesis cannot invent combinations, clashes, or shinsal
  it("2. Rejects synthesis that invents clashes, combinations, or shinsal in visible prose", () => {
    const input = buildDynamicsSynthesisInput(storyPlan, "stress");
    const fakeSynthesis: ExpertSynthesisResult = {
      synthesisId: "fake-2",
      chapterId: "c3_dynamics",
      direction: "mutual",
      primaryInterpretation: "두 사람은 지지의 자오충과 역마살의 영향으로 충돌합니다.",
      expertSynthesis: "원진살이 작용하여 스트레스가 가중됩니다.",
      interactionMechanism: "신살의 작용을 조심해야 합니다.",
      usedClaimIds: [],
      usedEvidenceIds: ["chart.a.johu.stress"],
      contradictingEvidenceIds: [],
      interpretationType: "grounded",
      confidence: "high",
      missingEvidence: [],
      forbiddenClaimsAvoided: [],
    };

    const validation = validateExpertSynthesis(fakeSynthesis, input);
    expect(validation.ok).toBe(false);
    expect(validation.issues.some((i) => i.code === "technical_saju_leakage")).toBe(true);
  });

  // 3. Expert synthesis cannot cite nonexistent evidence
  it("3. Rejects synthesis that cites evidence IDs not provided in the input contract", () => {
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
    expect(validation.ok).toBe(false);
    expect(validation.issues.some((i) => i.code === "unlisted_evidence_cited")).toBe(true);
  });

  // 4. expert_synthesis requires multiple independent evidence sources
  it("4. Rejects 'expert_synthesis' interpretation type if fewer than 2 evidence IDs are cited", () => {
    const input = buildAttractionSynthesisInput(storyPlan, "a_to_b");
    const fakeSynthesis: ExpertSynthesisResult = {
      synthesisId: "fake-4",
      chapterId: "c2_attraction",
      direction: "a_to_b",
      primaryInterpretation: "지민은 정우의 침착함에 자연스럽게 눈길이 머뭅니다.",
      expertSynthesis: "사려 깊은 통찰이 안정감을 줍니다.",
      interactionMechanism: "따뜻한 지지를 형성합니다.",
      usedClaimIds: ["claim.attr.a.recognition"],
      usedEvidenceIds: ["chart.b.day_master"], // only 1 evidence ID
      contradictingEvidenceIds: [],
      interpretationType: "expert_synthesis",
      confidence: "high",
      missingEvidence: [],
      forbiddenClaimsAvoided: [],
    };

    const validation = validateExpertSynthesis(fakeSynthesis, input);
    expect(validation.ok).toBe(false);
    expect(validation.issues.some((i) => i.code === "insufficient_synthesis_evidence")).toBe(true);
  });

  // 5. conditional_hypothesis remains conditional
  it("5. Rejects 'conditional_hypothesis' when it lacks required conditional phrasing", () => {
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
    expect(validation.ok).toBe(false);
    expect(validation.issues.some((i) => i.code === "missing_conditional_phrasing")).toBe(true);
  });

  // 6. low-confidence synthesis cannot become primary / grounded
  it("6. Rejects grounded interpretation type when input contract has low confidence", () => {
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
    expect(validation.ok).toBe(false);
    expect(validation.issues.some((i) => i.code === "low_confidence_overclaim")).toBe(true);
  });

  // 7. directionality remains correct
  it("7. Rejects synthesis if chapter direction is mismatched", () => {
    const input = buildAttractionSynthesisInput(storyPlan, "a_to_b");
    const fakeSynthesis: ExpertSynthesisResult = {
      synthesisId: "fake-7",
      chapterId: "c2_attraction",
      direction: "b_to_a", // wrong direction
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
    expect(validation.ok).toBe(false);
    expect(validation.issues.some((i) => i.code === "direction_mismatch")).toBe(true);
  });

  // 8. chapter ownership remains intact
  it("8. Rejects synthesis if chapter ID is mismatched", () => {
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
    expect(validation.ok).toBe(false);
    expect(validation.issues.some((i) => i.code === "chapter_mismatch")).toBe(true);
  });

  // 9. LLM failure falls back to deterministic V4 narrative
  it("9. Gracefully falls back to deterministic narrative when custom synthesis fails validation", () => {
    const invalidCustomSyntheses = {
      "c2_attraction.a_to_b": null, // null triggers fallback
      "c2_attraction.b_to_a": {
        synthesisId: "bad",
        chapterId: "c2_attraction",
        direction: "b_to_a",
        primaryInterpretation: "정관과 편인의 조화", // Jargon triggers rejection & fallback
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

    const syntheses = generateExpertSynthesesForStoryPlan(storyPlan, invalidCustomSyntheses);
    expect(syntheses["c2_attraction.a_to_b"]).toBeDefined();
    expect(syntheses["c2_attraction.a_to_b"].primaryInterpretation).toContain("통찰력");
    expect(syntheses["c2_attraction.b_to_a"]).toBeDefined();
    expect(syntheses["c2_attraction.b_to_a"].primaryInterpretation).toContain("중심");

    const sections = composeCanonicalSectionNarratives(storyPlan, syntheses);
    const attr = sections.find((s) => s.chapterId === "c2_attraction");
    expect(attr).toBeDefined();
    expect(attr?.blocks[0].body).toContain("지민은 정우의 깊은 통찰력");
  });

  // 10. malformed JSON is rejected
  it("10. Rejects null, undefined, or empty synthesis objects", () => {
    const input = buildAttractionSynthesisInput(storyPlan, "a_to_b");
    const validation = validateExpertSynthesis(null, input);
    expect(validation.ok).toBe(false);
    expect(validation.fallbackRequired).toBe(true);
  });

  // 11. forbidden fate, biography, health, infidelity, money, and timing claims are rejected
  it("11. Rejects fortune telling, infidelity, trauma, and deterministic fate predictions", () => {
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
    expect(validation.ok).toBe(false);
    expect(validation.issues.some((i) => i.code === "forbidden_fate_or_diagnostic_claims")).toBe(true);
  });

  // 12. user-facing prose contains no technical Saju leakage
  it("12. Confirms deterministic syntheses contain zero technical Saju jargon in visible prose", () => {
    const syntheses = generateExpertSynthesesForStoryPlan(storyPlan);
    const TECHNICAL_REGEX = /(편인|정인|비견|겁재|식신|상관|편재|정재|편관|정관|용신|신살|천간|지지|일간|일지|조후)/;

    for (const [key, synth] of Object.entries(syntheses)) {
      const fullText = [
        synth.primaryInterpretation,
        synth.expertSynthesis,
        synth.interactionMechanism,
        synth.conditionalNuance ?? "",
      ].join(" ");

      expect(TECHNICAL_REGEX.test(fullText)).toBe(false);
    }
  });

  // 13. final narrative retains original claim and evidence provenance
  it("13. Preserves original claim and evidence provenance in composed sections", () => {
    const report = buildCanonicalRomanticV4Report("ko-KR");
    expect(report.validation.ok).toBe(true);
    expect(report.sections.length).toBeGreaterThanOrEqual(8);

    const attractionSection = report.sections.find((s) => s.chapterId === "c2_attraction");
    expect(attractionSection).toBeDefined();
    expect(attractionSection?.blocks[0].evidenceIds.length).toBeGreaterThanOrEqual(1);
    expect(attractionSection?.blocks[0].expertSynthesis).toBeDefined();

    const dynamicsSection = report.sections.find((s) => s.chapterId === "c3_dynamics");
    expect(dynamicsSection).toBeDefined();
    expect(dynamicsSection?.blocks[0].evidenceIds.length).toBeGreaterThanOrEqual(1);

    const hiddenHeartsSection = report.sections.find((s) => s.chapterId === "c6_hidden_hearts");
    expect(hiddenHeartsSection).toBeDefined();
    expect(hiddenHeartsSection?.blocks[0].evidenceIds.length).toBeGreaterThanOrEqual(1);

    const strengthSection = report.sections.find((s) => s.chapterId === "c8_strength_vulnerability");
    expect(strengthSection).toBeDefined();
    expect(strengthSection?.blocks[0].evidenceIds.length).toBeGreaterThanOrEqual(1);
  });

  // 14. existing Attraction, Dynamics, Hidden Hearts, and Strength tests continue to pass
  it("14. Produces valid full report with complete sections and passes all validation rules", () => {
    const report = buildCanonicalRomanticV4Report("ko-KR");
    expect(report.validation.ok).toBe(true);
    expect(report.validation.issues.filter((i) => i.severity === "error").length).toBe(0);
  });
});
