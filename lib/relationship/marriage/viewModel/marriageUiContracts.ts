/**
 * Marriage V2 Normalized UI Contracts
 * Backend & Canonical Data -> ViewModel Normalization -> Dumb Presentation Renderer
 */

export type MarriageConflictStageViewModel = {
  stepNumber: number; // 1, 2, 3, 4
  stageKey: "NORMAL" | "TENSION_RISING" | "OVERLOAD" | "RECOVERY";
  label: string; // 예: "평소", "긴장이 높아질 때", "과부하가 올 때", "회복할 때"
  narrative: string; // 완벽한 한글 서사 문장 (raw enum 노출 100% 차단)
};

export type MarriageConflictPersonViewModel = {
  personName: string;
  stages: MarriageConflictStageViewModel[];
};

export type MarriageConflict4StageViewModel = {
  personA: MarriageConflictPersonViewModel;
  personB: MarriageConflictPersonViewModel;
  pairSummary?: string;
};

export type MarriagePartnershipVerdictViewModel = {
  lifeSyncPct: number; // 예: 85
  /**
   * Household-operating fit — NOT a number. plannerExecutor.alignmentType has
   * no existing canonical numeric authority (see docs/dev — Ch8 score
   * integrity audit); the old `operatingPartnerFit: number` field always
   * rendered a hardcoded, non-evidence-based 85. Replaced with a
   * locale-resolved human label sourced from the real canonical
   * plannerExecutor classification — never a raw enum value.
   */
  operatingStatusLabel: string;
  emotionalPartnerFit: number; // 예: 80
  longTermGrowthFit: number; // 예: 82
  oneLineVerdict: string;
  greatestStrength: string;
  biggestVulnerability: string;
};

/**
 * Deep-read canonical merge (married_saju_deep explain-only overlay,
 * folded into the canonical 9-chapter presentation instead of a standalone
 * chapter). All four view models below are optional and independently
 * absent-safe — the overlay itself may be missing, partial, or malformed on
 * older cached reports; each normalizer in buildMarriageReportViewModel.ts
 * omits the field entirely rather than fabricating a fallback.
 */

/** Chapter 1 — first-person voice quote, one per person, either may be absent. */
export type MarriageExpertVoicePerson = {
  personName: string;
  voice: string;
};

export type MarriageExpertVoiceViewModel = {
  personA?: MarriageExpertVoicePerson;
  personB?: MarriageExpertVoicePerson;
};

/** Chapter 8 — expert synthesis narrative, rendered under the canonical verdict, never replacing it. */
export type MarriageTogetherInsightViewModel = {
  text: string;
  starter?: string;
};

/** Chapter 9 — personalized, pair-specific action tips (additive alongside the existing static playbook). */
export type MarriagePersonalizedAdviceTip = {
  actionTitle: string;
  reason: string;
  speechTip: string;
  /** Only rendered when the overlay actually populated it — never forced. */
  example?: string;
};

export type MarriagePersonalizedAdviceViewModel = {
  forPersonA: MarriagePersonalizedAdviceTip[];
  forPersonB: MarriagePersonalizedAdviceTip[];
};
