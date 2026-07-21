import type { FriendMasterScores } from "@/lib/relationship/friendEventScores";
import type { FriendDnaProfile, FriendPairSajuAnalysis } from "@/lib/saju/friendAnalysis";
import type { TenGodCounts } from "@/lib/relationship/marriage/marriageTenGodAnalysis";
import { sanitizeFriendText } from "./friendLanguage";
import {
  buildBreakupTriggerWarning,
  buildFriendDeEscalationCard,
  pickFriendTreasurer,
  type FriendDeEscalationCard,
} from "./friendDeEscalationPrescriptions";
import type { Locale } from "@/lib/i18n/locale";
import { pick, LEGACY_FALLBACK_LOCALE } from "./friendCopy";
import type { IsolationBand } from "@/lib/personCore/sajuSignals/types";

/**
 * PersonCore SSOT 비겁고립(bijie_isolation) 보강 문장 — 계산은 되지만 리포트
 * 어디에도 안 쓰이던 신호(`FriendshipSajuSignals.bijie_isolation.isolation_band`)를
 * 우정 포지션(friend_position)에 반영한다. balanced는 특별히 튀는 신호가 아니라서
 * 보강 문장을 붙이지 않는다(work의 신살 보너스와 동일한 "신호가 뚜렷할 때만" 원칙).
 */
const ISOLATION_BONUS: Record<Locale, Record<"bonded" | "lone_wolf", string>> = {
  "en-US": {
    bonded: "On top of that, they naturally blend into a group — they tend to gather people around them.",
    lone_wolf: "On top of that, they're just as comfortable on their own — they don't need a crowd to feel okay.",
  },
  "ko-KR": {
    bonded: "게다가 무리에 자연스럽게 섞이는 편이라, 사람을 잘 모으는 타입이에요.",
    lone_wolf: "게다가 혼자여도 편안한 타입이라, 꼭 무리 지어 있지 않아도 괜찮아해요.",
  },
};

export type SocialDnaPersonSection = {
  nickname: string;
  social_title: string;
  friend_position: string;
  tikitaka_label: string;
  tikitaka_description: string;
  battery_description: string;
  private_self: string;
};

export type FriendshipSnapshotSection = {
  connection_pct: number;
  banter_pct: number;
  risk_pct: number;
  one_line_friendship: string;
};

export type SoulmateFrequencySection = {
  soulmate_verdict: string;
};

export type PlayMoneySection = {
  treasurer_nickname: string;
  treasurer_reason: string;
  optimal_hangout: string;
};

export type BreakupGuideSection = {
  trigger_warning_a: string;
  trigger_warning_b: string;
};

export type FriendKillerSections = {
  section_social_dna_a: SocialDnaPersonSection;
  section_social_dna_b: SocialDnaPersonSection;
  section_snapshot: FriendshipSnapshotSection;
  section_soulmate: SoulmateFrequencySection;
  section_play_money: PlayMoneySection;
  section_breakup_guide: BreakupGuideSection;
  section_de_escalation: FriendDeEscalationCard;
  /**
   * 심리 11축 기반 "한눈에 비교" 표 — psych_match가 있어야 계산 가능해서
   * buildFriendReport.ts에서 이 객체 생성 후 별도로 채워 넣는다(optional,
   * 레거시 캐시/설문 미완료 페어와의 하위호환).
   */
  section_compare_table?: import("./friendSajuCompareTable").FriendCompareRow[];
};

function buildPersonDna(
  nickname: string,
  dna: FriendDnaProfile,
  isolationBand: IsolationBand | undefined,
  locale: Locale,
): SocialDnaPersonSection {
  const bonus =
    isolationBand && isolationBand !== "balanced"
      ? ISOLATION_BONUS[locale][isolationBand]
      : null;
  return {
    nickname,
    social_title: sanitizeFriendText(dna.socialTitle),
    friend_position: sanitizeFriendText(
      bonus ? `${dna.friendPosition} ${bonus}` : dna.friendPosition,
    ),
    tikitaka_label: sanitizeFriendText(dna.tikitakaLabel),
    tikitaka_description: sanitizeFriendText(dna.tikitakaDescription),
    battery_description: sanitizeFriendText(dna.batteryDescription),
    private_self: sanitizeFriendText(dna.privateSelf),
  };
}

function resolveFriendshipOneLiner(
  master: FriendMasterScores,
  sig: FriendPairSajuAnalysis["scoringSignals"],
  nameA: string,
  nameB: string,
  locale: Locale,
): string {
  if (master.connection >= 70 && master.risk < 40) {
    return pick(
      locale,
      `${nameA} & ${nameB} — soulmates who share a brain, the ultimate Dumb and Dumber duo`,
      `${nameA} & ${nameB} — 영혼을 나눈 환상의 덤앤더머`,
    );
  }
  if (sig.hasDayBranchChungHyung || sig.hasFoodClashFriction) {
    return pick(
      locale,
      `${nameA} & ${nameB} — a comedy from a distance, a total chaos-grumbling duo up close`,
      `${nameA} & ${nameB} — 멀리서 보면 희극, 가까이서 보면 대환장 투덜이 콤비`,
    );
  }
  if (master.banter >= 65) {
    return pick(
      locale,
      `${nameA} & ${nameB} — a TikTok-core friendship built on memes and jokes`,
      `${nameA} & ${nameB} — 밈과 드립이 연결된 틱톡 우정`,
    );
  }
  return pick(
    locale,
    `${nameA} & ${nameB} — different frequencies, which is exactly why this friendship lasts`,
    `${nameA} & ${nameB} — 각자 다른 주파수, 그래서 오래 가는 우정`,
  );
}

function buildSoulmateVerdict(
  friend: FriendPairSajuAnalysis,
  nameA: string,
  nameB: string,
  locale: Locale,
): string {
  const sig = friend.scoringSignals;
  if (
    sig.hasDayStemMutualSupport &&
    sig.hasFoodSealHarmony &&
    !sig.hasDayBranchChungHyung
  ) {
    return sanitizeFriendText(
      pick(
        locale,
        `${nameA} & ${nameB} — a 100% soul-tethered best-friend pair who can scan each other's brain with just a look.`,
        `${nameA} & ${nameB} — 서로 눈빛만 봐도 상대 뇌 구조를 스캔하는 100% 영혼의 단짝.`,
      ),
    );
  }
  if (sig.hasFoodClashFriction || sig.hasDayBranchChungHyung) {
    return sanitizeFriendText(
      pick(
        locale,
        `${nameA} & ${nameB} — an oddly parallel pair whose tone and sense of humor land half a beat off from each other. Accepting the difference is exactly what makes this last.`,
        `${nameA} & ${nameB} — 말투나 유머 타임라인이 0.5초씩 비껴가는 묘한 평행선 관계. 서로 다름을 인정하면 오히려 오래 간다.`,
      ),
    );
  }
  if (sig.hasDayBranchCombine) {
    return sanitizeFriendText(
      pick(
        locale,
        `${nameA} & ${nameB} — an instinctively perfect friendship chemistry. Time flies whenever you two hang out.`,
        `${nameA} & ${nameB} — 본능적으로 쿵 맞는 우정 케미. 만나면 시간 가는 줄 모른다.`,
      ),
    );
  }
  return sanitizeFriendText(
    pick(
      locale,
      `${nameA} & ${nameB} — not the perfect best-friend pair, but a friendship that deepens the more honest you get.`,
      `${nameA} & ${nameB} — 완벽한 단짝은 아니지만, 솔직해질수록 깊어지는 우정.`,
    ),
  );
}

function buildOptimalHangout(
  dnaA: FriendDnaProfile,
  dnaB: FriendDnaProfile,
  locale: Locale,
): string {
  if (dnaA.batteryMode === "outdoor" && dnaB.batteryMode === "outdoor") {
    return pick(
      locale,
      "Both certified out-and-about types — braving the wait at a hot new spot or touring festivals and pop-up stores is the move.",
      "둘 다 밖순이 — 핫플 웨이팅 조지고 페스티벌·팝업스토어 투어가 정답.",
    );
  }
  if (dnaA.batteryMode === "homebody" && dnaB.batteryMode === "homebody") {
    return pick(
      locale,
      "Both certified homebodies — a home base built on house parties, delivery food, and Netflix marathons is the move.",
      "둘 다 집순이 — 홈파티·배달 음식·넷플릭스 마라톤 아지트 개척이 정답.",
    );
  }
  const aOutdoor = dnaA.batteryMode === "outdoor";
  if (aOutdoor) {
    return pick(
      locale,
      "One's the outdoor type, one's the homebody — a hybrid plan that starts light outside during the day and ends back at a cozy home base at night.",
      "한 명은 밖순이, 한 명은 집순이 — 낮엔 가볍게 밖에서, 밤엔 편한 아지트로 마무리하는 하이브리드 동선.",
    );
  }
  return pick(
    locale,
    "One's the homebody, one's the outdoor type — make the homebody's place the home base, and let the outdoor friend lead the route.",
    "한 명은 집순이, 한 명은 밖순이 — 집순이 친구 집을 아지트로 정하고, 밖순이 친구가 동선 리드.",
  );
}

export function buildFriendKillerSections(params: {
  nicknameA: string;
  nicknameB: string;
  friendPairAnalysis: FriendPairSajuAnalysis;
  masterScores: FriendMasterScores;
  countsA: TenGodCounts;
  countsB: TenGodCounts;
  isolationBandA?: IsolationBand;
  isolationBandB?: IsolationBand;
  locale?: Locale;
}): FriendKillerSections {
  const {
    nicknameA,
    nicknameB,
    friendPairAnalysis,
    masterScores,
    countsA,
    countsB,
  } = params;
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const sig = friendPairAnalysis.scoringSignals;
  const dnaA = friendPairAnalysis.dnaA;
  const dnaB = friendPairAnalysis.dnaB;

  const treasurer = pickFriendTreasurer({
    nicknameA,
    nicknameB,
    countsA,
    countsB,
    locale,
  });

  const upsetSide = sig.hasDayBranchChungHyung || sig.hasWonjinOrGuimun ? "B" : "A";
  const upsetNickname = upsetSide === "A" ? nicknameA : nicknameB;
  const upsetCounts = upsetSide === "A" ? countsA : countsB;
  const upsetDna = upsetSide === "A" ? dnaA : dnaB;

  return {
    section_social_dna_a: buildPersonDna(nicknameA, dnaA, params.isolationBandA, locale),
    section_social_dna_b: buildPersonDna(nicknameB, dnaB, params.isolationBandB, locale),
    section_snapshot: {
      connection_pct: masterScores.connection,
      banter_pct: masterScores.banter,
      risk_pct: masterScores.risk,
      one_line_friendship: sanitizeFriendText(
        resolveFriendshipOneLiner(masterScores, sig, nicknameA, nicknameB, locale),
      ),
    },
    section_soulmate: {
      soulmate_verdict: buildSoulmateVerdict(
        friendPairAnalysis,
        nicknameA,
        nicknameB,
        locale,
      ),
    },
    section_play_money: {
      treasurer_nickname: treasurer.nickname,
      treasurer_reason: sanitizeFriendText(treasurer.reason),
      optimal_hangout: sanitizeFriendText(buildOptimalHangout(dnaA, dnaB, locale)),
    },
    section_breakup_guide: {
      trigger_warning_a: sanitizeFriendText(
        buildBreakupTriggerWarning({ nickname: nicknameA, counts: countsA, locale }),
      ),
      trigger_warning_b: sanitizeFriendText(
        buildBreakupTriggerWarning({ nickname: nicknameB, counts: countsB, locale }),
      ),
    },
    section_de_escalation: buildFriendDeEscalationCard({
      upsetNickname,
      counts: upsetCounts,
      dominantElement: upsetDna.dominantElement,
      locale,
    }),
  };
}
