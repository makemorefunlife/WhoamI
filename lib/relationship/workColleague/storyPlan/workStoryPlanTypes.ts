import type { Locale } from "@/lib/i18n/locale";
import type { CanonicalPairRoleMap } from "../workCanonicalRoleModel";
import type {
  MistakeResponseResult,
  RepairApologyStyleResult,
  ThinkVsDiscussResult,
  MutualGrowthResult,
  BestVsRiskyConfigResult,
} from "../workProductGapSynthesis";

export type WorkStoryChapterKey =
  | "ch1_glance"
  | "ch2_roles_rnr"
  | "ch3_style_comm"
  | "ch4_crunch_pressure"
  | "ch5_mistake_repair"
  | "ch6_mutual_growth"
  | "ch7_playbook";

export type WorkStoryChapterContract = {
  chapterKey: WorkStoryChapterKey;
  chapterNumber: number;
  title: string;
  userQuestion: string;
  narrativeGoal: string;

  /** Primary meanings assigned to this chapter */
  primaryMeanings: string[];
  /** Supporting meanings referenced in this chapter */
  supportingMeanings: string[];

  /** V1 legacy assets preserved in this chapter */
  v1Assets: string[];
  /** Phase 3/3.5 canonical V2 meanings present in this chapter */
  v2CanonicalMeanings: string[];

  /** Discrepancy notes for innate (Saju) vs current (Psych) handling */
  discrepancyNotes?: string[];

  /** Inputs provided for LLM expert synthesis */
  expertNarrativeInput?: Record<string, unknown>;
  /** Operational guidance inputs for playbook layer */
  practicalGuidanceInput?: Record<string, unknown>;

  /** Potential duplicate candidates tracked for human QA review */
  duplicateCandidates?: Array<{
    candidate: string;
    overlappingWith: string;
    disposition: "KEEP_BOTH" | "RELATED_BUT_DISTINCT" | "HUMAN_REVIEW_REQUIRED";
  }>;
};

export type WorkStoryPlanContract = {
  version: "v2_phase4";
  locale: Locale;
  canonicalRoleMap: CanonicalPairRoleMap;
  chapters: WorkStoryChapterContract[];
};
