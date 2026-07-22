import type { Locale } from "@/lib/i18n/locale";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import { profileTenGods } from "@/lib/relationship/marriage/marriageTenGodAnalysis";
import type { TenGodCounts } from "@/lib/relationship/marriage/marriageTenGodAnalysis";
import { pick, LEGACY_FALLBACK_LOCALE } from "./friendCopy";

/**
 * 마스터 사양서(01 참고/marster_Prd.txt) 친구 섹션 Part1(시그니처 한줄요약,
 * 우정 케미, 티키타카, 소셜 리스크) — 11축 결합.
 *
 * `computeFriendMasterScores`(connection/banter/risk 숫자)는 grade·eventScores에도
 * 쓰이는 넓은 영향 범위라 여기서 건드리지 않는다. 대신 11축을 반영한 확인/보정
 * 문구를 별도로 만들어 붙인다(동료 officePsychFit.ts와 동일한 non-invasive 원칙).
 * `psychMasterA/B`가 없으면(레거시 캐시·설문 미완료) 전부 null.
 */

function axisAvg(psych: PsychMasterJson, a: keyof PsychMasterJson["secondary_axes"], b?: keyof PsychMasterJson["secondary_axes"]): number {
  const s = psych.secondary_axes;
  return b ? (s[a] + s[b]) / 2 : s[a];
}

/** 시작점 시그니처 — 외향에너지 격차 기반 짧은 절 */
export function resolveFriendSignatureClause(
  psychA: PsychMasterJson | null | undefined,
  psychB: PsychMasterJson | null | undefined,
  locale: Locale = LEGACY_FALLBACK_LOCALE,
): string | null {
  if (!psychA || !psychB) return null;
  const gap = Math.abs(psychA.secondary_axes.energy_style - psychB.secondary_axes.energy_style);

  if (gap >= 30) {
    return pick(
      locale,
      "Your social batteries run differently, which is exactly what keeps this duo entertaining.",
      "노는 에너지 충전 방식이 서로 달라서, 그게 오히려 이 콤비를 재밌게 만들어요.",
    );
  }
  return pick(
    locale,
    "You even recharge the same way — the same frequency, on and off the clock.",
    "충전 방식까지 비슷해서, 놀 때나 쉴 때나 주파수가 잘 맞아요.",
  );
}

export type FriendVibeAxisNotes = {
  connection_note: string | null;
  banter_note: string | null;
  risk_note: string | null;
};

/** Part1 3개 스코어(케미/티키타카/리스크) — 11축 확인/보정 문구 */
export function resolveFriendVibeAxisNotes(
  psychA: PsychMasterJson | null | undefined,
  psychB: PsychMasterJson | null | undefined,
  locale: Locale = LEGACY_FALLBACK_LOCALE,
): FriendVibeAxisNotes | null {
  if (!psychA || !psychB) return null;

  const empathyAvg = axisAvg(psychA, "empathy") + axisAvg(psychB, "empathy");
  const empathyMean = empathyAvg / 2;
  const connection_note =
    empathyMean >= 60
      ? pick(locale, "Your relational-empathy scores line up too — the chemistry runs deeper than saju alone suggests.", "관계공감 축까지 비슷해서, 사주로 보이는 것보다 케미가 더 깊을 수 있어요.")
      : empathyMean <= 40
        ? pick(locale, "Empathy styles differ a bit, so the chemistry may take more deliberate effort to feel.", "관계공감 축은 약간 달라서, 케미를 느끼려면 조금 더 의식적인 노력이 필요할 수 있어요.")
        : null;

  const stimAvg = (psychA.secondary_axes.stimulation + psychB.secondary_axes.stimulation) / 2;
  const banter_note =
    stimAvg >= 60
      ? pick(locale, "Both of you crave novelty, so the banter rarely runs dry.", "둘 다 자극추구가 높아서, 티키타카가 잘 안 마르는 편이에요.")
      : stimAvg <= 40
        ? pick(locale, "Neither of you chases novelty hard, so the banter is calmer than intense.", "둘 다 자극추구가 낮은 편이라, 티키타카는 강렬하기보다 잔잔한 쪽이에요.")
        : null;

  const conflictGap = Math.abs(psychA.secondary_axes.conflict_style - psychB.secondary_axes.conflict_style);
  const risk_note =
    conflictGap >= 30
      ? pick(locale, "Your conflict styles pull in different directions, which can amplify friction beyond what the saju signals alone show.", "갈등을 대하는 방식이 서로 달라서, 사주 신호보다 마찰이 더 크게 느껴질 수 있어요.")
      : null;

  return { connection_note, banter_note, risk_note };
}

export type FriendGuardianCharacterKey = "brain" | "business" | "bamboo";

export type FriendGuardianCharacter = {
  key: FriendGuardianCharacterKey;
  label: string;
  description: string;
};

const GUARDIAN_LABEL: Record<Locale, Record<FriendGuardianCharacterKey, { label: string; description: string }>> = {
  "en-US": {
    brain: {
      label: "The Smart Brain",
      description: "Cuts through messy problems with sharp, structured thinking — the friend you call when you need a real answer, not just sympathy.",
    },
    business: {
      label: "The Hustler & Wealth Energizer",
      description: "Practical, resourceful, and always has a plan to make things happen — the friend who turns ideas into results.",
    },
    bamboo: {
      label: "The Soul's Bamboo Forest",
      description: "Holds space for whatever you need to vent, no judgment — the friend you can say anything to and it stays safe.",
    },
  },
  "ko-KR": {
    brain: {
      label: "똑똑한 브레인",
      description: "복잡한 문제를 단칼에 정리해주는 스마트한 전략 멘토 — 위로보다 진짜 답이 필요할 때 찾게 되는 친구.",
    },
    business: {
      label: "사업가 & 재물 에너자이저",
      description: "현실적이고 추진력 있게 일을 되게 만드는 스타일 — 아이디어를 실제 결과로 바꿔주는 친구.",
    },
    bamboo: {
      label: "영혼의 대나무숲",
      description: "어떤 얘기를 해도 판단하지 않고 들어주는 안전지대 — 뭐든 털어놔도 되는 친구.",
    },
  },
};

/** Part2① Social DNA — 십성(귀인 성향) + 11축(사고/실리/공감) 기반 3종 귀인캐릭터 */
export function resolveGuardianCharacterForPerson(
  counts: TenGodCounts,
  psych: PsychMasterJson | null | undefined,
  locale: Locale = LEGACY_FALLBACK_LOCALE,
): FriendGuardianCharacter | null {
  if (!psych) return null;
  const p = profileTenGods(counts);
  const { thinking_style, practicality, empathy } = psych.secondary_axes;

  const brainScore = (p.officer + p.seal) * 10 + thinking_style;
  const businessScore = (p.wealth + p.food) * 10 + practicality;
  const bambooScore = (p.seal + p.food) * 10 + empathy;

  let key: FriendGuardianCharacterKey = "brain";
  let best = brainScore;
  if (businessScore > best) {
    key = "business";
    best = businessScore;
  }
  if (bambooScore > best) {
    key = "bamboo";
    best = bambooScore;
  }

  return { key, ...GUARDIAN_LABEL[locale][key] };
}

/** Part2② 대화 핑퐁·메신저 템포 — 자극추구+외향에너지 기반 확인 문구 */
export function resolveCommunicationRhythmNote(
  psychA: PsychMasterJson | null | undefined,
  psychB: PsychMasterJson | null | undefined,
  locale: Locale = LEGACY_FALLBACK_LOCALE,
): string | null {
  if (!psychA || !psychB) return null;
  const avg =
    (axisAvg(psychA, "stimulation", "energy_style") + axisAvg(psychB, "stimulation", "energy_style")) / 2;

  if (avg >= 60) {
    return pick(
      locale,
      "Both of you tend to text fast and often — expect quick back-and-forth, not long silences.",
      "둘 다 빠르고 자주 답하는 편이라, 메시지가 오래 안 묵히고 핑퐁이 빠르게 오갈 확률이 높아요.",
    );
  }
  if (avg <= 40) {
    return pick(
      locale,
      "Neither of you rushes to reply, so slower message tempo is normal here — not a sign of distance.",
      "둘 다 답장을 서두르지 않는 편이라, 느린 템포가 오히려 이 관계에선 자연스러운 거예요.",
    );
  }
  return null;
}

export type FriendTravelStyleSplit = {
  planner: { nickname: string; description: string };
  flexible: { nickname: string; description: string };
  role_prescription: string;
};

/** Part3① 여행 & 액티비티 동선 마찰 — 계획구조화(structure) 격차 기반 역할 분리 */
export function resolveTravelStyleSplit(
  psychA: PsychMasterJson | null | undefined,
  psychB: PsychMasterJson | null | undefined,
  nicknameA: string,
  nicknameB: string,
  locale: Locale = LEGACY_FALLBACK_LOCALE,
): FriendTravelStyleSplit | null {
  if (!psychA || !psychB) return null;
  const structA = psychA.secondary_axes.structure;
  const structB = psychB.secondary_axes.structure;
  const gap = Math.abs(structA - structB);
  if (gap < 15) return null;

  const aIsPlanner = structA > structB;
  const plannerNickname = aIsPlanner ? nicknameA : nicknameB;
  const flexibleNickname = aIsPlanner ? nicknameB : nicknameA;

  return {
    planner: {
      nickname: plannerNickname,
      description: pick(
        locale,
        "The spreadsheet planner — needs a minute-by-minute itinerary of hot spots to feel at ease.",
        "분 단위 핫플 동선과 타임테이블을 완벽히 짜야 마음이 편한 엑셀 계획파.",
      ),
    },
    flexible: {
      nickname: flexibleNickname,
      description: pick(
        locale,
        "The go-with-the-flow healer — sleeps in, wanders, and ducks into any cute café that catches their eye.",
        "발길 닿는 대로 늦잠 자고 예쁜 카페 보이면 들어가는 유연한 힐링파.",
      ),
    },
    role_prescription: pick(
      locale,
      `Let ${plannerNickname} own the itinerary and logistics, and hand ${flexibleNickname} the final call on restaurants and cafe vibes — that split keeps the trip smooth for both of you.`,
      `일정·동선 세팅은 ${plannerNickname}에게 맡기고, 맛집·카페 분위기 선택권은 ${flexibleNickname}에게 주면 여행이 훨씬 편해져요.`,
    ),
  };
}

export type FriendCounselingStyle = {
  type: "F" | "T" | "balanced";
  label: string;
  description: string;
};

/** Part3③ 비밀 공유 & 고민 상담의 깊이(F형 vs T형) — 인성/관계공감 vs 관성/분석사고 */
export function resolveCounselingStyleForPerson(
  counts: TenGodCounts,
  psych: PsychMasterJson | null | undefined,
  locale: Locale = LEGACY_FALLBACK_LOCALE,
): FriendCounselingStyle | null {
  if (!psych) return null;
  const p = profileTenGods(counts);
  const { empathy, thinking_style } = psych.secondary_axes;
  const fScore = p.seal * 10 + empathy;
  const tScore = p.officer * 10 + thinking_style;

  if (fScore > tScore) {
    return {
      type: "F",
      label: pick(locale, "Emotional healer", "감정 힐러"),
      description: pick(
        locale,
        `"That must've been so hard — I'm on your side no matter what." Sits with the feeling first.`,
        `"속상했겠다, 무조건 네 편이야." 감정을 같이 우려내주는 타입.`,
      ),
    };
  }
  if (tScore > fScore) {
    return {
      type: "T",
      label: pick(locale, "Cool-headed problem solver", "사이다 솔루션"),
      description: pick(
        locale,
        `"So what's the actual plan here?" Cuts straight to a clear-eyed solution.`,
        `"그래서 해결책이 뭔데?" 하고 냉철하게 대안을 제시하는 타입.`,
      ),
    };
  }
  return {
    type: "balanced",
    label: pick(locale, "Switch-hitter", "상황 따라 유연"),
    description: pick(
      locale,
      "Reads the moment and switches between comforting first and problem-solving first as needed.",
      "상황 봐가며 위로가 먼저일 때와 해결책이 먼저일 때를 유연하게 오가는 타입.",
    ),
  };
}

/** Part3② 더치페이·총무 — 재성 기반 지정 결과에 대한 11축(현실실리+계획구조화) 확인/유보 문구 */
export function resolveTreasurerConfirmNote(
  psych: PsychMasterJson | null | undefined,
  locale: Locale = LEGACY_FALLBACK_LOCALE,
): string | null {
  if (!psych) return null;
  const avg = axisAvg(psych, "practicality", "structure");
  if (avg >= 60) {
    return pick(
      locale,
      "The 11-axis scores back this up too — high reality-sense and planning-structure make them a natural fit for the job.",
      "현실실리·계획구조화 축도 이 판정을 뒷받침해요 — 이 역할이 잘 맞는 타입이에요.",
    );
  }
  if (avg <= 40) {
    return pick(
      locale,
      "That said, the 11-axis scores suggest the treasurer role might feel like a bit of a burden — a splitting app can take some pressure off.",
      "다만 11축만 보면 총무 자리가 살짝 부담스러울 수 있어요 — 정산 앱 등으로 부담을 덜어주면 좋아요.",
    );
  }
  return null;
}

/** Part4① 제3자(연애·다른 친구) 질투 방지 — 겁재(비겁) + 11축(인정욕구/현실실리) */
export function resolveJealousyGuardNote(
  counts: TenGodCounts,
  psych: PsychMasterJson | null | undefined,
  nickname: string,
  locale: Locale = LEGACY_FALLBACK_LOCALE,
): string | null {
  if (!psych) return null;
  const gyeopjaeCount = counts["겁재"] ?? 0;
  if (gyeopjaeCount < 2) return null;
  const avg = axisAvg(psych, "recognition", "practicality");
  if (avg < 55) return null;

  return pick(
    locale,
    `${nickname} may quietly feel left out when you're dating someone new or hanging out with other friends — giving each other room to have an independent life is what keeps this friendship going long-term.`,
    `${nickname}은(는) 상대에게 애인이 생기거나 다른 친구와 놀 때 미묘한 서운함을 느낄 수 있어요 — 서로의 독립적 삶을 응원해 주는 유연한 거리가 이 우정을 오래 지켜줘요.`,
  );
}

/** Part5① 관계 회복 스위치(화해 트리거) — 11축(관계공감/인정욕구 vs 현실실리) */
export function resolveReconciliationScript(
  psych: PsychMasterJson | null | undefined,
  nickname: string,
  locale: Locale = LEGACY_FALLBACK_LOCALE,
): string | null {
  if (!psych) return null;
  const { practicality } = psych.secondary_axes;
  const recognitionAvg = axisAvg(psych, "empathy", "recognition");

  if (recognitionAvg > practicality) {
    return pick(
      locale,
      `Recognize ${nickname}'s worth and pride first — a line like "honestly, you're the best friend I've got" is what opens the door.`,
      `${nickname}의 존재 가치와 자존심부터 인정해 주세요 — "역시 내 친구 중엔 네가 최고야" 같은 한마디가 문을 엽니다.`,
    );
  }
  return pick(
    locale,
    `A hundred words won't do it for ${nickname} — a reservation link to their favorite restaurant, a gift card, or a late-night snack unlocks it fast, no big speech needed.`,
    `${nickname}에게는 백 마디 말보다 좋아하는 맛집 예약 링크, 기프티콘, 야식 선물이 훨씬 빨리 통해요 — 거창한 사과 없이 쿨하게 푸는 타입.`,
  );
}
