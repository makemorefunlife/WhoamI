import type { Locale } from "@/lib/i18n/locale";

export type FriendChapterKey =
  | "ch01_why_us"
  | "ch02_who_we_are"
  | "ch03_social_dna_tempo"
  | "ch04_play_travel"
  | "ch05_communication_third_person"
  | "ch06_conflict_repair"
  | "ch07_expectation_boundaries"
  | "ch08_distance_durability"
  | "ch09_action_playbook";

export type FriendStoryPlanChapter = {
  chapterKey: FriendChapterKey;
  chapterNumber: number;
  title: string;
  userQuestion: string;
  primaryMeanings: string[];
  supportingMeanings: string[];
  synthesisCandidates: string[];
  coverageModels: string[];
  actionCandidates: string[];
  prohibitedMeanings: string[];
  narrativeGoal: string;
  narrativePriority: "HIGH" | "MEDIUM" | "LOW";
};

export type CanonicalFriendStoryPlan = {
  schemaVersion: "2.0.0";
  meta: {
    nicknameA: string;
    nicknameB: string;
    locale: Locale;
    storyPlanId: string;
    generatedAt: string;
  };
  chapters: FriendStoryPlanChapter[];
  meaningOwnershipMap: Record<string, FriendChapterKey>;
  llmHandoffPayload: {
    organizedMeanings: Record<string, unknown>;
    discrepancyNotes: string[];
    chapterHandoffs: Array<{
      chapterKey: FriendChapterKey;
      title: string;
      allowedThemes: string[];
      forbiddenThemes: string[];
    }>;
  };
};
