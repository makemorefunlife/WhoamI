import type { Locale } from "@/lib/i18n/locale";
import type { FriendScoringSignals } from "@/lib/saju/friendAnalysis";
import type { FriendMasterScores } from "@/lib/relationship/friendEventScores";
import type {
  FriendScoreCardAudit,
  FriendScoreCardAuditItem,
} from "@/lib/relationship/friend/friendKillerSections";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import { pick, LEGACY_FALLBACK_LOCALE } from "@/lib/relationship/friend/friendCopy";

function connectionMeasures(locale: Locale): string {
  return pick(
    locale,
    "How instinctively comfortable and drawn to each other you are — calculated from an effortless natural affinity.",
    "두 사람이 만났을 때 얼마나 본능적으로 편안하게 끌리는지를 보는 점수예요. 애써 노력하지 않아도 통하는 본능적인 친화력을 기준으로 계산해요.",
  );
}

function connectionLevelMeaning(locale: Locale): string {
  return pick(
    locale,
    "70+: a click so natural it barely needs effort · 40–69: comfortable and steady, nothing dramatic · under 40: might start a little reserved, but deepens with time invested.",
    "70% 이상: 눈빛만 봐도 통하는, 애쓰지 않아도 편안한 사이 · 40~69%: 무난하고 안정적으로 편안한 사이 · 40% 미만: 처음엔 살짝 서먹할 수 있지만 시간을 들이면 깊어지는 사이.",
  );
}

function connectionWhy(
  sig: FriendScoringSignals,
  nameA: string,
  nameB: string,
  score: number,
  psychA: PsychMasterJson | null | undefined,
  psychB: PsychMasterJson | null | undefined,
  locale: Locale,
): string {
  const isKo = locale !== "en-US";
  const sentences: string[] = [];

  // Positive drivers
  if (sig.hasDayBranchCombine && sig.hasBijiepMutualResonance) {
    sentences.push(
      isKo
        ? `${nameA}·${nameB} 두 사람은 서로 끌어당기는 마음의 이끎과 기본 기질의 공명이 함께 작용해, 애쓰지 않아도 깊이 통하는 강력한 친화력을 형성합니다.`
        : `${nameA} and ${nameB} share both a natural mutual attraction and a deep temperament resonance, creating a close bond that forms effortlessly.`,
    );
  } else if (sig.hasDayBranchCombine) {
    sentences.push(
      isKo
        ? `${nameA}·${nameB} 두 사람 사이에 자연스럽게 마음이 풀리는 친화적 계기가 있어, 처음 만날 때나 관계가 가까워질 때 편안하게 통합니다.`
        : `${nameA} and ${nameB} share a natural mutual attraction, allowing you to click comfortably without forced effort.`,
    );
  } else if (sig.hasBijiepMutualResonance) {
    sentences.push(
      isKo
        ? `두 사람의 기본 기질적 주파수가 비슷하게 맞물려, 긴 설명 없이도 '서로 결이 잘 통한다'는 안정된 유대감을 형성합니다.`
        : `Your core temperaments resonate closely with each other, building a steady sense that you share the same foundational wavelength.`,
    );
  }

  // Limiting / negative driver
  if (sig.hasDayBranchChungHyung) {
    sentences.push(
      isKo
        ? `다만 시각이나 감정선이 뾰족하게 대립할 수 있는 마찰 지점이 존재해, 순간적인 팽팽함이 케미 점수를 일부 상쇄합니다.`
        : `However, there are occasional friction points where emotional perspectives clash, slightly moderating overall chemistry.`,
    );
  } else if (score >= 60 && !sig.hasDayBranchCombine) {
    sentences.push(
      isKo
        ? `첫눈에 극적으로 끌어당기는 자극은 아니지만, 억지 노력 없이도 편안함을 느끼는 무난하고 건강한 친화력을 유지합니다.`
        : `While it doesn't spark an instant dramatic bond, it maintains a comfortable, healthy closeness without forced effort.`,
    );
  }

  // Baseline if no signals fired
  if (sentences.length === 0) {
    sentences.push(
      isKo
        ? `특별히 강하게 이끌거나 부딪히는 자극이 없어 ${score}% 중간 기본값에 머무릅니다. 억지 노력 없이 차분하게 시간을 쌓아갈 때 더 편안해지는 사이입니다.`
        : `Without strong pulling or clashing signals, this score sits near the neutral baseline (${score}%). It is an easygoing dynamic that deepens smoothly over time.`,
    );
  }

  // Psych 11 response modifier
  const empathyA = psychA?.secondary_axes?.empathy;
  const empathyB = psychB?.secondary_axes?.empathy;
  if (typeof empathyA === "number" && typeof empathyB === "number") {
    if (empathyA >= 60 && empathyB >= 60) {
      sentences.push(
        isKo
          ? `여기에 두 사람 모두 높은 공감 성향을 보유하고 있어, 기질적인 친화력이 일상 대화와 서운함 케어에서도 더욱 따뜻하게 체감됩니다.`
          : `Furthermore, both of you share high empathy scores, allowing your innate connection to feel warm and supportive in everyday interactions.`,
      );
    }
  }

  return sentences.join(" ");
}

function banterMeasures(locale: Locale): string {
  return pick(
    locale,
    "How well the back-and-forth banter flows — calculated from how well your self-expression, reactions, and temperaments balance out.",
    "대화가 핑퐁처럼 잘 오가고 유머 코드가 맞아떨어지는 정도예요. 표현과 리액션의 조화, 그리고 성향의 온도차를 자연스럽게 상쇄하는지를 기준으로 계산해요.",
  );
}

function banterLevelMeaning(locale: Locale): string {
  return pick(
    locale,
    "65+: banter that rarely runs dry, the kind that can go all night · 35–64: an easy, steady back-and-forth when it matters · under 35: conversation leans calm rather than high-energy.",
    "65% 이상: 티키타카가 잘 안 마르는, 밤새 떠들어도 안 지치는 사이 · 35~64%: 필요할 때 적당히 주고받는 무난한 대화 궁합 · 35% 미만: 대화가 강렬하기보단 잔잔하게 흘러가는 편.",
  );
}

function banterWhy(
  sig: FriendScoringSignals,
  score: number,
  psychA: PsychMasterJson | null | undefined,
  psychB: PsychMasterJson | null | undefined,
  locale: Locale,
): string {
  const isKo = locale !== "en-US";
  const sentences: string[] = [];

  if (sig.hasFoodSealHarmony && sig.hasJohuComplement) {
    sentences.push(
      isKo
        ? `한 쪽의 표현과 다른 쪽의 리액션이 잘 맞아떨어지는 데다 성향 온도까지 서로를 보완해 주어, 오랫동안 이야기해도 대화 텐션이 쉽게 마르지 않습니다.`
        : `Your expression and reaction styles harmonize perfectly, while complementary chart temperatures keep your conversational energy flowing effortlessly.`,
    );
  } else if (sig.hasFoodSealHarmony) {
    sentences.push(
      isKo
        ? `한 쪽이 말을 건네면 다른 쪽이 찰떡같이 받아주는 리액션 호흡이 좋아, 대화 핑퐁이 매끄럽게 이어집니다.`
        : `One person's self-expression matches smoothly with the other's receptive reaction style, keeping the conversational back-and-forth fluid.`,
    );
  } else if (sig.hasJohuComplement) {
    sentences.push(
      isKo
        ? `두 사람의 성향 온도가 서로의 텐션을 자연스럽게 보완해 주어, 대화할 때 피로감이 적고 안정적입니다.`
        : `Your contrasting temperaments balance each other's energy, making back-and-forth conversations comfortable and low-fatigue.`,
    );
  }

  if (sig.hasFoodClashFriction) {
    sentences.push(
      isKo
        ? `다만 표현 방식이 동시에 강하게 부딪히는 경향이 있어, 유머 코드나 이야기하는 타이밍이 가끔 어긋날 수 있습니다.`
        : `However, a friction signal in self-expression means your humor timing or conversation rhythm may occasionally miss each other.`,
    );
  }

  if (sentences.length === 0) {
    sentences.push(
      isKo
        ? `대화를 특별히 자극하거나 가로막는 요소가 없는 평온한 기본 템포입니다(${score}%). 유머나 이야기 주제에 따라 대화 흐름이 유연하게 달라집니다.`
        : `Without strong amplifying or blocking signals, your conversation relies on a steady baseline (${score}%). The rhythm adjusts naturally depending on topic and context.`,
    );
  }

  // Psych 11 experience modifier
  const energyA = psychA?.secondary_axes?.energy_style;
  const energyB = psychB?.secondary_axes?.energy_style;
  if (typeof energyA === "number" && typeof energyB === "number") {
    const diff = Math.abs(energyA - energyB);
    if (diff >= 25) {
      sentences.push(
        isKo
          ? `현재 두 사람이 선호하는 반응 속도나 일상 텐션(energy_style)에 차이가 있어, 실제 체감되는 대화 리듬은 상황에 따라 조율이 필요합니다.`
          : `Because you have different baseline energy styles, your actual conversational pacing in daily life will fluctuate depending on individual energy levels.`,
      );
    }
  }

  return sentences.join(" ");
}

function riskMeasures(locale: Locale): string {
  return pick(
    locale,
    "How likely friction or conflict is between you. Unlike the other two scores, LOWER is better here — it's calculated from friction-prone relationship signals.",
    "친구 사이에 마찰·갈등이 생길 가능성을 보는 점수예요. 우정 케미·티키타카와 반대로 이 점수는 낮을수록 좋아요 — 부딪히기 쉬운 긴장 요소를 기준으로 계산해요.",
  );
}

function riskLevelMeaning(locale: Locale): string {
  return pick(
    locale,
    "under 30: rarely clashes, low-maintenance · 30–59: occasional small friction worth knowing about ahead of time · 60+: clear friction points — worth keeping this report's de-escalation card handy.",
    "30% 미만: 웬만해선 안 부딪히는 무난한 편 · 30~59%: 가끔 사소하게 부딪힐 수 있어 미리 알아두면 좋은 정도 · 60% 이상: 갈등 포인트가 뚜렷해서 이 리포트의 '절친 싸움 해독제'를 참고해두면 좋은 편.",
  );
}

function riskWhy(
  sig: FriendScoringSignals,
  score: number,
  psychA: PsychMasterJson | null | undefined,
  psychB: PsychMasterJson | null | undefined,
  locale: Locale,
): string {
  const isKo = locale !== "en-US";
  const sentences: string[] = [];

  // Risk drivers
  if (sig.hasDayBranchFullTension) {
    sentences.push(
      isKo
        ? `자존심이나 시각이 팽팽하게 직면하는 강한 긴장 지점이 존재하여, 의견이 부딪힐 때 순간적인 갈등 텐션이 커질 수 있습니다.`
        : `A strong tension point means friction can flare up quickly when personal pride or opinions clash.`,
    );
  }
  if (sig.hasWonjinOrGuimun) {
    sentences.push(
      isKo
        ? `논리적 설명보다 서운함이나 예민함이 먼저 올라오기 쉬운 지점이 있어, 감정이 꼬였을 때 직후의 쿨다운 시간이 필요합니다.`
        : `An emotional sensitivity signal is also present, where misunderstandings can trigger unspoken resentment before logical discussion happens.`,
    );
  }
  if (sig.hasWealthOfficerClash) {
    sentences.push(
      isKo
        ? `현실적인 역할 분담이나 공정함·규칙 시각 차이로 인해 충돌이 일어날 가능성이 있습니다.`
        : `A clash in practical boundary and fairness perspectives indicates potential friction around responsibilities or commitments.`,
    );
  }

  // Moderating factors if risk is moderate/low despite tension
  if (sig.hasDayBranchFullTension && !sig.hasWonjinOrGuimun && !sig.hasWealthOfficerClash) {
    sentences.push(
      isKo
        ? `다만 논리 밖으로 감정이 꼬이거나 현실적인 문제로 크게 확산되는 부작용은 없으므로, 마찰 직후 잠시 쿨다운 시간을 가진 뒤 차분하게 대화하면 쉽게 수습됩니다.`
        : `However, because secondary emotional corruption signals are absent, friction remains manageable through a brief cooldown period followed by direct communication.`,
    );
  }

  // Baseline if no risk signals fired
  if (sentences.length === 0) {
    sentences.push(
      isKo
        ? `갈등을 자극하는 마찰 요소가 나타나지 않아 최소 리스크(${score}%) 수준을 유지합니다. 서로에게 유의미한 상처를 남길 가능성이 낮은 편안한 사이입니다.`
        : `With no major clash signals present in your charts, this score sits at a low risk baseline (${score}%), representing a low-maintenance bond.`,
    );
  }

  // Psych 11 modifier
  const resA = psychA?.secondary_axes?.resilience;
  const resB = psychB?.secondary_axes?.resilience;
  if (typeof resA === "number" && typeof resB === "number") {
    if (resA >= 65 || resB >= 65) {
      sentences.push(
        isKo
          ? `또한 높은 관계 회복력(resilience) 성향이 뒷받침되어, 일상에서 부딪힘이 발생하더라도 앙금이 길게 남지 않도록 완충해 줍니다.`
          : `Additionally, strong psychological resilience helps cushion conflicts so small misunderstandings don't turn into long-term resentment.`,
      );
    }
  }

  return sentences.join(" ");
}

function buildItem(
  measures: string,
  why: string,
  levelMeaning: string,
): FriendScoreCardAuditItem {
  return { measures, why, level_meaning: levelMeaning };
}

export function buildFriendScoreCardAudit(params: {
  sig: FriendScoringSignals;
  scores: FriendMasterScores;
  nameA: string;
  nameB: string;
  psychMasterA?: PsychMasterJson | null;
  psychMasterB?: PsychMasterJson | null;
  locale?: Locale;
}): FriendScoreCardAudit {
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const { sig, scores, nameA, nameB, psychMasterA, psychMasterB } = params;

  return {
    connection: buildItem(
      connectionMeasures(locale),
      connectionWhy(sig, nameA, nameB, scores.connection, psychMasterA, psychMasterB, locale),
      connectionLevelMeaning(locale),
    ),
    banter: buildItem(
      banterMeasures(locale),
      banterWhy(sig, scores.banter, psychMasterA, psychMasterB, locale),
      banterLevelMeaning(locale),
    ),
    risk: buildItem(
      riskMeasures(locale),
      riskWhy(sig, scores.risk, psychMasterA, psychMasterB, locale),
      riskLevelMeaning(locale),
    ),
  };
}
