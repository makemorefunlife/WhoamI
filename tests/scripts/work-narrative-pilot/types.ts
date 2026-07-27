/**
 * Work Narrative Pilot — types (Batch IV package shape).
 * Pilot-only; not imported by production Work paths.
 */

export type PilotVariant = "A" | "B" | "C";

export type PilotPairCategory =
  | "similar"
  | "highly_different"
  | "complementary"
  | "conflict_heavy";

export const WORK_NARRATIVE_SECTION_IDS = [
  "pair_snapshot",
  "individual_work_styles",
  "communication_and_reporting",
  "decision_and_execution_dynamics",
  "trust_recognition_and_hidden_tension",
  "stress_loop",
  "practical_prescriptions",
] as const;

export type WorkNarrativeSectionId =
  (typeof WORK_NARRATIVE_SECTION_IDS)[number];

export type WorkNarrativeSections = Record<
  WorkNarrativeSectionId,
  { title: string; body: string }
>;

export type WorkPilotBindingTruth = {
  ab_identity: {
    person_a_key: "A";
    person_b_key: "B";
    nickname_a: string;
    nickname_b: string;
  };
  comparison_table: Record<string, { band_a: string; band_b: string }>;
  leadership_split: {
    external_lead: string;
    internal_qa_lead: string;
    confidence?: string;
    align?: string;
  } | null;
  leadership_scope_note: string;
};

export type WorkPilotPsychAxisRow = {
  axis_key: string;
  score_a: number;
  score_b: number;
  gap: number;
  match_type: string;
};

/** Salience label — derived from existing psych match_type + officePsychFit 60/40 bands. */
export type PsychPairPatternKind =
  | "both_high"
  | "both_low"
  | "high_gap"
  | "moderate_gap"
  | "similar_mid"
  | "similar_high"
  | "similar_low";

export type PsychPairPatternRow = {
  axis_key: string;
  pattern: PsychPairPatternKind;
  score_a: number;
  score_b: number;
  gap: number;
  match_type: string;
  priority: "high" | "medium" | "low";
  source_family: "psych";
  supports_contrast: boolean;
  supports_similarity: boolean;
  narrative_relevance?: string;
};

export type StructuredEvidenceItem = {
  source_family: string;
  signal: string;
  person_scope: "a" | "b" | "both" | "pair";
  priority: "high" | "medium" | "low";
  confidence?: string;
  direction?: string;
  supports_contrast?: boolean;
  supports_similarity?: boolean;
  evidence_basis?: string[];
  value?: string | number | boolean | null;
};

export type CommunicationSignals = {
  a: { reporting_preference: string; confidence: string };
  b: { reporting_preference: string; confidence: string };
  /** True only when A/B reporting_preference labels differ. */
  contrast_supported: boolean;
  /**
   * What the contrast means when supported. Never "fast vs detail" /
   * "빠른 vs 꼼꼼" — those are stock interpretation copy.
   */
  contrast_means: string | null;
  /** Always false in this pilot — stock contrast is never primary evidence. */
  stock_fast_vs_detail_allowed: false;
  note: string;
};

/** LLM section routing — salience only, not a production resolver. */
export type NarrativeRouting = {
  identity: {
    use_exact_nicknames: true;
    nickname_a: string;
    nickname_b: string;
    do_not_translate_or_localize_nicknames: true;
  };
  leadership_split: {
    home_section: "decision_and_execution_dynamics";
    forbidden_sections: string[];
    provisional: boolean;
  } | null;
};

export type DnaSignals = {
  a: {
    contribution_style: string | null;
    drive_band: string | null;
    stubborn_band: string | null;
    supporting_axes: Array<{ axis_key: string; score: number }>;
  };
  b: {
    contribution_style: string | null;
    drive_band: string | null;
    stubborn_band: string | null;
    supporting_axes: Array<{ axis_key: string; score: number }>;
  };
};

export type EvidenceRelationship = {
  sources: string[];
  relationship: "convergent" | "tension" | "complement";
  interpretation_prompt: string;
};

export type ReferenceCopyBlock = {
  allowed_for_fact_check: true;
  allowed_as_narrative_source: false;
  items: Array<{ key: string; text: string }>;
};

export type WorkPilotContextPackage = {
  schema_version: "work_narrative_pilot_context_v2";
  pair_id: string;
  category: PilotPairCategory;
  locale: string;
  variant: "B" | "C";
  binding_truth: WorkPilotBindingTruth | null;
  evidence_sources: {
    grade: string;
    scores: { activation: number; benefit: number; risk: number };
    scoring_signals: Record<string, boolean>;
    ten_god_complement: {
      person_a: { strong: string[]; lacking: string[] };
      person_b: { strong: string[]; lacking: string[] };
      complements: Array<{
        category: string;
        stronger_side: "A" | "B" | "balanced";
      }>;
    };
    work_signals_a: unknown;
    work_signals_b: unknown;
    /** Structured facts only — no finished prose */
    communication_signals: CommunicationSignals;
    dna_signals: DnaSignals;
    structured_evidence: StructuredEvidenceItem[];
  };
  psych_context: {
    axes: WorkPilotPsychAxisRow[];
    meaningful_gaps: WorkPilotPsychAxisRow[];
    conflict_triggers: Array<{
      axis_key: string;
      gap: number;
      match_type: string;
    }>;
    /** Absolute / gap salience for narrative — not a production judgment */
    pair_patterns: PsychPairPatternRow[];
  };
  saju_context: {
    strength_a: { label: string; note: string };
    strength_b: { label: string; note: string };
    metaphor_a: string;
    metaphor_b: string;
    ten_gods_a: Record<string, number>;
    ten_gods_b: Record<string, number>;
    month_branch_summary: {
      element_a: string;
      element_b: string;
      element_interaction: string;
      synergy_weight?: number;
      tension_weight?: number;
    } | null;
    pairwise_hit_briefs: Array<{
      type: string;
      person_a_pillar: string;
      person_b_pillar: string;
      meaning_ko: string | null;
    }>;
  };
  evidence_relationships: EvidenceRelationship[];
  narrative_routing: NarrativeRouting;
  ambiguities: string[];
  semantic_boundaries: string[];
  /**
   * Isolated deterministic prose. Fact-check only — never narrative source.
   */
  reference_copy: ReferenceCopyBlock;
};

export type DeterministicBaselineArtifact = {
  pair_id: string;
  category: PilotPairCategory;
  nickname_a: string;
  nickname_b: string;
  locale: string;
  meta: {
    grade: string;
    grade_reason: string;
    fit_pct: number;
    synergy_pct: number;
    risk_pct: number;
    uncertain_items: string[];
  };
  canonical_projections: {
    comparison_table?: Record<string, { band_a: string; band_b: string }>;
    leadership_split?: {
      external_lead: string;
      internal_qa_lead: string;
      confidence?: string;
      align?: string;
    };
  };
  office_review: {
    headline: string;
    one_line_definition: string;
    dna: unknown;
    mix_fit: unknown;
    roles: unknown;
    warning: unknown;
    compare_table_rows: Array<{
      id: string;
      label: string;
      band_a: string;
      band_b: string;
      short_label_a: string;
      short_label_b: string;
      meaning: string;
    }>;
  };
  prescriptions: unknown;
  psych_match: unknown;
};
