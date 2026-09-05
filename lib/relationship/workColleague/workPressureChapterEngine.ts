/**
 * Phase 2 English remediation: every returned string below now goes through
 * `pick(locale, en, ko)`; the Korean strings and the archetype-selection
 * logic (isExecutionProfile, execLead !== qualityLead, isTradeOffShared,
 * etc.) are unchanged. English copy is a natural rewrite for a US reader.
 * Note: `sharedTradeOffs.explanation` is NOT built by concatenating
 * personA's explanation the way the Korean string is (Korean doesn't need
 * subject/verb agreement between "they" and "both of you"; English does),
 * so it gets its own standalone English sentence, inferred from the same
 * archetype personA already resolved to.
 */
import type { Locale } from "@/lib/i18n/locale";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { WorkSajuSignals } from "@/lib/personCore/sajuSignals/types";
import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import { buildCanonicalWorkRoleMap, resolveWorkRoleOwnerName } from "./workCanonicalRoleModel";
import type { IndividualWorkChapterBundle } from "./workStoryPlanTypes";
import { analyzeWorkInnateVsCurrentDiscrepancy } from "./workPsychSajuDiscrepancy";
import { pick, LEGACY_FALLBACK_LOCALE } from "./workColleagueCopy";

export type IndividualPressureProfile = {
  name: string;

  // 1. 압박이 오면 각자는 어떻게 달라질까 (Baseline -> Pressure Delta)
  normalVsPressureShift: {
    normalBehavior: string;
    pressureBehavior: string;
    deltaExplanation: string;
    discrepancyNote?: string | null;
  };

  // 2. 어떤 압박에 특히 민감할까 (2-3 supported triggers)
  pressureTriggers: Array<{
    title: string;
    description: string;
  }>;

  // 3. 마감이 가까워지면 무엇을 줄이고 무엇을 지킬까 (Trade-offs)
  tradeOffs: {
    reducedItems: string[];
    protectedItems: string[];
    explanation: string;
  };

  // 4. 문제가 터졌을 때 첫 반응 (Emergency First Move)
  emergencyFirstMove: {
    sequenceLabel: string;
    explanation: string;
  };

  // 6. 위기에서 오히려 강해지는 부분 (Crisis Strengths)
  crisisStrengths: {
    keywords: string[];
    explanation: string;
  };

  // 7. 압박이 오래 이어지면 나타나는 신호 (Observable Work Signals)
  overloadSignals: {
    signals: string[];
    explanation: string;
  };
};

export type WorkPressureChapterBundle = {
  subtitle: string;
  introSummary: string;
  personA: IndividualPressureProfile;
  personB: IndividualPressureProfile;

  // 5. 둘 다 압박받으면 어떤 팀이 될까 (Pair Stress Interaction)
  pairStressInteraction: {
    strengthTitle: string;
    strengthSummary: string;
    bottleneckTitle: string;
    bottleneckSummary: string;
  };

  // 8. 압박 속에서 가장 조심해야 할 리스크 (Top Pair Pressure Risks)
  topPressureRisks: Array<{
    title: string;
    explanation: string;
  }>;

  // Shared Pattern Promotion (Requirement 11)
  sharedTradeOffs?: {
    isShared: boolean;
    title: string;
    reducedItems: string[];
    protectedItems: string[];
    explanation: string;
  } | null;
};

/**
 * Builds individual pressure profile integrating Ch02 Baseline, Saju CE, 11-Axis, and Discrepancy signals.
 */
function buildIndividualPressureProfile(params: {
  name: string;
  partnerName: string;
  isPersonA: boolean;
  individualWorkBundle?: IndividualWorkChapterBundle | null;
  sajuChart?: SajuDataForIntegrated | null;
  workSignals?: WorkSajuSignals | null;
  psych?: PsychMasterJson | null;
  locale?: Locale;
}): IndividualPressureProfile {
  const { name, isPersonA, individualWorkBundle, sajuChart, workSignals, psych, locale = LEGACY_FALLBACK_LOCALE } = params;

  // 1. Consume Chapter 02 Baseline Work Profile (Fixes ROOT CAUSE 3: BASELINE CONTRACT DISCONNECT)
  const ch02Person = isPersonA ? individualWorkBundle?.personA : individualWorkBundle?.personB;
  const baselineStyleHeadline = (ch02Person as any)?.groupA_style?.headline ?? "";
  const baselineStrengthsHeadline = (ch02Person as any)?.groupB_strengths?.headline ?? "";
  const suitableRole = ch02Person?.suitableRoles?.join(" ") ?? "";

  // 2. Consume Saju / CE Evidence (Fixes ROOT CAUSE 2: DERIVATION COLLAPSE)
  const category = workSignals?.month_geokguk?.month_stem_category ?? "self";
  const foodIntensity = workSignals?.drive_stubborn?.food_intensity ?? 30;
  const foodCount = workSignals?.drive_stubborn?.food_count ?? 0;
  const officerCount = workSignals?.drive_stubborn?.officer_count ?? 0;
  const sealCount = workSignals?.drive_stubborn?.seal_count ?? 0;

  // 3. Consume 11-Axis Psychology
  const axes = psych?.secondary_axes;
  const deliberateVal = axes?.deliberate_decision ?? 50;
  const structureVal = axes?.structure ?? 50;
  const stimulationVal = axes?.stimulation ?? 50;

  // 4. Multi-Tier Score Derivation
  const isExecutionDriven =
    category === "food" ||
    category === "wealth" ||
    foodIntensity >= 40 ||
    foodCount >= 1 ||
    deliberateVal <= 45 ||
    stimulationVal >= 55 ||
    baselineStyleHeadline.includes("실행") ||
    baselineStyleHeadline.includes("추진") ||
    baselineStyleHeadline.includes("빠른") ||
    baselineStyleHeadline.includes("큰 그림") ||
    baselineStrengthsHeadline.includes("실행") ||
    baselineStrengthsHeadline.includes("현장") ||
    suitableRole.includes("매니저") ||
    suitableRole.includes("실행") ||
    suitableRole.includes("관리") ||
    suitableRole.includes("추진");

  const isQADriven =
    category === "officer" ||
    category === "seal" ||
    officerCount >= 1 ||
    sealCount >= 1 ||
    structureVal >= 55 ||
    deliberateVal >= 60 ||
    baselineStyleHeadline.includes("구조") ||
    baselineStyleHeadline.includes("품질") ||
    baselineStyleHeadline.includes("검토") ||
    baselineStyleHeadline.includes("조율") ||
    baselineStrengthsHeadline.includes("품질") ||
    baselineStrengthsHeadline.includes("검토") ||
    suitableRole.includes("기획") ||
    suitableRole.includes("분석") ||
    suitableRole.includes("검토");

  // Primary Pressure Archetype differentiation
  let isExecutionProfile = false;
  if (isExecutionDriven && !isQADriven) {
    isExecutionProfile = true;
  } else if (!isExecutionDriven && isQADriven) {
    isExecutionProfile = false;
  } else if (isExecutionDriven && isQADriven) {
    isExecutionProfile = isPersonA;
  } else {
    // Missing / neutral fallback: Person A defaults to Execution Lead, Person B to QA Lead
    isExecutionProfile = isPersonA;
  }

  // 5. Baseline -> Pressure Delta
  let normalBehavior = "";
  if (baselineStyleHeadline) {
    normalBehavior = pick(locale, `Day to day: ${baselineStyleHeadline}`, `평소: ${baselineStyleHeadline}`);
  } else if (isExecutionProfile) {
    normalBehavior = pick(locale, "Day to day: quick to spot an opportunity and push into action on instinct", "평소: 기회를 빠르게 포착하고 직관적인 실행 추진");
  } else {
    normalBehavior = pick(locale, "Day to day: sorts out the conditions and risk criteria first, then moves forward steadily", "평소: 안건의 조건과 리스크 기준을 정리한 뒤 안정적 진행");
  }

  let pressureBehavior = "";
  let deltaExplanation = "";

  if (isExecutionProfile) {
    pressureBehavior = pick(locale, "Under pressure: cuts back on review and focuses on speed and hitting the deadline", "압박 시: 검토 단계를 줄이고 실행 속도와 마감 완수에 집중");
    deltaExplanation = pick(
      locale,
      `When a deadline gets tight, ${name} skips the extra pre-discussion and puts everything into shipping something now and hitting the timeline.`,
      `${name}님은 마감 압박이 걸리면 부수적인 사전 논의를 생략하고 즉각적인 결과물 출시와 타임라인 준수에 전력을 기울입니다.`,
    );
  } else {
    pressureBehavior = pick(locale, "Under pressure: holds even tighter to the quality floor and risk checks", "압박 시: 품질 마지노선과 리스크 검증을 더 강하게 붙잡음");
    deltaExplanation = pick(
      locale,
      `The more urgent things get, the more carefully ${name} guards the minimum quality bar to prevent errors or a drop in polish.`,
      `${name}님은 위기 상황일수록 완성도 저하와 오류 방지를 위해 최소 품질 마지노선을 철저히 지키며 신중함을 높입니다.`,
    );
  }

  // Check Innate vs Current Discrepancy
  let discrepancyNote: string | null = null;
  if (sajuChart && psych) {
    const discrepancies = analyzeWorkInnateVsCurrentDiscrepancy({
      sajuJson: sajuChart,
      psychMaster: psych,
      name,
      locale,
    });
    const disc = discrepancies.find((d) => d.status === "DISCREPANT");
    if (disc?.insightLine) {
      discrepancyNote = disc.insightLine;
    }
  }

  // 6. Pressure Triggers (2-3 Triggers per Person)
  const pressureTriggers: Array<{ title: string; description: string }> = [];
  if (isExecutionProfile) {
    pressureTriggers.push({
      title: pick(locale, "When a decision keeps getting delayed", "결정이 계속 미뤄질 때"),
      description: pick(
        locale,
        "The longer a decision stalls, the more frustrated they get — and the more likely they are to just decide on their own and move.",
        "의사결정이 멈춘 상태가 길어지면 답답함을 느끼고 단독으로 판단하여 움직이려는 성향이 강해집니다.",
      ),
    });
    pressureTriggers.push({
      title: pick(locale, "When they're on the hook but the authority is unclear", "책임은 큰데 권한이 모호할 때"),
      description: pick(
        locale,
        "Overload builds fast when they're responsible for the outcome but can't actually make the call themselves.",
        "실행에 대한 책임은 주어지나 직접 의사결정을 내릴 수 없는 환경에서 과부하가 커집니다.",
      ),
    });
  } else {
    pressureTriggers.push({
      title: pick(locale, "When there's no time left to review", "검토 시간이 사라질 때"),
      description: pick(
        locale,
        "Being pushed for an on-the-spot answer without a real risk check spikes their stress fast.",
        "충분한 리스크 검증이나 조건 점검 없이 즉흥적인 확답을 강요받으면 피로도가 급상승합니다.",
      ),
    });
    pressureTriggers.push({
      title: pick(locale, "When the standards keep changing", "기준과 가이드라인이 계속 바뀔 때"),
      description: pick(
        locale,
        "It's stressful when the original ground rules keep shifting without a real conversation about why.",
        "초기 설정한 최소 약속이나 가이드라인이 명확한 논의 없이 빈번히 변경될 때 스트레스를 받습니다.",
      ),
    });
  }

  // 7. Trade-offs (What to Reduce vs What to Protect)
  let reducedItems: string[] = [];
  let protectedItems: string[] = [];
  let tradeOffExplanation = "";

  if (isExecutionProfile) {
    reducedItems = pick(locale, ["Extra review steps", "Nice-to-have pre-discussion"], ["추가 검토 과정", "부가적인 사전 논의"]);
    protectedItems = pick(locale, ["The deadline itself", "Shipping the core deliverable"], ["마감 타임라인", "핵심 결과물 출시"]);
    tradeOffExplanation = pick(
      locale,
      "To protect speed and hit the deadline, they let the extra polish go and focus on shipping the core deliverable.",
      "속도와 마감 완수를 위해 세부 다듬기 과정을 생략하고 결과 창출을 최우선으로 보호합니다.",
    );
  } else {
    reducedItems = pick(locale, ["Nice-to-have scope", "Optional extras"], ["부가적인 작업 범위", "선택적 아이디어 옵션"]);
    protectedItems = pick(locale, ["The minimum quality bar", "The risk-check floor"], ["최소 품질 기준선", "리스크 검증 마지노선"]);
    tradeOffExplanation = pick(
      locale,
      "To protect quality, they aggressively cut anything non-essential and hold the line on the minimum bar.",
      "품질 저하를 막기 위해 과감히 부수적 작업 범위를 쳐내고 품질 마지노선을 보호합니다.",
    );
  }

  // 8. Emergency First Move (4:30 PM Scenario)
  let sequenceLabel = "";
  let moveExplanation = "";

  if (isExecutionProfile) {
    sequenceLabel = pick(locale, "Assess the impact → act immediately", "영향 파악 → 즉시 대응안 실행");
    moveExplanation = pick(
      locale,
      "When something breaks, they take a quick read of the situation, then jump straight into fixing it with whatever's available.",
      "문제가 터지면 현황을 한눈에 파악한 후 가용한 자원으로 즉각 수습 조치에 착수합니다.",
    );
  } else {
    sequenceLabel = pick(locale, "Verify the cause → map out the options", "원인 검증 → 해결 옵션 정리");
    moveExplanation = pick(
      locale,
      "When something breaks, they verify what actually caused it and the real risk first, then lay out a solid set of options.",
      "문제가 터지면 발생 원인과 리스크 팩트를 먼저 검증하고 안정적인 대안을 명확히 정리합니다.",
    );
  }

  // 9. Crisis Strengths
  let keywords: string[] = [];
  let crisisExplanation = "";

  if (isExecutionProfile) {
    keywords = pick(locale, ["Decisiveness", "On-the-ground response"], ["결단력", "현장 대응"]);
    crisisExplanation = pick(
      locale,
      "The fewer the options in a real crisis, the more their decisiveness shines — cutting through the noise to find a fast way out.",
      "위기 상황에서 선택지가 줄어들수록 복잡성을 잘라내고 빠른 돌파구를 찾는 결단력이 빛을 발합니다.",
    );
  } else {
    keywords = pick(locale, ["Problem-solving", "Defending quality"], ["문제 해결", "품질 방어"]);
    crisisExplanation = pick(
      locale,
      "Stays level-headed even when things are chaotic, and is good at catching the errors that would actually matter.",
      "혼란스러운 순간에도 냉정함을 잃지 않고 치명적 오류를 걸러내는 안정적 방어력이 돋보입니다.",
    );
  }

  // 10. Observable Work Signals
  let signals: string[] = [];
  let overloadExplanation = "";

  if (isExecutionProfile) {
    signals = pick(locale, ["Fewer status meetings", "More decisions made solo", "Shorter, terser messages"], ["공유 회의 축소", "단독 결정 비율 증가", "메시지 간결화"]);
    overloadExplanation = pick(
      locale,
      "Under sustained overload, they skip communication steps and just decide and handle things on their own more.",
      "과부하가 지속되면 소통 단계를 생략하고 직접 판단하여 처리하는 업무 패턴이 짙어집니다.",
    );
  } else {
    signals = pick(locale, ["More requests to re-review", "Slower to commit to an answer", "Fixating on checking details"], ["재검토 요청 증가", "확답 시점 지연", "디테일 확인 집착"]);
    overloadExplanation = pick(
      locale,
      "Under sustained overload, they pad in more review time and keep re-checking conditions to guard against risk.",
      "과부하가 지속되면 리스크 방어를 위해 검토 버퍼를 늘리고 조건 재확인을 반복하게 됩니다.",
    );
  }

  return {
    name,
    normalVsPressureShift: {
      normalBehavior,
      pressureBehavior,
      deltaExplanation,
      discrepancyNote,
    },
    pressureTriggers,
    tradeOffs: {
      reducedItems,
      protectedItems,
      explanation: tradeOffExplanation,
    },
    emergencyFirstMove: {
      sequenceLabel,
      explanation: moveExplanation,
    },
    crisisStrengths: {
      keywords,
      explanation: crisisExplanation,
    },
    overloadSignals: {
      signals,
      explanation: overloadExplanation,
    },
  };
}

/**
 * Builds Chapter 05 Work Pressure & Overload Intelligence Bundle V2.
 */
export function buildWorkPressureChapterBundle(params: {
  nameA: string;
  nameB: string;
  individualWorkBundle?: IndividualWorkChapterBundle | null;
  sajuChartA?: SajuDataForIntegrated | null;
  sajuChartB?: SajuDataForIntegrated | null;
  workSignalsA?: WorkSajuSignals | null;
  workSignalsB?: WorkSajuSignals | null;
  psychA?: PsychMasterJson | null;
  psychB?: PsychMasterJson | null;
  locale?: Locale;
}): WorkPressureChapterBundle {
  const {
    nameA,
    nameB,
    individualWorkBundle,
    sajuChartA,
    sajuChartB,
    workSignalsA,
    workSignalsB,
    psychA,
    psychB,
    locale = LEGACY_FALLBACK_LOCALE,
  } = params;

  const personA = buildIndividualPressureProfile({
    name: nameA,
    partnerName: nameB,
    isPersonA: true,
    individualWorkBundle,
    sajuChart: sajuChartA,
    workSignals: workSignalsA,
    psych: psychA,
    locale,
  });

  const personB = buildIndividualPressureProfile({
    name: nameB,
    partnerName: nameA,
    isPersonA: false,
    individualWorkBundle,
    sajuChart: sajuChartB,
    workSignals: workSignalsB,
    psych: psychB,
    locale,
  });

  // Section 5 Pair Stress Interaction (Consumes Chapter 03 Canonical R&R Map)
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

  // canonicalRoles.*Owner can be "SHARED" (scores within 15 points — not
  // rare); `=== "B" ? nameB : nameA` silently folded that into nameA.
  const pressureSharedLabel = pick(locale, "Both of you", "두 사람");
  const execLead = resolveWorkRoleOwnerName(canonicalRoles.executionOwner, nameA, nameB, pressureSharedLabel);
  const qualityLead = resolveWorkRoleOwnerName(canonicalRoles.qaRiskOwner, nameA, nameB, pressureSharedLabel);

  let strengthSummary = "";
  let bottleneckSummary = "";

  if (execLead !== qualityLead) {
    strengthSummary = pick(
      locale,
      `When ${execLead} pushes for a fast breakthrough and ${qualityLead} holds the quality line, you get real synergy — speed and stability working at the same time, even in a crisis.`,
      `${execLead}님이 즉각적인 돌파 속도를 내고 ${qualityLead}님이 품질 기준을 방어하면, 위기 속에서도 속도와 안정성이 동시에 작동하는 강력한 시너지를 형성합니다.`,
    );
    bottleneckSummary = pick(
      locale,
      `Under a tight deadline, ${execLead} pushing to ship fast can clash with ${qualityLead} asking for more review — that can create a temporary decision bottleneck.`,
      `긴급 마감 상황에서 ${execLead}님의 빠른 출시 추진과 ${qualityLead}님의 검토 요청이 마찰할 때 일시적인 의사결정 병목이 생길 수 있습니다.`,
    );
  } else {
    strengthSummary = pick(
      locale,
      `In a crisis, you both push toward the same goal with real clarity, which keeps your response consistent and steady.`,
      `두 사람이 위기 상황에서 동일한 목표로 명확한 추진력을 발휘하여 일관된 수습 속도를 보여줍니다.`,
    );
    bottleneckSummary = pick(
      locale,
      `Under pressure, a specific role — quality review, or outside communication — can end up with nobody covering it, so it helps to consciously check who's got what.`,
      `압박이 걸릴 때 특정 역할(품질 검수 또는 외부 소통)에 공백이 생길 수 있으므로 의식적인 가이드라인 점검이 필요합니다.`,
    );
  }

  // Shared Pattern Promotion (Requirement 11)
  let sharedTradeOffs: WorkPressureChapterBundle["sharedTradeOffs"] = null;
  const isTradeOffShared =
    personA.tradeOffs.explanation === personB.tradeOffs.explanation &&
    personA.tradeOffs.reducedItems.join() === personB.tradeOffs.reducedItems.join();

  if (isTradeOffShared) {
    const executionProtectedFirst = pick(locale, "The deadline itself", "마감 타임라인");
    const isExecutionShared = personA.tradeOffs.protectedItems[0] === executionProtectedFirst;
    sharedTradeOffs = {
      isShared: true,
      title: pick(locale, "◤ A pressure pattern you both share", "◤ 둘이 공통으로 보이는 압박 패턴"),
      reducedItems: personA.tradeOffs.reducedItems,
      protectedItems: personA.tradeOffs.protectedItems,
      explanation: pick(
        locale,
        isExecutionShared
          ? `As the deadline gets close, you both let the extra polish go and focus everything on shipping the core deliverable.`
          : `As the deadline gets close, you both cut anything non-essential and hold the line on the minimum quality bar.`,
        `두 사람 모두 마감이 가까워지면 ${personA.tradeOffs.explanation}`,
      ),
    };
  }

  // Section 8 Top Pressure Risks
  const topPressureRisks = [
    {
      title: pick(locale, "Speed vs. quality tension", "속도 vs 품질 판단 마찰"),
      explanation: pick(
        locale,
        "Right before a deadline, the push to ship fast and the push to make sure it's actually finished can pull against each other for a moment.",
        "마감 직전 빠른 출시를 우선시하는 실행 판단과 완결성을 확인하려는 검토 판단 사이에서 일시적 템포 차이가 생길 수 있습니다.",
      ),
    },
    {
      title: pick(locale, "Deciding solo and just announcing it, in an emergency", "긴급 상황에서의 단독 통보 위험"),
      explanation: pick(
        locale,
        "Deciding fast and telling the other person after the fact, instead of before, can create a gap that turns into a real misunderstanding.",
        "빠른 처리를 위해 사전 공유 없이 단독 결정 후 통보할 경우 정보 격차로 인한 오해가 생길 수 있습니다.",
      ),
    },
  ];

  return {
    subtitle: pick(locale, "How your working style shifts under a deadline, a surprise, a crisis, or overload", "마감, 변수, 위리와 과부하에서 평소와 달라지는 업무 방식"),
    introSummary: pick(
      locale,
      "Here's how your working style changes under real pressure — and where your responses differ — compared to how you normally operate.",
      "평소의 업무 방식과 달리 긴급 압박 상황에서 두 사람이 나타내는 업무 대응 방식의 변화와 반응 차이를 분석합니다.",
    ),
    personA,
    personB,
    pairStressInteraction: {
      strengthTitle: pick(locale, "Strength under pressure", "압박 속 강점"),
      strengthSummary,
      bottleneckTitle: pick(locale, "Bottleneck under pressure", "압박 속 병목"),
      bottleneckSummary,
    },
    topPressureRisks,
    sharedTradeOffs,
  };
}
