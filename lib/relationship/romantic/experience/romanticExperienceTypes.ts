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
 * Module ID map (B3):
 * M1 Opening · M2 Hidden · M3 Special · M4 Difference · M5 Flow ·
 * M6 Conflict · M7 Daily Life · M8 Do/Don't · M9 Repair · M10 Horizon
 * (Next Step experiments remain deferred on `nextStep`, not in M1–M10.)
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

/** M2 — Hidden Dynamic */
export type HiddenHeartPersonVM = {
  name: string;
  need: string | null;
  reason: string | null;
  voice: string | null;
};

export type HiddenHeartVM = RomanticModuleBase & {
  id: "M2";
  me: HiddenHeartPersonVM | null;
  partner: HiddenHeartPersonVM | null;
  mutualGift: string | null;
};

/** M3 — What's Special */
export type WhySpecialGiftVM = {
  from: string;
  to: string;
  headline: string | null;
  body: string | null;
};

export type WhySpecialVM = RomanticModuleBase & {
  id: "M3";
  gifts: WhySpecialGiftVM[];
  onlyTogether: string | null;
  whySpecial: string | null;
  frameDirectionLabel: string | null;
};

/** M4 — Difference Map */
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
  id: "M4";
  buckets: DifferenceBucketVM[];
  hasRadar: boolean;
  openingContrast: string | null;
};

/** M5 — Relationship Flow */
export type FlowNodeVM = {
  key: string;
  label: string;
  body: string | null;
  sourceKeys: string[];
};

export type RelationshipFlowVM = RomanticModuleBase & {
  id: "M5";
  nodes: FlowNodeVM[];
  interrupt: { id: string; label: string } | null;
  signalChips: Array<{ key: string; label: string }>;
};

/** M6 — Conflict Translation */
export type ConflictDialogueRowVM = {
  speakerLabel: string;
  said: string | null;
  meant: string | null;
  heard: string | null;
  better: string | null;
};

export type ConflictTranslationVM = RomanticModuleBase & {
  id: "M6";
  /** Conflict situation headline (not the module chrome title). */
  situationTitle: string | null;
  rows: ConflictDialogueRowVM[];
};

/** M7 — Daily Life (ordinary shared-life observations; not marriage household). */
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
  /** Deterministic owner/direction summary when known. */
  ownerDirection: string | null;
};

export type DailyLifeVM = RomanticModuleBase & {
  id: "M7";
  domains: DailyLifeDomainVM[];
};

/**
 * M8 — Do / Don’t uses shared PairPrescriptionPack when available.
 * Null pack = omit (same as available:false).
 */
export type DoDontVM = {
  id: "M8";
  title: string;
  available: boolean;
  confidence: ConfidenceLevel;
  evidence: EvidenceRef[];
  pack: PairPrescriptionPack | null;
};

/** M9 — Repair Guide (deterministic composer; ordered recovery sequence). */
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
  id: "M9";
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

/**
 * Deferred past B3 — Next Step experiments (05A Module 9).
 * Not part of M1–M10 slot map while Repair occupies M9.
 */
export type NextStepExperimentVM = {
  kind: "24h" | "weekly" | "sentence" | "ritual" | "question";
  text: string;
};

export type NextStepVM = {
  available: boolean;
  confidence: ConfidenceLevel;
  evidence: EvidenceRef[];
  defaultTab: "viewer" | "partner";
  viewerExperiments: NextStepExperimentVM[];
  partnerExperiments: NextStepExperimentVM[];
  together: string | null;
  togetherStarter: string | null;
};

/** M10 — Horizon */
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
   * B1 = "b1-skeleton"; B2 = "b2-content-projectors"; B3 = "b3-content-projectors".
   */
  buildId: "b1-skeleton" | "b2-content-projectors" | "b3-content-projectors";
};

/**
 * Full experience VM. UI renders only `available: true` (or non-null packs).
 * Intentionally has no `grade`, `formula`, or ScoreBoard score fields.
 */
export type RomanticExperienceViewModel = {
  meta: RomanticExperienceMeta;
  opening: OpeningSceneVM;
  /** M2 Hidden Dynamic */
  hiddenHeart: HiddenHeartVM;
  /** M3 What's Special */
  whySpecial: WhySpecialVM;
  /** M4 Difference Map */
  differenceMap: DifferenceMapVM;
  /** M5 Relationship Flow */
  flow: RelationshipFlowVM;
  /** M6 Conflict */
  conflict: ConflictTranslationVM;
  /** M7 Daily Life */
  dailyLife: DailyLifeVM;
  /** M8 Do / Don't */
  doDont: DoDontVM;
  /** M9 Repair Guide */
  repair: RepairGuideVM;
  /** Deferred Next Step (not an M1–M10 slot in B3). */
  nextStep: NextStepVM;
  /** M10 Horizon */
  horizon: HorizonVM;
  /**
   * B1–B3: always null. Shared DeepReadViewModel is connected later.
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
    { id: "M2", available: vm.hiddenHeart.available },
    { id: "M3", available: vm.whySpecial.available },
    { id: "M4", available: vm.differenceMap.available },
    { id: "M5", available: vm.flow.available },
    { id: "M6", available: vm.conflict.available },
    { id: "M7", available: vm.dailyLife.available },
    { id: "M8", available: vm.doDont.available },
    { id: "M9", available: vm.repair.available },
    { id: "M10", available: vm.horizon.available },
  ];
}
