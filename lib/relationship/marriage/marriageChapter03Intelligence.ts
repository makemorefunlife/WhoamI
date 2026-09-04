import type { Locale } from "@/lib/i18n/locale";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { MarriageRuleContext } from "./buildMarriageRuleContext";
import { resolveSpousePalaceProfile } from "@/lib/relationship/romantic/prototypeV4/spousePalaceMatcher";
import { calculateTenGod, getHiddenStemsData } from "@/lib/saju/repository";
import { resolveDirectionalMarriageRole } from "./marriageEvidenceResolution";

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

  // Who actually supplies direction/decisiveness vs. emotional-safety/
  // acceptance — compared from each person's OWN real Saju-derived supply
  // score (evaluateSajuInnateNeedAndSupply above), never assigned by
  // argument slot. Below the gap gate, both roles resolve to "shared" —
  // matching the abstention behavior already used by
  // enrichment/marriageSajuGapInsights.ts — rather than forcing a
  // complementary split the evidence doesn't support.
  const GAP_GATE = 0.15;
  const directionRole = resolveDirectionalMarriageRole({
    scoreA: sajuA.supplies.direction ?? 0.5,
    scoreB: sajuB.supplies.direction ?? 0.5,
    gapGate: GAP_GATE,
    roleForHigher: "a",
    roleForLower: "b",
    sharedRole: "shared",
    source: "SAJU",
  });
  const bufferRole = resolveDirectionalMarriageRole({
    scoreA: sajuA.supplies.emotional_safety ?? 0.5,
    scoreB: sajuB.supplies.emotional_safety ?? 0.5,
    gapGate: GAP_GATE,
    roleForHigher: "a",
    roleForLower: "b",
    sharedRole: "shared",
    source: "SAJU",
  });
  const directionName = directionRole.actor === "a" ? nameA : directionRole.actor === "b" ? nameB : null;
  const bufferName = bufferRole.actor === "a" ? nameA : bufferRole.actor === "b" ? nameB : null;
  // "Complementary" (one leads direction, the OTHER buffers) only when the
  // two roles land on different people; if the same person supplies both,
  // or either gap was too weak to call, this isn't a real complementary
  // pattern and the asset/role text below must not pretend it is one.
  const hasComplementarySplit =
    directionName != null && bufferName != null && directionName !== bufferName;

  // SECTION 1: Relationship Assets
  const assets: RelationalAsset[] = [
    hasComplementarySplit
      ? {
          title: isEn
            ? `${directionName}'s direction & ${bufferName}'s steady acceptance`
            : `${directionName}님의 방향 감각과 ${bufferName}님의 수용적 포용력`,
          mechanism: isEn
            ? "One partner provides clear direction while the other offers an emotional haven."
            : "한 사람이 부부 관계의 선택을 이끌어줄 때 상대방이 마음을 보듬어주는 안식처가 되어주어, 시간이 흐를수록 서로의 부족함을 보완하는 자산이 될 수 있습니다.",
          longTermValue: isEn
            ? "Solidifies marital trust and stability against minor friction."
            : "작은 마찰에 흔들리지 않고 함께 삶의 안정을 구축해 나가는 단단한 자산으로 누적될 가능성이 높습니다.",
        }
      : {
          title: isEn ? `${nameA} and ${nameB}'s shared footing` : `${nameA}님과 ${nameB}님의 고르게 나눠진 기반`,
          mechanism: isEn
            ? "Neither partner leans on the other for direction or emotional steadiness alone — both contribute to each, depending on the moment."
            : "방향을 잡는 역할과 마음을 다독이는 역할 어느 쪽도 한 사람에게 쏠려 있지 않아, 상황에 따라 두 사람이 번갈아 그 역할을 맡습니다.",
          longTermValue: isEn
            ? "Reduces the risk of either partner feeling solely responsible for keeping the relationship steady."
            : "관계의 중심을 잡는 부담이 한쪽으로만 쏠리지 않아, 장기적으로 소진 위험이 낮아집니다.",
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

  // SECTION 4: Role Lock-In — derived from directionRole/bufferRole above,
  // never assigned by which argument slot (A/B) a person occupies. When the
  // evidence doesn't support a real complementary split, both people get
  // the same neutral, shared-role framing instead of an invented persona.
  const directionRoleTitle = isEn ? "Direction guide & decision leader" : "방향 제시 및 의사결정 주도자";
  const bufferRoleTitle = isEn ? "Emotional buffer & peace keeper" : "정서적 완충 및 분위기 조율자";
  const sharedRoleTitle = isEn ? "Co-owns both direction and reassurance" : "방향 제시와 정서적 안정 모두를 함께 나누는 역할";

  function buildPersonRelationalRole(
    personName: string,
    isDirectionLead: boolean,
    isBufferLead: boolean,
  ): PersonRelationalRole {
    if (isDirectionLead && !isBufferLead) {
      return {
        personName,
        roleTitle: directionRoleTitle,
        whyFormed: isEn
          ? `Formed by ${personName}'s own Saju-evidenced drive toward direction and problem-solving.`
          : `${personName}님 자신의 사주에서 방향 제시와 문제 해결 쪽으로 실제 기울어진 공급력이 확인되기 때문입니다.`,
        helpfulWhen: isEn ? "When swift alignment is needed." : "큰 결정이나 부부의 목표를 신속하게 정하고 추진해야 하는 순간",
        riskWhenLocked: isEn ? "When decision burden is carried alone." : `${personName}님이 고민을 나누지 못한 채 혼자 판단 책임을 다 떠안게 될 때`,
      };
    }
    if (isBufferLead && !isDirectionLead) {
      return {
        personName,
        roleTitle: bufferRoleTitle,
        whyFormed: isEn
          ? `Formed by ${personName}'s own Saju-evidenced supply of emotional safety and acceptance.`
          : `${personName}님 자신의 사주에서 정서적 안정과 수용 쪽으로 실제 기울어진 공급력이 확인되기 때문입니다.`,
        helpfulWhen: isEn ? "De-escalating friction in everyday life." : "갈등 상황에서 분위기를 완화하고 편안히 쉴 수 있는 환경을 만들 때",
        riskWhenLocked: isEn ? "When personal feelings are suppressed." : `${personName}님이 자신의 솔직한 서운함이나 주관을 억누르고 계속 맞추어주기만 할 때`,
      };
    }
    return {
      personName,
      roleTitle: sharedRoleTitle,
      whyFormed: isEn
        ? `${personName}'s own evidence doesn't lean clearly toward one role over the other, or matches their partner's — this couple doesn't split direction/reassurance by person.`
        : `${personName}님의 실제 근거가 한쪽 역할로 뚜렷하게 기울어 있지 않거나 상대방과 비슷하여, 이 부부는 방향 제시와 정서적 안정을 한 사람에게 고정하지 않습니다.`,
      helpfulWhen: isEn ? "Any moment either role is needed — both partners can step in." : "방향 제시나 정서적 안정, 어느 쪽이 필요하든 두 사람 모두 자연스럽게 나설 수 있는 순간",
      riskWhenLocked: isEn ? "If one role is forced onto one person despite the shared evidence." : `실제로는 고르게 나뉘어 있는데도 한 사람에게 특정 역할을 억지로 고정하려 할 때`,
    };
  }

  const roleLockIn: RoleLockInModel = {
    personARole: buildPersonRelationalRole(nameA, directionRole.actor === "a", bufferRole.actor === "a"),
    personBRole: buildPersonRelationalRole(nameB, directionRole.actor === "b", bufferRole.actor === "b"),
    pairSummary: hasComplementarySplit
      ? (isEn
          ? "Flexibility in swapping roles keeps the pair strong; static role lock-in breeds fatigue."
          : "두 사람의 역할이 유연하게 교대될 때는 둘도 없는 보완팀이 되지만, 한쪽만 결정을 내리고 한쪽만 맞춰주는 역할로 굳어지면 서서히 소진될 위험이 있습니다.")
      : (isEn
          ? "Since both roles are already shared rather than split by person, the main thing to protect is making sure that stays true under stress, not just by default."
          : "두 역할이 이미 한 사람에게 쏠려 있지 않으므로, 스트레스 상황에서도 이 균형이 저절로가 아니라 의식적으로 유지되도록 신경 쓰는 것이 중요합니다."),
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

/**
 * True missing-data fallback (no ctx/psych available at all — see
 * buildMarriageReportViewModel.ts's use of this only when the canonical
 * bundle's own chapter03Intelligence is absent). Because there is no
 * evidence to read here, every role/labor/expectation below is
 * deliberately SHARED/neutral rather than split between nameA and nameB —
 * a fallback must never invent which person is "the decisive one" or "the
 * emotional buffer" when it has no data to base that on.
 */
export function createDefaultMarriageChapter03Intelligence(nameA: string, nameB: string, isEn: boolean = false): MarriageChapter03Intelligence {
  return {
    introQuestion: isEn
      ? "💡 What builds long-term strength and what accumulates as relational load across married life?"
      : "💡 지금은 작은 차이처럼 보여도, 오래 함께 살면 무엇은 우리를 더 단단하게 만들고 무엇은 서서히 부담으로 쌓일까요?",
    assets: [
      {
        title: isEn ? `${nameA} and ${nameB}'s shared footing` : `${nameA}님과 ${nameB}님의 고르게 나눠진 기반`,
        mechanism: isEn
          ? "Without more information about each person's own tendencies, direction-setting and emotional steadiness are best treated as shared, not assigned to one person."
          : "각자의 실제 성향에 대한 추가 정보 없이는, 방향을 잡는 역할과 마음을 다독이는 역할을 한 사람에게 미리 나누기보다 함께 나누는 것으로 보는 것이 안전합니다.",
        longTermValue: isEn
          ? "Avoids locking either partner into a role neither evidence nor experience has actually confirmed."
          : "실제 근거로 확인되지 않은 역할을 어느 한쪽에 미리 고정하지 않아, 장기적으로 더 안전합니다.",
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
        functionLabel: isEn ? "Expectation for steady support" : "든든하게 곁을 지켜주길 바라는 기대",
        whyItMatters: isEn ? `${nameA} may implicitly seek ${nameB}'s steady presence during hard moments — this is a general pattern, not confirmed for this pair specifically.` : `${nameA}님은 힘든 순간에 ${nameB}님이 곁을 지켜주길 은연중에 기대할 수 있습니다 — 이 부부에 특정된 확인은 아니라, 일반적인 경향으로 안내합니다.`,
        matchType: "EXPECTATION_GAP",
        matchStatusNarrative: isEn ? `Without more data, it's best for both of you to name this expectation out loud rather than assume it.` : `추가 정보가 없으므로, 이 기대를 서로 짐작하기보다 직접 말로 확인해보는 것이 좋습니다.`,
        expectationInsight: isEn ? `What matters most is shared presence, not which one of you provides it.` : `중요한 것은 함께한다는 확신이지, 그 역할을 누가 맡느냐가 아닙니다.`,
      },
      {
        seekerName: nameB,
        partnerName: nameA,
        functionLabel: isEn ? "Expectation for respected space" : "내 영역을 존중해주길 바라는 기대",
        whyItMatters: isEn ? `${nameB} may implicitly seek room for their own pace — again, a general pattern rather than something confirmed for this pair.` : `${nameB}님은 자신의 템포를 존중받길 은연중에 기대할 수 있습니다 — 이 부부에 특정된 확인은 아닙니다.`,
        matchType: "EXPECTATION_GAP",
        matchStatusNarrative: isEn ? `Naming this directly works better than assuming either of you already knows.` : `서로 이미 알고 있다고 짐작하기보다, 직접 이야기해보는 것이 더 정확합니다.`,
        expectationInsight: isEn ? `What matters is respect for individuality, not control.` : `중요한 것은 통제가 아니라 서로의 고유함을 존중하는 것입니다.`,
      },
    ],
    assetToDebtChains: [
      {
        title: isEn ? "Unshared direction-setting turning into a solo burden" : "방향을 잡는 역할이 한쪽에 쏠려 부담으로 굳어지는 과정",
        initialBenefit: isEn ? "Provides relief and clarity during choices, whoever leads at the time." : "누가 이끌든, 처음에는 선택의 순간에 안도감과 명확함을 줍니다.",
        repeatedReinforcement: isEn ? "If the same person always leads by default rather than by an actual established strength, it can quietly become expected." : "실제로 확인된 강점이 아니라 그저 기본값으로 항상 같은 사람이 이끌게 되면, 어느새 당연한 일로 굳어질 수 있습니다.",
        flipCondition: isEn ? "When the leading partner feels burned out or unheard." : "이끄는 쪽이 소진감을 느끼거나 의견이 반영되지 않는다고 느낄 때",
        longTermCost: isEn ? "One feels isolated in decisions, the other loses initiative — regardless of who that ends up being." : "그것이 누구든, 한쪽은 혼자 결정하는 고립감을, 다른 쪽은 주도성 상실을 느낄 위험이 있습니다.",
      },
      {
        title: isEn ? "Space respect shifting into emotional distance" : "서로의 공간 존중이 감정적 거리감으로 이어지는 과정",
        initialBenefit: isEn ? "Keeps the relationship free of suffocation." : "처음에는 각자의 일상과 취향을 인정해주어 답답함 없는 편안한 관계를 만들어 줍니다.",
        repeatedReinforcement: isEn ? "Unresolved feelings might be brushed off to keep peace." : "불편한 감정이나 서운함을 제때 건드리지 않고 넘겨버리는 대화 스타일이 고착될 가능성이 있습니다.",
        flipCondition: isEn ? "When deep emotional empathy is needed during sudden crisis." : "정서적 공감이나 깊은 위로가 꼭 필요한 위기 상황이 찾아왔을 때",
        longTermCost: isEn ? "Risk of polite coexistence without genuine emotional safety." : "한 지붕 아래 살면서도 가장 중요한 마음을 나누지 못하는 '친절한 방관' 상태가 될 수 있습니다.",
      },
    ],
    roleLockIn: {
      personARole: {
        personName: nameA,
        roleTitle: isEn ? "Co-owns both direction and reassurance" : "방향 제시와 정서적 안정 모두를 함께 나누는 역할",
        whyFormed: isEn ? "No person-specific evidence is available yet to assign a distinct role." : "역할을 구분할 만한 개인별 근거가 아직 없습니다.",
        helpfulWhen: isEn ? "Any moment either role is needed." : "방향 제시나 정서적 안정, 어느 쪽이 필요하든",
        riskWhenLocked: isEn ? "If a role gets assumed by default rather than confirmed." : "확인 없이 기본값으로 특정 역할이 굳어질 때",
      },
      personBRole: {
        personName: nameB,
        roleTitle: isEn ? "Co-owns both direction and reassurance" : "방향 제시와 정서적 안정 모두를 함께 나누는 역할",
        whyFormed: isEn ? "No person-specific evidence is available yet to assign a distinct role." : "역할을 구분할 만한 개인별 근거가 아직 없습니다.",
        helpfulWhen: isEn ? "Any moment either role is needed." : "방향 제시나 정서적 안정, 어느 쪽이 필요하든",
        riskWhenLocked: isEn ? "If a role gets assumed by default rather than confirmed." : "확인 없이 기본값으로 특정 역할이 굳어질 때",
      },
      pairSummary: isEn
        ? "Without more data, treat direction-setting and emotional steadiness as shared until real evidence says otherwise."
        : "추가 근거가 확인되기 전까지는, 방향 제시와 정서적 안정 모두 한쪽에 미리 고정하지 말고 함께 나누는 것으로 보는 것이 안전합니다.",
    },
    accumulatedLoad: {
      personALoad: {
        personName: nameA,
        laborType: isEn ? "Whatever load ends up unevenly distributed, from either direction-setting or emotional adjustment." : "방향 제시든 감정적 조율이든, 실제로 한쪽에 쏠리게 되는 부담",
        whyCostly: isEn ? "Any role carried alone for too long, without acknowledgment, tends to wear a person down." : "어떤 역할이든 인정받지 못한 채 혼자 오래 짊어지면 지치기 마련입니다.",
        earlyWarningSign: isEn ? "A rising sense of 'why am I always the one doing this.'" : "'왜 항상 나만 이걸 해야 하나'라는 생각이 늘어날 때",
      },
      personBLoad: {
        personName: nameB,
        laborType: isEn ? "Whatever load ends up unevenly distributed, from either direction-setting or emotional adjustment." : "방향 제시든 감정적 조율이든, 실제로 한쪽에 쏠리게 되는 부담",
        whyCostly: isEn ? "Any role carried alone for too long, without acknowledgment, tends to wear a person down." : "어떤 역할이든 인정받지 못한 채 혼자 오래 짊어지면 지치기 마련입니다.",
        earlyWarningSign: isEn ? "A rising sense of 'why am I always the one doing this.'" : "'왜 항상 나만 이걸 해야 하나'라는 생각이 늘어날 때",
      },
      loadBalanceNarrative: isEn
        ? "It isn't about who works harder in the abstract — it's about noticing, together, whichever load has actually settled onto one of you."
        : `누가 더 고생하느냐의 추상적인 문제가 아니라, 실제로 어느 쪽에 부담이 쏠렸는지를 두 사람이 함께 알아차리는 것이 중요합니다.`,
    },
    expectationLimits: [
      {
        targetName: nameA,
        partnerName: nameB,
        limitedFunction: isEn ? "Expecting a partner to match your exact standards without ever discussing them." : "논의 없이 상대가 내 기준에 정확히 맞춰주기를 기대하는 것",
        whyCostlyToDemand: isEn ? `${nameB} has their own tempo and comfort standards; demanding an exact match cools the relationship down.` : `${nameB}님도 자신만의 템포와 편안함의 기준이 있으므로, 정확한 일치를 요구하면 관계의 온도가 차가워집니다.`,
        adaptiveSupplyNote: isEn ? `Notice and name what ${nameB} is already doing, rather than treating it as a given.` : `${nameB}님이 이미 하고 있는 노력을 당연하게 여기지 않고 알아봐 주는 것이 중요합니다.`,
      },
      {
        targetName: nameB,
        partnerName: nameA,
        limitedFunction: isEn ? "Expecting a partner to always have a calm, certain answer." : "항상 흔들림 없이 확실한 답만 내놓기를 기대하는 것",
        whyCostlyToDemand: isEn ? `${nameA} also can't carry every decision alone — sometimes the uncertainty needs to be shared, not resolved on demand.` : `${nameA}님 역시 모든 결정을 혼자 짊어질 수 없으며, 때로는 막막함 자체를 함께 나눠야 하는 파트너입니다.`,
      },
    ],
    flipTableRows: [
      {
        feature: isEn ? "Whoever leads a given decision" : "그때그때 결정을 이끄는 쪽",
        whenAsset: isEn ? "A big decision gets made quickly and the household feels steady." : "큰 결정을 빠르게 내리고 집안에 안정감이 유지될 때",
        whenDebt: isEn ? "The same person ends up leading by default, every time, without it ever being discussed." : "논의 없이 같은 사람이 매번 기본값으로 이끌게 될 때",
      },
      {
        feature: isEn ? "Respecting each other's privacy and personal space" : "서로의 사생활과 개인 공간을 존중하는 것",
        whenAsset: isEn ? "Personal time is protected without resentment." : "답답함 없이 서로의 개인 시간을 기분 좋게 지켜줄 때",
        whenDebt: isEn ? "Real emotional concerns go unaddressed because space is used to avoid them." : "깊은 정서적 서운함을 나누지 않고 방관하게 될 때",
      },
      {
        feature: isEn ? "Letting small conflicts pass without escalating" : "작은 갈등을 키우지 않고 넘어가는 것",
        whenAsset: isEn ? "Day-to-day peace is preserved without unnecessary friction." : "불필요한 소모전 없이 일상의 평온을 지켜낼 때",
        whenDebt: isEn ? "Real misunderstandings accumulate unresolved instead." : "진짜 해결해야 할 오해가 쌓여 마음의 벽이 생길 때",
      },
    ],
    protection: {
      assetToProtect: isEn ? "The trust that this is a safe place to fully let your guard down when you come back to each other." : "서로에게 돌아왔을 때 안전하고 마음 편히 쉴 수 있는 '정서적 무장해제 공간'으로서의 신뢰",
      roleToRenegotiate: isEn ? "Periodically check whether one partner has quietly taken on all the deciding while the other only adapts." : "한 파트너가 판단 책임을 전담하고 상대는 맞추기만 하는 역할 고착이 생기지 않았는지 주기적으로 돌아보기",
      effortToAppreciate: isEn ? "Whatever effort either of you is actually putting in — acknowledge it explicitly rather than assuming it by role." : `${nameA}님과 ${nameB}님 각자가 실제로 들이는 노력을, 역할로 짐작하지 말고 서로 직접 알아봐 주는 것`,
    },
  };
}
