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
  operatingPartnerFit: number; // 예: 85
  emotionalPartnerFit: number; // 예: 80
  longTermGrowthFit: number; // 예: 82
  oneLineVerdict: string;
  greatestStrength: string;
  biggestVulnerability: string;
};
