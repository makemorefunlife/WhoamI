import type { RelationshipEventScores, TopicTriScore } from "@/lib/relationship/pairEventScores";
import { triScoreToGrade } from "@/lib/relationship/pairEventScores";
import type { FriendPairSajuAnalysis } from "@/lib/saju/friendAnalysis";
import type { Locale } from "@/lib/i18n/locale";
import { pick, LEGACY_FALLBACK_LOCALE } from "@/lib/relationship/friend/friendCopy";

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

/** 🔥 우정 케미 · 🧩 티키타카 · ⚡ 소셜 리스크 */
export type FriendMasterScores = {
  connection: number;
  banter: number;
  risk: number;
};

/**
 * 친구(Social DNA) 정량 가중치 — FriendScoringSignals (0~100)
 */
export function computeFriendMasterScores(
  friend: FriendPairSajuAnalysis,
): FriendMasterScores {
  const sig = friend.scoringSignals;

  let connection = 50;
  if (sig.hasDayBranchCombine) connection += 30;
  if (sig.hasBijiepMutualResonance) connection += 20;
  if (sig.hasDayBranchChungHyung) connection -= 20;

  let banter = 50;
  if (sig.hasFoodSealHarmony) banter += 25;
  if (sig.hasJohuComplement) banter += 25;
  if (sig.hasFoodClashFriction) banter -= 20;

  let risk = 10;
  if (sig.hasDayBranchFullTension) risk += 35;
  if (sig.hasWonjinOrGuimun) risk += 25;
  if (sig.hasWealthOfficerClash) risk += 15;

  return {
    connection: clamp(connection),
    banter: clamp(banter),
    risk: clamp(risk),
  };
}

export function computeFriendEventScores(
  friend: FriendPairSajuAnalysis,
): RelationshipEventScores {
  const master = computeFriendMasterScores(friend);

  const intimacy: TopicTriScore = {
    activation: master.connection,
    benefit: master.connection,
    risk: clamp(100 - master.connection),
  };
  const stability: TopicTriScore = {
    activation: master.banter,
    benefit: master.banter,
    risk: clamp(master.risk * 0.5),
  };
  const conflict: TopicTriScore = {
    activation: clamp(100 - master.risk),
    benefit: clamp(100 - master.risk),
    risk: master.risk,
  };
  const overall: TopicTriScore = {
    activation: master.connection,
    benefit: master.banter,
    risk: master.risk,
  };

  return { intimacy, stability, conflict, overall };
}

export function computeFriendCompatibilityGrade(
  friend: FriendPairSajuAnalysis,
  locale: Locale = LEGACY_FALLBACK_LOCALE,
): {
  grade: "A" | "B" | "C" | "D";
  reason: string;
  eventScores: RelationshipEventScores;
  masterScores: FriendMasterScores;
} {
  const masterScores = computeFriendMasterScores(friend);
  const eventScores = computeFriendEventScores(friend);
  const grade = triScoreToGrade(eventScores.overall);

  return {
    grade,
    reason: pick(
      locale,
      `Friendship (Social DNA) grade ${grade} — Friend chemistry ${masterScores.connection}% · Banter ${masterScores.banter}% · Social risk ${masterScores.risk}%`,
      `친구(Social DNA) 등급 ${grade} — 우정 케미 ${masterScores.connection}% · 티키타카 ${masterScores.banter}% · 소셜 리스크 ${masterScores.risk}%`,
    ),
    eventScores,
    masterScores,
  };
}

export { triScoreToGrade };
