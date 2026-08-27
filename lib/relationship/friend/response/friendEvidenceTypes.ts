/**
 * Shared evidence/confidence primitives for Friend Chapters 4-8.
 * See FriendResponseIntelligence — every behavioral claim in Ch4-8 must carry
 * an EvidenceRef[] and a Confidence resolved from resolveConfidence(), never
 * an arbitrary float.
 */
import type { FriendConfidenceLevel } from "@/lib/relationship/friend/canonical/friendCanonicalTypes";

export type Confidence = FriendConfidenceLevel;

export type EvidenceSource =
  | "CE_SSOT"
  | "TEN_GOD"
  | "BRANCH_RELATION"
  | "ELEMENT"
  | "ROOTEDNESS"
  | "JOHU"
  | "PSYCH_11"
  | "PAIR_CANONICAL"
  | "EXISTING_FRIEND_INTELLIGENCE";

export type EvidencePolarity = "SUPPORTS" | "CONTRADICTS" | "MODIFIES";
export type EvidenceStrength = "PRIMARY" | "SECONDARY" | "SUPPORTING";

export type EvidenceRef = {
  source: EvidenceSource;
  key: string;
  personId?: string;
  targetPersonId?: string;
  polarity: EvidencePolarity;
  strength: EvidenceStrength;
  rawValue?: string | number | boolean;
};

/**
 * Ordinal confidence rule (spec §2):
 *  HIGH   — 2+ distinct evidence families SUPPORT with no CONTRADICTS
 *  MEDIUM — 1 PRIMARY/SECONDARY family supports, no contradiction (or only 1 family total)
 *  LOW    — a CONTRADICTS is present, or only SUPPORTING-strength evidence, or no evidence
 */
export function resolveConfidence(evidence: EvidenceRef[]): Confidence {
  if (evidence.length === 0) return "LOW";

  const hasContradiction = evidence.some((e) => e.polarity === "CONTRADICTS");
  const supporting = evidence.filter((e) => e.polarity === "SUPPORTS" || e.polarity === "MODIFIES");
  const strongFamilies = new Set(
    supporting.filter((e) => e.strength === "PRIMARY" || e.strength === "SECONDARY").map((e) => e.source),
  );

  if (hasContradiction) {
    // A contradiction only stays MEDIUM if it's outweighed by 2+ strong aligned families.
    return strongFamilies.size >= 2 ? "MEDIUM" : "LOW";
  }
  if (strongFamilies.size >= 2) return "HIGH";
  if (strongFamilies.size === 1) return "MEDIUM";
  return "LOW";
}

/** Helper for the common "psych axis supports a threshold" evidence pattern. */
export function psychEvidence(params: {
  key: string;
  personId: string;
  value: number | undefined;
  threshold: number;
  strength?: EvidenceStrength;
}): EvidenceRef | null {
  if (params.value === undefined) return null;
  return {
    source: "PSYCH_11",
    key: params.key,
    personId: params.personId,
    polarity: params.value >= params.threshold ? "SUPPORTS" : "CONTRADICTS",
    strength: params.strength ?? "SECONDARY",
    rawValue: params.value,
  };
}
