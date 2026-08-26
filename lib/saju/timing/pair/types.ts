import type { CEConfidence } from "../types";

export type PairStateCategory =
  | "ALIGNED_MOMENTUM"
  | "SHARED_STABILITY"
  | "DIFFERENT_SPEED"
  | "EXPAND_VS_STABILIZE"
  | "DUAL_PRESSURE"
  | "ONE_PARTNER_TRANSITION"
  | "MUTUAL_TRANSITION"
  | "SUPPORTIVE_ASYMMETRY"
  | "MIXED";

export type PartnerRoleSide = "PERSON_A" | "PERSON_B" | "BOTH" | "NEITHER";

export type PairYearState = {
  year: number;
  pairState: PairStateCategory;
  stateLabel: string;
  stateDescription: string;
  primaryChangingSide: PartnerRoleSide;
  stabilizingSide: PartnerRoleSide;
  personAEvidenceIds: string[];
  personBEvidenceIds: string[];
  psychEvidenceA: string[];
  psychEvidenceB: string[];
  timingEvidenceA: string[];
  timingEvidenceB: string[];
  isTurningPointCandidate: boolean;
  turningPointReason?: string;
  factConfidence: CEConfidence;
  interpretationConfidence: CEConfidence;
};

export type CoupleTimingModel = {
  targetYears: number[];
  yearlyStates: PairYearState[];
  strongestChangeYear?: number;
  strongestAlignedYear?: number;
  strongestMismatchYear?: number;
  transitionYears: Array<{ year: number; partner: PartnerRoleSide }>;
};
