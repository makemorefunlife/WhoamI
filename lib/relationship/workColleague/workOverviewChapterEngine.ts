/**
 * Work Colleague Premium Chapter 01: Work Overview & Score Engine
 *
 * Core responsibility:
 * 1. OVERVIEW: Computes canonical score cards (Work Fit, Synergy, Office Risk) for top Overview section.
 * 2. CHAPTER 01: Computes Project Lifecycle Narrative (Kickoff, In-Flight, Synergy Moment, Friction Preview)
 *    and Final Pair Team Portrait ("그래서 이 둘은 어떤 팀인가") without duplicating score cards.
 *
 * WORK PAIR INTERACTION MODEL:
 * Person A CE + Person B CE + A Work Psych + B Work Psych + Pair SSOT + Work Domain Lens + Role/Tension Evidence
 *   ↓
 * Work Pair Interaction Model
 *   ↓
 * OVERVIEW: Fit / Synergy / Risk Scores, Qualitative Labels, Measures, Why, Real Work Scenes
 * CHAPTER 01: Observed Team Behavior Project Lifecycle (Kickoff -> In-Flight -> Synergy Chain -> Friction Trigger -> Team Portrait)
 *
 * ABSOLUTE RULES:
 * 1. ZERO raw Saju technical terms (천간, 지지, 십성, 일간, 신살, etc.) in user-facing text.
 * 2. Proper Korean particle handling (josaEunNeun, josaIGa, josaGwaWa, josaEulReul, josaE).
 * 3. Consistent score SSOT usage (fitPct, synergyPct, riskPct).
 * 4. NO duplicate score card rendering inside Chapter 01.
 */

import type { Locale } from "@/lib/i18n/locale";
import type { WorkOverviewChapterBundle, WorkOverviewCardBundle, WorkProjectLifecycleNarrative, WorkTeamPortrait } from "./workStoryPlanTypes";
import { josaEunNeun, josaIGa, josaGwaWa, josaEulReul, josaE } from "@/lib/relationship/familyParent/familyParentLanguage";

export type BuildWorkOverviewChapterParams = {
  nameA: string;
  nameB: string;
  locale?: Locale;

  /** Canonical Score SSOT values */
  fitPct: number;
  synergyPct: number;
  riskPct: number;

  /** Psychology Data */
  psychA?: {
    scores?: Record<string, number>;
    primaryAxes?: Record<string, number>;
    secondaryAxes?: Record<string, number>;
  } | null;

  psychB?: {
    scores?: Record<string, number>;
    primaryAxes?: Record<string, number>;
    secondaryAxes?: Record<string, number>;
  } | null;

  /** Saju Ten-God Counts */
  countsA?: {
    food?: number;
    seal?: number;
    wealth?: number;
    officer?: number;
    self?: number;
  } | null;

  countsB?: {
    food?: number;
    seal?: number;
    wealth?: number;
    officer?: number;
    self?: number;
  } | null;
};

function getQualitativeLabel(score: number, isRisk: boolean = false): string {
  if (isRisk) {
    if (score <= 25) return "낮음 (안정)";
    if (score <= 40) return "낮은 편 (양호)";
    if (score <= 60) return "보통";
    if (score <= 75) return "주의 필요";
    return "높음 (대비 필요)";
  }
  if (score >= 80) return "매우 좋음";
  if (score >= 65) return "좋은 편";
  if (score >= 50) return "보통";
  if (score >= 35) return "조율 필요";
  return "주의";
}

export function buildWorkOverviewChapterBundle(
  params: BuildWorkOverviewChapterParams
): WorkOverviewChapterBundle {
  const {
    nameA,
    nameB,
    locale = "ko-KR",
    fitPct,
    synergyPct,
    riskPct,
    psychA,
    psychB,
    countsA,
    countsB,
  } = params;

  const aName = nameA || "A님";
  const bName = nameB || "B님";

  const aEunNeun = josaEunNeun(aName);
  const aIGa = josaIGa(aName);
  const aGwaWa = josaGwaWa(aName);
  const aEulReul = josaEulReul(aName);

  const bEunNeun = josaEunNeun(bName);
  const bIGa = josaIGa(bName);
  const bGwaWa = josaGwaWa(bName);
  const bEulReul = josaEulReul(bName);

  // Extract Person A Axes
  const secA = psychA?.secondaryAxes || {};
  const primA = psychA?.primaryAxes || {};
  const selfControlA = secA.self_control ?? primA.structure ?? 50;
  const autonomyA = secA.autonomy ?? primA.autonomy ?? 50;
  const analyticalA = secA.analytical_thinking ?? 50;
  const extEnergyA = secA.external_energy ?? primA.connection ?? 50;
  const decisionStyleA = secA.deliberate_decision ?? 50;

  // Extract Person B Axes
  const secB = psychB?.secondaryAxes || {};
  const primB = psychB?.primaryAxes || {};
  const selfControlB = secB.self_control ?? primB.structure ?? 50;
  const autonomyB = secB.autonomy ?? primB.autonomy ?? 50;
  const analyticalB = secB.analytical_thinking ?? 50;
  const extEnergyB = secB.external_energy ?? primB.connection ?? 50;
  const decisionStyleB = secB.deliberate_decision ?? 50;

  // -------------------------------------------------------------------
  // OVERVIEW CARDS ENGINE (Consumed ONLY by top Overview Section)
  // -------------------------------------------------------------------
  let fitWhy = `${aGwaWa} ${bName}는 기본 업무 추진 리듬과 실행 태도가 매끄럽게 호흡을 맞춰, 회의나 기획 방침이 정해진 후 일상 업무가 막힘없이 추진됩니다.`;
  let fitScene = `신규 과제가 시작되면 ${aName} 측에서 일정과 가이드라인을 정리하고, ${bName} 측에서 실무 대안과 해결책을 붙이는 방식으로 속도감 있게 일이 추진됩니다.`;

  if (autonomyA >= 70 && autonomyB >= 70) {
    fitWhy = `두 사람 모두 주도성과 자율성이 높아 책임감이 강하지만, "내가 직접 기준을 잡아야 마음이 놓인다"는 성향이 겹쳐 초기 과제 범위와 최종 판단 권한(Decision Ownership)을 명확히 나누지 않으면 작은 마찰이 생길 수 있습니다.`;
    fitScene = `프로젝트 초반 업무 가이드라인을 정할 때 각자의 일하는 기준을 먼저 세우려 하므로, 역할 경계를 사전에 분명히 나누어두어야 일상 호흡이 매끄러워집니다.`;
  } else if (Math.abs(selfControlA - selfControlB) >= 25 || Math.abs(decisionStyleA - decisionStyleB) >= 25) {
    fitWhy = `${aEunNeun} 과제의 결론과 실행 속도를 먼저 고려하는 반면, ${bEunNeun} 사전 검토와 세부 구조화를 중시하여 일상 템포에서 신중함과 스피드 간의 조율이 필요합니다.`;
    fitScene = `아이디어 논의 시 한쪽은 빠른 결정으로 바로 착수하려 하고 다른 한쪽은 리스크 검토를 더 거치려 하므로, 검토 기한을 사전에 약속해두는 것이 핏을 높여줍니다.`;
  } else if (fitPct >= 80) {
    fitWhy = `업무를 바라보는 기본 템포와 시각이 매우 유사하여, 긴 설명이나 복잡한 확인 절차 없이도 서로의 의도를 빠르게 파악하고 굴러갑니다.`;
    fitScene = `주간 미팅이나 기획 회의에서 큰 방향만 공유되어도 각자 맡은 분량을 빠르게 파악하여 군더더기 없이 실무를 이어갑니다.`;
  }

  const workFitCard: WorkOverviewCardBundle = {
    score: fitPct,
    qualitativeLabel: getQualitativeLabel(fitPct, false),
    measuresWhat: "서로의 업무 템포, 사고 방식, 실행 리듬이 매끄럽게 호흡을 맞춰 마찰 없이 일상 업무가 굴러가는 정도를 나타냅니다.",
    whyThisScore: fitWhy,
    realWorkScene: fitScene,
  };

  let synWhy = `${aEunNeun} 전체 전략 방향과 가이드라인을 정돈하는 강점이 있고, ${bEunNeun} 창의적 문제 해결과 실행 대안을 제시해 서로의 사각지대를 보완해주는 결합력을 만듭니다.`;
  let synScene = `새 프로젝트 초반 ${bName} 측에서 여러 대안과 창의적 해법을 넓혀놓으면, ${aName} 측에서 일정과 현실적 리스크를 고려해 실행 가능한 프로젝트 범위로 좁혀 완결성을 높입니다.`;

  if (selfControlA >= 65 && selfControlB >= 65) {
    synWhy = `두 사람 모두 높은 실행력과 성과 집착력을 갖춘 "증폭형 조합"입니다. 역할 분담이 명확하면 엄청나게 빠른 성과를 내지만, R&R이 모호하면 동일한 업무를 중복으로 손대는 낭비가 생길 수 있습니다.`;
    synScene = `급한 과제가 떨어졌을 때 각자의 담당 구역만 정해지면 두 배의 속도로 실무를 쳐내어 팀 내 최고의 생산성을 증명해냅니다.`;
  } else if (synergyPct >= 80) {
    synWhy = `${aName}의 강점이 ${bName}의 보완점을 채우고, ${bName}의 장점이 ${aName}의 빈틈을 충실히 메워 혼자 일할 때보다 훨씬 완성도 높은 결과물을 만들어냅니다.`;
    synScene = `중요한 프로젝트 발표 자료를 만들 때 한쪽의 전략적 프레임워크와 다른 한쪽의 상세 실행 데이터가 결합해 완성도 높은 마스터피스를 도출합니다.`;
  } else if (synergyPct < 60) {
    synWhy = `두 사람의 역량 스타일이 비슷하여 상호 보완적인 시너지보다는 과제 중복이나 책임 경계 설정에 추가 에너지가 소요될 수 있습니다.`;
    synScene = `프로젝트 중반 최종 결정권자가 명확하지 않은 업무 구간에서 두 사람의 판단 기준이 엇갈려 소통 횟수가 늘어날 수 있습니다.`;
  }

  const synergyCard: WorkOverviewCardBundle = {
    score: synergyPct,
    qualitativeLabel: getQualitativeLabel(synergyPct, false),
    measuresWhat: "서로 다른 강점이 결합하여 혼자 일할 때보다 실제 결과물의 퀄리티와 성과를 얼마나 끌어올리는가를 나타냅니다.",
    whyThisScore: synWhy,
    realWorkScene: synScene,
  };

  let riskWhy = `두 사람의 업무 의욕은 높으나 마감이 임박하거나 예상치 못한 변수가 터졌을 때, 사전에 공유되지 않은 빠른 판단이나 기준 차이로 인해 순간적인 속도/권한 마찰(Pace & Decision Collision)이 생길 수 있습니다.`;
  let riskScene = `긴급 이슈 발생 시 한쪽이 사전 공유 없이 독자적으로 방향을 변경하면, 다른 한쪽이 일감 공유 부족이나 자율성 침해로 느껴 순간적 신경전이 생길 수 있습니다.`;

  if (autonomyA >= 70 && autonomyB >= 70) {
    riskWhy = `의견 대립 자체보다 "누가 이 업무의 최종 결정권자인가(Decision & Ownership Collision)"에 대한 상호 기준 차이가 발생할 때 업무 지연이나 병목으로 번질 가능성이 존재합니다.`;
    riskScene = `프로젝트 최종 사인을 앞두고 두 사람이 서로 다른 기준을 제시하면, 한쪽이 상의 없이 최종안을 굳힐 때 정서적/업무적 긴장감이 유발될 수 있습니다.`;
  } else if (riskPct <= 25) {
    riskWhy = `두 사람 모두 상대방의 역할 영역을 존중하고 의사소통 톤이 부드러워, 업무 스타일의 차이가 실제 병목이나 관계 손상으로 번질 가능성이 매우 낮습니다.`;
    riskScene = `이견이 생기더라도 조용히 서면이나 1:1 미팅을 통해 서로의 이유를 들려주고 합리적인 대안으로 매끄럽게 위험을 해소합니다.`;
  } else if (riskPct >= 65) {
    riskWhy = `한쪽의 직설적인 피드백 톤이나 스피드 중심 요청이 다른 한쪽에게는 정서적 부담이나 압박으로 작용하여 피드백 마찰(Feedback Collision)이 일어날 위험이 있습니다.`;
    riskScene = `수정 사항을 공유할 때 맥락 설명 없이 결론부터 전달하면 상대방이 지적으로 느껴 대화의 문을 닫거나 방어벽을 세울 수 있습니다.`;
  }

  const officeRiskCard: WorkOverviewCardBundle = {
    score: riskPct,
    qualitativeLabel: getQualitativeLabel(riskPct, true),
    measuresWhat: "두 사람의 업무 차이가 실제 업무 병목, 권한 충돌, 또는 관계 손상으로 번질 가능성을 나타냅니다. (낮을수록 편안합니다)",
    whyThisScore: riskWhy,
    realWorkScene: riskScene,
  };

  // -------------------------------------------------------------------
  // CHAPTER 01: PROJECT LIFECYCLE NARRATIVE ENGINE
  // -------------------------------------------------------------------
  // 01. 일이 처음 들어왔을 때 (Kickoff & Initial Approach)
  let kickoffBody = `모호한 신규 과제가 떨어지면 ${aEunNeun} 전체 마감 일정과 가이드라인을 먼저 정돈하여 구조화하려 움직이고, ${bEunNeun} 실무 대안과 창의적 해법을 탐색하며 대안 범위를 넓힙니다. 초반 논의에서 한쪽이 뼈대를 잡고 다른 한쪽이 실무 대안을 붙여 속도감 있게 첫 단추를 뀁니다.`;

  if (autonomyA >= 70 && autonomyB >= 70) {
    kickoffBody = `프로젝트 초반 모호함이 주어질 때 두 사람 모두 본능적으로 자신이 주도하여 업무 판을 잡으려 합니다. ${aEunNeun} 마감과 목표 기준을 세우려 하고, ${bEunNeun} 자신의 실무 방식을 먼저 적용하려 하므로, 최초 미팅에서 각자의 초기 역할 경계를 명확히 분담할 때 가장 매끄럽게 시작됩니다.`;
  } else if (analyticalA >= 65 && selfControlB >= 65) {
    kickoffBody = `일이 시작되면 ${aEunNeun} 리스크와 분석 자료를 철저히 검토하며 신중하게 접근하려 하고, ${bEunNeun} 빠른 실행과 착수를 선호합니다. 초기 접근에서 검토 기한을 짧게 정하고 바로 시도해보는 방식으로 호흡을 맞출 때 시너지가 납니다.`;
  }

  // 02. 일이 굴러가기 시작하면 (In-Flight Rhythm & Independence)
  let inFlightBody = `이 팀은 매일 수시로 세부 사항을 확인하지 않아도, 큰 방향과 역할만 정해지면 각자의 구역에서 독립적으로 업무를 끌고 나갈 수 있는 파트너입니다. 불필요한 마이크로매니징보다는 주간 1~2회 주요 마일스톤 싱크만 맞춰도 일상 호흡이 안정적으로 유지됩니다.`;

  if (Math.abs(selfControlA - selfControlB) >= 25 || Math.abs(decisionStyleA - decisionStyleB) >= 25) {
    inFlightBody = `일이 굴러가기 시작하면 두 사람의 확인 템포에 약간의 차이가 나타납니다. 한쪽은 큰 방향만 맞으면 자유롭게 실행하길 원하지만, 다른 한쪽은 세부 진행 상황이 공유되어야 안심합니다. 주간 미팅 시 짧은 공유 채널(슬랙/카톡 비동기 싱크)을 둘 때 오해 없이 굴러갑니다.`;
  }

  // 03. 서로의 강점이 붙는 순간 (Synergy Chain in Action)
  let synergyMomentBody = `${bName} 측에서 실무 현장의 아이디어나 문제 해법을 폭넓게 제안하면, ${aName} 측에서 프로젝트 전체 목표와 일정 리스크를 검토해 실행 가능한 정예안으로 필터링해줍니다. "해법 제시 → 구조화 및 리스크 제어"로 이어지는 실질적인 강점 결합 사슬이 완성도를 극대화합니다.`;

  if (selfControlA >= 65 && selfControlB >= 65) {
    synergyMomentBody = `두 사람 모두 높은 몰입도와 성과 집착력을 지니고 있어, 업무 구역이 명확히 분정된 상태에서는 일반적인 팀의 두 배 속도로 과제를 해결해냅니다. 한쪽이 기획 및 대외 정리를 끝내면 다른 한쪽이 실무 개발/검토를 완벽히 쳐내는 강력한 성과 증폭이 일어납니다.`;
  }

  // 04. 삐걱거리기 시작하는 순간 (Office Risk Preview / Friction Trigger)
  let frictionMomentBody = `과제 마감이 촉박해지거나 예상치 못한 외부 변수가 터졌을 때, 사전에 상의되지 않은 빠른 판단이나 수정 요청이 발생하면 순간적으로 "권한 침해"나 "공유 부족"으로 느껴져 첫 삐걱거림이 생길 수 있습니다. 피드백 톤이나 룰 변경 시 이유를 덧붙이는 것이 핵심입니다.`;

  if (autonomyA >= 70 && autonomyB >= 70) {
    frictionMomentBody = `업무 진행 중 최종 가이드라인이나 결정권을 둘러싸고 두 사람의 기준이 대립할 때 마찰이 생길 수 있습니다. "누가 이 과제의 최종 판단권자인가"가 불분명한 상태에서 한쪽이 독자 결정을 내리면 순간적인 정서적 긴장감이 유발될 수 있습니다.`;
  }

  const lifecycleNarrative: WorkProjectLifecycleNarrative = {
    kickoff: {
      title: "01. 일이 처음 들어왔을 때",
      body: kickoffBody,
    },
    inFlight: {
      title: "02. 일이 굴러가기 시작하면",
      body: inFlightBody,
    },
    synergyMoment: {
      title: "03. 서로의 강점이 붙는 순간",
      body: synergyMomentBody,
    },
    frictionMoment: {
      title: "04. 삐걱거리기 시작하는 순간",
      body: frictionMomentBody,
    },
  };

  // -------------------------------------------------------------------
  // FINAL TEAM PORTRAIT ("그래서 이 둘은 어떤 팀인가")
  // -------------------------------------------------------------------
  let headline = "판을 빠르게 정리하는 힘과 막힌 곳에서 해법을 찾는 힘이 만나는 팀";
  let body = `${aName}의 구조화 및 일정 정돈력과 ${bName}의 실무 대안 제시력이 결합해 빠른 템포와 높은 완결성을 동시에 챙길 수 있는 팀입니다. 초기 역할 분담과 이슈 시 판단 룰을 가볍게 정해둔다면 지속적으로 높은 성과를 만들어냅니다.`;

  if (autonomyA >= 70 && autonomyB >= 70) {
    headline = "각자의 구역에서 강력한 주도성을 발휘하는 고속 독립 추진 팀";
    body = `두 사람 모두 뛰어난 책임감과 실행력을 갖추어, 업무 경계만 명확히 나누어지면 최소한의 관리만으로도 최고의 성과를 도출해내는 주도적 파트너십입니다.`;
  } else if (selfControlA >= 65 && selfControlB >= 65) {
    headline = "목표가 정해지면 압도적인 속도로 성과를 쳐내는 성과 증폭 팀";
    body = `높은 몰입도와 실행 태도가 호흡을 맞춰, 복잡한 과제도 빠르게 분해하고 구체적인 결과물로 변환해내는 강력한 실행 동반자입니다.`;
  }

  const teamPortrait: WorkTeamPortrait = {
    headline,
    body,
  };

  return {
    workFitCard,
    synergyCard,
    officeRiskCard,
    lifecycleNarrative,
    teamPortrait,
  };
}
