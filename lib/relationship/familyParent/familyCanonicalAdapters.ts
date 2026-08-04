/**
 * Family (Parent-Child) Domain Canonical Meaning Adapters
 *
 * Wraps authoritative V1 Gold Family resolvers into typed CanonicalMeaningPackets
 * without duplicating, altering, or re-resolving underlying formulas.
 */

import type { CanonicalMeaningPacket } from "@/lib/relationship/domainLenses/canonicalPackets";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { RelationalProfile } from "@/lib/personCore/personalContextEngine/types";
import type { PairElementFlowFact } from "@/lib/personCore/pairSaju";
import type { Locale } from "@/lib/i18n/locale";
import { LEGACY_FALLBACK_LOCALE } from "./familyParentCopy";

// ── 1. Family Core Dynamic Adapter ───────────────────────────────────────────

export type FamilyCoreDynamicValue = {
  has_stem_combine: boolean;
  has_branch_combine: boolean;
  element_flow_direction: string | null;
};

export function resolveFamilyCoreDynamicCanonical(params: {
  hasStemCombine: boolean;
  hasBranchCombine: boolean;
  elementFlow?: PairElementFlowFact | null;
  profA?: RelationalProfile | null;
  profB?: RelationalProfile | null;
  hasFacts?: boolean;
  unknownHour?: boolean;
  locale?: Locale;
}): CanonicalMeaningPacket<FamilyCoreDynamicValue> {
  const hasStemCombine = params.hasStemCombine;
  const hasBranchCombine = params.hasBranchCombine;
  const hasFlow = Boolean(params.elementFlow && params.elementFlow.direction !== "none");
  const hasProf = Boolean(params.profA || params.profB);
  const hasFacts = Boolean(params.hasFacts || hasStemCombine || hasBranchCombine || hasFlow || hasProf);

  if (!hasFacts) {
    return {
      meaning_id: "family_core_insufficient_evidence",
      status: "abstained",
      confidence: "insufficient",
      directionality: "symmetric",
      evidence: [{ kind: "abstention", detail: "No attachment combines or element flow detected" }],
      source_mode: "saju_only",
      value: {
        has_stem_combine: false,
        has_branch_combine: false,
        element_flow_direction: null,
      },
    };
  }

  const isWarmNurture = hasStemCombine || (params.elementFlow && params.elementFlow.direction === "a_to_b");
  const meaningId = isWarmNurture
    ? "family_core_warm_nurture"
    : "family_core_independent_bond";

  const confidence = params.unknownHour ? "low" : "high";

  return {
    meaning_id: meaningId,
    status: "supported",
    confidence,
    directionality: params.elementFlow?.direction === "a_to_b" ? "a_to_b" : params.elementFlow?.direction === "b_to_a" ? "b_to_a" : "symmetric",
    lead_party: params.elementFlow?.direction === "a_to_b" ? "A" : params.elementFlow?.direction === "b_to_a" ? "B" : null,
    evidence: [
      ...(hasStemCombine ? [{ kind: "saju_combine", detail: "Stem combine active", source: "saju" as const }] : []),
      ...(hasBranchCombine ? [{ kind: "saju_combine", detail: "Branch combine active", source: "saju" as const }] : []),
      ...(params.elementFlow ? [{ kind: "saju_flow", detail: `Element flow: ${params.elementFlow.direction}`, source: "saju" as const }] : []),
    ],
    source_mode: "saju_only",
    value: {
      has_stem_combine: hasStemCombine,
      has_branch_combine: hasBranchCombine,
      element_flow_direction: params.elementFlow?.direction ?? null,
    },
  };
}

// ── 2. Family Discipline Friction Adapter ─────────────────────────────────────

export type FamilyDisciplineValue = {
  has_clash: boolean;
  is_overcomes: boolean;
  has_stem_clash: boolean;
  has_branch_clash: boolean;
};

export function resolveFamilyDisciplineCanonical(params: {
  hasStemClash: boolean;
  hasBranchClash: boolean;
  elementFlow?: PairElementFlowFact | null;
  profA?: RelationalProfile | null;
  profB?: RelationalProfile | null;
  hasFacts?: boolean;
  unknownHour?: boolean;
  locale?: Locale;
}): CanonicalMeaningPacket<FamilyDisciplineValue> {
  const hasStemClash = params.hasStemClash;
  const hasBranchClash = params.hasBranchClash;
  const isOvercomes = Boolean(params.elementFlow?.interaction_code?.includes("overcomes"));
  const hasProf = Boolean(params.profA || params.profB);
  const hasFacts = Boolean(params.hasFacts || hasStemClash || hasBranchClash || isOvercomes || hasProf);

  if (!hasFacts) {
    return {
      meaning_id: "family_discipline_insufficient_evidence",
      status: "abstained",
      confidence: "insufficient",
      directionality: "symmetric",
      evidence: [{ kind: "abstention", detail: "No clash or overcomes indicators" }],
      source_mode: "saju_only",
      value: {
        has_clash: false,
        is_overcomes: false,
        has_stem_clash: false,
        has_branch_clash: false,
      },
    };
  }

  const meaningId = hasStemClash
    ? "family_discipline_cushion_needed"
    : (hasBranchClash || isOvercomes)
      ? "family_discipline_cooling_space"
      : "family_discipline_cushion_needed";

  const confidence = params.unknownHour ? "low" : "high";

  return {
    meaning_id: meaningId,
    status: hasStemClash || hasBranchClash ? "mixed" : "supported",
    confidence,
    directionality: isOvercomes ? "a_to_b" : "symmetric",
    lead_party: isOvercomes ? "A" : null,
    evidence: [
      ...(hasStemClash ? [{ kind: "saju_clash", detail: "Stem clash active", source: "saju" as const }] : []),
      ...(hasBranchClash ? [{ kind: "saju_clash", detail: "Branch clash active", source: "saju" as const }] : []),
      ...(isOvercomes ? [{ kind: "saju_flow", detail: "Generational overcome dynamic", source: "saju" as const }] : []),
    ],
    source_mode: "saju_only",
    value: {
      has_clash: hasStemClash || hasBranchClash,
      is_overcomes: isOvercomes,
      has_stem_clash: hasStemClash,
      has_branch_clash: hasBranchClash,
    },
  };
}

// ── 3. Family Distance Sanctuary Adapter ──────────────────────────────────────

export type FamilyDistanceValue = {
  has_wonjin: boolean;
  has_gongmang: boolean;
};

export function resolveFamilyDistanceCanonical(params: {
  hasWonjin: boolean;
  hasGongmang: boolean;
  profA?: RelationalProfile | null;
  profB?: RelationalProfile | null;
  hasFacts?: boolean;
  unknownHour?: boolean;
  locale?: Locale;
}): CanonicalMeaningPacket<FamilyDistanceValue> {
  const hasWonjin = params.hasWonjin;
  const hasGongmang = params.hasGongmang;
  const solitudeA = params.profA?.solitude_autonomy;
  const solitudeB = params.profB?.solitude_autonomy;
  const hasProf = Boolean(solitudeA || solitudeB);
  const hasFacts = Boolean(params.hasFacts || hasWonjin || hasGongmang || hasProf);

  if (!hasFacts) {
    return {
      meaning_id: "family_distance_insufficient_evidence",
      status: "abstained",
      confidence: "insufficient",
      directionality: "symmetric",
      evidence: [{ kind: "abstention", detail: "No wonjin or gongmang distance signals" }],
      source_mode: "saju_only",
      value: {
        has_wonjin: false,
        has_gongmang: false,
      },
    };
  }

  const isSanctuary = hasWonjin || solitudeB === "high_solitude_needed";
  const meaningId = isSanctuary
    ? "family_distance_respect_sanctuary"
    : "family_distance_warm_proximity";

  const confidence = params.unknownHour ? "low" : "high";

  return {
    meaning_id: meaningId,
    status: isSanctuary ? "mixed" : "supported",
    confidence,
    directionality: "symmetric",
    evidence: [
      ...(hasWonjin ? [{ kind: "saju_wonjin", detail: "Wonjin / Guimun dynamic active", source: "saju" as const }] : []),
      ...(hasGongmang ? [{ kind: "saju_gongmang", detail: "Gongmang boundary active", source: "saju" as const }] : []),
      ...(hasProf ? [{ kind: "psych_axes", detail: `Solitude autonomy: child=${solitudeB ?? "none"}`, source: "survey" as const }] : []),
    ],
    source_mode: (hasWonjin || hasGongmang) && hasProf ? "hybrid" : hasProf ? "survey_only" : "saju_only",
    value: {
      has_wonjin: hasWonjin,
      has_gongmang: hasGongmang,
    },
  };
}

// ── 4. Family Hidden Needs Adapter ────────────────────────────────────────────

export type FamilyHiddenNeedsValue = {
  has_stem_combine: boolean;
  has_flow: boolean;
};

export function resolveFamilyHiddenNeedsCanonical(params: {
  hasStemCombine: boolean;
  elementFlow?: PairElementFlowFact | null;
  profA?: RelationalProfile | null;
  profB?: RelationalProfile | null;
  hasFacts?: boolean;
  unknownHour?: boolean;
  locale?: Locale;
}): CanonicalMeaningPacket<FamilyHiddenNeedsValue> {
  const hasStemCombine = params.hasStemCombine;
  const hasFlow = Boolean(params.elementFlow && params.elementFlow.direction !== "none");
  const recB = params.profB?.recognition_need;
  const hasProf = Boolean(recB);
  const hasFacts = Boolean(params.hasFacts || hasStemCombine || hasFlow || hasProf);

  if (!hasFacts) {
    return {
      meaning_id: "family_needs_insufficient_evidence",
      status: "abstained",
      confidence: "insufficient",
      directionality: "symmetric",
      evidence: [{ kind: "abstention", detail: "No stem combine or element flow indicators" }],
      source_mode: "saju_only",
      value: {
        has_stem_combine: false,
        has_flow: false,
      },
    };
  }

  const meaningId = (hasStemCombine || recB === "empathy_seeking")
    ? "family_needs_validation_longing"
    : "family_needs_autonomy_affirmation";

  const confidence = params.unknownHour ? "low" : "high";

  return {
    meaning_id: meaningId,
    status: "supported",
    confidence,
    directionality: params.elementFlow?.direction === "a_to_b" ? "a_to_b" : "symmetric",
    lead_party: params.elementFlow?.direction === "a_to_b" ? "A" : null,
    evidence: [
      ...(hasStemCombine ? [{ kind: "saju_combine", detail: "Stem combine active", source: "saju" as const }] : []),
      ...(params.elementFlow ? [{ kind: "saju_flow", detail: `Element flow: ${params.elementFlow?.direction}`, source: "saju" as const }] : []),
      ...(hasProf ? [{ kind: "psych_axes", detail: `Recognition need: child=${recB ?? "none"}`, source: "survey" as const }] : []),
    ],
    source_mode: (hasStemCombine || hasFlow) && hasProf ? "hybrid" : hasProf ? "survey_only" : "saju_only",
    value: {
      has_stem_combine: hasStemCombine,
      has_flow: hasFlow,
    },
  };
}

// ── 5. Family Praise Trigger Adapter ──────────────────────────────────────────

export type FamilyPraiseValue = {
  has_branch_combine: boolean;
};

export function resolveFamilyPraiseCanonical(params: {
  hasBranchCombine: boolean;
  profA?: RelationalProfile | null;
  profB?: RelationalProfile | null;
  hasFacts?: boolean;
  unknownHour?: boolean;
  locale?: Locale;
}): CanonicalMeaningPacket<FamilyPraiseValue> {
  const hasBranchCombine = params.hasBranchCombine;
  const expB = params.profB?.expression_style;
  const hasProf = Boolean(expB);
  const hasFacts = Boolean(params.hasFacts || hasBranchCombine || hasProf);

  if (!hasFacts) {
    return {
      meaning_id: "family_praise_insufficient_evidence",
      status: "abstained",
      confidence: "insufficient",
      directionality: "symmetric",
      evidence: [{ kind: "abstention", detail: "No branch combine indicators" }],
      source_mode: "saju_only",
      value: {
        has_branch_combine: false,
      },
    };
  }

  const meaningId = (hasBranchCombine || expB === "reserved_observer")
    ? "family_praise_specific_process"
    : "family_praise_baseline";

  const confidence = params.unknownHour ? "low" : "high";

  return {
    meaning_id: meaningId,
    status: "supported",
    confidence,
    directionality: "symmetric",
    evidence: [
      ...(hasBranchCombine ? [{ kind: "saju_combine", detail: "Branch combine active", source: "saju" as const }] : []),
      ...(hasProf ? [{ kind: "psych_axes", detail: `Expression style: child=${expB ?? "none"}`, source: "survey" as const }] : []),
    ],
    source_mode: hasBranchCombine && hasProf ? "hybrid" : hasProf ? "survey_only" : "saju_only",
    value: {
      has_branch_combine: hasBranchCombine,
    },
  };
}

// ── 6. Family Household Roles Adapter ─────────────────────────────────────────

export type FamilyHouseholdRolesValue = {
  has_combine: boolean;
  has_flow: boolean;
};

export function resolveFamilyHouseholdRolesCanonical(params: {
  hasBranchCombine: boolean;
  hasStemCombine: boolean;
  elementFlow?: PairElementFlowFact | null;
  profA?: RelationalProfile | null;
  profB?: RelationalProfile | null;
  hasFacts?: boolean;
  unknownHour?: boolean;
  locale?: Locale;
}): CanonicalMeaningPacket<FamilyHouseholdRolesValue> {
  const hasCombine = params.hasBranchCombine || params.hasStemCombine;
  const hasFlow = Boolean(params.elementFlow && params.elementFlow.direction !== "none");
  const structB = params.profB?.structure_spontaneity;
  const hasProf = Boolean(structB);
  const hasFacts = Boolean(params.hasFacts || hasCombine || hasFlow || hasProf);

  if (!hasFacts) {
    return {
      meaning_id: "family_roles_insufficient_evidence",
      status: "abstained",
      confidence: "insufficient",
      directionality: "symmetric",
      evidence: [{ kind: "abstention", detail: "No combine or flow indicators" }],
      source_mode: "saju_only",
      value: {
        has_combine: false,
        has_flow: false,
      },
    };
  }

  const meaningId = hasCombine
    ? "family_roles_flexible_cooperation"
    : "family_roles_collaborative_order";

  const confidence = params.unknownHour ? "low" : "high";

  return {
    meaning_id: meaningId,
    status: "supported",
    confidence,
    directionality: "symmetric",
    evidence: [
      ...(hasCombine ? [{ kind: "saju_combine", detail: "Combine hit active", source: "saju" as const }] : []),
      ...(hasFlow ? [{ kind: "saju_flow", detail: `Element flow: ${params.elementFlow?.direction}`, source: "saju" as const }] : []),
      ...(hasProf ? [{ kind: "psych_axes", detail: `Structure profile: child=${structB ?? "none"}`, source: "survey" as const }] : []),
    ],
    source_mode: (hasCombine || hasFlow) && hasProf ? "hybrid" : hasProf ? "survey_only" : "saju_only",
    value: {
      has_combine: hasCombine,
      has_flow: hasFlow,
    },
  };
}

// ── 7. Family Safe Boundary Adapter ───────────────────────────────────────────

export type FamilySafeBoundaryValue = {
  has_wonjin: boolean;
  has_clash: boolean;
};

export function resolveFamilySafeBoundaryCanonical(params: {
  hasWonjin: boolean;
  hasClash: boolean;
  profA?: RelationalProfile | null;
  profB?: RelationalProfile | null;
  hasFacts?: boolean;
  unknownHour?: boolean;
  locale?: Locale;
}): CanonicalMeaningPacket<FamilySafeBoundaryValue> {
  const hasWonjin = params.hasWonjin;
  const hasClash = params.hasClash;
  const boundB = params.profB?.boundary_defense_strength;
  const hasProf = Boolean(boundB);
  const hasFacts = Boolean(params.hasFacts || hasWonjin || hasClash || hasProf);

  if (!hasFacts) {
    return {
      meaning_id: "family_boundary_insufficient_evidence",
      status: "abstained",
      confidence: "insufficient",
      directionality: "symmetric",
      evidence: [{ kind: "abstention", detail: "No boundary tension or wonjin indicators" }],
      source_mode: "saju_only",
      value: {
        has_wonjin: false,
        has_clash: false,
      },
    };
  }

  const isClearRespect = hasWonjin || boundB === "uncompromising_sovereignty";
  const meaningId = isClearRespect
    ? "family_boundary_clear_respect"
    : "family_boundary_healthy_individuation";

  const confidence = params.unknownHour ? "low" : "high";

  return {
    meaning_id: meaningId,
    status: isClearRespect ? "mixed" : "supported",
    confidence,
    directionality: "symmetric",
    evidence: [
      ...(hasWonjin ? [{ kind: "saju_wonjin", detail: "Wonjin boundary dynamic", source: "saju" as const }] : []),
      ...(hasClash ? [{ kind: "saju_clash", detail: "Clash boundary dynamic", source: "saju" as const }] : []),
      ...(hasProf ? [{ kind: "psych_axes", detail: `Boundary defense: child=${boundB ?? "none"}`, source: "survey" as const }] : []),
    ],
    source_mode: (hasWonjin || hasClash) && hasProf ? "hybrid" : hasProf ? "survey_only" : "saju_only",
    value: {
      has_wonjin: hasWonjin,
      has_clash: hasClash,
    },
  };
}

// ── 8. Family Crisis Recovery Adapter ─────────────────────────────────────────

export type FamilyCrisisRecoveryValue = {
  has_clash: boolean;
  has_stem_combine: boolean;
};

export function resolveFamilyCrisisRecoveryCanonical(params: {
  hasClash: boolean;
  hasStemCombine: boolean;
  profA?: RelationalProfile | null;
  profB?: RelationalProfile | null;
  hasFacts?: boolean;
  unknownHour?: boolean;
  locale?: Locale;
}): CanonicalMeaningPacket<FamilyCrisisRecoveryValue> {
  const hasClash = params.hasClash;
  const hasStemCombine = params.hasStemCombine;
  const confB = params.profB?.conflict_decompression;
  const hasProf = Boolean(confB);
  const hasFacts = Boolean(params.hasFacts || hasClash || hasStemCombine || hasProf);

  if (!hasFacts) {
    return {
      meaning_id: "family_repair_insufficient_evidence",
      status: "abstained",
      confidence: "insufficient",
      directionality: "symmetric",
      evidence: [{ kind: "abstention", detail: "No clash or stem combine indicators" }],
      source_mode: "saju_only",
      value: {
        has_clash: false,
        has_stem_combine: false,
      },
    };
  }

  const meaningId = hasStemCombine
    ? "family_repair_conversational_apology"
    : "family_repair_cooling_timeout";

  const confidence = params.unknownHour ? "low" : "high";

  return {
    meaning_id: meaningId,
    status: hasClash ? "mixed" : "supported",
    confidence,
    directionality: "symmetric",
    evidence: [
      ...(hasStemCombine ? [{ kind: "saju_combine", detail: "Stem combine bridge", source: "saju" as const }] : []),
      ...(hasClash ? [{ kind: "saju_clash", detail: "Clash recovery dynamic", source: "saju" as const }] : []),
      ...(hasProf ? [{ kind: "psych_axes", detail: `Conflict decompression: child=${confB ?? "none"}`, source: "survey" as const }] : []),
    ],
    source_mode: (hasClash || hasStemCombine) && hasProf ? "hybrid" : hasProf ? "survey_only" : "saju_only",
    value: {
      has_clash: hasClash,
      has_stem_combine: hasStemCombine,
    },
  };
}
