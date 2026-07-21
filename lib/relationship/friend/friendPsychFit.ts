import type { Locale } from "@/lib/i18n/locale";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
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
