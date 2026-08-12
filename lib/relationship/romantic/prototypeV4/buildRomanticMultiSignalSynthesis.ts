import type {
  CanonicalRelationshipStoryPlan,
  RomanticSynthesisResult,
} from "./canonicalStoryPlanTypes";

export function buildRomanticMultiSignalSynthesis(
  storyPlan: CanonicalRelationshipStoryPlan
): RomanticSynthesisResult[] {
  const results: RomanticSynthesisResult[] = [];

  const topDifferences = storyPlan.topDifferences || [];
  const attraction = storyPlan.attraction;
  const pairChemistry = storyPlan.pairChemistry;
  const primaryTension = storyPlan.primaryTension;

  const topDiffAxis = topDifferences.find((d) => d.gap >= 30);
  const decisionAxis = topDifferences.find((d) => d.axisKey === "decision_style" || d.axisKey === "energy_style" || d.gap >= 30);

  // Rule 1: Attraction High × Conflict High ("romantic.synth.attraction_conflict")
  const isHighAttraction = Boolean(attraction?.aSeeks || attraction?.bSeeks);
  const isHighConflict = Boolean(topDiffAxis);

  if (isHighAttraction && isHighConflict) {
    results.push({
      id: "synth_attraction_conflict",
      sourceClaimIds: ["attraction.match", "psych.conflict_style"],
      evidenceIds: ["attraction.units", `psych.${topDiffAxis?.axisKey}`],
      topic: "attraction_vs_friction",
      perspective: "couple",
      canonicalMeaningId: "romantic.synth.attraction_conflict",
      interactionCategory: "RELATIONSHIP_ACTIVATED",
      confidence: "high",
      narrative:
        "서로를 당기는 정서적 끌림이 강력한 만큼, 의사소통 템포와 표현 방식의 차이로 인한 감정적 마찰도 함께 고조되는 역학입니다.",
    });
  }

  // Rule 2: Bond/Attachment High × Autonomy Need High ("romantic.synth.bond_autonomy")
  if (decisionAxis && decisionAxis.gap >= 30) {
    results.push({
      id: "synth_bond_autonomy",
      sourceClaimIds: ["bond.core", "autonomy.need"],
      evidenceIds: [`psych.${decisionAxis.axisKey}`],
      topic: "closeness_vs_space",
      perspective: "couple",
      canonicalMeaningId: "romantic.synth.bond_autonomy",
      interactionCategory: "INNER_OUTER_GAP",
      confidence: "high",
      narrative:
        "서로에게 정서적 안정을 기대하면서도 개인 공간과 자율적인 결정 영역에 대한 욕구가 동시에 공존하여 조율이 필요한 패턴입니다.",
    });
  }

  // Rule 3: 11-Axis Similarity × Pair Saju Tension ("romantic.synth.similarity_hidden_tension")
  const stabRows = storyPlan.stabilizingSimilarities || [];
  const hasStabConflict = stabRows.some((s) => s.axisKey === "conflict_style" || s.axisKey === "empathy");
  const hasSajuTension = primaryTension && primaryTension.includes("마찰");

  if (hasStabConflict && hasSajuTension) {
    results.push({
      id: "synth_similarity_hidden_tension",
      sourceClaimIds: ["psych.similarity", "saju.tension"],
      evidenceIds: ["saju.primaryTension"],
      topic: "surface_similarity_deep_sensitivity",
      perspective: "couple",
      canonicalMeaningId: "romantic.synth.similarity_hidden_tension",
      interactionCategory: "CURRENTLY_SUPPRESSED",
      confidence: "medium",
      narrative:
        "평소 일상 소통 방식은 비슷하여 편안함을 느끼지만, 갈등 상황에서는 타고난 감정 예민성이 드러나 세심한 배려가 요구됩니다.",
    });
  }

  // Rule 4: Chemistry High × Stability Low ("romantic.synth.chemistry_instability")
  if (pairChemistry?.available && isHighConflict) {
    results.push({
      id: "synth_chemistry_instability",
      sourceClaimIds: ["pair.chemistry", "psych.conflict_style"],
      evidenceIds: ["pairChemistry", `psych.${topDiffAxis?.axisKey}`],
      topic: "chemistry_vs_stability",
      perspective: "couple",
      canonicalMeaningId: "romantic.synth.chemistry_instability",
      interactionCategory: "CONTEXT_SHIFT",
      confidence: "medium",
      narrative:
        "함께할 때의 연애 케미와 감정적 흥분도는 매우 높으나, 안정적인 관계 유지를 위해서는 갈등 쿨링다운 규칙이 필수적입니다.",
    });
  }

  return results;
}
