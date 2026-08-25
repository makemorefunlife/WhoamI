import type { Locale } from "@/lib/i18n/locale";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { MarriageRuleContext } from "./buildMarriageRuleContext";
import { resolveSpousePalaceProfile } from "@/lib/relationship/romantic/prototypeV4/spousePalaceMatcher";
import { calculateTenGod, getHiddenStemsData, calculateTwelveStage } from "@/lib/saju/repository";
import { hasGuimunOnDayHourPalaces } from "@/lib/saju/workPairRiskSignals";

export type LoveTransmissionMatch =
  | "DIRECT_MATCH"
  | "PARTIAL_MATCH"
  | "MISSED_SIGNAL"
  | "ADAPTIVE_EXPRESSION";

export type LoveExpressionChannel =
  | "verbal_affirmation"
  | "emotional_attunement"
  | "practical_care"
  | "protective_support"
  | "shared_presence"
  | "physical_affection"
  | "respect_for_autonomy"
  | "activation_encouragement"
  | "consistency_reliability";

export type LoveTransmissionChannel = {
  senderName: string;
  receiverName: string;
  senderNaturalExpression: string;
  senderCurrentExpression?: string;
  receiverReceptionNeed: string;
  matchType: LoveTransmissionMatch;
  matchNarrative: string;
  transmissionInsight: string;
};

export type IntimacyRhythmClass =
  | "MATCHED_RHYTHM"
  | "A_FAST_B_SLOW"
  | "B_FAST_A_SLOW"
  | "CONTEXT_DEPENDENT";

export type StabilityNoveltyClass =
  | "STABILITY_MATCH"
  | "NOVELTY_MATCH"
  | "NOVELTY_GAP_A"
  | "NOVELTY_GAP_B"
  | "BALANCED";

export type LeadResponseClass =
  | "A_INITIATES_B_RESPONDS"
  | "B_INITIATES_A_RESPONDS"
  | "MUTUAL_INITIATION"
  | "MUTUAL_WAITING"
  | "CONTEXT_SWITCHING";

export type SajuIntimacyPair = {
  attractionInsight: {
    title: string;
    description: string;
    dynamics: string;
  };
  rhythmFit: {
    title: string;
    classification: IntimacyRhythmClass;
    description: string;
  };
  stabilityVsNovelty: {
    title: string;
    classification: StabilityNoveltyClass;
    description: string;
  };
  leadAndResponse: {
    title: string;
    classification: LeadResponseClass;
    description: string;
  };
  comfortVsActivation: {
    title: string;
    description: string;
  };
};

export type ActivationMode =
  | "DESIRE_FIRST"
  | "RESPONSIVE"
  | "EMOTIONAL_FIRST"
  | "CONTEXT_SENSITIVE"
  | "FLEXIBLE";

export type IntimacyPersonMode = {
  personName: string;
  modeTitle: string;
  description: string;
  psychDiscrepancyNote?: string;
};

export type BedroomTemperature = {
  personAMode: IntimacyPersonMode;
  personBMode: IntimacyPersonMode;
  temperatureRhythmNarrative: string;
};

export type PersonRejectionProfile = {
  personName: string;
  interpretation: string;
  expressionStyle: string;
  reconnectionNeed: string;
};

export type DesireMismatchAndRejection = {
  personARejection: PersonRejectionProfile;
  personBRejection: PersonRejectionProfile;
  isSharedPattern: boolean;
  sharedPatternSummary?: string;
  mismatchAdvice: string;
};

export type EmotionalIntimacyCondition = {
  personName: string;
  openingCondition: string;
  description: string;
};

export type IntimacyActivationConditions = {
  sharedConditions: string[];
  personAConditions: string[];
  personBConditions: string[];
  pairActivationInsight: string;
};

export type InitiationBalance = {
  initiatorName: string;
  responderName: string;
  asymmetryReason: string;
  longTermRisk: string;
  calibrationGuide: string;
};

export type MarriageChapter04Intelligence = {
  introQuestion: string;
  loveTransmission: LoveTransmissionChannel[];
  sajuIntimacyPair: SajuIntimacyPair;
  bedroomTemperature: BedroomTemperature;
  desireMismatchAndRejection: DesireMismatchAndRejection;

  // Conditional Sections:
  emotionalIntimacy?: EmotionalIntimacyCondition[];
  activationConditions?: IntimacyActivationConditions;
  initiationBalance?: InitiationBalance;

  intimacyParadox?: {
    title: string;
    description: string;
  };
};

const STEM_ELEMENT_MAP: Record<string, string> = {
  gap: "wood", eul: "wood", byeong: "fire", jeong: "fire", mu: "earth", gi: "earth", gyeong: "metal", sin: "metal", im: "water", gye: "water",
};

const BRANCH_ELEMENT_MAP: Record<string, string> = {
  in: "wood", myo: "wood", sa: "fire", o: "fire", oh: "fire", jin: "earth", chuk: "earth", chook: "earth", mi: "earth", sul: "earth", sin: "metal", yu: "metal", hae: "water", ja: "water",
};

const NAKED_FIRE_BRANCHES = new Set(["ja", "o", "myo", "yu"]);

function chartToIndividualSajuAdapter(chart: any): any {
  if (!chart) {
    return {
      day_master: { stem: { code: "gap", element: "wood" }, day_branch: { code: "ja", element: "water" } },
      five_elements: { dominant: "wood", weakest: "metal" },
      pillars: [
        { slot: "day", stem: { code: "gap", element: "wood" }, branch: { code: "ja", element: "water" }, branch_ten_god: { code: "jeongin" } },
      ],
    };
  }
  const dayStemCode = chart.dayStemCode ?? "gap";
  const dayBranchCode = chart.dayBranchCode ?? "ja";
  const hidden = getHiddenStemsData(dayBranchCode);
  const mainStem = hidden?.find(h => h.layer_type === "정기" || h.layer_type === "본기")?.stem_code ?? hidden?.[hidden.length - 1]?.stem_code ?? "gap";
  const tenGodCode = calculateTenGod(dayStemCode, mainStem);

  return {
    day_master: {
      stem: { code: dayStemCode, element: STEM_ELEMENT_MAP[dayStemCode] ?? "wood" },
      day_branch: { code: dayBranchCode, element: BRANCH_ELEMENT_MAP[dayBranchCode] ?? "water" },
    },
    five_elements: {
      dominant: STEM_ELEMENT_MAP[dayStemCode] ?? "wood",
      weakest: "metal",
    },
    pillars: [
      {
        slot: "year",
        stem: { code: chart.yearStemCode ?? "gap", element: STEM_ELEMENT_MAP[chart.yearStemCode] ?? "wood" },
        branch: { code: chart.yearBranchCode ?? "ja", element: BRANCH_ELEMENT_MAP[chart.yearBranchCode] ?? "water" },
        branch_ten_god: { code: "bigyeon" },
      },
      {
        slot: "month",
        stem: { code: chart.monthStemCode ?? "gap", element: STEM_ELEMENT_MAP[chart.monthStemCode] ?? "wood" },
        branch: { code: chart.monthBranchCode ?? "ja", element: BRANCH_ELEMENT_MAP[chart.monthBranchCode] ?? "water" },
        branch_ten_god: { code: "bigyeon" },
      },
      {
        slot: "day",
        stem: { code: dayStemCode, element: STEM_ELEMENT_MAP[dayStemCode] ?? "wood" },
        branch: { code: dayBranchCode, element: BRANCH_ELEMENT_MAP[dayBranchCode] ?? "water" },
        branch_ten_god: { code: tenGodCode },
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// HELPER: Evaluate Love Expression & Reception Channels
// ---------------------------------------------------------------------------

function evaluateLoveChannels(ctx: MarriageRuleContext, person: "a" | "b", psych?: PsychMasterJson) {
  const tenGodCounts = person === "a" ? ctx.tenGod.countsA : ctx.tenGod.countsB;
  const chartRaw = person === "a" ? ctx.marriagePairAnalysis?.chartA : ctx.marriagePairAnalysis?.chartB;
  const chartIndiv = chartToIndividualSajuAdapter(chartRaw);
  const spousePalace = resolveSpousePalaceProfile(
    chartIndiv,
    person,
    person === "a" ? ctx.nicknameA : ctx.nicknameB,
    ctx.locale,
  );

  const expressions: Record<LoveExpressionChannel, number> = {
    verbal_affirmation: 0.5,
    emotional_attunement: 0.5,
    practical_care: 0.5,
    protective_support: 0.5,
    shared_presence: 0.5,
    physical_affection: 0.5,
    respect_for_autonomy: 0.5,
    activation_encouragement: 0.5,
    consistency_reliability: 0.5,
  };

  const receptionNeeds: Record<LoveExpressionChannel, number> = { ...expressions };

  // Ten Gods Saju influence on Natural Love Expression
  const sikSang = (tenGodCounts.siksin || 0) + (tenGodCounts.sanggwan || 0);
  const inSeong = (tenGodCounts.pyeonin || 0) + (tenGodCounts.jeongin || 0);
  const jaeSeong = (tenGodCounts.pyeonjae || 0) + (tenGodCounts.jeongjae || 0);
  const gwanSeong = (tenGodCounts.pyeongwan || 0) + (tenGodCounts.jeonggwan || 0);
  const biGyeon = (tenGodCounts.bigyeon || 0) + (tenGodCounts.geobjae || 0);

  if (sikSang >= 2) {
    expressions.verbal_affirmation += 0.3;
    expressions.physical_affection += 0.3;
    expressions.activation_encouragement += 0.2;
  }
  if (inSeong >= 2) {
    expressions.emotional_attunement += 0.3;
    expressions.shared_presence += 0.3;
  }
  if (jaeSeong >= 2) {
    expressions.practical_care += 0.3;
    expressions.consistency_reliability += 0.2;
  }
  if (gwanSeong >= 2) {
    expressions.protective_support += 0.3;
    expressions.consistency_reliability += 0.3;
  }
  if (biGyeon >= 2) {
    expressions.respect_for_autonomy += 0.3;
    expressions.shared_presence += 0.2;
  }

  // Spouse Palace influence on Reception Needs
  const spCode = spousePalace.tenGodCode;
  if (spCode === "pyeongwan" || spCode === "jeonggwan") {
    receptionNeeds.consistency_reliability += 0.3;
    receptionNeeds.protective_support += 0.3;
  } else if (spCode === "pyeonjae" || spCode === "jeongjae") {
    receptionNeeds.practical_care += 0.3;
    receptionNeeds.consistency_reliability += 0.2;
  } else if (spCode === "pyeonin" || spCode === "jeongin") {
    receptionNeeds.emotional_attunement += 0.3;
    receptionNeeds.shared_presence += 0.3;
  } else if (spCode === "siksin" || spCode === "sanggwan") {
    receptionNeeds.verbal_affirmation += 0.3;
    receptionNeeds.physical_affection += 0.3;
  } else if (spCode === "bigyeon" || spCode === "geobjae") {
    receptionNeeds.respect_for_autonomy += 0.3;
    receptionNeeds.shared_presence += 0.2;
  }

  // Psych 11-Axis modifications
  if (psych) {
    const traits = psych.ocean_traits ?? psych.traits ?? psych.secondary_axes ?? {};
    if ((traits.empathy ?? 50) > 65) {
      expressions.emotional_attunement += 0.2;
      receptionNeeds.emotional_attunement += 0.2;
    }
    if ((traits.energy_style ?? 50) > 65) {
      expressions.verbal_affirmation += 0.2;
      expressions.physical_affection += 0.2;
    }
    if ((traits.practicality ?? 50) > 65) {
      expressions.practical_care += 0.2;
      receptionNeeds.practical_care += 0.2;
    }
    if ((traits.independence ?? 50) > 65) {
      expressions.respect_for_autonomy += 0.2;
      receptionNeeds.respect_for_autonomy += 0.2;
    }
  }

  return { expressions, receptionNeeds };
}

function getChannelLabel(ch: LoveExpressionChannel, isEn: boolean = false): string {
  switch (ch) {
    case "verbal_affirmation":
      return isEn ? "Affectionate verbal praise & warmth" : "다정한 마음 표현과 확신의 말";
    case "emotional_attunement":
      return isEn ? "Deep emotional attunement & listening" : "마음을 먼저 들여다봐 주는 정서적 공감";
    case "practical_care":
      return isEn ? "Practical assistance & everyday care" : "일상을 챙겨주는 실질적인 구체적 조력";
    case "protective_support":
      return isEn ? "Reliable protection & steady backing" : "든든한 우산이 되어주는 책임감과 보호";
    case "shared_presence":
      return isEn ? "Quiet shared presence & togetherness" : "한 공간에서 조용히 나누는 온기";
    case "physical_affection":
      return isEn ? "Warm physical touch & closeness" : "자연스러운 신체적 층위의 다정함";
    case "respect_for_autonomy":
      return isEn ? "Respect for personal pace & autonomy" : "상대의 템포와 영역을 지켜주는 존중";
    case "activation_encouragement":
      return isEn ? "Inspiring encouragement & motivation" : "성장과 의지를 북돋워 주는 격려";
    case "consistency_reliability":
      return isEn ? "Unwavering consistency & commitment" : "흔들림 없이 일관된 행동의 신뢰";
  }
}

// ---------------------------------------------------------------------------
// HELPER: Legacy Saju Signal Evaluators (12-stage, naked fire, guimun)
// ---------------------------------------------------------------------------

function evaluateSajuPaceAndNoveltySignals(ctx: MarriageRuleContext, person: "a" | "b") {
  const chartRaw = person === "a" ? ctx.marriagePairAnalysis?.chartA : ctx.marriagePairAnalysis?.chartB;
  if (!chartRaw) return { stage: "normal", hasNakedFire: false, hasGuimun: false };

  const dayStem = chartRaw.dayStemCode ?? "gap";
  const dayBranch = chartRaw.dayBranchCode ?? "ja";

  const stage = calculateTwelveStage(dayStem, dayBranch);

  const hasNakedFire = [chartRaw.dayBranchCode, chartRaw.hourBranchCode].some((br: string) => NAKED_FIRE_BRANCHES.has(br));
  const hasGuimun = hasGuimunOnDayHourPalaces(chartRaw);

  return { stage, hasNakedFire, hasGuimun };
}

// ---------------------------------------------------------------------------
// MAIN BUILDER: Marriage Chapter 04 Intelligence Engine
// ---------------------------------------------------------------------------

export function buildMarriageChapter04Intelligence(params: {
  ctx: MarriageRuleContext;
  psychA?: PsychMasterJson;
  psychB?: PsychMasterJson;
  locale?: Locale;
}): MarriageChapter04Intelligence {
  const { ctx, psychA, psychB, locale = "ko-KR" } = params;
  const isEn = locale === "en-US";
  const nameA = ctx.nicknameA;
  const nameB = ctx.nicknameB;

  const chA = evaluateLoveChannels(ctx, "a", psychA);
  const chB = evaluateLoveChannels(ctx, "b", psychB);

  const sigA = evaluateSajuPaceAndNoveltySignals(ctx, "a");
  const sigB = evaluateSajuPaceAndNoveltySignals(ctx, "b");

  const channels: LoveExpressionChannel[] = [
    "verbal_affirmation",
    "emotional_attunement",
    "practical_care",
    "protective_support",
    "shared_presence",
    "physical_affection",
    "respect_for_autonomy",
    "consistency_reliability",
  ];

  // Rank Top Expressions and Receptions
  const sortedExpA = [...channels].sort((x, y) => chA.expressions[y] - chA.expressions[x]);
  const sortedRecB = [...channels].sort((x, y) => chB.receptionNeeds[y] - chB.receptionNeeds[x]);

  const sortedExpB = [...channels].sort((x, y) => chB.expressions[y] - chB.expressions[x]);
  const sortedRecA = [...channels].sort((x, y) => chA.receptionNeeds[y] - chA.receptionNeeds[x]);

  const topExpA = sortedExpA[0];
  const topRecB = sortedRecB[0];

  const topExpB = sortedExpB[0];
  const topRecA = sortedRecA[0];

  // Love Transmission A -> B Classifier
  let matchAtoB: LoveTransmissionMatch = "PARTIAL_MATCH";
  if (topExpA === topRecB) {
    matchAtoB = "DIRECT_MATCH";
  } else if (chA.expressions[topRecB] >= 0.7 && chA.expressions[topExpA] < 0.7) {
    matchAtoB = "ADAPTIVE_EXPRESSION";
  } else if (chB.receptionNeeds[topExpA] < 0.4) {
    matchAtoB = "MISSED_SIGNAL";
  }

  // Love Transmission B -> A Classifier
  let matchBtoA: LoveTransmissionMatch = "PARTIAL_MATCH";
  if (topExpB === topRecA) {
    matchBtoA = "DIRECT_MATCH";
  } else if (chB.expressions[topRecA] >= 0.7 && chB.expressions[topExpB] < 0.7) {
    matchBtoA = "ADAPTIVE_EXPRESSION";
  } else if (chA.receptionNeeds[topExpB] < 0.4) {
    matchBtoA = "MISSED_SIGNAL";
  }

  // Section 1: Love Transmission
  const loveTransmission: LoveTransmissionChannel[] = [
    {
      senderName: nameA,
      receiverName: nameB,
      senderNaturalExpression: getChannelLabel(topExpA, isEn),
      receiverReceptionNeed: getChannelLabel(topRecB, isEn),
      matchType: matchAtoB,
      matchNarrative:
        matchAtoB === "DIRECT_MATCH"
          ? `${nameA}님이 애정을 전하는 방식과 ${nameB}님이 사랑이라고 느끼는 수신 채널이 정확히 맞물려, 마음이 그대로 전달됩니다.`
          : matchAtoB === "ADAPTIVE_EXPRESSION"
          ? `${nameA}님이 원래 본인에게 가장 편한 방식 대신, ${nameB}님이 알아듣기 쉬운 언어로 맞춰 전하려 애쓰는 다정함이 발달해 있습니다.`
          : matchAtoB === "MISSED_SIGNAL"
          ? `${nameA}님은 진심으로 사랑을 전하고 있지만, ${nameB}님이 기대하는 안도감의 포인트와 달라 마음이 불통될 수 있습니다.`
          : `${nameA}님의 표현 방식 중 일부는 잘 닿고 있으나, ${nameB}님이 가장 필요로 하는 수신 채널을 한번 더 들여다보는 것이 좋습니다.`,
      transmissionInsight: isEn
        ? `${nameA} expresses via ${topExpA}, while ${nameB} registers ${topRecB}.`
        : `${nameA}님은 '${getChannelLabel(topExpA)}'으로 마음을 표현하기 쉽고, ${nameB}님은 '${getChannelLabel(topRecB)}'을 통해 애정을 온전히 받아들이는 타입입니다.`,
    },
    {
      senderName: nameB,
      receiverName: nameA,
      senderNaturalExpression: getChannelLabel(topExpB, isEn),
      receiverReceptionNeed: getChannelLabel(topRecA, isEn),
      matchType: matchBtoA,
      matchNarrative:
        matchBtoA === "DIRECT_MATCH"
          ? `${nameB}님의 다정한 신호가 ${nameA}님의 마음에 온전히 안착하여 깊은 감정적 안식처가 되어줍니다.`
          : matchBtoA === "ADAPTIVE_EXPRESSION"
          ? `${nameB}님이 ${nameA}님의 마음을 배려하여 세심한 노력을 기울여 사랑을 표현하고 있는 흐름입니다.`
          : matchBtoA === "MISSED_SIGNAL"
          ? `${nameB}님의 은은한 챙김을 ${nameA}님이 당연하게 여기거나 다른 서운함으로 오해하지 않도록 채널을 맞출 필요가 있습니다.`
          : `${nameB}님이 보내는 사랑의 언어와 ${nameA}님이 기대하는 수신 언어 사이에 은은한 온수 차이가 존재할 수 있습니다.`,
      transmissionInsight: isEn
        ? `${nameB} expresses via ${topExpB}, while ${nameA} registers ${topRecA}.`
        : `${nameB}님은 '${getChannelLabel(topExpB)}'으로 애정을 나타내는 편이며, ${nameA}님은 '${getChannelLabel(topRecA)}'에서 가장 깊은 사랑을 느낍니다.`,
    },
  ];

  // Evaluate Novelty vs Stability from Saju (nakedFire/guimun) + Psych
  const isNoveltyA = sigA.hasNakedFire || sigA.hasGuimun || (psychA?.secondary_axes?.stimulation ?? 50) > 60;
  const isNoveltyB = sigB.hasNakedFire || sigB.hasGuimun || (psychB?.secondary_axes?.stimulation ?? 50) > 60;

  let stabilityNoveltyClass: StabilityNoveltyClass = "STABILITY_MATCH";
  if (isNoveltyA && isNoveltyB) stabilityNoveltyClass = "NOVELTY_MATCH";
  else if (isNoveltyA && !isNoveltyB) stabilityNoveltyClass = "NOVELTY_GAP_A";
  else if (!isNoveltyA && isNoveltyB) stabilityNoveltyClass = "NOVELTY_GAP_B";

  // Section 2: Saju Intimacy Pair
  const sajuIntimacyPair: SajuIntimacyPair = {
    attractionInsight: {
      title: isEn ? "Mutual Attraction & Relational Pull" : "서로를 당기는 정서적·신체적 은은한 인력",
      description: isEn
        ? "Pair Saju day branch and Five Element compatibility create a natural interlock."
        : "두 사람의 명식은 서로의 부족한 기운을 오행과 일지 결합으로 보완해주어, 둘만 있을 때 편안하면서도 은근히 서로를 당기는 인력이 형성됩니다.",
      dynamics: isEn
        ? "Comfort and activation balance out smoothly when togetherness is preserved."
        : "안정적인 편안함과 설렘의 스파크가 과하지 않게 조화를 이루어, 오랫동안 함께해도 질리지 않는 무드를 만듭니다.",
    },
    rhythmFit: {
      title: isEn ? "Intimacy Pace & Warming Speed" : "가까워지는 리듬과 무드 형성 템포",
      classification: "MATCHED_RHYTHM",
      description: (sigA.stage === "jewang" || sigA.stage === "geollok")
        ? `${nameA}님의 타고난 에너지가 단단하게 받쳐주어 친밀한 무드로 들어갈 때 차분하고 꾸준한 템포를 지켜줍니다.`
        : isEn
        ? "Both partners share a compatible tempo in entering close emotional/physical presence."
        : "둘이 친밀한 분위기로 들어가는 속도가 비교적 자연스럽게 맞아떨어집니다. 한 사람이 조급해하거나 다른 사람이 겉돌지 않는 안정적인 템포입니다.",
    },
    stabilityVsNovelty: {
      title: isEn ? "Stability vs. Novelty Balance" : "익숙한 편안함 vs 새로운 분위기의 자극",
      classification: stabilityNoveltyClass,
      description: stabilityNoveltyClass === "NOVELTY_MATCH"
        ? "두 사람 모두 정체된 루틴보다 가끔은 장소나 분위기에 일상의 작은 변주를 줄 때 관계의 온도가 깨어납니다."
        : stabilityNoveltyClass === "NOVELTY_GAP_A"
        ? `${nameA}님은 가끔 색다른 분위기와 자극에서 설렘을 얻는 반면, ${nameB}님은 아늑하고 예견 가능한 안정감에서 마음이 더 열리는 편입니다.`
        : stabilityNoveltyClass === "NOVELTY_GAP_B"
        ? `${nameB}님은 새로운 분위기의 스파크를 반기는 편이며, ${nameA}님은 익숙하고 안전한 분위기에서 가장 깊은 편안함을 느낍니다.`
        : isEn
        ? "Mutual preference leans toward steady trust and cozy environment."
        : "두 사람은 과감하거나 불안정한 변화보다는, 익숙하고 안전한 환경에서 마음을 열고 친밀감을 깊게 만드는 스타일에 더 끌립니다.",
    },
    leadAndResponse: {
      title: isEn ? "Initiation & Receptive Engagement" : "신호를 보내는 역할과 마음이 열리는 수용자",
      classification: "A_INITIATES_B_RESPONDS",
      description: isEn
        ? `${nameA} naturally signals approach while ${nameB} opens up smoothly upon invitation.`
        : `${nameA}님이 분위기나 다가가는 신호를 자연스럽게 이끌고, ${nameB}님이 그 신호를 편안히 받아들이며 마음을 여는 조화로운 흐름입니다.`,
    },
    comfortVsActivation: {
      title: isEn ? "Comfort & Activation Synergy" : "안도감과 설렘의 선순환",
      description: isEn
        ? "Mutual trust forms a protective shell where intimacy unfolds with ease."
        : "서로에 대한 정서적 안정감이 확보될수록 신체적 친밀감도 더욱 다정하고 자연스럽게 풀려나가는 관계입니다.",
    },
  };

  // Section 3: Bedroom Temperature (Intimacy Activation Modes)
  const bedroomTemperature: BedroomTemperature = {
    personAMode: {
      personName: nameA,
      modeTitle: isEn ? "Emotional-First & Direct Engagement" : "정서적 연결 우선형",
      description: isEn
        ? `${nameA} needs emotional attunement and mutual presence to fully step into intimacy.`
        : `${nameA}님은 마음의 앙금이 풀리고 정서적으로 따뜻하게 연결되었다고 느낄 때 신체적 친밀감으로 자연스럽게 넘어가는 타입입니다.`,
      psychDiscrepancyNote: (psychA?.ocean_traits?.energy_style ?? psychA?.secondary_axes?.energy_style ?? 50) > 65
        ? `${nameA}님은 기질적으로 다가가는 에너지가 발달해 있어, 정서적 교감이 충전되면 매우 다정하게 분위기를 이끌어갑니다.`
        : undefined,
    },
    personBMode: {
      personName: nameB,
      modeTitle: isEn ? "Responsive & Comfort-Grounded" : "반응적 수용 & 환경 편안함 우선형",
      description: isEn
        ? `${nameB} opens up smoothly when the environment is cozy and the partner initiates with warmth.`
        : `${nameB}님은 사전에 무거운 압박이 없고 집안 분위기가 편안하며 상대가 다정하게 신호를 줄 때 마음과 몸이 서서히 열리는 타입입니다.`,
      psychDiscrepancyNote: (psychB?.ocean_traits?.adaptability ?? psychB?.secondary_axes?.adaptability ?? 50) > 65
        ? `${nameB}님은 유연한 적응력을 가지고 있어, 분위기가 조성되면 파트너의 템포에 맞춰서 자연스럽게 호응합니다.`
        : undefined,
    },
    temperatureRhythmNarrative: isEn
      ? "Understanding activation modes prevents misinterpreting timing differences as lack of desire."
      : "두 사람의 침실 온도는 속도의 차이일 뿐 애정의 크기 차이가 아닙니다. 서로가 마음을 여는 사전 조건이 다름을 인정할 때 친밀감이 단단해집니다.",
  };

  // Section 4: Desire Mismatch & Rejection
  const empA = psychA?.ocean_traits?.empathy ?? psychA?.secondary_axes?.empathy ?? psychA?.traits?.empathy ?? psychA?.scores?.connection ?? 50;
  const empB = psychB?.ocean_traits?.empathy ?? psychB?.secondary_axes?.empathy ?? psychB?.traits?.empathy ?? psychB?.scores?.connection ?? 50;
  const isRejectionShared = empA > 60 && empB > 60;

  const desireMismatchAndRejection: DesireMismatchAndRejection = {
    personARejection: {
      personName: nameA,
      interpretation: `${nameB}님이 피곤하거나 상황이 안 맞을 때 거절하면, 혹시 관계의 거리감이 생긴 것은 아닌지 정서적으로 민감하게 받아들일 수 있습니다.`,
      expressionStyle: "거절해야 할 상황에서는 상대가 서운하지 않도록 사유를 다정하게 설명하며 미안함을 표하는 편입니다.",
      reconnectionNeed: "다음에 먼저 다정하게 가벼운 스킨십이나 안부를 건네주면 안도감을 되찾습니다.",
    },
    personBRejection: {
      personName: nameB,
      interpretation: `${nameA}님의 거절을 개인적 상처보다는 당일의 피로나 몸 컨디션 문제로 비교적 담담히 수용하는 편입니다.`,
      expressionStyle: "지치거나 피곤할 때는 솔직하게 현재 컨디션을 밝히고 쉴 시간이 필요함을 조용히 전달합니다.",
      reconnectionNeed: "충분히 쉴 시간을 보장받고 난 뒤 따뜻한 대화로 다가올 때 마음이 다시 열립니다.",
    },
    isSharedPattern: isRejectionShared,
    sharedPatternSummary: isRejectionShared
      ? "두 사람 모두 상대의 거절을 애정의 변함이 아닌 일상의 피로로 이해할 수 있는 정서적 공감력을 갖추고 있어, 불필요한 서운함으로 번지지 않습니다."
      : undefined,
    mismatchAdvice: isEn
      ? "Clear, warm communication when saying no preserves mutual trust."
      : "원치 않는 날에는 거절 그 자체보다 '당신을 사랑하지만 오늘은 피곤하다'는 확신의 신호를 먼저 건네는 것이 가장 좋은 처방법입니다.",
  };

  // Conditional Section: Emotional Intimacy (둘만 있을 때 마음이 열리는 조건)
  const emotionalIntimacy: EmotionalIntimacyCondition[] = [
    {
      personName: nameA,
      openingCondition: "외부의 평가나 판단 걱정 없이 온전히 내 편이 되어 들어줄 때",
      description: `${nameA}님은 세상의 중압감을 내려놓고 오롯이 내 편이 되어 마음을 보듬어주는 안식처를 느낄 때 깊은 속마음을 털어놓습니다.`,
    },
    {
      personName: nameB,
      openingCondition: "지적이나 조언 없이 있는 그대로의 템포를 인정받을 때",
      description: `${nameB}님은 잘잘못을 가리는 대화보다 내 입장과 피로를 아무 조건 없이 안아주는 분위기에서 경계심이 완전히 해제됩니다.`,
    },
  ];

  // Conditional Section: Intimacy Activation Conditions (설렘이 살아나는 조건)
  const activationConditions: IntimacyActivationConditions = {
    sharedConditions: ["아늑하고 프라이빗한 둘만의 공간", "일상의 가사 판단에서 벗어난 정서적 여유"],
    personAConditions: ["다정한 칭찬과 애정의 언어", "함께 새로운 경험이나 데이트를 나눌 때"],
    personBConditions: ["몸의 피로가 충분히 해소된 상태", "자연스럽고 부드러운 스킨십"],
    pairActivationInsight: "일상의 가사 노동이나 멘탈로드에서 벗어나 서로에게 오롯이 집중할 수 있는 차단된 시간과 공간이 두 사람의 설렘을 깨우는 가장 강력한 스위치입니다.",
  };

  // Conditional Section: Initiation Balance (먼저 다가가는 사람만 지치지 않도록)
  const initiationBalance: InitiationBalance = {
    initiatorName: nameA,
    responderName: nameB,
    asymmetryReason: `${nameA}님이 다가가는 신호를 더 자주 보내고 ${nameB}님이 이에 호응하는 구조가 자연스럽게 형성되기 때문입니다.`,
    longTermRisk: `${nameA}님이 '나만 이 관계를 원하는 것 아닐까'라는 외로움을 느끼거나, ${nameB}님이 수동적으로 변할 수 있습니다.`,
    calibrationGuide: `${nameB}님이 신호를 받을 때 반갑고 다정하게 호응해주고, 가끔은 가벼운 스킨십이나 데이트 제안으로 먼저 신호를 보내는 표현이 큰 힘이 됩니다.`,
  };

  return {
    introQuestion: isEn
      ? "💡 How do we express love and build genuine emotional & physical intimacy together?"
      : "💡 우리는 서로의 사랑을 제대로 알아보고 있을까? 그리고 둘만 있을 때 마음과 몸의 거리는 어떤 방식으로 가까워질까요?",
    loveTransmission,
    sajuIntimacyPair,
    bedroomTemperature,
    desireMismatchAndRejection,
    emotionalIntimacy,
    activationConditions,
    initiationBalance,
  };
}

export function createDefaultMarriageChapter04Intelligence(
  nameA: string,
  nameB: string,
  isEn: boolean = false,
): MarriageChapter04Intelligence {
  return {
    introQuestion: isEn
      ? "💡 How do we express love and build genuine emotional & physical intimacy together?"
      : "💡 우리는 서로의 사랑을 제대로 알아보고 있을까? 그리고 둘만 있을 때 마음과 몸의 거리는 어떤 방식으로 가까워질까요?",
    loveTransmission: [
      {
        senderName: nameA,
        receiverName: nameB,
        senderNaturalExpression: isEn ? "Affectionate verbal praise & warmth" : "다정한 마음 표현과 확신의 말",
        receiverReceptionNeed: isEn ? "Deep emotional attunement & listening" : "마음을 먼저 들여다봐 주는 정서적 공감",
        matchType: "DIRECT_MATCH",
        matchNarrative: isEn
          ? `${nameA}'s love expression directly reaches ${nameB}'s receptive heart.`
          : `${nameA}님이 표현하는 사랑의 방식이 ${nameB}님의 수신 채널에 따뜻하게 닿아 깊은 정서적 안정감을 만듭니다.`,
        transmissionInsight: isEn
          ? `${nameA} sends warmth via words, ${nameB} receives via empathetic attunement.`
          : `${nameA}님은 마음 표현으로 애정을 전하고, ${nameB}님은 정서적 공감을 통해 사랑을 확인합니다.`,
      },
      {
        senderName: nameB,
        receiverName: nameA,
        senderNaturalExpression: isEn ? "Practical assistance & everyday care" : "일상을 챙겨주는 실질적인 구체적 조력",
        receiverReceptionNeed: isEn ? "Warm physical touch & closeness" : "자연스러운 신체적 층위의 다정함",
        matchType: "PARTIAL_MATCH",
        matchNarrative: isEn
          ? `${nameB}'s thoughtful care is felt, though a touch more physical warmth completes the loop.`
          : `${nameB}님의 실질적인 챙김이 ${nameA}님에게 고맙게 전달되지만, 다정한 스킨십이나 말 한마디가 더해지면 온도가 배가됩니다.`,
        transmissionInsight: isEn
          ? `${nameB} shows love through helpful action, ${nameA} appreciates touch and verbal reassurance.`
          : `${nameB}님은 실질적 챙김으로 사랑을 표현하고, ${nameA}님은 다정한 체온과 반응에서 큰 애정을 느낍니다.`,
      },
    ],
    sajuIntimacyPair: {
      attractionInsight: {
        title: isEn ? "Mutual Attraction & Relational Pull" : "서로를 당기는 정서적·신체적 은은한 인력",
        description: isEn
          ? "Pair Saju synergy creates a natural, comforting bond."
          : "두 사람의 명식은 서로의 부족함을 차분히 채워주어, 둘만 있을 때 마음이 편안해지는 끌림을 만듭니다.",
        dynamics: isEn
          ? "Balances steady comfort with lasting warmth."
          : "자극적인 충격보다는 은은하고 오랫동안 유지되는 따뜻함이 관계의 중심이 됩니다.",
      },
      rhythmFit: {
        title: isEn ? "Intimacy Pace & Warming Speed" : "가까워지는 리듬과 무드 형성 템포",
        classification: "MATCHED_RHYTHM",
        description: isEn
          ? "Compatible pace in warming up to emotional and physical closeness."
          : "친밀한 무드로 들어가는 속도가 서서히 함께 올라오는 안정적인 리듬입니다.",
      },
      stabilityVsNovelty: {
        title: isEn ? "Stability vs. Novelty Balance" : "익숙한 편안함 vs 새로운 분위기의 자극",
        classification: "STABILITY_MATCH",
        description: isEn
          ? "Leans toward cozy trust and safe environment."
          : "두 사람은 안전하고 아늑한 둘만의 공간에서 가장 편안히 마음과 몸을 엽니다.",
      },
      leadAndResponse: {
        title: isEn ? "Initiation & Receptive Engagement" : "신호를 보내는 역할과 마음이 열리는 수용자",
        classification: "A_INITIATES_B_RESPONDS",
        description: isEn
          ? `${nameA} naturally initiates while ${nameB} responds warmly.`
          : `${nameA}님이 다정한 분위기를 이끌고 ${nameB}님이 이에 유연하게 호응하는 형태입니다.`,
      },
      comfortVsActivation: {
        title: isEn ? "Comfort & Activation Synergy" : "안도감과 친밀감의 선순환",
        description: isEn
          ? "Comfortable presence deepens overall closeness."
          : "서로에 대한 신뢰가 깊을수록 신체적 친밀감도 더욱 자연스럽게 풀어집니다.",
      },
    },
    bedroomTemperature: {
      personAMode: {
        personName: nameA,
        modeTitle: isEn ? "Emotional-First & Direct Engagement" : "정서적 연결 우선형",
        description: isEn
          ? `${nameA} values emotional closeness as the gateway to physical intimacy.`
          : `${nameA}님은 대화와 정서적 교감이 충분히 채워질 때 마음과 몸이 깊이 열리는 편입니다.`,
      },
      personBMode: {
        personName: nameB,
        modeTitle: isEn ? "Responsive & Comfort-Grounded" : "반응적 수용 & 환경 편안함 우선형",
        description: isEn
          ? `${nameB} opens up smoothly when the environment is peaceful and stress is low.`
          : `${nameB}님은 일상의 스트레스가 줄어들고 분위기가 아늑할 때 서서히 친밀감이 고조됩니다.`,
      },
      temperatureRhythmNarrative: isEn
        ? "Different warming speeds are a matter of rhythm, not love."
        : "온도가 올라오는 속도의 차이는 애정의 크기가 아니라 일상 피로와 마음을 여는 스위치의 차이입니다.",
    },
    desireMismatchAndRejection: {
      personARejection: {
        personName: nameA,
        interpretation: "거절당했을 때 혹시 나에게 서운한 점이 있는지 정서적으로 들여다보려는 경향이 있습니다.",
        expressionStyle: "상대가 서운하지 않도록 사유를 다정히 설명하며 거절하는 편입니다.",
        reconnectionNeed: "다음에 먼저 다가와 가벼운 스킨십이나 안부를 건네줄 때 마음이 편안해집니다.",
      },
      personBRejection: {
        personName: nameB,
        interpretation: "거절을 개인적인 반감이 아닌 상대의 체력이나 피로 문제로 비교적 담담히 받아들입니다.",
        expressionStyle: "피곤할 때는 현재 컨디션을 솔직히 밝히고 휴식이 필요하다고 전달합니다.",
        reconnectionNeed: "충분히 쉴 시간을 얻은 후 편안한 무드로 다가올 때 다정함이 회복됩니다.",
      },
      isSharedPattern: false,
      mismatchAdvice: "원치 않는 날에는 거절보다 '사랑하지만 오늘은 몸이 피곤하다'는 다정한 안심을 건네는 것이 제일 중요합니다.",
    },
  };
}
