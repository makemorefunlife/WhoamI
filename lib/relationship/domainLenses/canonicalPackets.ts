/**
 * Canonical Meaning Packet Contract
 *
 * Provides a standardized, typed wrapper format for authoritative V1 Gold Logic
 * outputs consumed by Domain Lenses, Story Planners, and ViewModels.
 */

import type { LensConfidenceLevel } from "./types";

export type CanonicalEvaluationStatus =
  | "supported"
  | "mixed"
  | "abstained"
  | "unavailable";

export type CanonicalSourceMode =
  | "saju_only"
  | "survey_only"
  | "saju_plus_survey"
  | "hybrid";

export type CanonicalPacketEvidence = {
  kind: string;
  detail: string;
  source?: "saju" | "survey" | "composite";
};

export type CanonicalMeaningPacket<T = unknown> = {
  meaning_id: string;
  status: CanonicalEvaluationStatus;
  confidence: LensConfidenceLevel;
  directionality: "symmetric" | "a_to_b" | "b_to_a" | "dual";
  lead_party?: "A" | "B" | null;
  evidence: CanonicalPacketEvidence[];
  source_mode: CanonicalSourceMode;
  value: T;
};

/** Helper to construct a standard abstained canonical packet */
export function buildAbstainedCanonicalPacket<T = null>(
  meaning_id: string,
  reason: string,
  defaultValue: T = null as unknown as T,
): CanonicalMeaningPacket<T> {
  return {
    meaning_id,
    status: "abstained",
    confidence: "insufficient",
    directionality: "symmetric",
    evidence: [{ kind: "abstention_reason", detail: reason }],
    source_mode: "saju_only",
    value: defaultValue,
  };
}
