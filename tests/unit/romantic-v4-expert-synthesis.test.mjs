/**
 * Automated Test Suite for Romantic V4 Expert Synthesis Layer
 */

import assert from "node:assert/strict";
import { buildActualFourCeContract } from "../../lib/relationship/romantic/prototypeV4/buildActualFourCeContract.ts";
import { buildRomanticV4PrototypePayload } from "../../lib/relationship/romantic/prototypeV4/buildRomanticV4PrototypePayload.ts";
import { buildCanonicalRelationshipStoryPlan } from "../../lib/relationship/romantic/prototypeV4/buildCanonicalRelationshipStoryPlan.ts";
import { composeCanonicalSectionNarratives } from "../../lib/relationship/romantic/prototypeV4/composeCanonicalSectionNarratives.ts";
import { buildCanonicalRomanticV4Report } from "../../lib/relationship/romantic/prototypeV4/buildCanonicalRomanticV4Report.ts";
import {
  buildAttractionSynthesisInput,
  buildDynamicsSynthesisInput,
  buildHiddenHeartsSynthesisInput,
  buildStrengthVulnerabilitySynthesisInput,
} from "../../lib/relationship/romantic/prototypeV4/expertSynthesisPrompt.ts";
import { validateExpertSynthesis } from "../../lib/relationship/romantic/prototypeV4/expertSynthesisValidator.ts";
import {
  generateDeterministicExpertSynthesis,
  generateExpertSynthesesForStoryPlan,
} from "../../lib/relationship/romantic/prototypeV4/buildExpertSynthesis.ts";

console.log("=== Romantic V4 Expert Synthesis Unit Tests ===");

const { contract } = buildActualFourCeContract("ko-KR");
const payload = buildRomanticV4PrototypePayload("complete", "ko-KR", {
  contractOverride: contract,
});

const storyPlan = buildCanonicalRelationshipStoryPlan({
  contract,
  report: payload.rawReport ?? {},
  axisResults: [],
  locale: "ko-KR",
});

// 1. Cannot invent a Ten God
{
  const input = buildAttractionSynthesisInput(storyPlan, "a_to_b");
  const fakeSynthesis = {
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
  assert.equal(validation.ok, false);
  assert.ok(validation.issues.some((i) => i.code === "technical_saju_leakage"));
}

// 2. Cannot invent combinations, clashes, or shinsal
{
  const input = buildDynamicsSynthesisInput(storyPlan, "stress");
  const fakeSynthesis = {
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
  assert.equal(validation.ok, false);
  assert.ok(validation.issues.some((i) => i.code === "technical_saju_leakage"));
}

// 3. Reject unlisted evidence
{
  const input = buildHiddenHeartsSynthesisInput(storyPlan, "a");
  const fakeSynthesis = {
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
  assert.equal(validation.ok, false);
  assert.ok(validation.issues.some((i) => i.code === "unlisted_evidence_cited"));
}

// 4. Directionality mismatch rejected
{
  const input = buildAttractionSynthesisInput(storyPlan, "a_to_b");
  const fakeSynthesis = {
    synthesisId: "fake-7",
    chapterId: "c2_attraction",
    direction: "b_to_a",
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
  assert.equal(validation.ok, false);
  assert.ok(validation.issues.some((i) => i.code === "direction_mismatch"));
}

// 5. Fallback works on invalid / null LLM outputs
{
  const invalidCustomSyntheses = {
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
      interpretationType: "grounded",
      confidence: "high",
      missingEvidence: [],
      forbiddenClaimsAvoided: [],
    },
  };

  const syntheses = generateExpertSynthesesForStoryPlan(storyPlan, invalidCustomSyntheses);
  assert.ok(syntheses["c2_attraction.a_to_b"]);
  assert.ok(syntheses["c2_attraction.a_to_b"].primaryInterpretation.includes("통찰력"));
  assert.ok(syntheses["c2_attraction.b_to_a"]);
  assert.ok(syntheses["c2_attraction.b_to_a"].primaryInterpretation.includes("중심"));

  const sections = composeCanonicalSectionNarratives(storyPlan, syntheses);
  const attr = sections.find((s) => s.chapterId === "c2_attraction");
  assert.ok(attr);
  assert.ok(attr.blocks[0].body.includes("지민은 정우의 깊은 통찰력"));
}

console.log("All romantic v4 expert synthesis unit tests passed!");
