/**
 * Phase 4A — Expert Intelligence layer types.
 *
 * These findings are LLM-derived (unlike everything in canonicalStoryPlanTypes.ts,
 * which is deterministic). Kept in a separate file on purpose — this is a
 * structurally different trust tier and should never be silently mixed into
 * the deterministic CanonicalRelationshipStoryPlan type.
 */

export type RomanticExpertMode = "evidence_synthesis" | "saju_discovery";

export type RomanticExpertClassification =
  | "SUPPORTED_SYNTHESIS" // Mode A only — combines existing deterministic evidence
  | "EXPERT_DERIVED" // Mode B only — new interpretation from raw chart evidence
  | "SPECULATIVE" // either mode — insufficiently supported, never render-eligible
  | "INDIVIDUAL_ONLY"; // Mode B only — a real chart fact, but about one person, not a
  // pair-level interaction (spec Phase 5A §4: "If [why does this depend on THIS
  // pair] cannot be answered, it is not a pair-level expert finding. Reject it or
  // classify it as individual context, not Romantic Expert Discovery."). Never
  // render-eligible — distinct from SPECULATIVE so the audit trail can tell
  // "not evidenced" apart from "evidenced but not pair-specific".

export type RomanticExpertNovelty =
  | "reinforces_existing"
  | "deepens_existing"
  | "genuinely_additive"
  | "duplicate";

export type RomanticExpertPsychStatus =
  | "CONFIRMED_BY_CURRENT"
  | "CONTRADICTED_BY_CURRENT"
  | "NOT_MEASURED"
  | "MIXED";

export type RomanticExpertClaimBoundary = {
  supported: string;
  notSupported: string;
};

export type RomanticExpertPsychCrossCheck = {
  status: RomanticExpertPsychStatus;
  /** Which axis (if any) this was checked against — required whenever status
   * is CONFIRMED_BY_CURRENT or CONTRADICTED_BY_CURRENT, so the claim can be
   * traced back to a real axisResults entry rather than trusted blindly. */
  axisKey: string | null;
  note: string;
};

/** Raw shape the LLM is asked to return (before validation tightens it). */
export type RomanticExpertFindingRaw = {
  id?: string;
  mode?: string;
  classification?: string;
  insightType?: string;
  subjects?: string[];
  claim?: string;
  evidenceRefs?: string[];
  sajuEvidence?: string[];
  deterministicEvidence?: string[];
  reasoning?: string;
  confidence?: string;
  novelty?: string;
  claimBoundary?: { supported?: string; notSupported?: string };
  suggestedChapter?: string;
  renderEligible?: boolean;
  psychCrossCheck?: { status?: string; axisKey?: string | null; note?: string };
  /** Mode B only (Phase 5A §4) — one sentence: why does this finding depend
   * on THIS pair rather than either person's chart alone? Required for
   * EXPERT_DERIVED; missing/empty forces a downgrade to INDIVIDUAL_ONLY. */
  pairDependency?: string;
};

/** Validated, classification-enforced finding — the only shape any consumer
 * (including a future Phase 4B renderer) should ever read. */
export type RomanticExpertFinding = {
  id: string;
  mode: RomanticExpertMode;
  classification: RomanticExpertClassification;
  insightType: string;
  subjects: Array<"a" | "b" | "pair">;
  claim: string;
  evidenceRefs: string[];
  /** Non-empty only for EXPERT_DERIVED findings — see validateExpertFindings. */
  sajuEvidence: string[];
  deterministicEvidence: string[];
  reasoning: string;
  confidence: "high" | "medium" | "low";
  novelty: RomanticExpertNovelty;
  claimBoundary: RomanticExpertClaimBoundary;
  suggestedChapter: string;
  /** Deterministically re-derived from classification+novelty during
   * validation — the model's own renderEligible claim is never trusted as-is. */
  renderEligible: boolean;
  psychCrossCheck?: RomanticExpertPsychCrossCheck;
  /** Populated by validateExpertFindings when a finding is downgraded/rejected
   * — never populated by the LLM itself. Not shown to end users; audit trail. */
  rejectionReason?: string;
  /** Mode B only — see RomanticExpertFindingRaw.pairDependency. Empty string
   * for Mode A findings (not applicable — Mode A never does raw discovery). */
  pairDependency: string;
  /** Phase 5A §8 — deterministic quality signals, server-computed (never
   * trusted from the model). Internal audit/filtering use; not necessarily
   * shown to end users. Populated only for Mode B (EXPERT_DERIVED-eligible)
   * findings — undefined for Mode A. */
  discoveryQuality?: {
    /** Count of distinct chart-sides ("A:"/"B:"/"AB:" tags) cited in sajuEvidence. */
    evidenceStrength: "single" | "multi";
    /** True when sajuEvidence cites structure from BOTH charts (an "AB:"-tagged
     * item, or at least one "A:" item and one "B:" item) — the deterministic
     * proxy for spec §5's "A structure × B structure -> interaction meaning". */
    crossChart: boolean;
    /** Bigram-similarity match against a small bank of known-generic relationship
     * phrases (spec §9's "swap the names, still true?" test) — a heuristic, not
     * a semantic judgment. */
    genericnessRisk: "low" | "high";
  };
};

export type RomanticExpertIntelligenceMeta = {
  model: string;
  callCount: number;
  modeACount: number;
  modeBCount: number;
  totalFindingsReturned: number;
  totalFindingsRenderEligible: number;
  failed: boolean;
  failureReason?: string;
};

export type RomanticExpertIntelligenceResult = {
  findings: RomanticExpertFinding[];
  meta: RomanticExpertIntelligenceMeta;
};
