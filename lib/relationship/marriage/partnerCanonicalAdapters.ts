/**
 * Partner (Marriage / Life Partner) Domain Canonical Meaning Adapters
 *
 * Wraps authoritative V1 Gold Partner resolvers into typed CanonicalMeaningPackets
 * without duplicating, altering, or re-resolving underlying formulas.
 */

import type { CanonicalMeaningPacket } from "@/lib/relationship/domainLenses/canonicalPackets";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { RelationalProfile } from "@/lib/personCore/personalContextEngine/types";
import type { PairElementFlowFact, PairJohuFact, PairYongsinFact } from "@/lib/personCore/pairSaju";
import type { Locale } from "@/lib/i18n/locale";
import { LEGACY_FALLBACK_LOCALE } from "./marriageCopy";
import {
  buildMarriageOperatingCfoCanonical,
  type MarriageOperatingCfoCanonical,
} from "./marriageOperatingCfoCanonical";

// ── 1. Partner Core Bond Adapter ─────────────────────────────────────────────

export type PartnerCoreBondValue = {
  has_stem_combine: boolean;
  has_branch_combine: boolean;
  has_clash: boolean;
  has_flow: boolean;
};

export function resolvePartnerCoreBondCanonical(params: {
  hasStemCombine: boolean;
  hasBranchCombine: boolean;
  hasClash: boolean;
  elementFlow?: PairElementFlowFact | null;
  hasFacts?: boolean;
  unknownHour?: boolean;
  locale?: Locale;
}): CanonicalMeaningPacket<PartnerCoreBondValue> {
  const hasStemCombine = params.hasStemCombine;
  const hasBranchCombine = params.hasBranchCombine;
  const hasFlow = Boolean(params.elementFlow && params.elementFlow.direction !== "none");
  const hasFacts = Boolean(params.hasFacts || hasStemCombine || hasBranchCombine || hasFlow || params.hasClash);

  if (!hasFacts) {
    return {
      meaning_id: "partner_bond_insufficient_evidence",
      status: "abstained",
      confidence: "insufficient",
      directionality: "symmetric",
      evidence: [{ kind: "abstention", detail: "No core combine or element flow indicators" }],
      source_mode: "saju_only",
      value: {
        has_stem_combine: false,
        has_branch_combine: false,
        has_clash: false,
        has_flow: false,
      },
    };
  }

  const isDynamic = hasStemCombine && params.hasClash;
  const meaningId = isDynamic
    ? "partner_bond_dynamic_magnetic"
    : hasStemCombine
      ? "partner_bond_stem_resonance"
      : "partner_bond_complementary_values";

  const confidence = params.unknownHour ? "medium" : "high";

  return {
    meaning_id: meaningId,
    status: isDynamic ? "mixed" : "supported",
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
      has_clash: params.hasClash,
      has_flow: hasFlow,
    },
  };
}

// ── 2. Partner Operating CFO Adapter ──────────────────────────────────────────

export type PartnerOperatingCfoValue = {
  cfo: MarriageOperatingCfoCanonical | null;
  lead_party: "A" | "B" | null;
  selected_nickname: string | null;
};

function scoreGovernance(gov?: string): number {
  if (!gov) return 0;
  if (gov === "diligent_steward" || gov === "growth_capital_accumulator") return 3;
  if (gov === "opportunity_investor") return 1;
  return 0;
}

export function resolvePartnerOperatingCfoCanonical(params: {
  nicknameA: string;
  nicknameB: string;
  countsA: Record<string, number>;
  countsB: Record<string, number>;
  profA?: RelationalProfile | null;
  profB?: RelationalProfile | null;
  psychA?: PsychMasterJson | null;
  psychB?: PsychMasterJson | null;
  elementFlow?: PairElementFlowFact | null;
  hasFacts?: boolean;
  birthTimeUnknownA?: boolean;
  birthTimeUnknownB?: boolean;
  locale?: Locale;
}): CanonicalMeaningPacket<PartnerOperatingCfoValue> {
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const unknownHour = Boolean(params.birthTimeUnknownA || params.birthTimeUnknownB);

  const hasWealth = Boolean(
    params.countsA["정재"] || params.countsA["편재"] ||
    params.countsB["정재"] || params.countsB["편재"] ||
    params.countsA["정관"] || params.countsA["편관"] ||
    params.countsB["정관"] || params.countsB["편관"]
  );
  const hasPsych = Boolean(params.psychA || params.psychB);
  const govA = params.profA?.resource_governance;
  const govB = params.profB?.resource_governance;
  const hasGov = Boolean(govA || govB);

  if (!hasWealth && !hasPsych && !hasGov && !params.hasFacts) {
    return {
      meaning_id: "partner_cfo_insufficient_evidence",
      status: "abstained",
      confidence: "insufficient",
      directionality: "symmetric",
      evidence: [{ kind: "abstention", detail: "No wealth/officer ten-gods, governance, or chart facts" }],
      source_mode: "saju_only",
      value: {
        cfo: null,
        lead_party: null,
        selected_nickname: null,
      },
    };
  }

  let leadParty: "A" | "B" | null = null;
  let selectedNickname = params.nicknameA;

  if (hasGov) {
    const scoreA = scoreGovernance(govA);
    const scoreB = scoreGovernance(govB);
    if (scoreA > scoreB) {
      leadParty = "A";
      selectedNickname = params.nicknameA;
    } else if (scoreB > scoreA) {
      leadParty = "B";
      selectedNickname = params.nicknameB;
    }
  }

  if (!leadParty && (hasWealth || hasPsych)) {
    const wealthA = (params.countsA?.["정재"] ?? 0) + (params.countsA?.["정관"] ?? 0);
    const wealthB = (params.countsB?.["정재"] ?? 0) + (params.countsB?.["정관"] ?? 0);
    if (wealthA > wealthB) {
      leadParty = "A";
      selectedNickname = params.nicknameA;
    } else if (wealthB > wealthA) {
      leadParty = "B";
      selectedNickname = params.nicknameB;
    }
  }

  if (!leadParty && params.elementFlow?.direction) {
    if (params.elementFlow.direction === "a_to_b") {
      leadParty = "A";
      selectedNickname = params.nicknameA;
    } else if (params.elementFlow.direction === "b_to_a") {
      leadParty = "B";
      selectedNickname = params.nicknameB;
    }
  }

  const meaningId = leadParty === "A"
    ? "partner_cfo_party_a_lead"
    : leadParty === "B"
      ? "partner_cfo_party_b_lead"
      : "partner_cfo_dual_governance";

  const confidence = unknownHour ? "medium" : "high";

  return {
    meaning_id: meaningId,
    status: "supported",
    confidence,
    directionality: leadParty ? (leadParty === "A" ? "a_to_b" : "b_to_a") : "symmetric",
    lead_party: leadParty,
    evidence: [
      ...(govA ? [{ kind: "psych_axes" as const, detail: `Party A governance: ${govA}`, source: "survey" as const }] : []),
      ...(govB ? [{ kind: "psych_axes" as const, detail: `Party B governance: ${govB}`, source: "survey" as const }] : []),
      ...(hasWealth ? [{ kind: "ten_god_matrix" as const, detail: "Ten-God wealth balance evaluated", source: "saju" as const }] : []),
    ],
    source_mode: hasGov && hasWealth ? "hybrid" : hasGov ? "survey_only" : "saju_only",
    value: {
      cfo: null,
      lead_party: leadParty,
      selected_nickname: selectedNickname,
    },
  };
}

// ── 3. Partner Household Chores Adapter ───────────────────────────────────────

export type PartnerHouseholdChoresValue = {
  has_clash: boolean;
  has_combine: boolean;
};

export function resolvePartnerHouseholdChoresCanonical(params: {
  hasBranchClash: boolean;
  hasBranchCombine: boolean;
  hasFacts?: boolean;
  unknownHour?: boolean;
  locale?: Locale;
}): CanonicalMeaningPacket<PartnerHouseholdChoresValue> {
  const hasBranchClash = params.hasBranchClash;
  const hasBranchCombine = params.hasBranchCombine;
  const hasFacts = Boolean(params.hasFacts || hasBranchClash || hasBranchCombine);

  if (!hasFacts) {
    return {
      meaning_id: "partner_chores_insufficient_evidence",
      status: "abstained",
      confidence: "insufficient",
      directionality: "symmetric",
      evidence: [{ kind: "abstention", detail: "No branch clash or combine indicators" }],
      source_mode: "saju_only",
      value: {
        has_clash: false,
        has_combine: false,
      },
    };
  }

  const meaningId = hasBranchClash
    ? "partner_chores_zone_division"
    : "partner_chores_fluid_synergy";

  const confidence = params.unknownHour ? "medium" : "high";

  return {
    meaning_id: meaningId,
    status: hasBranchClash ? "mixed" : "supported",
    confidence,
    directionality: "symmetric",
    evidence: [
      ...(hasBranchClash ? [{ kind: "saju_clash", detail: "Branch clash active", source: "saju" as const }] : []),
      ...(hasBranchCombine ? [{ kind: "saju_combine", detail: "Branch combine active", source: "saju" as const }] : []),
    ],
    source_mode: "saju_only",
    value: {
      has_clash: hasBranchClash,
      has_combine: hasBranchCombine,
    },
  };
}

// ── 4. Partner Private Sanctuary Adapter ──────────────────────────────────────

export type PartnerPrivateSanctuaryValue = {
  has_wonjin: boolean;
};

export function resolvePartnerPrivateSanctuaryCanonical(params: {
  hasWonjin: boolean;
  profA?: RelationalProfile | null;
  profB?: RelationalProfile | null;
  hasFacts?: boolean;
  unknownHour?: boolean;
  locale?: Locale;
}): CanonicalMeaningPacket<PartnerPrivateSanctuaryValue> {
  const hasWonjin = params.hasWonjin;
  const solitudeA = params.profA?.solitude_autonomy;
  const solitudeB = params.profB?.solitude_autonomy;
  const hasProf = Boolean(solitudeA || solitudeB);
  const hasFacts = Boolean(params.hasFacts || hasWonjin || hasProf);

  if (!hasFacts) {
    return {
      meaning_id: "partner_space_insufficient_evidence",
      status: "abstained",
      confidence: "insufficient",
      directionality: "symmetric",
      evidence: [{ kind: "abstention", detail: "No wonjin sanctuary indicators or solitude profile" }],
      source_mode: "saju_only",
      value: {
        has_wonjin: false,
      },
    };
  }

  const needsCave = hasWonjin || solitudeA === "high_solitude_needed" || solitudeB === "high_solitude_needed";
  const meaningId = needsCave
    ? "partner_space_solitude_cave_required"
    : "partner_space_natural_coexistence";

  const confidence = params.unknownHour ? "medium" : "high";

  return {
    meaning_id: meaningId,
    status: needsCave ? "mixed" : "supported",
    confidence,
    directionality: "symmetric",
    evidence: [
      ...(hasWonjin ? [{ kind: "saju_wonjin", detail: "Wonjin private space dynamic", source: "saju" as const }] : []),
      ...(hasProf ? [{ kind: "psych_axes", detail: `Solitude autonomy profile: A=${solitudeA ?? "none"}, B=${solitudeB ?? "none"}`, source: "survey" as const }] : []),
    ],
    source_mode: hasWonjin && hasProf ? "hybrid" : hasProf ? "survey_only" : "saju_only",
    value: {
      has_wonjin: hasWonjin,
    },
  };
}

// ── 5. Partner Bedroom Intimacy Adapter ───────────────────────────────────────

export type PartnerBedroomValue = {
  has_johu: boolean;
  is_temperature_contrast: boolean;
};

export function resolvePartnerBedroomCanonical(params: {
  johuRelation?: PairJohuFact | null;
  hasFacts?: boolean;
  unknownHour?: boolean;
  locale?: Locale;
}): CanonicalMeaningPacket<PartnerBedroomValue> {
  const hasJohu = Boolean(params.johuRelation && params.johuRelation.relation !== "neutral");
  const hasFacts = Boolean(params.hasFacts !== undefined ? params.hasFacts : hasJohu);

  if (!hasFacts) {
    return {
      meaning_id: "partner_bedroom_insufficient_evidence",
      status: "abstained",
      confidence: "insufficient",
      directionality: "symmetric",
      evidence: [{ kind: "abstention", detail: "No johu thermal relation data" }],
      source_mode: "saju_only",
      value: {
        has_johu: false,
        is_temperature_contrast: false,
      },
    };
  }

  const isContrast = params.johuRelation?.relation === "mismatch" || Boolean(params.johuRelation?.temperature_mismatch);
  const meaningId = isContrast
    ? "partner_bedroom_thermal_complement"
    : "partner_bedroom_pace_calibration";

  const confidence = params.unknownHour ? "medium" : "high";

  return {
    meaning_id: meaningId,
    status: "supported",
    confidence,
    directionality: "symmetric",
    evidence: [
      { kind: "saju_johu", detail: `Johu thermal relation: ${params.johuRelation?.relation ?? "calibrated"}`, source: "saju" as const },
    ],
    source_mode: "saju_only",
    value: {
      has_johu: true,
      is_temperature_contrast: Boolean(isContrast),
    },
  };
}

// ── 6. Partner Conflict Trigger Adapter ───────────────────────────────────────

export type PartnerConflictTriggerValue = {
  has_stem_clash: boolean;
  has_branch_clash: boolean;
};

export function resolvePartnerConflictTriggerCanonical(params: {
  hasStemClash: boolean;
  hasBranchClash: boolean;
  profA?: RelationalProfile | null;
  profB?: RelationalProfile | null;
  hasFacts?: boolean;
  unknownHour?: boolean;
  locale?: Locale;
}): CanonicalMeaningPacket<PartnerConflictTriggerValue> {
  const hasStemClash = params.hasStemClash;
  const hasBranchClash = params.hasBranchClash;
  const conflictA = params.profA?.conflict_decompression;
  const conflictB = params.profB?.conflict_decompression;
  const hasProf = Boolean(conflictA || conflictB);
  const hasFacts = Boolean(params.hasFacts || hasStemClash || hasBranchClash || hasProf);

  if (!hasFacts) {
    return {
      meaning_id: "partner_conflict_insufficient_evidence",
      status: "abstained",
      confidence: "insufficient",
      directionality: "symmetric",
      evidence: [{ kind: "abstention", detail: "No clash indicators or conflict decompression profile" }],
      source_mode: "saju_only",
      value: {
        has_stem_clash: false,
        has_branch_clash: false,
      },
    };
  }

  const meaningId = hasStemClash
    ? "partner_conflict_cognitive_cushion"
    : hasBranchClash
      ? "partner_conflict_cooling_pause"
      : "partner_conflict_cooling_pause";

  const confidence = params.unknownHour ? "medium" : "high";

  return {
    meaning_id: meaningId,
    status: (hasStemClash || hasBranchClash) ? "mixed" : "supported",
    confidence,
    directionality: "symmetric",
    evidence: [
      ...(hasStemClash ? [{ kind: "saju_clash", detail: "Stem clash active", source: "saju" as const }] : []),
      ...(hasBranchClash ? [{ kind: "saju_clash", detail: "Branch clash active", source: "saju" as const }] : []),
      ...(hasProf ? [{ kind: "psych_axes", detail: `Conflict profile: A=${conflictA ?? "none"}, B=${conflictB ?? "none"}`, source: "survey" as const }] : []),
    ],
    source_mode: (hasStemClash || hasBranchClash) && hasProf ? "hybrid" : hasProf ? "survey_only" : "saju_only",
    value: {
      has_stem_clash: hasStemClash,
      has_branch_clash: hasBranchClash,
    },
  };
}

// ── 7. Partner Tempo Rhythm Adapter ───────────────────────────────────────────

export type PartnerTempoRhythmValue = {
  has_flow: boolean;
  is_asymmetric: boolean;
};

export function resolvePartnerTempoRhythmCanonical(params: {
  elementFlow?: PairElementFlowFact | null;
  profA?: RelationalProfile | null;
  profB?: RelationalProfile | null;
  hasFacts?: boolean;
  unknownHour?: boolean;
  locale?: Locale;
}): CanonicalMeaningPacket<PartnerTempoRhythmValue> {
  const hasFlow = Boolean(params.elementFlow && params.elementFlow.direction !== "none");
  const paceA = params.profA?.decision_pace;
  const paceB = params.profB?.decision_pace;
  const hasProf = Boolean(paceA || paceB);
  const hasFacts = Boolean(params.hasFacts || hasFlow || hasProf);

  if (!hasFacts) {
    return {
      meaning_id: "partner_tempo_insufficient_evidence",
      status: "abstained",
      confidence: "insufficient",
      directionality: "symmetric",
      evidence: [{ kind: "abstention", detail: "No element flow tempo data or decision pace profile" }],
      source_mode: "saju_only",
      value: {
        has_flow: false,
        is_asymmetric: false,
      },
    };
  }

  const isAsymmetric = paceA && paceB ? paceA !== paceB : params.elementFlow?.direction === "a_to_b" || params.elementFlow?.direction === "b_to_a";
  const meaningId = isAsymmetric
    ? "partner_tempo_pace_asymmetry"
    : "partner_tempo_synchronized_flow";

  const confidence = params.unknownHour ? "medium" : "high";

  return {
    meaning_id: meaningId,
    status: isAsymmetric ? "mixed" : "supported",
    confidence,
    directionality: params.elementFlow?.direction === "a_to_b" ? "a_to_b" : params.elementFlow?.direction === "b_to_a" ? "b_to_a" : "symmetric",
    lead_party: params.elementFlow?.direction === "a_to_b" ? "A" : params.elementFlow?.direction === "b_to_a" ? "B" : null,
    evidence: [
      ...(params.elementFlow ? [{ kind: "saju_flow", detail: `Element flow: ${params.elementFlow?.direction}`, source: "saju" as const }] : []),
      ...(hasProf ? [{ kind: "psych_axes", detail: `Decision pace profile: A=${paceA ?? "none"}, B=${paceB ?? "none"}`, source: "survey" as const }] : []),
    ],
    source_mode: hasFlow && hasProf ? "hybrid" : hasProf ? "survey_only" : "saju_only",
    value: {
      has_flow: hasFlow,
      is_asymmetric: Boolean(isAsymmetric),
    },
  };
}

// ── 8. Partner Crisis Protector Adapter ───────────────────────────────────────

export type PartnerCrisisProtectorValue = {
  has_trio: boolean;
  has_branch_combine: boolean;
};

export function resolvePartnerCrisisProtectorCanonical(params: {
  hasTrio: boolean;
  hasBranchCombine: boolean;
  profA?: RelationalProfile | null;
  profB?: RelationalProfile | null;
  hasFacts?: boolean;
  unknownHour?: boolean;
  locale?: Locale;
}): CanonicalMeaningPacket<PartnerCrisisProtectorValue> {
  const hasTrio = params.hasTrio;
  const hasBranchCombine = params.hasBranchCombine;
  const pressureA = params.profA?.pressure_response;
  const pressureB = params.profB?.pressure_response;
  const hasProf = Boolean(pressureA || pressureB);
  const hasFacts = Boolean(params.hasFacts || hasTrio || hasBranchCombine || hasProf);

  if (!hasFacts) {
    return {
      meaning_id: "partner_crisis_insufficient_evidence",
      status: "abstained",
      confidence: "insufficient",
      directionality: "symmetric",
      evidence: [{ kind: "abstention", detail: "No trio structure or branch combine anchors" }],
      source_mode: "saju_only",
      value: {
        has_trio: false,
        has_branch_combine: false,
      },
    };
  }

  const meaningId = hasTrio
    ? "partner_crisis_unbreakable_fortress"
    : (hasBranchCombine || pressureA === "resolute_crisis_fighter")
      ? "partner_crisis_resilient_support"
      : "partner_crisis_adaptive_cushion";

  const confidence = params.unknownHour ? "medium" : "high";

  return {
    meaning_id: meaningId,
    status: "supported",
    confidence,
    directionality: "symmetric",
    evidence: [
      ...(hasTrio ? [{ kind: "saju_trio", detail: "Trio structure active", source: "saju" as const }] : []),
      ...(hasBranchCombine ? [{ kind: "saju_combine", detail: "Branch combine active", source: "saju" as const }] : []),
      ...(hasProf ? [{ kind: "psych_axes", detail: `Pressure response: A=${pressureA ?? "none"}, B=${pressureB ?? "none"}`, source: "survey" as const }] : []),
    ],
    source_mode: (hasTrio || hasBranchCombine) && hasProf ? "hybrid" : hasProf ? "survey_only" : "saju_only",
    value: {
      has_trio: hasTrio,
      has_branch_combine: hasBranchCombine,
    },
  };
}

// ── 9. Partner Parenting Alignment Adapter ────────────────────────────────────

export type PartnerParentingValue = {
  has_hour: boolean;
  has_officer_seal: boolean;
};

export function resolvePartnerParentingCanonical(params: {
  stemCountsA: Record<string, number>;
  stemCountsB: Record<string, number>;
  profA?: RelationalProfile | null;
  profB?: RelationalProfile | null;
  hasFacts?: boolean;
  unknownHour?: boolean;
  locale?: Locale;
}): CanonicalMeaningPacket<PartnerParentingValue> {
  const unknownHour = Boolean(params.unknownHour);
  const hasOfficerA = Boolean(params.stemCountsA["정관"] || params.stemCountsA["편관"]);
  const hasOfficerB = Boolean(params.stemCountsB["정관"] || params.stemCountsB["편관"]);
  const hasSealA = Boolean(params.stemCountsA["정인"] || params.stemCountsA["편인"]);
  const hasSealB = Boolean(params.stemCountsB["정인"] || params.stemCountsB["편인"]);
  const hasOfficerSeal = (hasOfficerA || hasOfficerB) && (hasSealA || hasSealB);

  const hasProf = Boolean(
    params.profA?.structure_spontaneity ||
    params.profB?.structure_spontaneity ||
    params.profA?.support_giving_style ||
    params.profB?.support_giving_style
  );

  if (!hasOfficerSeal && !hasProf && !params.hasFacts) {
    return {
      meaning_id: "partner_parenting_insufficient_evidence",
      status: "abstained",
      confidence: "insufficient",
      directionality: "symmetric",
      evidence: [{ kind: "abstention", detail: "Insufficient parenting indicators" }],
      source_mode: "saju_only",
      value: {
        has_hour: false,
        has_officer_seal: false,
      },
    };
  }

  const isDisciplined = params.profA?.structure_spontaneity === "disciplined_framework_driven" || hasOfficerSeal;
  const meaningId = isDisciplined
    ? "partner_parenting_complementary_roles"
    : "partner_parenting_unified_standard";

  const confidence = unknownHour ? "medium" : "high";

  return {
    meaning_id: meaningId,
    status: "supported",
    confidence,
    directionality: "symmetric",
    evidence: [
      { kind: "ten_god_matrix", detail: "Parenting alignment evaluated", source: "saju" as const },
    ],
    source_mode: hasProf && hasOfficerSeal ? "hybrid" : hasProf ? "survey_only" : "saju_only",
    value: {
      has_hour: !unknownHour,
      has_officer_seal: hasOfficerSeal,
    },
  };
}

// ── 10. Partner Longterm Vision Adapter ───────────────────────────────────────

export type PartnerLongtermVisionValue = {
  has_trio: boolean;
  has_yongsin: boolean;
  has_stem_combine: boolean;
};

export function resolvePartnerLongtermVisionCanonical(params: {
  hasTrio: boolean;
  yongsinAlignment?: PairYongsinFact | null;
  hasStemCombine: boolean;
  hasFacts?: boolean;
  unknownHour?: boolean;
  locale?: Locale;
}): CanonicalMeaningPacket<PartnerLongtermVisionValue> {
  const hasTrio = params.hasTrio;
  const hasYongsin = Boolean(params.yongsinAlignment && params.yongsinAlignment.relation === "overlap");
  const hasStemCombine = params.hasStemCombine;
  const hasFacts = Boolean(params.hasFacts || hasTrio || hasYongsin || hasStemCombine);

  if (!hasFacts) {
    return {
      meaning_id: "partner_vision_insufficient_evidence",
      status: "abstained",
      confidence: "insufficient",
      directionality: "symmetric",
      evidence: [{ kind: "abstention", detail: "No trio hits, yongsin alignment, or stem combines" }],
      source_mode: "saju_only",
      value: {
        has_trio: false,
        has_yongsin: false,
        has_stem_combine: false,
      },
    };
  }

  const meaningId = hasTrio
    ? "partner_vision_shared_trio_horizon"
    : (hasStemCombine || hasYongsin)
      ? "partner_vision_parallel_alignment"
      : "partner_vision_dynamic_recalibration";

  const confidence = params.unknownHour ? "medium" : "high";

  return {
    meaning_id: meaningId,
    status: "supported",
    confidence,
    directionality: "symmetric",
    evidence: [
      ...(hasTrio ? [{ kind: "saju_trio", detail: "Trio structure active", source: "saju" as const }] : []),
      ...(hasYongsin ? [{ kind: "saju_yongsin", detail: `Yongsin alignment: ${params.yongsinAlignment?.relation}`, source: "saju" as const }] : []),
      ...(hasStemCombine ? [{ kind: "saju_combine", detail: "Stem combine active", source: "saju" as const }] : []),
    ],
    source_mode: "saju_only",
    value: {
      has_trio: hasTrio,
      has_yongsin: hasYongsin,
      has_stem_combine: hasStemCombine,
    },
  };
}
