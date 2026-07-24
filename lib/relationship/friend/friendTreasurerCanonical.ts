/**
 * Phase 6-2b — Friend treasurer canonical vertical slice.
 *
 * Pipeline (report boundary):
 *   pickFriendTreasurer (base → section_play_money)
 *   → refineFriendTreasurer (composite, psychMode soft when psych present)
 *   → buildFriendTreasurerCanonical(refined)  // wrap only — no re-resolve
 *   → .value → friend.section_play_money treasurer_* fields
 *   → canonical_projections.treasurer (client typed authority)
 *   → context_output / ViewModel play_money (read-only)
 *
 * Product question: who manages money / settlement between friends.
 * Not hangout_planning (compare row — separate question).
 * Not travel_planner.
 *
 * Does not change Phase 5 thresholds, lock/flip, or copy.
 */
import type { CanonicalJudgment } from "@/lib/relationship/contextEngine/canonicalJudgment";
import type { RefinedFriendTreasurer } from "./friendPsychFit";

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
  CanonicalJudgment<RefinedFriendTreasurer>;

/**
 * Wrap an already-finalized `refineFriendTreasurer` result.
 * Does not call pick/refine, read signals/psych, or alter the judgment.
 */
export function buildFriendTreasurerCanonical(
  refined: RefinedFriendTreasurer | null | undefined,
  options?: {
    base?: FriendTreasurerBase | null;
  },
): FriendTreasurerCanonical | null {
  if (!refined) return null;

  const psychApplied =
    refined.confidence != null || refined.align != null;

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
  confidence?: RefinedFriendTreasurer["confidence"];
  align?: RefinedFriendTreasurer["align"];
};

export function treasurerJudgmentFields(
  refined: RefinedFriendTreasurer | null | undefined,
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
  refined: RefinedFriendTreasurer | null | undefined,
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
