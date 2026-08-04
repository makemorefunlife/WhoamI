import type { PAIR_CE_VERSION, PAIR_SHARED_LENS } from "./constants";
import type {
  PairContextGroupId,
  PairFactKind,
  PairRoleInLens,
  PairSignalTier,
} from "./constants";
import type { PAIR_SSOT_GAPS } from "../pairSaju/constants";
import type { PairSajuFacts, PairSajuFactsInput } from "../pairSaju";

export type PairPartyId = "A" | "B";

export type ResolvedBaseMeaning = {
  reference_id: string;
  text_ko: string;
  text_en?: string;
  resolved: true;
};

export type UnresolvedReference = {
  reference_id: string;
  fact_path: string;
  reason: "dictionary_miss";
};

export type PairDirectionality = {
  polarity: "symmetric" | "a_to_b" | "b_to_a" | "multipart";
  from?: PairPartyId;
  to?: PairPartyId;
};

/**
 * Shared Pair CE packet — context-neutral.
 * Domains may frame but must not alter fact_path / codes / evidence.
 */
export type PairContextPacket = {
  packet_id: string;
  group: PairContextGroupId;
  role_in_lens: PairRoleInLens;
  tier: PairSignalTier;
  fact_path: string;
  fact_kind: PairFactKind;
  codes: string[];
  parties: {
    a_report_id: string;
    b_report_id: string;
  };
  directionality: PairDirectionality;
  pillar_slots?: {
    a?: "year" | "month" | "day" | "hour";
    b?: "year" | "month" | "day" | "hour";
    contributions?: Array<{
      owner: PairPartyId;
      pillar_slot: "year" | "month" | "day" | "hour";
      code: string;
    }>;
  };
  reference_ids: string[];
  base_meanings: ResolvedBaseMeaning[];
  unresolved_reference_ids: string[];
  /**
   * Deterministic ordering only.
   * Not Class %, personality, confidence, compatibility, or UI metric.
   */
  selection_priority: number;
  confidence: string;
  evidence: Array<{
    kind: string;
    codes?: string[];
    pillar_slot?: string;
    detail?: string;
    party?: PairPartyId;
  }>;
};

export type PairContextExclusion = {
  fact_path: string;
  reason:
    | "birth_time_unknown"
    | "low_priority_cap"
    | "empty_fact"
    | "deduped"
    | "low_confidence_omitted"
    | "method_unnormalized";
  detail?: string;
};

export type PairContextAggregates = {
  birth_time_unknown_a: boolean;
  birth_time_unknown_b: boolean;
  hit_counts_by_kind: Record<string, number>;
  ssot_gaps: readonly (typeof PAIR_SSOT_GAPS)[number][];
};

export type PairContextProvenance = {
  ce_version: typeof PAIR_CE_VERSION | string;
  lens: typeof PAIR_SHARED_LENS | string;
  dictionary_version: string;
  pair_fact_version: string;
  chart_a: { report_id: string; schema_version: string; fingerprints: string };
  chart_b: { report_id: string; schema_version: string; fingerprints: string };
  built_at: string;
  policy_id: "pair_context_engine_policy_v1";
};

export type PairContextEngineInput = {
  /** Prefer prebuilt facts; otherwise built from `facts_input`. */
  facts?: PairSajuFacts;
  facts_input?: PairSajuFactsInput;
  profile_a?: import("../personalContextEngine/types").PersonalRelationalProfile;
  profile_b?: import("../personalContextEngine/types").PersonalRelationalProfile;
  dictionary_version?: string;
  options?: {
    max_packets_per_group?: number;
    reserved_t1_t2_per_group?: number;
  };
};

export type CanonicalPairCapabilityId =
  | "directional_support_exchange"
  | "initiative_and_response"
  | "mutual_recognition"
  | "expression_emotional_pace_mismatch"
  | "closeness_space_mismatch"
  | "decision_coordination"
  | "role_formation"
  | "resource_responsibility_exchange"
  | "pressure_amplification_buffering"
  | "conflict_activation"
  | "misunderstanding_translation"
  | "repair_entry_loop"
  | "hidden_needs_interaction"
  | "stable_bonding_resources"
  | "recurring_friction";

export type CanonicalPairCapabilityStatus = "supported" | "mixed" | "abstained" | "unavailable";

export type CanonicalPairCapability<TId extends CanonicalPairCapabilityId = CanonicalPairCapabilityId> = {
  capability_id: TId;
  status: CanonicalPairCapabilityStatus;
  canonical_meaning_id: string | null;
  variant: string | null;
  summary_ko: string;
  summary_en?: string;
  directionality: PairDirectionality;
  lead_party?: PairPartyId;
  confidence: "high" | "medium" | "low" | "insufficient";
  tension_level: "low" | "moderate" | "high" | "critical";
  is_abstaining: boolean;
  abstain_reason?: string;
  diagnostic_reason?: string;
  is_mixed: boolean;
  mixed_details?: string;
  evidence_sources: Array<{
    source_kind: "pair_ce_packet" | "personal_ce_dimension" | "ten_god_matrix" | "raw_fact";
    ref_id: string;
    detail: string;
  }>;
  corroboration: {
    is_corroborated: boolean;
    corroborating_evidence_count: number;
    independent_sources: string[];
  };
  prohibited_claims: string[];
};

export type PairContextEngineOutput = {
  schema_version: typeof PAIR_CE_VERSION | string;
  lens: typeof PAIR_SHARED_LENS | string;
  packets: PairContextPacket[];
  /** Convenience view — not a second fact store. */
  groups: Record<PairContextGroupId, PairContextPacket[]>;
  aggregates: PairContextAggregates;
  exclusions: PairContextExclusion[];
  unresolved_references: UnresolvedReference[];
  provenance: PairContextProvenance;
  /** Pass-through for domain consumers that still need raw hits. */
  facts: PairSajuFacts;
  /** Canonical Relational Pair CE Capabilities. */
  canonical_capabilities?: Record<CanonicalPairCapabilityId, CanonicalPairCapability>;
};

export type DomainPairLensId = "romantic" | "partner" | "friend" | "family" | "work";

export type DomainPairLensOutput = {
  domain: DomainPairLensId;
  /** Filtered packets — facts unchanged. */
  packets: PairContextPacket[];
  /** Domain framing only (labels / relevance tags) — does not mutate packets. */
  framing: Array<{
    packet_id: string;
    relevance: "primary" | "supporting" | "background";
    frame_tag: string;
  }>;
  source_ce_version: string;
  source_pair_fact_version: string;
};
