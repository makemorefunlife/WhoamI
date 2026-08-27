/**
 * Shared Friend Response Intelligence core.
 *
 * ARCHITECTURE (post canonical-profile refactor — see forensic audit +
 * implementation spec):
 *
 *   RAW SAJU (Ten God families) + PSYCH 11
 *     -> buildFriendResponseProfile()      [buildFriendResponseDimensions.ts]
 *        ONE canonical score per dimension: emotionalReception,
 *        problemResponse, reliabilitySensitivity, conflictDirectness,
 *        connectionMaintenance, autonomySpaceNeed. Each psych axis / ten-god
 *        family is read EXACTLY ONCE across the whole module.
 *     -> PERSON RESPONSE PATTERNS (support/conflict/needs/boundary/distance)
 *        derived by comparing dimension scores — never by re-testing the
 *        raw axes that fed the dimensions.
 *     -> A->B / B->A directional interaction
 *     -> CH5/CH6/CH7/CH8 projection (unchanged IA, unchanged chapter files'
 *        public shape) + pair-level responseComparison replacing the old
 *        disconnected 5-axis "mismatch" heuristic.
 *
 * Chapter 4 (team play) is NOT built here — see friendChapter04TeamPlay.ts.
 */
import type { TenGodCounts } from "@/lib/relationship/marriage/marriageTenGodAnalysis";
import { profileTenGods } from "@/lib/relationship/marriage/marriageTenGodAnalysis";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { FriendRuleContext } from "@/lib/relationship/friend/buildFriendRuleContext";
import type { EvidenceRef, Confidence } from "./friendEvidenceTypes";
import { resolveConfidence } from "./friendEvidenceTypes";
import {
  buildFriendResponseProfile,
  buildFriendPairResponseComparison,
} from "./buildFriendResponseDimensions";
import type { FriendResponseProfile, FriendResponseDimension } from "./friendResponseDimensionTypes";
import type {
  FriendResponseIntelligence,
  FriendPersonResponseProfile,
  FriendSupportMode,
  FriendSupportProfile,
  FriendDirectionalSupport,
  FriendSupportFit,
  FriendSupportAdaptation,
  FriendConflictResponse,
  FriendConflictProfile,
  FriendHurtTrigger,
  FriendHurtTriggerClaim,
  FriendRepairNeed,
  FriendRelationshipNeedKey,
  FriendRelationshipNeed,
  FriendBoundaryBehavior,
  FriendBoundaryProfile,
  FriendFreedomNeed,
  FriendBaselineDistance,
  FriendSilenceInterpretation,
  FriendMaintenanceSignal,
  FriendDisengagementSignal,
  FriendDistanceProfile,
  FriendPairDistanceCompatibility,
  FriendConflictLoop,
  FriendConflictLoopType,
  FriendConflictInterpretation,
  FriendRepairSequence,
  FriendRepairStep,
} from "./friendResponseIntelligenceTypes";

export const FRIEND_RESPONSE_INTELLIGENCE_VERSION = "friend_response_intelligence_v2_canonical";

type PersonInput = {
  personId: string;
  name: string;
  tenGods: TenGodCounts;
  psych: PsychMasterJson | null | undefined;
};

function axis(psych: PsychMasterJson | null | undefined, key: string): number | undefined {
  return (psych?.secondary_axes as Record<string, number> | undefined)?.[key];
}

type ScoredCandidate<K extends string> = { key: K; score: number; evidence: EvidenceRef[] };

function rankCandidates<K extends string>(candidates: ScoredCandidate<K>[]): ScoredCandidate<K>[] {
  return [...candidates].sort((a, b) => b.score - a.score);
}

// ---------------------------------------------------------------------------
// Relationship needs — RELIABILITY now derives from ONE canonical dimension
// (reliabilitySensitivity), not a double-add of the same `structure` reading
// into RELIABILITY + CONSISTENCY. CONSISTENCY stays in the type union (a
// distinct need could independently corroborate it later) but is no longer
// generated from the same evidence as RELIABILITY (spec §5/§14).
// ---------------------------------------------------------------------------

/** RECOGNITION has no canonical dimension of its own (single-axis, used
 * nowhere else) — scored here with the same graduated/no-cliff treatment as
 * the canonical dimensions, capped at MEDIUM confidence (single source). */
function scoreRecognitionNeed(p: PersonInput): ScoredCandidate<"RECOGNITION"> {
  const recognition = axis(p.psych, "recognition");
  if (recognition === undefined) return { key: "RECOGNITION", score: 50, evidence: [] };
  return {
    key: "RECOGNITION",
    score: recognition,
    evidence: [{ source: "PSYCH_11", key: "recognition", personId: p.personId, polarity: "SUPPORTS", strength: "PRIMARY", rawValue: recognition }],
  };
}

/**
 * One scored, ranked need list, always non-empty — shared by CH6
 * (underlyingNeed) and CH7 (needs) so the same person never gets two
 * disconnected "core need" answers (spec §2/§7). Built from the canonical
 * dimensions, not raw axes.
 */
function rankRelationshipNeeds(
  p: PersonInput,
  profile: FriendResponseProfile,
): ScoredCandidate<FriendRelationshipNeedKey>[] {
  const candidates: ScoredCandidate<FriendRelationshipNeedKey>[] = [
    { key: "RELIABILITY", score: profile.reliabilitySensitivity.score, evidence: profile.reliabilitySensitivity.evidence },
    { key: "EMOTIONAL_RESPECT", score: profile.emotionalReception.score, evidence: profile.emotionalReception.evidence },
    { key: "HONESTY", score: profile.conflictDirectness.score, evidence: profile.conflictDirectness.evidence },
    scoreRecognitionNeed(p),
  ];
  if (profile.autonomySpaceNeed) {
    candidates.push({ key: "AUTONOMY", score: profile.autonomySpaceNeed.score, evidence: profile.autonomySpaceNeed.evidence });
  }
  return rankCandidates(candidates);
}

function selectNeeds(ranked: ScoredCandidate<FriendRelationshipNeedKey>[]): FriendRelationshipNeed[] {
  const primary = ranked[0]!;
  const out: FriendRelationshipNeed[] = [{ key: primary.key, importance: "PRIMARY", evidence: primary.evidence }];
  const second = ranked[1];
  // A second need is only surfaced when it's a genuinely close, independently
  // evidenced contender — not whenever *any* candidate exists at all. This is
  // the direct fix for the old "structure 58 vs 60 = 0 vs 2 needs" cliff:
  // reliabilitySensitivity now differs by ~a few points between close scores
  // instead of a binary threshold, so near-identical structure readings no
  // longer flip the needs COUNT, only the ranking.
  if (second && second.evidence.length > 0 && primary.score - second.score <= 30) {
    out.push({ key: second.key, importance: "SECONDARY", evidence: second.evidence });
  }
  return out;
}

// ---------------------------------------------------------------------------
// CH5 — Support profile, derived from problemResponse/emotionalReception/
// connectionMaintenance/conflictDirectness dimensions.
// ---------------------------------------------------------------------------

const SUB_STYLE_TO_MODE: Record<"CLARIFY" | "SOLVE" | "ACTIVATE", FriendSupportMode> = {
  CLARIFY: "STRATEGIC_GUIDANCE",
  SOLVE: "PRACTICAL_HELP",
  ACTIVATE: "ACTION_ACTIVATION",
};

function buildSupportProfile(p: PersonInput, profile: FriendResponseProfile): FriendSupportProfile {
  const problemMode: FriendSupportMode =
    profile.problemResponse.subStyle && profile.problemResponse.subStyle !== "UNDIFFERENTIATED"
      ? SUB_STYLE_TO_MODE[profile.problemResponse.subStyle]
      : "PRACTICAL_HELP";

  const steadyScore = profile.connectionMaintenance.score * 0.6 + (100 - profile.conflictDirectness.score) * 0.4;

  const candidates: Array<{ mode: FriendSupportMode; score: number; evidence: EvidenceRef[] }> = [
    { mode: "EMOTIONAL_HOLDING", score: profile.emotionalReception.score, evidence: profile.emotionalReception.evidence },
    { mode: problemMode, score: profile.problemResponse.score, evidence: profile.problemResponse.evidence },
    { mode: "STEADY_PRESENCE", score: steadyScore, evidence: [...profile.connectionMaintenance.evidence, ...profile.conflictDirectness.evidence] },
  ];
  candidates.sort((a, b) => b.score - a.score);

  const primary = candidates[0]!;
  // secondary: the next-best DISTINCT mode, only if reasonably close.
  const secondCandidate = candidates.find((c) => c.mode !== primary.mode && primary.score - c.score <= 20);

  const evidence = [...primary.evidence, ...(secondCandidate?.evidence ?? [])];
  return {
    primaryMode: primary.mode,
    secondaryMode: secondCandidate?.mode,
    evidence,
    confidence: resolveConfidence(evidence),
  };
}

// Adjacency used for directional fit — capabilities that meaningfully overlap.
const SUPPORT_ADJACENCY: Record<FriendSupportMode, FriendSupportMode[]> = {
  EMOTIONAL_HOLDING: ["STEADY_PRESENCE"],
  STRATEGIC_GUIDANCE: ["PRACTICAL_HELP"],
  PRACTICAL_HELP: ["STRATEGIC_GUIDANCE", "ACTION_ACTIVATION"],
  ACTION_ACTIVATION: ["PRACTICAL_HELP"],
  STEADY_PRESENCE: ["EMOTIONAL_HOLDING"],
};

function deriveReceiverNeed(receiverSupport: FriendSupportProfile): { need: FriendSupportMode | null; evidence: EvidenceRef[] } {
  // Receptivity heuristic: a person's own dominant expressive register is
  // also typically the register they receive support best in. Only assigned
  // when real evidence exists — never a fabricated default (spec CH5-B).
  if (receiverSupport.confidence === "LOW") return { need: null, evidence: [] };
  return { need: receiverSupport.primaryMode, evidence: receiverSupport.evidence };
}

// What the giver's approach shifts toward when the receiver's need differs
// from the giver's own natural mode — i.e. genuine directional adaptation,
// not a restatement of the giver's general style (spec CH5-B).
const ADAPTATION_TOWARD_NEED: Record<FriendSupportMode, FriendSupportAdaptation> = {
  EMOTIONAL_HOLDING: "SOFTENED",
  STEADY_PRESENCE: "MORE_STABILIZING",
  STRATEGIC_GUIDANCE: "MORE_DIRECT",
  ACTION_ACTIVATION: "MORE_DIRECT",
  PRACTICAL_HELP: "MORE_PRACTICAL",
};

function buildDirectionalSupport(
  giverId: string,
  receiverId: string,
  giverSupport: FriendSupportProfile,
  receiverSupport: FriendSupportProfile,
): FriendDirectionalSupport {
  const { need, evidence: needEvidence } = deriveReceiverNeed(receiverSupport);
  let fit: FriendSupportFit;
  if (!need) {
    fit = "LOW_EVIDENCE";
  } else if (need === giverSupport.primaryMode) {
    fit = "STRONG_MATCH";
  } else if (SUPPORT_ADJACENCY[giverSupport.primaryMode]?.includes(need)) {
    fit = "PARTIAL_MATCH";
  } else {
    fit = "MISMATCH";
  }

  let adaptation: FriendSupportAdaptation;
  if (fit === "LOW_EVIDENCE") adaptation = "LOW_EVIDENCE";
  else if (fit === "STRONG_MATCH") adaptation = "NO_ADAPTATION";
  else adaptation = ADAPTATION_TOWARD_NEED[need as FriendSupportMode];

  const evidence = [...giverSupport.evidence, ...needEvidence];
  return {
    giverId,
    receiverId,
    giverCapability: giverSupport.primaryMode,
    receiverNeed: need,
    fit,
    adaptation,
    evidence,
    confidence: resolveConfidence(evidence),
  };
}

// ---------------------------------------------------------------------------
// CH6 — Conflict profile, derived from conflictDirectness/problemResponse/
// emotionalReception dimensions.
// ---------------------------------------------------------------------------

function buildConflictProfile(
  p: PersonInput,
  profile: FriendResponseProfile,
  needsRanked: ScoredCandidate<FriendRelationshipNeedKey>[],
): FriendConflictProfile {
  const directness = profile.conflictDirectness.score;
  const clarifyLead = profile.problemResponse.subStyle === "CLARIFY";
  const solveLead = profile.problemResponse.subStyle === "SOLVE";

  const candidates: Array<{ key: FriendConflictResponse; score: number; evidence: EvidenceRef[] }> = [
    { key: "DIRECT_CONFRONT", score: directness, evidence: profile.conflictDirectness.evidence },
    {
      key: "WITHDRAW_AND_PROCESS",
      score: (100 - directness) * 0.5 + profile.emotionalReception.score * 0.5,
      evidence: [...profile.conflictDirectness.evidence, ...profile.emotionalReception.evidence],
    },
    {
      key: "SEEK_CLARIFICATION",
      score: clarifyLead ? profile.problemResponse.score : profile.problemResponse.score * 0.35,
      evidence: profile.problemResponse.evidence,
    },
    {
      key: "SOLVE_QUICKLY",
      score: solveLead ? profile.problemResponse.score : profile.problemResponse.score * 0.35,
      evidence: profile.problemResponse.evidence,
    },
    {
      key: "SOFTEN_FIRST",
      score: profile.emotionalReception.score * 0.6 + (100 - directness) * 0.4,
      evidence: [...profile.emotionalReception.evidence, ...profile.conflictDirectness.evidence],
    },
  ];
  candidates.sort((a, b) => b.score - a.score);
  const winner = candidates[0]!;

  // Hurt triggers — each maps to exactly one canonical source; BROKEN_EXPECTATION
  // and the retired UNRELIABILITY no longer both draw on reliabilitySensitivity
  // (spec §14's "one evidence item must not masquerade as two findings" applies
  // here too, not just to CH7 needs).
  const triggerCandidates: Array<{ key: FriendHurtTrigger; score: number; evidence: EvidenceRef[] }> = [
    scoreFeelingIgnored(p),
    { key: "BROKEN_EXPECTATION", score: profile.reliabilitySensitivity.score, evidence: profile.reliabilitySensitivity.evidence },
    { key: "DISRESPECT", score: profile.conflictDirectness.score, evidence: profile.conflictDirectness.evidence },
    { key: "EMOTIONAL_DISMISSAL", score: profile.emotionalReception.score, evidence: profile.emotionalReception.evidence },
  ];
  if (profile.autonomySpaceNeed) {
    triggerCandidates.push({ key: "LOSS_OF_AUTONOMY", score: profile.autonomySpaceNeed.score, evidence: profile.autonomySpaceNeed.evidence });
  }
  triggerCandidates.sort((a, b) => b.score - a.score);
  const rankedTriggers = triggerCandidates.slice(0, 2);
  const hurtTriggers: FriendHurtTriggerClaim[] = rankedTriggers.map((t, i) => ({
    trigger: t.key,
    importance: i === 0 ? "PRIMARY" : "SECONDARY",
    evidence: t.evidence,
  }));

  // Underlying need — same ranked list CH7 uses (spec §2/§7 shared core).
  const underlyingNeed = needsRanked[0]!.key === "CONSISTENCY" ? "RELIABILITY" : needsRanked[0]!.key;

  // Repair need — derived from initialResponse, modified by profile-level evidence.
  let repairNeed: FriendRepairNeed;
  if (winner.key === "WITHDRAW_AND_PROCESS") repairNeed = "SPACE_FIRST";
  else if (winner.key === "SOFTEN_FIRST" || profile.emotionalReception.level === "HIGH") repairNeed = "REASSURANCE_FIRST";
  else if (winner.key === "SEEK_CLARIFICATION") repairNeed = "CLEAR_EXPLANATION";
  else if (winner.key === "DIRECT_CONFRONT" && profile.reliabilitySensitivity.level !== "LOW") repairNeed = "ACCOUNTABILITY";
  else if (profile.connectionMaintenance.level === "HIGH") repairNeed = "NORMALIZATION";
  else repairNeed = "CLEAR_EXPLANATION";

  const evidence = [...winner.evidence, ...hurtTriggers.flatMap((t) => t.evidence)];
  return {
    initialResponse: winner.key,
    underlyingNeed,
    hurtTriggers,
    repairNeed,
    evidence,
    confidence: resolveConfidence(evidence),
  };
}

function scoreFeelingIgnored(p: PersonInput): { key: "FEELING_IGNORED"; score: number; evidence: EvidenceRef[] } {
  const recognition = axis(p.psych, "recognition");
  if (recognition === undefined) return { key: "FEELING_IGNORED", score: 50, evidence: [] };
  return {
    key: "FEELING_IGNORED",
    score: recognition,
    evidence: [{ source: "PSYCH_11", key: "recognition", personId: p.personId, polarity: "SUPPORTS", strength: "PRIMARY", rawValue: recognition }],
  };
}

// ---------------------------------------------------------------------------
// CH7 — Boundary profile
// ---------------------------------------------------------------------------

const NEED_TO_BOUNDARY: Record<FriendRelationshipNeedKey, FriendBoundaryBehavior> = {
  RELIABILITY: "REPEATED_BROKEN_PLANS",
  EMOTIONAL_RESPECT: "EMOTIONAL_DISMISSAL",
  HONESTY: "DISHONESTY",
  RECOGNITION: "PUBLIC_UNDERMINING",
  AUTONOMY: "OVER_CONTROL",
  CONSISTENCY: "INCONSISTENT_TREATMENT",
};

function buildBoundaryProfile(
  profile: FriendResponseProfile,
  needsRanked: ScoredCandidate<FriendRelationshipNeedKey>[],
  partnerSupport: FriendSupportProfile,
  partnerId: string,
): FriendBoundaryProfile {
  const needs = selectNeeds(needsRanked);
  const boundaries = needs.map((n) => ({
    behavior: NEED_TO_BOUNDARY[n.key],
    fromNeed: n.key,
    evidence: n.evidence,
  }));

  // Expectation adjustment: does the partner naturally provide a mode this
  // person's top need implies, or should expectations be adjusted?
  const impliedGiverModeByNeed: Partial<Record<FriendRelationshipNeedKey, FriendSupportMode>> = {
    EMOTIONAL_RESPECT: "EMOTIONAL_HOLDING",
    RELIABILITY: "STEADY_PRESENCE",
    HONESTY: "STRATEGIC_GUIDANCE",
  };
  let expectationAdjustment: FriendBoundaryProfile["expectationAdjustment"] = null;
  const topNeedMode = needs[0] ? impliedGiverModeByNeed[needs[0].key] : undefined;
  if (topNeedMode && topNeedMode !== partnerSupport.primaryMode) {
    const resolution = SUPPORT_ADJACENCY[partnerSupport.primaryMode]?.includes(topNeedMode)
      ? "ACCEPT_DIFFERENT_EXPRESSION"
      : "ASK_EXPLICITLY";
    expectationAdjustment = {
      gapMode: topNeedMode,
      resolution,
      evidence: [...(needs[0]?.evidence ?? []), ...partnerSupport.evidence],
      expectationOwnerId: profile.personId,
      providerId: partnerId,
    };
  }

  // Freedom need — audited (spec §8): driven ONLY by the autonomySpaceNeed
  // dimension (self_control), not by re-borrowing structure/empathy that
  // reliabilitySensitivity/emotionalReception already own. Correctly null
  // (not fabricated) when self_control evidence is absent.
  const freedomNeed: FriendFreedomNeed | null =
    profile.autonomySpaceNeed && profile.autonomySpaceNeed.level === "HIGH" ? "SPACE_BETWEEN_CONTACT" : null;

  const evidence = [...needs.flatMap((n) => n.evidence), ...(expectationAdjustment?.evidence ?? [])];
  return {
    needs,
    boundaries,
    expectationAdjustment,
    freedomNeed,
    evidence,
    confidence: resolveConfidence(evidence),
  };
}

// ---------------------------------------------------------------------------
// CH8 — Distance profile, derived from connectionMaintenance +
// reliabilitySensitivity + emotionalReception dimensions.
// ---------------------------------------------------------------------------

/** Exported for direct unit testing of the LOW_EVIDENCE_DISTANCE fallback
 * fix, independent of a specific real chart's ten-god side-evidence. */
export function buildDistanceProfile(profile: FriendResponseProfile): FriendDistanceProfile {
  const cm = profile.connectionMaintenance;
  const deep = profile.emotionalReception.level === "HIGH";
  const structured = profile.reliabilitySensitivity.level === "HIGH";

  let baselineDistance: FriendBaselineDistance;
  if (cm.confidence === "LOW") {
    // Neither a high nor a low contact-frequency signal fired because the
    // relevant axes (energy_style/stimulation) are simply absent — this must
    // NOT render as "유연한 거리감을 선호함" (spec §7/§15: "모르겠음" MUST NOT
    // become "유연함").
    baselineDistance = "LOW_EVIDENCE_DISTANCE";
  } else if (cm.level === "HIGH" && deep) {
    baselineDistance = "FREQUENT_DEEP_CONTACT";
  } else if (cm.level === "HIGH") {
    baselineDistance = "FREQUENT_LIGHT_CONTACT";
  } else if (cm.level === "LOW" && deep) {
    baselineDistance = "LOW_FREQUENCY_HIGH_TRUST";
  } else if (cm.level === "LOW" && structured) {
    baselineDistance = "EVENT_DRIVEN_CONNECTION";
  } else {
    // MODERATE connectionMaintenance with real (non-LOW) confidence — a
    // genuinely evidenced "in-between" reading, not a missing-data default.
    baselineDistance = "FLEXIBLE_DISTANCE";
  }

  const lowEvidence = baselineDistance === "LOW_EVIDENCE_DISTANCE";
  const resilience = profile.connectionMaintenance.evidence.some((e) => e.key === "resilience");

  let silenceInterpretation: FriendSilenceInterpretation;
  if (lowEvidence) {
    // Same principle applied to silence reading: without real evidence,
    // default to the most conservative (least alarmed) reading rather than a
    // confidently "neutral" or "concerned" claim.
    silenceInterpretation = "MILD_CHECK_IN";
  } else if (baselineDistance === "LOW_FREQUENCY_HIGH_TRUST" || resilience) {
    silenceInterpretation = "NEUTRAL";
  } else if (profile.emotionalReception.level === "HIGH" && profile.conflictDirectness.level !== "HIGH") {
    silenceInterpretation = "RELATIONSHIP_CONCERN";
  } else {
    silenceInterpretation = "MILD_CHECK_IN";
  }

  const maintenanceScores: Record<FriendMaintenanceSignal, number> = {
    IMPORTANT_MOMENT_CONTACT: profile.reliabilitySensitivity.score,
    OCCASIONAL_INITIATION: cm.score,
    DEEP_RECONNECTION: profile.emotionalReception.score,
    RELIABLE_RESPONSE_WHEN_NEEDED: (profile.reliabilitySensitivity.score + cm.score) / 2,
    SHARED_EXPERIENCE: cm.score * 0.5 + profile.problemResponse.score * 0.5,
  };
  const maintenanceMinimum = (Object.keys(maintenanceScores) as FriendMaintenanceSignal[])
    .sort((a, b) => maintenanceScores[b] - maintenanceScores[a])
    .slice(0, 3);

  // Tied to THIS person's own top maintenance-minimum picks (each signal's
  // "going missing" inverse), not a generic 2-way baselineDistance branch —
  // so the disengagement warning is specific to what this pair actually
  // relies on, not generic enough to apply to any friendship (spec CH8-D).
  const MAINTENANCE_TO_DISENGAGEMENT: Record<FriendMaintenanceSignal, FriendDisengagementSignal> = {
    IMPORTANT_MOMENT_CONTACT: "STOPS_SHARING_IMPORTANT_EVENTS",
    OCCASIONAL_INITIATION: "STOPS_INITIATING_COMPLETELY",
    DEEP_RECONNECTION: "EMOTIONAL_DEPTH_DISAPPEARS",
    RELIABLE_RESPONSE_WHEN_NEEDED: "ONLY_CONTACTS_FOR_NEEDS",
    SHARED_EXPERIENCE: "AVOIDS_MEETING_WHEN_AVAILABLE",
  };
  const disengagementSignals: FriendDisengagementSignal[] = maintenanceMinimum
    .slice(0, 2)
    .map((m) => MAINTENANCE_TO_DISENGAGEMENT[m]);

  const evidence = lowEvidence ? [] : cm.evidence;
  return {
    baselineDistance,
    silenceInterpretation,
    maintenanceMinimum,
    disengagementSignals,
    evidence,
    confidence: lowEvidence ? "LOW" : cm.confidence,
  };
}

const DISTANCE_FREQ_RANK: Record<FriendBaselineDistance, number> = {
  FREQUENT_DEEP_CONTACT: 4,
  FREQUENT_LIGHT_CONTACT: 3,
  FLEXIBLE_DISTANCE: 2,
  EVENT_DRIVEN_CONNECTION: 1,
  LOW_FREQUENCY_HIGH_TRUST: 1,
  LOW_EVIDENCE_DISTANCE: 2,
};

function buildPairDistanceDynamics(
  a: FriendDistanceProfile,
  b: FriendDistanceProfile,
): FriendResponseIntelligence["pair"]["distance"] {
  if (a.baselineDistance === "LOW_EVIDENCE_DISTANCE" || b.baselineDistance === "LOW_EVIDENCE_DISTANCE") {
    // Never claim "MATCHED_DISTANCE" when the match is really "we don't have
    // evidence for either side" (spec §7/§15).
    return {
      compatibility: "LOW_EVIDENCE",
      aPreference: a.baselineDistance,
      bPreference: b.baselineDistance,
      sharedMaintenanceMinimum: [],
      evidence: [...a.evidence, ...b.evidence],
    };
  }
  const gap = Math.abs(DISTANCE_FREQ_RANK[a.baselineDistance] - DISTANCE_FREQ_RANK[b.baselineDistance]);
  const compatibility: FriendPairDistanceCompatibility = gap === 0 ? "MATCHED_DISTANCE" : gap <= 1 ? "NEGOTIABLE_GAP" : "HIGH_DISTANCE_MISMATCH";
  const shared = a.maintenanceMinimum.filter((m) => b.maintenanceMinimum.includes(m));
  return {
    compatibility,
    aPreference: a.baselineDistance,
    bPreference: b.baselineDistance,
    sharedMaintenanceMinimum: shared.length > 0 ? shared : [a.maintenanceMinimum[0], b.maintenanceMinimum[0]].filter(
      (v, i, arr): v is FriendMaintenanceSignal => v !== undefined && arr.indexOf(v) === i,
    ),
    evidence: [...a.evidence, ...b.evidence],
  };
}

// ---------------------------------------------------------------------------
// CH6-C/E — Conflict loop + repair sequence (pair-level, from resolved profiles)
// ---------------------------------------------------------------------------

const REPAIR_BASE_STEPS: Record<FriendRepairNeed, FriendRepairStep[]> = {
  SPACE_FIRST: ["PAUSE", "RECONNECT", "LISTEN"],
  REASSURANCE_FIRST: ["REASSURE", "LISTEN", "RECONNECT"],
  CLEAR_EXPLANATION: ["EXPLAIN", "CLARIFY", "ACKNOWLEDGE"],
  ACCOUNTABILITY: ["ACKNOWLEDGE", "EXPLAIN", "RESET"],
  NORMALIZATION: ["ACKNOWLEDGE", "SOLVE", "RECONNECT"],
};

function buildRepairSequence(forPerson: FriendConflictProfile, other: FriendConflictProfile): FriendRepairSequence {
  const steps = [...REPAIR_BASE_STEPS[forPerson.repairNeed]];
  if (other.initialResponse === "WITHDRAW_AND_PROCESS" && steps[0] !== "PAUSE") {
    steps.unshift("PAUSE");
  }
  return { steps, evidence: [...forPerson.evidence, ...other.evidence] };
}

// How B tends to read A's specific initial-response behavior, in a conflict.
const READ_AS: Record<FriendConflictResponse, FriendConflictInterpretation> = {
  DIRECT_CONFRONT: "PRESSURE",
  WITHDRAW_AND_PROCESS: "AVOIDANCE",
  SEEK_CLARIFICATION: "OVERANALYSIS",
  SOLVE_QUICKLY: "DISMISSIVENESS",
  SOFTEN_FIRST: "COLDNESS",
};

function classifyConflictLoop(a: FriendConflictResponse, b: FriendConflictResponse): { loopType: FriendConflictLoopType; lowRisk: boolean } {
  if (a === b) {
    if (a === "DIRECT_CONFRONT") return { loopType: "SAME_STYLE_COLLISION", lowRisk: false };
    if (a === "SEEK_CLARIFICATION") return { loopType: "EXPLANATION_COMPETITION", lowRisk: false };
    return { loopType: "LOW_ESCALATION_MATCH", lowRisk: true };
  }
  const pair = new Set([a, b]);
  if (pair.has("DIRECT_CONFRONT") && pair.has("WITHDRAW_AND_PROCESS")) return { loopType: "PRESSURE_WITHDRAW_LOOP", lowRisk: false };
  if (pair.has("SEEK_CLARIFICATION") && pair.has("SOFTEN_FIRST")) return { loopType: "EMOTIONAL_MISS", lowRisk: false };
  if ((pair.has("WITHDRAW_AND_PROCESS") || pair.has("SOFTEN_FIRST")) && (pair.has("SOLVE_QUICKLY") || pair.has("SEEK_CLARIFICATION"))) {
    return { loopType: "LOW_ESCALATION_MATCH", lowRisk: true };
  }
  return { loopType: "OPPOSITE_STYLE_LOOP", lowRisk: false };
}

function buildConflictLoop(
  aId: string, bId: string, a: FriendConflictProfile, b: FriendConflictProfile,
): FriendConflictLoop {
  const { loopType, lowRisk } = classifyConflictLoop(a.initialResponse, b.initialResponse);

  const steps: FriendConflictLoop["steps"] = [
    { actorId: aId, behavior: a.initialResponse, interpretedById: bId, interpretation: READ_AS[a.initialResponse] },
    { actorId: bId, behavior: b.initialResponse, interpretedById: aId, interpretation: READ_AS[b.initialResponse] },
  ];

  return {
    loopType,
    steps,
    lowRisk,
    evidence: [...a.evidence, ...b.evidence],
  };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export function buildFriendResponseIntelligence(params: {
  ctx: FriendRuleContext;
  psychA: PsychMasterJson | null | undefined;
  psychB: PsychMasterJson | null | undefined;
}): FriendResponseIntelligence {
  const { ctx, psychA, psychB } = params;

  const inputA: PersonInput = { personId: "a", name: ctx.nicknameA, tenGods: ctx.tenGodsA, psych: psychA };
  const inputB: PersonInput = { personId: "b", name: ctx.nicknameB, tenGods: ctx.tenGodsB, psych: psychB };

  // ONE canonical scoring pass per person — every downstream field reads
  // from these two profiles, never the raw tenGods/psych again.
  const profileA = buildFriendResponseProfile(inputA);
  const profileB = buildFriendResponseProfile(inputB);

  const needsRankedA = rankRelationshipNeeds(inputA, profileA);
  const needsRankedB = rankRelationshipNeeds(inputB, profileB);

  const supportA = buildSupportProfile(inputA, profileA);
  const supportB = buildSupportProfile(inputB, profileB);
  const conflictA = buildConflictProfile(inputA, profileA, needsRankedA);
  const conflictB = buildConflictProfile(inputB, profileB, needsRankedB);
  const boundaryA = buildBoundaryProfile(profileA, needsRankedA, supportB, "b");
  const boundaryB = buildBoundaryProfile(profileB, needsRankedB, supportA, "a");
  const distanceA = buildDistanceProfile(profileA);
  const distanceB = buildDistanceProfile(profileB);

  const personA: FriendPersonResponseProfile = { personId: "a", name: ctx.nicknameA, responseProfile: profileA, support: supportA, conflict: conflictA, boundary: boundaryA, distance: distanceA };
  const personB: FriendPersonResponseProfile = { personId: "b", name: ctx.nicknameB, responseProfile: profileB, support: supportB, conflict: conflictB, boundary: boundaryB, distance: distanceB };

  const aToB = buildDirectionalSupport("a", "b", supportA, supportB);
  const bToA = buildDirectionalSupport("b", "a", supportB, supportA);

  // Pair-level dimension comparison — replaces the old disconnected 5-axis
  // gap heuristic that caused the CH5 contradiction (pair copy claiming
  // "both solve first" while personB's own label said "feelings first").
  // Reads the SAME dimension scores that produced supportA/supportB.
  const responseComparison = buildFriendPairResponseComparison(profileA, profileB);
  const supportComparison = responseComparison.emotionalReception.classification === "GENUINE_SIMILARITY"
    && responseComparison.problemResponse.classification === "GENUINE_SIMILARITY";
  const hasMeaningfulMismatch = supportA.primaryMode !== supportB.primaryMode
    && (responseComparison.emotionalReception.classification !== "LOW_EVIDENCE"
      || responseComparison.problemResponse.classification !== "LOW_EVIDENCE");

  return {
    personA,
    personB,
    directional: { aToB, bToA },
    pair: {
      supportMismatch: {
        hasMeaningfulMismatch,
        description: supportComparison ? "BROADLY_COMPATIBLE" : "STYLE_GAP",
        evidence: [...supportA.evidence, ...supportB.evidence],
      },
      responseComparison,
      conflictLoop: buildConflictLoop("a", "b", conflictA, conflictB),
      repairSequenceA: buildRepairSequence(conflictA, conflictB),
      repairSequenceB: buildRepairSequence(conflictB, conflictA),
      distance: buildPairDistanceDynamics(distanceA, distanceB),
    },
    provenance: {
      version: FRIEND_RESPONSE_INTELLIGENCE_VERSION,
      sourceIds: ["tenGods", "psych_11", "canonical_pair_facts", "friendResponseDimensions_v1"],
    },
  };
}
