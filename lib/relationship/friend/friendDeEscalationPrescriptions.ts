import type { TenGodCounts } from "@/lib/relationship/marriage/marriageTenGodAnalysis";
import { profileTenGods } from "@/lib/relationship/marriage/marriageTenGodAnalysis";
import type { Locale } from "@/lib/i18n/locale";
import { pick, LEGACY_FALLBACK_LOCALE } from "./friendCopy";

export type FriendDeEscalationCard = {
  hashtag: string;
  color: "red" | "yellow" | "orange" | "blue" | "green";
  archetype_label: string;
  cheat_script: string;
};

type PrescriptionDef = {
  hashtag: (locale: Locale) => string;
  color: FriendDeEscalationCard["color"];
  archetype_label: (locale: Locale) => string;
  category: "self" | "food" | "seal" | "officer" | "wealth";
  cheat_script: (nickname: string, locale: Locale) => string;
};

const FRIEND_DE_ESCALATION: PrescriptionDef[] = [
  {
    hashtag: (locale) => pick(locale, "#YoureTheBest", "#우쭈쭈_네가제일멋져"),
    color: "red",
    archetype_label: (locale) => pick(locale, "Pride & Peer-Recognition Type", "자존심·동료 인정형"),
    category: "self",
    cheat_script: (n, locale) =>
      pick(
        locale,
        `Protect ${n}'s pride completely and tell them "you're honestly the best friend I've got" — that's what melts the ice.`,
        `${n}에게 자존심 다 지켜주면서 "역시 내 친구 중에 네가 최고야"라고 인정하면 풀립니다.`,
      ),
  },
  {
    hashtag: (locale) => pick(locale, "#DriveAndADrink", "#술한잔에_드라이브"),
    color: "yellow",
    archetype_label: (locale) => pick(locale, "Spontaneous Mood-Switch Type", "즉흥·분위기 전환형"),
    category: "food",
    cheat_script: (n, locale) =>
      pick(
        locale,
        `Don't get heavy with ${n} — say "hey, my bad! Let me buy you a drink, come out!" and switch the subject fast. That's the cure.`,
        `${n}에게 심각하게 굴지 말고 "야 미안하다! 술 한잔 사줄게 나와!" 하고 대화 주제를 확 바꾸는 게 약입니다.`,
      ),
  },
  {
    hashtag: (locale) => pick(locale, "#JustGiveThemSpace", "#일단은_냅둬라"),
    color: "orange",
    archetype_label: (locale) => pick(locale, "Silence & Recovery-Time Type", "침묵·회복 시간형"),
    category: "seal",
    cheat_script: (n, locale) =>
      pick(
        locale,
        `Don't blow up ${n}'s phone asking why they're mad. Give them exactly three days to sort their thoughts out alone, and they'll reach out first.`,
        `${n}에게 왜 화났냐고 카톡 테러 금지. 혼자 생각 정리될 때까지 딱 3일만 시간을 주면 먼저 연락 옵니다.`,
      ),
  },
  {
    hashtag: (locale) => pick(locale, "#OwnItAndFixIt", "#팩트인정하고_대안제시"),
    color: "blue",
    archetype_label: (locale) => pick(locale, "Rules & Facts Type", "규칙·팩트 중시형"),
    category: "officer",
    cheat_script: (n, locale) =>
      pick(
        locale,
        `Skip the emotional excuses with ${n} — say something like "showing up late all the time is on me, no excuses. Coffee's on me next time" and apologize logically. That's what closes it out.`,
        `${n}에게 감정 핑계 대지 말고 "내가 상습 지각한 거 명백한 내 잘못이다. 다음번엔 커피 쏘겠다"라고 논리적으로 사과해야 끝납니다.`,
      ),
  },
  {
    hashtag: (locale) => pick(locale, "#PracticalGiftCard", "#실속형_기프티콘"),
    color: "green",
    archetype_label: (locale) => pick(locale, "Practical Reward Type", "실속·보상형"),
    category: "wealth",
    cheat_script: (n, locale) =>
      pick(
        locale,
        `A hundred paragraphs of apology texts won't do it for ${n} — send the gift card from their wishlist or the thing they said they wanted, and it unlocks instantly.`,
        `${n}에게 긴 장문의 카톡 사과문 백 번보다, 장바구니 위시리스트 기프티콘이나 갖고 싶다던 선물을 쓱 전송하는 순간 즉시 잠금 해제됩니다.`,
      ),
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
  locale?: Locale;
}): FriendDeEscalationCard {
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
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
    hashtag: def.hashtag(locale),
    color: def.color,
    archetype_label: def.archetype_label(locale),
    cheat_script: def.cheat_script(params.upsetNickname, locale),
  };
}

export function pickFriendTreasurer(params: {
  nicknameA: string;
  nicknameB: string;
  countsA: TenGodCounts;
  countsB: TenGodCounts;
  locale?: Locale;
}): { nickname: string; reason: string } {
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
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
      reason: pick(
        locale,
        `${params.nicknameA} has the sharper sense for money and rules, making them this friendship's official treasurer. Put them in charge of the math — it's the only way to keep a single cent from ever cracking this friendship.`,
        `돈·규칙 감각이 더 반듯한 ${params.nicknameA}이(가) 이 우정의 절대적 총무입니다. 돈 계산을 이 사람에게 일임해야 1원짜리 하나 때문에 우정에 금이 가는 대참사를 막을 수 있습니다.`,
      ),
    };
  }
  return {
    nickname: params.nicknameB,
    reason: pick(
      locale,
      `${params.nicknameB} has the sharper sense for money and rules, making them this friendship's official treasurer. Put them in charge of the math — it's the only way to keep a single cent from ever cracking this friendship.`,
      `돈·규칙 감각이 더 반듯한 ${params.nicknameB}이(가) 이 우정의 절대적 총무입니다. 돈 계산을 이 사람에게 일임해야 1원짜리 하나 때문에 우정에 금이 가는 대참사를 막을 수 있습니다.`,
    ),
  };
}

export function buildBreakupTriggerWarning(params: {
  nickname: string;
  counts: TenGodCounts;
  locale?: Locale;
}): string {
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const p = profileTenGods(params.counts);
  if (p.self >= 3) {
    return pick(
      locale,
      `**[Never scratch their pride]** ${params.nickname} — even a joking attempt to pull rank, or putting them down in front of others, gets you cut off instantly.`,
      `**[자존심 스크래치 절대 금지]** ${params.nickname} — 은근히 장난으로라도 서열 잡으려 하거나 지인들 앞에서 꼽주면 바로 손절당합니다.`,
    );
  }
  if (p.wealth >= 2 && (params.counts["정재"] ?? 0) >= 1) {
    return pick(
      locale,
      `**[Never get sloppy with money]** ${params.nickname} — no matter how close you are, forgetting to pay them back or dodging your share of the bill makes them quietly drift away.`,
      `**[돈 계산 흐리멍텅함 절대 금지]** ${params.nickname} — 아무리 친해도 빌린 돈 까먹거나 더치페이 밀리면 조용히 멀어지는 스타일입니다.`,
    );
  }
  if (p.officer >= 2) {
    return pick(
      locale,
      `**[Don't cross the line on punctuality and manners]** ${params.nickname} reads rude behavior or chronic lateness as a character flaw.`,
      `**[시간 약속 및 매너 선 넘기 금지]** ${params.nickname} — 예의 없는 행동이나 상습 지각을 인간성 미달로 판단합니다.`,
    );
  }
  return pick(
    locale,
    `**[Don't ignore or neglect them]** ${params.nickname} — brushing off going silent or flaking on plans as "no big deal" is a permanent-cutoff offense.`,
    `**[무시·방치 금지]** ${params.nickname} — 연락 두절이나 약속 흐지부지를 "별일 아님"으로 넘기면 영구 손절 각입니다.`,
  );
}
