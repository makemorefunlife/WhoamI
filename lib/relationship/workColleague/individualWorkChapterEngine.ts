/**
 * Work Colleague Premium Chapter 02: Individual Work Intelligence Engine
 *
 * Final Comparison-First UI + Intelligence Wiring Refactor.
 *
 * Core Objectives:
 * 1. Deep analysis internally (PersonCore CE + 11-axis psych + 8-dim roles + Work domain evidence).
 * 2. Visual comparison-first structure (Category/Question -> Person A | Person B).
 * 3. Humanized workplace vocabulary (No "기본 업무 엔진", "품질 앵커", "책임 앵커" jargon).
 * 4. Concrete work/role/environment/delegation labels.
 * 5. Strict boundary: NO stress/conflict leakage, NO pair scene duplication.
 *
 * Phase 2 English remediation: every branch below now returns a `pick(locale,
 * en, ko)` pair; the Korean strings and the branching logic that selects
 * between them (by score, by isPersonA, by innate-vs-current status) are
 * unchanged. English copy is a natural rewrite for a US reader, not a
 * word-for-word translation.
 */

import type { Locale } from "@/lib/i18n/locale";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { IndividualSajuChart } from "@/lib/personCore/individualSaju/types";
import { aggregatePersonalRelationalProfile } from "@/lib/personCore/personalContextEngine/selectPersonalInnate";
import type { PersonalRelationalProfile } from "@/lib/personCore/personalContextEngine/types";
import { buildCanonicalWorkRoleMap } from "./workCanonicalRoleModel";
import { pick, LEGACY_FALLBACK_LOCALE } from "./workColleagueCopy";
import type {
  IndividualWorkChapterBundle,
  IndividualWorkProfile,
  IndividualWorkStyleItem,
  WorkContributionItem,
  ConcreteDelegationItem,
  OfficePartnershipReport,
} from "./workStoryPlanTypes";

export type BuildIndividualWorkChapterParams = {
  nameA: string;
  nameB: string;
  locale?: Locale;
  psychA?: PsychMasterJson | null;
  psychB?: PsychMasterJson | null;
  sajuChartA?: IndividualSajuChart | null;
  sajuChartB?: IndividualSajuChart | null;
  officeReport?: OfficePartnershipReport | null;
};

function buildSinglePersonWorkProfile(params: {
  name: string;
  partnerName: string;
  isPersonA: boolean;
  psych?: PsychMasterJson | null;
  chart?: IndividualSajuChart | null;
  dnaNode?: {
    character_title?: string;
    work_style?: string;
    inner_standard?: string;
    overall_character?: string;
  } | null;
  roleNode?: {
    weapons?: string[];
    handoff_tasks?: any[];
  } | null;
  roleProfile?: {
    roleTitle: string;
    coreWeapons: string[];
    departmentFit: string;
  };
  locale?: Locale;
}): IndividualWorkProfile {
  const { name, partnerName, isPersonA, psych, chart, dnaNode, roleNode, locale = LEGACY_FALLBACK_LOCALE } = params;

  const isUnknownHour = chart?.calendar?.birth_time_unknown ?? true;

  // 1. Extract PersonCore Innate Profile
  let innate: PersonalRelationalProfile = {
    expression_style: isPersonA ? "pragmatic_doer" : "reserved_observer",
    recognition_need: isPersonA ? "standards_driven" : "autonomy_driven",
    decision_pace: isPersonA ? "swift_initiative" : "deliberate_evaluator",
    resource_governance: "diligent_steward",
    solitude_autonomy: isPersonA ? "balanced_proximity" : "high_solitude_needed",
    conflict_decompression: "solitude_cooling_needed",
    pressure_response: "resolute_crisis_fighter",
    support_giving_style: isPersonA ? "practical_troubleshooter" : "nurturing_empath",
    criticism_sensitivity: "growth_mindset_direct",
    intimacy_expression_style: "independent_space_valuing",
    structure_spontaneity: isPersonA ? "disciplined_framework_driven" : "spontaneous_creative_flow",
    boundary_defense_strength: "uncompromising_sovereignty",
  };

  if (chart && Array.isArray(chart.pillars) && chart.pillars.length > 0) {
    try {
      innate = aggregatePersonalRelationalProfile(chart, isUnknownHour);
    } catch {
      // Safe fallback
    }
  } else if (psych?.secondary_axes) {
    if (psych.secondary_axes.deliberate_decision >= 60) {
      innate.decision_pace = "deliberate_evaluator";
    } else if (psych.secondary_axes.deliberate_decision <= 40) {
      innate.decision_pace = "swift_initiative";
    }
    if (psych.secondary_axes.structure >= 60) {
      innate.structure_spontaneity = "disciplined_framework_driven";
    } else if (psych.secondary_axes.structure <= 40) {
      innate.structure_spontaneity = "spontaneous_creative_flow";
    }
  }

  // 2. Extract Current 11-Axis Psychology
  const sec = psych?.secondary_axes || {};
  const prim = psych?.primary_axes || {};

  const structureScore = sec.structure ?? prim.structure ?? (isPersonA ? 70 : 40);
  const decisionScore = sec.deliberate_decision ?? (isPersonA ? 40 : 70);
  const analyticalScore = sec.analytical_thinking ?? (isPersonA ? 50 : 75);
  const empathyScore = sec.empathy ?? (isPersonA ? 45 : 65);
  const stimulationScore = sec.stimulation ?? (isPersonA ? 60 : 35);

  // -------------------------------------------------------------------
  // Header Identity Cards (Short & Scannable)
  // -------------------------------------------------------------------
  let identityLabel =
    dnaNode?.character_title ||
    pick(
      locale,
      isPersonA ? "Someone who decides fast and jumps straight into action" : "Someone who organizes the problem and drives it to a polished finish",
      isPersonA ? "빠르게 판단하고 직접 움직이는 타입" : "문제를 정리하고 완성도를 높이는 타입",
    );
  let keyTraits: string[] = isPersonA
    ? pick(locale, ["Fast execution", "Hands-on response", "Decisive", "Accountable"], ["빠른 실행", "현장 대응", "결단", "책임"])
    : pick(locale, ["Problem-solving", "Structure", "Quality review", "Systematic"], ["문제 해결", "구조화", "품질 검토", "체계성"]);

  if (decisionScore < 45 || stimulationScore >= 65) {
    identityLabel = dnaNode?.character_title || pick(locale, "Someone who decides fast and jumps straight into action", "빠르게 판단하고 직접 움직이는 타입");
    keyTraits = pick(locale, ["Fast execution", "Hands-on response", "Decisive", "Accountable"], ["빠른 실행", "현장 대응", "결단", "책임"]);
  } else if (structureScore >= 65 || analyticalScore >= 65) {
    identityLabel = dnaNode?.character_title || pick(locale, "Someone who organizes the problem and drives it to a polished finish", "문제를 정리하고 완성도를 높이는 타입");
    keyTraits = pick(locale, ["Problem-solving", "Structure", "Quality review", "Systematic"], ["문제 해결", "구조화", "품질 검토", "체계성"]);
  } else if (empathyScore >= 65) {
    identityLabel = dnaNode?.character_title || pick(locale, "Someone who reads the room and smooths things over", "맥락을 읽고 부드럽게 조율하는 타입");
    keyTraits = pick(locale, ["Relationship-smoothing", "Reading context", "Building cooperation", "Steadying the room"], ["관계 조율", "맥락 파악", "협력 촉진", "안정 전달"]);
  }

  // -------------------------------------------------------------------
  // 01. 일하는 기본 스타일 (3-4 Individual Behaviors)
  // -------------------------------------------------------------------
  const workStyleBehaviors: IndividualWorkStyleItem[] = isPersonA
    ? [
        {
          situationLabel: pick(locale, "When starting something new", "일을 시작할 때"),
          behaviorSummary: pick(locale, "Moves first and narrows down the answer as they go", "먼저 움직이며 답을 좁혀요"),
          microcopy: pick(locale, "Tends to find the key options fast, then adjust while already in motion.", "핵심 대안을 빠르게 찾고 실행하면서 조정하는 편입니다."),
        },
        {
          situationLabel: pick(locale, "When deciding", "결정할 때"),
          behaviorSummary: pick(locale, "Once they've made up their mind, they commit without delay", "판단이 서면 지체 없이 결단해요"),
          microcopy: pick(locale, "Reads the room and decides quickly rather than dragging things out.", "오래 끌기보다 현장 반응을 보며 빠르게 의사결정을 내립니다."),
        },
        {
          situationLabel: pick(locale, "When solving a problem", "문제를 풀 때"),
          behaviorSummary: pick(locale, "Starts with the most realistic option", "가장 현실적인 대안부터 시도해요"),
          microcopy: pick(locale, "Looks for a fix that works right now rather than a theoretical discussion.", "이론적인 논의보다 지금 당장 돌릴 수 있는 해법을 찾습니다."),
        },
        {
          situationLabel: pick(locale, "When they own something", "책임을 맡았을 때"),
          behaviorSummary: pick(locale, "Sees it through to a real result", "끝까지 결과를 만들어내요"),
          microcopy: pick(locale, "Has a strong drive to push through to the deadline without stalling out.", "중간에 멈추지 않고 목표한 마감까지 밀고 나가는 힘이 강합니다."),
        },
      ]
    : [
        {
          situationLabel: pick(locale, "When starting something new", "일을 시작할 때"),
          behaviorSummary: pick(locale, "Sorts out the conditions and standards first", "조건과 기준부터 정리해요"),
          microcopy: pick(locale, "Tends to define scope and deadlines first, then start step by step.", "범위와 마감 기준을 먼저 잡고 단계적으로 착수하는 편입니다."),
        },
        {
          situationLabel: pick(locale, "When deciding", "결정할 때"),
          behaviorSummary: pick(locale, "Checks the risks and decides carefully", "리스크를 확인하고 신중히 정해요"),
          microcopy: pick(locale, "Reviews for gaps or blind spots before locking in a decision.", "빠진 조항이나 허점이 없는지 검토한 후 결론을 확정합니다."),
        },
        {
          situationLabel: pick(locale, "When solving a problem", "문제를 풀 때"),
          behaviorSummary: pick(locale, "Analyzes the root cause from multiple angles", "근본 원인을 다각도로 분석해요"),
          microcopy: pick(locale, "Looks at what's structurally wrong before reaching for a quick fix.", "임시방편보다 구조적인 문제의 본질을 먼저 살핍니다."),
        },
        {
          situationLabel: pick(locale, "When they own something", "책임을 맡았을 때"),
          behaviorSummary: pick(locale, "Closes things out precisely, with no loose ends", "허점 없이 정밀하게 마감해요"),
          microcopy: pick(locale, "Holds a strict quality bar and delivers polished results.", "품질 기준을 엄격하게 수호하며 완성도 높은 결과를 냅니다."),
        },
      ];

  // -------------------------------------------------------------------
  // 02. 일에 기여하는 방식 (From 8-dim Role Model)
  // -------------------------------------------------------------------
  const topContributions: WorkContributionItem[] = [];

  if (structureScore >= 60 || innate.structure_spontaneity === "disciplined_framework_driven") {
    topContributions.push({
      title: pick(locale, "Structuring and setting standards", "구조화 및 기준 정돈"),
      microcopy: pick(locale, "Turns a complicated situation into a clear schedule and priority order", "복잡한 사안을 체계적인 일정과 우선순위로 정리"),
    });
  }
  if (decisionScore < 50 || innate.decision_pace === "swift_initiative") {
    topContributions.push({
      title: pick(locale, "Fast decision-making", "빠른 의사결정"),
      microcopy: pick(locale, "Moves straight from a clear call to action, no delay", "충분히 판단되면 지체 없이 실행안으로 전환"),
    });
  }
  if (analyticalScore >= 60 || innate.expression_style === "expressive_creator") {
    topContributions.push({
      title: pick(locale, "Problem-solving and finding options", "문제 해결 및 대안 탐색"),
      microcopy: pick(locale, "Digs up concrete, multi-angle fixes when things get stuck", "막힌 구간에서 다각도의 구체적인 해결안을 발굴"),
    });
  }
  if (empathyScore >= 60 || innate.support_giving_style === "nurturing_empath") {
    topContributions.push({
      title: pick(locale, "Smoothing relationships and communication", "관계 및 소통 조율"),
      microcopy: pick(locale, "Reduces friction between stakeholders and builds a cooperative atmosphere", "이해관계자 간 마찰을 줄이고 협력 분위기 조성"),
    });
  }

  if (topContributions.length < 2 && roleNode?.weapons?.length) {
    roleNode.weapons.slice(0, 3).forEach((w) => {
      topContributions.push({
        title: w,
        microcopy: pick(locale, "A core strength they reliably bring to the team", "팀 안에서 확실하게 발휘하는 핵심 업무 무기"),
      });
    });
  }
  if (topContributions.length < 3) {
    topContributions.push({
      title: pick(locale, "Quality review", "품질 검토"),
      microcopy: pick(locale, "Checks the deliverable for gaps to head off risk before it happens", "결과물의 빠진 조건을 확인하여 리스크 사전에 방지"),
    });
  }

  // -------------------------------------------------------------------
  // 03. 잘 맞는 업무 (Concrete Work Labels)
  // -------------------------------------------------------------------
  const suitableWorkTypes = isPersonA
    ? pick(locale, ["Setting direction", "Making the final call", "Driving projects forward", "External partnerships"], ["방향 설정", "최종 결정", "프로젝트 추진", "대외 협력"])
    : pick(locale, ["Turning plans into specifics", "Quality review", "Problem-solving", "Analysis and systems design"], ["기획 구체화", "품질 검토", "문제 해결", "분석 및 체계 설계"]);

  // -------------------------------------------------------------------
  // 04. 잘 맞는 역할 · 직무 · 기능 (Real-world Role Families)
  // -------------------------------------------------------------------
  const suitableRoles = isPersonA
    ? pick(locale, ["PM / project lead", "Business execution lead", "External partnerships lead"], ["PM / 프로젝트 리드", "사업 실행 리드", "대외협력 리드"])
    : pick(locale, ["Strategy & planning roles", "QA/QC and process design", "Analysis and planning lead"], ["전략기획 역할", "QA/QC 및 프로세스 설계", "분석 및 기획 리드"]);

  // -------------------------------------------------------------------
  // 05. 잘 맞는 팀 · 업무 환경 (Human-Readable Sentences)
  // -------------------------------------------------------------------
  const thrivingEnvironments = isPersonA
    ? pick(
        locale,
        [
          "A place where their scope and decision-making authority are clear",
          "An organization where they can move fast and see results right away",
          "A role where they get to decide how the work gets done",
        ],
        [
          "내 책임 범위와 판단 권한이 분명한 환경",
          "빠르게 실행하고 결과를 즉시 확인할 수 있는 조직",
          "실행 방법을 스스로 결정할 수 있는 자리",
        ],
      )
    : pick(
        locale,
        [
          "A team where the goals and standards are defined up front",
          "An environment that protects real focus time",
          "Work where they can build toward a polished result at a steady pace",
        ],
        [
          "목표와 기준이 먼저 정리되어 있는 팀",
          "혼자 집중할 시간이 보장되는 환경",
          "계획대로 차근차근 완성도를 높일 수 있는 업무",
        ],
      );

  // -------------------------------------------------------------------
  // 06. 일을 잘한다고 느끼는 기준 (Internal Standard: NO Stress/Conflict)
  // -------------------------------------------------------------------
  const valueKeywords = isPersonA
    ? pick(locale, ["Accountability", "Follow-through", "Feasibility"], ["책임", "완결", "실행 가능성"])
    : pick(locale, ["Principle", "Polish", "Structure"], ["원칙", "완성도", "체계성"]);

  const internalStandardSentence =
    dnaNode?.inner_standard ||
    pick(
      locale,
      isPersonA
        ? "Even a great idea doesn't mean much to them until it's actually been executed and turned into a result."
        : "Finishing fast matters less to them than finishing clean — hitting the bar with no loose ends.",
      isPersonA
        ? "좋은 아이디어라도 실제로 실행되어 결과로 나오지 않으면 의미가 작다고 보는 편이에요."
        : "빨리 끝내는 것보다 기준을 충족하고 허점 없이 깔끔하게 마무리하는 것을 중요하게 여겨요.",
    );

  // -------------------------------------------------------------------
  // 07. 맡기면 좋은 일 (Pair-Aware Lightweight Delegation)
  // -------------------------------------------------------------------
  const delegationItems: ConcreteDelegationItem[] = isPersonA
    ? [
        {
          workTitle: pick(locale, "Budget, revenue, and detail review", "예산·수익 및 디테일 검토"),
          partnerName,
          reason: pick(
            locale,
            "Your partner's strength for checking numbers and fine print down to the last detail is sharper here.",
            "숫자와 세부 조건까지 정밀하게 확인하는 강점이 상대에게 더 강해요.",
          ),
        },
        {
          workTitle: pick(locale, "Turning a plan into a detailed structure", "기획안 세부 체계화"),
          partnerName,
          reason: pick(
            locale,
            "Well-suited to turning an idea into a structured document and a step-by-step process.",
            "아이디어를 구조적인 문서와 단계별 프로세스로 정리하는 데 적합해요.",
          ),
        },
      ]
    : [
        {
          workTitle: pick(locale, "Fast on-the-ground coordination and calls", "빠른 현장 조율 및 결단"),
          partnerName,
          reason: pick(
            locale,
            "Your partner's ability to decide on the spot and move straight to the next step is sharper here.",
            "즉시 판단하고 다음 행동으로 추진하는 기동력이 상대에게 더 강해요.",
          ),
        },
        {
          workTitle: pick(locale, "External negotiation and pushing issues forward", "대외 협상 및 이슈 추진"),
          partnerName,
          reason: pick(
            locale,
            "Taking the lead in outside meetings and driving momentum comes naturally to your partner here.",
            "외부와 빠르게 미팅을 갖고 판을 끌고 가는 주도권이 상대에게 자연스러워요.",
          ),
        },
      ];

  if (roleNode?.handoff_tasks?.length) {
    roleNode.handoff_tasks.forEach((t: any) => {
      const rawTitle = typeof t === "string" ? t : t?.task_label || t?.task || t?.title || t?.workTitle;
      const genericTaskLabel = pick(locale, "detail work", "세부 업무");
      const title =
        !rawTitle || rawTitle === genericTaskLabel || rawTitle === "세부 업무"
          ? pick(locale, isPersonA ? "Expanding plans and ideas" : "Driving the project forward", isPersonA ? "기획·아이디어 확장" : "프로젝트 추진 관리")
          : rawTitle;
      const reason =
        typeof t === "object" && t?.reason
          ? t.reason
          : pick(locale, `An area where handing this to ${partnerName} raises overall output`, `${partnerName}님에게 맡길 때 전체 생산성이 높아지는 영역`);
      delegationItems.unshift({
        workTitle: title,
        partnerName,
        reason,
      });
    });
  }

  // -------------------------------------------------------------------
  // 08. 본래의 업무 기질 vs 지금 일하는 방식 (Innate CE vs 11-Axis)
  // -------------------------------------------------------------------
  const isSpontaneousInnate = innate.structure_spontaneity === "spontaneous_creative_flow";
  const isHighStructuredCurrent = structureScore >= 65;

  let status: "aligned" | "adapted" | "low_confidence" = "aligned";
  let innateTraits = isPersonA
    ? pick(locale, ["Fast judgment", "Hands-on execution"], ["빠른 판단", "현장 실행"])
    : pick(locale, ["Independent focus", "Sticking to principle"], ["독립 집중", "원칙 준수"]);
  let currentTraits = isPersonA
    ? pick(locale, ["Goal focus", "Systematic management"], ["목표 집중", "체계적 관리"])
    : pick(locale, ["Precise planning", "Quality review"], ["정밀 계획", "품질 검토"]);
  let synthesisSentence = pick(
    locale,
    isPersonA
      ? "Their natural drive to push things forward on the ground now blends smoothly with a learned ability to manage schedules and goals."
      : "Their natural caution and sense of principle line up well with how precisely they execute work today.",
    isPersonA
      ? "타고난 현장 추진력에 경험을 통해 일정과 목표를 관리하는 능력이 매끄럽게 어우러진 모습이에요."
      : "본래 가지고 있는 신중함과 원칙 기준이 현재 업무의 정밀한 실행 방식과 잘 맞물려 있습니다.",
  );

  if (isSpontaneousInnate && isHighStructuredCurrent) {
    status = "adapted";
    innateTraits = pick(locale, ["Flexible problem-solving", "Open-ended options"], ["유연한 문제 해결", "자유로운 대안"]);
    currentTraits = pick(locale, ["Heavy structure and planning", "Tight deadline management"], ["높은 계획 구조화", "마감 밀착 관리"]);
    synthesisSentence = pick(
      locale,
      "Their natural strength is adapting flexibly to the situation, but they've since picked up a much more careful, structured way of managing schedules and plans, and lean on it often.",
      "본래는 상황에 맞춰 유연하게 움직이는 힘이 강하지만, 지금은 일정과 계획을 꼼꼼하게 관리하는 방식도 많이 익혀 사용하고 있어요.",
    );
  }

  return {
    name,
    identityLabel,
    keyTraits,
    workStyleBehaviors,
    topContributions: topContributions.slice(0, 4),
    suitableWorkTypes,
    suitableRoles,
    thrivingEnvironments,
    valueKeywords,
    internalStandardSentence,
    delegationItems: delegationItems.slice(0, 3),
    innateVsCurrent: {
      status,
      innateTraits,
      currentTraits,
      synthesisSentence,
    },
  };
}

export function buildIndividualWorkChapterBundle(
  params: BuildIndividualWorkChapterParams
): IndividualWorkChapterBundle {
  const { nameA, nameB, psychA, psychB, sajuChartA, sajuChartB, officeReport, locale = LEGACY_FALLBACK_LOCALE } = params;

  const aName = nameA || pick(locale, "Person A", "A님");
  const bName = nameB || pick(locale, "Person B", "B님");

  const dummySajuData = { birthYear: 1990, birthMonth: 1, birthDay: 1, birthHour: 12 };
  const roleMap = buildCanonicalWorkRoleMap({
    nameA: aName,
    nameB: bName,
    sajuJsonA: dummySajuData,
    sajuJsonB: dummySajuData,
    psychA,
    psychB,
    locale,
  });

  const officeDna = officeReport?.office?.section_dna;
  const officeRoles = officeReport?.office?.section_roles;

  const personA = buildSinglePersonWorkProfile({
    name: aName,
    partnerName: bName,
    isPersonA: true,
    psych: psychA,
    chart: sajuChartA,
    dnaNode: officeDna?.person_a,
    roleNode: officeRoles?.person_a,
    roleProfile: roleMap.personA,
    locale,
  });

  const personB = buildSinglePersonWorkProfile({
    name: bName,
    partnerName: aName,
    isPersonA: false,
    psych: psychB,
    chart: sajuChartB,
    dnaNode: officeDna?.person_b,
    roleNode: officeRoles?.person_b,
    roleProfile: roleMap.personB,
    locale,
  });

  // -------------------------------------------------------------------
  // 09. 가장 닮은 점 / 가장 다른 점 (2 Compact Insights)
  // -------------------------------------------------------------------
  const isSameEngine = personA.identityLabel === personB.identityLabel;
  const mostSimilarInsight = isSameEngine
    ? pick(
        locale,
        `You're both similarly [${personA.keyTraits[0]}], which means you read each other's pace and intent quickly.`,
        `두 사람은 [${personA.keyTraits[0]}] 성향이 유사하여 일의 추진 템포와 의도를 빠르게 파악합니다.`,
      )
    : pick(
        locale,
        `You share a baseline of trust rooted in a shared sense of professional responsibility to see things through.`,
        `두 사람은 일의 최종 완결을 책임지려는 프로의식 측면에서 기본 신뢰가 형성되어 있습니다.`,
      );

  const mostDifferentInsight = pick(
    locale,
    `${personA.name} is strongest at ${personA.suitableWorkTypes[0]}, while ${personB.name} is strongest at ${personB.suitableWorkTypes[0]} — you bring different strengths to the table.`,
    `[${personA.name}]님은 ${personA.suitableWorkTypes[0]}에 강점이 있고, [${personB.name}]님은 ${personB.suitableWorkTypes[0]}에 강점이 있어 서로의 무기가 다릅니다.`,
  );

  return {
    personA,
    personB,
    mostSimilarInsight,
    mostDifferentInsight,
  };
}
