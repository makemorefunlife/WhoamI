/**
 * Phase 6-2b / V1 Gold Logic — Friend Treasurer Canonical Vertical Slice.
 *
 * Pipeline:
 *   PersonCore SSOT → Personal Saju CE (TenGod counts)
 *   Survey Answers → Personality Profile (11 axes: practicality, structure)
 *   PersonCore A/B → Pair Saju Facts
 *   Personal Saju CE A/B + Pair Saju Facts → Pair CE
 *   Personality Profile A/B → Personality Pair Comparison
 *   Pair CE + Personality Pair Comparison → Friend Treasurer Lens → Authoritative V1 Canonical Meaning → Story/UI
 *
 * Locked V1 rule:
 *   SajuScore = 정재*3 + 정관*2 + 편재*1
 *   SAJU_TREASURER_LOCK = 2
 *   PsychAvg = (practicality + structure) / 2
 *   CompositeScore = SajuScore*10 + PsychAvg
 *   COMPOSITE_MARGIN = 12
 *   PSYCH_FLIP_GAP = 20
 *
 * Tie-break:
 *   1. Higher 정재 count
 *   2. If still tied, Person A with caution status
 */
import type { CanonicalJudgment } from "@/lib/relationship/contextEngine/canonicalJudgment";
import type { TenGodCounts } from "@/lib/relationship/marriage/marriageTenGodAnalysis";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { Locale } from "@/lib/i18n/locale";
import {
  LEGACY_FALLBACK_LOCALE,
  pick,
} from "@/lib/relationship/friend/friendCopy";
import { buildFriendTreasurerReason } from "@/lib/relationship/friend/friendDeEscalationPrescriptions";

export const FRIEND_TREASURER_CANONICAL_SOURCE =
  "refineFriendTreasurer" as const;

/** Section holding treasurer_* fields (nickname / reason / align / confidence). */
export const FRIEND_TREASURER_PERSISTENCE_PATH =
  "friend.section_play_money" as const;

export const FRIEND_TREASURER_CLIENT_PATH =
  "canonical_projections.treasurer" as const;

/** Soft refine when composite attached confidence/align; otherwise none (legacy base). */
export const FRIEND_TREASURER_PSYCH_MODE_WITH_PSYCH = "soft" as const;
export const FRIEND_TREASURER_PSYCH_MODE_LEGACY = "none" as const;

export const SAJU_TREASURER_LOCK = 2;
export const COMPOSITE_MARGIN = 12;
export const PSYCH_FLIP_GAP = 20;

export type SurveyEvidenceStatus =
  | "observed"
  | "partial_inference"
  | "unobserved";

export type FriendTreasurerPairFacts = {
  saju_treasurer_score_a: number;
  saju_treasurer_score_b: number;
  saju_treasurer_diff: number;
  saju_locked: boolean;
  psych_treasurer_avg_a: number;
  psych_treasurer_avg_b: number;
  psych_treasurer_gap: number;
  survey_evidence_status: SurveyEvidenceStatus;
  unknown_hour: boolean;
};

export type FriendTreasurerCanonicalResult = {
  meaning_id: "friend_treasurer_canonical";
  selected_person: "A" | "B";
  selected_nickname: string;
  saju_scores: { a: number; b: number };
  psych_scores: { a: number; b: number } | null;
  base_selection: "A" | "B";
  final_selection: "A" | "B";
  flipped_by_survey: boolean;
  align: "confirms" | "caution" | null;
  confidence: "high" | "medium" | "low" | "insufficient";
  survey_evidence_status: SurveyEvidenceStatus;
  reason: string;
  pair_facts: FriendTreasurerPairFacts;
  evidence: Array<{
    kind: string;
    detail: string;
  }>;
};

export type ResolveFriendTreasurerCanonicalParams = {
  nicknameA: string;
  nicknameB: string;
  countsA: TenGodCounts;
  countsB: TenGodCounts;
  psychA?:
    | PsychMasterJson
    | { secondary_axes?: { practicality?: number; structure?: number } }
    | null;
  psychB?:
    | PsychMasterJson
    | { secondary_axes?: { practicality?: number; structure?: number } }
    | null;
  birthTimeUnknownA?: boolean;
  birthTimeUnknownB?: boolean;
  locale?: Locale;
};

/** Saju Score = 정재*3 + 정관*2 + 편재*1 */
export function computeSajuTreasurerScore(counts: TenGodCounts): number {
  return (
    (counts["정재"] ?? 0) * 3 +
    (counts["정관"] ?? 0) * 2 +
    (counts["편재"] ?? 0) * 1
  );
}

/** Psych Avg = (practicality + structure) / 2 */
export function computePsychTreasurerAvg(
  psych?:
    | PsychMasterJson
    | { secondary_axes?: { practicality?: number; structure?: number } }
    | null,
): { avg: number; status: "observed" | "unobserved" } {
  if (
    psych &&
    psych.secondary_axes &&
    typeof psych.secondary_axes.practicality === "number" &&
    typeof psych.secondary_axes.structure === "number"
  ) {
    return {
      avg:
        (psych.secondary_axes.practicality + psych.secondary_axes.structure) /
        2,
      status: "observed",
    };
  }
  return {
    avg: 50,
    status: "unobserved",
  };
}

export function softTreasurerReason(
  baseReason: string,
  locale: Locale = LEGACY_FALLBACK_LOCALE,
): string {
  return `${baseReason} ${pick(
    locale,
    "Survey axes are mixed — keep the treasurer role flexible and use a splitting app when needed.",
    "설문 축은 엇갈려 있어요 — 총무 역할을 너무 굳히지 말고 필요하면 정산 앱을 같이 쓰세요.",
  )}`;
}

export function extractFriendTreasurerPairFacts(params: {
  countsA: TenGodCounts;
  countsB: TenGodCounts;
  psychA?:
    | PsychMasterJson
    | { secondary_axes?: { practicality?: number; structure?: number } }
    | null;
  psychB?:
    | PsychMasterJson
    | { secondary_axes?: { practicality?: number; structure?: number } }
    | null;
  birthTimeUnknownA?: boolean;
  birthTimeUnknownB?: boolean;
}): FriendTreasurerPairFacts {
  const scoreA = computeSajuTreasurerScore(params.countsA);
  const scoreB = computeSajuTreasurerScore(params.countsB);
  const sajuDiff = scoreA - scoreB;
  const sajuLocked = Math.abs(sajuDiff) >= SAJU_TREASURER_LOCK;

  const psychAInfo = computePsychTreasurerAvg(params.psychA);
  const psychBInfo = computePsychTreasurerAvg(params.psychB);

  let surveyStatus: SurveyEvidenceStatus = "unobserved";
  if (psychAInfo.status === "observed" && psychBInfo.status === "observed") {
    surveyStatus = "observed";
  } else if (
    psychAInfo.status === "observed" ||
    psychBInfo.status === "observed"
  ) {
    surveyStatus = "partial_inference";
  }

  const psychGap = psychAInfo.avg - psychBInfo.avg;
  const unknownHour = Boolean(
    params.birthTimeUnknownA || params.birthTimeUnknownB,
  );

  return {
    saju_treasurer_score_a: scoreA,
    saju_treasurer_score_b: scoreB,
    saju_treasurer_diff: sajuDiff,
    saju_locked: sajuLocked,
    psych_treasurer_avg_a: psychAInfo.avg,
    psych_treasurer_avg_b: psychBInfo.avg,
    psych_treasurer_gap: psychGap,
    survey_evidence_status: surveyStatus,
    unknown_hour: unknownHour,
  };
}

/**
 * Resolve Friend Treasurer Canonical Meaning
 *
 * Implements the authoritative V1 logic with exact preservation of thresholds,
 * tie-breaks, survey flip rules, and soft copy attachments.
 */
export function resolveFriendTreasurerCanonical(
  params: ResolveFriendTreasurerCanonicalParams,
): FriendTreasurerCanonicalResult {
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const { nicknameA, nicknameB } = params;
  const facts = extractFriendTreasurerPairFacts(params);

  const jeongjaeA = params.countsA["정재"] ?? 0;
  const jeongjaeB = params.countsB["정재"] ?? 0;

  // Base Saju Selection & Tie-break
  let baseSelection: "A" | "B" = "A";
  let isFullTie = false;

  if (facts.saju_treasurer_score_a > facts.saju_treasurer_score_b) {
    baseSelection = "A";
  } else if (facts.saju_treasurer_score_b > facts.saju_treasurer_score_a) {
    baseSelection = "B";
  } else {
    // Exact score tie -> check 정재 count
    if (jeongjaeA > jeongjaeB) {
      baseSelection = "A";
    } else if (jeongjaeB > jeongjaeA) {
      baseSelection = "B";
    } else {
      // Full tie -> defaults to A with caution status
      baseSelection = "A";
      isFullTie = true;
    }
  }

  const baseNickname = baseSelection === "A" ? nicknameA : nicknameB;
  const baseReason = buildFriendTreasurerReason(baseNickname, locale);

  // If survey is NOT fully observed, synthetic values MUST NOT flip Saju
  if (facts.survey_evidence_status !== "observed") {
    const confidence: "high" | "medium" | "low" = isFullTie
      ? "low"
      : facts.saju_locked
        ? facts.unknown_hour
          ? "medium"
          : "high"
        : "medium";

    const align = isFullTie ? "caution" : null;
    const reason = isFullTie
      ? softTreasurerReason(baseReason, locale)
      : baseReason;

    return {
      meaning_id: "friend_treasurer_canonical",
      selected_person: baseSelection,
      selected_nickname: baseNickname,
      saju_scores: {
        a: facts.saju_treasurer_score_a,
        b: facts.saju_treasurer_score_b,
      },
      psych_scores: null,
      base_selection: baseSelection,
      final_selection: baseSelection,
      flipped_by_survey: false,
      align,
      confidence,
      survey_evidence_status: facts.survey_evidence_status,
      reason,
      pair_facts: facts,
      evidence: [
        {
          kind: "saju_score_a",
          detail: `A: 정재(${jeongjaeA})*3+정관(${params.countsA["정관"] ?? 0})*2+편재(${params.countsA["편재"] ?? 0})*1 = ${facts.saju_treasurer_score_a}`,
        },
        {
          kind: "saju_score_b",
          detail: `B: 정재(${jeongjaeB})*3+정관(${params.countsB["정관"] ?? 0})*2+편재(${params.countsB["편재"] ?? 0})*1 = ${facts.saju_treasurer_score_b}`,
        },
      ],
    };
  }

  // Survey is observed -> compute composite
  const compositeA =
    facts.saju_treasurer_score_a * 10 + facts.psych_treasurer_avg_a;
  const compositeB =
    facts.saju_treasurer_score_b * 10 + facts.psych_treasurer_avg_b;
  const compositeDiff = compositeA - compositeB;

  const compositeWinner: "a" | "b" | "balanced" =
    compositeDiff >= COMPOSITE_MARGIN
      ? "a"
      : compositeDiff <= -COMPOSITE_MARGIN
        ? "b"
        : "balanced";

  const baseIsA = baseSelection === "A";
  const clearFlip =
    compositeWinner !== "balanced" &&
    ((compositeWinner === "a" && !baseIsA) ||
      (compositeWinner === "b" && baseIsA)) &&
    Math.abs(facts.psych_treasurer_gap) >= PSYCH_FLIP_GAP;

  const psychScores = {
    a: facts.psych_treasurer_avg_a,
    b: facts.psych_treasurer_avg_b,
  };

  const evidence = [
    {
      kind: "saju_score_a",
      detail: `A: 정재(${jeongjaeA})*3+정관(${params.countsA["정관"] ?? 0})*2+편재(${params.countsA["편재"] ?? 0})*1 = ${facts.saju_treasurer_score_a}`,
    },
    {
      kind: "saju_score_b",
      detail: `B: 정재(${jeongjaeB})*3+정관(${params.countsB["정관"] ?? 0})*2+편재(${params.countsB["편재"] ?? 0})*1 = ${facts.saju_treasurer_score_b}`,
    },
    {
      kind: "psych_avg_a",
      detail: `A: (practicality+structure)/2 = ${facts.psych_treasurer_avg_a}`,
    },
    {
      kind: "psych_avg_b",
      detail: `B: (practicality+structure)/2 = ${facts.psych_treasurer_avg_b}`,
    },
    {
      kind: "composite_diff",
      detail: `Composite diff = ${compositeDiff} (Winner: ${compositeWinner})`,
    },
  ];

  if (clearFlip && !facts.saju_locked) {
    const finalSelection: "A" | "B" = compositeWinner === "a" ? "A" : "B";
    const selectedNickname = finalSelection === "A" ? nicknameA : nicknameB;
    const reason = softTreasurerReason(
      buildFriendTreasurerReason(selectedNickname, locale),
      locale,
    );
    const confidence: "high" | "medium" = facts.unknown_hour
      ? "medium"
      : "high";

    return {
      meaning_id: "friend_treasurer_canonical",
      selected_person: finalSelection,
      selected_nickname: selectedNickname,
      saju_scores: {
        a: facts.saju_treasurer_score_a,
        b: facts.saju_treasurer_score_b,
      },
      psych_scores: psychScores,
      base_selection: baseSelection,
      final_selection: finalSelection,
      flipped_by_survey: true,
      align: "caution",
      confidence,
      survey_evidence_status: "observed",
      reason,
      pair_facts: facts,
      evidence,
    };
  }

  if (clearFlip && facts.saju_locked) {
    return {
      meaning_id: "friend_treasurer_canonical",
      selected_person: baseSelection,
      selected_nickname: baseNickname,
      saju_scores: {
        a: facts.saju_treasurer_score_a,
        b: facts.saju_treasurer_score_b,
      },
      psych_scores: psychScores,
      base_selection: baseSelection,
      final_selection: baseSelection,
      flipped_by_survey: false,
      align: "caution",
      confidence: "low",
      survey_evidence_status: "observed",
      reason: softTreasurerReason(baseReason, locale),
      pair_facts: facts,
      evidence,
    };
  }

  if (compositeWinner === "balanced") {
    return {
      meaning_id: "friend_treasurer_canonical",
      selected_person: baseSelection,
      selected_nickname: baseNickname,
      saju_scores: {
        a: facts.saju_treasurer_score_a,
        b: facts.saju_treasurer_score_b,
      },
      psych_scores: psychScores,
      base_selection: baseSelection,
      final_selection: baseSelection,
      flipped_by_survey: false,
      align: "caution",
      confidence: "low",
      survey_evidence_status: "observed",
      reason: softTreasurerReason(baseReason, locale),
      pair_facts: facts,
      evidence,
    };
  }

  const matchesBase =
    (compositeWinner === "a" && baseIsA) ||
    (compositeWinner === "b" && !baseIsA);

  const confidence: "high" | "low" | "medium" = matchesBase
    ? facts.unknown_hour
      ? "medium"
      : "high"
    : "low";

  return {
    meaning_id: "friend_treasurer_canonical",
    selected_person: baseSelection,
    selected_nickname: baseNickname,
    saju_scores: {
      a: facts.saju_treasurer_score_a,
      b: facts.saju_treasurer_score_b,
    },
    psych_scores: psychScores,
    base_selection: baseSelection,
    final_selection: baseSelection,
    flipped_by_survey: false,
    align: matchesBase ? "confirms" : "caution",
    confidence,
    survey_evidence_status: "observed",
    reason: matchesBase ? baseReason : softTreasurerReason(baseReason, locale),
    pair_facts: facts,
    evidence,
  };
}

// ─── Legacy Wrapper & Projections ──────────────────────────────────────────

export type FriendTreasurerBase = {
  nickname: string;
  reason: string;
};

/** Client-safe typed treasurer identity (locale-independent). */
export type FriendTreasurerClientValue = {
  side: "a" | "b";
  align?: "confirms" | "caution";
  confidence?: "high" | "low";
};

export type FriendTreasurerCanonical =
  CanonicalJudgment<import("./friendPsychFit").RefinedFriendTreasurer>;

/**
 * Wrap an already-finalized `refineFriendTreasurer` result.
 * Does not call pick/refine, read signals/psych, or alter the judgment.
 */
export function buildFriendTreasurerCanonical(
  refined: import("./friendPsychFit").RefinedFriendTreasurer | null | undefined,
  options?: {
    base?: FriendTreasurerBase | null;
  },
): FriendTreasurerCanonical | null {
  if (!refined) return null;

  const psychApplied = refined.confidence != null || refined.align != null;

  return {
    value: refined,
    source: FRIEND_TREASURER_CANONICAL_SOURCE,
    psychMode: psychApplied
      ? FRIEND_TREASURER_PSYCH_MODE_WITH_PSYCH
      : FRIEND_TREASURER_PSYCH_MODE_LEGACY,
    confidence: refined.confidence,
    align: refined.align,
    base: options?.base ?? undefined,
    persistencePath: FRIEND_TREASURER_PERSISTENCE_PATH,
  };
}

/** Semantic judgment fields — locale copy (reason) excluded. */
export type FriendTreasurerJudgmentFields = {
  nickname: string;
  confidence?: import("./friendPsychFit").RefinedFriendTreasurer["confidence"];
  align?: import("./friendPsychFit").RefinedFriendTreasurer["align"];
};

export function treasurerJudgmentFields(
  refined: import("./friendPsychFit").RefinedFriendTreasurer | null | undefined,
): FriendTreasurerJudgmentFields | null {
  if (!refined) return null;
  return {
    nickname: refined.nickname,
    ...(refined.confidence ? { confidence: refined.confidence } : {}),
    ...(refined.align ? { align: refined.align } : {}),
  };
}

/** Map section nickname → Context Output a|b side (no re-pick). */
export function treasurerSideFromNickname(
  nickname: string,
  nicknameA: string,
  nicknameB: string,
): "a" | "b" | null {
  if (nickname === nicknameA) return "a";
  if (nickname === nicknameB) return "b";
  return null;
}

export function treasurerClientValueFromFinalized(
  refined: import("./friendPsychFit").RefinedFriendTreasurer | null | undefined,
  nicknameA: string,
  nicknameB: string,
): FriendTreasurerClientValue | null {
  if (!refined) return null;
  const side = treasurerSideFromNickname(
    refined.nickname,
    nicknameA,
    nicknameB,
  );
  if (!side) return null;
  return {
    side,
    ...(refined.align ? { align: refined.align } : {}),
    ...(refined.confidence ? { confidence: refined.confidence } : {}),
  };
}

function cloneClient(v: FriendTreasurerClientValue): FriendTreasurerClientValue {
  return {
    side: v.side,
    ...(v.align ? { align: v.align } : {}),
    ...(v.confidence ? { confidence: v.confidence } : {}),
  };
}

export function buildFriendTreasurerClientProjection(
  value: FriendTreasurerClientValue | null | undefined,
): FriendTreasurerClientValue | null {
  if (!value) return null;
  return cloneClient(value);
}

type ReportWithProjections = {
  canonical_projections?: {
    treasurer?: unknown;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export function injectFriendTreasurerClientProjection<
  T extends ReportWithProjections,
>(report: T, projection: FriendTreasurerClientValue | null | undefined): T {
  const { canonical_projections: prior, ...rest } = report;
  const priorRest =
    prior && typeof prior === "object"
      ? Object.fromEntries(
          Object.entries(prior).filter(([k]) => k !== "treasurer"),
        )
      : {};
  if (!projection) {
    if (Object.keys(priorRest).length === 0) return rest as T;
    return { ...(rest as T), canonical_projections: priorRest };
  }
  return {
    ...(rest as T),
    canonical_projections: {
      ...priorRest,
      treasurer: cloneClient(projection),
    },
  };
}

export function readFriendTreasurerCanonicalProjection(
  report:
    | { canonical_projections?: { treasurer?: unknown } }
    | null
    | undefined,
): FriendTreasurerClientValue | null {
  const raw = report?.canonical_projections?.treasurer;
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.side !== "a" && o.side !== "b") return null;
  const align =
    o.align === "confirms" || o.align === "caution" ? o.align : undefined;
  const confidence =
    o.confidence === "high" || o.confidence === "low"
      ? o.confidence
      : undefined;
  if (o.align !== undefined && !align) return null;
  if (o.confidence !== undefined && !confidence) return null;
  return {
    side: o.side,
    ...(align ? { align } : {}),
    ...(confidence ? { confidence } : {}),
  };
}

export function formatFriendTreasurerCanonicalLabel(
  value: FriendTreasurerClientValue,
  params: { nameA: string; nameB: string; locale?: string | null },
): string {
  const en =
    params.locale === "en" ||
    params.locale === "en-US" ||
    Boolean(params.locale?.startsWith("en"));
  const who = value.side === "a" ? params.nameA : params.nameB;
  let base = en ? `${who} is treasurer` : `${who} 총무`;
  if (value.align === "confirms") {
    base = en ? `${base} · confirmed` : `${base} · 보강 일치`;
  } else if (value.align === "caution") {
    base = en ? `${base} · caution` : `${base} · 보강 주의`;
  }
  return base;
}
