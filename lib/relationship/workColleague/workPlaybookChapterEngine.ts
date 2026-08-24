import type { Locale } from "@/lib/i18n/locale";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { WorkSajuSignals } from "@/lib/personCore/sajuSignals/types";
import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import { buildCanonicalWorkRoleMap } from "./workCanonicalRoleModel";
import type { IndividualWorkChapterBundle } from "./workStoryPlanTypes";
import type { WorkCommunicationChapterBundle } from "./workCommunicationChapterEngine";
import type { WorkPressureChapterBundle } from "./workPressureChapterEngine";
import type { WorkConflictChapterBundle } from "./workConflictChapterEngine";
import { buildUpsetResponseGuide } from "./officeLanguage";

export type OptimalConfiguration = {
  personAOwnership: string[];
  personBOwnership: string[];
  bestStructure: string;
  avoidStructure: string;
};

export type DoDontList = {
  personName: string;
  doItems: Array<{
    title: string;
    explanation: string;
  }>;
  dontItems: Array<{
    title: string;
    explanation: string;
  }>;
};

export type TeamRule = {
  ruleType: "MEETING" | "DECISION" | "REPORTING" | "DEADLINE" | "FEEDBACK";
  title: string;
  instruction: string;
  whyLine?: string;
};

export type EmergencyPlaybookItem = {
  functionName: string;
  ownerName: string;
  responsibility: string;
};

export type MutualGrowthItem = {
  personName: string;
  fromName: string;
  capabilityToLearn: string;
  explanation: string;
};

export type OperatingRoutineItem = {
  routineName: string;
  format: string;
  purpose: string;
};

export type SingleOperatingPrinciple = {
  principleTitle: string;
  explanation: string;
};

export type SafetyMatrixRow = {
  categoryLabel: string;
  doRecommendation: string;
  avoidRecommendation: string;
};

export type CollaborationSafetyMatrix = {
  tableTitle: string;
  personAName: string;
  personBName: string;
  personARows: SafetyMatrixRow[];
  personBRows: SafetyMatrixRow[];
};

export type WorkPlaybookChapterBundle = {
  subtitle: string;
  introSummary: string;

  // 1. ◤ 이 조합의 최적 운영 방식 (Optimal Operating Configuration)
  optimalConfiguration: OptimalConfiguration;

  // 2. ◤ 서로와 일할 때 DO / DON'T (Pair DO & DON'T)
  doDontA: DoDontList;
  doDontB: DoDontList;

  // 3. ◤ 같이 일할 때 꼭 맞춰둘 규칙 (3-5 Team Rules)
  teamRules: TeamRule[];

  // 4. ◤ 일이 꼬였을 때 비상 운영법 (Emergency Playbook)
  emergencyPlaybook: EmergencyPlaybookItem[];

  // 5. ◤ 서로에게서 얻게 되는 것 (Mutual Growth)
  mutualGrowth: {
    aFromB: MutualGrowthItem;
    bFromA: MutualGrowthItem;
  };

  // 6. ◤ 이 팀이 오래 잘 가기 위한 운영 습관 (Dynamic Routine Selection 1-2)
  operatingRoutines: OperatingRoutineItem[];

  // 7. ◤ 이 팀의 한 가지 원칙 (Single Operating Principle)
  singleOperatingPrinciple: SingleOperatingPrinciple;

  // 8. ◤ 이 팀을 위한 협업 안전 장치 (Safety Matrix Table)
  collaborationSafetyMatrix: CollaborationSafetyMatrix;
};

/**
 * Builds Chapter 07 Work Playbook Chapter Bundle.
 */
export function buildWorkPlaybookChapterBundle(params: {
  nameA: string;
  nameB: string;
  individualWorkBundle?: IndividualWorkChapterBundle | null;
  communicationChapterBundle?: WorkCommunicationChapterBundle | null;
  pressureChapterBundle?: WorkPressureChapterBundle | null;
  conflictChapterBundle?: WorkConflictChapterBundle | null;
  sajuChartA?: SajuDataForIntegrated | null;
  sajuChartB?: SajuDataForIntegrated | null;
  workSignalsA?: WorkSajuSignals | null;
  workSignalsB?: WorkSajuSignals | null;
  psychA?: PsychMasterJson | null;
  psychB?: PsychMasterJson | null;
  locale?: Locale;
}): WorkPlaybookChapterBundle {
  const {
    nameA,
    nameB,
    individualWorkBundle,
    communicationChapterBundle,
    pressureChapterBundle,
    conflictChapterBundle,
    sajuChartA,
    sajuChartB,
    workSignalsA,
    workSignalsB,
    psychA,
    psychB,
    locale = "ko-KR",
  } = params;

  // Consume Chapter 03 Canonical Role Map (SSOT for Normal Ownership)
  const canonicalRoles = buildCanonicalWorkRoleMap({
    nameA,
    nameB,
    sajuJsonA: sajuChartA ?? ({} as any),
    sajuJsonB: sajuChartB ?? ({} as any),
    workSignalsA: workSignalsA ?? undefined,
    workSignalsB: workSignalsB ?? undefined,
    psychA: psychA ?? undefined,
    psychB: psychB ?? undefined,
  });

  const directionLead = canonicalRoles.directionOwner === "B" ? nameB : nameA;
  const execLead = canonicalRoles.executionOwner === "B" ? nameB : nameA;
  const qualityLead = canonicalRoles.qaRiskOwner === "B" ? nameB : nameA;

  // 1. ◤ 이 조합의 최적 운영 방식 (Optimal Operating Configuration)
  const personAOwnership = [
    "방향 설정 및 목표 우선순위 수립",
    "추진 속도 관리 및 대외 이슈 조율",
    "즉시 판단이 필요한 현장 결단",
  ];
  const personBOwnership = [
    "기획 구체화 및 상세 프로세스 수립",
    "최소 품질 검토 및 리스크 마지노선 관리",
    "내부 조건 정돈 및 자료 체계화",
  ];

  let bestStructure = "";
  if (directionLead !== qualityLead) {
    bestStructure = `${directionLead}님이 큰 방향과 추진 속도를 리드하고, ${qualityLead}님이 품질 기준과 리스크 검증을 단단히 붙잡아주는 구조`;
  } else {
    bestStructure = `${directionLead}님이 방향 설정과 품질 기준을 잡고, ${execLead}님이 실전 추진과 실행 속도를 맞춰주는 구조`;
  }

  const avoidStructure = `사전 영역 분리 없이 동일한 안건에 대해 두 사람이 동시에 최종 결정권을 행사하며 검토와 실행을 실시간으로 마찰시키는 구조`;

  const optimalConfiguration: OptimalConfiguration = {
    personAOwnership,
    personBOwnership,
    bestStructure,
    avoidStructure,
  };

  // 2. ◤ 서로와 일할 때 DO / DON'T (Multi-Signal Ranked Pair DO/DON'T)
  const doDontA: DoDontList = {
    personName: nameA,
    doItems: [
      {
        title: "판단 권한과 핵심 목표 명확히 정하기",
        explanation: `${nameA}님이 직접 의사결정을 내리고 주도할 수 있는 책임 범위를 먼저 열어줄 때 일하는 템포가 극대화됩니다.`,
      },
      {
        title: "변경 사항은 이유와 결론부터 두괄식 공유",
        explanation: "장황한 설명보다 변경된 팩트와 영향 범위를 먼저 전달할 때 가장 빠르게 이해하고 수습 조치에 착수합니다.",
      },
    ],
    dontItems: [
      {
        title: "충분한 공유 없이 가이드라인 갑자기 바꾸지 않기",
        explanation: "사전에 합의된 약속이나 결정된 일정이 논의 없이 변경되면 과부하와 피로도가 커집니다.",
      },
      {
        title: "실행 중간 단계마다 세부 지시 반복하지 않기",
        explanation: "마이크로 매니징 식 재확인은 주체성을 깎아먹고 반발을 부르기 쉽습니다.",
      },
    ],
  };

  const doDontB: DoDontList = {
    personName: nameB,
    doItems: [
      {
        title: "안건 맥락과 충분한 사전 검토 시간 확보해주기",
        explanation: `${nameB}님이 허점이나 조건 조항을 꼼꼼히 점검할 수 있도록 미팅 전에 미리 자료를 떼어주는 것이 좋습니다.`,
      },
      {
        title: "의견 차이 시 옵션별 장단점을 비교하여 논의하기",
        explanation: "감정적 설득보다 A안/B안의 리스크와 실리 팩트를 비교해 제시할 때 가장 신뢰가 높아집니다.",
      },
    ],
    dontItems: [
      {
        title: "준비되지 않은 상태에서 즉흥적인 확답 요구하지 않기",
        explanation: "충분한 리스크 검증 없이 회의실에서 즉석 확답을 강요받으면 피로도가 급상승합니다.",
      },
      {
        title: "최소 품질 기준이나 규칙을 무리하게 무시하지 않기",
        explanation: "속도만을 이유로 초기 합의된 품질 마지노선을 넘어가려 할 때 날카로운 마찰이 생깁니다.",
      },
    ],
  };

  // 3. ◤ 같이 일할 때 꼭 맞춰둘 규칙 (3-5 Team Rules) - NO UNSUPPORTED TIME PRECISION
  const teamRules: TeamRule[] = [
    {
      ruleType: "MEETING",
      title: "회의 전 사전 안건 핵심 공유",
      instruction: "회의실에 들어오기 전 안건 맥락과 의사결정이 필요한 포인트를 미리 공유합니다.",
      whyLine: `${nameB}님의 사전 검토 버퍼를 확보하고 ${nameA}님의 회의 진행 템포를 높입니다.`,
    },
    {
      ruleType: "DECISION",
      title: "단일 Decision Owner 사전 지정",
      instruction: "모든 주요 프로젝트마다 실행 리드와 품질 승인자를 분리하여 단일 최종 승인자를 지정합니다.",
      whyLine: "동일 안건에서 중복 결정권이 부딪혀 의사결정 병목이 생기는 것을 방지합니다.",
    },
    {
      ruleType: "REPORTING",
      title: "상황 변경 시 즉각 팩트 위주 통보",
      instruction: "외생 변수나 일정 변경이 생기면 사유와 영향을 팩트 위주로 메신저에 바로 남깁니다.",
      whyLine: "사전 공유 부재로 인한 오해와 신뢰 손상을 예방합니다.",
    },
    {
      ruleType: "DEADLINE",
      title: "최종 제출 전 검토 버퍼 확보",
      instruction: "마감 직전 즉흥 수정 대신 사전 검토 버퍼를 두고 최종본을 확인합니다.",
      whyLine: "속도와 품질 마지노선 사이의 충돌을 방지합니다.",
    },
  ];

  // 4. ◤ 일이 꼬였을 때 비상 운영법 (Emergency Playbook)
  // Strictly mapped to Canonical Roles & Pressure Intelligence with Validation Guards
  const emergencyPlaybook: EmergencyPlaybookItem[] = [
    {
      functionName: "우선순위 & 스코프 축소",
      ownerName: directionLead,
      responsibility: `${directionLead}님이 일정 지연 시 과감히 부수 과제를 잘라내고 핵심 마감 과제에 전력을 집중합니다.`,
    },
    {
      functionName: "최소 품질 Gate 승인",
      ownerName: qualityLead,
      responsibility: `${qualityLead}님이 속도를 올리더라도 무너뜨리지 않을 최소 품질 마지노선을 최종 승인합니다.`,
    },
    {
      functionName: "리스크 & 버퍼 점검",
      ownerName: qualityLead,
      responsibility: `${qualityLead}님이 긴급 변경 사항의 오류 가능성을 빠르게 확인하고 안정적 수습안을 냅니다.`,
    },
  ];

  // OWNERSHIP CONSISTENCY VALIDATION GUARD
  emergencyPlaybook.forEach((item) => {
    if (!item.responsibility.includes(item.ownerName)) {
      throw new Error(
        `[Chapter 07 Ownership Validation Error] Owner '${item.ownerName}' does not match body text: "${item.responsibility}"`
      );
    }
  });

  // 5. ◤ 서로에게서 얻게 되는 것 (Mutual Growth) - TYPO FIXED ("결동력" -> "결단력")
  const mutualGrowth = {
    aFromB: {
      personName: nameA,
      fromName: nameB,
      capabilityToLearn: "속도에 완성도를 더하는 정밀함",
      explanation: `${nameB}님과 일하면서 직관적 추진력에 사전 리스크 검증과 구조적 완성도를 결합하는 역량을 배우게 됩니다.`,
    },
    bFromA: {
      personName: nameB,
      fromName: nameA,
      capabilityToLearn: "신중함에 과감함을 더하는 결단력",
      explanation: `${nameA}님과 일하면서 완벽한 조건이 갖춰지기 전이라도 가용한 자원으로 빠른 돌파구를 찾는 결단력을 배우게 됩니다.`,
    },
  };

  // 6. ◤ 이 팀이 오래 잘 가기 위한 운영 습관 (Dynamic Routine Selection 1-2) - NO UNSUPPORTED TIME PRECISION
  const operatingRoutines: OperatingRoutineItem[] = [
    {
      routineName: "주간 짧은 1:1 운영 체크인",
      format: "주 1회 짧은 1:1 메시지 또는 미팅",
      purpose: "진행 중인 일 / 이번 주 결정할 일 / 막힌 구간 3가지만 빠르게 확인하고 싱크 맞추기",
    },
    {
      routineName: "프로젝트 시작 전 R&R 확인",
      format: "프로젝트 킥오프 시 문서 3줄 명시",
      purpose: "누가 최종 스코프를 줄이고, 누가 품질 Gate를 잡을지 사전에 역할 경계 확정하기",
    },
  ];

  // 7. ◤ 이 팀의 한 가지 원칙 (Single Operating Principle)
  const singleOperatingPrinciple: SingleOperatingPrinciple = {
    principleTitle: "결정하는 영역과 검토하는 영역의 주도권을 명확히 분리하세요.",
    explanation: `${nameA}님의 실행 결단력과 ${nameB}님의 품질 검증력을 서로 침범하지 않는 개별 주도권 안에서 발휘할 때 가장 큰 시너지가 납니다.`,
  };

  // 8. ◤ 이 팀을 위한 협업 안전 장치 (Safety Matrix Table)
  const guideA = buildUpsetResponseGuide(
    nameA,
    sajuChartA ?? ({} as any),
    (sajuChartA as any)?.ten_gods ?? {},
    locale,
    workSignalsA ?? undefined,
  );
  const guideB = buildUpsetResponseGuide(
    nameB,
    sajuChartB ?? ({} as any),
    (sajuChartB as any)?.ten_gods ?? {},
    locale,
    workSignalsB ?? undefined,
  );

  const categories = ["소통 & 권한", "피드백 & 피로도", "성과 & 수습"];

  const personARows: SafetyMatrixRow[] = guideA.do_list.map((doItem, idx) => ({
    categoryLabel: categories[idx] || `수칙 ${idx + 1}`,
    doRecommendation: doItem,
    avoidRecommendation: guideA.avoid_list[idx] || guideA.avoid_list[0] || "일방적 속도 강요 및 공개 지적 피하기",
  }));

  const personBRows: SafetyMatrixRow[] = guideB.do_list.map((doItem, idx) => ({
    categoryLabel: categories[idx] || `수칙 ${idx + 1}`,
    doRecommendation: doItem,
    avoidRecommendation: guideB.avoid_list[idx] || guideB.avoid_list[0] || "일방적 속도 강요 및 공개 지적 피하기",
  }));

  const collaborationSafetyMatrix: CollaborationSafetyMatrix = {
    tableTitle: "이 팀을 위한 협업 안전 장치 (Safety Matrix)",
    personAName: nameA,
    personBName: nameB,
    personARows,
    personBRows,
  };

  return {
    subtitle: "둘의 강점은 살리고, 불필요한 마찰은 줄이는 실제 협업 사용법",
    introSummary: "앞선 챕터의 분석을 종합하여 내일부터 실제 현장에서 바로 적용할 수 있는 최적 운영 구조와 1:1 협업 플레이북을 제시합니다.",
    optimalConfiguration,
    doDontA,
    doDontB,
    teamRules,
    emergencyPlaybook,
    mutualGrowth,
    operatingRoutines,
    singleOperatingPrinciple,
    collaborationSafetyMatrix,
  };
}
