import type { Confidence, EvidenceRef } from "../individualSaju/types";
import type {
  PERSONAL_CE_VERSION,
  PERSONAL_INNATE_LENS,
  PersonalContextGroupId,
  PersonalRoleInLens,
  PersonalSignalTier,
} from "./constants";
import type { DOCUMENTED_SSOT_GAPS } from "./constants";

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

/**
 * Individual Personal CE packet contract.
 *
 * Separates layers deliberately (Pair CE may mirror concepts without identical schema):
 * - fact: fact_path + codes (+ evidence pointing at SSOT)
 * - meaning: reference_ids → base_meanings (Dictionary only)
 * - epistemic: confidence (from SSOT; never upgraded by CE)
 * - evidence: EvidenceRef[]
 * - grouping: group + role_in_lens (lens structure, not UI sections)
 * - admission band: tier (1–4)
 * - ordering key: selection_priority
 *
 * Does NOT own: UI layout, report IA, questionnaire, final narrative, Pair SSOT.
 */
export type PersonalContextPacket = {
  packet_id: string;
  group: PersonalContextGroupId;
  role_in_lens: PersonalRoleInLens;
  /** Admission band (1–4). Not a personality/compatibility score. */
  tier: PersonalSignalTier;
  /** Dot path into IndividualSajuChart, e.g. day_master.stem */
  fact_path: string;
  codes: string[];
  reference_ids: string[];
  base_meanings: ResolvedBaseMeaning[];
  unresolved_reference_ids: string[];
  /**
   * Deterministic candidate selection and ordering only.
   * Not a personality score, trait intensity, confidence, compatibility,
   * probability, percentage, or user-visible metric.
   */
  selection_priority: number;
  confidence: Confidence;
  evidence: EvidenceRef[];
};

export type PersonalContextExclusion = {
  fact_path: string;
  reference_ids: string[];
  reason:
    | "birth_time_unknown"
    | "not_possessed"
    | "low_priority_cap"
    | "empty_fact"
    | "deduped"
    | "low_confidence_omitted";
  detail?: string;
};

export type RelationalDimensionEvaluation<TVal extends string = string> = {
  value: TVal;
  status?: "supported" | "mixed" | "abstained" | "unavailable";
  canonical_meaning_id?: string | null;
  confidence: "high" | "medium" | "low" | "insufficient";
  is_mixed: boolean;
  is_abstaining: boolean;
  evidence_summary: string;
  contributing_sources: string[];
};

export type PersonalRelationalProfile = {
  expression_style: "expressive_creator" | "pragmatic_doer" | "reserved_observer" | "mixed_expressive_pragmatic" | "neutral_unspecified";
  recognition_need: "empathy_seeking" | "standards_driven" | "autonomous_independent" | "mixed_recognition_need" | "neutral_unspecified";
  decision_pace: "swift_initiative" | "deliberate_evaluator" | "steady_anchor" | "mixed_adaptive_pace" | "neutral_unspecified";
  resource_governance: "diligent_steward" | "opportunity_investor" | "flexible_distributor" | "mixed_balanced_investor" | "neutral_unspecified";
  solitude_autonomy: "high_solitude_needed" | "balanced_proximity" | "high_closeness_seeking" | "mixed_solitude_intimacy" | "neutral_unspecified";
  conflict_decompression: "solitude_cooling_needed" | "immediate_clarifier" | "harmonious_absorber" | "mixed_cooling_clarifier" | "neutral_unspecified";
  pressure_response: "resolute_crisis_fighter" | "stress_vulnerable_anchor_needed" | "adaptive_pacing" | "mixed_pressure_response" | "neutral_unspecified";
  support_giving_style: "nurturing_empath" | "practical_troubleshooter" | "silent_standby" | "mixed_nurturing_troubleshooter" | "neutral_unspecified";
  criticism_sensitivity: "high_defensive_cushion_needed" | "growth_mindset_direct" | "calm_filtering" | "mixed_sensitive_direct" | "neutral_unspecified";
  intimacy_expression_style: "passionate_intensity" | "warm_grounded_devotion" | "independent_space_valuing" | "mixed_passionate_independent" | "neutral_unspecified";
  structure_spontaneity: "disciplined_framework_driven" | "spontaneous_creative_flow" | "balanced_pragmatist" | "mixed_structured_spontaneous" | "neutral_unspecified";
  boundary_defense_strength: "uncompromising_sovereignty" | "tactful_diplomatic" | "porous_empathy" | "mixed_sovereignty_diplomatic" | "neutral_unspecified";
  dimension_evaluations?: Record<string, RelationalDimensionEvaluation>;
};

export type RelationalProfile = PersonalRelationalProfile;

export type PersonalContextAggregates = {
  ten_god_stem_counts: Record<string, number>;
  dominant_element: string | null;
  weakest_element: string | null;
  strength_token: string | null;
  birth_time_unknown: boolean;
  relational_profile?: PersonalRelationalProfile;
  /** Documented gaps — never fabricated. */
  ssot_gaps: readonly (typeof DOCUMENTED_SSOT_GAPS)[number][];
};

export type PersonalContextProvenance = {
  ce_version: typeof PERSONAL_CE_VERSION | string;
  lens: typeof PERSONAL_INNATE_LENS | string;
  dictionary_version: string;
  chart_schema_version: string;
  chart_engine_id: string;
  chart_input_fingerprint: string;
  chart_ref_data_fingerprint: string;
  /** Chart/session id from Individual SSOT birth — not report IA ownership. */
  report_id: string;
  built_at: string;
  policy_id: "personal_context_engine_policy_v1";
};

export type PersonalContextEngineInput = {
  chart: import("../individualSaju/types").IndividualSajuChart;
  lens?: typeof PERSONAL_INNATE_LENS;
  locale?: "ko" | "en";
  dictionary_version?: string;
  options?: {
    max_packets_per_group?: number;
    reserved_t1_t2_per_group?: number;
    /** Default false — omit low-confidence 용희신 unless explicitly true. */
    include_low_confidence?: boolean;
    include_unpossessed_specials?: boolean;
    max_nobles?: number;
    max_non_noble_shinsal?: number;
  };
};

export type PersonalContextEngineOutput = {
  schema_version: typeof PERSONAL_CE_VERSION | string;
  lens: typeof PERSONAL_INNATE_LENS | string;
  /** Convenience index of `packets` by group — not a second fact store. */
  groups: Record<PersonalContextGroupId, PersonalContextPacket[]>;
  /** Canonical ordered packet list. */
  packets: PersonalContextPacket[];
  aggregates: PersonalContextAggregates;
  exclusions: PersonalContextExclusion[];
  unresolved_references: UnresolvedReference[];
  provenance: PersonalContextProvenance;
};
