import type { SecondaryAxisKey } from "@/lib/v2/survey/types";
import type { FamilyTopic } from "./familyStoryPlanTypes";

export type FamilyAxisCategory = "CORE" | "SECONDARY" | "CONTEXT_ONLY";

export type FamilyPsychMatchType =
  | "similar"
  | "complement"
  | "tension"
  | "context_shift"
  | "unresolved"
  | "aligned";

export type FamilyPsychProjection = {
  axis: SecondaryAxisKey;
  category: FamilyAxisCategory;
  parentScore: number;
  childScore: number;
  gap: number;
  /**
   * - similar: gap < P60
   * - complement: gap >= P60 && supported by Pair CE
   * - tension: gap >= P60 && conflict evidence
   * - context_shift / unresolved: gap >= P60 but CE doesn't clearly support tension/complement (needsSynthesis = true)
   */
  relation: FamilyPsychMatchType;
  familyMeaningId: string;
  evidenceIds: string[];
  targetTopics: FamilyTopic[];
  needsSynthesis: boolean;
};

export const FAMILY_AXIS_MAPPING: Record<
  SecondaryAxisKey,
  {
    category: FamilyAxisCategory;
    meaningId: string;
    targetTopics: FamilyTopic[];
  }
> = {
  structure: {
    category: "CORE",
    meaningId: "planning.routine",
    targetTopics: ["discipline", "achievement", "autonomy"],
  },
  self_control: {
    category: "CORE",
    meaningId: "control.emotion",
    targetTopics: ["discipline", "conflict"],
  },
  conflict_style: {
    category: "CORE",
    meaningId: "conflict.approach",
    targetTopics: ["conflict", "deepRead"],
  },
  empathy: {
    category: "CORE",
    meaningId: "empathy.response",
    targetTopics: ["bond", "deepRead"],
  },
  recognition: {
    category: "CORE",
    meaningId: "approval.praise",
    targetTopics: ["achievement", "growth"],
  },
  decision_style: {
    category: "CORE",
    meaningId: "decision.wait",
    targetTopics: ["autonomy", "growth"],
  },
  energy_style: {
    category: "SECONDARY",
    meaningId: "energy.recharge",
    targetTopics: ["safeDistance", "bond", "autonomy"],
  },
  resilience: {
    category: "SECONDARY",
    meaningId: "resilience.recovery",
    targetTopics: ["conflict", "actions"],
  },
  stimulation: {
    category: "CONTEXT_ONLY",
    meaningId: "novelty.experience",
    targetTopics: [],
  },
  practicality: {
    category: "CONTEXT_ONLY",
    meaningId: "realism.reward",
    targetTopics: [],
  },
  thinking_style: {
    category: "CONTEXT_ONLY",
    meaningId: "analytical.logic",
    targetTopics: [],
  },
};
