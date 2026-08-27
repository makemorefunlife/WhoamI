/**
 * Shared Friend Response Intelligence — the single structured core that
 * Chapters 5 (support), 6 (conflict/repair), 7 (boundary), and 8 (distance)
 * all project from. Built once per pair by buildFriendResponseIntelligence().
 *
 * Chapter 4 (team play) is intentionally NOT part of this core — it answers a
 * different question (initiative/execution/tempo) and is built separately.
 */
import type { EvidenceRef, Confidence } from "./friendEvidenceTypes";
import type { FriendResponseProfile, FriendPairResponseComparison } from "./friendResponseDimensionTypes";

// ---------------------------------------------------------------------------
// CH5 — Support
// ---------------------------------------------------------------------------

export type FriendSupportMode =
  | "EMOTIONAL_HOLDING"
  | "STRATEGIC_GUIDANCE"
  | "PRACTICAL_HELP"
  | "ACTION_ACTIVATION"
  | "STEADY_PRESENCE";

export type FriendSupportProfile = {
  primaryMode: FriendSupportMode;
  secondaryMode?: FriendSupportMode;
  evidence: EvidenceRef[];
  confidence: Confidence;
};

export type FriendSupportFit = "STRONG_MATCH" | "PARTIAL_MATCH" | "MISMATCH" | "LOW_EVIDENCE";

/** Does the giver's support genuinely shift register for this specific receiver? */
export type FriendSupportAdaptation =
  | "NO_ADAPTATION"
  | "SOFTENED"
  | "MORE_DIRECT"
  | "MORE_PRACTICAL"
  | "MORE_EMOTIONAL"
  | "MORE_STABILIZING"
  | "LOW_EVIDENCE";

export type FriendDirectionalSupport = {
  giverId: string;
  receiverId: string;
  giverCapability: FriendSupportMode;
  /** null/undefined when there is no real receiver-need evidence — never a fabricated default. */
  receiverNeed?: FriendSupportMode | null;
  fit: FriendSupportFit;
  adaptation: FriendSupportAdaptation;
  evidence: EvidenceRef[];
  confidence: Confidence;
};

// ---------------------------------------------------------------------------
// CH6 — Conflict / Repair
// ---------------------------------------------------------------------------

export type FriendConflictResponse =
  | "DIRECT_CONFRONT"
  | "WITHDRAW_AND_PROCESS"
  | "SEEK_CLARIFICATION"
  | "SOLVE_QUICKLY"
  | "SOFTEN_FIRST";

export type FriendHurtTrigger =
  | "FEELING_IGNORED"
  | "BROKEN_EXPECTATION"
  | "DISRESPECT"
  | "EMOTIONAL_DISMISSAL"
  | "LOSS_OF_AUTONOMY"
  | "UNRELIABILITY";

export type FriendRepairNeed =
  | "SPACE_FIRST"
  | "REASSURANCE_FIRST"
  | "CLEAR_EXPLANATION"
  | "ACCOUNTABILITY"
  | "NORMALIZATION";

export type FriendHurtTriggerClaim = {
  trigger: FriendHurtTrigger;
  importance: "PRIMARY" | "SECONDARY";
  evidence: EvidenceRef[];
};

export type FriendConflictProfile = {
  initialResponse: FriendConflictResponse;
  /** the core relationship need the surface-level response is actually protecting (CH6-A layer 2). */
  underlyingNeed: FriendRelationshipNeedKey;
  hurtTriggers: FriendHurtTriggerClaim[];
  repairNeed: FriendRepairNeed;
  evidence: EvidenceRef[];
  confidence: Confidence;
};

export type FriendRepairStep =
  | "PAUSE"
  | "REASSURE"
  | "CLARIFY"
  | "LISTEN"
  | "ACKNOWLEDGE"
  | "EXPLAIN"
  | "SOLVE"
  | "RESET"
  | "RECONNECT";

export type FriendRepairSequence = {
  steps: FriendRepairStep[];
  evidence: EvidenceRef[];
};

export type FriendConflictInterpretation =
  | "PRESSURE"
  | "AVOIDANCE"
  | "NOT_LISTENING"
  | "DISMISSIVENESS"
  | "COLDNESS"
  | "OVERANALYSIS";

export type FriendConflictLoopStep = {
  actorId: string;
  behavior: FriendConflictResponse;
  interpretedById: string;
  /** what the interpreter reads into this behavior (e.g. withdrawal read as avoidance). */
  interpretation: FriendConflictInterpretation;
};

export type FriendConflictLoopType =
  | "OPPOSITE_STYLE_LOOP"
  | "SAME_STYLE_COLLISION"
  | "LOW_ESCALATION_MATCH"
  | "PRESSURE_WITHDRAW_LOOP"
  | "EXPLANATION_COMPETITION"
  | "EMOTIONAL_MISS";

export type FriendConflictLoop = {
  loopType: FriendConflictLoopType;
  steps: FriendConflictLoopStep[];
  /** true when the pair is unlikely to self-reinforce (low escalation risk). */
  lowRisk: boolean;
  evidence: EvidenceRef[];
};

// ---------------------------------------------------------------------------
// CH7 — Boundary / Needs
// ---------------------------------------------------------------------------

export type FriendRelationshipNeedKey =
  | "RELIABILITY"
  | "EMOTIONAL_RESPECT"
  | "HONESTY"
  | "RECOGNITION"
  | "AUTONOMY"
  | "CONSISTENCY";

export type FriendRelationshipNeed = {
  key: FriendRelationshipNeedKey;
  importance: "PRIMARY" | "SECONDARY";
  evidence: EvidenceRef[];
};

export type FriendBoundaryBehavior =
  | "REPEATED_BROKEN_PLANS"
  | "EMOTIONAL_DISMISSAL"
  | "DISHONESTY"
  | "PUBLIC_UNDERMINING"
  | "OVER_CONTROL"
  | "INCONSISTENT_TREATMENT";

export type FriendBoundaryClaim = {
  behavior: FriendBoundaryBehavior;
  /** the FriendRelationshipNeedKey this boundary is the negative inversion of. */
  fromNeed: FriendRelationshipNeedKey;
  evidence: EvidenceRef[];
};

export type FriendExpectationAdjustment = {
  /** the capability the receiver expects but the giver doesn't naturally provide strongly. */
  gapMode: FriendSupportMode;
  resolution: "EXPECT_LESS" | "ASK_EXPLICITLY" | "ACCEPT_DIFFERENT_EXPRESSION";
  evidence: EvidenceRef[];
  /** Explicit directionality (spec: CH7-C) — this profile's owner is the one
   * who expects `gapMode`; `providerId` is whose support profile was checked
   * against it. Never inferred from array/render position. */
  expectationOwnerId: string;
  providerId: string;
};

export type FriendFreedomNeed =
  | "SPACE_BETWEEN_CONTACT"
  | "INDEPENDENT_SOCIAL_CIRCLES"
  | "PRIVATE_PROCESSING"
  | "NOT_SHARING_EVERYTHING"
  | "FLEXIBLE_MEETING_FREQUENCY";

export type FriendBoundaryProfile = {
  needs: FriendRelationshipNeed[];
  boundaries: FriendBoundaryClaim[];
  expectationAdjustment: FriendExpectationAdjustment | null;
  freedomNeed: FriendFreedomNeed | null;
  evidence: EvidenceRef[];
  confidence: Confidence;
};

// ---------------------------------------------------------------------------
// CH8 — Distance
// ---------------------------------------------------------------------------

export type FriendBaselineDistance =
  | "FREQUENT_LIGHT_CONTACT"
  | "FREQUENT_DEEP_CONTACT"
  | "LOW_FREQUENCY_HIGH_TRUST"
  | "EVENT_DRIVEN_CONNECTION"
  | "FLEXIBLE_DISTANCE"
  /** connectionMaintenance confidence is LOW (e.g. energy_style/stimulation
   * both absent) — distinct from FLEXIBLE_DISTANCE, which now requires
   * genuine MODERATE-confidence evidence. Never silently rendered as a
   * positive "flexible" claim (spec: "모르겠음" MUST NOT become "유연한 거리감"). */
  | "LOW_EVIDENCE_DISTANCE";

export type FriendSilenceInterpretation = "NEUTRAL" | "MILD_CHECK_IN" | "RELATIONSHIP_CONCERN";

export type FriendMaintenanceSignal =
  | "IMPORTANT_MOMENT_CONTACT"
  | "OCCASIONAL_INITIATION"
  | "DEEP_RECONNECTION"
  | "RELIABLE_RESPONSE_WHEN_NEEDED"
  | "SHARED_EXPERIENCE";

export type FriendDisengagementSignal =
  | "STOPS_SHARING_IMPORTANT_EVENTS"
  | "STOPS_INITIATING_COMPLETELY"
  | "AVOIDS_MEETING_WHEN_AVAILABLE"
  | "ONLY_CONTACTS_FOR_NEEDS"
  | "EMOTIONAL_DEPTH_DISAPPEARS";

export type FriendDistanceProfile = {
  baselineDistance: FriendBaselineDistance;
  silenceInterpretation: FriendSilenceInterpretation;
  maintenanceMinimum: FriendMaintenanceSignal[];
  disengagementSignals: FriendDisengagementSignal[];
  evidence: EvidenceRef[];
  confidence: Confidence;
};

export type FriendPairDistanceCompatibility = "MATCHED_DISTANCE" | "NEGOTIABLE_GAP" | "HIGH_DISTANCE_MISMATCH" | "LOW_EVIDENCE";

export type FriendPairDistanceDynamics = {
  compatibility: FriendPairDistanceCompatibility;
  aPreference: FriendBaselineDistance;
  bPreference: FriendBaselineDistance;
  sharedMaintenanceMinimum: FriendMaintenanceSignal[];
  evidence: EvidenceRef[];
};

// ---------------------------------------------------------------------------
// Person / Pair envelope
// ---------------------------------------------------------------------------

export type FriendPersonResponseProfile = {
  personId: string;
  name: string;
  /** Canonical response profile — the single scored source every field below
   * is derived from. Chapters must not re-test raw axes independently. */
  responseProfile: FriendResponseProfile;
  support: FriendSupportProfile;
  conflict: FriendConflictProfile;
  boundary: FriendBoundaryProfile;
  distance: FriendDistanceProfile;
};

export type FriendResponseProvenance = {
  version: string;
  sourceIds: string[];
};

export type FriendResponseIntelligence = {
  personA: FriendPersonResponseProfile;
  personB: FriendPersonResponseProfile;

  directional: {
    aToB: FriendDirectionalSupport;
    bToA: FriendDirectionalSupport;
  };

  pair: {
    supportMismatch: {
      hasMeaningfulMismatch: boolean;
      description: "BROADLY_COMPATIBLE" | "STYLE_GAP";
      evidence: EvidenceRef[];
    };
    /** Per-dimension GENUINE_SIMILARITY / SAME_DIRECTION_DIFFERENT_EXPRESSION
     * / COMPLEMENTARY_DIFFERENCE / FRICTION_DIFFERENCE / LOW_EVIDENCE
     * classification, derived from the same canonical profiles that produced
     * personA/personB — never a disconnected heuristic (spec: CH5 fix). */
    responseComparison: FriendPairResponseComparison;
    conflictLoop: FriendConflictLoop;
    repairSequenceA: FriendRepairSequence;
    repairSequenceB: FriendRepairSequence;
    distance: FriendPairDistanceDynamics;
  };

  provenance: FriendResponseProvenance;
};
