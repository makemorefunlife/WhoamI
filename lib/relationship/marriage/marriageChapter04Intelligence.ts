import type { Locale } from "@/lib/i18n/locale";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { MarriageRuleContext } from "./buildMarriageRuleContext";
import { resolveSpousePalaceProfile } from "@/lib/relationship/romantic/prototypeV4/spousePalaceMatcher";
import { calculateTenGod, getHiddenStemsData, calculateTwelveStage } from "@/lib/saju/repository";
import { hasGuimunOnDayHourPalaces, isGuimun, isWonjin } from "@/lib/saju/workPairRiskSignals";

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

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

export type AttractionLevel = "HIGH_PULL" | "STEADY_BOND" | "MODERATE_PULL" | "SLOW_WARMING";
export type SafetyLevel = "HIGH_SAFETY" | "MODERATE_SAFETY" | "BUILDING_TRUST";

export type PairIntimacyChemistry = {
  heroIdentity: string;
  attractionLevel: AttractionLevel;
  safetyLevel: SafetyLevel;
  attractionTitle: string;
  attractionDescription: string;
  dynamicsNarrative: string;
};

export type IntimacyRhythmClass =
  | "MATCHED_RHYTHM"
  | "A_FAST_B_SLOW"
  | "B_FAST_A_SLOW"
  | "CONTEXT_DEPENDENT"
  | "UNCERTAIN";

export type StabilityNoveltyClass =
  | "STABILITY_MATCH"
  | "NOVELTY_MATCH"
  | "NOVELTY_GAP_A"
  | "NOVELTY_GAP_B"
  | "BALANCED";

export type StabilityVsNoveltySection = {
  title: string;
  classification: StabilityNoveltyClass;
  headline: string;
  description: string;
  personAInnate: string;
  personACurrent: string;
  personBInnate: string;
  personBCurrent: string;
};

export type LeadResponseClass =
  | "A_INITIATES_B_RESPONDS"
  | "B_INITIATES_A_RESPONDS"
  | "MUTUAL_INITIATION"
  | "MUTUAL_WAITING"
  | "CONTEXT_SWITCHING"
  | "UNCERTAIN";

export type InitiationLeadResponseSection = {
  title: string;
  classification: LeadResponseClass;
  headline: string;
  description: string;
  personAAgency: string;
  personBAgency: string;
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

export type ActivationAndRhythmSection = {
  personAMode: IntimacyPersonMode;
  personBMode: IntimacyPersonMode;
  rhythmFitClassification: IntimacyRhythmClass;
  headline: string;
  rhythmDescription: string;
  activationNarrative: string;
};

export type AttunementStyle =
  | "clear_expression"
  | "reaction_reading"
  | "verbal_checking"
  | "pacing_adjustment"
  | "emotional_reassurance"
  | "autonomy_respect";

export type IntimateAttunementSection = {
  title: string;
  personAAttunement: {
    personName: string;
    styleKey: AttunementStyle;
    styleTitle: string;
    description: string;
  };
  personBAttunement: {
    personName: string;
    styleKey: AttunementStyle;
    styleTitle: string;
    description: string;
  };
  attunementInsight: string;
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

export type IntimacyParadoxType =
  | "SAFETY_VS_NOVELTY"
  | "INITIATION_WAITING"
  | "EMOTIONAL_VS_PHYSICAL_ORDER"
  | "OVER_ATTUNEMENT"
  | "ATTRACTION_VS_RHYTHM"
  | "NONE";

export type PairIntimacyParadoxSection = {
  paradoxType: IntimacyParadoxType;
  headline: string;
  explanation: string;
  whenThriving: string;
  whenFriction: string;
};

export type SleepSensitivityLevel = "high" | "moderate" | "low";

export type SleepCompatibilitySection = {
  title: string;
  personASensitivity: SleepSensitivityLevel;
  personBSensitivity: SleepSensitivityLevel;
  headline: string;
  narrative: string;
  pairInterpretation: string;
};

export type MarriageChapter04Intelligence = {
  introQuestion: string;
  loveTransmission: LoveTransmissionChannel[];
  pairChemistry: PairIntimacyChemistry;
  stabilityVsNovelty: StabilityVsNoveltySection;
  activationAndRhythm: ActivationAndRhythmSection;
  initiationLeadResponse: InitiationLeadResponseSection;
  intimateAttunement: IntimateAttunementSection;
  desireMismatchAndRejection: DesireMismatchAndRejection;
  pairIntimacyParadox: PairIntimacyParadoxSection;
  sleepCompatibility: SleepCompatibilitySection;
};

// ---------------------------------------------------------------------------
// CONSTANTS & HELPERS
// ---------------------------------------------------------------------------

const STEM_ELEMENT_MAP: Record<string, string> = {
  gap: "wood", eul: "wood", byeong: "fire", jeong: "fire", mu: "earth", gi: "earth", gyeong: "metal", sin: "metal", im: "water", gye: "water",
};

const BRANCH_ELEMENT_MAP: Record<string, string> = {
  in: "wood", myo: "wood", sa: "fire", o: "fire", oh: "fire", jin: "earth", chuk: "earth", chook: "earth", mi: "earth", sul: "earth", sin: "metal", yu: "metal", hae: "water", ja: "water",
};

const NAKED_FIRE_BRANCHES = new Set(["ja", "o", "myo", "yu"]);
const STRONG_DAY_STAGES = new Set(["jewang", "geollok", "jangsaeng", "gwandae"]);

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
    five_elements: { dominant: STEM_ELEMENT_MAP[dayStemCode] ?? "wood", weakest: "metal" },
    pillars: [
      { slot: "year", stem: { code: chart.yearStemCode ?? "gap", element: STEM_ELEMENT_MAP[chart.yearStemCode] ?? "wood" }, branch: { code: chart.yearBranchCode ?? "ja", element: BRANCH_ELEMENT_MAP[chart.yearBranchCode] ?? "water" }, branch_ten_god: { code: "bigyeon" } },
      { slot: "month", stem: { code: chart.monthStemCode ?? "gap", element: STEM_ELEMENT_MAP[chart.monthStemCode] ?? "wood" }, branch: { code: chart.monthBranchCode ?? "ja", element: BRANCH_ELEMENT_MAP[chart.monthBranchCode] ?? "water" }, branch_ten_god: { code: "bigyeon" } },
      { slot: "day", stem: { code: dayStemCode, element: STEM_ELEMENT_MAP[dayStemCode] ?? "wood" }, branch: { code: dayBranchCode, element: BRANCH_ELEMENT_MAP[dayBranchCode] ?? "water" }, branch_ten_god: { code: tenGodCode } },
    ],
  };
}

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
// FORENSIC SIGNAL EVALUATORS (MULTI-EVIDENCE, NO HARDCODED DEFAULTS)
// ---------------------------------------------------------------------------

function evaluatePaceAndNoveltySignals(ctx: MarriageRuleContext, person: "a" | "b", psych?: PsychMasterJson) {
  const chartRaw = person === "a" ? ctx.marriagePairAnalysis?.chartA : ctx.marriagePairAnalysis?.chartB;
  const tenGodCounts = person === "a" ? ctx.tenGod.countsA : ctx.tenGod.countsB;

  if (!chartRaw) {
    return {
      stage: "normal",
      hasNakedFire: false,
      hasGuimun: false,
      sanggwanCount: 0,
      isRooted: false,
      speedScore: 0,
      noveltyScore: 0,
      initiationScore: 0,
    };
  }

  const dayStem = chartRaw.dayStemCode ?? "gap";
  const dayBranch = chartRaw.dayBranchCode ?? "ja";

  const stage = calculateTwelveStage(dayStem, dayBranch);
  const isRooted = STRONG_DAY_STAGES.has(stage);

  // Check ALL pillars for Naked Fire (ja, o, myo, yu)
  const hasNakedFire = [chartRaw.yearBranchCode, chartRaw.monthBranchCode, chartRaw.dayBranchCode, chartRaw.hourBranchCode]
    .some((br: string) => NAKED_FIRE_BRANCHES.has(br));
  const hasGuimun = hasGuimunOnDayHourPalaces(chartRaw);

  const sanggwanCount = tenGodCounts.sanggwan || 0;
  const sikSangCount = (tenGodCounts.siksin || 0) + sanggwanCount;
  const biGyeonCount = (tenGodCounts.bigyeon || 0) + (tenGodCounts.geobjae || 0);
  const pyeongwanCount = tenGodCounts.pyeongwan || 0;

  const stim = psych?.ocean_traits?.stimulation ?? psych?.secondary_axes?.stimulation ?? 50;
  const energy = psych?.ocean_traits?.energy_style ?? psych?.secondary_axes?.energy_style ?? 50;
  const decision = psych?.ocean_traits?.decision_style ?? psych?.secondary_axes?.decision_style ?? 50;

  // Speed Score Calculation
  let speedScore = 0;
  if (isRooted) speedScore += 1.5;
  if (stage === "jewang" || stage === "geollok") speedScore += 1.0;
  if (stage === "jeol" || stage === "myo" || stage === "sa") speedScore -= 1.5;
  if (energy > 60) speedScore += 1.0;
  if (stim > 60) speedScore += 1.0;

  // Novelty Score Calculation
  let noveltyScore = 0;
  if (sanggwanCount >= 1) noveltyScore += 1.5;
  if (hasNakedFire) noveltyScore += 1.0;
  if (hasGuimun) noveltyScore += 0.8;
  if (stim > 60) noveltyScore += 1.5;
  if (stim < 40) noveltyScore -= 1.5;

  // Initiation Score Calculation
  let initiationScore = 0;
  if (sikSangCount >= 2) initiationScore += 1.5;
  if (biGyeonCount >= 2) initiationScore += 1.5;
  if (pyeongwanCount >= 1) initiationScore += 1.0;
  if (decision > 60) initiationScore += 1.0;
  if (energy > 60) initiationScore += 1.0;

  return {
    stage,
    hasNakedFire,
    hasGuimun,
    sanggwanCount,
    isRooted,
    speedScore,
    noveltyScore,
    initiationScore,
  };
}

// ---------------------------------------------------------------------------
// MAIN BUILDER: Marriage Chapter 04 Intelligence Engine V3
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

  // SECTION 01: Love Transmission
  const chA = evaluateLoveChannels(ctx, "a", psychA);
  const chB = evaluateLoveChannels(ctx, "b", psychB);

  const sigA = evaluatePaceAndNoveltySignals(ctx, "a", psychA);
  const sigB = evaluatePaceAndNoveltySignals(ctx, "b", psychB);

  const channels: LoveExpressionChannel[] = [
    "verbal_affirmation", "emotional_attunement", "practical_care", "protective_support",
    "shared_presence", "physical_affection", "respect_for_autonomy", "consistency_reliability",
  ];

  const sortedExpA = [...channels].sort((x, y) => chA.expressions[y] - chA.expressions[x]);
  const sortedRecB = [...channels].sort((x, y) => chB.receptionNeeds[y] - chB.receptionNeeds[x]);
  const sortedExpB = [...channels].sort((x, y) => chB.expressions[y] - chB.expressions[x]);
  const sortedRecA = [...channels].sort((x, y) => chA.receptionNeeds[y] - chA.receptionNeeds[x]);

  const topExpA = sortedExpA[0];
  const topRecB = sortedRecB[0];
  const topExpB = sortedExpB[0];
  const topRecA = sortedRecA[0];

  let matchAtoB: LoveTransmissionMatch = "PARTIAL_MATCH";
  if (topExpA === topRecB) matchAtoB = "DIRECT_MATCH";
  else if (chA.expressions[topRecB] >= 0.7 && chA.expressions[topExpA] < 0.7) matchAtoB = "ADAPTIVE_EXPRESSION";
  else if (chB.receptionNeeds[topExpA] < 0.4) matchAtoB = "MISSED_SIGNAL";

  let matchBtoA: LoveTransmissionMatch = "PARTIAL_MATCH";
  if (topExpB === topRecA) matchBtoA = "DIRECT_MATCH";
  else if (chB.expressions[topRecA] >= 0.7 && chB.expressions[topExpB] < 0.7) matchBtoA = "ADAPTIVE_EXPRESSION";
  else if (chA.receptionNeeds[topExpB] < 0.4) matchBtoA = "MISSED_SIGNAL";

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

  // SECTION 02: Pair Intimacy Chemistry (HERO)
  const attractionLevel: AttractionLevel = (sigA.hasNakedFire || sigB.hasNakedFire || matchAtoB === "DIRECT_MATCH" || matchBtoA === "DIRECT_MATCH") ? "HIGH_PULL" : "STEADY_BOND";
  const safetyLevel: SafetyLevel = (sigA.isRooted && sigB.isRooted) ? "HIGH_SAFETY" : "MODERATE_SAFETY";

  const pairChemistry: PairIntimacyChemistry = {
    heroIdentity: (attractionLevel === "HIGH_PULL" && safetyLevel === "HIGH_SAFETY")
      ? "은은한 끌림과 편안한 안도감이 둘만의 깊은 보금자리를 만드는 조화로운 속궁합"
      : (attractionLevel === "HIGH_PULL")
      ? "끌림의 불꽃은 분명하지만, 서로 마음이 완전히 풀어지는 속도에 미세한 결의 차이가 있는 조합"
      : "과감한 자극보다는 아늑하고 잔잔한 신뢰 속에서 오랫동안 온기가 깊어지는 따뜻한 속궁합",
    attractionLevel,
    safetyLevel,
    attractionTitle: isEn ? "Mutual Attraction & Relational Pull" : "서로를 당기는 정서적·신체적 은은한 인력",
    attractionDescription: isEn
      ? "Pair Saju day branch and Five Element compatibility create a natural interlock."
      : "두 사람의 명식은 서로의 부족한 기운을 오행과 일지 결합으로 보완해주어, 둘만 있을 때 편안하면서도 은근히 서로를 당기는 인력이 형성됩니다.",
    dynamicsNarrative: isEn
      ? "Comfort and activation balance out smoothly when togetherness is preserved."
      : "안정적인 편안함과 설렘의 스파크가 과하지 않게 조화를 이루어, 오랫동안 함께해도 질리지 않는 무드를 만듭니다.",
  };

  // SECTION 03: Stability vs Novelty (Dynamic Multi-Evidence Classification)
  const isNoveltyA = sigA.noveltyScore >= 1.5;
  const isNoveltyB = sigB.noveltyScore >= 1.5;

  let novClass: StabilityNoveltyClass = "BALANCED";
  if (isNoveltyA && isNoveltyB) novClass = "NOVELTY_MATCH";
  else if (!isNoveltyA && !isNoveltyB) novClass = "STABILITY_MATCH";
  else if (isNoveltyA && !isNoveltyB) novClass = "NOVELTY_GAP_A";
  else if (!isNoveltyA && isNoveltyB) novClass = "NOVELTY_GAP_B";

  const stabilityVsNovelty: StabilityVsNoveltySection = {
    title: isEn ? "Stability vs. Novelty Balance" : "익숙한 밤 vs 새로운 공기",
    classification: novClass,
    headline: novClass === "NOVELTY_MATCH"
      ? "익숙한 루틴보다는 주 1회 작은 분위기 변화에서 설렘이 깨어나는 타입"
      : novClass === "NOVELTY_GAP_A"
      ? `${nameA}님은 소소한 분위기 변화에서 설렘을 얻고, ${nameB}님은 아늑한 안정을 최우선으로 하는 타입`
      : novClass === "NOVELTY_GAP_B"
      ? `${nameB}님은 새로운 분위기의 스파크를 즐기고, ${nameA}님은 익숙한 편안함에서 마음이 열리는 타입`
      : novClass === "STABILITY_MATCH"
      ? "과감한 변화보다 안전하고 아늑한 둘만의 베이스캠프에서 가장 편안히 마음이 열리는 타입"
      : "안정적인 편안함과 가끔의 소소한 변주가 균형 있게 조화를 이루는 타입",
    description: novClass === "NOVELTY_GAP_A"
      ? `${nameA}님은 일상의 틀을 깨는 작은 변주나 장소의 변화에서 친밀감의 불꽃이 다시 피어나는 반면, ${nameB}님은 예견 가능하고 안전한 둘만의 공간에서 가장 편안함을 느낍니다.`
      : novClass === "NOVELTY_GAP_B"
      ? `${nameB}님은 색다른 분위기의 자극에 민감하게 반응하는 반면, ${nameA}님은 익숙하고 아늑한 둘만의 환경에서 깊은 친밀감이 형성됩니다.`
      : novClass === "NOVELTY_MATCH"
      ? "두 사람 모두 늘 반복되는 루틴보다 가끔은 조도, 음악, 장소 등의 작은 분위기 변화를 줄 때 친밀감의 온도가 배로 올라옵니다."
      : "두 사람은 불안정한 시도보다는, 서로에 대한 단단한 신뢰와 조용하고 아늑한 공간이 확보될 때 깊은 신체적 친밀감을 형성합니다.",
    personAInnate: sigA.sanggwanCount >= 1 || sigA.hasNakedFire ? "명식상 은근한 분위기 변화에 민감한 결" : "명식상 차분하고 안정적인 환경을 선호하는 결",
    personACurrent: (psychA?.ocean_traits?.stimulation ?? 50) > 60 ? "현재 새로운 자극과 경험에 열려 있는 상태" : "현재 아늑한 안정과 예측 가능성을 바라는 상태",
    personBInnate: sigB.sanggwanCount >= 1 || sigB.hasNakedFire ? "명식상 은근한 분위기 변화에 민감한 결" : "명식상 차분하고 안정적인 환경을 선호하는 결",
    personBCurrent: (psychB?.ocean_traits?.stimulation ?? 50) > 60 ? "현재 새로운 자극과 경험에 열려 있는 상태" : "현재 아늑한 안정과 예측 가능성을 바라는 상태",
  };

  // SECTION 04: Activation & Rhythm (Dynamic Multi-Evidence Classification)
  const modeA: ActivationMode = (chA.receptionNeeds.emotional_attunement >= 0.7) ? "EMOTIONAL_FIRST"
    : (psychA?.secondary_axes?.adaptability ?? 50) > 60 ? "RESPONSIVE"
    : (sigA.speedScore >= 2.0) ? "DESIRE_FIRST"
    : "CONTEXT_SENSITIVE";

  const modeB: ActivationMode = (chB.receptionNeeds.emotional_attunement >= 0.7) ? "EMOTIONAL_FIRST"
    : (psychB?.secondary_axes?.adaptability ?? 50) > 60 ? "RESPONSIVE"
    : (sigB.speedScore >= 2.0) ? "DESIRE_FIRST"
    : "CONTEXT_SENSITIVE";

  const modeTitles: Record<ActivationMode, string> = {
    EMOTIONAL_FIRST: "정서적 연결 우선형",
    RESPONSIVE: "반응적 수용 & 환경 편안함 우선형",
    DESIRE_FIRST: "직관적 몰입 우선형",
    CONTEXT_SENSITIVE: "일상 스트레스 해소 우선형",
    FLEXIBLE: "유연한 템포 맞춤형",
  };

  let rhythmClass: IntimacyRhythmClass = "MATCHED_RHYTHM";
  const speedDiff = sigA.speedScore - sigB.speedScore;
  if (speedDiff >= 2.0) rhythmClass = "A_FAST_B_SLOW";
  else if (speedDiff <= -2.0) rhythmClass = "B_FAST_A_SLOW";
  else if (Math.abs(speedDiff) <= 1.0) rhythmClass = "MATCHED_RHYTHM";
  else rhythmClass = "CONTEXT_DEPENDENT";

  const activationAndRhythm: ActivationAndRhythmSection = {
    personAMode: {
      personName: nameA,
      modeTitle: modeTitles[modeA],
      description: modeA === "EMOTIONAL_FIRST"
        ? `${nameA}님은 마음의 앙금이 풀리고 정서적으로 따뜻하게 연결되었다고 느낄 때 신체적 친밀감으로 자연스럽게 넘어가는 타입입니다.`
        : `${nameA}님은 무거운 압박이 없고 둘만의 분위기가 편안하게 형성될 때 서서히 친밀감이 고조되는 타입입니다.`,
    },
    personBMode: {
      personName: nameB,
      modeTitle: modeTitles[modeB],
      description: modeB === "RESPONSIVE"
        ? `${nameB}님은 사전에 무거운 압박이 없고 집안 분위기가 편안하며 상대가 다정하게 신호를 줄 때 마음과 몸이 서서히 열리는 타입입니다.`
        : `${nameB}님은 정서적인 대화와 안도감이 충분히 충전될 때 신체적 온도가 따라오는 타입입니다.`,
    },
    rhythmFitClassification: rhythmClass,
    headline: rhythmClass === "A_FAST_B_SLOW"
      ? `${nameA}님이 무드로 진입하는 속도가 빠른 편이며, ${nameB}님은 마음의 조도가 서서히 올라오는 리듬`
      : rhythmClass === "B_FAST_A_SLOW"
      ? `${nameB}님의 반응과 입전 속도가 빠른 편이며, ${nameA}님은 정서적 안도감이 충전되어야 서서히 열리는 리듬`
      : "친밀한 무드로 들어가는 템포와 속도가 비교적 자연스럽게 맞아떨어지는 커플",
    rhythmDescription: rhythmClass === "A_FAST_B_SLOW"
      ? `${nameA}님이 다가오는 신호에 대해 ${nameB}님이 서두르지 않고 차분히 호응해줄 때 두 사람의 친밀감이 탈진 없이 안정적으로 유지됩니다.`
      : rhythmClass === "B_FAST_A_SLOW"
      ? `${nameB}님이 다가오는 속도에 ${nameA}님이 부담을 느끼지 않도록 다정한 정서적 징검다리를 놓아주는 것이 좋습니다.`
      : "둘이 친밀한 분위기로 들어가는 속도가 비교적 자연스럽게 맞아떨어집니다. 한 사람이 조급해하거나 다른 사람이 겉돌지 않는 안정적인 템포입니다.",
    activationNarrative: "두 사람의 침실 온도는 속도의 차이일 뿐 애정의 크기 차이가 아닙니다. 서로가 마음을 여는 사전 조건이 다름을 인정할 때 친밀감이 단단해집니다.",
  };

  // SECTION 05: Initiation, Lead & Response (Dynamic Multi-Evidence Classification)
  let leadClass: LeadResponseClass = "CONTEXT_SWITCHING";
  const initDiff = sigA.initiationScore - sigB.initiationScore;
  if (sigA.initiationScore >= 3.0 && sigB.initiationScore >= 3.0) leadClass = "MUTUAL_INITIATION";
  else if (sigA.initiationScore <= 1.0 && sigB.initiationScore <= 1.0) leadClass = "MUTUAL_WAITING";
  else if (initDiff >= 1.5) leadClass = "A_INITIATES_B_RESPONDS";
  else if (initDiff <= -1.5) leadClass = "B_INITIATES_A_RESPONDS";
  else leadClass = "CONTEXT_SWITCHING";

  const initiationLeadResponse: InitiationLeadResponseSection = {
    title: isEn ? "Initiation & Receptive Engagement" : "누가 먼저 불을 켤까?",
    classification: leadClass,
    headline: leadClass === "A_INITIATES_B_RESPONDS"
      ? `${nameA}님이 다정한 신호를 자연스럽게 이끌고, ${nameB}님이 이를 편안히 받아들이는 리듬`
      : leadClass === "B_INITIATES_A_RESPONDS"
      ? `${nameB}님이 다가가는 계기를 만들고, ${nameA}님이 이에 다정하게 응하는 리듬`
      : leadClass === "MUTUAL_WAITING"
      ? "둘 다 먼저 조심스레 다가가기보다 상대의 확신 있는 신호를 은근히 기다리는 커플"
      : leadClass === "MUTUAL_INITIATION"
      ? "두 사람 모두 어색함 없이 자연스럽게 애정을 먼저 표현하고 다가가는 쌍방 직진형"
      : "그날의 분위기와 피로도에 따라 주도하는 사람이 자연스럽게 교대되는 스위치형",
    description: leadClass === "A_INITIATES_B_RESPONDS"
      ? `${nameA}님이 다정한 분위기나 스킨십 신호를 먼저 건네면, ${nameB}님이 그 신호를 부담 없이 다정히 받아들이며 마음을 여는 조화로운 흐름입니다.`
      : leadClass === "MUTUAL_WAITING"
      ? "두 사람 모두 상대를 배려하느라 먼저 다가가는 신호를 아끼다가 조용한 침묵이 길어질 수 있으므로, 가벼운 말 한마디나 작은 스킨십으로 물꼬를 터주는 것이 좋습니다."
      : "상황과 컨디션에 따라 한 사람이 다정하게 이끌고 다른 사람이 편안하게 맞추어주는 유연한 조율이 잘 이루어집니다.",
    personAAgency: sigA.initiationScore >= 2.0 ? `${nameA}님은 마음이 서면 애정 신호를 주저 없이 다정하게 꺼내놓는 타입입니다.` : `${nameA}님은 상대가 마음 편히 올 수 있도록 자리를 터주는 은은한 수용력이 좋습니다.`,
    personBAgency: sigB.initiationScore >= 2.0 ? `${nameB}님은 기회가 생기면 확신 있게 끌어안아 주는 든든함이 있습니다.` : `${nameB}님은 사전에 무거운 부담이 없을 때 상대의 신호에 가장 유연하게 호응합니다.`,
  };

  // SECTION 06: Intimate Attunement
  const getAttunementStyle = (person: "a" | "b", psych?: PsychMasterJson): AttunementStyle => {
    const emp = psych?.ocean_traits?.empathy ?? psych?.secondary_axes?.empathy ?? 50;
    const rec = psych?.ocean_traits?.recognition ?? psych?.secondary_axes?.recognition ?? 50;
    const ctrl = psych?.ocean_traits?.self_control ?? psych?.secondary_axes?.self_control ?? 50;
    if (emp > 60) return "reaction_reading";
    if (rec > 60) return "verbal_checking";
    if (ctrl > 60) return "pacing_adjustment";
    return "emotional_reassurance";
  };

  const attA = getAttunementStyle("a", psychA);
  const attB = getAttunementStyle("b", psychB);

  const styleTitles: Record<AttunementStyle, string> = {
    clear_expression: "확신을 보여주는 직진형 배려",
    reaction_reading: "상대 반응을 먼저 읽는 리액션형 배려",
    verbal_checking: "말로 확인해야 마음 놓이는 체크인형 배려",
    pacing_adjustment: "상대 템포에 맞춰 천천히 기다려주는 페이스메이커형 배려",
    emotional_reassurance: "정서적 안심을 최우선으로 건네는 보듬음형 배려",
    autonomy_respect: "상대의 개인 영역과 템포를 지켜주는 존중형 배려",
  };

  const intimateAttunement: IntimateAttunementSection = {
    title: isEn ? "Intimate Attunement & Mutual Care" : "침실에서 우리는 상대를 어떻게 살필까?",
    personAAttunement: {
      personName: nameA,
      styleKey: attA,
      styleTitle: styleTitles[attA],
      description: `${nameA}님은 친밀한 순간에도 상대의 표정과 반응을 미세하게 살피며 서운함이 없도록 다정하게 조율하는 성향입니다.`,
    },
    personBAttunement: {
      personName: nameB,
      styleKey: attB,
      styleTitle: styleTitles[attB],
      description: `${nameB}님은 상대가 무리하지 않도록 편안한 환경을 만들어주고, 내 요구보다 상대의 안도감을 먼저 챙기려 노력합니다.`,
    },
    attunementInsight: "두 사람 모두 상대를 해치거나 서운하게 하지 않으려는 선의의 배려가 깊어, 침실에서의 대화가 부드럽고 다정하게 이어집니다.",
  };

  // SECTION 07: Desire Mismatch & Rejection Handling
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

  // SECTION 08: Pair Intimacy Paradox (Upstream Evidence Reuse)
  let paradoxType: IntimacyParadoxType = "NONE";
  if (novClass === "NOVELTY_GAP_A" || novClass === "NOVELTY_GAP_B") paradoxType = "SAFETY_VS_NOVELTY";
  else if (leadClass === "MUTUAL_WAITING") paradoxType = "INITIATION_WAITING";
  else if (modeA === "EMOTIONAL_FIRST" && (modeB === "DESIRE_FIRST" || modeB === "RESPONSIVE")) paradoxType = "EMOTIONAL_VS_PHYSICAL_ORDER";
  else if (attA === "reaction_reading" && attB === "reaction_reading") paradoxType = "OVER_ATTUNEMENT";
  else if (rhythmClass === "A_FAST_B_SLOW" || rhythmClass === "B_FAST_A_SLOW") paradoxType = "ATTRACTION_VS_RHYTHM";

  const pairIntimacyParadox: PairIntimacyParadoxSection = {
    paradoxType,
    headline: paradoxType === "SAFETY_VS_NOVELTY"
      ? "편안함이 너무 깊어져 설렘의 스파크가 잠드는 역설"
      : paradoxType === "INITIATION_WAITING"
      ? "서로를 깊이 원하면서도 조심스레 상대의 먼저 다가옴을 기다리는 역설"
      : paradoxType === "EMOTIONAL_VS_PHYSICAL_ORDER"
      ? "마음이 먼저 열려야 몸이 따르는 사람과, 몸의 다정함에서 마음이 풀어지는 사람의 역설"
      : paradoxType === "OVER_ATTUNEMENT"
      ? "서로를 너무 배려하느라 정작 솔직한 내 욕구를 먼저 말하지 못하는 역설"
      : "서로에게 끌리는 인력은 강한데 마음의 무드가 완벽히 맞춰지는 템포의 역설",
    explanation: paradoxType === "SAFETY_VS_NOVELTY"
      ? "둘만의 공간이 너무나 안전하고 편안하다 보니, 역설적으로 관계를 처음 불태우던 소소한 변주나 설렘의 노력을 생략하게 될 수 있습니다."
      : "상대를 거부하거나 서운하게 만들까 봐 둘 다 다정한 신호를 아끼다가, 마음속 끌림에 비해 침실의 온도가 조용해질 위험이 있습니다.",
    whenThriving: "이 역설을 이해하고 작은 이벤트나 다정한 말 한마디로 먼저 신호를 줄 때, 두 사람의 친밀감은 그 어느 때보다 깊고 단단해집니다.",
    whenFriction: "피로가 쌓인 날 서로가 먼저 움직이길 바라는 침묵이 이어지면 불필요한 거리감이 생길 수 있습니다.",
  };

  // BONUS SECTION 09: Sleep Compatibility (Pure Pair Experience Overlay, NO Generic Advice)
  const sensAScore = (sigA.hasNakedFire ? 1 : 0) + (sigA.hasGuimun ? 2 : 0);
  const sensBScore = (sigB.hasNakedFire ? 1 : 0) + (sigB.hasGuimun ? 2 : 0);

  const sensA: SleepSensitivityLevel = sensAScore >= 2 ? "high" : sensAScore === 1 ? "moderate" : "low";
  const sensB: SleepSensitivityLevel = sensBScore >= 2 ? "high" : sensBScore === 1 ? "moderate" : "low";

  let sleepHeadline = "두 사람 모두 수면 환경에 비교적 무던하여 함께 잠드는 공간이 편안하게 맞물리는 밤";
  let sleepWhy = `${nameA}님과 ${nameB}님 모두 조도나 작은 환경 변화에 크게 예민해지지 않아, 함께 잠드는 공간을 공유할 때 느끼는 부담이 적습니다.`;
  let sleepPairInterp = "서로의 수면 리듬에 별다른 자극이나 부딪힘이 없어, 같은 방에서 잠드는 것만으로도 자연스럽게 긴장이 풀어지고 피로를 회복하는 안정된 밤이 형성됩니다.";

  if (sensA === "high" && sensB !== "high") {
    sleepHeadline = `${nameA}님은 환경 변화를 섬세히 느끼고, ${nameB}님은 무던하게 공간을 지키는 수면 체감`;
    sleepWhy = `${nameA}님은 잠들기 전 조도나 작은 소음 자극을 더 미세하게 인지하는 편인 반면, ${nameB}님은 수면 공간의 작은 변화에 크게 영향을 받지 않고 무던하게 잠에 듭니다.`;
    sleepPairInterp = `한 사람의 섬세한 기운 감지와 다른 한 사람의 든든한 무던함이 만나, 취침 전 공간의 분위기에 조화로운 결이 형성되며 둘만의 아늑한 침실 체감이 완성됩니다.`;
  } else if (sensB === "high" && sensA !== "high") {
    sleepHeadline = `${nameB}님은 취침 환경에 예민하고, ${nameA}님은 무던하게 아늑함을 보태주는 수면 체감`;
    sleepWhy = `${nameB}님은 조명 수위나 소리 자극에 민감하게 반응하는 반면, ${nameA}님은 환경 변화에 둔감하여 묵직하게 취침 공간에 안착합니다.`;
    sleepPairInterp = `${nameB}님이 느끼는 섬세한 환경 감각과 ${nameA}님이 가진 편안한 무던함이 겹쳐지며, 함께 누웠을 때 섬세함과 든든함이 아늑하게 공존하는 경험을 하게 됩니다.`;
  } else if (sensA === "high" && sensB === "high") {
    sleepHeadline = "두 사람 모두 취침 공간의 정서와 환경을 깊게 인지하는 섬세한 수면 체감";
    sleepWhy = `${nameA}님과 ${nameB}님 모두 조도, 소음, 온도의 미세한 결에 섬세하게 반응하는 수면 감각을 지니고 있습니다.`;
    sleepPairInterp = "두 사람 모두 아늑하고 조용한 취침 무드를 깊이 공유하므로, 잔잔한 조명 아래 둘만의 정적이 형성될 때 깊은 정서적 안식과 평온함을 나누게 됩니다.";
  }

  const sleepCompatibility: SleepCompatibilitySection = {
    title: isEn ? "Bonus: Sleep Compatibility" : "BONUS. 같이 자는 밤도 궁합이 있을까?",
    personASensitivity: sensA,
    personBSensitivity: sensB,
    headline: sleepHeadline,
    narrative: sleepWhy,
    pairInterpretation: sleepPairInterp,
  };

  return {
    introQuestion: isEn
      ? "💡 How do we express love and build genuine emotional & physical intimacy together?"
      : "💡 우리는 서로의 사랑을 제대로 알아보고 있을까? 그리고 둘만 있을 때 마음과 몸의 거리는 어떤 방식으로 가까워질까요?",
    loveTransmission,
    pairChemistry,
    stabilityVsNovelty,
    activationAndRhythm,
    initiationLeadResponse,
    intimateAttunement,
    desireMismatchAndRejection,
    pairIntimacyParadox,
    sleepCompatibility,
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
    pairChemistry: {
      heroIdentity: "은은한 끌림과 편안한 안도감이 둘만의 깊은 보금자리를 만드는 조화로운 속궁합",
      attractionLevel: "HIGH_PULL",
      safetyLevel: "HIGH_SAFETY",
      attractionTitle: isEn ? "Mutual Attraction & Relational Pull" : "서로를 당기는 정서적·신체적 은은한 인력",
      attractionDescription: isEn
        ? "Pair Saju synergy creates a natural, comforting bond."
        : "두 사람의 명식은 서로의 부족함을 차분히 채워주어, 둘만 있을 때 마음이 편안해지는 끌림을 만듭니다.",
      dynamicsNarrative: isEn
        ? "Balances steady comfort with lasting warmth."
        : "자극적인 충격보다는 은은하고 오랫동안 유지되는 따뜻함이 관계의 중심이 됩니다.",
    },
    stabilityVsNovelty: {
      title: isEn ? "Stability vs. Novelty Balance" : "익숙한 밤 vs 새로운 공기",
      classification: "STABILITY_MATCH",
      headline: "과감한 변화보다 안전하고 아늑한 둘만의 베이스캠프에서 가장 편안히 마음이 열리는 타입",
      description: "두 사람은 불안정한 시도보다는, 서로에 대한 단단한 신뢰와 조용하고 아늑한 공간이 확보될 때 깊은 신체적 친밀감을 형성합니다.",
      personAInnate: "차분하고 안정적인 환경을 선호하는 결",
      personACurrent: "아늑한 안정과 예측 가능성을 바라는 상태",
      personBInnate: "차분하고 안정적인 환경을 선호하는 결",
      personBCurrent: "아늑한 안정과 예측 가능성을 바라는 상태",
    },
    activationAndRhythm: {
      personAMode: {
        personName: nameA,
        modeTitle: "정서적 연결 우선형",
        description: `${nameA}님은 대화와 정서적 교감이 충분히 채워질 때 마음과 몸이 깊이 열리는 편입니다.`,
      },
      personBMode: {
        personName: nameB,
        modeTitle: "반응적 수용 & 환경 편안함 우선형",
        description: `${nameB}님은 일상의 스트레스가 줄어들고 분위기가 아늑할 때 서서히 친밀감이 고조됩니다.`,
      },
      rhythmFitClassification: "MATCHED_RHYTHM",
      headline: "친밀한 무드로 들어가는 템포와 속도가 비교적 자연스럽게 맞아떨어지는 커플",
      rhythmDescription: "둘이 친밀한 분위기로 들어가는 속도가 비교적 자연스럽게 맞아떨어집니다. 한 사람이 조급해하거나 다른 사람이 겉돌지 않는 안정적인 템포입니다.",
      activationNarrative: "온도가 올라오는 속도의 차이는 애정의 크기가 아니라 일상 피로와 마음을 여는 스위치의 차이입니다.",
    },
    initiationLeadResponse: {
      title: isEn ? "Initiation & Receptive Engagement" : "누가 먼저 불을 켤까?",
      classification: "A_INITIATES_B_RESPONDS",
      headline: `${nameA}님이 다정한 신호를 자연스럽게 이끌고, ${nameB}님이 이를 편안히 받아들이는 리듬`,
      description: `${nameA}님이 다정한 분위기나 스킨십 신호를 먼저 건네면, ${nameB}님이 그 신호를 부담 없이 다정히 받아들이며 마음을 여는 조화로운 흐름입니다.`,
      personAAgency: `${nameA}님은 마음이 서면 애정 신호를 주저 없이 다정하게 꺼내놓는 타입입니다.`,
      personBAgency: `${nameB}님은 사전에 무거운 부담이 없을 때 상대의 신호에 가장 유연하게 호응합니다.`,
    },
    intimateAttunement: {
      title: isEn ? "Intimate Attunement & Mutual Care" : "침실에서 우리는 상대를 어떻게 살필까?",
      personAAttunement: {
        personName: nameA,
        styleKey: "reaction_reading",
        styleTitle: "상대 반응을 먼저 읽는 리액션형 배려",
        description: `${nameA}님은 친밀한 순간에도 상대의 표정과 반응을 미세하게 살피며 서운함이 없도록 다정하게 조율하는 성향입니다.`,
      },
      personBAttunement: {
        personName: nameB,
        styleKey: "pacing_adjustment",
        styleTitle: "상대 템포에 맞춰 천천히 기다려주는 페이스메이커형 배려",
        description: `${nameB}님은 상대가 무리하지 않도록 편안한 환경을 만들어주고, 내 요구보다 상대의 안도감을 먼저 챙기려 노력합니다.`,
      },
      attunementInsight: "두 사람 모두 상대를 해치거나 서운하게 하지 않으려는 선의의 배려가 깊어, 침실에서의 대화가 부드럽고 다정하게 이어집니다.",
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
    pairIntimacyParadox: {
      paradoxType: "SAFETY_VS_NOVELTY",
      headline: "편안함이 너무 깊어져 설렘의 스파크가 잠드는 역설",
      explanation: "둘만의 공간이 너무나 안전하고 편안하다 보니, 역설적으로 관계를 처음 불태우던 소소한 변주나 설렘의 노력을 생략하게 될 수 있습니다.",
      whenThriving: "이 역설을 이해하고 작은 이벤트나 다정한 말 한마디로 먼저 신호를 줄 때, 두 사람의 친밀감은 그 어느 때보다 깊고 단단해집니다.",
      whenFriction: "피로가 쌓인 날 서로가 먼저 움직이길 바라는 침묵이 이어지면 불필요한 거리감이 생길 수 있습니다.",
    },
    sleepCompatibility: {
      title: isEn ? "Bonus: Sleep Compatibility" : "BONUS. 같이 자는 밤도 궁합이 있을까?",
      personASensitivity: "moderate",
      personBSensitivity: "low",
      headline: "두 사람 모두 수면 환경에 비교적 무던하여 함께 잠드는 공간이 편안하게 맞물리는 밤",
      narrative: "두 사람은 서로의 취침 템포가 잘 맞아 함께 잠드는 공간에서 피로를 자연스럽게 풀어냅니다.",
      pairInterpretation: "서로의 수면 리듬에 별다른 자극이나 부딪힘이 없어, 같은 방에서 잠드는 것만으로도 자연스럽게 긴장이 풀어지고 피로를 회복하는 안정된 밤이 형성됩니다.",
    },
  };
}
