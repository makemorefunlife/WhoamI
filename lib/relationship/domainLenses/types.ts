/**
 * Multi-Domain Relationship Lens Types & Architecture Contract
 *
 * Provides typed domain lens definitions, canonical meanings, and story planner inputs
 * for all relationship domains (Partner, Family Parent-Child, Friend, Cowork, Romantic).
 */

import type { DomainPairLensId, PairContextPacket, PairDirectionality } from "@/lib/personCore/pairContextEngine/types";
import type { PersonalContextEngineOutput } from "@/lib/personCore/personalContextEngine/types";
import type { PairSajuFacts } from "@/lib/personCore/pairSaju";

// ============================================================================
// 1. Domain Lens Identifiers (34 Canonical Lenses)
// ============================================================================

export type PartnerLensId =
  | "partner_core_bond"
  | "partner_operating_cfo"
  | "partner_household_chores"
  | "partner_private_sanctuary"
  | "partner_bedroom_intimacy"
  | "partner_conflict_trigger"
  | "partner_tempo_rhythm"
  | "partner_crisis_protector"
  | "partner_parenting_alignment"
  | "partner_longterm_vision";

export type FamilyLensId =
  | "family_core_dynamic"
  | "family_discipline_friction"
  | "family_emotional_distance"
  | "family_hidden_needs"
  | "family_praise_trigger"
  | "family_household_roles"
  | "family_safe_boundary"
  | "family_crisis_recovery";

export type FriendLensId =
  | "friend_core_vibe"
  | "friend_treasurer_split"
  | "friend_travel_lead"
  | "friend_emotional_vent"
  | "friend_jealousy_guard"
  | "friend_comfort_distance"
  | "friend_taste_shared"
  | "friend_repair_reconciliation";

export type WorkLensId =
  | "work_leadership_split"
  | "work_task_execution"
  | "work_feedback_cushion"
  | "work_micromanage_guard"
  | "work_stress_reaction"
  | "work_decision_style"
  | "work_special_weapon"
  | "work_burnout_recovery";

export type RomanticLensId =
  | "romantic_attraction_chemistry"
  | "romantic_attachment_reassurance"
  | "romantic_communication_rhythm"
  | "romantic_conflict_repair"
  | "romantic_intimacy_temperature"
  | "romantic_balance_of_power";

export type DomainLensId =
  | PartnerLensId
  | FamilyLensId
  | FriendLensId
  | WorkLensId
  | RomanticLensId;

// ============================================================================
// 2. Lens Evaluation & Canonical Meaning Output
// ============================================================================

export type LensConfidenceLevel = "high" | "medium" | "low" | "insufficient";
export type LensTensionLevel = "low" | "moderate" | "high" | "critical";

export type LensDirectionalityEvaluation = {
  polarity: "symmetric" | "a_to_b" | "b_to_a" | "multipart";
  lead_party?: "A" | "B";
  impact_on_a_ko: string;
  impact_on_b_ko: string;
  impact_on_a_en?: string;
  impact_on_b_en?: string;
};

export type LensSajuEvidenceItem = {
  kind: string;
  fact_path?: string;
  codes?: string[];
  pillar_slot?: string;
  description_ko: string;
  description_en?: string;
};

export type DomainLensEvaluation<TId extends DomainLensId = DomainLensId> = {
  lens_id: TId;
  domain: DomainPairLensId;
  user_question: string;
  emotional_outcome: string;
  canonical_meaning_id: string;
  
  // Normalized Canonical Meaning
  headline_ko: string;
  headline_en: string;
  narrative_ko: string;
  narrative_en: string;
  
  // Relational Dynamics
  tension_level: LensTensionLevel;
  confidence: LensConfidenceLevel;
  is_abstaining?: boolean;
  abstain_reason?: "birth_time_unknown" | "insufficient_evidence" | "neutral_baseline";
  
  directionality?: LensDirectionalityEvaluation;
  
  // Evidence Provenance
  supporting_packet_ids: string[];
  primary_saju_evidence: LensSajuEvidenceItem[];
  personal_ce_contributions: {
    a?: string[];
    b?: string[];
  };
  
  // Migration & Preservation Trace
  recovered_v1_asset_id?: string;
  v1_preservation_status?:
    | "PRESERVED_AS_IS"
    | "ADAPTED_INTO_LENS"
    | "CONFIDENCE_SOFTENED"
    | "ADAPTED_INTO_CANONICAL_MEANING"
    | "ADAPTED_INTO_DOMAIN_LENS";
  
  // LLM Synthesis Guardrails
  llm_synthesis_allowance: {
    allowed_themes: string[];
    prohibited_claims: string[];
  };
};

// ============================================================================
// 3. Domain Story Planner Input Contract
// ============================================================================

export type StoryPlannerChapter = {
  chapter_id: string;
  title_ko: string;
  title_en: string;
  summary_ko: string;
  summary_en: string;
  lens_evaluations: DomainLensEvaluation[];
  synthesis_guide_ko: string;
  synthesis_guide_en: string;
};

export type DomainStoryPlannerInput = {
  schema_version: "domain_story_planner_v1";
  domain: DomainPairLensId;
  parties: {
    a_name: string;
    b_name: string;
    a_role_label?: string;
    b_role_label?: string;
  };
  overall_confidence: LensConfidenceLevel;
  birth_time_unknown_a: boolean;
  birth_time_unknown_b: boolean;
  
  // Core Chapters with Evaluated Lenses
  chapters: StoryPlannerChapter[];
  
  // Normalized Fact Summary
  grounding_summary: {
    total_lenses_evaluated: number;
    high_confidence_count: number;
    abstaining_count: number;
    dominant_element_dynamic: string;
    primary_tension_lens_id?: DomainLensId;
    primary_synergy_lens_id?: DomainLensId;
  };
  
  // Bounded LLM Prompt Context
  evidence_boundary: {
    allowed_synthesis_bullet_points: string[];
    strict_prohibitions: string[];
  };
};

// ============================================================================
// 4. Domain Lens Resolver Input
// ============================================================================

export type DomainLensResolverInput = {
  domain: DomainPairLensId;
  facts: PairSajuFacts;
  pairPackets: PairContextPacket[];
  personalCeA?: PersonalContextEngineOutput;
  personalCeB?: PersonalContextEngineOutput;
  partyNames?: {
    a: string;
    b: string;
  };
  domainPsychScores?: Record<string, number>;
  v1ContextPayload?: Record<string, any>;
};
