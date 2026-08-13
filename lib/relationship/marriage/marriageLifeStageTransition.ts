import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { Locale } from "@/lib/i18n/locale";

/**
 * Marriage V2 Life Stage Transition Engine
 */

export type LifeStageKey =
  | "COHABITATION"
  | "EARLY_MARRIAGE"
  | "PARENTING_FAMILY_BUILDING"
  | "DUAL_CAREER_MID_LIFE"
  | "LONG_TERM_COMPANIONSHIP";

export type StageTransitionDetail = {
  stageKey: LifeStageKey;
  stageLabel: string;
  whatCurrentlyWorks: string;
  whatWillBeTested: string;
  roleShiftNeeded: string;
  newAgreementNeeded: string;
};

export type MarriageLifeStageBundle = {
  currentStage: LifeStageKey;
  transitions: StageTransitionDetail[];
  overallSummary: string;
};

export function buildMarriageLifeStageTransition(
  psychA: PsychMasterJson | null | undefined,
  psychB: PsychMasterJson | null | undefined,
  nameA: string,
  nameB: string,
  locale: Locale = "ko-KR",
): MarriageLifeStageBundle {
  const isEn = locale === "en-US";
  const axesA = psychA?.secondary_axes ?? {};
  const axesB = psychB?.secondary_axes ?? {};

  const transitions: StageTransitionDetail[] = [
    {
      stageKey: "COHABITATION",
      stageLabel: isEn ? "Cohabitation / Pre-Marriage" : "동거 & 신혼 전단계",
      whatCurrentlyWorks: isEn ? "Spontaneous chore sharing and individual space freedom" : "자율적인 가사 분담과 각자의 개인 공간 유연성",
      whatWillBeTested: isEn ? "Informal financial boundaries and unwritten house rules" : "비공식적인 재정 분담과 명확히 명시되지 않은 주거 규칙",
      roleShiftNeeded: isEn ? "Shift from casual roommates to joint operating team" : "단순 거주 공유에서 집안 운영 공동 책임팀으로 전환",
      newAgreementNeeded: isEn ? "Establish shared household fund and basic cleaning frequency" : "공동 생활비 통장과 기본 집안일 최소 주기 합의",
    },
    {
      stageKey: "EARLY_MARRIAGE",
      stageLabel: isEn ? "Early Marriage (Building Foundation)" : "초기 결혼 (운영 체계 정립기)",
      whatCurrentlyWorks: isEn ? "Clear single CFO leadership and joint social plans" : "단일 CFO 주도권 정립과 주말 일정 공유",
      whatWillBeTested: isEn ? "Original family holiday habits and personal spending autonomy" : "양가 명절 관습 차이와 개인 지출 자율성의 범위",
      roleShiftNeeded: isEn ? "Shift from individual priorities to joint financial alignment" : "각자만의 지출 습관에서 공동 자산 형성 목표로 조정",
      newAgreementNeeded: isEn ? "Define large purchase thresholds and in-law visit frequency" : "대형 지출 사전 상의 기준과 양가 방문 주기 합의",
    },
    {
      stageKey: "PARENTING_FAMILY_BUILDING",
      stageLabel: isEn ? "Parenting & Family Building" : "육아 & 자녀 확장기",
      whatCurrentlyWorks: isEn ? "Affectionate teamwork and shared parenting values" : "정서적 팀워크와 상호 간의 유대감",
      whatWillBeTested: isEn ? "Invisible Mental Load overload on one partner and bedroom intimacy frequency" : "한쪽으로 쏠리는 보이지 않는 멘탈로드와 침실 친밀감 유지",
      roleShiftNeeded: isEn ? "Explicit PM division (finder, planner, executor)" : "가사 및 육아 PM(기획/실행/추적)의 구체적 명시 분할",
      newAgreementNeeded: isEn ? "Establish mandatory weekly recovery time for primary manager" : "가사 메인 담당자를 위한 주 1회 완전 쿨링다운 시간 지정",
    },
    {
      stageKey: "DUAL_CAREER_MID_LIFE",
      stageLabel: isEn ? "Dual Career & Mid-Life Transition" : "맞벌이 커리어 peak & 중년기",
      whatCurrentlyWorks: isEn ? "Established operational efficiency and asset growth" : "오랫동안 다져온 집안 운영 노하우와 자산 안정감",
      whatWillBeTested: isEn ? "Career ambition clashes and burnout from prolonged mental load" : "서로의 커리어 성취욕 충돌 및 장기 가사 피로감 누적",
      roleShiftNeeded: isEn ? "Outsource routine chores and support partner's external growth" : "반복 가사는 외부 자원으로 외주화하고 파트너의 도전을 지지",
      newAgreementNeeded: isEn ? "Re-evaluate household budget for services reducing mental load" : "멘탈로드를 줄여주는 가사 서비스 비용의 적극 집행 합의",
    },
    {
      stageKey: "LONG_TERM_COMPANIONSHIP",
      stageLabel: isEn ? "Long-Term Companionship" : "장기 안식 & 동반자적 완성기",
      whatCurrentlyWorks: isEn ? "Deep mutual reliance and silent understanding" : "말하지 않아도 통하는 깊은 신뢰와 편안함",
      whatWillBeTested: isEn ? "Health maintenance and post-career lifestyle adaptation" : "건강 관리와 은퇴 후 일상 공간 공유의 조화",
      roleShiftNeeded: isEn ? "Shift focus to mutual health support and shared leisure rituals" : "서로의 건강을 보살피고 함께 즐기는 취미 리추얼에 집중",
      newAgreementNeeded: isEn ? "Schedule regular couple trips and daily walking rituals" : "정기 산책 리추얼과 정기 부부 여행 정례화",
    },
  ];

  const overallSummary = isEn
    ? `As ${nameA} and ${nameB}'s marriage evolves across life stages, operational rules must shift from informal agreement to explicit domain division.`
    : `${nameA}님과 ${nameB}님의 부부 관계는 시간이 지나면서 발전하므로, 시기마다 운영 규칙과 자율 영역을 재정돈하는 것이 관계를 단단히 지켜줍니다.`;

  return {
    currentStage: "EARLY_MARRIAGE",
    transitions,
    overallSummary,
  };
}
