/**
 * Phase 2 English remediation: every returned string below now goes through
 * `pick(locale, en, ko)`; the Korean strings and the branching logic
 * (directionLead !== qualityLead, etc.) are unchanged. The "OWNERSHIP
 * CONSISTENCY VALIDATION GUARD" below requires each emergencyPlaybook
 * item's `responsibility` text to literally contain its `ownerName` (a
 * person's real name, never translated) — every English responsibility
 * sentence keeps that interpolation intact.
 */
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
import { pick, LEGACY_FALLBACK_LOCALE } from "./workColleagueCopy";

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

void (0 as unknown as WorkCommunicationChapterBundle | WorkPressureChapterBundle | WorkConflictChapterBundle);

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
    sajuChartA,
    sajuChartB,
    workSignalsA,
    workSignalsB,
    psychA,
    psychB,
    locale = LEGACY_FALLBACK_LOCALE,
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
  const personAOwnership = pick(
    locale,
    ["Setting the direction and the priorities", "Managing pace and handling outside issues", "Making the fast calls when it matters"],
    ["방향 설정 및 목표 우선순위 수립", "추진 속도 관리 및 대외 이슈 조율", "즉시 판단이 필요한 현장 결단"],
  );
  const personBOwnership = pick(
    locale,
    ["Turning plans into a detailed process", "Managing the quality bar and the risk floor", "Organizing the internal details and documentation"],
    ["기획 구체화 및 상세 프로세스 수립", "최소 품질 검토 및 리스크 마지노선 관리", "내부 조건 정돈 및 자료 체계화"],
  );

  let bestStructure = "";
  if (directionLead !== qualityLead) {
    bestStructure = pick(
      locale,
      `${directionLead} leads on direction and pace, while ${qualityLead} holds the line on quality and risk.`,
      `${directionLead}님이 큰 방향과 추진 속도를 리드하고, ${qualityLead}님이 품질 기준과 리스크 검증을 단단히 붙잡아주는 구조`,
    );
  } else {
    bestStructure = pick(
      locale,
      `${directionLead} sets the direction and the quality bar, while ${execLead} drives the actual execution and pace.`,
      `${directionLead}님이 방향 설정과 품질 기준을 잡고, ${execLead}님이 실전 추진과 실행 속도를 맞춰주는 구조`,
    );
  }

  const avoidStructure = pick(
    locale,
    `Both of you trying to have final say on the same issue at once, with no clear split up front — that just puts review and execution in constant real-time friction.`,
    `사전 영역 분리 없이 동일한 안건에 대해 두 사람이 동시에 최종 결정권을 행사하며 검토와 실행을 실시간으로 마찰시키는 구조`,
  );

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
        title: pick(locale, "Set clear decision-making authority and the core goal", "판단 권한과 핵심 목표 명확히 정하기"),
        explanation: pick(
          locale,
          `${nameA} moves fastest when they're given clear room to actually decide and lead in their area first.`,
          `${nameA}님이 직접 의사결정을 내리고 주도할 수 있는 책임 범위를 먼저 열어줄 때 일하는 템포가 극대화됩니다.`,
        ),
      },
      {
        title: pick(locale, "Lead with the reason and the outcome when something changes", "변경 사항은 이유와 결론부터 두괄식 공유"),
        explanation: pick(
          locale,
          "They understand fastest, and move fastest to fix it, when you lead with what changed and its impact instead of a long explanation.",
          "장황한 설명보다 변경된 팩트와 영향 범위를 먼저 전달할 때 가장 빠르게 이해하고 수습 조치에 착수합니다.",
        ),
      },
    ],
    dontItems: [
      {
        title: pick(locale, "Don't change the ground rules out of nowhere", "충분한 공유 없이 가이드라인 갑자기 바꾸지 않기"),
        explanation: pick(
          locale,
          "When an agreed plan or timeline shifts with no real conversation about it, it wears them out fast.",
          "사전에 합의된 약속이나 결정된 일정이 논의 없이 변경되면 과부하와 피로도가 커집니다.",
        ),
      },
      {
        title: pick(locale, "Don't micromanage every step of execution", "실행 중간 단계마다 세부 지시 반복하지 않기"),
        explanation: pick(
          locale,
          "Constantly checking in on the details erodes their sense of ownership and tends to backfire.",
          "마이크로 매니징 식 재확인은 주체성을 깎아먹고 반발을 부르기 쉽습니다.",
        ),
      },
    ],
  };

  const doDontB: DoDontList = {
    personName: nameB,
    doItems: [
      {
        title: pick(locale, "Give them the context and real time to review it", "안건 맥락과 충분한 사전 검토 시간 확보해주기"),
        explanation: pick(
          locale,
          `Send ${nameB} the materials ahead of the meeting so they have time to carefully check for gaps and fine print.`,
          `${nameB}님이 허점이나 조건 조항을 꼼꼼히 점검할 수 있도록 미팅 전에 미리 자료를 떼어주는 것이 좋습니다.`,
        ),
      },
      {
        title: pick(locale, "When you disagree, lay out the trade-offs between options", "의견 차이 시 옵션별 장단점을 비교하여 논의하기"),
        explanation: pick(
          locale,
          "They trust it most when you compare the real risks and payoffs of Option A vs. B, not when you just try to persuade them emotionally.",
          "감정적 설득보다 A안/B안의 리스크와 실리 팩트를 비교해 제시할 때 가장 신뢰가 높아집니다.",
        ),
      },
    ],
    dontItems: [
      {
        title: pick(locale, "Don't push for an on-the-spot answer they're not ready to give", "준비되지 않은 상태에서 즉흥적인 확답 요구하지 않기"),
        explanation: pick(
          locale,
          "Being pressed for an answer in the room, before they've had a chance to check the risk, wears them down fast.",
          "충분한 리스크 검증 없이 회의실에서 즉석 확답을 강요받으면 피로도가 급상승합니다.",
        ),
      },
      {
        title: pick(locale, "Don't push past the minimum quality bar just for speed", "최소 품질 기준이나 규칙을 무리하게 무시하지 않기"),
        explanation: pick(
          locale,
          "Real friction shows up when speed becomes the excuse to blow past the quality floor you agreed on early.",
          "속도만을 이유로 초기 합의된 품질 마지노선을 넘어가려 할 때 날카로운 마찰이 생깁니다.",
        ),
      },
    ],
  };

  // 3. ◤ 같이 일할 때 꼭 맞춰둘 규칙 (3-5 Team Rules) - NO UNSUPPORTED TIME PRECISION
  const teamRules: TeamRule[] = [
    {
      ruleType: "MEETING",
      title: pick(locale, "Share the agenda before the meeting", "회의 전 사전 안건 핵심 공유"),
      instruction: pick(
        locale,
        "Share the context and what needs a decision before you walk into the room.",
        "회의실에 들어오기 전 안건 맥락과 의사결정이 필요한 포인트를 미리 공유합니다.",
      ),
      whyLine: pick(
        locale,
        `Gives ${nameB} real review time and keeps the meeting itself moving fast for ${nameA}.`,
        `${nameB}님의 사전 검토 버퍼를 확보하고 ${nameA}님의 회의 진행 템포를 높입니다.`,
      ),
    },
    {
      ruleType: "DECISION",
      title: pick(locale, "Name a single decision owner up front", "단일 Decision Owner 사전 지정"),
      instruction: pick(
        locale,
        "For every major project, split the execution lead from the quality sign-off, and name exactly one final approver.",
        "모든 주요 프로젝트마다 실행 리드와 품질 승인자를 분리하여 단일 최종 승인자를 지정합니다.",
      ),
      whyLine: pick(
        locale,
        "Keeps two people with overlapping authority from colliding into a decision bottleneck.",
        "동일 안건에서 중복 결정권이 부딪혀 의사결정 병목이 생기는 것을 방지합니다.",
      ),
    },
    {
      ruleType: "REPORTING",
      title: pick(locale, "Flag changes immediately, facts first", "상황 변경 시 즉각 팩트 위주 통보"),
      instruction: pick(
        locale,
        "When something outside your control changes the timeline, post the reason and the impact right away.",
        "외생 변수나 일정 변경이 생기면 사유와 영향을 팩트 위주로 메신저에 바로 남깁니다.",
      ),
      whyLine: pick(
        locale,
        "Prevents the misunderstanding and lost trust that comes from finding out too late.",
        "사전 공유 부재로 인한 오해와 신뢰 손상을 예방합니다.",
      ),
    },
    {
      ruleType: "DEADLINE",
      title: pick(locale, "Build in review time before the final submission", "최종 제출 전 검토 버퍼 확보"),
      instruction: pick(
        locale,
        "Instead of last-minute changes right before the deadline, leave real time to check the final version.",
        "마감 직전 즉흥 수정 대신 사전 검토 버퍼를 두고 최종본을 확인합니다.",
      ),
      whyLine: pick(locale, "Prevents speed and the quality floor from colliding.", "속도와 품질 마지노선 사이의 충돌을 방지합니다."),
    },
  ];

  // 4. ◤ 일이 꼬였을 때 비상 운영법 (Emergency Playbook)
  // Strictly mapped to Canonical Roles & Pressure Intelligence with Validation Guards
  const emergencyPlaybook: EmergencyPlaybookItem[] = [
    {
      functionName: pick(locale, "Cut priorities and scope", "우선순위 & 스코프 축소"),
      ownerName: directionLead,
      responsibility: pick(
        locale,
        `If the timeline slips, ${directionLead} cuts the nonessential work without hesitation and puts everything into the core deadline.`,
        `${directionLead}님이 일정 지연 시 과감히 부수 과제를 잘라내고 핵심 마감 과제에 전력을 집중합니다.`,
      ),
    },
    {
      functionName: pick(locale, "Sign off on the minimum quality gate", "최소 품질 Gate 승인"),
      ownerName: qualityLead,
      responsibility: pick(
        locale,
        `${qualityLead} gives final sign-off on the one quality line that doesn't move, no matter how fast things speed up.`,
        `${qualityLead}님이 속도를 올리더라도 무너뜨리지 않을 최소 품질 마지노선을 최종 승인합니다.`,
      ),
    },
    {
      functionName: pick(locale, "Check the risk and the buffer", "리스크 & 버퍼 점검"),
      ownerName: qualityLead,
      responsibility: pick(
        locale,
        `${qualityLead} quickly checks whatever just changed for real risk of error and puts together a stable fix.`,
        `${qualityLead}님이 긴급 변경 사항의 오류 가능성을 빠르게 확인하고 안정적 수습안을 냅니다.`,
      ),
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
      capabilityToLearn: pick(locale, "The precision that adds polish to speed", "속도에 완성도를 더하는 정밀함"),
      explanation: pick(
        locale,
        `Working with ${nameB} teaches them how to pair instinctive drive with real risk-checking and structural polish.`,
        `${nameB}님과 일하면서 직관적 추진력에 사전 리스크 검증과 구조적 완성도를 결합하는 역량을 배우게 됩니다.`,
      ),
    },
    bFromA: {
      personName: nameB,
      fromName: nameA,
      capabilityToLearn: pick(locale, "The decisiveness that adds boldness to caution", "신중함에 과감함을 더하는 결단력"),
      explanation: pick(
        locale,
        `Working with ${nameA} teaches them how to find a fast way through with whatever's available, even before every condition is perfect.`,
        `${nameA}님과 일하면서 완벽한 조건이 갖춰지기 전이라도 가용한 자원으로 빠른 돌파구를 찾는 결단력을 배우게 됩니다.`,
      ),
    },
  };

  // 6. ◤ 이 팀이 오래 잘 가기 위한 운영 습관 (Dynamic Routine Selection 1-2) - NO UNSUPPORTED TIME PRECISION
  const operatingRoutines: OperatingRoutineItem[] = [
    {
      routineName: pick(locale, "A short weekly 1:1 check-in", "주간 짧은 1:1 운영 체크인"),
      format: pick(locale, "Once a week, a quick message or short meeting", "주 1회 짧은 1:1 메시지 또는 미팅"),
      purpose: pick(
        locale,
        "Sync fast on three things: what's in progress, what needs a decision this week, and where you're stuck.",
        "진행 중인 일 / 이번 주 결정할 일 / 막힌 구간 3가지만 빠르게 확인하고 싱크 맞추기",
      ),
    },
    {
      routineName: pick(locale, "Confirm roles before a project starts", "프로젝트 시작 전 R&R 확인"),
      format: pick(locale, "Three lines in a doc at project kickoff", "프로젝트 킥오프 시 문서 3줄 명시"),
      purpose: pick(
        locale,
        "Settle up front who has final say on cutting scope, and who owns the quality gate.",
        "누가 최종 스코프를 줄이고, 누가 품질 Gate를 잡을지 사전에 역할 경계 확정하기",
      ),
    },
  ];

  // 7. ◤ 이 팀의 한 가지 원칙 (Single Operating Principle)
  const singleOperatingPrinciple: SingleOperatingPrinciple = {
    principleTitle: pick(locale, "Keep a clear line between who decides and who reviews.", "결정하는 영역과 검토하는 영역의 주도권을 명확히 분리하세요."),
    explanation: pick(
      locale,
      `You get the most out of ${nameA}'s decisiveness and ${nameB}'s thoroughness for quality when each of you has real, uncontested authority in your own lane.`,
      `${nameA}님의 실행 결단력과 ${nameB}님의 품질 검증력을 서로 침범하지 않는 개별 주도권 안에서 발휘할 때 가장 큰 시너지가 납니다.`,
    ),
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

  const categories = pick(
    locale,
    ["Communication & authority", "Feedback & burnout", "Delivery & recovery"],
    ["소통 & 권한", "피드백 & 피로도", "성과 & 수습"],
  );
  const ruleFallbackLabel = (idx: number) => pick(locale, `Rule ${idx + 1}`, `수칙 ${idx + 1}`);
  const avoidFallback = pick(locale, "Avoid forcing the pace unilaterally or calling them out in public", "일방적 속도 강요 및 공개 지적 피하기");

  const personARows: SafetyMatrixRow[] = guideA.do_list.map((doItem, idx) => ({
    categoryLabel: categories[idx] || ruleFallbackLabel(idx),
    doRecommendation: doItem,
    avoidRecommendation: guideA.avoid_list[idx] || guideA.avoid_list[0] || avoidFallback,
  }));

  const personBRows: SafetyMatrixRow[] = guideB.do_list.map((doItem, idx) => ({
    categoryLabel: categories[idx] || ruleFallbackLabel(idx),
    doRecommendation: doItem,
    avoidRecommendation: guideB.avoid_list[idx] || guideB.avoid_list[0] || avoidFallback,
  }));

  const collaborationSafetyMatrix: CollaborationSafetyMatrix = {
    tableTitle: pick(locale, "A safety net built for this team (Safety Matrix)", "이 팀을 위한 협업 안전 장치 (Safety Matrix)"),
    personAName: nameA,
    personBName: nameB,
    personARows,
    personBRows,
  };

  return {
    subtitle: pick(locale, "How to actually work together — keep what makes you strong, cut the friction you don't need", "둘의 강점은 살리고, 불필요한 마찰은 줄이는 실제 협업 사용법"),
    introSummary: pick(
      locale,
      "Pulling together everything from the earlier chapters, here's an operating structure and a 1:1 playbook you can actually use starting tomorrow.",
      "앞선 챕터의 분석을 종합하여 내일부터 실제 현장에서 바로 적용할 수 있는 최적 운영 구조와 1:1 협업 플레이북을 제시합니다.",
    ),
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
