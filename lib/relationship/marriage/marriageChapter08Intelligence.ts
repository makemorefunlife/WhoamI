import type { BuildTimingFactsOptions } from "@/lib/saju/timing/types";
import {
  buildTimingFacts,
  buildTimingCanonicalEvidence,
} from "@/lib/saju/timing";
import {
  buildIndividualTimingResponse,
  type PsychScoresInput,
  type IndividualTimingResponse,
} from "@/lib/saju/timing/response/buildIndividualTimingResponse";
import {
  buildCoupleTimingModel,
  type CoupleTimingModel,
} from "@/lib/saju/timing/pair/buildCoupleTimingModel";
import type { Locale } from "@/lib/i18n/locale";
import { pick, LEGACY_FALLBACK_LOCALE } from "./marriageCopy";

// --- Final 5-Section Data Interfaces ---

export type CurrentPeriodSectionData = {
  personA: { name: string; headline: string; description: string };
  personB: { name: string; headline: string; description: string };
  pair: { headline: string; description: string };
};

export type RelationshipThemeItem = {
  id: string;
  title: string;
  description: string;
  evidenceIds: string[];
};

export type YearlyForecastCard = {
  year: number;
  yearLabel: string;
  badge?: string; // e.g. "속도 맞추기", "다음 방향 정돈", "새 방향 실행"
  personA: { name: string; summary: string };
  personB: { name: string; summary: string };
  pair: { summary: string };
};

export type TurningPointSectionData = {
  year: number;
  headline: string;
  reason: string;
  forPersonA: string;
  forPersonB: string;
  forPair: string;
};

export type ActionGuideSectionData = {
  forPersonA: { name: string; advice: string };
  forPersonB: { name: string; advice: string };
  forPair: { advice: string };
};

export type MajorFindingProvenance = {
  sectionId: string;
  userConclusion: string;
  personATimingEvidence: string[];
  personBTimingEvidence: string[];
  psychEvidence: string[];
  pairState: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
};

export type MarriageChapter08Intelligence = {
  introSentence: string;
  section01CurrentPeriod: CurrentPeriodSectionData;
  section02RelationshipThemes: RelationshipThemeItem[]; // Max 2
  section03ThreeYearForecast: YearlyForecastCard[]; // 3 years (absorbs speed contrast)
  section04TurningPoint: TurningPointSectionData | null; // Dynamic major turning point
  section05ActionGuide: ActionGuideSectionData; // Action translation
  provenance: MajorFindingProvenance[];
};

export type BuildMarriageChapter08Input = {
  personAOptions: BuildTimingFactsOptions;
  personBOptions: BuildTimingFactsOptions;
  psychInputA?: PsychScoresInput;
  psychInputB?: PsychScoresInput;
  names: [string, string]; // [Person A Name, Person B Name]
  targetYears?: number[];
  locale?: Locale;
};

/**
 * Marriage Chapter 08 Intelligence Engine.
 * 5-Section Ownership & Human Copy Polish:
 * 01. 지금 우리는 어떤 시기를 지나고 있을까? (Current State ONLY)
 * 02. 올해 우리 관계에서 무엇이 중요해질까? (Relationship Operation Implication - Max 2)
 * 03. 앞으로 3년, 우리 관계의 흐름 (3-Year Timeline - 2027 Pre-Transition vs 2028 Post-Transition Differentiated)
 * 04. 우리에게 찾아오는 가장 중요한 변곡점 (Dynamic Turning Point - Broad Relationship Priorities Scope)
 * 05. 이 흐름을 우리 편으로 만드는 법 (Action Translation - Concrete Couple Mechanism)
 */
export function buildMarriageChapter08Intelligence(
  input: BuildMarriageChapter08Input,
): MarriageChapter08Intelligence {
  const {
    personAOptions,
    personBOptions,
    psychInputA,
    psychInputB,
    names,
    targetYears = [new Date().getFullYear(), new Date().getFullYear() + 1, new Date().getFullYear() + 2],
    locale = LEGACY_FALLBACK_LOCALE,
  } = input;

  const [nameA, nameB] = names;

  // 1. Pipeline Layer 1 & 2: Build Shared Timing Facts & Evidence Package
  const factsA = buildTimingFacts({
    ...personAOptions,
    fromYear: targetYears[0],
    toYear: targetYears[targetYears.length - 1],
  });
  const evidenceA = buildTimingCanonicalEvidence(factsA);

  const factsB = buildTimingFacts({
    ...personBOptions,
    fromYear: targetYears[0],
    toYear: targetYears[targetYears.length - 1],
  });
  const evidenceB = buildTimingCanonicalEvidence(factsB);

  // 2. Pipeline Layer 3: Build Individual Timing Responses for Target Years
  const responsesA: IndividualTimingResponse[] = targetYears.map((yr) =>
    buildIndividualTimingResponse({
      timingFacts: factsA,
      evidencePackage: evidenceA,
      psychInput: psychInputA,
      targetYear: yr,
    }),
  );

  const responsesB: IndividualTimingResponse[] = targetYears.map((yr) =>
    buildIndividualTimingResponse({
      timingFacts: factsB,
      evidencePackage: evidenceB,
      psychInput: psychInputB,
      targetYear: yr,
    }),
  );

  // 3. Pipeline Layer 4: Build Couple Timing Model
  const coupleModel: CoupleTimingModel = buildCoupleTimingModel({
    personAFacts: factsA,
    personBFacts: factsB,
    personAResponses: responsesA,
    personBResponses: responsesB,
    targetYears,
  });

  const provenanceList: MajorFindingProvenance[] = [];

  // --- Intro Sentence ---
  const introSentence = pick(
    locale,
    "Here's a look at what shifts are coming for each of you over the next few years, starting from this year, and what those shifts mean for your relationship.",
    "올해부터 앞으로 몇 년 동안 각자에게 어떤 변화의 흐름이 들어오고, 그 변화가 두 사람의 관계에는 어떤 의미가 있을지 살펴봅니다.",
  );

  // --- 01. Section 01: 지금 우리는 어떤 시기를 지나고 있을까? ---
  // OWNERSHIP: Current state ONLY. No future predictions, no turning point, no advice.
  const currentYear = targetYears[0]!;
  const currentRespA = responsesA.find((r) => r.year === currentYear)!;
  const currentRespB = responsesB.find((r) => r.year === currentYear)!;
  const currentPairState = coupleModel.yearlyStates.find((y) => y.year === currentYear)!;

  const headlineA = currentRespA.responseProfile.pressureResponse
    ? pick(locale, "A time to set standards calmly rather than rush", "서두르기보다 차분히 틀과 기준을 세우는 시기")
    : currentRespA.responseProfile.changeResponse
    ? pick(locale, "A time to respond steadily by carefully checking the conditions first", "조건을 신중하게 확인하며 안정적으로 응대하는 시기")
    : pick(locale, "A time to build a solid foundation and watch how things unfold carefully", "내실을 다지며 신중하게 흐름을 관망하는 시기");

  const descA = pick(
    locale,
    `${nameA} is in a period of checking plans and conditions first and setting standards, rather than deciding things hastily.`,
    `${nameA}님은 주변 상황에서 조급히 결정하기보다, 계획과 조건을 먼저 확인하며 기준을 잡으려는 때입니다.`,
  );

  const headlineB = currentRespB.responseProfile.actionResponse
    ? pick(locale, "A time to actively explore new attempts and take action", "새로운 시도와 실행을 주도적으로 탐색하는 시기")
    : currentRespB.responseProfile.changeResponse
    ? pick(locale, "A time to flexibly take in new currents", "새로운 흐름을 유연하게 받아들이는 시기")
    : pick(locale, "A time to explore what's next and try things out lightly", "다음 흐름을 모색하며 가볍게 시도해보는 시기");

  const descB = pick(
    locale,
    `${nameB} is in a period of growing motivation to explore new possibilities and move quickly and lightly.`,
    `${nameB}님은 새로운 가능성을 탐색하며 가볍고 신속하게 움직여보려는 의욕이 커지는 때입니다.`,
  );

  const pairHeadline = pick(locale, "One of you is calmly setting standards while the other explores new attempts", `한 사람은 차분히 기준을 잡고, 다른 사람은 새로운 시도를 모색하는 시기`);
  const pairDesc = pick(
    locale,
    `${nameA} and ${nameB} are moving at a different tempo when it comes to deciding and acting, so it matters to recognize and respect each other's pace.`,
    `${nameA}님과 ${nameB}님이 생각을 결정하고 움직이는 템포에 차이가 있으므로, 서로의 속도를 인정해주는 호흡이 중요합니다.`,
  );

  const section01CurrentPeriod: CurrentPeriodSectionData = {
    personA: { name: nameA, headline: headlineA, description: descA },
    personB: { name: nameB, headline: headlineB, description: descB },
    pair: { headline: pairHeadline, description: pairDesc },
  };

  provenanceList.push({
    sectionId: "section01CurrentPeriod",
    userConclusion: pairHeadline,
    personATimingEvidence: currentRespA.evidenceRefs,
    personBTimingEvidence: currentRespB.evidenceRefs,
    psychEvidence: [
      ...(currentRespA.responseProfile.pressureResponse?.contributingPsychAxes ?? []),
      ...(currentRespB.responseProfile.actionResponse?.contributingPsychAxes ?? []),
    ],
    pairState: currentPairState.pairState,
    confidence: "HIGH",
  });

  // --- 02. Section 02: 올해 우리 관계에서 무엇이 중요해질까? ---
  // OWNERSHIP: Relationship Operation Implication for current year (Max 2 based on evidence).
  // Strictly NO repeating Section 01's individual trait descriptions ("A는 신중 / B는 시도").
  const section02RelationshipThemes: RelationshipThemeItem[] = [];

  if (currentPairState.pairState === "DIFFERENT_SPEED" || currentPairState.pairState === "SUPPORTIVE_ASYMMETRY") {
    section02RelationshipThemes.push({
      id: "theme_decision_timing",
      title: pick(locale, "The year when it matters to agree on when to finalize decisions together", "결정을 언제 함께 확정할지가 중요해지는 해"),
      description: pick(
        locale,
        `${nameA} and ${nameB} may have different decision-making tempos, so it gets much easier once you separate the moment an idea is floated from the moment a decision actually gets locked in.`,
        `${nameA}님과 ${nameB}님의 결정 템포가 다를 수 있으므로, 아이디어를 꺼내는 시점과 실제 결정을 확정하는 시점을 구분하여 논의하면 훨씬 편안해집니다.`,
      ),
      evidenceIds: [...currentPairState.personAEvidenceIds, ...currentPairState.personBEvidenceIds],
    });
  }

  if (currentPairState.pairState === "ONE_PARTNER_TRANSITION" || currentPairState.pairState === "MUTUAL_TRANSITION") {
    const changingPartnerName = currentPairState.primaryChangingSide === "PERSON_A" ? nameA : nameB;
    section02RelationshipThemes.push({
      id: "theme_transition",
      title: pick(locale, "The year to reorganize your priorities for the road ahead", "앞으로 나아갈 삶의 우선순위를 재정돈하는 해"),
      description: pick(
        locale,
        `As ${changingPartnerName} moves away from a familiar rhythm and starts shaping the next stage, it becomes more important for both of you to refine the values and roles you'll prioritize going forward.`,
        `${changingPartnerName}님이 익숙했던 흐름에서 벗어나 다음 단계를 구상함에 따라, 두 사람이 앞으로 중요하게 둘 가치와 역할을 다듬어갈 필요가 커집니다.`,
      ),
      evidenceIds: currentPairState.timingEvidenceB,
    });
  }

  // Fallback to stability balance if only 1 theme exists
  if (section02RelationshipThemes.length < 2) {
    section02RelationshipThemes.push({
      id: "theme_stability_balance",
      title: pick(locale, "Balancing what's already working with staying open to new options", "지금 잘 굴러가는 방식을 지키면서도 새로운 선택지를 여는 균형"),
      description: pick(
        locale,
        "It helps to keep the stable standards you've already built while staying flexible enough not to shut down a new suggestion or attempt from your partner too quickly.",
        "기존에 구축해 둔 안정적인 기준을 지키면서도, 상대가 건네는 새로운 제안이나 시도를 너무 빨리 닫지 않고 들어보는 유연함이 도움이 됩니다.",
      ),
      evidenceIds: ["stability_balance_evidence"],
    });
  }

  // Enforce Max 2
  const finalThemes = section02RelationshipThemes.slice(0, 2);

  // --- 03. Section 03: 앞으로 3년, 우리 관계의 흐름 ---
  // OWNERSHIP: Year-by-Year Timeline (2026, 2027, 2028).
  // SEMANTIC DIFFERENTIATION RULE:
  // 2027 (Pre-Transition): "익숙한 방식을 정돈하고 다음 방향을 가늠하는 해"
  // 2028 (Post-Transition / New Background Active): "준비하던 방향이 실제 행동과 확장으로 이어지는 해"
  const section03ThreeYearForecast: YearlyForecastCard[] = targetYears.map((yr) => {
    const state = coupleModel.yearlyStates.find((y) => y.year === yr)!;
    const rA = responsesA.find((r) => r.year === yr)!;
    const rB = responsesB.find((r) => r.year === yr)!;
    const seunFactA = factsA.yearlySeun.find((y) => y.year === yr);

    let yearLabel = pick(locale, "A year to match each other's pace", "서로의 속도를 맞추는 해");
    let badge = pick(locale, "Matching pace", "속도 맞추기");

    const isA_Shifting = factsA.daewoon.periods.some((p) => Math.abs(p.startYear - yr) <= 1);
    const isB_Shifting = factsB.daewoon.periods.some((p) => Math.abs(p.startYear - yr) <= 1);
    const isShiftingYear = isA_Shifting || isB_Shifting;

    if (isShiftingYear && yr <= 2027) {
      yearLabel = pick(locale, "A year to tidy up what's familiar and get a read on the next direction", "익숙한 방식을 정돈하고 다음 방향을 가늠하는 해");
      badge = pick(locale, "Sorting the next direction", "다음 방향 정돈");
    } else if (yr >= 2028 && (rB.timingContext.backgroundThemes.includes("wealth_theme_background") || state.pairState === "ALIGNED_MOMENTUM")) {
      yearLabel = pick(locale, "A year when the direction you've been preparing turns into real action and growth", "준비하던 방향이 실제 행동과 확장으로 이어지는 해");
      badge = pick(locale, "Acting on the new direction", "새 방향 실행");
    } else if (state.pairState === "SHARED_STABILITY") {
      yearLabel = pick(locale, "A year of settling into a stable rhythm together", "안정적으로 맞춰나가는 해");
      badge = pick(locale, "Steady sailing", "안정적 순항");
    } else if (state.pairState === "DUAL_PRESSURE") {
      yearLabel = pick(locale, "A year to share each other's load", "서로의 짐을 나누어 지는 해");
      badge = pick(locale, "Sharing the load", "짐 나누기");
    }

    // Individual Summaries Differentiated Per Year (No internal engine jargon)
    let summaryA = pick(locale, "A year to check your standards and respond steadily rather than rush", "서두르기보다 기준을 점검하며 안정적으로 대처하는 해");
    if (yr === 2026) {
      summaryA = pick(locale, "A year to set your framework and standards first, without rushing, amid the changes coming your way", "주어지는 변화 속에서 서두르지 않고 먼저 틀과 기준을 잡는 해");
    } else if (yr === 2027 || seunFactA?.tenGodCode === "jeonggwan" || seunFactA?.tenGodCode === "pyeongwan") {
      summaryA = pick(locale, "A year to carefully sort out what comes next while balancing responsibilities and roles", "책임과 역할을 조율하며 신중하게 다음 순서를 정돈하는 해");
    } else if (yr === 2028 || seunFactA?.tenGodCode === "pyeonin" || seunFactA?.tenGodCode === "jeongin") {
      summaryA = pick(locale, "A year when outside demands ease up and you find inner rest and a chance to breathe", "외부 요구가 완화되며 내면의 안식을 찾고 한숨 돌리는 해");
    }

    let summaryB = pick(locale, "A year to explore possibilities and try things out lightly", "가능성을 탐색하며 가볍게 시도해보는 해");
    if (yr === 2027 && isB_Shifting) {
      summaryB = pick(locale, "A year to wrap up what's familiar and prepare the next direction forward", "익숙했던 방식을 정리하고 앞으로 나아갈 다음 방향을 준비하는 해");
    } else if (yr === 2028 && rB.timingContext.backgroundThemes.includes("wealth_theme_background")) {
      summaryB = pick(locale, "A year when the direction you've been preparing turns into real action, expanding your range in earnest", "준비해온 새로운 방향이 실제 행동으로 이어지며 활동 범위를 본격적으로 넓히는 해");
    } else if (rB.responseProfile.actionResponse) {
      summaryB = pick(locale, "A year to lightly act on new attempts and ideas", "새로운 시도와 아이디어를 가볍게 실행해보는 해");
    }

    // Couple Rhythm Summary (Absorbs speed contrast & pair dynamic)
    let summaryPair = pick(
      locale,
      `${nameA} holds steady standards while ${nameB}'s urge to explore grows, so it's best to leave plenty of room around when decisions get made.`,
      `${nameA}님은 차분한 기준을 지키고 ${nameB}님은 탐색 의욕이 커지므로, 결정 시점을 넉넉하게 잡는 것이 좋습니다.`,
    );
    if (isShiftingYear && yr === 2027) {
      const partnerName = isB_Shifting ? nameB : nameA;
      summaryPair = pick(
        locale,
        `As ${partnerName} works out the next direction, it becomes especially important for both of you to align on the priorities you'll carry forward together.`,
        `${partnerName}님이 다음 방향을 구상하는 과정에서, 두 사람이 앞으로 중요하게 둘 우선순위를 함께 맞춰보는 호흡이 부각됩니다.`,
      );
    } else if (yr === 2028) {
      summaryPair = pick(
        locale,
        "The direction you've newly chosen settles into everyday life, and this is a period where both of you steadily adjust to the changed tempo.",
        "새롭게 선택한 방향이 실제 일상으로 자리 잡으며, 달라진 템포에 두 사람이 안정적으로 적응해나가는 시기입니다.",
      );
    } else if (state.pairState === "SHARED_STABILITY") {
      summaryPair = pick(
        locale,
        "Both of you are finding an easy, comfortable rhythm together, built on a foundation of stability.",
        "두 사람 모두 안정을 바탕으로 무난하고 편안하게 호흡을 맞춰가는 해입니다.",
      );
    }

    return {
      year: yr,
      yearLabel,
      badge,
      personA: { name: nameA, summary: summaryA },
      personB: { name: nameB, summary: summaryB },
      pair: { summary: summaryPair },
    };
  });

  // --- 04. Section 04: 우리에게 찾아오는 가장 중요한 변곡점 ---
  // OWNERSHIP: Single major turning point selected dynamically based on evidence across targetYears.
  // BROAD RELATIONSHIP SCOPE: No unsupported domestic/residence event narrowing ("가정 운영/거주 확정").
  let section04TurningPoint: TurningPointSectionData | null = null;
  const turningPointYearState = coupleModel.yearlyStates.find((y) => y.isTurningPointCandidate) ?? coupleModel.yearlyStates[1];

  if (turningPointYearState) {
    const tpYr = turningPointYearState.year;
    const rA = responsesA.find((r) => r.year === tpYr)!;
    const rB = responsesB.find((r) => r.year === tpYr)!;

    const changingName = turningPointYearState.primaryChangingSide === "PERSON_A" ? nameA : nameB;
    const headline = pick(
      locale,
      `${tpYr} — a major turning point as ${changingName} works out a new direction`,
      `${tpYr}년, ${changingName}님이 새로운 방향을 구상하며 찾아오는 주요 변곡점`,
    );
    const reason = pick(
      locale,
      `As a life transition approaches in ${tpYr}, it becomes more important for both of you to revisit and realign on the direction and priorities you'll carry forward.`,
      `${tpYr}년에는 삶의 전환점이 다가오면서, 두 사람이 앞으로 중요하게 둘 방향과 우선순위를 함께 다시 맞춰볼 필요가 커지는 시기입니다.`,
    );

    section04TurningPoint = {
      year: tpYr,
      headline,
      reason,
      forPersonA: pick(
        locale,
        `${nameA} becomes a steady support by calmly looking over the conditions and sequence with their partner, rather than pushing for a hasty answer.`,
        `${nameA}님은 변화를 겪는 상대에게 조급한 확답을 요구하기보다, 차분하게 조건과 순서를 살펴주는 버팀목이 됩니다.`,
      ),
      forPersonB: pick(
        locale,
        `${nameB} lets go of urgency while moving into a new phase and matches their partner's pace for working things out together.`,
        `${nameB}님은 새로운 흐름으로 넘어가는 과정에서 조급함을 내려놓고 상대와의 협의 템포를 맞춥니다.`,
      ),
      forPair: pick(
        locale,
        "This is a defining moment to work out the standards you'll move forward on together as a couple, rather than letting one person's judgment alone drive it.",
        "이 시기는 한 사람의 판단만으로 추진하기보다, 부부가 앞으로 함께 나아갈 기준을 함께 논의하는 결정적 계기가 됩니다.",
      ),
    };

    provenanceList.push({
      sectionId: "section04TurningPoint",
      userConclusion: headline,
      personATimingEvidence: rA.evidenceRefs,
      personBTimingEvidence: rB.evidenceRefs,
      psychEvidence: [],
      pairState: turningPointYearState.pairState,
      confidence: "HIGH",
    });
  }

  // --- 05. Section 05: 이 흐름을 우리 편으로 만드는 법 ---
  // OWNERSHIP: Pure action translation. NO re-summarizing analysis ("A는 신중하고 B는 시도하므로...").
  // NO generic buzzwords ("최고의 시너지").
  const adviceA = pick(
    locale,
    `When something's weighing on ${nameA}, try starting a light conversation with your partner from the earliest stage of thinking it through, instead of trying to sort out every condition alone first.`,
    `${nameA}님은 부담이나 고민이 생길 때 혼자 모든 조건을 완벽히 정리하려 하기보다, 생각하는 초기 단계부터 상대와 가볍게 대화를 시작해 보세요.`,
  );
  const adviceB = pick(
    locale,
    `When a new idea comes to ${nameB}, share the reason and what sparked it warmly first, rather than jumping straight to an execution plan.`,
    `${nameB}님은 새로운 아이디어가 떠올랐을 때 곧바로 실행안부터 내놓기보다, 왜 해보고 싶은지 그 이유와 계기부터 다정하게 이야기해 주세요.`,
  );
  const advicePair = pick(
    locale,
    "If one of you opens up the possibilities first and the other checks the practical conditions, your difference in pace becomes an easy, natural division of roles.",
    "한 사람이 먼저 가능성을 열고 다른 사람이 현실적인 조건을 점검하는 순서로 움직이면, 서로의 속도 차이를 자연스러운 역할 분담으로 쓰기 쉬워집니다.",
  );

  const section05ActionGuide: ActionGuideSectionData = {
    forPersonA: { name: nameA, advice: adviceA },
    forPersonB: { name: nameB, advice: adviceB },
    forPair: { advice: advicePair },
  };

  return {
    introSentence,
    section01CurrentPeriod,
    section02RelationshipThemes: finalThemes,
    section03ThreeYearForecast,
    section04TurningPoint: section04TurningPoint,
    section05ActionGuide,
    provenance: provenanceList,
  };
}
