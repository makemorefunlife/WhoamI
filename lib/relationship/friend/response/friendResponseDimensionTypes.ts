/**
 * Canonical Friend Response Profile — the ONE place each Psych-11 axis and
 * Ten-God family is scored into a friendship-response dimension. CH5-8's
 * person profiles (support/conflict/boundary/distance) are DERIVED from
 * these dimensions; they must not re-test the raw axes independently.
 *
 * Fixes (see docs/dev/... forensic audit):
 * - `structure` no longer feeds two independent "needs" from one reading
 *   (reliabilitySensitivity is scored once; RELIABILITY/CONSISTENCY become
 *   one need, not two).
 * - Every score is a continuous 0-100 blend (axis value itself, or a
 *   graduated ten-god-count curve), never a binary >=60 cliff — a 58 and a
 *   60 now differ by ~2 points of score, not by "found it / didn't."
 * - Missing evidence produces LOW confidence and an explicit
 *   `missingEvidence` list rather than silently defaulting to a neutral
 *   score that then gets rendered as a confident claim.
 */
import type { EvidenceRef, Confidence } from "./friendEvidenceTypes";

export type FriendResponseDimensionKey =
  | "emotionalReception"
  | "problemResponse"
  | "reliabilitySensitivity"
  | "conflictDirectness"
  | "connectionMaintenance"
  | "autonomySpaceNeed";

export type FriendDimensionLevel = "LOW" | "MODERATE" | "HIGH";

/** problemResponse only — which flavor of "non-emotional response" dominates.
 * Preserves the clarify/solve/activate distinction the original SUPPORT_MODE
 * enum relied on, instead of collapsing all of it into one generic label. */
export type FriendProblemResponseSubStyle = "CLARIFY" | "SOLVE" | "ACTIVATE" | "UNDIFFERENTIATED";

export type FriendResponseDimension = {
  key: FriendResponseDimensionKey;
  /** 0-100, continuous — never assigned by a binary threshold. */
  score: number;
  level: FriendDimensionLevel;
  confidence: Confidence;
  evidence: EvidenceRef[];
  /** axis/fact names that would have strengthened this reading but were absent. */
  missingEvidence: string[];
  subStyle?: FriendProblemResponseSubStyle;
};

export type FriendResponseProfile = {
  personId: string;
  emotionalReception: FriendResponseDimension;
  problemResponse: FriendResponseDimension;
  reliabilitySensitivity: FriendResponseDimension;
  conflictDirectness: FriendResponseDimension;
  connectionMaintenance: FriendResponseDimension;
  /** null (not a fabricated neutral guess) when self_control evidence is absent. */
  autonomySpaceNeed: FriendResponseDimension | null;
};

export type FriendPairDimensionClassification =
  | "GENUINE_SIMILARITY"
  | "SAME_DIRECTION_DIFFERENT_EXPRESSION"
  | "COMPLEMENTARY_DIFFERENCE"
  | "FRICTION_DIFFERENCE"
  | "LOW_EVIDENCE";

export type FriendPairDimensionComparison = {
  dimension: FriendResponseDimensionKey;
  classification: FriendPairDimensionClassification;
  gap: number;
  aScore: number;
  bScore: number;
  aLevel: FriendDimensionLevel;
  bLevel: FriendDimensionLevel;
  confidence: Confidence;
};

export type FriendPairComparableDimensionKey = Exclude<FriendResponseDimensionKey, "autonomySpaceNeed">;

export type FriendPairResponseComparison = Record<FriendPairComparableDimensionKey, FriendPairDimensionComparison>;
