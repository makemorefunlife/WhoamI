import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import type { Locale } from "@/lib/i18n/locale";

/**
 * Marriage V2 Economic Partnership Engine (Economic Roles & Decision Flow)
 */

export type EconomicRoleType =
  | "STABLE_EARNER"
  | "OPPORTUNITY_EXPANDER"
  | "CASH_FLOW_MANAGER"
  | "SAVER_ACCUMULATOR"
  | "ASSET_BUILDER"
  | "RISK_REVIEWER"
  | "PRACTICAL_EXECUTOR";

export type IndividualEconomicProfile = {
  personName: string;
  primaryRole: EconomicRoleType;
  primaryRoleLabel: string;
  secondaryRole: EconomicRoleType;
  secondaryRoleLabel: string;
  behaviorDescription: string;
};

export type EconomicDecisionFlow = {
  incomeStyleRole: string;
  cashFlowTracker: string;
  largePurchaseProposer: string;
  riskReviewer: string;
  decider: string;
  executor: string;
};

export type MarriageEconomicPartnershipBundle = {
  profileA: IndividualEconomicProfile;
  profileB: IndividualEconomicProfile;
  pairSynergyType: "COMPLEMENTARY_GROWTH" | "DUAL_EXPANDER_RISK" | "DUAL_SAVER_STAGNATION" | "STABLE_BALANCED";
  pairSynergyTitle: string;
  pairSynergyNarrative: string;
  decisionFlow: EconomicDecisionFlow;
};

export function buildMarriageEconomicPartnership(
  psychA: PsychMasterJson | null | undefined,
  psychB: PsychMasterJson | null | undefined,
  sajuJsonA: SajuDataForIntegrated,
  sajuJsonB: SajuDataForIntegrated,
  nameA: string,
  nameB: string,
  locale: Locale = "ko-KR",
  /**
   * Canonical household-CFO side (`refineHouseholdCfo` via
   * marriageCfoConsumption.ts — the single authority for "who operates
   * day-to-day shared money / household CFO", per marriageOperatingCfoCanonical.ts's
   * own docblock: "budget, accounts, big spends — one designated operator").
   * `cashFlowTracker`/`executor` below ask that exact same product question,
   * so when this is known they defer to it instead of independently
   * re-deriving an operator from psych axes (P0 consistency fix — previously
   * this module could name a DIFFERENT person than the canonical CFO for the
   * same "who runs day-to-day finances" question).
   */
  cfoSide?: "a" | "b" | null,
): MarriageEconomicPartnershipBundle {
  const isEn = locale === "en-US";
  const axesA = psychA?.secondary_axes ?? {};
  const axesB = psychB?.secondary_axes ?? {};

  const getRoleLabel = (role: EconomicRoleType): string => {
    switch (role) {
      case "STABLE_EARNER": return isEn ? "Stable Earner" : "안정적 현금흐름 수호자";
      case "OPPORTUNITY_EXPANDER": return isEn ? "Opportunity Expander" : "수익 기회 & 성장 탐색가";
      case "CASH_FLOW_MANAGER": return isEn ? "Cash Flow Manager" : "월 생활비 & 현금흐름 관리자";
      case "SAVER_ACCUMULATOR": return isEn ? "Saver Accumulator" : "안정 저축 & 지출 통제자";
      case "ASSET_BUILDER": return isEn ? "Asset Builder" : "장기 자산화 & 투자 설계자";
      case "RISK_REVIEWER": return isEn ? "Risk Reviewer" : "대형 지출 리스크 검토자";
      case "PRACTICAL_EXECUTOR": return isEn ? "Practical Executor" : "실무 금융 처리 실행자";
    }
  };

  const resolveIndividualEconomicProfile = (name: string, axes: any, isPersonA: boolean): IndividualEconomicProfile => {
    const prac = axes.practicality ?? 50;
    const ctrl = axes.self_control ?? 50;
    const rec = axes.recognition ?? 50;
    const dec = axes.decision_style ?? 50;

    let primaryRole: EconomicRoleType = isPersonA ? "SAVER_ACCUMULATOR" : "CASH_FLOW_MANAGER";
    let secondaryRole: EconomicRoleType = isPersonA ? "RISK_REVIEWER" : "PRACTICAL_EXECUTOR";

    if (ctrl > 65 && prac > 60) {
      primaryRole = "SAVER_ACCUMULATOR";
      secondaryRole = "RISK_REVIEWER";
    } else if (rec > 60 || dec < 40) {
      primaryRole = "OPPORTUNITY_EXPANDER";
      secondaryRole = "ASSET_BUILDER";
    } else if (prac > 60) {
      primaryRole = isPersonA ? "CASH_FLOW_MANAGER" : "PRACTICAL_EXECUTOR";
      secondaryRole = isPersonA ? "SAVER_ACCUMULATOR" : "CASH_FLOW_MANAGER";
    } else {
      primaryRole = "STABLE_EARNER";
      secondaryRole = isPersonA ? "RISK_REVIEWER" : "PRACTICAL_EXECUTOR";
    }

    const behaviorDescription = primaryRole === "SAVER_ACCUMULATOR"
      ? (isEn ? "Focuses on expenditure restraint, risk aversion, and maintaining cash reserves." : "불필요한 지출을 억제하고 예비비 현금을 체계적으로 저축하여 집안의 재정 안전판을 구축합니다.")
      : primaryRole === "OPPORTUNITY_EXPANDER"
      ? (isEn ? "Seeks new income avenues, value expansion, and long-term asset growth." : "현재의 현금 보존에 그치지 않고 장기 자산화와 경제적 확장 방향을 적극 탐색합니다.")
      : primaryRole === "PRACTICAL_EXECUTOR"
      ? (isEn ? "Executes daily financial tasks, recurring payments, and practical budget tracking." : "월 고정비 지출과 이체, 계좌 관리 등 일상적인 금융 실무 업무를 막힘없이 꼼꼼하게 처리합니다.")
      : (isEn ? "Manages daily cash flow, recurring expenses, and practical financial routines." : "월 고정비와 일상 지출 흐름을 매끄럽게 정리하고 정갈한 가계 수입과 지출 밸런스를 유지합니다.");

    return {
      personName: name,
      primaryRole,
      primaryRoleLabel: getRoleLabel(primaryRole),
      secondaryRole,
      secondaryRoleLabel: getRoleLabel(secondaryRole),
      behaviorDescription,
    };
  };

  const profileA = resolveIndividualEconomicProfile(nameA, axesA, true);
  const profileB = resolveIndividualEconomicProfile(nameB, axesB, false);

  // Pair Economic Synergy Synthesis (A + B -> C)
  let pairSynergyType: MarriageEconomicPartnershipBundle["pairSynergyType"] = "STABLE_BALANCED";
  let pairSynergyTitle = "";
  let pairSynergyNarrative = "";

  if (
    (profileA.primaryRole === "SAVER_ACCUMULATOR" || profileA.primaryRole === "CASH_FLOW_MANAGER") &&
    (profileB.primaryRole === "OPPORTUNITY_EXPANDER" || profileB.primaryRole === "ASSET_BUILDER")
  ) {
    pairSynergyType = "COMPLEMENTARY_GROWTH";
    pairSynergyTitle = isEn ? "Complementary Economic Partnership" : "안정적 현금흐름 × 성장 자산화 보완 시너지";
    pairSynergyNarrative = isEn
      ? `${nameA} grounds the daily household cash flow and risk control, while ${nameB} explores long-term asset accumulation.`
      : `${nameA}님이 일상 현금흐름과 리스크를 안정적으로 제어해주고, ${nameB}님이 장기적인 자산 형성의 방향을 넓혀주는 이상적인 경제적 보완 조합입니다.`;
  } else if (
    (profileB.primaryRole === "SAVER_ACCUMULATOR" || profileB.primaryRole === "CASH_FLOW_MANAGER") &&
    (profileA.primaryRole === "OPPORTUNITY_EXPANDER" || profileA.primaryRole === "ASSET_BUILDER")
  ) {
    pairSynergyType = "COMPLEMENTARY_GROWTH";
    pairSynergyTitle = isEn ? "Complementary Economic Partnership" : "안정적 현금흐름 × 성장 자산화 보완 시너지";
    pairSynergyNarrative = isEn
      ? `${nameB} grounds the daily household cash flow and risk control, while ${nameA} explores long-term asset accumulation.`
      : `${nameB}님이 일상 현금흐름과 리스크를 안정적으로 제어해주고, ${nameA}님이 장기적인 자산 형성의 방향을 넓혀주는 이상적인 경제적 보완 조합입니다.`;
  } else if (profileA.primaryRole === "OPPORTUNITY_EXPANDER" && profileB.primaryRole === "OPPORTUNITY_EXPANDER") {
    pairSynergyType = "DUAL_EXPANDER_RISK";
    pairSynergyTitle = isEn ? "High Growth Ambition (Requires Risk Brake)" : "공동 성장 확장형 (대형 지출 리스크 브레이크 필요)";
    pairSynergyNarrative = isEn
      ? "Both share strong desires for economic expansion, so appointing a strict risk reviewer for large purchases is essential."
      : "두 사람 모두 성장과 자산 확장에 적극적이므로, 큰돈을 집행할 때 보수적인 검토 절차를 두는 것이 안전합니다.";
  } else {
    pairSynergyTitle = isEn ? "Stable & Disciplined Financial Team" : "체계적인 안정 관리형 경제 파트너십";
    pairSynergyNarrative = isEn
      ? `Both ${nameA} and ${nameB} value financial predictability and disciplined budgeting.`
      : `${nameA}님과 ${nameB}님 모두 지출의 예측 가능성과 체계적인 가계 관리를 중시하는 안정적인 경제 팀입니다.`;
  }

  // Economic Decision Flow.
  // cashFlowTracker/executor ask the exact same product question as the
  // canonical household CFO ("who operates day-to-day shared money") — when
  // cfoSide is known, defer to it instead of an independently re-derived
  // psych-axis pick, so this card can never name a different financial
  // operator than the CFO summary / Ch9 advice (both of which already read
  // the canonical CFO). largePurchaseProposer/riskReviewer stay on their own
  // psych-driven pick — proposing a big purchase and reviewing it are a
  // distinct governance question from day-to-day operation, and reviewer
  // defaults to the non-CFO partner so the two roles read as a coherent
  // "operator + checks-and-balance reviewer" pair rather than a contradiction.
  const cfoName = cfoSide === "a" ? nameA : cfoSide === "b" ? nameB : null;
  const nonCfoName = cfoSide === "a" ? nameB : cfoSide === "b" ? nameA : null;
  const decisionFlow: EconomicDecisionFlow = {
    incomeStyleRole: isEn ? `${nameA} (Stable) & ${nameB} (Growth)` : `${nameA}님(안정적 현금흐름) & ${nameB}님(성장 자산화)`,
    cashFlowTracker: cfoName ?? (profileA.primaryRole === "CASH_FLOW_MANAGER" || profileA.primaryRole === "SAVER_ACCUMULATOR" ? nameA : nameB),
    largePurchaseProposer: profileA.primaryRole === "OPPORTUNITY_EXPANDER" ? nameA : nameB,
    riskReviewer: nonCfoName ?? (profileA.secondaryRole === "RISK_REVIEWER" || profileA.primaryRole === "SAVER_ACCUMULATOR" ? nameA : nameB),
    decider: isEn ? "Joint Mutual Consent" : "상호 합의 (공동 승인제)",
    executor: cfoName ?? (profileA.secondaryRole === "PRACTICAL_EXECUTOR" ? nameA : nameB),
  };

  return {
    profileA,
    profileB,
    pairSynergyType,
    pairSynergyTitle,
    pairSynergyNarrative,
    decisionFlow,
  };
}
