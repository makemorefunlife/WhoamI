/**
 * Work Domain Canonical Meaning Adapters
 *
 * Wraps authoritative V1 Gold Work resolvers into typed CanonicalMeaningPackets
 * without duplicating, altering, or re-resolving underlying formulas.
 */

import type { CanonicalMeaningPacket } from "@/lib/relationship/domainLenses/canonicalPackets";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { WorkSajuSignals } from "@/lib/personCore/sajuSignals/types";
import type { CrossChartHit, PairSajuFacts, PairElementFlowFact } from "@/lib/personCore/pairSaju";
import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import type { Locale } from "@/lib/i18n/locale";
import { LEGACY_FALLBACK_LOCALE } from "./workColleagueCopy";
import {
  resolveLeadershipRoleSplit,
  type LeadershipRoleSplit,
} from "./officeLanguage";
import {
  refineLeadershipRoleSplit,
  resolveReportingStyleFit,
  resolveBreakBoundaryFit,
  resolveContributionStyle,
  resolveFeedbackCushionScript,
  type ReportingStyleFit,
  type BreakBoundaryFit,
  type ContributionStyleFit,
  type FeedbackCushionScript,
} from "./officePsychFit";
import {
  analyzeTenGodComplement,
  type TenGodComplementResult,
} from "./tenGodComplement";

// ── 1. Work Leadership Split Adapter ─────────────────────────────────────────

export type WorkLeadershipSplitValue = {
  split: LeadershipRoleSplit | null;
  external_lead: "a" | "b" | "balanced" | null;
  internal_qa_lead: "a" | "b" | "balanced" | null;
  lead_party: "A" | "B" | null;
  summary: string | null;
  align?: "confirms" | "caution";
  confidence?: "high" | "low";
};

export function resolveWorkLeadershipSplitCanonical(params: {
  workSignalsA?: WorkSajuSignals;
  workSignalsB?: WorkSajuSignals;
  psychA?: PsychMasterJson | null;
  psychB?: PsychMasterJson | null;
  nicknameA: string;
  nicknameB: string;
  hasStemCombine?: boolean;
  hasFlow?: boolean;
  unknownHour?: boolean;
  locale?: Locale;
}): CanonicalMeaningPacket<WorkLeadershipSplitValue> {
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const base = resolveLeadershipRoleSplit(
    params.workSignalsA,
    params.workSignalsB,
    params.nicknameA,
    params.nicknameB,
    locale,
  );

  let finalized = base;
  if (base && params.psychA && params.psychB && params.workSignalsA && params.workSignalsB) {
    const reporting = resolveReportingStyleFit(
      {},
      {},
      params.workSignalsA,
      params.workSignalsB,
      params.psychA,
      params.psychB,
      params.nicknameA,
      params.nicknameB,
      locale,
    );
    const contribution = resolveContributionStyle(
      params.workSignalsA,
      params.workSignalsB,
      params.psychA,
      params.psychB,
      params.nicknameA,
      params.nicknameB,
      locale,
    );
    const breakBoundary = resolveBreakBoundaryFit(
      [],
      params.psychA,
      params.psychB,
      params.nicknameA,
      params.nicknameB,
      locale,
    );
    finalized = refineLeadershipRoleSplit({
      base,
      workSignalsA: params.workSignalsA,
      workSignalsB: params.workSignalsB,
      psychA: params.psychA,
      psychB: params.psychB,
      reporting,
      contribution,
      breakBoundary,
      nicknameA: params.nicknameA,
      nicknameB: params.nicknameB,
      locale,
    });
  }

  const hasSaju = Boolean(params.workSignalsA && params.workSignalsB);
  const hasPsych = Boolean(params.psychA && params.psychB);
  const hasCombine = Boolean(params.hasStemCombine);
  const hasFlow = Boolean(params.hasFlow);
  const hasSubstance = hasSaju || hasPsych || hasCombine || hasFlow;

  if (!hasSubstance) {
    return {
      meaning_id: "work_leadership_insufficient_evidence",
      status: "abstained",
      confidence: "insufficient",
      directionality: "symmetric",
      evidence: [{ kind: "abstention", detail: "Insufficient saju drive signals and psych profile" }],
      source_mode: "saju_only",
      value: {
        split: null,
        external_lead: null,
        internal_qa_lead: null,
        lead_party: null,
        summary: null,
      },
    };
  }

  if (!finalized) {
    const externalLead = hasCombine ? "balanced" : "a";
    const internalQaLead = hasCombine ? "balanced" : "b";
    finalized = {
      external_lead: externalLead,
      internal_qa_lead: internalQaLead,
      summary: externalLead === "balanced"
        ? `${params.nicknameA}와(과) ${params.nicknameB}는 대외 발표·실무 검수 성향이 비슷하여 유연하게 호흡을 맞춥니다.`
        : `${params.nicknameA}는 대외 발표·리포팅 쪽이 잘 맞고, ${params.nicknameB}는 실무 검수·품질 관리 쪽이 강합니다.`,
      confidence: "low",
    };
  }

  const isLeadA = finalized.external_lead === "a";
  const isLeadB = finalized.external_lead === "b";
  const leadParty = isLeadA ? "A" : isLeadB ? "B" : null;

  const meaningId = finalized.external_lead === "balanced"
    ? "work_leadership_co_architect"
    : "work_leadership_division";

  const confidence = params.unknownHour
    ? "low"
    : finalized.confidence === "high" || (hasSaju && hasPsych)
      ? "high"
      : "medium";

  return {
    meaning_id: meaningId,
    status: finalized.align === "caution" ? "mixed" : "supported",
    confidence,
    directionality: leadParty ? (isLeadA ? "a_to_b" : "b_to_a") : "symmetric",
    lead_party: leadParty,
    evidence: [
      ...(hasSaju ? [{ kind: "saju_drive_stubborn", detail: "Work drive signals evaluated", source: "saju" as const }] : []),
      ...(hasPsych ? [{ kind: "psych_axes", detail: "Psych practicality and structure evaluated", source: "survey" as const }] : []),
      ...(hasCombine ? [{ kind: "saju_combine", detail: "Stem combine indicates unified co-architect synergy", source: "saju" as const }] : []),
      ...(hasFlow ? [{ kind: "saju_flow", detail: "Element flow supports functional division", source: "saju" as const }] : []),
    ],
    source_mode: hasSaju && hasPsych ? "saju_plus_survey" : hasSaju || hasCombine || hasFlow ? "saju_only" : "survey_only",
    value: {
      split: finalized,
      external_lead: finalized.external_lead,
      internal_qa_lead: finalized.internal_qa_lead,
      lead_party: leadParty,
      summary: finalized.summary,
      align: finalized.align,
      confidence: finalized.confidence,
    },
  };
}

// ── 2. Work Task Execution Adapter ────────────────────────────────────────────

export type WorkTaskExecutionValue = {
  contribution: ContributionStyleFit | null;
  has_combine: boolean;
  has_trio: boolean;
};

export function resolveWorkTaskExecutionCanonical(params: {
  workSignalsA?: WorkSajuSignals;
  workSignalsB?: WorkSajuSignals;
  psychA?: PsychMasterJson | null;
  psychB?: PsychMasterJson | null;
  hasBranchCombine?: boolean;
  hasTrio?: boolean;
  hasStemCombine?: boolean;
  nicknameA: string;
  nicknameB: string;
  unknownHour?: boolean;
  locale?: Locale;
}): CanonicalMeaningPacket<WorkTaskExecutionValue> {
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const contribution = resolveContributionStyle(
    params.workSignalsA,
    params.workSignalsB,
    params.psychA,
    params.psychB,
    params.nicknameA,
    params.nicknameB,
    locale,
  );

  const hasCombine = Boolean(params.hasBranchCombine || params.hasStemCombine);
  const hasTrio = Boolean(params.hasTrio);
  const totalEv = (hasCombine ? 1 : 0) + (hasTrio ? 1 : 0) + (contribution ? 1 : 0);

  if (totalEv === 0) {
    return {
      meaning_id: "work_execution_insufficient_evidence",
      status: "abstained",
      confidence: "insufficient",
      directionality: "symmetric",
      evidence: [{ kind: "abstention", detail: "No combine, trio, or contribution style evidence" }],
      source_mode: "saju_only",
      value: {
        contribution: null,
        has_combine: false,
        has_trio: false,
      },
    };
  }

  const meaningId = hasTrio || hasCombine
    ? "work_execution_strategic_cadence"
    : "work_execution_steady_delivery";

  const confidence = params.unknownHour
    ? "low"
    : totalEv >= 2
      ? "high"
      : "medium";

  return {
    meaning_id: meaningId,
    status: "supported",
    confidence,
    directionality: "symmetric",
    evidence: [
      ...(hasCombine ? [{ kind: "saju_combine", detail: "Branch or stem combine active", source: "saju" as const }] : []),
      ...(hasTrio ? [{ kind: "saju_trio", detail: "Trio structure active", source: "saju" as const }] : []),
      ...(contribution ? [{ kind: "psych_contribution", detail: "Psych contribution style evaluated", source: "survey" as const }] : []),
    ],
    source_mode: (hasCombine || hasTrio) && contribution ? "saju_plus_survey" : (hasCombine || hasTrio) ? "saju_only" : "survey_only",
    value: {
      contribution,
      has_combine: hasCombine,
      has_trio: hasTrio,
    },
  };
}

// ── 3. Work Feedback Cushion Adapter ──────────────────────────────────────────

export type WorkFeedbackCushionValue = {
  script: FeedbackCushionScript | null;
  reporting: ReportingStyleFit | null;
  has_stem_clash: boolean;
  has_branch_clash: boolean;
};

export function resolveWorkFeedbackCushionCanonical(params: {
  nicknameA: string;
  nicknameB: string;
  strengthA?: { label: string; note: string };
  strengthB?: { label: string; note: string };
  psychA?: PsychMasterJson | null;
  psychB?: PsychMasterJson | null;
  hasStemClash?: boolean;
  hasBranchClash?: boolean;
  unknownHour?: boolean;
  locale?: Locale;
}): CanonicalMeaningPacket<WorkFeedbackCushionValue> {
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const strengthA = params.strengthA ?? { label: "보통", note: "" };
  const strengthB = params.strengthB ?? { label: "보통", note: "" };

  const script = resolveFeedbackCushionScript(
    params.nicknameA,
    params.nicknameB,
    strengthA,
    strengthB,
    params.psychA,
    params.psychB,
    locale,
  );

  const hasStemClash = Boolean(params.hasStemClash);
  const hasBranchClash = Boolean(params.hasBranchClash);
  const totalEv = (hasStemClash ? 1 : 0) + (hasBranchClash ? 1 : 0) + (script ? 1 : 0);

  if (totalEv === 0) {
    return {
      meaning_id: "work_feedback_insufficient_evidence",
      status: "abstained",
      confidence: "insufficient",
      directionality: "symmetric",
      evidence: [{ kind: "abstention", detail: "No clash signals or feedback script data" }],
      source_mode: "saju_only",
      value: {
        script: null,
        reporting: null,
        has_stem_clash: false,
        has_branch_clash: false,
      },
    };
  }

  const meaningId = hasStemClash
    ? "work_feedback_objective_cushion"
    : "work_feedback_structured_rubric";

  const confidence = params.unknownHour
    ? "low"
    : totalEv >= 2
      ? "high"
      : "medium";

  return {
    meaning_id: meaningId,
    status: hasStemClash ? "mixed" : "supported",
    confidence,
    directionality: "symmetric",
    evidence: [
      ...(hasStemClash ? [{ kind: "saju_clash", detail: "Stem clash active", source: "saju" as const }] : []),
      ...(hasBranchClash ? [{ kind: "saju_clash", detail: "Branch clash active", source: "saju" as const }] : []),
      ...(script ? [{ kind: "psych_feedback", detail: "Feedback cushion script evaluated", source: "survey" as const }] : []),
    ],
    source_mode: (hasStemClash || hasBranchClash) && script ? "saju_plus_survey" : (hasStemClash || hasBranchClash) ? "saju_only" : "survey_only",
    value: {
      script,
      reporting: null,
      has_stem_clash: hasStemClash,
      has_branch_clash: hasBranchClash,
    },
  };
}

// ── 4. Work Micromanage Guard Adapter ─────────────────────────────────────────

export type WorkMicromanageGuardValue = {
  boundary: BreakBoundaryFit | null;
  has_wonjin: boolean;
  has_tension: boolean;
};

export function resolveWorkMicromanageGuardCanonical(params: {
  dayBranchCrossHits?: CrossChartHit[];
  psychA?: PsychMasterJson | null;
  psychB?: PsychMasterJson | null;
  nicknameA: string;
  nicknameB: string;
  hasWonjin?: boolean;
  unknownHour?: boolean;
  locale?: Locale;
}): CanonicalMeaningPacket<WorkMicromanageGuardValue> {
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const hits = params.dayBranchCrossHits ?? [];
  const boundary = resolveBreakBoundaryFit(
    hits,
    params.psychA,
    params.psychB,
    params.nicknameA,
    params.nicknameB,
    locale,
  );

  const hasWonjin = Boolean(params.hasWonjin);
  const hasTension = hits.some((h) => ["충", "형", "파", "해"].includes(h.type));
  const totalEv = (hasWonjin ? 1 : 0) + (hasTension ? 1 : 0) + (boundary ? 1 : 0);

  if (totalEv === 0) {
    return {
      meaning_id: "work_autonomy_insufficient_evidence",
      status: "abstained",
      confidence: "insufficient",
      directionality: "symmetric",
      evidence: [{ kind: "abstention", detail: "No wonjin, tension, or break boundary evidence" }],
      source_mode: "saju_only",
      value: {
        boundary: null,
        has_wonjin: false,
        has_tension: false,
      },
    };
  }

  const meaningId = hasWonjin || hasTension
    ? "work_autonomy_asynchronous_scrum"
    : "work_autonomy_trust_ownership";

  const confidence = params.unknownHour
    ? "low"
    : totalEv >= 2
      ? "high"
      : "medium";

  return {
    meaning_id: meaningId,
    status: hasWonjin || hasTension ? "mixed" : "supported",
    confidence,
    directionality: "symmetric",
    evidence: [
      ...(hasWonjin ? [{ kind: "saju_wonjin", detail: "Wonjin/Guimun active", source: "saju" as const }] : []),
      ...(hasTension ? [{ kind: "saju_tension", detail: "Day branch tension active", source: "saju" as const }] : []),
      ...(boundary ? [{ kind: "psych_boundary", detail: "Break boundary fit evaluated", source: "survey" as const }] : []),
    ],
    source_mode: (hasWonjin || hasTension) && boundary ? "saju_plus_survey" : (hasWonjin || hasTension) ? "saju_only" : "survey_only",
    value: {
      boundary,
      has_wonjin: hasWonjin,
      has_tension: hasTension,
    },
  };
}

// ── 5. Work Stress Reaction Adapter ───────────────────────────────────────────

export type WorkStressReactionValue = {
  has_stem_clash: boolean;
  has_branch_clash: boolean;
  element_flow_direction: string | null;
};

export function resolveWorkStressReactionCanonical(params: {
  hasStemClash: boolean;
  hasBranchClash: boolean;
  elementFlow?: PairElementFlowFact | null;
  unknownHour?: boolean;
  locale?: Locale;
}): CanonicalMeaningPacket<WorkStressReactionValue> {
  const hasStemClash = params.hasStemClash;
  const hasBranchClash = params.hasBranchClash;
  const totalEv = (hasStemClash ? 1 : 0) + (hasBranchClash ? 1 : 0) + (params.elementFlow ? 1 : 0);

  if (totalEv === 0) {
    return {
      meaning_id: "work_stress_insufficient_evidence",
      status: "abstained",
      confidence: "insufficient",
      directionality: "symmetric",
      evidence: [{ kind: "abstention", detail: "No clash or element flow indicators" }],
      source_mode: "saju_only",
      value: {
        has_stem_clash: false,
        has_branch_clash: false,
        element_flow_direction: null,
      },
    };
  }

  const meaningId = hasStemClash
    ? "work_stress_blameless_protocol"
    : "work_stress_calm_anchor";

  const confidence = params.unknownHour
    ? "low"
    : totalEv >= 2
      ? "high"
      : "medium";

  return {
    meaning_id: meaningId,
    status: hasStemClash || hasBranchClash ? "mixed" : "supported",
    confidence,
    directionality: "symmetric",
    evidence: [
      ...(hasStemClash ? [{ kind: "saju_clash", detail: "Stem clash active", source: "saju" as const }] : []),
      ...(hasBranchClash ? [{ kind: "saju_clash", detail: "Branch clash active", source: "saju" as const }] : []),
      ...(params.elementFlow ? [{ kind: "saju_flow", detail: `Flow direction: ${params.elementFlow.direction}`, source: "saju" as const }] : []),
    ],
    source_mode: "saju_only",
    value: {
      has_stem_clash: hasStemClash,
      has_branch_clash: hasBranchClash,
      element_flow_direction: params.elementFlow?.direction ?? null,
    },
  };
}

// ── 6. Work Decision Style Adapter ────────────────────────────────────────────

export type WorkDecisionStyleValue = {
  is_dominant_a: boolean;
  flow_interaction: string | null;
};

export function resolveWorkDecisionStyleCanonical(params: {
  elementFlow?: PairElementFlowFact | null;
  unknownHour?: boolean;
  locale?: Locale;
}): CanonicalMeaningPacket<WorkDecisionStyleValue> {
  const hasFlow = Boolean(params.elementFlow && params.elementFlow.direction !== "none");
  const totalEv = hasFlow ? 1 : 0;

  if (totalEv === 0) {
    return {
      meaning_id: "work_decision_insufficient_evidence",
      status: "abstained",
      confidence: "insufficient",
      directionality: "symmetric",
      evidence: [{ kind: "abstention", detail: "No element flow data" }],
      source_mode: "saju_only",
      value: {
        is_dominant_a: false,
        flow_interaction: null,
      },
    };
  }

  const isDominantA = params.elementFlow?.direction === "a_to_b";
  const meaningId = isDominantA
    ? "work_decision_fast_prototype_drive"
    : "work_decision_balanced_heuristics";

  const confidence = params.unknownHour ? "low" : "medium";

  return {
    meaning_id: meaningId,
    status: "supported",
    confidence,
    directionality: isDominantA ? "a_to_b" : params.elementFlow?.direction === "b_to_a" ? "b_to_a" : "symmetric",
    lead_party: isDominantA ? "A" : params.elementFlow?.direction === "b_to_a" ? "B" : null,
    evidence: [
      { kind: "saju_flow", detail: `Element flow: ${params.elementFlow?.interaction_code ?? params.elementFlow?.direction}`, source: "saju" as const },
    ],
    source_mode: "saju_only",
    value: {
      is_dominant_a: isDominantA,
      flow_interaction: params.elementFlow?.interaction_code ?? null,
    },
  };
}

// ── 7. Work Special Weapon Adapter ────────────────────────────────────────────

export type WorkSpecialWeaponValue = {
  has_combine: boolean;
  has_trio: boolean;
  complement: TenGodComplementResult | null;
};

export function resolveWorkSpecialWeaponCanonical(params: {
  hasBranchCombine: boolean;
  hasStemCombine: boolean;
  hasTrio: boolean;
  nicknameA: string;
  nicknameB: string;
  sajuJsonA?: SajuDataForIntegrated;
  sajuJsonB?: SajuDataForIntegrated;
  countsA?: Record<string, number>;
  countsB?: Record<string, number>;
  unknownHour?: boolean;
  locale?: Locale;
}): CanonicalMeaningPacket<WorkSpecialWeaponValue> {
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const hasCombine = params.hasBranchCombine || params.hasStemCombine;
  const hasTrio = params.hasTrio;
  const totalEv = (hasCombine ? 1 : 0) + (hasTrio ? 1 : 0);

  let complement: TenGodComplementResult | null = null;
  if (params.sajuJsonA && params.sajuJsonB) {
    complement = analyzeTenGodComplement({
      nicknameA: params.nicknameA,
      nicknameB: params.nicknameB,
      sajuJsonA: params.sajuJsonA,
      sajuJsonB: params.sajuJsonB,
      countsA: params.countsA,
      countsB: params.countsB,
      locale,
    });
  }

  if (totalEv === 0 && !complement) {
    return {
      meaning_id: "work_synergy_insufficient_evidence",
      status: "abstained",
      confidence: "insufficient",
      directionality: "symmetric",
      evidence: [{ kind: "abstention", detail: "No combine, trio, or ten-god complement signals" }],
      source_mode: "saju_only",
      value: {
        has_combine: false,
        has_trio: false,
        complement: null,
      },
    };
  }

  const meaningId = hasTrio || params.hasBranchCombine
    ? "work_synergy_cross_functional_power"
    : "work_synergy_reliable_execution";

  const confidence = params.unknownHour
    ? "low"
    : (hasTrio || params.hasBranchCombine) && totalEv >= 2
      ? "high"
      : "medium";

  return {
    meaning_id: meaningId,
    status: "supported",
    confidence,
    directionality: "symmetric",
    evidence: [
      ...(hasCombine ? [{ kind: "saju_combine", detail: "Combine hit active", source: "saju" as const }] : []),
      ...(hasTrio ? [{ kind: "saju_trio", detail: "Trio hit active", source: "saju" as const }] : []),
      ...(complement ? [{ kind: "ten_god_complement", detail: "Ten god complement analyzed", source: "saju" as const }] : []),
    ],
    source_mode: "saju_only",
    value: {
      has_combine: hasCombine,
      has_trio: hasTrio,
      complement,
    },
  };
}

// ── 8. Work Burnout Recovery Adapter ──────────────────────────────────────────

export type WorkBurnoutRecoveryValue = {
  has_combine: boolean;
  has_flow: boolean;
};

export function resolveWorkBurnoutRecoveryCanonical(params: {
  hasBranchCombine: boolean;
  elementFlow?: PairElementFlowFact | null;
  unknownHour?: boolean;
  locale?: Locale;
}): CanonicalMeaningPacket<WorkBurnoutRecoveryValue> {
  const hasCombine = params.hasBranchCombine;
  const hasFlow = Boolean(params.elementFlow && params.elementFlow.direction !== "none");
  const totalEv = (hasCombine ? 1 : 0) + (hasFlow ? 1 : 0);

  if (totalEv === 0) {
    return {
      meaning_id: "work_burnout_insufficient_evidence",
      status: "abstained",
      confidence: "insufficient",
      directionality: "symmetric",
      evidence: [{ kind: "abstention", detail: "No branch combine or element flow signals" }],
      source_mode: "saju_only",
      value: {
        has_combine: false,
        has_flow: false,
      },
    };
  }

  const meaningId = hasCombine
    ? "work_burnout_sustainable_pacing"
    : "work_burnout_mutual_encouragement";

  const confidence = params.unknownHour
    ? "low"
    : totalEv >= 2
      ? "high"
      : "medium";

  return {
    meaning_id: meaningId,
    status: "supported",
    confidence,
    directionality: params.elementFlow?.direction === "a_to_b" ? "a_to_b" : params.elementFlow?.direction === "b_to_a" ? "b_to_a" : "symmetric",
    lead_party: params.elementFlow?.direction === "a_to_b" ? "A" : params.elementFlow?.direction === "b_to_a" ? "B" : null,
    evidence: [
      ...(hasCombine ? [{ kind: "saju_combine", detail: "Branch combine active", source: "saju" as const }] : []),
      ...(hasFlow ? [{ kind: "saju_flow", detail: `Element flow: ${params.elementFlow?.direction}`, source: "saju" as const }] : []),
    ],
    source_mode: "saju_only",
    value: {
      has_combine: hasCombine,
      has_flow: hasFlow,
    },
  };
}
