import type { SecondaryAxisKey } from "@/lib/v2/survey/types";
import { SECONDARY_AXIS_KEYS } from "@/lib/v2/survey/types";
import { classifyPsychMatchType } from "@/lib/relationship/psychMatch";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { FamilyRuleContext } from "./buildFamilyRuleContext";
import {
  FAMILY_AXIS_MAPPING,
  type FamilyPsychProjection,
  type FamilyPsychMatchType,
} from "./familyPsychDynamicsTypes";

type CeSupportResult = {
  tensionEvidences: string[];
  complementEvidences: string[];
};

function getAxisSpecificCeSignals(
  ctx: FamilyRuleContext,
  axisKey: SecondaryAxisKey
): CeSupportResult {
  const tensionEvidences: string[] = [];
  const complementEvidences: string[] = [];

  const pairFacts = ctx.canonicalPairFacts;
  const bondBand = ctx.familySignalsParent?.seal_parent?.parent_bond_band;
  const countsP = ctx.tenGod?.countsParent ?? {};
  const countsC = ctx.tenGod?.countsChild ?? {};

  const pOfficer = (countsP["정관"] ?? 0) + (countsP["편관"] ?? 0);
  const cSelf = (countsC["비견"] ?? 0) + (countsC["겁재"] ?? 0);
  const cFood = (countsC["식신"] ?? 0) + (countsC["상관"] ?? 0);
  const pSeal = (countsP["정인"] ?? 0) + (countsP["편인"] ?? 0);

  switch (axisKey) {
    case "structure":
      if (pOfficer >= 2 || bondBand === "smothering" || pairFacts.hasClash) {
        tensionEvidences.push("ce.structure.control_clash");
      }
      if (pairFacts.elementSupport.aToB || pairFacts.hasDayBranchCombine) {
        complementEvidences.push("ce.structure.element_harmony");
      }
      break;

    case "self_control":
      if (pairFacts.hasWonjinOrGuimun || pairFacts.hasChung || (countsP["상관"] ?? 0) >= 2) {
        tensionEvidences.push("ce.self_control.emotional_clash");
      }
      if (pSeal >= 2 || pairFacts.hasDayBranchCombine) {
        complementEvidences.push("ce.self_control.patience_support");
      }
      break;

    case "conflict_style":
      if (pairFacts.hasWonjinOrGuimun || pairFacts.hasDayBranchChungHyung) {
        tensionEvidences.push("ce.conflict_style.wonjin_misunderstanding");
      }
      if (pairFacts.hasDayBranchCombine || pairFacts.elementSupport.aToB) {
        complementEvidences.push("ce.conflict_style.combine_dialogue");
      }
      break;

    case "empathy":
      if ((countsP["편인"] ?? 0) >= 2 || bondBand === "distant") {
        tensionEvidences.push("ce.empathy.distant_style");
      }
      if (bondBand === "balanced" || pairFacts.elementSupport.aToB) {
        complementEvidences.push("ce.empathy.balanced_support");
      }
      break;

    case "recognition":
      if (cSelf >= 2 || pairFacts.hasHyung) {
        tensionEvidences.push("ce.recognition.pride_clash");
      }
      if (pSeal >= 2 || pairFacts.elementSupport.aToB) {
        complementEvidences.push("ce.recognition.nurturing_praise");
      }
      break;

    case "decision_style":
      if (cFood >= 2 || cSelf >= 2 || pairFacts.hasChung) {
        tensionEvidences.push("ce.decision_style.autonomy_clash");
      }
      if (pairFacts.hasDayBranchCombine || pairFacts.elementSupport.aToB) {
        complementEvidences.push("ce.decision_style.guidance_harmony");
      }
      break;

    case "energy_style":
      if (bondBand === "smothering" || (bondBand === "distant" && pairFacts.hasClash)) {
        tensionEvidences.push("ce.energy_style.space_friction");
      }
      if (bondBand === "balanced") {
        complementEvidences.push("ce.energy_style.balanced_distance");
      }
      break;

    case "resilience":
      if (pairFacts.hasWonjinOrGuimun || pairFacts.hasHyung) {
        tensionEvidences.push("ce.resilience.lingering_grudge");
      }
      if (pairFacts.hasDayBranchCombine || pairFacts.elementSupport.aToB) {
        complementEvidences.push("ce.resilience.quick_recovery");
      }
      break;

    default:
      break;
  }

  return { tensionEvidences, complementEvidences };
}

export function buildFamilyPsychDynamicsProjections(
  ctx: FamilyRuleContext,
  psychParent: PsychMasterJson,
  psychChild: PsychMasterJson
): FamilyPsychProjection[] {
  const projections: FamilyPsychProjection[] = [];

  for (const axisKey of SECONDARY_AXIS_KEYS) {
    const parentScore = psychParent.secondary_axes[axisKey];
    const childScore = psychChild.secondary_axes[axisKey];
    const gap = Math.abs(parentScore - childScore);
    const rawMatch = classifyPsychMatchType(axisKey, gap);
    const mapping = FAMILY_AXIS_MAPPING[axisKey];

    const { tensionEvidences, complementEvidences } = getAxisSpecificCeSignals(ctx, axisKey);
    const allEvidences = [...tensionEvidences, ...complementEvidences];

    let relation: FamilyPsychMatchType = "unresolved";
    let needsSynthesis = false;

    if (rawMatch === "similarity") {
      relation = "similar";
      if (tensionEvidences.length > 0) {
        needsSynthesis = true;
      }
    } else {
      if (tensionEvidences.length > 0 && complementEvidences.length === 0) {
        relation = "tension";
      } else if (complementEvidences.length > 0 && tensionEvidences.length === 0) {
        relation = "complement";
      } else if (tensionEvidences.length > 0 && complementEvidences.length > 0) {
        relation = "unresolved";
        needsSynthesis = true;
      } else {
        relation = "unresolved";
        needsSynthesis = false;
      }
    }

    projections.push({
      axis: axisKey,
      category: mapping.category,
      parentScore,
      childScore,
      gap,
      relation,
      familyMeaningId: mapping.meaningId,
      evidenceIds: allEvidences,
      targetTopics: mapping.targetTopics,
      needsSynthesis,
    });
  }

  // Ranking: Category Base + (Gap * 2) + CE Support Boost (+50)
  const categoryWeight = { CORE: 1000, SECONDARY: 500, CONTEXT_ONLY: 0 };

  projections.sort((a, b) => {
    const weightA =
      categoryWeight[a.category] + a.gap * 2 + (a.evidenceIds.length > 0 ? 50 : 0);
    const weightB =
      categoryWeight[b.category] + b.gap * 2 + (b.evidenceIds.length > 0 ? 50 : 0);
    return weightB - weightA;
  });

  return projections;
}
