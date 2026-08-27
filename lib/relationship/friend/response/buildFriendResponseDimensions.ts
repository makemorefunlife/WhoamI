/**
 * Canonical Friend Response Profile — dimension scorers.
 *
 * Each dimension blends its available evidence into ONE continuous 0-100
 * score (never a binary threshold), then derives level/confidence from that
 * score and the number of DISTINCT evidence families that actually fired.
 * `buildFriendResponseIntelligence.ts` derives support/conflict/needs/
 * boundary/distance from these dimensions instead of re-testing raw axes.
 */
import type { TenGodCounts } from "@/lib/relationship/marriage/marriageTenGodAnalysis";
import { profileTenGods } from "@/lib/relationship/marriage/marriageTenGodAnalysis";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { EvidenceRef, EvidenceSource, Confidence } from "./friendEvidenceTypes";
import type {
  FriendResponseDimension,
  FriendResponseDimensionKey,
  FriendResponseProfile,
  FriendDimensionLevel,
  FriendProblemResponseSubStyle,
  FriendPairDimensionClassification,
  FriendPairDimensionComparison,
  FriendPairResponseComparison,
  FriendPairComparableDimensionKey,
} from "./friendResponseDimensionTypes";

export type DimensionPersonInput = {
  personId: string;
  tenGods: TenGodCounts;
  psych: PsychMasterJson | null | undefined;
};

function axisValue(psych: PsychMasterJson | null | undefined, key: string): number | undefined {
  return (psych?.secondary_axes as Record<string, number> | undefined)?.[key];
}

/** Ten-god family counts (0-4 typical) mapped onto the same 0-100 scale as a
 * psych axis, graduated — no hard "2+ = signal, else nothing" cliff. */
function tenGodPoints(count: number): number {
  if (count <= 0) return 35;
  if (count === 1) return 55;
  if (count === 2) return 75;
  return 90;
}

function levelFromScore(score: number): FriendDimensionLevel {
  if (score >= 60) return "HIGH";
  if (score <= 40) return "LOW";
  return "MODERATE";
}

type Component = {
  weight: number;
  points: number;
  ok: boolean;
  ev?: EvidenceRef;
  missingLabel: string;
};

function psychComponent(
  psych: PsychMasterJson | null | undefined,
  axisKey: string,
  personId: string,
  weight: number,
  strength: EvidenceRef["strength"] = "PRIMARY",
): Component {
  const value = axisValue(psych, axisKey);
  if (value === undefined) {
    return { weight, points: 50, ok: false, missingLabel: axisKey };
  }
  return {
    weight,
    points: value,
    ok: true,
    ev: { source: "PSYCH_11", key: axisKey, personId, polarity: "SUPPORTS", strength, rawValue: value },
    missingLabel: axisKey,
  };
}

function tenGodComponent(
  count: number,
  factKey: string,
  personId: string,
  weight: number,
  strength: EvidenceRef["strength"] = "SUPPORTING",
): Component {
  return {
    weight,
    points: tenGodPoints(count),
    ok: count > 0,
    ev: count > 0
      ? { source: "TEN_GOD", key: factKey, personId, polarity: "SUPPORTS", strength, rawValue: count }
      : undefined,
    missingLabel: factKey,
  };
}

/** Blends components into one continuous score, renormalizing weights over
 * whichever components actually have data. Confidence counts DISTINCT
 * evidence SOURCE FAMILIES that fired (source+key), not mentions — three
 * components reading the same axis must not inflate confidence (spec §16). */
function combine(
  key: FriendResponseDimensionKey,
  personId: string,
  components: Component[],
): FriendResponseDimension {
  const present = components.filter((c) => c.ok);
  const missingEvidence = components.filter((c) => !c.ok).map((c) => c.missingLabel);

  if (present.length === 0) {
    return {
      key,
      score: 50,
      level: "MODERATE",
      confidence: "LOW",
      evidence: [],
      missingEvidence,
    };
  }

  const totalWeight = present.reduce((sum, c) => sum + c.weight, 0);
  const score = present.reduce((sum, c) => sum + (c.points * c.weight) / totalWeight, 0);

  const distinctFamilies = new Set(present.map((c) => `${c.ev!.source}:${c.ev!.key}`)).size;
  const confidence: Confidence = distinctFamilies >= 2 ? "HIGH" : distinctFamilies === 1 ? "MEDIUM" : "LOW";

  return {
    key,
    score: Math.round(score * 10) / 10,
    level: levelFromScore(score),
    confidence,
    evidence: present.map((c) => c.ev!),
    missingEvidence,
  };
}

// ---------------------------------------------------------------------------
// The 5 canonical dimensions + 1 optional (autonomySpaceNeed)
// ---------------------------------------------------------------------------

export function scoreEmotionalReception(p: DimensionPersonInput): FriendResponseDimension {
  const tg = profileTenGods(p.tenGods);
  return combine("emotionalReception", p.personId, [
    psychComponent(p.psych, "empathy", p.personId, 0.65, "PRIMARY"),
    tenGodComponent(tg.seal, "seal_count", p.personId, 0.35, "SECONDARY"),
  ]);
}

export function scoreProblemResponse(p: DimensionPersonInput): FriendResponseDimension {
  const tg = profileTenGods(p.tenGods);

  const clarify = combine("problemResponse", p.personId, [
    psychComponent(p.psych, "thinking_style", p.personId, 0.7, "PRIMARY"),
    tenGodComponent(tg.officer, "officer_count", p.personId, 0.3, "SECONDARY"),
  ]);
  const solve = combine("problemResponse", p.personId, [
    psychComponent(p.psych, "practicality", p.personId, 0.7, "PRIMARY"),
    tenGodComponent(tg.wealth, "wealth_count", p.personId, 0.3, "SECONDARY"),
  ]);
  // decision_style and stimulation are both weak proxies for "activation" —
  // prefer decision_style when present, fall back to stimulation, never both
  // (that would double-count one underlying "acts fast" signal as two).
  const activateAxisKey = axisValue(p.psych, "decision_style") !== undefined ? "decision_style" : "stimulation";
  const activate = combine("problemResponse", p.personId, [
    psychComponent(p.psych, activateAxisKey, p.personId, 0.7, "PRIMARY"),
    tenGodComponent(tg.food, "food_count", p.personId, 0.3, "SECONDARY"),
  ]);

  const candidates: Array<{ style: FriendProblemResponseSubStyle; dim: FriendResponseDimension }> = [
    { style: "CLARIFY", dim: clarify },
    { style: "SOLVE", dim: solve },
    { style: "ACTIVATE", dim: activate },
  ];
  candidates.sort((a, b) => b.dim.score - a.dim.score);
  const winner = candidates[0]!;

  const missingEvidence = Array.from(
    new Set(candidates.flatMap((c) => c.dim.missingEvidence)),
  );

  return {
    key: "problemResponse",
    score: winner.dim.score,
    level: winner.dim.level,
    confidence: winner.dim.confidence,
    evidence: winner.dim.evidence,
    missingEvidence,
    subStyle: winner.dim.confidence === "LOW" ? "UNDIFFERENTIATED" : winner.style,
  };
}

export function scoreReliabilitySensitivity(p: DimensionPersonInput): FriendResponseDimension {
  const tg = profileTenGods(p.tenGods);
  return combine("reliabilitySensitivity", p.personId, [
    psychComponent(p.psych, "structure", p.personId, 0.7, "PRIMARY"),
    tenGodComponent(tg.officer, "officer_count", p.personId, 0.3, "SECONDARY"),
  ]);
}

export function scoreConflictDirectness(p: DimensionPersonInput): FriendResponseDimension {
  const tg = profileTenGods(p.tenGods);
  const conflictStyleMissing = axisValue(p.psych, "conflict_style") === undefined;
  const dim = combine("conflictDirectness", p.personId, [
    psychComponent(p.psych, "conflict_style", p.personId, 0.75, "PRIMARY"),
    tenGodComponent(tg.self, "self_count", p.personId, 0.25, "SECONDARY"),
  ]);
  // conflict_style is the PRIMARY evidence for this dimension by design (spec
  // §6) — self-count alone must never carry it to HIGH confidence.
  if (conflictStyleMissing && dim.confidence === "HIGH") {
    return { ...dim, confidence: "MEDIUM" };
  }
  return dim;
}

export function scoreConnectionMaintenance(p: DimensionPersonInput): FriendResponseDimension {
  const tg = profileTenGods(p.tenGods);
  return combine("connectionMaintenance", p.personId, [
    psychComponent(p.psych, "energy_style", p.personId, 0.4, "PRIMARY"),
    psychComponent(p.psych, "stimulation", p.personId, 0.3, "SECONDARY"),
    psychComponent(p.psych, "resilience", p.personId, 0.15, "SUPPORTING"),
    tenGodComponent(tg.self, "self_count", p.personId, 0.15, "SUPPORTING"),
  ]);
}

/** Audited per spec §8: self_control is the only defensible single-axis
 * proxy currently available (no ten-god family maps cleanly onto "need for
 * autonomous space" without reusing structure/empathy already spoken for by
 * other dimensions). Returns null — not a fabricated neutral guess — when
 * that one axis is absent, and confidence is capped at MEDIUM even when
 * present, since it is a single-source reading. */
export function scoreAutonomySpaceNeed(p: DimensionPersonInput): FriendResponseDimension | null {
  const selfControl = axisValue(p.psych, "self_control");
  if (selfControl === undefined) return null;
  const score = 100 - selfControl;
  return {
    key: "autonomySpaceNeed",
    score,
    level: levelFromScore(score),
    confidence: "MEDIUM",
    evidence: [
      { source: "PSYCH_11", key: "self_control", personId: p.personId, polarity: "SUPPORTS", strength: "PRIMARY", rawValue: selfControl },
    ],
    missingEvidence: [],
  };
}

export function buildFriendResponseProfile(p: DimensionPersonInput): FriendResponseProfile {
  return {
    personId: p.personId,
    emotionalReception: scoreEmotionalReception(p),
    problemResponse: scoreProblemResponse(p),
    reliabilitySensitivity: scoreReliabilitySensitivity(p),
    conflictDirectness: scoreConflictDirectness(p),
    connectionMaintenance: scoreConnectionMaintenance(p),
    autonomySpaceNeed: scoreAutonomySpaceNeed(p),
  };
}

// ---------------------------------------------------------------------------
// Pair comparison — SAME / SAME-DIRECTION-DIFFERENT-EXPRESSION / COMPLEMENTARY
// / FRICTION / LOW_EVIDENCE (spec §10)
// ---------------------------------------------------------------------------

/** Dimensions where a large gap represents opposing strategies that can
 * collide under tension (friction) vs. dimensions where a large gap means
 * one person's strength covers ground the other doesn't instinctively offer
 * (complementary) vs. dimensions that are purely "how much" with no natural
 * opposing-forces reading. Reuses the same directional logic CH6's conflict
 * loop already encodes (DIRECT vs WITHDRAW = friction) rather than inventing
 * new semantics. */
const GAP_SEMANTICS: Record<FriendPairComparableDimensionKey, "FRICTION" | "COMPLEMENTARY" | "INTENSITY_ONLY"> = {
  emotionalReception: "COMPLEMENTARY",
  problemResponse: "COMPLEMENTARY",
  conflictDirectness: "FRICTION",
  reliabilitySensitivity: "INTENSITY_ONLY",
  connectionMaintenance: "INTENSITY_ONLY",
};

export function classifyPairDimension(
  key: FriendPairComparableDimensionKey,
  a: FriendResponseDimension,
  b: FriendResponseDimension,
): FriendPairDimensionComparison {
  const gap = Math.round(Math.abs(a.score - b.score) * 10) / 10;
  const confidence: Confidence = a.confidence === "LOW" || b.confidence === "LOW" ? "LOW" : a.confidence === "MEDIUM" || b.confidence === "MEDIUM" ? "MEDIUM" : "HIGH";

  let classification: FriendPairDimensionClassification;
  if (confidence === "LOW") {
    classification = "LOW_EVIDENCE";
  } else if (gap <= 10) {
    classification = "GENUINE_SIMILARITY";
  } else if (gap <= 25) {
    classification = "SAME_DIRECTION_DIFFERENT_EXPRESSION";
  } else {
    const semantics = GAP_SEMANTICS[key];
    classification = semantics === "FRICTION" ? "FRICTION_DIFFERENCE" : semantics === "COMPLEMENTARY" ? "COMPLEMENTARY_DIFFERENCE" : "SAME_DIRECTION_DIFFERENT_EXPRESSION";
  }

  return {
    dimension: key,
    classification,
    gap,
    aScore: a.score,
    bScore: b.score,
    aLevel: a.level,
    bLevel: b.level,
    confidence,
  };
}

export function buildFriendPairResponseComparison(
  profileA: FriendResponseProfile,
  profileB: FriendResponseProfile,
): FriendPairResponseComparison {
  const keys: FriendPairComparableDimensionKey[] = [
    "emotionalReception",
    "problemResponse",
    "reliabilitySensitivity",
    "conflictDirectness",
    "connectionMaintenance",
  ];
  const out = {} as FriendPairResponseComparison;
  for (const key of keys) {
    out[key] = classifyPairDimension(key, profileA[key], profileB[key]);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Shared blind spot (spec §10/§11) — ONLY the one dimension where the
// "strong pattern + same strong pattern + absent complementary behavior"
// contract is currently defensible: both people scoring LOW connectionMaintenance
// (neither needs/initiates frequent contact) with real confidence, and
// neither compensating with HIGH conflictDirectness (which would mean at
// least one of them proactively surfaces unspoken tension anyway). This is
// deliberately narrow — never fabricated for dimensions where the "absence
// of complementary behavior" half of the contract can't be checked from
// existing evidence.
// ---------------------------------------------------------------------------

export type FriendSharedBlindSpot = {
  dimension: "connectionMaintenance";
  pattern: "LOW_CONTACT_NEED_BOTH";
};

export function detectSharedBlindSpot(
  profileA: FriendResponseProfile,
  profileB: FriendResponseProfile,
  comparison: FriendPairResponseComparison,
): FriendSharedBlindSpot | null {
  const cm = comparison.connectionMaintenance;
  const bothLowContactNeed =
    cm.classification === "GENUINE_SIMILARITY" &&
    cm.confidence !== "LOW" &&
    profileA.connectionMaintenance.level === "LOW" &&
    profileB.connectionMaintenance.level === "LOW";
  if (!bothLowContactNeed) return null;

  // Complementary behavior absent: neither person's conflictDirectness is
  // HIGH enough that they'd proactively surface a feeling left unspoken by
  // the low-contact rhythm.
  const eitherProactivelyDirect =
    profileA.conflictDirectness.level === "HIGH" || profileB.conflictDirectness.level === "HIGH";
  if (eitherProactivelyDirect) return null;

  return { dimension: "connectionMaintenance", pattern: "LOW_CONTACT_NEED_BOTH" };
}
