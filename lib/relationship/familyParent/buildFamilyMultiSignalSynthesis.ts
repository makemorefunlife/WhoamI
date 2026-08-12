import type { FamilyRuleContext } from "./buildFamilyRuleContext";
import type {
  FamilyClaim,
  FamilySynthesisResult,
} from "./familyStoryPlanTypes";
import type { FamilyPsychProjection } from "./familyPsychDynamicsTypes";

export function buildFamilyMultiSignalSynthesis(
  ctx: FamilyRuleContext,
  selectedClaims: FamilyClaim[],
  psychProjections: FamilyPsychProjection[]
): FamilySynthesisResult[] {
  const results: FamilySynthesisResult[] = [];

  const bondClaim = selectedClaims.find((c) => c.id === "core.bond");
  const riskClaim = selectedClaims.find((c) => c.id === "core.risk");
  const conflictProj = psychProjections.find((p) => p.axis === "conflict_style");
  const structureProj = psychProjections.find((p) => p.axis === "structure");

  // 1. Deterministic Composite: High Bond x High Risk / Discipline Clash
  if (bondClaim?.polarity === "strength" && riskClaim?.polarity === "risk") {
    results.push({
      id: "synth.bond_discipline_clash",
      sourceClaimIds: [bondClaim.id, riskClaim.id],
      evidenceIds: ["masterScores.bond.high", "masterScores.risk.high"],
      synthesisType: "deterministic",
      topic: "deepRead",
      perspective: "shared",
      canonicalMeaningId: "synth.high_bond_high_risk",
      confidence: "high",
      narrative:
        "정서적 애착은 매우 단단하지만, 일상적 규율이나 기준을 맞추는 과정에서는 기대치와 방식의 차이로 마찰이 생길 수 있는 관계입니다.",
      innateVsCurrentCategory: "INNER_OUTER_GAP",
    });
  }

  // 2. Deterministic Composite: Innate Wonjin/Guimun x 11-Axis Similar Conflict Style
  if (ctx.canonicalPairFacts.hasWonjinOrGuimun && conflictProj?.relation === "similar") {
    results.push({
      id: "synth.innate_wonjin_current_similar",
      sourceClaimIds: ["wonjin_guimun", `psych.${conflictProj.axis}`],
      evidenceIds: ["canonical.wonjin", `psych.${conflictProj.axis}`],
      synthesisType: "deterministic",
      topic: "conflict",
      perspective: "pair",
      canonicalMeaningId: "synth.innate_wonjin_similar_behavior",
      confidence: "high",
      narrative:
        "본래 타고난 서운함과 감정의 앙금이 남기 쉬운 기질(원진)이 존재하지만, 일상 소통에서는 서로 유사한 반응 속도와 대화 패턴을 공유하는 조합입니다.",
      innateVsCurrentCategory: "CONTEXT_SHIFT",
    });
  }

  // 3. Protection x Autonomy Clash (Parent Officer vs Child Autonomy)
  if (structureProj?.relation === "tension" && ctx.canonicalPairFacts.hasClash) {
    results.push({
      id: "synth.protection_autonomy_clash",
      sourceClaimIds: [`psych.${structureProj.axis}`, "canonical.clash"],
      evidenceIds: ["ce.structure.control_clash", "canonical.clash"],
      synthesisType: "deterministic",
      topic: "discipline",
      perspective: "parent",
      canonicalMeaningId: "synth.protection_vs_autonomy",
      confidence: "high",
      narrative:
        "부모의 보호 및 지침 제시와 자녀의 자율성 요구가 충돌할 때, 통제가 아닌 명확한 안전지대 합의로 대응하는 것이 효과적입니다.",
      innateVsCurrentCategory: "RELATIONSHIP_ACTIVATED",
    });
  }

  // 4. Behavioral Gap x Day Branch Combine
  if (structureProj?.gap && structureProj.gap >= 60 && ctx.canonicalPairFacts.hasDayBranchCombine) {
    results.push({
      id: "synth.gap_with_day_combine",
      sourceClaimIds: [`psych.${structureProj.axis}`, "day_combine"],
      evidenceIds: [`psych.${structureProj.axis}`, "canonical.day_combine"],
      synthesisType: "deterministic",
      topic: "growth",
      perspective: "shared",
      canonicalMeaningId: "synth.difference_complemented_by_combine",
      confidence: "high",
      narrative:
        "생활 방식과 일정 관리의 차이는 존재하지만, 일지 육합의 깊은 애착 결합으로 서로의 차이를 자연스럽게 포용하는 관계입니다.",
      innateVsCurrentCategory: "CURRENTLY_AMPLIFIED",
    });
  }

  return results;
}
