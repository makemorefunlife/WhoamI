import type { TenGodCounts } from "@/lib/relationship/marriage/marriageTenGodAnalysis";
import { profileTenGods } from "@/lib/relationship/marriage/marriageTenGodAnalysis";

export type FriendDeEscalationCard = {
  hashtag: string;
  color: "red" | "yellow" | "orange" | "blue" | "green";
  archetype_label: string;
  cheat_script: string;
};

type PrescriptionDef = {
  hashtag: string;
  color: FriendDeEscalationCard["color"];
  archetype_label: string;
  category: "self" | "food" | "seal" | "officer" | "wealth";
  cheat_script: (nickname: string) => string;
};

const FRIEND_DE_ESCALATION: PrescriptionDef[] = [
  {
    hashtag: "#우쭈쭈_네가제일멋져",
    color: "red",
    archetype_label: "자존심·동료 인정형",
    category: "self",
    cheat_script: (n) =>
      `${n}에게 자존심 다 지켜주면서 "역시 내 친구 중에 네가 최고야"라고 인정하면 풀립니다.`,
  },
  {
    hashtag: "#술한잔에_드라이브",
    color: "yellow",
    archetype_label: "즉흥·분위기 전환형",
    category: "food",
    cheat_script: (n) =>
      `${n}에게 심각하게 굴지 말고 "야 미안하다! 술 한잔 사줄게 나와!" 하고 대화 주제를 확 바꾸는 게 약입니다.`,
  },
  {
    hashtag: "#일단은_냅둬라",
    color: "orange",
    archetype_label: "침묵·회복 시간형",
    category: "seal",
    cheat_script: (n) =>
      `${n}에게 왜 화났냐고 카톡 테러 금지. 혼자 생각 정리될 때까지 딱 3일만 시간을 주면 먼저 연락 옵니다.`,
  },
  {
    hashtag: "#팩트인정하고_대안제시",
    color: "blue",
    archetype_label: "규칙·팩트 중시형",
    category: "officer",
    cheat_script: (n) =>
      `${n}에게 감정 핑계 대지 말고 "내가 상습 지각한 거 명백한 내 잘못이다. 다음번엔 커피 쏘겠다"라고 논리적으로 사과해야 끝납니다.`,
  },
  {
    hashtag: "#실속형_기프티콘",
    color: "green",
    archetype_label: "실속·보상형",
    category: "wealth",
    cheat_script: (n) =>
      `${n}에게 긴 장문의 카톡 사과문 백 번보다, 장바구니 위시리스트 기프티콘이나 갖고 싶다던 선물을 쓱 전송하는 순간 즉시 잠금 해제됩니다.`,
  },
];

const ARCHETYPE_TO_CATEGORY: Record<string, PrescriptionDef["category"]> = {
  wood: "self",
  fire: "food",
  earth: "seal",
  metal: "officer",
  water: "wealth",
};

function categoryScores(counts: TenGodCounts): Record<PrescriptionDef["category"], number> {
  return {
    self: (counts["비견"] ?? 0) * 2 + (counts["겁재"] ?? 0),
    food: (counts["상관"] ?? 0) * 2 + (counts["식신"] ?? 0),
    seal: (counts["정인"] ?? 0) * 2 + (counts["편인"] ?? 0),
    officer: (counts["정관"] ?? 0) * 2 + (counts["편관"] ?? 0),
    wealth: (counts["정재"] ?? 0) + (counts["편재"] ?? 0) * 2,
  };
}

export function buildFriendDeEscalationCard(params: {
  upsetNickname: string;
  counts: TenGodCounts;
  dominantElement: string;
}): FriendDeEscalationCard {
  const scores = categoryScores(params.counts);
  const preferred = ARCHETYPE_TO_CATEGORY[params.dominantElement] ?? "seal";
  const ranked = (
    Object.entries(scores) as [PrescriptionDef["category"], number][]
  ).sort((a, b) => b[1] - a[1]);
  const category =
    (scores[preferred] ?? 0) >= (ranked[0]?.[1] ?? 0) - 1
      ? preferred
      : ranked[0]?.[0] ?? preferred;

  const def =
    FRIEND_DE_ESCALATION.find((p) => p.category === category) ??
    FRIEND_DE_ESCALATION[2]!;

  return {
    hashtag: def.hashtag,
    color: def.color,
    archetype_label: def.archetype_label,
    cheat_script: def.cheat_script(params.upsetNickname),
  };
}

export function pickFriendTreasurer(params: {
  nicknameA: string;
  nicknameB: string;
  countsA: TenGodCounts;
  countsB: TenGodCounts;
}): { nickname: string; reason: string } {
  const scoreA =
    (params.countsA["정재"] ?? 0) * 3 +
    (params.countsA["정관"] ?? 0) * 2 +
    (params.countsA["편재"] ?? 0);
  const scoreB =
    (params.countsB["정재"] ?? 0) * 3 +
    (params.countsB["정관"] ?? 0) * 2 +
    (params.countsB["편재"] ?? 0);

  if (scoreA >= scoreB) {
    return {
      nickname: params.nicknameA,
      reason: `돈·규칙 감각이 더 반듯한 ${params.nicknameA}이(가) 이 우정의 절대적 총무입니다. 돈 계산을 이 사람에게 일임해야 1원짜리 하나 때문에 우정에 금이 가는 대참사를 막을 수 있습니다.`,
    };
  }
  return {
    nickname: params.nicknameB,
    reason: `돈·규칙 감각이 더 반듯한 ${params.nicknameB}이(가) 이 우정의 절대적 총무입니다. 돈 계산을 이 사람에게 일임해야 1원짜리 하나 때문에 우정에 금이 가는 대참사를 막을 수 있습니다.`,
  };
}

export function buildBreakupTriggerWarning(params: {
  nickname: string;
  counts: TenGodCounts;
}): string {
  const p = profileTenGods(params.counts);
  if (p.self >= 3) {
    return `**[자존심 스크래치 절대 금지]** ${params.nickname} — 은근히 장난으로라도 서열 잡으려 하거나 지인들 앞에서 꼽주면 바로 손절당합니다.`;
  }
  if (p.wealth >= 2 && (params.counts["정재"] ?? 0) >= 1) {
    return `**[돈 계산 흐리멍텅함 절대 금지]** ${params.nickname} — 아무리 친해도 빌린 돈 까먹거나 더치페이 밀리면 조용히 멀어지는 스타일입니다.`;
  }
  if (p.officer >= 2) {
    return `**[시간 약속 및 매너 선 넘기 금지]** ${params.nickname} — 예의 없는 행동이나 상습 지각을 인간성 미달로 판단합니다.`;
  }
  return `**[무시·방치 금지]** ${params.nickname} — 연락 두절이나 약속 흐지부지를 "별일 아님"으로 넘기면 영구 손절 각입니다.`;
}
