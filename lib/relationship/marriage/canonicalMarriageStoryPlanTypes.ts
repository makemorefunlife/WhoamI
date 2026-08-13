import type { Locale } from "@/lib/i18n/locale";
import type {
  MarriageCanonicalBundle,
  HouseholdPmResult,
  PlannerExecutorResult,
  DecisionPowerMapResult,
  CrisisRoleResult,
  CareerHomeResult,
  LongTermCompoundingResult,
  LifePartnershipVerdictResult,
  DiscrepancyTrace,
  CandidateContractItem,
} from "./marriageCanonicalTypes";

/**
 * Marriage V2 Canonical StoryPlan Output Contract
 */

export type MarriageChapterId =
  | "c1_who_we_are"
  | "c2_lifestyle_dna"
  | "c3_household_os"
  | "c4_intimacy_bedroom"
  | "c5_conflict_deescalation"
  | "c6_family_parenting_career"
  | "c7_longterm_compounding"
  | "c8_partnership_verdict"
  | "c9_next_chapter_rituals";

export type MarriageChapterOwnership = {
  chapterId: MarriageChapterId;
  chapterNumber: string; // "01".."09"
  title: string;
  userQuestion: string;
  primaryOwnerMeanings: string[];
  secondaryRefMeanings: string[];
  summary: string;
};

export type ContradictionResolvedItem = {
  domain: string;
  innateFact: string; // Saju / Personal CE
  currentBehavior: string; // 11-Axis Psych
  pairDynamic: string; // Pair CE / Interactive Context
  unifiedNarrative: string; // Resolved non-contradictory narrative
};

export type LegacyContentRef = {
  legacySectionKey: string;
  ownerChapterId: MarriageChapterId;
  status: "KEEP" | "REMAP" | "MERGE" | "DEPRECATE";
  keyOutputs: string[];
};

export type CanonicalMarriageStoryPlan = {
  names: { a: string; b: string };
  locale: Locale;
  chapters: MarriageChapterOwnership[];
  householdOS: MarriageCanonicalBundle;
  contradictionResolutions: ContradictionResolvedItem[];
  legacyContentReferences: LegacyContentRef[];
  candidates: CandidateContractItem[];
  placeholders: {
    radar11Axis: boolean;
    darkAxisInsights: boolean;
    conflict4Stage: boolean;
    wantedVsGivenLove: boolean;
    whatNotToExpect: boolean;
    whenNeededMost: boolean;
    emergencySosScript: boolean;
  };
};
