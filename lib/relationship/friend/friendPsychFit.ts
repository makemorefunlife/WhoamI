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
