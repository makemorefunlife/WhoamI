import type { Locale } from "@/lib/i18n/locale";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { MarriageRuleContext } from "./buildMarriageRuleContext";
import { resolveSpousePalaceProfile } from "@/lib/relationship/romantic/prototypeV4/spousePalaceMatcher";
import { calculateTenGod, getHiddenStemsData } from "@/lib/saju/repository";

export type RelationalFunction =
  | "emotional_safety"
  | "warmth"
  | "acceptance"
  | "direction"
  | "decisiveness"
  | "stability"
  | "predictability"
  | "autonomy"
  | "respect_for_space"
  | "structure"
  | "responsibility"
  | "practical_support"
  | "activation"
  | "growth"
  | "expression"
  | "recognition"
  | "flexibility"
  | "conflict_buffering";

export type MatchType =
  | "NATURAL_MATCH"
  | "LATENT_MATCH"
  | "ADAPTIVE_SUPPLY"
  | "EXPECTATION_GAP"
  | "OVER_SUPPLY"
  | "MUTUAL_AMPLIFICATION";

export type RelationalAsset = {
  title: string;
  mechanism: string;
  longTermValue: string;
};

export type HiddenExpectation = {
  seekerName: string;
  partnerName: string;
  functionLabel: string;
  whyItMatters: string;
  matchType: MatchType;
  matchStatusNarrative: string;
  expectationInsight: string;
};

export type AssetToDebtChain = {
  title: string;
  initialBenefit: string;
  repeatedReinforcement: string;
  flipCondition: string;
  longTermCost: string;
};

export type PersonRelationalRole = {
  personName: string;
  roleTitle: string;
  whyFormed: string;
  helpfulWhen: string;
  riskWhenLocked: string;
};

export type RoleLockInModel = {
  personARole: PersonRelationalRole;
  personBRole: PersonRelationalRole;
  pairSummary: string;
};

export type PersonRelationalLoad = {
  personName: string;
  laborType: string;
  whyCostly: string;
  earlyWarningSign: string;
};

export type AccumulatedLoadModel = {
  personALoad: PersonRelationalLoad;
  personBLoad: PersonRelationalLoad;
  loadBalanceNarrative: string;
};

export type ExpectationLimit = {
  targetName: string;
  partnerName: string;
  limitedFunction: string;
  whyCostlyToDemand: string;
  adaptiveSupplyNote?: string;
};

export type FlipTableRow = {
  feature: string;
  whenAsset: string;
  whenDebt: string;
};

export type LongTermProtection = {
  assetToProtect: string;
  roleToRenegotiate: string;
  effortToAppreciate: string;
};

export type MarriageChapter03Intelligence = {
  introQuestion: string;
  assets: RelationalAsset[];
  hiddenExpectations: HiddenExpectation[];
  assetToDebtChains: AssetToDebtChain[];
  roleLockIn: RoleLockInModel;
  accumulatedLoad: AccumulatedLoadModel;
  expectationLimits: ExpectationLimit[];
  flipTableRows: FlipTableRow[];
  protection: LongTermProtection;
};

const STEM_ELEMENT_MAP: Record<string, string> = {
  gap: "wood", eul: "wood", byeong: "fire", jeong: "fire", mu: "earth", gi: "earth", gyeong: "metal", sin: "metal", im: "water", gye: "water",
};

const BRANCH_ELEMENT_MAP: Record<string, string> = {
  in: "wood", myo: "wood", sa: "fire", o: "fire", oh: "fire", jin: "earth", chuk: "earth", chook: "earth", mi: "earth", sul: "earth", sin: "metal", yu: "metal", hae: "water", ja: "water",
};

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
// HELPER: Map Psych Master 6-Axis / 11-Axis to Relational Functions
// ---------------------------------------------------------------------------

export function evaluateCurrentPsychExpression(
  psych: PsychMasterJson | undefined,
  func: RelationalFunction,
): number {
  if (!psych) return 0.5; // neutral default
  const traits = psych.ocean_traits ?? psych.traits ?? psych.secondary_axes ?? {};
  const scores = psych.scores ?? {};

  switch (func) {
    case "emotional_safety":
    case "warmth":
    case "acceptance":
      return (traits.empathy ?? scores.connection ?? 50) / 100;
    case "direction":
    case "decisiveness":
      return (traits.decision_style ?? scores.growth ?? 50) / 100;
    case "stability":
    case "predictability":
    case "structure":
      return (traits.self_control ?? scores.stability ?? traits.structure ?? 50) / 100;
    case "autonomy":
    case "respect_for_space":
      return (traits.independence ?? scores.autonomy ?? 50) / 100;
    case "responsibility":
    case "practical_support":
      return (traits.practicality ?? scores.structure ?? 50) / 100;
    case "activation":
    case "growth":
    case "expression":
      return (traits.energy_style ?? scores.growth ?? 50) / 100;
    case "recognition":
      return (traits.empathy ?? scores.connection ?? 50) / 100;
    case "flexibility":
    case "conflict_buffering":
      return (traits.adaptability ?? scores.adaptability ?? traits.conflict_style ?? 50) / 100;
    default:
      return 0.5;
  }
}

// ---------------------------------------------------------------------------
// HELPER: Saju Innate Need & Supply Evaluator
// ---------------------------------------------------------------------------

export function evaluateSajuInnateNeedAndSupply(
  ctx: MarriageRuleContext,
  person: "a" | "b",
): { needs: Record<RelationalFunction, number>; supplies: Record<RelationalFunction, number> } {
  const chartRaw = person === "a" ? ctx.marriagePairAnalysis?.chartA : ctx.marriagePairAnalysis?.chartB;
  const chartIndiv = chartToIndividualSajuAdapter(chartRaw);

  const spousePalace = resolveSpousePalaceProfile(
    chartIndiv,
    person,
    person === "a" ? ctx.nicknameA : ctx.nicknameB,
    ctx.locale,
  );
  const tenGodCounts = person === "a" ? ctx.tenGod.countsA : ctx.tenGod.countsB;

  const needs: Record<RelationalFunction, number> = {
    emotional_safety: 0.5,
    warmth: 0.5,
    acceptance: 0.5,
    direction: 0.5,
    decisiveness: 0.5,
    stability: 0.5,
    predictability: 0.5,
    autonomy: 0.5,
    respect_for_space: 0.5,
    structure: 0.5,
    responsibility: 0.5,
    practical_support: 0.5,
    activation: 0.5,
    growth: 0.5,
    expression: 0.5,
    recognition: 0.5,
    flexibility: 0.5,
    conflict_buffering: 0.5,
  };

  const supplies: Record<RelationalFunction, number> = { ...needs };

  // Ten-God of Spouse Palace influence on Innate Needs
  const code = spousePalace.tenGodCode;

  if (code === "pyeongwan" || code === "jeonggwan") {
    needs.direction += 0.3;
    needs.stability += 0.3;
    needs.responsibility += 0.2;
  } else if (code === "pyeonjae" || code === "jeongjae") {
    needs.practical_support += 0.3;
    needs.structure += 0.2;
    needs.predictability += 0.2;
  } else if (code === "pyeonin" || code === "jeongin") {
    needs.emotional_safety += 0.3;
    needs.acceptance += 0.3;
    needs.warmth += 0.2;
  } else if (code === "siksin" || code === "sanggwan") {
    needs.expression += 0.3;
    needs.recognition += 0.3;
    needs.flexibility += 0.2;
  } else if (code === "bigyeon" || code === "geobjae") {
    needs.autonomy += 0.3;
    needs.respect_for_space += 0.3;
    needs.growth += 0.2;
  }

  // Ten-God counts influence on Innate Supplies
  const biGyeonCount = (tenGodCounts.bigyeon || 0) + (tenGodCounts.geobjae || 0);
  const sikSangCount = (tenGodCounts.siksin || 0) + (tenGodCounts.sanggwan || 0);
  const jaeSeongCount = (tenGodCounts.pyeonjae || 0) + (tenGodCounts.jeongjae || 0);
  const gwanSeongCount = (tenGodCounts.pyeongwan || 0) + (tenGodCounts.jeonggwan || 0);
  const inSeongCount = (tenGodCounts.pyeonin || 0) + (tenGodCounts.jeongin || 0);

  if (biGyeonCount >= 3) {
    supplies.autonomy += 0.3;
    supplies.respect_for_space += 0.3;
  }
  if (sikSangCount >= 3) {
    supplies.expression += 0.3;
    supplies.warmth += 0.2;
    supplies.flexibility += 0.2;
  }
  if (jaeSeongCount >= 3) {
    supplies.practical_support += 0.3;
    supplies.responsibility += 0.3;
  }
  if (gwanSeongCount >= 3) {
    supplies.structure += 0.3;
    supplies.direction += 0.3;
    supplies.predictability += 0.2;
  }
  if (inSeongCount >= 3) {
    supplies.emotional_safety += 0.3;
    supplies.acceptance += 0.3;
    supplies.conflict_buffering += 0.2;
  }

  return { needs, supplies };
}

// ---------------------------------------------------------------------------
// HELPER: Rigorous 2x2 Classifier (Innate Supply x Current Psych Expression)
// ---------------------------------------------------------------------------

export function classifyMatch(
  innateSupplyScore: number,
  currentExprScore: number,
): MatchType {
  const innateHigh = innateSupplyScore >= 0.6;
  const exprHigh = currentExprScore >= 0.6;

  if (innateHigh && exprHigh) return "NATURAL_MATCH";
  if (innateHigh && !exprHigh) return "LATENT_MATCH";
  if (!innateHigh && exprHigh) return "ADAPTIVE_SUPPLY";
  return "EXPECTATION_GAP";
}

function getFunctionLabel(func: RelationalFunction, isEn: boolean = false): string {
  switch (func) {
    case "direction":
    case "decisiveness":
      return isEn ? "Clear direction & decisive choice" : "결정의 순간 명확한 판단과 기준 제시";
    case "emotional_safety":
    case "warmth":
    case "acceptance":
      return isEn ? "Warm emotional haven & acceptance" : "정서적 안식처와 마음 편한 포용";
    case "autonomy":
    case "respect_for_space":
      return isEn ? "Respect for personal space & autonomy" : "개인 영역 존중과 자율성 보장";
    case "stability":
    case "predictability":
    case "structure":
      return isEn ? "Predictable structure & steady balance" : "예측 가능한 루틴과 일상의 안정감";
    case "practical_support":
    case "responsibility":
      return isEn ? "Grounded support & shared responsibility" : "실질적인 구체적 조력과 책임 이행";
    case "expression":
    case "recognition":
    case "activation":
      return isEn ? "Affectionate expression & recognition" : "다정한 표현과 노고에 대한 인정";
    case "flexibility":
    case "conflict_buffering":
      return isEn ? "Flexible buffering in tension" : "갈등 상황에서의 유연한 완충";
    default:
      return isEn ? "Relational stability & mutual trust" : "상호 신뢰와 관계적 안정감";
  }
}

// ---------------------------------------------------------------------------
// MAIN BUILDER: Build Marriage Chapter 03 Intelligence
// ---------------------------------------------------------------------------

export function buildMarriageChapter03Intelligence(params: {
  ctx: MarriageRuleContext;
  psychA?: PsychMasterJson;
  psychB?: PsychMasterJson;
  locale?: Locale;
}): MarriageChapter03Intelligence {
  const { ctx, psychA, psychB, locale = "ko-KR" } = params;
  const isEn = locale === "en-US";
  const nameA = ctx.nicknameA;
  const nameB = ctx.nicknameB;

  const sajuA = evaluateSajuInnateNeedAndSupply(ctx, "a");
  const sajuB = evaluateSajuInnateNeedAndSupply(ctx, "b");

  // Rank top Innate Need functions for A and B
  const candidateFuncs: RelationalFunction[] = [
    "direction",
    "emotional_safety",
    "autonomy",
    "stability",
    "practical_support",
    "expression",
    "flexibility",
  ];

  const sortedNeedsA = [...candidateFuncs].sort((x, y) => sajuA.needs[y] - sajuA.needs[x]);
  const sortedNeedsB = [...candidateFuncs].sort((x, y) => sajuB.needs[y] - sajuB.needs[x]);

  const topFuncA = sortedNeedsA[0] ?? "direction";
  const topFuncB = sortedNeedsB[0] ?? "autonomy";

  // Direction A -> B Classification
  const innateSupplyB = sajuB.supplies[topFuncA] ?? 0.5;
  const currExprB = evaluateCurrentPsychExpression(psychB, topFuncA);
  const matchTypeAtoB = classifyMatch(innateSupplyB, currExprB);

  // Direction B -> A Classification
  const innateSupplyA = sajuA.supplies[topFuncB] ?? 0.5;
  const currExprA = evaluateCurrentPsychExpression(psychA, topFuncB);
  const matchTypeBtoA = classifyMatch(innateSupplyA, currExprA);

  // SECTION 1: Relationship Assets
  const assets: RelationalAsset[] = [
    {
      title: isEn ? `${nameA}'s direction & ${nameB}'s steady acceptance` : `${nameA}님의 방향 감각과 ${nameB}님의 수용적 포용력`,
      mechanism: isEn
        ? "One partner provides clear direction while the other offers an emotional haven."
        : "한 사람이 부부 관계의 선택을 이끌어줄 때 상대방이 마음을 보듬어주는 안식처가 되어주어, 시간이 흐를수록 서로의 부족함을 보완하는 자산이 될 수 있습니다.",
      longTermValue: isEn
        ? "Solidifies marital trust and stability against minor friction."
        : "작은 마찰에 흔들리지 않고 함께 삶의 안정을 구축해 나가는 단단한 자산으로 누적될 가능성이 높습니다.",
    },
    {
      title: isEn ? "Deepening trust through mutual space & independence" : "서로의 사생활과 템포를 인정해 주는 은은한 신뢰",
      mechanism: isEn
        ? "Respecting each other's individual routine rather than demanding total shared timing."
        : "모든 일상을 강제로 공유하려 애쓰기보다 각자의 사생활 템포를 인정해 줄 때, 함께하는 순간의 안도감이 오래 유지되는 흐름입니다.",
      longTermValue: isEn
        ? "Preserves mutual comfort without emotional suffocation."
        : "오래 함께 살아도 의무감에 지치지 않고 서로에게 가장 편안한 아군으로 자리 잡게 됩니다.",
    },
  ];

  // SECTION 2: Hidden Partner Expectations
  const hiddenExpectations: HiddenExpectation[] = [
    {
      seekerName: nameA,
      partnerName: nameB,
      functionLabel: getFunctionLabel(topFuncA, isEn),
      whyItMatters: isEn
        ? `${nameA} implicitly seeks ${nameB}'s support in ${topFuncA}.`
        : `${nameA}님은 혼자서 모든 결정을 짊어지기보다, 주요한 순간에 ${nameB}님이 단단하게 곁을 지켜주길 은연중에 기대하는 경향이 있습니다.`,
      matchType: matchTypeAtoB,
      matchStatusNarrative:
        matchTypeAtoB === "NATURAL_MATCH"
          ? `${nameB}님이 그 역할을 자연스럽게 해내며, ${nameA}님이 마음 놓고 의지할 수 있는 조화를 만듭니다.`
          : matchTypeAtoB === "LATENT_MATCH"
          ? `${nameB}님에게 관련 포용 기질이 숨어있으나 일상의 피로로 드러나지 않을 수 있으니 편안한 환경을 만드는 것이 좋습니다.`
          : matchTypeAtoB === "ADAPTIVE_SUPPLY"
          ? `${nameB}님이 세심한 노력으로 기대에 맞춰주고 있으나, 이를 당연하게 받아들이면 지칠 수 있으니 노고를 알아주는 것이 필요합니다.`
          : `${nameB}님에게 모든 역할을 기대하기보다 두 사람이 대화로 판단 기준을 나누어 부담을 경감하는 것이 바람직합니다.`,
      expectationInsight: isEn
        ? `What ${nameA} seeks is shared presence, not unilateral burden.`
        : `${nameA}님이 파트너에게 원하는 핵심은 일방적인 해결이 아니라, 함께 짐을 지고 있다는 확신입니다.`,
    },
    {
      seekerName: nameB,
      partnerName: nameA,
      functionLabel: getFunctionLabel(topFuncB, isEn),
      whyItMatters: isEn
        ? `${nameB} implicitly seeks ${nameA}'s respect for ${topFuncB}.`
        : `${nameB}님은 자신의 개별 영역과 생각할 템포를 침범당하지 않으면서도, ${nameA}님이 든든한 기준이 되어주길 기대할 가능성이 있습니다.`,
      matchType: matchTypeBtoA,
      matchStatusNarrative:
        matchTypeBtoA === "NATURAL_MATCH"
          ? `${nameA}님이 그 영역을 잘 존중해주어, 각자의 고유함을 지키면서도 관계가 안정감을 유지합니다.`
          : matchTypeBtoA === "LATENT_MATCH"
          ? `${nameA}님이 존중의 마음을 가지고 있으나 표현방식의 차이로 의도치 않게 서운함을 줄 수 있습니다.`
          : matchTypeBtoA === "ADAPTIVE_SUPPLY"
          ? `${nameA}님이 ${nameB}님의 템포에 세심하게 맞춰주고 있는 상태이므로, 그 배려를 가볍게 여기지 않는 것이 중요합니다.`
          : `${nameB}님의 자율 템포를 인정하면서도 regular한 소통으로 기준의 간극을 줄여나가는 과정이 도움이 됩니다.`,
      expectationInsight: isEn
        ? `What ${nameB} seeks is respect for boundaries, not control.`
        : `${nameB}님이 파트너에게 바라는 핵심은 통제나 지적이 아니라, 내 고유함이 인정받고 있다는 느낌입니다.`,
    },
  ];

  // SECTION 3: Asset -> Debt Causal Chains
  const assetToDebtChains: AssetToDebtChain[] = [
    {
      title: isEn ? "Decisiveness shifting into heavy solo decision load" : "한 사람의 결단력이 장기적인 판단 부담으로 굳어지는 과정",
      initialBenefit: isEn ? "Provides relief and clarity during choices." : "처음에는 명확하게 방향을 제시해주어 상대방에게 큰 안도감과 신뢰를 줄 수 있습니다.",
      repeatedReinforcement: isEn ? "Decisions naturally fall onto one person over time." : "시간이 지나면서 거의 모든 가닥 잡기와 일상 선택 책임이 한 파트너에게 집중되는 패턴이 생기기 쉽습니다.",
      flipCondition: isEn ? "When the deciding partner feels burned out or isolated." : "방향을 이끄는 파트너가 고민을 나눌 데 없이 외로움을 느끼거나, 상대가 수동적으로 변할 때",
      longTermCost: isEn ? "One feels isolated in decisions, the other loses initiative." : "이끄는 파트너는 혼자 짐을 짊어진 중압감을 느끼고, 따르는 파트너는 주도성이 약해질 위험이 있습니다.",
    },
    {
      title: isEn ? "Space respect shifting into emotional distance" : "서로의 공간 존중이 감정적 거리감으로 이어지는 과정",
      initialBenefit: isEn ? "Keeps the relationship free of suffocation." : "처음에는 각자의 일상과 취향을 인정해주어 답답함 없는 편안한 관계를 만들어 줍니다.",
      repeatedReinforcement: isEn ? "Unresolved feelings might be brushed off to keep peace." : "불편한 감정이나 서운함을 제때 건드리지 않고 넘겨버리는 대화 스타일이 고착될 가능성이 있습니다.",
      flipCondition: isEn ? "When deep emotional empathy is needed during sudden crisis." : "정서적 공감이나 깊은 위로가 꼭 필요한 위기나 중요한 인생 전환기가 찾아왔을 때",
      longTermCost: isEn ? "Risk of polite coexistence without genuine emotional safety." : "한 공간에 살면서도 정작 마음의 가장 깊은 소리를 나누지 못하는 정서적 미지근함으로 쌓일 수 있습니다.",
    },
  ];

  // SECTION 4: Role Lock-In
  const roleLockIn: RoleLockInModel = {
    personARole: {
      personName: nameA,
      roleTitle: isEn ? "Direction guide & decision leader" : "방향 제시 및 의사결정 주도자",
      whyFormed: isEn ? `Formed by ${nameA}'s clear problem-solving drive.` : `${nameA}님의 명확한 주관과 문제 해결 욕구가 상대방에게 의지할 수 있는 안정감을 줄 수 있기 때문입니다.`,
      helpfulWhen: isEn ? "When swift alignment is needed." : "큰 결정이나 부부의 목표를 신속하게 정하고 추진해야 하는 순간",
      riskWhenLocked: isEn ? "When decision burden is carried alone." : `${nameA}님이 고민을 나누지 못한 채 혼자 판단 책임을 다 떠안게 될 때`,
    },
    personBRole: {
      personName: nameB,
      roleTitle: isEn ? "Emotional buffer & peace keeper" : "정서적 완충 및 분위기 조율자",
      whyFormed: isEn ? `Formed by ${nameB}'s warm acceptance.` : `${nameB}님의 다정한 수용력과 유연함이 관계의 마찰을 줄여주는 완충재 역할을 하기 때문입니다.`,
      helpfulWhen: isEn ? "De-escalating friction in everyday life." : "갈등 상황에서 분위기를 완화하고 편안히 쉴 수 있는 환경을 만들 때",
      riskWhenLocked: isEn ? "When personal feelings are suppressed." : `${nameB}님이 자신의 솔직한 서운함이나 주관을 억누르고 계속 맞추어주기만 할 때`,
    },
    pairSummary: isEn
      ? "Flexibility in swapping roles keeps the pair strong; static role lock-in breeds fatigue."
      : "두 사람의 역할이 유연하게 교대될 때는 둘도 없는 보완팀이 되지만, 한쪽만 결정을 내리고 한쪽만 맞춰주는 역할로 굳어지면 서서히 소진될 위험이 있습니다.",
  };

  // SECTION 5: Accumulated Relational Load (downstream linked from ADAPTIVE_SUPPLY)
  const isAdaptiveA = matchTypeBtoA === "ADAPTIVE_SUPPLY";
  const isAdaptiveB = matchTypeAtoB === "ADAPTIVE_SUPPLY";

  const accumulatedLoad: AccumulatedLoadModel = {
    personALoad: {
      personName: nameA,
      laborType: isAdaptiveA
        ? "상대의 템포에 내 방식과 주관을 억누르며 맞춰주는 의도적인 적응 노동"
        : "일상의 선택과 방향을 혼자서 판단하고 책임져야 하는 판단의 중압감",
      whyCostly: isAdaptiveA
        ? "내 자연스러운 기질과 다른 배려를 지속해서 가동하다 보면 나도 모르게 에너지가 탕진되기 때문입니다."
        : "계속해서 가닥을 잡는 역할을 맡다 보면, 나도 의지하고 싶을 때 마음을 내려놓기 어렵기 때문입니다.",
      earlyWarningSign: "작은 일에도 감정이 수축되거나 '왜 나만 다 신경 써야 하나'라는 생각이 불쑥 들 때",
    },
    personBLoad: {
      personName: nameB,
      laborType: isAdaptiveB
        ? "상대의 기대에 응하기 위해 내 무거운 마음을 참고 밝은 표정을 유지하는 정서적 수용 노동"
        : "상대의 템포나 요구에 맞추느라 내 솔직한 감정과 사생활 시간을 뒤로 미루는 노동",
      whyCostly: isAdaptiveB
        ? "자연스러운 상태가 아닌 배려를 계속 유지하다 보면 무의식적인 피로감이 쌓이기 때문입니다."
        : "마찰을 피하기 위해 내 반응을 억제하다 보면, 정작 내 마음에 안식을 얻기 어렵기 때문입니다.",
      earlyWarningSign: "대화 자체를 은연중에 피하게 되거나 혼자 있는 시간에만 비로소 안도감을 느낄 때",
    },
    loadBalanceNarrative: isEn
      ? "Relational load is not about who suffers more, but relieving each other's specific strain."
      : `누가 더 고생하느냐의 이분법이 아닙니다. ${nameA}님은 '결정 부담'에서, ${nameB}님은 '감정적 적응 부담'에서 서로의 짐을 가볍게 해주려는 양방향 노력이 핵심입니다.`,
  };

  // SECTION 6: Expectation Limits (downstream linked from ADAPTIVE_SUPPLY / EXPECTATION_GAP)
  const expectationLimits: ExpectationLimit[] = [
    {
      targetName: nameA,
      partnerName: nameB,
      limitedFunction: "매 순간 완벽하게 내 템포와 정돈 기준에 즉각 응해주기를 기대하는 것",
      whyCostlyToDemand: `${nameB}님 역시 각자의 고유한 편안함 기준이 있으므로, 세세한 실행 방식까지 내 기준을 강요하면 관계의 분위기가 경직될 수 있습니다.`,
      adaptiveSupplyNote: isAdaptiveB
        ? `${nameB}님이 노력을 통해 이미 성의껏 신경 쓰고 있는 상태이므로, 그 배려를 당연한 기본 기능으로 여기지 않는 정성이 필요합니다.`
        : undefined,
    },
    {
      targetName: nameB,
      partnerName: nameA,
      limitedFunction: "모든 막막함과 고민 앞에서 항상 흔들림 없는 냉철한 정답만 내놓기를 기대하는 것",
      whyCostlyToDemand: `${nameA}님 또한 혼자 모든 부담을 짊어질 수 없는 사람이므로, 때로는 판단의 막막함과 고민을 정직하게 나누어야 관계가 단단해집니다.`,
      adaptiveSupplyNote: isAdaptiveA
        ? `${nameA}님이 애써 기준을 잡아주고 있는 노고를 인정하고 가끔은 마음을 터놓을 수 있도록 들어주는 태도가 도움이 됩니다.`
        : undefined,
    },
  ];

  // SECTION 7: Asset/Debt Flip Table
  const flipTableRows: FlipTableRow[] = [
    {
      feature: "한 사람의 결단력 & 다른 사람의 포용력",
      whenAsset: "큰 결정을 신속하게 내리고 가정에 안정감이 유지될 때",
      whenDebt: "한 파트너에게만 결정 책임이 쏠리고 상대는 수동적이 될 때",
    },
    {
      feature: "서로의 사생활과 템포를 인정해 주는 쿨함",
      whenAsset: "답답함 없이 서로의 개인 시간을 기분 좋게 지켜줄 때",
      whenDebt: "깊은 정서적 서운함을 나누지 않고 방관하는 거리감으로 쌓일 때",
    },
    {
      feature: "갈등 상황을 무마하고 넘어가는 유연함",
      whenAsset: "불필요한 소모전 없이 일상의 평온을 지켜낼 때",
      whenDebt: "진짜 해결해야 할 오해가 쌓여 마음의 벽으로 고착될 때",
    },
  ];

  // SECTION 8: Long-Term Protection (STRICT CHAPTER 03 BOUNDARY - Relational role level, NO chore/financial rules)
  const protection: LongTermProtection = {
    assetToProtect: isEn
      ? "Preserving mutual trust as a safe emotional haven to let down one's guard."
      : "서로에게 돌아왔을 때 마음 편히 무장을 해제할 수 있는 정서적 안식처로서의 신뢰",
    roleToRenegotiate: isEn
      ? "Checking that one partner is not continuously carrying all decisions alone."
      : "한 파트너가 판단 책임을 전담하고 상대는 맞추기만 하는 역할 고착이 생기지 않았는지 주기적으로 돌아보기",
    effortToAppreciate: isEn
      ? `Recognizing ${nameB}'s adaptive effort and ${nameA}'s structural responsibility daily.`
      : `${nameB}님이 마찰을 피하기 위해 쏟는 정서적 노력과 ${nameA}님이 중심을 잡기 위해 지는 책임감을 서로 매일 알아주는 것`,
  };

  return {
    introQuestion: isEn
      ? "💡 What builds long-term strength and what accumulates as relational load across married life?"
      : "💡 지금은 작은 차이처럼 보여도, 오래 함께 살면 무엇은 우리를 더 단단하게 만들고 무엇은 서서히 부담으로 쌓일까요?",
    assets,
    hiddenExpectations,
    assetToDebtChains,
    roleLockIn,
    accumulatedLoad,
    expectationLimits,
    flipTableRows,
    protection,
  };
}

export function createDefaultMarriageChapter03Intelligence(nameA: string, nameB: string, isEn: boolean = false): MarriageChapter03Intelligence {
  return {
    introQuestion: isEn
      ? "💡 What builds long-term strength and what accumulates as relational load across married life?"
      : "💡 지금은 작은 차이처럼 보여도, 오래 함께 살면 무엇은 우리를 더 단단하게 만들고 무엇은 서서히 부담으로 쌓일까요?",
    assets: [
      {
        title: isEn ? `${nameA}'s direction & ${nameB}'s steady acceptance` : `${nameA}님의 방향 감각과 ${nameB}님의 안정적인 포용력`,
        mechanism: isEn ? "One partner providing clear direction while the other provides an emotional haven." : "한 사람이 관계의 큰 줄기와 결정을 잡아줄 때 상대방이 정서적 안식처가 되어주어, 시간이 흐를수록 부부로서의 역할이 서로를 보완합니다.",
        longTermValue: isEn ? "The strongest foundation that builds marital stability over decades." : "작은 마찰에 흔들리지 않고 함께 삶의 안정을 구축해 나가는 가장 단단한 자산이 됩니다.",
      },
      {
        title: isEn ? "Deepening trust through mutual space & independence" : "서로의 개인 공간과 독립성을 인정하는 서서히 깊어지는 신뢰",
        mechanism: isEn ? "Protecting each other's daily tempo rather than forcing total alignment." : "모든 일상을 강제로 공유하려 애쓰기보다 각자의 일상 템포를 지켜줄 때, 집으로 돌아왔을 때의 반가움과 안도감이 유지됩니다.",
        longTermValue: isEn ? "Prevents exhaustion and preserves genuine comfort over time." : "오래 함께 살아도 답답함이나 의무감에 지치지 않고 서로에게 가장 편안한 아군으로 남게 됩니다.",
      },
    ],
    hiddenExpectations: [
      {
        seekerName: nameA,
        partnerName: nameB,
        functionLabel: isEn ? "Expectation for clear judgment & emotional haven" : "결정의 순간 명확한 판단과 마음 편한 안식처가 되어주길 바라는 기대",
        whyItMatters: isEn ? `${nameA} implicitly seeks ${nameB}'s steady presence during critical decisions.` : `${nameA}님은 혼자서 삶의 부담을 전부 주도하기보다, 중요한 순간에 ${nameB}님이 단단하게 곁을 지켜주거나 마음을 들여다봐 주기를 은연중에 기대하기 쉽습니다.`,
        matchType: "NATURAL_MATCH",
        matchStatusNarrative: isEn ? `${nameB} naturally fulfills this role, creating deep reliability.` : `${nameB}님이 그 역할을 자연스럽게 해내며, ${nameA}님이 마음 놓고 의지할 수 있는 조화를 이룹니다.`,
        expectationInsight: isEn ? `What ${nameA} seeks is not blind agreement, but shared responsibility.` : `${nameA}님이 ${nameB}님에게 원하는 것은 무조건적인 동의가 아니라, 삶의 고민을 함께 짊어져 줄 존재라는 확신입니다.`,
      },
      {
        seekerName: nameB,
        partnerName: nameA,
        functionLabel: isEn ? "Expectation for space respect & steady boundary" : "내 방식과 영역을 존중해 주고 일상에서 안정적인 틀이 되어주길 바라는 기대",
        whyItMatters: isEn ? `${nameB} seeks privacy respect while benefiting from ${nameA}'s clear guidance.` : `${nameB}님은 자신의 사생활과 생각할 여유를 침범당하지 않으면서도, ${nameA}님이 든든한 울타리가 되어 관계를 이끌어주길 기대하는 경향이 있습니다.`,
        matchType: "NATURAL_MATCH",
        matchStatusNarrative: isEn ? `${nameA} respects this space while providing stability.` : `${nameA}님이 그 영역을 잘 존중해주며, 서로의 고유함을 지키는 안정감을 만듭니다.`,
        expectationInsight: isEn ? `What ${nameB} seeks is respect for individuality, not control.` : `${nameB}님이 ${nameA}님에게 바라는 것은 통제가 아니라 존중받고 있다는 느낌과 은은한 울타리입니다.`,
      },
    ],
    assetToDebtChains: [
      {
        title: isEn ? "Decisiveness turning into heavy burden" : "주도권과 의지의 명확함이 장기적인 판단 부담으로 굳어지는 과정",
        initialBenefit: isEn ? "Provides relief through clear guidance." : "처음에는 한 사람이 명확하게 길을 제시해주고 결정을 도와주어 상대방에게 큰 안도감과 신뢰를 줍니다.",
        repeatedReinforcement: isEn ? "Decision-making becomes concentrated on one person." : "시간이 지나면서 모든 선택과 방향 설정을 한 사람에게 몰아주는 것이 습관화됩니다.",
        flipCondition: "방향을 이끄는 파트너가 번아웃을 느끼거나, 다른 파트너가 자신의 의견이 반영되지 않는다고 느낄 때",
        longTermCost: "이끄는 사람은 혼자 짐을 짊어진 외로움을 느끼고, 따르는 사람은 주도성을 잃고 수동적이 될 수 있습니다.",
      },
      {
        title: "서로의 공간 존중이 감정적 수용의 거리감으로 이어지는 과정",
        initialBenefit: "처음에는 각자의 일상과 사생활을 깊이 인정해주어 답답함 없는 쿨하고 편안한 관계를 만들어 줍니다.",
        repeatedReinforcement: "서로의 무거운 감정이나 서운함을 제때 건드리지 않고 넘겨버리는 대화 패턴이 굳어집니다.",
        flipCondition: "정서적 공감이나 깊은 위로가 꼭 필요한 위기 상황이 찾아왔을 때",
        longTermCost: "한 지붕 아래 살면서도 가장 중요한 마음을 나누지 못하는 '친절한 방관' 상태가 될 수 있습니다.",
      },
    ],
    roleLockIn: {
      personARole: {
        personName: nameA,
        roleTitle: "방향 제시 및 의사결정 주도자",
        whyFormed: `${nameA}님의 명확한 기질과 문제 해결 욕구가 상대방에게 의지할 수 있는 안정감을 주었기 때문입니다.`,
        helpfulWhen: "이사, 재정 계획, 큰 삶의 선택 등 부부의 목표를 신속하게 정하고 추진해야 할 때",
        riskWhenLocked: `${nameA}님이 고민을 나눌 데 없이 혼자 판단 책임을 다 짊어지거나 지칠 때`,
      },
      personBRole: {
        personName: nameB,
        roleTitle: "정서적 완충 및 일상 분위기 수호자",
        whyFormed: `${nameB}님의 다정한 포용력과 유연함이 관계의 충격을 줄여주고 집안의 평온을 지켜주었기 때문입니다.`,
        helpfulWhen: "갈등 상황에서 분위기를 완화하고 서로가 마음 편히 쉴 수 있는 분위기를 만들 때",
        riskWhenLocked: `${nameB}님이 자신의 솔직한 서운함이나 주관을 억누르고 계속 맞춰주기만 할 때`,
      },
      pairSummary: "두 사람의 역할이 유연하게 교대될 때는 둘도 없는 보완팀이 되지만, 한쪽만 결정을 내리고 한쪽만 참아주는 구조로 굳어지면 서로 소진될 수 있습니다.",
    },
    accumulatedLoad: {
      personALoad: {
        personName: nameA,
        laborType: "일상의 선택과 방향을 혼자서 결정하고 책임져야 하는 중압감",
        whyCostly: "계속해서 판단을 내리고 조율하는 역할을 떠맡다 보면, 나도 의지하고 싶을 때 마음을 내려놓기 어렵기 때문입니다.",
        earlyWarningSign: "작은 일에도 짜증이 늘거나 '왜 나만 다 챙겨야 하나'라는 생각이 들 때",
      },
      personBLoad: {
        personName: nameB,
        laborType: "상대의 템포에 맞추느라 내 솔직한 감정과 개인 시간을 미루는 노동",
        whyCostly: "마찰을 피하기 위해 내 반응을 억제하다 보면, 정작 내가 필요로 하는 정서적 안식을 얻지 못하기 때문입니다.",
        earlyWarningSign: "대화 자체를 피하게 되거나 혼자 있는 시간에만 비로소 안도감을 느낄 때",
      },
      loadBalanceNarrative: `누구가 더 고생하느냐의 문제가 아닙니다. ${nameA}님은 '결정의 부담'에서, ${nameB}님은 '감정적 적응의 부담'에서 서로를 풀어주는 노력이 필요합니다.`,
    },
    expectationLimits: [
      {
        targetName: nameA,
        partnerName: nameB,
        limitedFunction: "매 순간 완벽한 자발성과 정돈 기준을 맞춰주기를 기대하는 것",
        whyCostlyToDemand: `${nameB}님도 각자의 템포와 편안함의 기준이 있으므로, 세세한 실행 방식까지 상대를 내 기준에 맞추려 하면 관계의 온도가 차가워집니다.`,
        adaptiveSupplyNote: `${nameB}님이 이미 세심하게 배려하고 있는 부분들을 당연하게 여기지 않고 인정해 주는 것이 중요합니다.`,
      },
      {
        targetName: nameB,
        partnerName: nameA,
        limitedFunction: "모든 고민 앞에서 항상 흔들림 없이 냉철한 정답만 내놓기를 기대하는 것",
        whyCostlyToDemand: `${nameA}님 역시 혼자 모든 것을 짊어질 수 없는 사람이며, 때로는 결정의 고민과 막막함을 함께 나누어야 하는 파트너입니다.`,
      },
    ],
    flipTableRows: [
      {
        feature: "한 사람의 결단력 & 다른 사람의 포용력",
        whenAsset: "큰 결정을 빠르게 내리고 집안에 안정감이 유지될 때",
        whenDebt: "한 사람에게만 결정 책임이 쏠리고 상대는 수동적이 될 때",
      },
      {
        feature: "서로의 사생활과 개인 공간을 존중하는 쿨함",
        whenAsset: "답답함 없이 서로의 개인 시간을 기분 좋게 지켜줄 때",
        whenDebt: "깊은 정서적 서운함을 나누지 않고 방관하게 될 때",
      },
      {
        feature: "갈등을 크지 않게 무마하고 넘어가는 유연함",
        whenAsset: "불필요한 소모전 없이 일상의 평온을 지켜낼 때",
        whenDebt: "진짜 해결해야 할 오해가 쌓여 마음의 벽이 생길 때",
      },
    ],
    protection: {
      assetToProtect: "서로에게 돌아왔을 때 안전하고 마음 편히 쉴 수 있는 '정서적 무장해제 공간'으로서의 신뢰",
      roleToRenegotiate: "한 파트너가 판단 책임을 전담하고 상대는 맞추기만 하는 역할 고착이 생기지 않았는지 주기적으로 돌아보기",
      effortToAppreciate: `${nameB}님이 마찰을 피하고 평온을 위해 쏟는 정서적 노력과 ${nameA}님이 중심을 잡기 위해 지는 책임감을 매일 알아주는 것`,
    },
  };
}
