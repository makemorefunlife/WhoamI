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

/** Helper to construct a standard canonical meaning packet */
export function makeCanonicalPacket<T = unknown>(params: {
  meaning_id: string | null;
  status: CanonicalEvaluationStatus;
  confidence: LensConfidenceLevel;
  directionality:
    | {
        polarity?: "symmetric" | "a_to_b" | "b_to_a" | "dual" | string;
        lead_party?: "A" | "B" | null;
      }
    | "symmetric"
    | "a_to_b"
    | "b_to_a"
    | "dual";
  value: T;
  evidence?: (CanonicalPacketEvidence | string)[];
  source_mode?: CanonicalSourceMode;
  reason?: string;
  is_abstaining?: boolean;
  abstain_reason?: string;
}): CanonicalMeaningPacket<T> {
  const dir =
    typeof params.directionality === "string"
      ? (params.directionality as "symmetric" | "a_to_b" | "b_to_a" | "dual")
      : (params.directionality?.polarity as any ?? "symmetric");
  const leadParty =
    typeof params.directionality === "object"
      ? params.directionality.lead_party
      : undefined;

  const evList: CanonicalPacketEvidence[] = (params.evidence ?? []).map((ev) =>
    typeof ev === "string" ? { kind: ev, detail: ev, source: "saju" as const } : ev
  );
  if (params.reason) {
    evList.push({ kind: "summary_reason", detail: params.reason });
  }

  return {
    meaning_id: params.meaning_id ?? "unknown",
    status: params.is_abstaining ? "abstained" : params.status,
    confidence: params.confidence,
    directionality: dir,
    lead_party: leadParty,
    evidence: evList,
    source_mode: params.source_mode ?? "hybrid",
    value: params.value,
  };
}
