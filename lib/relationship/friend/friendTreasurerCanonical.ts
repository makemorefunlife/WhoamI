/**
 * Phase 6-2b — Friend treasurer canonical vertical slice.
 *
 * Pipeline (report boundary):
 *   pickFriendTreasurer (base → section_play_money)
 *   → refineFriendTreasurer (composite, psychMode soft when psych present)
 *   → buildFriendTreasurerCanonical(refined)  // wrap only — no re-resolve
 *   → .value → friend.section_play_money treasurer_* fields
 *   → context_output / ViewModel play_money (read-only)
 *
 * Product question: who manages money / settlement between friends.
 * Not hangout_planning (compare row — separate question).
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

/** Soft refine when composite attached confidence/align; otherwise none (legacy base). */
export const FRIEND_TREASURER_PSYCH_MODE_WITH_PSYCH = "soft" as const;
export const FRIEND_TREASURER_PSYCH_MODE_LEGACY = "none" as const;

export type FriendTreasurerBase = {
  nickname: string;
  reason: string;
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
