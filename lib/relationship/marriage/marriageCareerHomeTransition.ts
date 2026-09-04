import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { Locale } from "@/lib/i18n/locale";

/**
 * Marriage V2 Career x Home Transition Expansion Engine
 */

export type CareerScenarioKey = "A_OPPORTUNITY" | "B_OPPORTUNITY" | "DUAL_HIGH_DEMAND";

export type CareerScenarioDetail = {
  scenarioKey: CareerScenarioKey;
  scenarioTitle: string;
  whoAbsorbsHomeLoad: string;
  whatMustBeRenegotiated: string;
  whatCreatesResentment: string;
  whatMakesSupportFeelFair: string;
  /** Whether this specific scenario is the one real recognition-axis evidence points to for this pair, vs. a generic possibility. */
  relevance: "EVIDENCE_BACKED" | "GENERIC_POSSIBILITY";
};

export type MarriageCareerHomeBundle = {
  scenarios: CareerScenarioDetail[];
  overallNarrative: string;
};

export function buildMarriageCareerHomeTransition(
  psychA: PsychMasterJson | null | undefined,
  psychB: PsychMasterJson | null | undefined,
  nameA: string,
  nameB: string,
  locale: Locale = "ko-KR",
): MarriageCareerHomeBundle {
  const isEn = locale === "en-US";
  const axesA = psychA?.secondary_axes ?? {};
  const axesB = psychB?.secondary_axes ?? {};

  const recA = axesA.recognition ?? 50;
  const recB = axesB.recognition ?? 50;
  const RELEVANCE_GATE = 15;
  // Which scenario real recognition-axis evidence actually points toward for
  // THIS pair — previously recA/recB were computed but never used, so all
  // three hypothetical scenarios were presented with equal, unstated weight
  // regardless of either person's real evidence.
  const evidenceBackedScenario: CareerScenarioKey =
    recA - recB >= RELEVANCE_GATE
      ? "A_OPPORTUNITY"
      : recB - recA >= RELEVANCE_GATE
        ? "B_OPPORTUNITY"
        : "DUAL_HIGH_DEMAND";
  const relevanceFor = (key: CareerScenarioKey): "EVIDENCE_BACKED" | "GENERIC_POSSIBILITY" =>
    key === evidenceBackedScenario ? "EVIDENCE_BACKED" : "GENERIC_POSSIBILITY";

  const scenarios: CareerScenarioDetail[] = [
    {
      scenarioKey: "A_OPPORTUNITY",
      scenarioTitle: isEn ? `When ${nameA} takes on a major career opportunity` : `${nameA}님에게 큰 커리어 기회가 찾아올 때`,
      whoAbsorbsHomeLoad: isEn
        ? `${nameB} temporarily absorbs day-to-day household execution and logistics.`
        : `${nameB}님이 일시적으로 일상 집안일 현장 처리와 수습을 든든히 받쳐줍니다.`,
      whatMustBeRenegotiated: isEn
        ? "Re-aligning daily meal prep and weekend social commitments."
        : "주말 사교 일정과 식사 준비 및 세탁 루틴의 간소화 재합의.",
      whatCreatesResentment: isEn
        ? `If ${nameA} treats ${nameB}'s support as taken for granted without verbal gratitude.`
        : `${nameA}님이 ${nameB}님의 가사 백업을 당연시하거나 일적 피로를 집안으로 끌고 들어올 때.`,
      whatMakesSupportFeelFair: isEn
        ? `Explicitly acknowledging ${nameB}'s sacrifice and setting a clear duration for the high-demand period.`
        : `${nameB}님의 지원 노고에 대한 명확한 고마움 표현과 고수요 기간의 시한(End Date) 명시.`,
      relevance: relevanceFor("A_OPPORTUNITY"),
    },
    {
      scenarioKey: "B_OPPORTUNITY",
      scenarioTitle: isEn ? `When ${nameB} takes on a major career opportunity` : `${nameB}님에게 큰 커리어 기회가 찾아올 때`,
      whoAbsorbsHomeLoad: isEn
        ? `${nameA} temporarily absorbs day-to-day household execution and logistics.`
        : `${nameA}님이 일시적으로 일상 집안일 현장 처리와 수습을 든든히 받쳐줍니다.`,
      whatMustBeRenegotiated: isEn
        ? "Delegating house cleaning and food delivery routines."
        : "가사 외주 서비스 이용 및 음식 배달/반찬 이용 범위의 상향 조정.",
      whatCreatesResentment: isEn
        ? `If ${nameB} ignores household boundaries or expects ${nameA} to handle 100% of mental load indefinitely.`
        : `${nameB}님이 집안 운영 기획까지 ${nameA}님에게 무한정 미루고 소통을 닫을 때.`,
      whatMakesSupportFeelFair: isEn
        ? `Active partner support and sharing career milestone wins together.`
        : `커리어 성취의 결실을 부부 공동의 경사로 함께 축하하고 나눌 때.`,
      relevance: relevanceFor("B_OPPORTUNITY"),
    },
    {
      scenarioKey: "DUAL_HIGH_DEMAND",
      scenarioTitle: isEn ? "When both face peak work demands simultaneously" : "두 사람 모두 동시에 커리어 peak 및 고수요기에 진입할 때",
      whoAbsorbsHomeLoad: isEn
        ? "Outsourcing routine chores to external services and temporarily lowering home standards."
        : "반복 가사는 지체 없이 외부 가사 서비스로 외주화하고 집안 정돈 기준을 한 단계 낮춤.",
      whatMustBeRenegotiated: isEn
        ? "Lowering household cleanliness standards without mutual criticism."
        : "가사 완벽주의를 내려놓고 상대의 청소 방식을 서로 비난하지 않기로 약속.",
      whatCreatesResentment: isEn
        ? "Blaming each other for unmade beds or unwashed dishes during high-stress weeks."
        : "바쁜 일정 속에서 빨래나 설거지가 쌓였다고 서로를 탓하며 완벽주의를 강요할 때.",
      whatMakesSupportFeelFair: isEn
        ? "Investing in time-saving home appliances or services and taking joint recovery breaks."
        : "가사 대체 서비스에 지출을 아끼지 않고 주말 반나절 완전 휴식 시간을 함께 갖는 것.",
      relevance: relevanceFor("DUAL_HIGH_DEMAND"),
    },
  ];

  const overallNarrative = isEn
    ? `Career support between ${nameA} and ${nameB} works best when high-demand periods have clear end dates and external household services are fully utilized.`
    : `${nameA}님과 ${nameB}님의 커리어 전환기에는 가사 완벽주의를 낮추고 외부 서비스를 적극 활용할 때 일과 가정의 균형이 가장 잘 지켜집니다.`;

  return {
    scenarios,
    overallNarrative,
  };
}
