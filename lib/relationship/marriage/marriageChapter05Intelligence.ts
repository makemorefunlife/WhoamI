import type { MarriageRuleContext } from "./buildMarriageRuleContext";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { Locale } from "@/lib/i18n/locale";
import { pick } from "./marriageCopy";
import { resolvePrimaryAxisValue } from "./marriageEvidenceResolution";
import { profileTenGods, type PersonTenGodProfile } from "./marriageTenGodAnalysis";

export type CapabilityActor = "A_DOMINANT" | "B_DOMINANT" | "SHARED_STRENGTH" | "SHARED_GAP" | "ROLE_VACUUM" | "COMPLEMENTARY";

export type CapabilityPairAnalysis = {
  capabilityKey: "PLAN" | "DECIDE" | "EXECUTE" | "MAINTAIN" | "CHECK" | "ADAPT";
  capabilityLabel: string;
  leadName: string;
  actor: CapabilityActor;
  narrative: string;
};

export type CoupleOperatingSystemSection = {
  title: string;
  teamTypeTitle: string;
  capabilities: CapabilityPairAnalysis[];
  pairInsight: string;
};

export type MoneyBehaviorSection = {
  title: string;
  importantValueA: string;
  spendingStyleA: string;
  savingStyleA: string;
  importantValueB: string;
  spendingStyleB: string;
  savingStyleB: string;
  togetherInsight: string;
  underPressureInsight?: string;
};

export type WealthBuildingStyleSection = {
  title: string;
  baseStyleA: string;
  opportunityStyleA: string;
  naturalDirectionA: string;
  cautionPatternA: string;
  baseStyleB: string;
  opportunityStyleB: string;
  naturalDirectionB: string;
  cautionPatternB: string;
  pairSynergyInsight: string;
};

export type CrisisResilienceRoleKey = "REALITY_ORGANIZER" | "INCOME_EXPLORER" | "RISK_TAKER" | "ENDURANCE_HOLDER";

export type PairCrisisResilienceRole = {
  roleKey: CrisisResilienceRoleKey;
  roleLabel: string;
  personName: string;
};

export type IndividualLivelihoodProfile = {
  personName: string;
  editorialLabel: string;
  narrative: string;
};

export type EconomicCrisisResilienceSection = {
  title: string;
  pairRoles: PairCrisisResilienceRole[];
  oneLineSynthesis: string;
  profileA: IndividualLivelihoodProfile;
  profileB: IndividualLivelihoodProfile;
};

export type MoneyDecisionStepKey = "FIND" | "TRACK" | "CHECK" | "ACT" | "REVIEW";

export type MoneyDecisionStep = {
  stepKey: MoneyDecisionStepKey;
  stepLabel: string;
  actorName: string;
  confidence: "HIGH" | "MODERATE" | "LOW";
};

export type MajorMoneyDecisionsSection = {
  title: string;
  steps: MoneyDecisionStep[];
  oneLineSynthesis: string;
};

export type FinancialOperationSection = {
  title: string;
  flowTracker: string;
  billsAndDocs: string;
  largeExpenseCheck: string;
  operationStyle: string;
  operationInsight: string;
  boundaryInsight?: string;
};

export type HouseholdMapEnding = {
  title: string;
  moneyBehaviorSummary: string;
  wealthStyleSummary: string;
  bigMoneyDecisionSummary: string;
  lifeCompetenceSummary: string;
};

export type MarriageChapter05Intelligence = {
  introQuestion: string;
  coupleOperatingSystem: CoupleOperatingSystemSection; // 01
  moneyBehavior: MoneyBehaviorSection; // 02
  wealthBuildingStyle: WealthBuildingStyleSection; // 03
  majorMoneyDecisions: MajorMoneyDecisionsSection; // 04
  financialOperation: FinancialOperationSection; // 05
  economicCrisisResilience: EconomicCrisisResilienceSection; // 06
  householdMapEnding: HouseholdMapEnding; // ENDING
};

export function buildMarriageChapter05Intelligence(params: {
  ctx: MarriageRuleContext;
  psychA?: PsychMasterJson | null;
  psychB?: PsychMasterJson | null;
  locale?: Locale;
}): MarriageChapter05Intelligence {
  const { ctx, psychA, psychB, locale = "ko-KR" } = params;
  const isEn = locale === "en-US";
  const nameA = ctx.nicknameA;
  const nameB = ctx.nicknameB;

  const countsA = ctx.tenGod?.countsA ?? {};
  const countsB = ctx.tenGod?.countsB ?? {};
  const axesA = psychA?.secondary_axes ?? {};
  const axesB = psychB?.secondary_axes ?? {};

  // Family-level Ten God aggregates (재성/관성/식상/인성/비겁). `countsA`/`countsB`
  // are only ever keyed by SPECIFIC Ten God labels (정재, 편재, 정관, 편관, 식신,
  // 상관, 정인, 편인, 비견, 겁재) — every formula below that needs a family total
  // (e.g. "관성" = 정관+편관) must read it from here, never index `counts[]` by
  // the family name directly (that key can never exist and always resolves to 0).
  const profileA: PersonTenGodProfile = profileTenGods(countsA);
  const profileB: PersonTenGodProfile = profileTenGods(countsB);

  // `adaptability`, `stability`, and `growth` are PRIMARY-axis names, not
  // SecondaryAxisKey values — psych.secondary_axes.adaptability etc. was
  // always undefined and silently defaulted through `?? 50`, so the Psych
  // half of these specific sub-scores never actually fired for anyone.
  // resolvePrimaryAxisValue derives the real approximated primary-axis
  // value from the actual secondary-axis SSOT instead (or null when no
  // psych profile exists at all, same as the other axes' `?? 50` fallback
  // below, applied explicitly rather than through a wrong key name).
  const adaptabilityA = resolvePrimaryAxisValue(psychA, "adaptability");
  const adaptabilityB = resolvePrimaryAxisValue(psychB, "adaptability");
  const stabilityA = resolvePrimaryAxisValue(psychA, "stability");
  const stabilityB = resolvePrimaryAxisValue(psychB, "stability");
  const growthA = resolvePrimaryAxisValue(psychA, "growth");
  const growthB = resolvePrimaryAxisValue(psychB, "growth");

  // ---------------------------------------------------------------------------
  // 01. COUPLE_OPERATING_SYSTEM
  //
  // Each score = (relevant Ten God family count(s), weighted) + (a psych axis
  // clearing a threshold ? bonus : 0). Family counts are integers 0-3 and the
  // five families always sum to 3 per person (one entry per non-day pillar),
  // so a single un-weighted family count of 1 contributes only 1 point — that
  // alone should never be enough to call someone "dominant" at a capability.
  // Thresholds below are sized against the RESTORED (live) range, not the old
  // range where the Saju term was always 0 and the psych bonus (0 or 2) was
  // the only thing that could ever move the score.
  // ---------------------------------------------------------------------------
  const planA = profileA.seal * 1.5 + profileA.officer + ((axesA.structure ?? 50) > 60 ? 2 : 0);
  const planB = profileB.seal * 1.5 + profileB.officer + ((axesB.structure ?? 50) > 60 ? 2 : 0);

  const decA = profileA.self * 1.5 + profileA.food + ((axesA.decision_style ?? 50) > 60 ? 2 : 0);
  const decB = profileB.self * 1.5 + profileB.food + ((axesB.decision_style ?? 50) > 60 ? 2 : 0);

  const execA = profileA.food * 1.5 + profileA.self + ((axesA.energy_style ?? 50) > 60 ? 2 : 0);
  const execB = profileB.food * 1.5 + profileB.self + ((axesB.energy_style ?? 50) > 60 ? 2 : 0);

  const maintA = profileA.officer * 1.5 + profileA.wealth + ((axesA.self_control ?? 50) > 60 ? 2 : 0);
  const maintB = profileB.officer * 1.5 + profileB.wealth + ((axesB.self_control ?? 50) > 60 ? 2 : 0);

  const checkA = profileA.seal + profileA.wealth + ((axesA.practicality ?? 50) > 60 ? 2 : 0);
  const checkB = profileB.seal + profileB.wealth + ((axesB.practicality ?? 50) > 60 ? 2 : 0);

  const adaptA = profileA.food + ((adaptabilityA ?? 50) > 60 ? 2 : 0);
  const adaptB = profileB.food + ((adaptabilityB ?? 50) > 60 ? 2 : 0);

  // Minimum gap to call a capability directional: bigger than the smallest
  // possible single-family signal (1 point) so one weak Saju term alone can't
  // decide it — needs either a real psych flip (2) or a combined Saju+psych
  // edge. "Shared strength" (>=3) requires a genuinely non-trivial combined
  // score on BOTH sides, not just "didn't lose." "Role vacuum" now means what
  // its label says — literally no family signal AND no psych flip on EITHER
  // side (score === 0) — not merely "psych didn't flip" as before.
  const DOMINANCE_GAP = 2;
  const SHARED_STRENGTH_FLOOR = 3;
  const VACUUM_CEILING = 1;

  const resolveActor = (scoreA: number, scoreB: number): { leadName: string; actor: CapabilityActor } => {
    const diff = scoreA - scoreB;
    if (diff >= DOMINANCE_GAP) return { leadName: pick(locale, `${nameA}-led`, `${nameA} 중심`), actor: "A_DOMINANT" };
    if (diff <= -DOMINANCE_GAP) return { leadName: pick(locale, `${nameB}-led`, `${nameB} 중심`), actor: "B_DOMINANT" };
    if (scoreA >= SHARED_STRENGTH_FLOOR && scoreB >= SHARED_STRENGTH_FLOOR) return { leadName: pick(locale, "Both are strong here", "둘 다 강점"), actor: "SHARED_STRENGTH" };
    if (scoreA < VACUUM_CEILING && scoreB < VACUUM_CEILING) return { leadName: pick(locale, "No natural owner yet", "아직 정해진 담당이 없음"), actor: "ROLE_VACUUM" };
    return { leadName: pick(locale, "Natural collaboration", "자연스러운 협력"), actor: "COMPLEMENTARY" };
  };

  // Label and prose MUST read the same resolved state — the earlier bug had
  // ROLE_VACUUM's label ("prone to mutual procrastination") paired with a
  // narrative borrowed from the COMPLEMENTARY/SHARED_STRENGTH branch that
  // described active, positive collaboration for the same fact. Each state
  // now gets its own narrative rather than collapsing 3 non-dominant states
  // into one shared sentence.
  const describeCapability = (
    actor: CapabilityActor,
    aText: string,
    bText: string,
    sharedText: string,
    complementaryText: string,
    vacuumText: string,
  ): string => {
    if (actor === "A_DOMINANT") return aText;
    if (actor === "B_DOMINANT") return bText;
    if (actor === "SHARED_STRENGTH") return sharedText;
    if (actor === "ROLE_VACUUM") return vacuumText;
    return complementaryText;
  };

  const planActor = resolveActor(planA, planB);
  const decActor = resolveActor(decA, decB);
  const execActor = resolveActor(execA, execB);
  const maintActor = resolveActor(maintA, maintB);
  const checkActor = resolveActor(checkA, checkB);
  const adaptActor = resolveActor(adaptA, adaptB);

  const capabilities: CapabilityPairAnalysis[] = [
    {
      capabilityKey: "PLAN",
      capabilityLabel: pick(locale, "Setting direction", "방향 잡기"),
      leadName: planActor.leadName,
      actor: planActor.actor,
      narrative: describeCapability(
        planActor.actor,
        pick(locale, `${nameA} tends to shape the goal and the overall framework first.`, `${nameA}님이 목표와 전체 틀을 먼저 구상하는 편입니다.`),
        pick(locale, `${nameB} tends to refine the overall direction and priorities first.`, `${nameB}님이 전체 방향과 우선순위를 먼저 가다듬는 편입니다.`),
        pick(locale, "Both of you have a real, independent instinct for direction-setting.", "두 사람 모두 방향을 잡는 감각이 뚜렷한 편입니다."),
        pick(locale, "Both of you think through the overall goal together and set the direction as a team.", "두 사람 모두 전체적인 목표를 함께 고민하고 방향을 잡는 흐름을 보입니다."),
        pick(locale, "Neither of you has a clear natural edge on setting direction yet — it helps to name an owner in advance rather than assume the other will start.", "아직 방향을 잡는 데 뚜렷한 우위가 있는 쪽이 없어, 상대가 먼저 나설 거라 기대하기보다 담당자를 미리 정해두는 편이 안전합니다."),
      ),
    },
    {
      capabilityKey: "DECIDE",
      capabilityLabel: pick(locale, "Making decisions", "결정 내리기"),
      leadName: decActor.leadName,
      actor: decActor.actor,
      narrative: describeCapability(
        decActor.actor,
        pick(locale, `${nameA} takes the lead in drawing a conclusion at the moment of choice.`, `${nameA}님이 선택의 순간에 주도적으로 결론을 이끌어냅니다.`),
        pick(locale, `${nameB} stays centered and makes the call at the moment of choice.`, `${nameB}님이 선택의 순간에 중심을 잡고 판단을 내립니다.`),
        pick(locale, "Both of you decide confidently and independently when it counts.", "두 사람 모두 결정적인 순간에 확신을 갖고 판단하는 편입니다."),
        pick(locale, "At important decision points, the two of you actively trade ideas and land on a conclusion together.", "중요한 판단 순간에 두 사람이 활발히 의견을 주고받으며 결론을 냅니다."),
        pick(locale, "Neither of you shows a strong instinct to close out a decision — agree ahead of time on who makes the final call so it doesn't stall.", "결정을 매듭짓는 감각이 어느 쪽도 뚜렷하지 않아, 미리 최종 결정권자를 합의해두지 않으면 판단이 미뤄지기 쉽습니다."),
      ),
    },
    {
      capabilityKey: "EXECUTE",
      capabilityLabel: pick(locale, "Getting it done", "실행하기"),
      leadName: execActor.leadName,
      actor: execActor.actor,
      narrative: describeCapability(
        execActor.actor,
        pick(locale, `${nameA} has strong drive to move decisions into real action quickly.`, `${nameA}님이 결정을 실제 행동으로 빠르게 옮기는 추진력이 강합니다.`),
        pick(locale, `${nameB} handles the necessary legwork and action without delay.`, `${nameB}님이 필요한 실무와 행동을 지체 없이 실행해냅니다.`),
        pick(locale, "Both of you move things into action quickly once a decision is made.", "두 사람 모두 결정이 서면 빠르게 행동으로 옮기는 편입니다."),
        pick(locale, "When something needs doing, the two of you move together at a good pace.", "필요한 일 앞에서 두 사람이 속도감 있게 같이 움직이는 조화를 이룹니다."),
        pick(locale, "Neither of you shows a strong drive to move first here — set a default starter so tasks don't sit unclaimed.", "먼저 움직이는 추진력이 어느 쪽도 뚜렷하지 않아, 기본 담당자를 정해두지 않으면 할 일이 방치되기 쉽습니다."),
      ),
    },
    {
      capabilityKey: "MAINTAIN",
      capabilityLabel: pick(locale, "Keeping it up", "꾸준히 챙기기"),
      leadName: maintActor.leadName,
      actor: maintActor.actor,
      narrative: describeCapability(
        maintActor.actor,
        pick(locale, `${nameA} has real strength in keeping set routines and rules consistent.`, `${nameA}님이 정해진 루틴과 규칙을 변함없이 지켜내는 힘이 큽니다.`),
        pick(locale, `${nameB} is the steady anchor for regular expenses and everyday household upkeep.`, `${nameB}님이 정기적인 지출과 집안의 일상을 꾸준히 챙기는 중심축입니다.`),
        pick(locale, "Both of you are genuinely reliable about keeping routines going.", "두 사람 모두 루틴을 꾸준히 이어가는 데 실제로 강한 편입니다."),
        pick(locale, "You share the recurring routines and daily upkeep between you without either feeling burdened.", "반복적인 일상과 루틴을 서로 부담 없이 이어서 관리하는 조합입니다."),
        pick(locale, "Neither of you has a natural pull toward upkeep tasks — without an explicit rotation, recurring chores can quietly go unowned.", "챙기는 일에 자연스럽게 끌리는 쪽이 어느 쪽도 뚜렷하지 않아, 명시적으로 분담을 정하지 않으면 반복 업무가 방치되기 쉽습니다."),
      ),
    },
    {
      capabilityKey: "CHECK",
      capabilityLabel: pick(locale, "Double-checking", "다시 점검하기"),
      leadName: checkActor.leadName,
      actor: checkActor.actor,
      narrative: describeCapability(
        checkActor.actor,
        pick(locale, `${nameA} catches real-world risks or missing numbers with a second pass.`, `${nameA}님이 현실적인 리스크나 빠진 숫자를 한 번 더 짚어냅니다.`),
        pick(locale, `${nameB} carefully re-checks the fine details and precise spending numbers.`, `${nameB}님이 세부 내역과 꼼꼼한 지출 숫자를 꼼꼼히 재확인합니다.`),
        pick(locale, "Both of you genuinely have a sharp eye for double-checking details.", "두 사람 모두 세부 사항을 다시 점검하는 눈이 실제로 밝은 편입니다."),
        pick(locale, "Both of you have a good eye for detail, catching unexpected expenses before they happen.", "두 사람 모두 꼼꼼히 짚어보는 감각이 있어 돌발 지출을 사전에 예방합니다."),
        pick(locale, "Neither of you naturally gravitates toward re-checking the numbers — build in a scheduled review instead of assuming one of you will catch it.", "숫자를 다시 점검하는 데 자연스럽게 끌리는 쪽이 어느 쪽도 뚜렷하지 않으니, 누군가 알아서 짚어줄 거라 기대하기보다 정기 점검 일정을 따로 두는 편이 좋습니다."),
      ),
    },
    {
      capabilityKey: "ADAPT",
      capabilityLabel: pick(locale, "Handling surprises", "돌발 상황 수습"),
      leadName: adaptActor.leadName,
      actor: adaptActor.actor,
      narrative: describeCapability(
        adaptActor.actor,
        pick(locale, `${nameA} thinks on their feet and finds alternatives when something unexpected happens.`, `${nameA}님이 예기치 못한 상황에서 순발력 있게 대안을 찾습니다.`),
        pick(locale, `${nameB} stays calm and gets the recovery moving when a variable comes up.`, `${nameB}님이 변수가 생겼을 때 당황하지 않고 수습의 물꼬를 틉니다.`),
        pick(locale, "Both of you genuinely adapt well when something unexpected comes up.", "두 사람 모두 돌발 상황에 실제로 유연하게 대처하는 편입니다."),
        pick(locale, "Even when an unexpected variable hits, the two of you adapt flexibly and get back on the same page.", "예상치 못한 변수가 터져도 두 사람이 유연하게 대처하며 기준을 맞춰갑니다."),
        pick(locale, "Neither of you shows a strong natural instinct for handling surprises — agreeing on a simple first-response habit in advance helps more here than for most other tasks.", "돌발 상황에 대한 순발력이 어느 쪽도 뚜렷하지 않아, 다른 영역보다 미리 간단한 대응 습관을 정해두는 것이 특히 도움이 됩니다."),
      ),
    },
  ];

  let teamType = pick(locale, "Role-sharing synergy", "역할 분담형 시너지");
  if (planActor.actor === "A_DOMINANT" && execActor.actor === "B_DOMINANT") {
    teamType = pick(locale, `${nameA} plans × ${nameB} executes`, `${nameA} 기획 × ${nameB} 실행 보완형`);
  } else if (planActor.actor === "B_DOMINANT" && execActor.actor === "A_DOMINANT") {
    teamType = pick(locale, `${nameB} plans × ${nameA} executes`, `${nameB} 기획 × ${nameA} 실행 보완형`);
  } else if (planActor.actor === "SHARED_STRENGTH" || execActor.actor === "SHARED_STRENGTH") {
    teamType = pick(locale, "Joint-lead household", "동반 주도형 패밀리");
  }

  const coupleOperatingSystem: CoupleOperatingSystemSection = {
    title: isEn ? "01. Household Operating System" : "01. 우리 집은 누가 어떻게 굴릴까?",
    teamTypeTitle: teamType,
    capabilities,
    pairInsight: pick(
      locale,
      `Rather than one of you steering everything alone, ${nameA} and ${nameB} tend to naturally trade the lead depending on whose strengths fit the task at hand.`,
      `${nameA}님과 ${nameB}님은 한 사람이 독단적으로 끌어가기보다, 각자의 강점이 발휘되는 업무에서自然스러운 주도권을 번갈아 주고받는 운영 방식을 보입니다.`,
    ),
  };

  // ---------------------------------------------------------------------------
  // 02. MONEY_BEHAVIOR
  // ---------------------------------------------------------------------------
  const secA = (countsA["정재"] ?? 0) > 0 || (stabilityA ?? 50) > 60;
  const expA = (countsA["편재"] ?? 0) > 0 || (axesA.stimulation ?? 50) > 60;
  const secB = (countsB["정재"] ?? 0) > 0 || (stabilityB ?? 50) > 60;
  const expB = (countsB["편재"] ?? 0) > 0 || (axesB.stimulation ?? 50) > 60;

  const moneyBehavior: MoneyBehaviorSection = {
    title: isEn ? "02. Money Behavior" : "02. 우리는 어떻게 쓰고, 어떻게 모을까?",
    importantValueA: secA ? pick(locale, "A stable future foundation", "안정된 미래 기반") : expA ? pick(locale, "The quality of life right now", "현재 삶의 경험과 질") : pick(locale, "Freedom to live by their own values", "자유로운 가치 실현"),
    spendingStyleA: expA ? pick(locale, "Spends without hesitation on experiences and growth", "경험과 성장에 주저 없이 투입") : pick(locale, "Spends within a planned budget", "계획된 예산 범위 안에서 지출"),
    savingStyleA: secA ? pick(locale, "Sets a target amount and saves toward it first", "목표액을 정해두고 우선 저축") : pick(locale, "Steadily saves whatever's left over", "여유 자금이 생길 때 꾸준히 누적"),
    importantValueB: secB ? pick(locale, "A stable future foundation", "안정된 미래 기반") : expB ? pick(locale, "The quality of life right now", "현재 삶의 경험과 질") : pick(locale, "Freedom to live by their own values", "자유로운 가치 실현"),
    spendingStyleB: expB ? pick(locale, "Spends without hesitation on experiences and growth", "경험과 성장에 주저 없이 투입") : pick(locale, "Spends within a planned budget", "계획된 예산 범위 안에서 지출"),
    savingStyleB: secB ? pick(locale, "Sets a target amount and saves toward it first", "목표액을 정해두고 우선 저축") : pick(locale, "Steadily saves whatever's left over", "여유 자금이 생길 때 꾸준히 누적"),
    togetherInsight: secA === secB
      ? pick(locale, "Both of you share a similar sense of what money means and where spending lines are, so there's little unnecessary friction over purchases.", "두 사람 모두 돈의 의미와 지출의 기준이 비슷하여 소비로 인한 불필요한 마찰이 적은 편입니다.")
      : pick(locale, "One of you prioritizes security, the other prioritizes experience, so it helps to run separate budgets for 'future assets' and 'today's enjoyment.'", "한 쪽은 안정을, 한 쪽은 경험을 우선시하므로 예산을 '미래 자산'과 '오늘의 즐거움'으로 분리하여 운용하는 것이 좋습니다."),
    underPressureInsight: (axesA.resilience !== undefined && axesB.resilience !== undefined)
      ? pick(locale, "When spare cash shrinks, the two of you tend to calmly rework fixed expenses first rather than cutting spending indiscriminately.", "여유 자금이 줄어들면 두 사람은 무작정 소비를 끊기보다 고정 지출 항목부터 차분히 재정비하는 성향을 보입니다.")
      : undefined,
  };

  // ---------------------------------------------------------------------------
  // 03. WEALTH_BUILDING_STYLE
  // ---------------------------------------------------------------------------
  const riskA = (growthA ?? 50) > 60 || (countsA["편재"] ?? 0) > 0;
  const riskB = (growthB ?? 50) > 60 || (countsB["편재"] ?? 0) > 0;

  const wealthBuildingStyle: WealthBuildingStyleSection = {
    title: isEn ? "03. Wealth Building Style" : "03. 우리 돈은 어떤 방식으로 키우는 게 잘 맞을까?",
    baseStyleA: riskA ? pick(locale, "Leans toward inflation protection and growing assets over just preserving principal", "원금 보존보다 인플레이션 방어와 자산 확장 지향") : pick(locale, "Prefers steady, reliable asset building over market volatility", "시장의 변동성보다 확실하고 안정적인 자산 축적 선호"),
    opportunityStyleA: riskA ? pick(locale, "Approaches promising growth opportunities carefully", "유망한 성장 가능성에 신중하게 접근") : pick(locale, "Focuses on thoroughly proven, safe assets", "충분히 검증된 안전 자산에 집중"),
    naturalDirectionA: riskA ? pick(locale, "Long-term diversified investing and growth-oriented assets", "장기 분산 적립 및 성장 자산 운용") : pick(locale, "Automatic long-term saving and principal-preserving assets", "자동 장기 축적 및 원금 보존형 자산"),
    cautionPatternA: riskA ? pick(locale, "Watch out for getting overly sensitive to short-term volatility", "단기 변동성에 과도하게 민감해지는 것 조심") : pick(locale, "Watch out for freezing funds too conservatively", "과도하게 보수적인 자금 동결 조심"),
    baseStyleB: riskB ? pick(locale, "Leans toward inflation protection and growing assets over just preserving principal", "원금 보존보다 인플레이션 방어와 자산 확장 지향") : pick(locale, "Prefers steady, reliable asset building over market volatility", "시장의 변동성보다 확실하고 안정적인 자산 축적 선호"),
    opportunityStyleB: riskB ? pick(locale, "Approaches promising growth opportunities carefully", "유망한 성장 가능성에 신중하게 접근") : pick(locale, "Focuses on thoroughly proven, safe assets", "충분히 검증된 안전 자산에 집중"),
    naturalDirectionB: riskB ? pick(locale, "Long-term diversified investing and growth-oriented assets", "장기 분산 적립 및 성장 자산 운용") : pick(locale, "Automatic long-term saving and principal-preserving assets", "자동 장기 축적 및 원금 보존형 자산"),
    cautionPatternB: riskB ? pick(locale, "Watch out for getting overly sensitive to short-term volatility", "단기 변동성에 과도하게 민감해지는 것 조심") : pick(locale, "Watch out for freezing funds too conservatively", "과도하게 보수적인 자금 동결 조심"),
    pairSynergyInsight: riskA !== riskB
      ? pick(locale, `${nameA} and ${nameB} balance each other well — one partner's drive to grow assets and the other's sense of risk control combine into a balanced approach to building wealth.`, `${nameA}님과 ${nameB}님은 한 사람의 확장 욕구와 다른 한 사람의 리스크 제어 감각이 조화를 이루어 밸런스 있는 자산 형성이 가능합니다.`)
      : pick(locale, "Your values around managing assets line up, which makes synergy easy — but it's worth making a habit of regularly reviewing risk together.", "두 사람의 자산 관리 가치관이 일치하여 시너지 효과를 내기 쉽지만, 리스크 검토 과정을 정례화하는 것이 안전합니다."),
  };

  // ---------------------------------------------------------------------------
  // 04. MAJOR_MONEY_DECISIONS (Money & Investment Decision Lifecycle)
  // ---------------------------------------------------------------------------
  const findA = profileA.food * 1.5 + profileA.self + ((growthA ?? 50) > 55 ? 1.5 : 0) + ((axesA.stimulation ?? 50) > 55 ? 1 : 0);
  const findB = profileB.food * 1.5 + profileB.self + ((growthB ?? 50) > 55 ? 1.5 : 0) + ((axesB.stimulation ?? 50) > 55 ? 1 : 0);

  const trackA = profileA.officer + profileA.seal + profileA.wealth + ((axesA.self_control ?? 50) > 55 ? 1.5 : 0) + ((axesA.structure ?? 50) > 55 ? 1.5 : 0);
  const trackB = profileB.officer + profileB.seal + profileB.wealth + ((axesB.self_control ?? 50) > 55 ? 1.5 : 0) + ((axesB.structure ?? 50) > 55 ? 1.5 : 0);

  const chkA = profileA.seal * 1.5 + profileA.officer + profileA.wealth + ((axesA.practicality ?? 50) > 55 ? 2 : 0) + ((axesA.thinking_style ?? 50) > 55 ? 1 : 0);
  const chkB = profileB.seal * 1.5 + profileB.officer + profileB.wealth + ((axesB.practicality ?? 50) > 55 ? 2 : 0) + ((axesB.thinking_style ?? 50) > 55 ? 1 : 0);

  const actA = profileA.food + profileA.self * 1.5 + profileA.wealth + ((axesA.decision_style ?? 50) > 55 ? 1.5 : 0) + ((axesA.energy_style ?? 50) > 55 ? 1.5 : 0);
  const actB = profileB.food + profileB.self * 1.5 + profileB.wealth + ((axesB.decision_style ?? 50) > 55 ? 1.5 : 0) + ((axesB.energy_style ?? 50) > 55 ? 1.5 : 0);

  const reviewA = profileA.seal + profileA.officer * 1.5 + ((axesA.structure ?? 50) > 55 ? 1.5 : 0) + ((axesA.resilience ?? 50) > 55 ? 1 : 0);
  const reviewB = profileB.seal + profileB.officer * 1.5 + ((axesB.structure ?? 50) > 55 ? 1.5 : 0) + ((axesB.resilience ?? 50) > 55 ? 1 : 0);

  // Same reasoning as DOMINANCE_GAP above: with the Saju terms restored, a
  // gap of ~1 point can come from a single un-weighted family count alone.
  // Require a gap that reflects more than one weak signal before naming an
  // individual actor instead of "both of you".
  const STEP_DOMINANCE_GAP = 1.8;
  const resolveStepActor = (scoreA: number, scoreB: number): string => {
    const diff = scoreA - scoreB;
    if (diff >= STEP_DOMINANCE_GAP) return nameA;
    if (diff <= -STEP_DOMINANCE_GAP) return nameB;
    return pick(locale, "Both of you", "둘 다");
  };

  // Each step's combined score mixes a real Saju family term with a Psych
  // term. "HIGH" confidence should mean both sources actually agree on the
  // named actor — not be a flat default regardless of whether the result
  // came from real Saju+Psych convergence, Psych alone, or no clear
  // direction at all ("both of you"). Saju-only sub-scores mirror each
  // step's own formula above, computed separately purely to check
  // agreement — they do not change resolveStepActor's existing behavior.
  const findSajuA = profileA.food * 1.5 + profileA.self;
  const findSajuB = profileB.food * 1.5 + profileB.self;
  const trackSajuA = profileA.officer + profileA.seal + profileA.wealth;
  const trackSajuB = profileB.officer + profileB.seal + profileB.wealth;
  const chkSajuA = profileA.seal * 1.5 + profileA.officer + profileA.wealth;
  const chkSajuB = profileB.seal * 1.5 + profileB.officer + profileB.wealth;
  const actSajuA = profileA.food + profileA.self * 1.5 + profileA.wealth;
  const actSajuB = profileB.food + profileB.self * 1.5 + profileB.wealth;
  const reviewSajuA = profileA.seal + profileA.officer * 1.5;
  const reviewSajuB = profileB.seal + profileB.officer * 1.5;

  const bothStepLabel = pick(locale, "Both of you", "둘 다");
  const resolveStepConfidence = (
    actorName: string,
    sajuPartA: number,
    sajuPartB: number,
  ): "HIGH" | "MODERATE" | "LOW" => {
    if (actorName === bothStepLabel) return "MODERATE"; // no clear direction — not a confident individual finding
    const sajuDiff = sajuPartA - sajuPartB;
    const sajuAgreesWithActor = (actorName === nameA && sajuDiff > 0) || (actorName === nameB && sajuDiff < 0);
    return sajuAgreesWithActor ? "HIGH" : "MODERATE"; // Psych-only differentiation is real but single-source
  };

  const findActor = resolveStepActor(findA, findB);
  const trackActor = resolveStepActor(trackA, trackB);
  const chkActor = resolveStepActor(chkA, chkB);
  const actActor = resolveStepActor(actA, actB);
  const reviewActor = resolveStepActor(reviewA, reviewB);

  const steps: MoneyDecisionStep[] = [
    { stepKey: "FIND", stepLabel: pick(locale, "Spotting the opportunity", "기회 찾기"), actorName: findActor, confidence: resolveStepConfidence(findActor, findSajuA, findSajuB) },
    { stepKey: "TRACK", stepLabel: pick(locale, "Keeping an eye on it", "계속 지켜보기"), actorName: trackActor, confidence: resolveStepConfidence(trackActor, trackSajuA, trackSajuB) },
    { stepKey: "CHECK", stepLabel: pick(locale, "Checking the numbers and risk", "숫자·위험 확인"), actorName: chkActor, confidence: resolveStepConfidence(chkActor, chkSajuA, chkSajuB) },
    { stepKey: "ACT", stepLabel: pick(locale, "Actually acting on it", "실제 실행"), actorName: actActor, confidence: resolveStepConfidence(actActor, actSajuA, actSajuB) },
    { stepKey: "REVIEW", stepLabel: pick(locale, "One last check", "마지막 점검"), actorName: reviewActor, confidence: resolveStepConfidence(reviewActor, reviewSajuA, reviewSajuB) },
  ];

  const finder = steps[0].actorName;
  const checker = steps[2].actorName;
  const doer = steps[3].actorName;

  const bothLabel = pick(locale, "Both of you", "둘 다");
  const fmtName = (name: string) => (name === bothLabel ? pick(locale, "both of you", "두 사람") : pick(locale, name, `${name}님`));

  let oneLineSynthesis = "";
  if (finder === doer && finder !== bothLabel && checker !== finder && checker !== bothLabel) {
    oneLineSynthesis = pick(
      locale,
      `${fmtName(finder)} tends to open the opportunity and put it into action, while ${fmtName(checker)} keeps tracking it and checking the numbers and risk.`,
      `${fmtName(finder)}이 기회를 열고 실제 행동으로 옮기면, ${fmtName(checker)}이 그 기회를 계속 추적하며 숫자와 위험을 확인하는 흐름에 가깝습니다.`,
    );
  } else if (finder !== doer && finder !== bothLabel && doer !== bothLabel) {
    oneLineSynthesis = pick(
      locale,
      `${fmtName(finder)} explores new investment opportunities, ${fmtName(checker)} reviews the numbers and conditions, and then ${fmtName(doer)} carries it through to execution.`,
      `${fmtName(finder)}이 새로운 투자 기회를 탐색하고 ${fmtName(checker)}이 숫자와 조건을 검토한 뒤, 최종 실행은 ${fmtName(doer)}이 밀어주는 워크플로우를 보입니다.`,
    );
  } else if (finder === bothLabel || doer === bothLabel) {
    oneLineSynthesis = pick(
      locale,
      "Both of you are equally driven to find and act on opportunities, so it's worth making a habit of checking the numbers and risk before you commit.",
      "두 사람 모두 기회를 찾고 실행하는 추진력은 활발하지만, 사전 숫자·위험 점검 단계를 정례화하는 것이 안전합니다.",
    );
  } else {
    oneLineSynthesis = pick(
      locale,
      `When ${fmtName(finder)} spots an opportunity, ${fmtName(checker)} reviews the risk and the numbers from multiple angles before you finalize the decision together.`,
      `${fmtName(finder)}이 기회를 포착하면 ${fmtName(checker)}이 리스크와 숫자를 다각도로 검토한 후 함께 결정을 완성해가는 흐름입니다.`,
    );
  }

  const majorMoneyDecisions: MajorMoneyDecisionsSection = {
    title: isEn ? "04. Major Money & Investment Decisions" : "04. 큰돈과 투자 기회 앞에서 우리는 어떻게 움직일까?",
    steps,
    oneLineSynthesis,
  };

  // ---------------------------------------------------------------------------
  // 05. FINANCIAL_OPERATION
  // ---------------------------------------------------------------------------
  const opScoreA = profileA.wealth + profileA.officer + ((axesA.structure ?? 50) > 55 ? 2 : 0);
  const opScoreB = profileB.wealth + profileB.officer + ((axesB.structure ?? 50) > 55 ? 2 : 0);

  // No slot-based default. When the evidence gap doesn't clear a real
  // directional threshold, the honest answer is a shared/neutral pattern —
  // NOT "A tracks cash flow, B handles paperwork" by construction of which
  // slot each person happens to occupy (the previous fallback did exactly
  // that for every pair whose opScore gap fell under 2.5).
  const OP_DOMINANCE_GAP = 2.5;
  let opStyle = pick(locale, "Shared roles, jointly managed", "역할 분담 및 공동 관리");
  let opLeadA = pick(locale, "Checked together, no single owner", "함께 확인, 단독 담당자 없음");
  let opLeadB = pick(locale, "Organized together, no single owner", "함께 정리, 단독 담당자 없음");

  if (opScoreA - opScoreB >= OP_DOMINANCE_GAP) {
    opStyle = pick(locale, `${nameA} leads overall management`, `${nameA} 주도 총괄 관리`);
    opLeadA = pick(locale, `${nameA} (overall execution)`, `${nameA} (전반적 집행)`);
    opLeadB = pick(locale, `${nameB} (kept in the loop)`, `${nameB} (상호 공유)`);
  } else if (opScoreB - opScoreA >= OP_DOMINANCE_GAP) {
    opStyle = pick(locale, `${nameB} leads overall management`, `${nameB} 주도 총괄 관리`);
    opLeadA = pick(locale, `${nameA} (kept in the loop)`, `${nameA} (상호 공유)`);
    opLeadB = pick(locale, `${nameB} (overall execution)`, `${nameB} (전반적 집행)`);
  }

  const financialOperation: FinancialOperationSection = {
    title: isEn ? "05. Financial Operation" : "05. 평소 돈 관리는 누가 더 자연스러울까?",
    flowTracker: opLeadA,
    billsAndDocs: opLeadB,
    largeExpenseCheck: pick(locale, "Both confirm together", "둘 다 공동 확인"),
    operationStyle: opStyle,
    operationInsight: pick(
      locale,
      "It runs smoothest when there's a clear owner for monthly fixed expenses and account flow, paired with a regular check-in on where things stand.",
      "매월 고정 지출과 통장 흐름은 담당자를 명확히 두고, 정기적인 자산 현황 브리핑을 통해 투명성을 유지할 때 가장 잡음이 없습니다.",
    ),
    // `autonomy` has no secondary-axis derivation anywhere in the product
    // (see marriageEvidenceResolution.ts's note) — this only needs to know
    // whether real psych data exists at all, not read a nonexistent axis.
    boundaryInsight: (psychA != null && psychB != null)
      ? pick(
          locale,
          "Keeping a shared household account separate from each person's own spending money protects both emotional autonomy and household stability at the same time.",
          "공동 생활비 계좌와 각자의 개인 용돈 계좌를 구별하여 운영할 때 정서적 자율성과 가계의 안정성이 동시에 확보됩니다.",
        )
      : undefined,
  };

  // ---------------------------------------------------------------------------
  // 06. ECONOMIC_CRISIS_RESILIENCE (경제적 위기가 오면?)
  // ---------------------------------------------------------------------------
  const realA = profileA.officer * 1.5 + profileA.wealth + profileA.seal + ((axesA.practicality ?? 50) > 55 ? 2 : 0) + ((axesA.self_control ?? 50) > 55 ? 1.5 : 0);
  const realB = profileB.officer * 1.5 + profileB.wealth + profileB.seal + ((axesB.practicality ?? 50) > 55 ? 2 : 0) + ((axesB.self_control ?? 50) > 55 ? 1.5 : 0);

  // `countsA["편재"]` here is a SPECIFIC label (already correctly keyed) added
  // on top of the 식상/비겁 FAMILY terms — 편재 is deliberately weighted as
  // its own extra signal for "explores new income," not folded into `wealth`
  // family here, so it is left as a direct counts[] read rather than routed
  // through profileTenGods().
  const expA_res = profileA.food * 1.5 + profileA.self + (countsA["편재"] ?? 0) + ((adaptabilityA ?? 50) > 55 ? 2 : 0) + ((growthA ?? 50) > 55 ? 1.5 : 0);
  const expB_res = profileB.food * 1.5 + profileB.self + (countsB["편재"] ?? 0) + ((adaptabilityB ?? 50) > 55 ? 2 : 0) + ((growthB ?? 50) > 55 ? 1.5 : 0);

  // `autonomy` has no secondary-axis derivation anywhere in the product
  // (see marriageEvidenceResolution.ts's note) — no Psych term is added for
  // it here rather than reading a key that doesn't exist and always
  // silently resolving to the same neutral default for everyone.
  const rskA = profileA.self * 1.5 + (countsA["편재"] ?? 0) + ((axesA.stimulation ?? 50) > 55 ? 2 : 0);
  const rskB = profileB.self * 1.5 + (countsB["편재"] ?? 0) + ((axesB.stimulation ?? 50) > 55 ? 2 : 0);

  const endA = profileA.officer * 1.5 + profileA.seal + ((axesA.resilience ?? 50) > 55 ? 2 : 0) + ((axesA.self_control ?? 50) > 55 ? 1.5 : 0);
  const endB = profileB.officer * 1.5 + profileB.seal + ((axesB.resilience ?? 50) > 55 ? 2 : 0) + ((axesB.self_control ?? 50) > 55 ? 1.5 : 0);

  const noEdgeLabel = pick(locale, "No clear lead", "뚜렷한 우위 없음");
  // Same restored-range reasoning as above: a gap of 1.5 used to require a
  // full psych flip; now a single un-weighted family count can produce it
  // alone. Widen the directional bar accordingly.
  const CRISIS_DOMINANCE_GAP = 2;
  const resolvePairPerson = (scoreA: number, scoreB: number): string => {
    const diff = scoreA - scoreB;
    if (diff >= CRISIS_DOMINANCE_GAP) return nameA;
    if (diff <= -CRISIS_DOMINANCE_GAP) return nameB;
    if (Math.abs(diff) < 0.5) return bothLabel;
    return noEdgeLabel;
  };

  const pairRoles: PairCrisisResilienceRole[] = [
    { roleKey: "REALITY_ORGANIZER", roleLabel: pick(locale, "The one who gets real first", "먼저 현실을 정리하는 사람"), personName: resolvePairPerson(realA, realB) },
    { roleKey: "INCOME_EXPLORER", roleLabel: pick(locale, "The one who finds new income", "새 수입원을 찾는 사람"), personName: resolvePairPerson(expA_res, expB_res) },
    { roleKey: "RISK_TAKER", roleLabel: pick(locale, "The one who can take the risk", "위험을 감수할 수 있는 사람"), personName: resolvePairPerson(rskA, rskB) },
    { roleKey: "ENDURANCE_HOLDER", roleLabel: pick(locale, "The one who holds on to the end", "끝까지 버티는 사람"), personName: resolvePairPerson(endA, endB) },
  ];

  const organizerPerson = pairRoles[0].personName;
  const explorerPerson = pairRoles[1].personName;

  let crisisOneLine = "";
  if (organizerPerson !== explorerPerson && organizerPerson !== bothLabel && explorerPerson !== bothLabel && organizerPerson !== noEdgeLabel && explorerPerson !== noEdgeLabel) {
    crisisOneLine = pick(locale, "One of you holds the line so things don't collapse, while the other looks for the way back up.", "한 사람은 무너지지 않게 지키고, 다른 사람은 다시 올라갈 방법을 찾는 조합입니다.");
  } else if (organizerPerson === bothLabel || explorerPerson === bothLabel) {
    crisisOneLine = pick(locale, "Both of you have strong instincts and willingness to act in a crisis, making you a partnership that pushes through financial pressure together.", "두 사람 모두 위기 시 현실 감각과 대처 의지가 강하여 경제적 압박을 함께 돌파해 나가는 파트너십입니다.");
  } else {
    crisisOneLine = pick(locale, "Depending on the situation, the two of you trade off between steadying things and getting back on your feet, protecting your financial footing together.", "상황에 따라 두 사람이 기지개와 안정화 역할을 번갈아 나누며 경제적 기반을 수호하는 조화를 이룹니다.");
  }

  const buildIndividualProfile = (
    name: string,
    profile: PersonTenGodProfile,
    axes: Record<string, number>,
    adaptabilityPrimary: number | null,
  ): IndividualLivelihoodProfile => {
    const resScore = (axes.resilience ?? 50) + profile.officer * 10;
    // `adaptability` is a PRIMARY axis, not a secondary-axis key — reading
    // axes.adaptability was always undefined and silently defaulted to 50
    // for everyone, exactly like the same bug already fixed in CH04/CH06.
    const adaptScore = (adaptabilityPrimary ?? 50) + profile.food * 10;
    const stimScore = (axes.stimulation ?? 50) + profile.self * 10;
    const pracScore = (axes.practicality ?? 50) + profile.wealth * 10;

    if (resScore >= adaptScore && resScore >= stimScore && resScore >= pracScore) {
      return {
        personName: name,
        editorialLabel: pick(locale, "Holds the line to the end once responsible for it", "책임지면 끝까지 버티는 생활력"),
        narrative: pick(
          locale,
          `When financial pressure hits, ${name} tends to get realistic first, and will put off their own comfort if needed to protect the household's foundation to the end.`,
          `${name}님은 경제적으로 압박이 생기면 현실을 먼저 정돈하고, 필요하다면 자신의 편안함을 미루면서까지 가정의 기반을 끝까지 지키려는 편입니다.`,
        ),
      };
    } else if (adaptScore >= stimScore && adaptScore >= pracScore) {
      return {
        personName: name,
        editorialLabel: pick(locale, "Breaks through by changing approach", "방법을 바꿔 돌파하는 생활력"),
        narrative: pick(
          locale,
          `When things get stuck, ${name} doesn't stay tied to one approach — they quickly pivot toward new opportunities and alternative sources of income.`,
          `${name}님은 상황이 막혔을 때 한 가지 방식에 메이지 않고, 새로운 기회와 대안을 찾아 발 빠르게 경제적 수입 행동으로 전환하는 편입니다.`,
        ),
      };
    } else if (stimScore >= pracScore) {
      return {
        personName: name,
        editorialLabel: pick(locale, "Moves first when an opportunity appears", "기회가 보이면 먼저 움직이는 생활력"),
        narrative: pick(
          locale,
          `Even in a crisis, ${name} doesn't sit still — they show independent drive, boldly trying something new to change the situation.`,
          `${name}님은 위기 속에서도 주저앉지 않고 과감하게 새로운 시도를 통해 판을 바꾸려 움직이는 독립적인 추진력을 보입니다.`,
        ),
      };
    } else {
      return {
        personName: name,
        editorialLabel: pick(locale, "Cuts risk first and protects the foundation", "위험부터 줄이고 기반을 지키는 생활력"),
        narrative: pick(
          locale,
          `${name} tightens spending and prioritizes stable resource management, giving them an organized way of minimizing the impact of a financial shock.`,
          `${name}님은 지출을 타이트하게 조절하고 안정적인 자원 관리를 최우선으로 두어 경제적 충격을 최소화하는 정돈된 대응력을 가집니다.`,
        ),
      };
    }
  };

  const economicCrisisResilience: EconomicCrisisResilienceSection = {
    title: isEn ? "06. Economic Resilience Under Crisis" : "06. 경제적 위기가 오면?",
    pairRoles,
    oneLineSynthesis: crisisOneLine,
    profileA: buildIndividualProfile(nameA, profileA, axesA, adaptabilityA),
    profileB: buildIndividualProfile(nameB, profileB, axesB, adaptabilityB),
  };

  // ---------------------------------------------------------------------------
  // ENDING. HOUSEHOLD_MAP
  // ---------------------------------------------------------------------------
  const householdMapEnding: HouseholdMapEnding = {
    title: isEn ? "Ending. Household Summary Map" : "우리 집 운영 한눈에 보기",
    moneyBehaviorSummary: pick(locale, `Spending & saving standards: ${moneyBehavior.togetherInsight}`, `돈의 지출과 저축 기준: ${moneyBehavior.togetherInsight}`),
    wealthStyleSummary: pick(locale, `Direction for building wealth: ${wealthBuildingStyle.pairSynergyInsight}`, `자산 형성 방향: ${wealthBuildingStyle.pairSynergyInsight}`),
    bigMoneyDecisionSummary: pick(locale, `Major spending decisions: ${majorMoneyDecisions.oneLineSynthesis}`, `대형 지출 결정: ${majorMoneyDecisions.oneLineSynthesis}`),
    lifeCompetenceSummary: pick(locale, `Resilience under pressure: ${economicCrisisResilience.oneLineSynthesis}`, `위기 대응 생활력: ${economicCrisisResilience.oneLineSynthesis}`),
  };

  return {
    introQuestion: isEn
      ? "How do we operate daily life, money, and household responsibilities as a married team?"
      : "돈을 쓰고 모으는 것부터 집안의 보이지 않는 일까지, 우리는 현실의 삶을 어떻게 함께 굴려가는 부부일까?",
    coupleOperatingSystem,
    moneyBehavior,
    wealthBuildingStyle,
    majorMoneyDecisions,
    financialOperation,
    economicCrisisResilience,
    householdMapEnding,
  };
}

export function createDefaultMarriageChapter05Intelligence(params: {
  nameA: string;
  nameB: string;
  locale?: Locale;
}): MarriageChapter05Intelligence {
  const { nameA, nameB, locale = "ko-KR" } = params;
  const isEn = locale === "en-US";

  return {
    introQuestion: isEn
      ? "How do we operate daily life, money, and household responsibilities as a married team?"
      : "돈을 쓰고 모으는 것부터 집안의 보이지 않는 일까지, 우리는 현실의 삶을 어떻게 함께 굴려가는 부부일까?",
    coupleOperatingSystem: {
      title: isEn ? "01. Household Operating System" : "01. 우리 집은 누가 어떻게 굴릴까?",
      teamTypeTitle: pick(locale, "Complementary role-sharing", "상보적 역할 분담형"),
      capabilities: [
        { capabilityKey: "PLAN", capabilityLabel: pick(locale, "Setting direction", "방향 잡기"), leadName: pick(locale, `${nameA}-led`, `${nameA} 중심`), actor: "A_DOMINANT", narrative: pick(locale, `${nameA} tends to shape the goal and the overall framework first.`, `${nameA}님이 목표와 전체 틀을 먼저 구상하는 편입니다.`) },
        { capabilityKey: "DECIDE", capabilityLabel: pick(locale, "Making decisions", "결정 내리기"), leadName: pick(locale, "Natural collaboration", "자연스러운 협력"), actor: "COMPLEMENTARY", narrative: pick(locale, "At important decision points, the two of you actively trade ideas and land on a conclusion together.", "중요한 판단 순간에 두 사람이 활발히 의견을 주고받으며 결론을 냅니다.") },
        { capabilityKey: "EXECUTE", capabilityLabel: pick(locale, "Getting it done", "실행하기"), leadName: pick(locale, `${nameB}-led`, `${nameB} 중심`), actor: "B_DOMINANT", narrative: pick(locale, `${nameB} handles the necessary legwork and action without delay.`, `${nameB}님이 필요한 실무와 행동을 지체 없이 실행해냅니다.`) },
        { capabilityKey: "MAINTAIN", capabilityLabel: pick(locale, "Keeping it up", "꾸준히 챙기기"), leadName: pick(locale, `${nameB}-led`, `${nameB} 중심`), actor: "B_DOMINANT", narrative: pick(locale, `${nameB} is the steady anchor for regular expenses and everyday household upkeep.`, `${nameB}님이 정기적인 지출과 집안의 일상을 꾸준히 챙기는 중심축입니다.`) },
        { capabilityKey: "CHECK", capabilityLabel: pick(locale, "Double-checking", "다시 점검하기"), leadName: pick(locale, `${nameA}-led`, `${nameA} 중심`), actor: "A_DOMINANT", narrative: pick(locale, `${nameA} catches real-world risks or missing numbers with a second pass.`, `${nameA}님이 현실적인 리스크나 빠진 숫자를 한 번 더 짚어냅니다.`) },
        { capabilityKey: "ADAPT", capabilityLabel: pick(locale, "Handling surprises", "돌발 상황 수습"), leadName: pick(locale, "Both are strong here", "둘 다 강점"), actor: "SHARED_STRENGTH", narrative: pick(locale, "Even when an unexpected variable hits, the two of you adapt flexibly and get back on the same page.", "예상치 못한 변수가 터져도 두 사람이 유연하게 대처하며 기준을 맞춰갑니다.") },
      ],
      pairInsight: pick(
        locale,
        `Rather than one of you steering everything alone, ${nameA} and ${nameB} tend to naturally trade the lead depending on whose strengths fit the task at hand.`,
        `${nameA}님과 ${nameB}님은 한 사람이 독단적으로 끌어가기보다, 각자의 강점이 발휘되는 업무에서 자연스러운 주도권을 번갈아 주고받는 운영 방식을 보입니다.`,
      ),
    },
    moneyBehavior: {
      title: isEn ? "02. Money Behavior" : "02. 우리는 어떻게 쓰고, 어떻게 모을까?",
      importantValueA: pick(locale, "A stable future foundation", "안정된 미래 기반"),
      spendingStyleA: pick(locale, "Spends within a planned budget", "계획된 예산 범위 안에서 지출"),
      savingStyleA: pick(locale, "Sets a target amount and saves toward it first", "목표액을 정해두고 우선 저축"),
      importantValueB: pick(locale, "The quality of life right now", "현재 삶의 경험과 질"),
      spendingStyleB: pick(locale, "Spends without hesitation on experiences and growth", "경험과 성장에 주저 없이 투입"),
      savingStyleB: pick(locale, "Steadily saves whatever's left over", "여유 자금이 생길 때 꾸준히 누적"),
      togetherInsight: pick(locale, "One of you prioritizes security, the other prioritizes experience, so it helps to run separate budgets for 'future assets' and 'today's enjoyment.'", "한 쪽은 안정을, 한 쪽은 경험을 우선시하므로 예산을 '미래 자산'과 '오늘의 즐거움'으로 분리하여 운용하는 것이 좋습니다."),
    },
    wealthBuildingStyle: {
      title: isEn ? "03. Wealth Building Style" : "03. 우리 돈은 어떤 방식으로 키우는 게 잘 맞을까?",
      baseStyleA: pick(locale, "Prefers steady, reliable asset building over market volatility", "시장의 변동성보다 확실하고 안정적인 자산 축적 선호"),
      opportunityStyleA: pick(locale, "Focuses on thoroughly proven, safe assets", "충분히 검증된 안전 자산에 집중"),
      naturalDirectionA: pick(locale, "Automatic long-term saving and principal-preserving assets", "자동 장기 축적 및 원금 보존형 자산"),
      cautionPatternA: pick(locale, "Watch out for freezing funds too conservatively", "과도하게 보수적인 자금 동결 조심"),
      baseStyleB: pick(locale, "Leans toward inflation protection and growing assets over just preserving principal", "원금 보존보다 인플레이션 방어와 자산 확장 지향"),
      opportunityStyleB: pick(locale, "Approaches promising growth opportunities carefully", "유망한 성장 가능성에 신중하게 접근"),
      naturalDirectionB: pick(locale, "Long-term diversified investing and growth-oriented assets", "장기 분산 적립 및 성장 자산 운용"),
      cautionPatternB: pick(locale, "Watch out for getting overly sensitive to short-term volatility", "단기 변동성에 과도하게 민감해지는 것 조심"),
      pairSynergyInsight: pick(
        locale,
        `${nameA} and ${nameB} balance each other well — one partner's drive to grow assets and the other's sense of risk control combine into a balanced approach to building wealth.`,
        `${nameA}님과 ${nameB}님은 한 사람의 확장 욕구와 다른 한 사람의 리스크 제어 감각이 조화를 이루어 밸런스 있는 자산 형성이 가능합니다.`,
      ),
    },
    majorMoneyDecisions: {
      title: isEn ? "04. Major Money & Investment Decisions" : "04. 큰돈과 투자 기회 앞에서 우리는 어떻게 움직일까?",
      steps: [
        { stepKey: "FIND", stepLabel: pick(locale, "Spotting the opportunity", "기회 찾기"), actorName: nameB, confidence: "HIGH" },
        { stepKey: "TRACK", stepLabel: pick(locale, "Keeping an eye on it", "계속 지켜보기"), actorName: nameA, confidence: "HIGH" },
        { stepKey: "CHECK", stepLabel: pick(locale, "Checking the numbers and risk", "숫자·위험 확인"), actorName: nameA, confidence: "HIGH" },
        { stepKey: "ACT", stepLabel: pick(locale, "Actually acting on it", "실제 실행"), actorName: nameB, confidence: "HIGH" },
        { stepKey: "REVIEW", stepLabel: pick(locale, "One last check", "마지막 점검"), actorName: nameA, confidence: "HIGH" },
      ],
      oneLineSynthesis: pick(
        locale,
        `${nameB} tends to open the opportunity and put it into action, while ${nameA} keeps tracking it and checking the numbers and risk.`,
        `${nameB}님이 기회를 열고 실제 행동으로 옮기면, ${nameA}님이 그 기회를 계속 추적하며 숫자와 위험을 확인하는 흐름에 가깝습니다.`,
      ),
    },
    financialOperation: {
      title: isEn ? "05. Financial Operation" : "05. 평소 돈 관리는 누가 더 자연스러울까?",
      flowTracker: pick(locale, `${nameA} (cash flow)`, `${nameA} (현금 흐름)`),
      billsAndDocs: pick(locale, `${nameB} (fixed costs & paperwork)`, `${nameB} (고정비·서류)`),
      largeExpenseCheck: pick(locale, "Both confirm together", "둘 다 공동 확인"),
      operationStyle: pick(locale, "Shared roles, jointly managed", "역할 분담 및 공동 관리"),
      operationInsight: pick(
        locale,
        "It runs smoothest when there's a clear owner for monthly fixed expenses and account flow, paired with a regular check-in on where things stand.",
        "매월 고정 지출과 통장 흐름은 담당자를 명확히 두고, 정기적인 자산 현황 브리핑을 통해 투명성을 유지할 때 가장 잡음이 없습니다.",
      ),
    },
    economicCrisisResilience: {
      title: isEn ? "06. Economic Resilience Under Crisis" : "06. 경제적 위기가 오면?",
      pairRoles: [
        { roleKey: "REALITY_ORGANIZER", roleLabel: pick(locale, "The one who gets real first", "먼저 현실을 정리하는 사람"), personName: nameA },
        { roleKey: "INCOME_EXPLORER", roleLabel: pick(locale, "The one who finds new income", "새 수입원을 찾는 사람"), personName: nameB },
        { roleKey: "RISK_TAKER", roleLabel: pick(locale, "The one who can take the risk", "위험을 감수할 수 있는 사람"), personName: nameB },
        { roleKey: "ENDURANCE_HOLDER", roleLabel: pick(locale, "The one who holds on to the end", "끝까지 버티는 사람"), personName: nameA },
      ],
      oneLineSynthesis: pick(locale, "One of you holds the line so things don't collapse, while the other looks for the way back up.", "한 사람은 무너지지 않게 지키고, 다른 사람은 다시 올라갈 방법을 찾는 조합입니다."),
      profileA: {
        personName: nameA,
        editorialLabel: pick(locale, "Holds the line to the end once responsible for it", "책임지면 끝까지 버티는 생활력"),
        narrative: pick(
          locale,
          `When financial pressure hits, ${nameA} tends to get realistic first, and will put off their own comfort if needed to protect the household's foundation to the end.`,
          `${nameA}님은 경제적으로 압박이 생기면 현실을 먼저 정돈하고, 필요하다면 자신의 편안함을 미루면서까지 가정의 기반을 끝까지 지키려는 편입니다.`,
        ),
      },
      profileB: {
        personName: nameB,
        editorialLabel: pick(locale, "Breaks through by changing approach", "방법을 바꿔 돌파하는 생활력"),
        narrative: pick(
          locale,
          `When things get stuck, ${nameB} doesn't stay tied to one approach — they quickly pivot toward new opportunities and alternative sources of income.`,
          `${nameB}님은 상황이 막혔을 때 한 가지 방식에 메이지 않고, 새로운 기회와 대안을 찾아 발 빠르게 경제적 수입 행동으로 전환하는 편입니다.`,
        ),
      },
    },
    householdMapEnding: {
      title: isEn ? "Ending. Household Summary Map" : "우리 집 운영 한눈에 보기",
      moneyBehaviorSummary: pick(locale, "Spending & saving standards: budget split between 'future assets' and 'today's enjoyment'", "돈의 지출과 저축 기준: 예산을 '미래 자산'과 '오늘의 즐거움'으로 분리하여 운용"),
      wealthStyleSummary: pick(locale, `Direction for building wealth: ${nameA}'s risk control and ${nameB}'s asset growth balance each other out`, `자산 형성 방향: ${nameA}님의 리스크 제어와 ${nameB}님의 자산 확장이 조화를 이룸`),
      bigMoneyDecisionSummary: pick(locale, `Major spending decisions: ${nameB} opens the opportunity and ${nameA} checks it, balancing each other in the workflow`, `대형 지출 결정: ${nameB}님이 기회를 열고 ${nameA}님이 점검하며 조화를 이루는 워크플로우`),
      lifeCompetenceSummary: pick(locale, "Resilience under pressure: one of you holds the line so things don't collapse, while the other looks for the way back up", "위기 대응 생활력: 한 사람은 무너지지 않게 지키고, 다른 사람은 다시 올라갈 방법을 찾는 조합"),
    },
  };
}
