/**
 * Romantic Experience view-model contracts.
 *
 * UI modules must import only from this file (and shared presentation types
 * like PairPrescriptionPack). They must not read section_1_* … section_6_* or
 * Part labels.
 *
 * Grade, relationship_formula, and ScoreBoard identity scores are intentionally
 * absent from this surface.
 *
 * Experience V2 shell (Blueprint-aligned current scope):
 * M1 Hero · M2 Relationship Snapshot · M3 Difference Map ·
 * M4 Relationship Flow · M5 Hidden Heart · M6 Special Dynamics ·
 * M7 Conflict Translation · M8 Repair Guide · M9 Do / Don't · M10 Next Step
 *
 * Legacy RomanticSajuDeepReportView remains default outside the feature flag.
 */

import type { PairPrescriptionPack } from "@/lib/relationship/shared/pairPrescriptionUiTypes";

export type RomanticModuleId =
  | "M1"
  | "M2"
  | "M3"
  | "M4"
  | "M5"
  | "M6"
  | "M7"
  | "M8"
  | "M9"
  | "M10";

export const ROMANTIC_MODULE_ORDER: readonly RomanticModuleId[] = [
  "M1",
  "M2",
  "M3",
  "M4",
  "M5",
  "M6",
  "M7",
  "M8",
  "M9",
  "M10",
] as const;

export type ConfidenceLevel = "high" | "medium" | "low" | "tentative";

export type EvidenceRef = {
  path: string;
  summary: string;
};

/** Shared header on every module-ready payload. `available: false` → omit in UI. */
export type RomanticModuleBase = {
  id: RomanticModuleId;
  /** Human question / module title key material — may be empty in skeleton. */
  title: string;
  available: boolean;
  confidence: ConfidenceLevel;
  evidence: EvidenceRef[];
};

/** M1 — Opening Scene (no grade / no score dial). */
export type OpeningSceneVM = RomanticModuleBase & {
  id: "M1";
  myName: string;
  partnerName: string;
  signature: string | null;
  paradox: string | null;
  invitation: string | null;
  dayStemLine: string | null;
};

export type SnapshotSignalKind =
  | "defining_dynamic"
  | "stabilizing_resource"
  | "meaningful_tension";

/** M2 — Relationship Snapshot */
export type RelationshipSnapshotSignalVM = {
  kind: SnapshotSignalKind;
  label: string;
  summary: string;
  sourcePath: string;
};

export type RelationshipSnapshotVM = RomanticModuleBase & {
  id: "M2";
  signals: RelationshipSnapshotSignalVM[];
};

/** M3 — Difference Map */
export type DifferenceBucketKind =
  | "shared"
  | "complementary"
  | "translation_required";

export type DifferenceItemVM = {
  aspect: string;
  me: string;
  partner: string;
  rowKey: string | null;
  align: "confirms" | "caution" | null;
  confidence: ConfidenceLevel | null;
  sourceKeys: string[];
};

export type DifferenceBucketVM = {
  kind: DifferenceBucketKind;
  label: string;
  items: DifferenceItemVM[];
};

export type DifferenceMapVM = RomanticModuleBase & {
  id: "M3";
  buckets: DifferenceBucketVM[];
  hasRadar: boolean;
  openingContrast: string | null;
};

/** M5 — Hidden Heart */
export type HiddenHeartPersonVM = {
  name: string;
  need: string | null;
  reason: string | null;
  voice: string | null;
};

export type HiddenHeartVM = RomanticModuleBase & {
  id: "M5";
  me: HiddenHeartPersonVM | null;
  partner: HiddenHeartPersonVM | null;
  mutualGift: string | null;
};

export type WhySpecialGiftVM = {
  from: string;
  to: string;
  headline: string | null;
  body: string | null;
};

/** M6 — Special Dynamics */
export type WhySpecialVM = RomanticModuleBase & {
  id: "M6";
  gifts: WhySpecialGiftVM[];
  onlyTogether: string | null;
  whySpecial: string | null;
  frameDirectionLabel: string | null;
};

export type FlowNodeVM = {
  key: string;
  label: string;
  body: string | null;
  sourceKeys: string[];
};

/** M4 — Relationship Flow */
export type RelationshipFlowVM = RomanticModuleBase & {
  id: "M4";
  nodes: FlowNodeVM[];
  interrupt: { id: string; label: string } | null;
  signalChips: Array<{ key: string; label: string }>;
};

export type ConflictDialogueRowVM = {
  speakerLabel: string;
  said: string | null;
  meant: string | null;
  heard: string | null;
  better: string | null;
};

export type ConflictTranslationVM = RomanticModuleBase & {
  id: "M7";
  situationTitle: string | null;
  rows: ConflictDialogueRowVM[];
};

/**
 * Legacy compatibility only. Romantic runtime keeps this suppressed permanently;
 * daily-life operations belong to Marriage/Cohabitation products.
 */
export type DailyLifeDomainId =
  | "money_practicality"
  | "chores_structure"
  | "space_closeness"
  | "social_energy"
  | "decision_making"
  | "routine_rhythm";

export type DailyLifeDomainVM = {
  id: DailyLifeDomainId;
  label: string;
  supported: boolean;
  observation: string | null;
  sourceKeys: string[];
  confidence: ConfidenceLevel | null;
  ownerDirection: string | null;
};

export type DailyLifeVM = RomanticModuleBase & {
  id: "M7";
  domains: DailyLifeDomainVM[];
};

export type DoDontVM = {
  id: "M9";
  title: string;
  available: boolean;
  confidence: ConfidenceLevel;
  evidence: EvidenceRef[];
  pack: PairPrescriptionPack | null;
};

export type RepairStageId =
  | "pause"
  | "re_entry"
  | "acknowledgement"
  | "clarification"
  | "reassurance"
  | "closure";

export type RepairStageVM = {
  id: RepairStageId;
  title: string;
  body: string;
  speakable?: string;
  sourceKeys: string[];
};

export type RepairGuideVM = RomanticModuleBase & {
  id: "M8";
  asymmetry: {
    slowerProcessor: "me" | "partner" | "balanced";
    fasterExpresser: "me" | "partner" | "balanced";
    pauseWindow: "short" | "medium" | "long";
    whoReachesFirst: "me" | "partner" | "either";
    reassuranceForm: "listening" | "behavior_proof" | "presence" | "both";
  } | null;
  interrupt: { id: string; label: string } | null;
  stages: RepairStageVM[];
  doNotDemand: string[];
  polishEligiblePaths: string[];
};

export type NextStepExperimentVM = {
  kind: "24h" | "weekly" | "sentence" | "ritual" | "question";
  text: string;
};

export type NextStepVM = {
  id: "M10";
  title: string;
  available: boolean;
  confidence: ConfidenceLevel;
  evidence: EvidenceRef[];
  defaultTab: "viewer" | "partner";
  viewerExperiments: NextStepExperimentVM[];
  partnerExperiments: NextStepExperimentVM[];
  together: string | null;
  togetherStarter: string | null;
};

export type HorizonWaypointVM = {
  period: string;
  body: string;
  sub: string | null;
};

export type HorizonVM = RomanticModuleBase & {
  id: "M10";
  waypoints: HorizonWaypointVM[];
};

export type SaveShareVM = {
  available: boolean;
  signatureLine: string | null;
};

export type RomanticExperienceMeta = {
  viewerIsReportA: boolean;
  myName: string;
  partnerName: string;
  nameA: string;
  nameB: string;
  locale: string;
  /** Locked Romantic accent target (visual migration later). */
  accentToken: "#E2C4A8";
  /**
   * Projector generation id.
   * V2 shell behind feature-flag, deterministic-only scope.
   */
  buildId: "b6-v2-ch3-m1-m10";
};

/**
 * Full experience VM. UI renders only `available: true` (or non-null packs).
 * Intentionally has no `grade`, `formula`, or ScoreBoard score fields.
 */
export type RomanticExperienceViewModel = {
  meta: RomanticExperienceMeta;
  opening: OpeningSceneVM;
  /** M2 Relationship Snapshot */
  snapshot: RelationshipSnapshotVM;
  /** M3 Difference Map */
  differenceMap: DifferenceMapVM;
  /** M4 Relationship Flow */
  flow: RelationshipFlowVM;
  /** M5 Hidden Heart */
  hiddenHeart: HiddenHeartVM;
  /** M6 Special Dynamics */
  specialDynamics: WhySpecialVM;
  /** M7 Conflict Translation */
  conflictTranslation: ConflictTranslationVM;
  /** M8 Repair Guide */
  repairGuide: RepairGuideVM;
  /** M9 Do / Don't */
  doDont: DoDontVM;
  /** M10 Next Step */
  nextStep: NextStepVM;
  /**
   * B4: always null. Shared DeepReadViewModel is connected later.
   */
  deepRead: null;
  saveShare: SaveShareVM | null;
};

export type RomanticModuleSlotSummary = {
  id: RomanticModuleId;
  available: boolean;
};

/** Inspection helper for composition stub / tests — never exposes legacy sections. */
export function summarizeRomanticModuleSlots(
  vm: RomanticExperienceViewModel,
): RomanticModuleSlotSummary[] {
  return [
    { id: "M1", available: vm.opening.available },
    { id: "M2", available: vm.snapshot.available },
    { id: "M3", available: vm.differenceMap.available },
    { id: "M4", available: vm.flow.available },
    { id: "M5", available: vm.hiddenHeart.available },
    { id: "M6", available: vm.specialDynamics.available },
    { id: "M7", available: vm.conflictTranslation.available },
    { id: "M8", available: vm.repairGuide.available },
    { id: "M9", available: vm.doDont.available },
    { id: "M10", available: vm.nextStep.available },
  ];
}
