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
  | "SPECULATIVE"; // either mode — insufficiently supported, never render-eligible

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
