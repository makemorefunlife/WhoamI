/**
 * Romantic Experience view-model contracts (Batch B1).
 *
 * UI modules must import only from this file (and shared presentation types
 * like PairPrescriptionPack). They must not read section_1_* … section_6_* or
 * Part labels.
 *
 * Grade, relationship_formula, and ScoreBoard identity scores are intentionally
 * absent from this surface.
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
  /** Human question / module title key material — may be empty in B1. */
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

/** M2 — Difference Map buckets (projector fills later). */
export type DifferenceBucketKind =
  | "shared"
  | "complementary"
  | "translation_required";

export type DifferenceBucketVM = {
  kind: DifferenceBucketKind;
  label: string;
  items: Array<{ aspect: string; me: string; partner: string }>;
};

export type DifferenceMapVM = RomanticModuleBase & {
  id: "M2";
  buckets: DifferenceBucketVM[];
  hasRadar: boolean;
  openingContrast: string | null;
};

/** M3 — Relationship Flow */
export type FlowNodeVM = {
  key: string;
  label: string;
  body: string | null;
};

export type RelationshipFlowVM = RomanticModuleBase & {
  id: "M3";
  nodes: FlowNodeVM[];
  interrupt: { id: string; label: string } | null;
  signalChips: Array<{ key: string; label: string }>;
};

/** M4 — Hidden Heart */
export type HiddenHeartPersonVM = {
  name: string;
  need: string | null;
  reason: string | null;
  voice: string | null;
};

export type HiddenHeartVM = RomanticModuleBase & {
  id: "M4";
  me: HiddenHeartPersonVM | null;
  partner: HiddenHeartPersonVM | null;
  mutualGift: string | null;
};

/** M5 — Why Special (no formula field). */
export type WhySpecialGiftVM = {
  from: string;
  to: string;
  headline: string | null;
  body: string | null;
};

export type WhySpecialVM = RomanticModuleBase & {
  id: "M5";
  gifts: WhySpecialGiftVM[];
  onlyTogether: string | null;
  whySpecial: string | null;
  frameDirectionLabel: string | null;
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

/**
 * M7 — Do / Don’t uses shared PairPrescriptionPack when available.
 * Null slot = omit (same as available:false).
 */
export type DoDontVM = {
  id: "M7";
  available: boolean;
  confidence: ConfidenceLevel;
  evidence: EvidenceRef[];
  pack: PairPrescriptionPack | null;
};

/** M8 — Repair Guide (composer fills in B4). */
export type RepairStageId =
  | "stop_escalation"
  | "name_without_verdict"
  | "match_slower_window"
  | "time_anchor_for_faster"
  | "reconnect_sentence";

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
  stages: Array<{
    id: RepairStageId;
    title: string;
    body: string;
    speakable?: string;
  }>;
  doNotDemand: string[];
  polishEligiblePaths: string[];
};

/** M9 — Next Step */
export type NextStepExperimentVM = {
  kind: "24h" | "weekly" | "sentence" | "ritual" | "question";
  text: string;
};

export type NextStepVM = RomanticModuleBase & {
  id: "M9";
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
   * Skeleton build id — projectors bump this when they start filling modules.
   * B1 = "b1-skeleton".
   */
  buildId: "b1-skeleton";
};

/**
 * Full experience VM. UI renders only `available: true` (or non-null packs).
 * Intentionally has no `grade`, `formula`, or ScoreBoard score fields.
 */
export type RomanticExperienceViewModel = {
  meta: RomanticExperienceMeta;
  opening: OpeningSceneVM;
  differenceMap: DifferenceMapVM;
  flow: RelationshipFlowVM;
  hiddenHeart: HiddenHeartVM;
  whySpecial: WhySpecialVM;
  conflict: ConflictTranslationVM;
  doDont: DoDontVM;
  repair: RepairGuideVM;
  nextStep: NextStepVM;
  horizon: HorizonVM;
  /**
   * B1: always null. Shared DeepReadViewModel is connected in B5
   * (`lib/relationship/shared/deepReadViewModel.ts`).
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
    { id: "M2", available: vm.differenceMap.available },
    { id: "M3", available: vm.flow.available },
    { id: "M4", available: vm.hiddenHeart.available },
    { id: "M5", available: vm.whySpecial.available },
    { id: "M6", available: vm.conflict.available },
    { id: "M7", available: vm.doDont.available },
    { id: "M8", available: vm.repair.available },
    { id: "M9", available: vm.nextStep.available },
    { id: "M10", available: vm.horizon.available },
  ];
}
