import type { Locale } from "@/lib/i18n/locale";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import { pick, LEGACY_FALLBACK_LOCALE } from "@/lib/relationship/friend/friendCopy";

/**
 * current_enriched 전용 — 05B Gap Review 잔여 항목(2/3/4/5/18)을 실제 오행
 * 생극(element_flow) + 11축 psych 신호로 채운다. 기존 섹션(Social DNA
 * guardian_character, Snapshot shine_when_best, Hidden Flow counseling,
 * Soulmate verdict)에만 문장을 얹고 새 섹션은 만들지 않는다.
 *
 * 신호가 약하면(관계가 특별히 뚜렷하지 않으면) null을 반환해 가짜 문장을
 * 강제로 채우지 않는다 — 다른 axis 기반 함수들과 동일한 원칙.
 */

type Element = "wood" | "fire" | "earth" | "metal" | "water";

const ELEMENT_GENERATES: Record<Element, Element> = {
  wood: "fire",
  fire: "earth",
  earth: "metal",
  metal: "water",
  water: "wood",
};

function generates(a: Element, b: Element): boolean {
  return ELEMENT_GENERATES[a] === b;
}

/** 항목 2 — 이 친구는 나에게 무엇을 주는가 (오행 생(生) 방향 확인 문장) */
export function buildElementGeneratesGiftLine(
  dominantOther: Element,
  dominantSelf: Element,
  nameOther: string,
  locale: Locale = LEGACY_FALLBACK_LOCALE,
): string | null {
  if (!generates(dominantOther, dominantSelf)) return null;
  return pick(
    locale,
    `On top of that, ${nameOther}'s elemental energy naturally feeds mine (${dominantOther} → ${dominantSelf}) — support that arrives without either of us having to try.`,
    `게다가 오행상으로도 ${nameOther}의 기운이 나를 생(生)해주는 방향이라, 애쓰지 않아도 자연스럽게 채워지는 느낌을 줘요.`,
  );
}

/** 항목 4 — 서로 성장시키는 부분 (의사결정방식 신중함 × 자극추구 대각 비교) */
export function buildGrowthDynamicLine(params: {
  psychA: PsychMasterJson | null | undefined;
  psychB: PsychMasterJson | null | undefined;
  nameA: string;
  nameB: string;
  fallbackLine: string;
  locale?: Locale;
}): string {
  const { psychA, psychB, nameA, nameB, fallbackLine } = params;
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  if (!psychA || !psychB) return fallbackLine;

  const decisionA = psychA.secondary_axes.decision_style;
  const decisionB = psychB.secondary_axes.decision_style;
  const stimA = psychA.secondary_axes.stimulation;
  const stimB = psychB.secondary_axes.stimulation;

  const deliberateIsA = decisionA < decisionB;
  const deliberateName = deliberateIsA ? nameA : nameB;
  const deliberateGap = Math.abs(decisionA - decisionB);

  const stimSeekerIsA = stimA > stimB;
  const stimSeekerName = stimSeekerIsA ? nameA : nameB;
  const stimGap = Math.abs(stimA - stimB);

  const isComplementary = deliberateIsA !== stimSeekerIsA && deliberateGap >= 10 && stimGap >= 10;
  if (!isComplementary) return fallbackLine;

  return pick(
    locale,
    `${deliberateName} tends to weigh a decision carefully before moving, while ${stimSeekerName} is quicker to chase something new. When ${deliberateName} hesitates, ${stimSeekerName}'s pull toward new things hands over courage; when ${stimSeekerName} is about to leap without looking, ${deliberateName}'s careful read acts as the brake. Each fills in what the other doesn't naturally have, and it makes both of you steadier over time.`,
    `${deliberateName}은(는) 결정을 내릴 때 여러 번 재보는 신중한 편이고, ${stimSeekerName}은(는) 새로운 것에 먼저 뛰어드는 자극추구형이에요. ${deliberateName}이(가) 주저할 때는 ${stimSeekerName}의 자극추구 성향 덕분에 용기를 얻고, ${stimSeekerName}이(가) 무모하게 직진하려 할 때는 ${deliberateName}의 신중함이 브레이크를 걸어줘요. 서로에게 없는 축을 채워주면서 둘 다 시간이 갈수록 유연해져요.`,
  );
}

/**
 * 항목 5 — 힘들 때 왜 이 친구를 찾는가 (상담 스타일 인물의 우세 축 근거)
 *
 * `type`은 Hidden Flow에 이미 표시된 counseling_style.type(F/T/balanced,
 * `resolveCounselingStyleForPerson`이 십성+psych로 계산한 값)을 그대로
 * 재사용한다 — 이 함수가 raw psych 축만으로 독자적으로 재판정하면 라벨은
 * "감정 힐러"인데 이유 문장은 "사이다 솔루션" 논리를 쓰는 불일치가 생길 수
 * 있어서(십성 가중 판정과 raw 축 판정이 다른 결과를 낼 수 있음), 반드시 같은
 * `type` 값을 공유해 라벨-설명 일관성을 보장한다.
 */
export function buildWhyTurnToFriendLine(
  type: "F" | "T" | "balanced",
  psychOther: PsychMasterJson | null | undefined,
  nameOther: string,
  locale: Locale = LEGACY_FALLBACK_LOCALE,
): string | null {
  if (!psychOther) return null;
  const { resilience } = psychOther.secondary_axes;

  const base =
    type === "T"
      ? pick(
          locale,
          `Part of why I turn to ${nameOther} when things are hard: they don't get swept up in the feelings, they cut straight to an objective read that snaps me back to clear-headed.`,
          `힘들 때 ${nameOther}을(를) 찾게 되는 이유 중 하나는, 감정에 휩쓸리지 않고 객관적인 팩트로 정신이 번쩍 들게 해주기 때문이에요.`,
        )
      : type === "F"
        ? pick(
            locale,
            `Part of why I turn to ${nameOther} when things are hard: there's an unconditional sense that they'll take my side no matter what, before any explanation is even needed.`,
            `힘들 때 ${nameOther}을(를) 찾게 되는 이유 중 하나는, 설명하지 않아도 무조건 내 편을 들어줄 거란 믿음이 있기 때문이에요.`,
          )
        : pick(
            locale,
            `Part of why I turn to ${nameOther} when things are hard: they read the moment and switch between comfort and a clear-eyed plan as needed, instead of always leading with one or the other.`,
            `힘들 때 ${nameOther}을(를) 찾게 되는 이유 중 하나는, 상황을 봐가며 위로가 먼저일 때와 현실적인 조언이 먼저일 때를 알아서 오가주기 때문이에요.`,
          );

  if (resilience >= 65) {
    return `${base} ${pick(
      locale,
      "They also bounce back fast themselves, so being around them makes it easier to shake things off too.",
      "회복탄력성도 빠른 편이라, 곁에 있으면 덩달아 툭툭 털고 일어나게 돼요.",
    )}`;
  }
  return base;
}

/** 오행별 "풀려나오는 모습" 구체 묘사 — 항목3 감정 묘사 보강 */
const UNLOCKED_TRAIT: Record<Element, { ko: string; en: string }> = {
  wood: {
    ko: "평소보다 장난기 많고 즉흥적인, 어린아이 같은 모습",
    en: "a playful, spontaneous, almost childlike side",
  },
  fire: {
    ko: "평소보다 텐션이 확 오르고 감정 표현을 거침없이 하는 모습",
    en: "a side that lights up fast and stops holding feelings back",
  },
  earth: {
    ko: "평소보다 편하게 기대고 응석 부리는 모습",
    en: "a side that lets itself lean in and be a little needy",
  },
  metal: {
    ko: "평소보다 필터 없이 직설적이고 솔직한 속마음",
    en: "an unfiltered, blunt kind of honesty",
  },
  water: {
    ko: "평소보다 감정을 숨기지 않고 여린 속마음까지 꺼내 보이는 모습",
    en: "a softer, more vulnerable side that stops hiding what it feels",
  },
};

/** 항목 3 — 같이 있으면 어떤 모습이 살아나는가 (오행 생(生) 방향 + 자극추구 격차) */
export function buildUnlockedSelfLine(params: {
  nameSelf: string;
  nameOther: string;
  dominantSelf: Element;
  dominantOther: Element;
  stimulationSelf?: number;
  stimulationOther?: number;
  locale?: Locale;
}): string | null {
  const { nameSelf, nameOther, dominantSelf, dominantOther, stimulationSelf, stimulationOther } = params;
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const trait = UNLOCKED_TRAIT[dominantSelf];
  const contrastClause = pick(
    locale,
    ` Around most people ${nameSelf} keeps that in check — but around ${nameOther}, it comes out with no filter.`,
    ` 다른 사람 앞에서는 참는 편인데, ${nameOther} 앞에서는 필터 없이 그 모습이 나와요.`,
  );

  let core: string | null = null;
  if (generates(dominantOther, dominantSelf)) {
    core = pick(
      locale,
      `${nameSelf}'s chart leans ${dominantSelf}, the kind of energy that tends to stay guarded — but ${nameOther} carries ${dominantOther}, and being around them thaws that out, bringing out ${trait.en}.${contrastClause}`,
      `${nameSelf}의 사주는 ${dominantSelf} 기운이 짙어서 평소엔 속내를 잘 안 드러내는 편인데, ${nameOther}은(는) ${dominantOther} 기운이 강해서 함께 있으면 얼어있던 게 스르르 풀리면서 ${trait.ko}이(가) 나와요.${contrastClause}`,
    );
  } else if (dominantSelf === dominantOther) {
    core = pick(
      locale,
      `You both run on the same elemental energy (${dominantSelf}), so being together feels less like performing and more like a comfortable extension of yourselves — ${trait.en} shows up more freely.${contrastClause}`,
      `둘 다 ${dominantSelf} 기운이라 같이 있으면 애써 맞추지 않아도 자기 자신이 편하게 확장되는 느낌이에요 — ${trait.ko}이(가) 더 자유롭게 나와요.${contrastClause}`,
    );
  }

  const stimGap =
    typeof stimulationSelf === "number" && typeof stimulationOther === "number"
      ? stimulationOther - stimulationSelf
      : null;
  const stimClause =
    stimGap != null && stimGap >= 15
      ? pick(
          locale,
          ` ${nameOther}'s stimulation-seeking score also runs well above ${nameSelf}'s, pulling ${nameSelf} into spontaneous choices they'd never make alone.`,
          ` ${nameOther}의 자극추구 점수도 ${nameSelf}보다 훨씬 높아서, 그 텐션에 이끌려 평소라면 안 할 즉흥적인 선택까지 하게 돼요.`,
        )
      : null;

  if (!core && !stimClause) return null;
  if (!core) return stimClause!.trimStart();
  return stimClause ? `${core}${stimClause}` : core;
}

/** 항목 18 — 멀리 떨어져도 유지되는가 (역마 + 인정욕구/회복탄력성) */
export function buildDistanceResilienceLine(params: {
  yeomaA: number;
  yeomaB: number;
  psychA: PsychMasterJson | null | undefined;
  psychB: PsychMasterJson | null | undefined;
  nameA: string;
  nameB: string;
  locale?: Locale;
}): string | null {
  const { yeomaA, yeomaB, psychA, psychB, nameA, nameB } = params;
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;

  const bothYeoma = yeomaA >= 1 && yeomaB >= 1;
  const neitherYeoma = yeomaA === 0 && yeomaB === 0;

  let base: string;
  if (bothYeoma) {
    base = pick(
      locale,
      `You both carry restless, on-the-move energy (yeokma), so even after long stretches apart, living your own busy lives, meeting up again feels like no time passed at all.`,
      `둘 다 역마 기운이 있어서, 각자 바쁘게 자기 삶을 사느라 오래 못 만나도 다시 만나면 어제 본 것처럼 자연스러워요.`,
    );
  } else if (neitherYeoma) {
    base = pick(
      locale,
      `Neither of you carries strong on-the-move (yeokma) energy — you're both more the type to stay rooted where you are. That means this friendship needs a little deliberate upkeep: short, regular check-ins matter more than waiting for a big reunion.`,
      `둘 다 역마 기운보다는 한 자리를 지키는 기운이 강한 편이에요. 그만큼 이 우정은 자연히 유지되기보다 짧게라도 정기적으로 연락을 주고받는 의식적인 관리가 필요해요.`,
    );
  } else {
    const yeomaName = yeomaA > yeomaB ? nameA : nameB;
    base = pick(
      locale,
      `${yeomaName} is the one with the restless, on-the-move energy here — so ${yeomaName} reaching out first after a quiet stretch keeps the distance from turning into drift.`,
      `이 우정에서는 ${yeomaName}이(가) 역마 기운을 더 많이 가지고 있어요 — 뜸했다가도 ${yeomaName}이(가) 먼저 연락을 트는 쪽이 되어주면 거리감이 서운함으로 안 번져요.`,
    );
  }

  if (!psychA || !psychB) return base;
  const recognitionAvg = (psychA.secondary_axes.recognition + psychB.secondary_axes.recognition) / 2;
  const resilienceAvg = (psychA.secondary_axes.resilience + psychB.secondary_axes.resilience) / 2;

  const extra: string[] = [];
  if (recognitionAvg < 45) {
    extra.push(
      pick(
        locale,
        "You're both low on needing reassurance, so a quiet stretch doesn't read as distance to either of you.",
        "둘 다 인정욕구가 낮은 편이라, 연락이 뜸해도 서로 불안해하지 않아요.",
      ),
    );
  }
  if (resilienceAvg >= 60) {
    extra.push(
      pick(
        locale,
        "Your resilience runs high too, so reunions skip the awkward re-warming and land right back at your usual rhythm.",
        "회복탄력성도 높은 편이라, 오랜만에 만나도 어색한 워밍업 없이 바로 예전 텐션으로 돌아와요.",
      ),
    );
  }
  return extra.length ? `${base} ${extra.join(" ")}` : base;
}

/**
 * 항목 15 — 질투·비교·소외 (구체적 트리거 장면).
 * 인정욕구가 높은 쪽(nameSelf) 기준으로, 같이 가려던 자리에 자신만 빠졌을 때
 * 느끼는 소외감을 구체적 장면으로 서술한다. resolveJealousyGuardNote(겁재+
 * 인정욕구/현실실리)와 같은 축을 쓰되, 그 문구 뒤에 붙일 구체적 장면 한 줄만
 * 추가한다 — 겹치는 일반 서술은 다시 만들지 않는다.
 */
export function buildJealousyTriggerSceneLine(
  psychSelf: PsychMasterJson | null | undefined,
  nameSelf: string,
  nameOther: string,
  locale: Locale = LEGACY_FALLBACK_LOCALE,
): string | null {
  if (!psychSelf) return null;
  if (psychSelf.secondary_axes.recognition < 55) return null;

  return pick(
    locale,
    `This especially flares up for ${nameSelf} when ${nameOther} heads off to a place you'd planned to go together with someone else first, without ${nameSelf}.`,
    `특히 같이 가려던 핫플이나 모임에 ${nameSelf}만 빼고 ${nameOther}이(가) 다른 사람과 먼저 가버렸을 때, 이 서운함이 가장 크게 터져요.`,
  );
}

/**
 * 항목 7 보강 — 연락 빈도의 일상 리듬(하루 단위 톡 빈도)을 energy_style 평균
 * 점수로 3단계 서술한다. 기존 "자주 만나자 vs 가끔 깊게" 성향 대조 문장
 * 뒤에 덧붙이는 용도.
 */
export function buildDailyContactRhythmClause(
  energyStyleAvg: number,
  locale: Locale = LEGACY_FALLBACK_LOCALE,
): string {
  if (energyStyleAvg >= 65) {
    return pick(
      locale,
      "In practice that plays out as texting back and forth almost every day.",
      "실제로는 거의 매일 톡을 주고받는 편이에요.",
    );
  }
  if (energyStyleAvg >= 35) {
    return pick(
      locale,
      "In practice that plays out as checking in every few days rather than daily.",
      "실제로는 며칠에 한 번씩 안부를 주고받는 편이에요.",
    );
  }
  return pick(
    locale,
    "In practice that plays out as catching up in one longer conversation about once a week, rather than daily chatter.",
    "실제로는 매일 대화하기보다 일주일에 한 번쯤 몰아서 연락하는 편이에요.",
  );
}
