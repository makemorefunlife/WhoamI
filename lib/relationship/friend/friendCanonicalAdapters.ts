/**
 * Friend Domain Canonical Meaning Adapters
 *
 * Wraps authoritative V1 Gold Friend resolvers into typed CanonicalMeaningPackets
 * without duplicating, altering, or re-resolving underlying formulas.
 */

import type { CanonicalMeaningPacket } from "@/lib/relationship/domainLenses/canonicalPackets";
import type { TenGodCounts } from "@/lib/relationship/marriage/marriageTenGodAnalysis";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { Locale } from "@/lib/i18n/locale";
import { LEGACY_FALLBACK_LOCALE } from "@/lib/relationship/friend/friendCopy";
import {
  resolveFriendSignatureClause,
  resolveFriendVibeAxisNotes,
  resolveCommunicationRhythmNote,
  resolveCounselingStyleForPerson,
  resolveJealousyGuardNote,
  resolveTravelStyleSplit,
  refineTravelStyleSplit,
  resolveReconciliationScript,
  type FriendTravelStyleSplit,
  type FriendCounselingStyle,
} from "./friendPsychFit";
import {
  buildFriendDeEscalationCard,
  type FriendDeEscalationCard,
} from "./friendDeEscalationPrescriptions";

// ── 1. Friend Core Vibe Adapter ──────────────────────────────────────────────

export type FriendCoreVibeValue = {
  signature_clause: string | null;
  connection_note: string | null;
  banter_note: string | null;
  risk_note: string | null;
  has_stem_combine: boolean;
  has_branch_combine: boolean;
};

export function resolveFriendCoreVibeCanonical(params: {
  psychA?: PsychMasterJson | null;
  psychB?: PsychMasterJson | null;
  hasStemCombine: boolean;
  hasBranchCombine: boolean;
  locale?: Locale;
}): CanonicalMeaningPacket<FriendCoreVibeValue> {
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const signature = resolveFriendSignatureClause(params.psychA, params.psychB, locale);
  const notes = resolveFriendVibeAxisNotes(params.psychA, params.psychB, locale) ?? {
    connection_note: null,
    banter_note: null,
    risk_note: null,
  };

  const hasPsych = Boolean(params.psychA && params.psychB);
  const totalSajuEv = (params.hasStemCombine ? 1 : 0) + (params.hasBranchCombine ? 1 : 0);

  if (!hasPsych && totalSajuEv === 0) {
    return {
      meaning_id: "friend_vibe_insufficient_evidence",
      status: "abstained",
      confidence: "insufficient",
      directionality: "symmetric",
      evidence: [{ kind: "abstention", detail: "No combine hits and no survey profile" }],
      source_mode: "saju_only",
      value: {
        signature_clause: null,
        connection_note: null,
        banter_note: null,
        risk_note: null,
        has_stem_combine: false,
        has_branch_combine: false,
      },
    };
  }

  const meaningId = params.hasStemCombine
    ? "friend_vibe_instant_click"
    : params.hasBranchCombine
      ? "friend_vibe_comfortable_easygoing"
      : notes.risk_note
        ? "friend_vibe_energy_contrast"
        : "friend_vibe_comfortable_easygoing";

  const confidence = totalSajuEv >= 2 && hasPsych
    ? "high"
    : totalSajuEv >= 1 || hasPsych
      ? "medium"
      : "low";

  return {
    meaning_id: meaningId,
    status: notes.risk_note ? "mixed" : "supported",
    confidence,
    directionality: "symmetric",
    evidence: [
      ...(params.hasStemCombine ? [{ kind: "saju_combine", detail: "Stem combine detected", source: "saju" as const }] : []),
      ...(params.hasBranchCombine ? [{ kind: "saju_combine", detail: "Branch combine detected", source: "saju" as const }] : []),
      ...(signature ? [{ kind: "psych_signature", detail: signature, source: "survey" as const }] : []),
    ],
    source_mode: hasPsych && totalSajuEv > 0 ? "saju_plus_survey" : hasPsych ? "survey_only" : "saju_only",
    value: {
      signature_clause: signature,
      connection_note: notes.connection_note,
      banter_note: notes.banter_note,
      risk_note: notes.risk_note,
      has_stem_combine: params.hasStemCombine,
      has_branch_combine: params.hasBranchCombine,
    },
  };
}

// ── 2. Friend Travel Planner Split Adapter ────────────────────────────────────

export type FriendTravelPlannerCanonicalValue = {
  split: FriendTravelStyleSplit | null;
  planner_nickname: string | null;
  flexible_nickname: string | null;
  lead_party: "A" | "B" | null;
  align?: "confirms" | "caution";
  confidence?: "high" | "low";
};

export function resolveFriendTravelLeadCanonical(params: {
  psychA?: PsychMasterJson | null;
  psychB?: PsychMasterJson | null;
  batteryModeA?: "outdoor" | "homebody";
  batteryModeB?: "outdoor" | "homebody";
  tikitakaModeA?: "popcorn" | "silent";
  tikitakaModeB?: "popcorn" | "silent";
  nicknameA: string;
  nicknameB: string;
  locale?: Locale;
}): CanonicalMeaningPacket<FriendTravelPlannerCanonicalValue> {
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const base = resolveTravelStyleSplit(
    params.psychA,
    params.psychB,
    params.nicknameA,
    params.nicknameB,
    locale,
  );

  let finalized = base;
  if (
    base &&
    params.psychA &&
    params.psychB &&
    params.batteryModeA &&
    params.batteryModeB &&
    params.tikitakaModeA &&
    params.tikitakaModeB
  ) {
    finalized = refineTravelStyleSplit({
      base,
      psychA: params.psychA,
      psychB: params.psychB,
      batteryModeA: params.batteryModeA,
      batteryModeB: params.batteryModeB,
      tikitakaModeA: params.tikitakaModeA,
      tikitakaModeB: params.tikitakaModeB,
      nicknameA: params.nicknameA,
      nicknameB: params.nicknameB,
      locale,
    });
  }

  if (!finalized) {
    return {
      meaning_id: "friend_travel_insufficient_evidence",
      status: "abstained",
      confidence: "insufficient",
      directionality: "symmetric",
      evidence: [{ kind: "abstention", detail: "Structure gap < 15 or survey unobserved" }],
      source_mode: "survey_only",
      value: {
        split: null,
        planner_nickname: null,
        flexible_nickname: null,
        lead_party: null,
      },
    };
  }

  const isPlannerA = finalized.planner.nickname === params.nicknameA;
  const directionality = isPlannerA ? ("a_to_b" as const) : ("b_to_a" as const);
  const confidence = finalized.confidence === "high" ? "high" : "medium";

  return {
    meaning_id: isPlannerA ? "friend_travel_planner_lead_a" : "friend_travel_planner_lead_b",
    status: finalized.align === "caution" ? "mixed" : "supported",
    confidence,
    directionality,
    evidence: [
      {
        kind: "survey_structure_split",
        detail: `Planner: ${finalized.planner.nickname} (${finalized.planner.description})`,
        source: "survey",
      },
    ],
    source_mode: "survey_only",
    value: {
      split: finalized,
      planner_nickname: finalized.planner.nickname,
      flexible_nickname: finalized.flexible.nickname,
      lead_party: isPlannerA ? "A" : "B",
      align: finalized.align,
      confidence: finalized.confidence,
    },
  };
}

// ── 3. Friend Comfort Distance & Contact Rhythm Adapter ──────────────────────

export type FriendComfortDistanceValue = {
  rhythm_note: string | null;
  has_day_combine: boolean;
  has_day_clash: boolean;
};

export function resolveFriendComfortDistanceCanonical(params: {
  psychA?: PsychMasterJson | null;
  psychB?: PsychMasterJson | null;
  hasDayCombine: boolean;
  hasDayClash: boolean;
  locale?: Locale;
}): CanonicalMeaningPacket<FriendComfortDistanceValue> {
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const rhythmNote = resolveCommunicationRhythmNote(params.psychA, params.psychB, locale);
  const hasPsych = Boolean(params.psychA && params.psychB);
  const hasSaju = params.hasDayCombine || params.hasDayClash;

  if (!rhythmNote && !hasSaju) {
    return {
      meaning_id: "friend_distance_insufficient_evidence",
      status: "abstained",
      confidence: "insufficient",
      directionality: "symmetric",
      evidence: [{ kind: "abstention", detail: "No contact rhythm notes or day branch tension/harmony" }],
      source_mode: "saju_only",
      value: {
        rhythm_note: null,
        has_day_combine: false,
        has_day_clash: false,
      },
    };
  }

  const meaningId = params.hasDayClash
    ? "friend_distance_independent_respect"
    : params.hasDayCombine
      ? "friend_distance_frequent_checkins"
      : rhythmNote
        ? "friend_distance_flexible_cadence"
        : "friend_distance_flexible_cadence";

  return {
    meaning_id: meaningId,
    status: params.hasDayClash ? "mixed" : "supported",
    confidence: hasPsych && hasSaju ? "high" : "medium",
    directionality: "symmetric",
    evidence: [
      ...(rhythmNote ? [{ kind: "psych_rhythm", detail: rhythmNote, source: "survey" as const }] : []),
      ...(params.hasDayCombine ? [{ kind: "saju_harmony", detail: "Day branch combine", source: "saju" as const }] : []),
      ...(params.hasDayClash ? [{ kind: "saju_tension", detail: "Day branch clash", source: "saju" as const }] : []),
    ],
    source_mode: hasPsych && hasSaju ? "saju_plus_survey" : hasPsych ? "survey_only" : "saju_only",
    value: {
      rhythm_note: rhythmNote,
      has_day_combine: params.hasDayCombine,
      has_day_clash: params.hasDayClash,
    },
  };
}

// ── 4. Friend Counseling Style Split Adapter (F vs T) ────────────────────────

export type FriendCounselingStyleValue = {
  style_a: FriendCounselingStyle | null;
  style_b: FriendCounselingStyle | null;
};

export function resolveFriendCounselingCanonical(params: {
  countsA: TenGodCounts;
  countsB: TenGodCounts;
  psychA?: PsychMasterJson | null;
  psychB?: PsychMasterJson | null;
  locale?: Locale;
}): CanonicalMeaningPacket<FriendCounselingStyleValue> {
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const styleA = resolveCounselingStyleForPerson(params.countsA, params.psychA, locale);
  const styleB = resolveCounselingStyleForPerson(params.countsB, params.psychB, locale);

  if (!styleA && !styleB) {
    return {
      meaning_id: "friend_vent_insufficient_evidence",
      status: "abstained",
      confidence: "insufficient",
      directionality: "dual",
      evidence: [{ kind: "abstention", detail: "Survey answers missing for counseling style" }],
      source_mode: "saju_plus_survey",
      value: { style_a: null, style_b: null },
    };
  }

  const isF_A = styleA?.type === "F";
  const isF_B = styleB?.type === "F";
  const isT_A = styleA?.type === "T";
  const isT_B = styleB?.type === "T";

  const meaningId = isF_A || isF_B
    ? "friend_vent_unconditional_empathy"
    : (isT_A || isT_B)
      ? "friend_vent_solution_anchor"
      : "friend_vent_unconditional_empathy";

  return {
    meaning_id: meaningId,
    status: "supported",
    confidence: "high",
    directionality: "dual",
    evidence: [
      ...(styleA ? [{ kind: "counseling_a", detail: `A: ${styleA.label} (${styleA.description})`, source: "composite" as const }] : []),
      ...(styleB ? [{ kind: "counseling_b", detail: `B: ${styleB.label} (${styleB.description})`, source: "composite" as const }] : []),
    ],
    source_mode: "saju_plus_survey",
    value: { style_a: styleA, style_b: styleB },
  };
}

// ── 5. Friend Jealousy Guard Adapter ──────────────────────────────────────────

export type FriendJealousyGuardValue = {
  guard_note_a: string | null;
  guard_note_b: string | null;
};

export function resolveFriendJealousyGuardCanonical(params: {
  countsA: TenGodCounts;
  countsB: TenGodCounts;
  psychA?: PsychMasterJson | null;
  psychB?: PsychMasterJson | null;
  nicknameA: string;
  nicknameB: string;
  hasBranchClash?: boolean;
  hasStemClash?: boolean;
  locale?: Locale;
}): CanonicalMeaningPacket<FriendJealousyGuardValue> {
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const noteA = resolveJealousyGuardNote(params.countsA, params.psychA, params.nicknameA, locale);
  const noteB = resolveJealousyGuardNote(params.countsB, params.psychB, params.nicknameB, locale);

  const hasAnyNote = Boolean(noteA || noteB);

  if (!hasAnyNote && !params.hasBranchClash && !params.hasStemClash) {
    return {
      meaning_id: "friend_jealousy_insufficient_evidence",
      status: "abstained",
      confidence: "insufficient",
      directionality: "symmetric",
      evidence: [{ kind: "abstention", detail: "No geobjae sensitivity or clash tension" }],
      source_mode: "saju_plus_survey",
      value: { guard_note_a: null, guard_note_b: null },
    };
  }

  const hasBranchClash = Boolean(params.hasBranchClash);
  const hasStemClash = Boolean(params.hasStemClash);
  const hasClash = hasBranchClash || hasStemClash;

  const meaningId = hasAnyNote || hasBranchClash
    ? "friend_jealousy_secure_boundary"
    : hasStemClash
      ? "friend_jealousy_blooming_seasons"
      : "friend_jealousy_natural_celebration";

  return {
    meaning_id: meaningId,
    status: hasAnyNote || hasClash ? "mixed" : "supported",
    confidence: hasAnyNote || hasBranchClash ? "high" : "medium",
    directionality: noteA && !noteB ? "a_to_b" : noteB && !noteA ? "b_to_a" : "symmetric",
    evidence: [
      ...(noteA ? [{ kind: "jealousy_guard_a", detail: noteA, source: "composite" as const }] : []),
      ...(noteB ? [{ kind: "jealousy_guard_b", detail: noteB, source: "composite" as const }] : []),
    ],
    source_mode: "saju_plus_survey",
    value: { guard_note_a: noteA, guard_note_b: noteB },
  };
}

// ── 6. Friend De-escalation & Repair Adapter ──────────────────────────────────

export type FriendDeEscalationValue = {
  card_for_a: FriendDeEscalationCard;
  card_for_b: FriendDeEscalationCard;
  reconciliation_script_a: string | null;
  reconciliation_script_b: string | null;
};

export function resolveFriendDeEscalationCanonical(params: {
  countsA: TenGodCounts;
  countsB: TenGodCounts;
  dominantElementA: string;
  dominantElementB: string;
  psychA?: PsychMasterJson | null;
  psychB?: PsychMasterJson | null;
  nicknameA: string;
  nicknameB: string;
  hasWonjin?: boolean;
  hasClash?: boolean;
  hasClashOrWonjin?: boolean;
  locale?: Locale;
}): CanonicalMeaningPacket<FriendDeEscalationValue> {
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;

  const cardForA = buildFriendDeEscalationCard({
    upsetNickname: params.nicknameA,
    counts: params.countsA,
    dominantElement: params.dominantElementA,
    locale,
  });

  const cardForB = buildFriendDeEscalationCard({
    upsetNickname: params.nicknameB,
    counts: params.countsB,
    dominantElement: params.dominantElementB,
    locale,
  });

  const scriptA = resolveReconciliationScript(params.psychA, params.nicknameA, locale);
  const scriptB = resolveReconciliationScript(params.psychB, params.nicknameB, locale);

  const hasFriction = Boolean(params.hasWonjin || params.hasClash || params.hasClashOrWonjin);
  const isSubstantive = Boolean(hasFriction || scriptA || scriptB);

  if (!isSubstantive) {
    return {
      meaning_id: "friend_repair_insufficient_evidence",
      status: "abstained",
      confidence: "insufficient",
      directionality: "dual",
      evidence: [{ kind: "abstention", detail: "No dominant friction or element tension" }],
      source_mode: "saju_plus_survey",
      value: {
        card_for_a: cardForA,
        card_for_b: cardForB,
        reconciliation_script_a: null,
        reconciliation_script_b: null,
      },
    };
  }

  const meaningId = params.hasWonjin
    ? "friend_repair_circuit_reset"
    : params.hasClash && !scriptA && !scriptB
      ? "friend_repair_cooling_timeout"
      : "friend_repair_conversational_apology";

  return {
    meaning_id: meaningId,
    status: params.hasClashOrWonjin ? "mixed" : "supported",
    confidence: scriptA && scriptB ? "high" : "medium",
    directionality: "dual",
    evidence: [
      { kind: "deescalation_a", detail: `${cardForA.hashtag} - ${cardForA.archetype_label}`, source: "saju" },
      { kind: "deescalation_b", detail: `${cardForB.hashtag} - ${cardForB.archetype_label}`, source: "saju" },
      ...(scriptA ? [{ kind: "script_a", detail: scriptA, source: "survey" as const }] : []),
      ...(scriptB ? [{ kind: "script_b", detail: scriptB, source: "survey" as const }] : []),
    ],
    source_mode: "saju_plus_survey",
    value: {
      card_for_a: cardForA,
      card_for_b: cardForB,
      reconciliation_script_a: scriptA,
      reconciliation_script_b: scriptB,
    },
  };
}
