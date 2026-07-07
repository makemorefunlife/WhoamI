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
};

function buildPersonDna(
  nickname: string,
  dna: FriendDnaProfile,
): SocialDnaPersonSection {
  return {
    nickname,
    social_title: sanitizeFriendText(dna.socialTitle),
    friend_position: sanitizeFriendText(dna.friendPosition),
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
): string {
  if (master.connection >= 70 && master.risk < 40) {
    return `${nameA} & ${nameB} — 영혼을 나눈 환상의 덤앤더머`;
  }
  if (sig.hasDayBranchChungHyung || sig.hasFoodClashFriction) {
    return `${nameA} & ${nameB} — 멀리서 보면 희극, 가까이서 보면 대환장 투덜이 콤비`;
  }
  if (master.banter >= 65) {
    return `${nameA} & ${nameB} — 밈과 드립이 연결된 틱톡 우정`;
  }
  return `${nameA} & ${nameB} — 각자 다른 주파수, 그래서 오래 가는 우정`;
}

function buildSoulmateVerdict(
  friend: FriendPairSajuAnalysis,
  nameA: string,
  nameB: string,
): string {
  const sig = friend.scoringSignals;
  if (
    sig.hasDayStemMutualSupport &&
    sig.hasFoodSealHarmony &&
    !sig.hasDayBranchChungHyung
  ) {
    return sanitizeFriendText(
      `${nameA} & ${nameB} — 서로 눈빛만 봐도 상대 뇌 구조를 스캔하는 100% 영혼의 단짝.`,
    );
  }
  if (sig.hasFoodClashFriction || sig.hasDayBranchChungHyung) {
    return sanitizeFriendText(
      `${nameA} & ${nameB} — 말투나 유머 타임라인이 0.5초씩 비껴가는 묘한 평행선 관계. 서로 다름을 인정하면 오히려 오래 간다.`,
    );
  }
  if (sig.hasDayBranchCombine) {
    return sanitizeFriendText(
      `${nameA} & ${nameB} — 본능적으로 쿵 맞는 우정 케미. 만나면 시간 가는 줄 모른다.`,
    );
  }
  return sanitizeFriendText(
    `${nameA} & ${nameB} — 완벽한 단짝은 아니지만, 솔직해질수록 깊어지는 우정.`,
  );
}

function buildOptimalHangout(
  dnaA: FriendDnaProfile,
  dnaB: FriendDnaProfile,
): string {
  if (dnaA.batteryMode === "outdoor" && dnaB.batteryMode === "outdoor") {
    return "둘 다 밖순이 — 핫플 웨이팅 조지고 페스티벌·팝업스토어 투어가 정답.";
  }
  if (dnaA.batteryMode === "homebody" && dnaB.batteryMode === "homebody") {
    return "둘 다 집순이 — 홈파티·배달 음식·넷플릭스 마라톤 아지트 개척이 정답.";
  }
  const aOutdoor = dnaA.batteryMode === "outdoor";
  if (aOutdoor) {
    return "한 명은 밖순이, 한 명은 집순이 — 낮엔 가볍게 밖에서, 밤엔 편한 아지트로 마무리하는 하이브리드 동선.";
  }
  return "한 명은 집순이, 한 명은 밖순이 — 집순이 친구 집을 아지트로 정하고, 밖순이 친구가 동선 리드.";
}

export function buildFriendKillerSections(params: {
  nicknameA: string;
  nicknameB: string;
  friendPairAnalysis: FriendPairSajuAnalysis;
  masterScores: FriendMasterScores;
  countsA: TenGodCounts;
  countsB: TenGodCounts;
}): FriendKillerSections {
  const { nicknameA, nicknameB, friendPairAnalysis, masterScores, countsA, countsB } =
    params;
  const sig = friendPairAnalysis.scoringSignals;
  const dnaA = friendPairAnalysis.dnaA;
  const dnaB = friendPairAnalysis.dnaB;

  const treasurer = pickFriendTreasurer({
    nicknameA,
    nicknameB,
    countsA,
    countsB,
  });

  const upsetSide = sig.hasDayBranchChungHyung || sig.hasWonjinOrGuimun ? "B" : "A";
  const upsetNickname = upsetSide === "A" ? nicknameA : nicknameB;
  const upsetCounts = upsetSide === "A" ? countsA : countsB;
  const upsetDna = upsetSide === "A" ? dnaA : dnaB;

  return {
    section_social_dna_a: buildPersonDna(nicknameA, dnaA),
    section_social_dna_b: buildPersonDna(nicknameB, dnaB),
    section_snapshot: {
      connection_pct: masterScores.connection,
      banter_pct: masterScores.banter,
      risk_pct: masterScores.risk,
      one_line_friendship: sanitizeFriendText(
        resolveFriendshipOneLiner(masterScores, sig, nicknameA, nicknameB),
      ),
    },
    section_soulmate: {
      soulmate_verdict: buildSoulmateVerdict(
        friendPairAnalysis,
        nicknameA,
        nicknameB,
      ),
    },
    section_play_money: {
      treasurer_nickname: treasurer.nickname,
      treasurer_reason: sanitizeFriendText(treasurer.reason),
      optimal_hangout: sanitizeFriendText(buildOptimalHangout(dnaA, dnaB)),
    },
    section_breakup_guide: {
      trigger_warning_a: sanitizeFriendText(
        buildBreakupTriggerWarning({ nickname: nicknameA, counts: countsA }),
      ),
      trigger_warning_b: sanitizeFriendText(
        buildBreakupTriggerWarning({ nickname: nicknameB, counts: countsB }),
      ),
    },
    section_de_escalation: buildFriendDeEscalationCard({
      upsetNickname,
      counts: upsetCounts,
      dominantElement: upsetDna.dominantElement,
    }),
  };
}
