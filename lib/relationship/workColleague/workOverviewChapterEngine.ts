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
 *
 * Phase 2 English remediation: every branch below now returns a `pick(locale,
 * en, ko)` pair. The Korean strings and the conditional logic that selects
 * between them are byte-identical to before this pass — only English
 * counterparts were added. English copy is a natural rewrite of the same
 * analytical meaning, not a word-for-word translation (per Phase 2 voice
 * rules); it is written directly for a US reader, not machine-translated.
 */

import type { Locale } from "@/lib/i18n/locale";
import type { WorkOverviewChapterBundle, WorkOverviewCardBundle, WorkProjectLifecycleNarrative, WorkTeamPortrait } from "./workStoryPlanTypes";
import { josaEunNeun, josaIGa, josaGwaWa, josaEulReul, josaE } from "@/lib/relationship/familyParent/familyParentLanguage";
import { pick, LEGACY_FALLBACK_LOCALE } from "./workColleagueCopy";

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

function getQualitativeLabel(locale: Locale, score: number, isRisk: boolean = false): string {
  if (isRisk) {
    if (score <= 25) return pick(locale, "Low (stable)", "낮음 (안정)");
    if (score <= 40) return pick(locale, "Fairly low (good)", "낮은 편 (양호)");
    if (score <= 60) return pick(locale, "Average", "보통");
    if (score <= 75) return pick(locale, "Needs attention", "주의 필요");
    return pick(locale, "High (plan for it)", "높음 (대비 필요)");
  }
  if (score >= 80) return pick(locale, "Very good", "매우 좋음");
  if (score >= 65) return pick(locale, "Good", "좋은 편");
  if (score >= 50) return pick(locale, "Average", "보통");
  if (score >= 35) return pick(locale, "Needs tuning", "조율 필요");
  return pick(locale, "Caution", "주의");
}

export function buildWorkOverviewChapterBundle(
  params: BuildWorkOverviewChapterParams
): WorkOverviewChapterBundle {
  const {
    nameA,
    nameB,
    locale = LEGACY_FALLBACK_LOCALE,
    fitPct,
    synergyPct,
    riskPct,
    psychA,
    psychB,
    countsA,
    countsB,
  } = params;
  void countsA;
  void countsB;

  const aName = nameA || pick(locale, "Person A", "A님");
  const bName = nameB || pick(locale, "Person B", "B님");

  const aEunNeun = josaEunNeun(aName);
  const aIGa = josaIGa(aName);
  const aGwaWa = josaGwaWa(aName);
  const aEulReul = josaEulReul(aName);
  void aIGa;
  void aEulReul;

  const bEunNeun = josaEunNeun(bName);
  const bIGa = josaIGa(bName);
  const bGwaWa = josaGwaWa(bName);
  const bEulReul = josaEulReul(bName);
  void bIGa;
  void bGwaWa;
  void bEulReul;

  // Extract Person A Axes
  const secA = psychA?.secondaryAxes || {};
  const primA = psychA?.primaryAxes || {};
  const selfControlA = secA.self_control ?? primA.structure ?? 50;
  const autonomyA = secA.autonomy ?? primA.autonomy ?? 50;
  const analyticalA = secA.analytical_thinking ?? 50;
  const extEnergyA = secA.external_energy ?? primA.connection ?? 50;
  const decisionStyleA = secA.deliberate_decision ?? 50;
  void extEnergyA;

  // Extract Person B Axes
  const secB = psychB?.secondaryAxes || {};
  const primB = psychB?.primaryAxes || {};
  const selfControlB = secB.self_control ?? primB.structure ?? 50;
  const autonomyB = secB.autonomy ?? primB.autonomy ?? 50;
  const analyticalB = secB.analytical_thinking ?? 50;
  const extEnergyB = secB.external_energy ?? primB.connection ?? 50;
  const decisionStyleB = secB.deliberate_decision ?? 50;
  void analyticalB;
  void extEnergyB;

  // -------------------------------------------------------------------
  // OVERVIEW CARDS ENGINE (Consumed ONLY by top Overview Section)
  // -------------------------------------------------------------------
  let fitWhy = pick(
    locale,
    `You two move at a similar pace and share a similar approach to getting things done, so once a meeting or plan sets the direction, the day-to-day work just flows.`,
    `${aGwaWa} ${bName}는 기본 업무 추진 리듬과 실행 태도가 매끄럽게 호흡을 맞춰, 회의나 기획 방침이 정해진 후 일상 업무가 막힘없이 추진됩니다.`,
  );
  let fitScene = pick(
    locale,
    `When a new task kicks off, ${aName} tends to lock down the timeline and guardrails while ${bName} brings the practical fixes and workarounds — together that keeps things moving fast.`,
    `신규 과제가 시작되면 ${aName} 측에서 일정과 가이드라인을 정리하고, ${bName} 측에서 실무 대안과 해결책을 붙이는 방식으로 속도감 있게 일이 추진됩니다.`,
  );

  if (autonomyA >= 70 && autonomyB >= 70) {
    fitWhy = pick(
      locale,
      `You're both highly independent and take ownership seriously — which is a strength, but it also means you both feel most at ease when you're the one setting the standard. Without a clear split on scope and final decision ownership early on, that overlap can cause small friction.`,
      `두 사람 모두 주도성과 자율성이 높아 책임감이 강하지만, "내가 직접 기준을 잡아야 마음이 놓인다"는 성향이 겹쳐 초기 과제 범위와 최종 판단 권한(Decision Ownership)을 명확히 나누지 않으면 작은 마찰이 생길 수 있습니다.`,
    );
    fitScene = pick(
      locale,
      `Early in a project, you'll each want to set the ground rules your own way — spelling out who owns what up front is what keeps the day-to-day working smoothly.`,
      `프로젝트 초반 업무 가이드라인을 정할 때 각자의 일하는 기준을 먼저 세우려 하므로, 역할 경계를 사전에 분명히 나누어두어야 일상 호흡이 매끄러워집니다.`,
    );
  } else if (Math.abs(selfControlA - selfControlB) >= 25 || Math.abs(decisionStyleA - decisionStyleB) >= 25) {
    fitWhy = pick(
      locale,
      `${aName} tends to prioritize getting to a conclusion and moving fast, while ${bName} leans toward reviewing things carefully and mapping out the details first — day to day, that means finding a middle ground between speed and caution.`,
      `${aEunNeun} 과제의 결론과 실행 속도를 먼저 고려하는 반면, ${bEunNeun} 사전 검토와 세부 구조화를 중시하여 일상 템포에서 신중함과 스피드 간의 조율이 필요합니다.`,
    );
    fitScene = pick(
      locale,
      `When you're kicking around ideas, one of you wants to decide fast and get moving while the other wants more time to check the risks — agreeing on a review deadline up front makes this fit a lot smoother.`,
      `아이디어 논의 시 한쪽은 빠른 결정으로 바로 착수하려 하고 다른 한쪽은 리스크 검토를 더 거치려 하므로, 검토 기한을 사전에 약속해두는 것이 핏을 높여줍니다.`,
    );
  } else if (fitPct >= 80) {
    fitWhy = pick(
      locale,
      `Your basic pace and outlook on work are remarkably alike — you can read each other's intent quickly without long explanations or a lot of back-and-forth.`,
      `업무를 바라보는 기본 템포와 시각이 매우 유사하여, 긴 설명이나 복잡한 확인 절차 없이도 서로의 의도를 빠르게 파악하고 굴러갑니다.`,
    );
    fitScene = pick(
      locale,
      `In a weekly meeting or planning session, just sharing the big picture is enough — you each pick up your part quickly and get straight to work.`,
      `주간 미팅이나 기획 회의에서 큰 방향만 공유되어도 각자 맡은 분량을 빠르게 파악하여 군더더기 없이 실무를 이어갑니다.`,
    );
  }

  const workFitCard: WorkOverviewCardBundle = {
    score: fitPct,
    qualitativeLabel: getQualitativeLabel(locale, fitPct, false),
    measuresWhat: pick(
      locale,
      `How smoothly your day-to-day pace, thinking style, and working rhythm line up without friction.`,
      `서로의 업무 템포, 사고 방식, 실행 리듬이 매끄럽게 호흡을 맞춰 마찰 없이 일상 업무가 굴러가는 정도를 나타냅니다.`,
    ),
    whyThisScore: fitWhy,
    realWorkScene: fitScene,
  };

  let synWhy = pick(
    locale,
    `${aName} is strong at setting the overall strategy and guardrails, while ${bName} is strong at creative problem-solving and finding workable options — together you cover each other's blind spots.`,
    `${aEunNeun} 전체 전략 방향과 가이드라인을 정돈하는 강점이 있고, ${bEunNeun} 창의적 문제 해결과 실행 대안을 제시해 서로의 사각지대를 보완해주는 결합력을 만듭니다.`,
  );
  let synScene = pick(
    locale,
    `Early in a new project, ${bName} tends to open up a wide range of creative options, and ${aName} narrows them down to what's realistic given the timeline and risks — that combination raises the quality of the final result.`,
    `새 프로젝트 초반 ${bName} 측에서 여러 대안과 창의적 해법을 넓혀놓으면, ${aName} 측에서 일정과 현실적 리스크를 고려해 실행 가능한 프로젝트 범위로 좁혀 완결성을 높입니다.`,
  );

  if (selfControlA >= 65 && selfControlB >= 65) {
    synWhy = pick(
      locale,
      `You're both highly driven and execution-focused — an "amplifier" combination. With clear roles, that turns into very fast results; without a clear split, you can end up both working the same task and wasting effort.`,
      `두 사람 모두 높은 실행력과 성과 집착력을 갖춘 "증폭형 조합"입니다. 역할 분담이 명확하면 엄청나게 빠른 성과를 내지만, R&R이 모호하면 동일한 업무를 중복으로 손대는 낭비가 생길 수 있습니다.`,
    );
    synScene = pick(
      locale,
      `When an urgent task lands, all it takes is dividing up who owns what — then you can burn through the work at twice the usual speed.`,
      `급한 과제가 떨어졌을 때 각자의 담당 구역만 정해지면 두 배의 속도로 실무를 쳐내어 팀 내 최고의 생산성을 증명해냅니다.`,
    );
  } else if (synergyPct >= 80) {
    synWhy = pick(
      locale,
      `${aName}'s strengths cover what ${bName} needs, and ${bName}'s strengths fill in ${aName}'s gaps — together you produce work that's noticeably better than either of you would alone.`,
      `${aName}의 강점이 ${bName}의 보완점을 채우고, ${bName}의 장점이 ${aName}의 빈틈을 충실히 메워 혼자 일할 때보다 훨씬 완성도 높은 결과물을 만들어냅니다.`,
    );
    synScene = pick(
      locale,
      `When you're putting together a big presentation, one person's strategic framing and the other's detailed execution combine into something genuinely polished.`,
      `중요한 프로젝트 발표 자료를 만들 때 한쪽의 전략적 프레임워크와 다른 한쪽의 상세 실행 데이터가 결합해 완성도 높은 마스터피스를 도출합니다.`,
    );
  } else if (synergyPct < 60) {
    synWhy = pick(
      locale,
      `Your working styles are fairly similar, so instead of complementary synergy, extra energy may go into sorting out overlap and where responsibility starts and ends.`,
      `두 사람의 역량 스타일이 비슷하여 상호 보완적인 시너지보다는 과제 중복이나 책임 경계 설정에 추가 에너지가 소요될 수 있습니다.`,
    );
    synScene = pick(
      locale,
      `Partway through a project, in areas where it's unclear who has final say, your judgment calls can diverge and you'll find yourselves checking in with each other more than expected.`,
      `프로젝트 중반 최종 결정권자가 명확하지 않은 업무 구간에서 두 사람의 판단 기준이 엇갈려 소통 횟수가 늘어날 수 있습니다.`,
    );
  }

  const synergyCard: WorkOverviewCardBundle = {
    score: synergyPct,
    qualitativeLabel: getQualitativeLabel(locale, synergyPct, false),
    measuresWhat: pick(
      locale,
      `How much combining your different strengths actually raises the quality of the work compared to either of you working alone.`,
      `서로 다른 강점이 결합하여 혼자 일할 때보다 실제 결과물의 퀄리티와 성과를 얼마나 끌어올리는가를 나타냅니다.`,
    ),
    whyThisScore: synWhy,
    realWorkScene: synScene,
  };

  let riskWhy = pick(
    locale,
    `You're both motivated to get things done, but when a deadline gets tight or something unexpected comes up, a fast call made without checking in first — or just a difference in standards — can spark a quick clash over pace or who gets to decide.`,
    `두 사람의 업무 의욕은 높으나 마감이 임박하거나 예상치 못한 변수가 터졌을 때, 사전에 공유되지 않은 빠른 판단이나 기준 차이로 인해 순간적인 속도/권한 마찰(Pace & Decision Collision)이 생길 수 있습니다.`,
  );
  let riskScene = pick(
    locale,
    `When something urgent comes up, if one of you changes direction without looping the other in first, it can land as either being left out of the loop or having your autonomy stepped on — and that can spark a quick flare-up.`,
    `긴급 이슈 발생 시 한쪽이 사전 공유 없이 독자적으로 방향을 변경하면, 다른 한쪽이 일감 공유 부족이나 자율성 침해로 느껴 순간적 신경전이 생길 수 있습니다.`,
  );

  if (autonomyA >= 70 && autonomyB >= 70) {
    riskWhy = pick(
      locale,
      `It's less about disagreeing on the idea itself and more about who actually has final say — when that's unclear, it can turn into a real delay or bottleneck.`,
      `의견 대립 자체보다 "누가 이 업무의 최종 결정권자인가(Decision & Ownership Collision)"에 대한 상호 기준 차이가 발생할 때 업무 지연이나 병목으로 번질 가능성이 존재합니다.`,
    );
    riskScene = pick(
      locale,
      `Right before a project needs final sign-off, if you're each pushing a different standard, one of you locking in the final call without checking with the other can create real tension — both personally and professionally.`,
      `프로젝트 최종 사인을 앞두고 두 사람이 서로 다른 기준을 제시하면, 한쪽이 상의 없이 최종안을 굳힐 때 정서적/업무적 긴장감이 유발될 수 있습니다.`,
    );
  } else if (riskPct <= 25) {
    riskWhy = pick(
      locale,
      `You both respect each other's territory and communicate in a fairly gentle tone, so differences in working style are unlikely to turn into a real bottleneck or hurt the relationship.`,
      `두 사람 모두 상대방의 역할 영역을 존중하고 의사소통 톤이 부드러워, 업무 스타일의 차이가 실제 병목이나 관계 손상으로 번질 가능성이 매우 낮습니다.`,
    );
    riskScene = pick(
      locale,
      `Even when you disagree, you tend to quietly work it out — a written note or a 1:1 conversation to explain your reasoning — and land on a reasonable answer without much friction.`,
      `이견이 생기더라도 조용히 서면이나 1:1 미팅을 통해 서로의 이유를 들려주고 합리적인 대안으로 매끄럽게 위험을 해소합니다.`,
    );
  } else if (riskPct >= 65) {
    riskWhy = pick(
      locale,
      `One of you tends to give feedback bluntly or push for speed, and that can land on the other as pressure or emotional weight — which risks real friction around how feedback gets delivered.`,
      `한쪽의 직설적인 피드백 톤이나 스피드 중심 요청이 다른 한쪽에게는 정서적 부담이나 압박으로 작용하여 피드백 마찰(Feedback Collision)이 일어날 위험이 있습니다.`,
    );
    riskScene = pick(
      locale,
      `When you're sharing a revision, leading with the conclusion before any context can land as criticism — and that can make the other person shut down or get defensive.`,
      `수정 사항을 공유할 때 맥락 설명 없이 결론부터 전달하면 상대방이 지적으로 느껴 대화의 문을 닫거나 방어벽을 세울 수 있습니다.`,
    );
  }

  const officeRiskCard: WorkOverviewCardBundle = {
    score: riskPct,
    qualitativeLabel: getQualitativeLabel(locale, riskPct, true),
    measuresWhat: pick(
      locale,
      `How likely your differences are to turn into a real bottleneck, a clash over authority, or damage to the relationship. (Lower is more comfortable.)`,
      `두 사람의 업무 차이가 실제 업무 병목, 권한 충돌, 또는 관계 손상으로 번질 가능성을 나타냅니다. (낮을수록 편안합니다)`,
    ),
    whyThisScore: riskWhy,
    realWorkScene: riskScene,
  };

  // -------------------------------------------------------------------
  // CHAPTER 01: PROJECT LIFECYCLE NARRATIVE ENGINE
  // -------------------------------------------------------------------
  // 01. 일이 처음 들어왔을 때 (Kickoff & Initial Approach)
  let kickoffBody = pick(
    locale,
    `When a vague new task lands, ${aName} tends to move first to lock down the timeline and guardrails, while ${bName} explores practical options and creative solutions to widen the range of what's possible. In early discussions, one of you builds the skeleton and the other fills in the practical details — together that gets things off to a fast start.`,
    `모호한 신규 과제가 떨어지면 ${aEunNeun} 전체 마감 일정과 가이드라인을 먼저 정돈하여 구조화하려 움직이고, ${bEunNeun} 실무 대안과 창의적 해법을 탐색하며 대안 범위를 넓힙니다. 초반 논의에서 한쪽이 뼈대를 잡고 다른 한쪽이 실무 대안을 붙여 속도감 있게 첫 단추를 뀁니다.`,
  );

  if (autonomyA >= 70 && autonomyB >= 70) {
    kickoffBody = pick(
      locale,
      `When a project starts out ambiguous, you both instinctively want to be the one who sets the frame. ${aName} tends to set the deadline and the target standard, while ${bName} tends to apply their own way of working first — so the smoothest starts are the ones where you divide up who owns what in that very first meeting.`,
      `프로젝트 초반 모호함이 주어질 때 두 사람 모두 본능적으로 자신이 주도하여 업무 판을 잡으려 합니다. ${aEunNeun} 마감과 목표 기준을 세우려 하고, ${bEunNeun} 자신의 실무 방식을 먼저 적용하려 하므로, 최초 미팅에서 각자의 초기 역할 경계를 명확히 분담할 때 가장 매끄럽게 시작됩니다.`,
    );
  } else if (analyticalA >= 65 && selfControlB >= 65) {
    kickoffBody = pick(
      locale,
      `When work kicks off, ${aName} tends to review the risks and the data carefully before moving, while ${bName} prefers to get started fast. You get the most out of each other when you set a short review window up front and then dive in.`,
      `일이 시작되면 ${aEunNeun} 리스크와 분석 자료를 철저히 검토하며 신중하게 접근하려 하고, ${bEunNeun} 빠른 실행과 착수를 선호합니다. 초기 접근에서 검토 기한을 짧게 정하고 바로 시도해보는 방식으로 호흡을 맞출 때 시너지가 납니다.`,
    );
  }

  // 02. 일이 굴러가기 시작하면 (In-Flight Rhythm & Independence)
  let inFlightBody = pick(
    locale,
    `As a team, you don't need to check in on every detail every day — once the direction and roles are set, you can each run your part independently. Skip the micromanaging; syncing on the big milestones once or twice a week is enough to keep things steady.`,
    `이 팀은 매일 수시로 세부 사항을 확인하지 않아도, 큰 방향과 역할만 정해지면 각자의 구역에서 독립적으로 업무를 끌고 나갈 수 있는 파트너입니다. 불필요한 마이크로매니징보다는 주간 1~2회 주요 마일스톤 싱크만 맞춰도 일상 호흡이 안정적으로 유지됩니다.`,
  );

  if (Math.abs(selfControlA - selfControlB) >= 25 || Math.abs(decisionStyleA - decisionStyleB) >= 25) {
    inFlightBody = pick(
      locale,
      `Once the work is underway, you'll notice a difference in how often you each want to check in. One of you is happy to run with just the big picture, while the other feels more settled seeing the details as they happen. A quick async channel alongside the weekly meeting keeps this from turning into a misunderstanding.`,
      `일이 굴러가기 시작하면 두 사람의 확인 템포에 약간의 차이가 나타납니다. 한쪽은 큰 방향만 맞으면 자유롭게 실행하길 원하지만, 다른 한쪽은 세부 진행 상황이 공유되어야 안심합니다. 주간 미팅 시 짧은 공유 채널(슬랙/카톡 비동기 싱크)을 둘 때 오해 없이 굴러갑니다.`,
    );
  }

  // 03. 서로의 강점이 붙는 순간 (Synergy Chain in Action)
  let synergyMomentBody = pick(
    locale,
    `When ${bName} throws out a wide range of hands-on ideas and possible fixes, ${aName} weighs them against the project's goals and timeline risk and narrows them down to what's actually workable. That chain — propose the options, then structure and de-risk them — is where your strengths combine to get the best possible result.`,
    `${bName} 측에서 실무 현장의 아이디어나 문제 해법을 폭넓게 제안하면, ${aName} 측에서 프로젝트 전체 목표와 일정 리스크를 검토해 실행 가능한 정예안으로 필터링해줍니다. "해법 제시 → 구조화 및 리스크 제어"로 이어지는 실질적인 강점 결합 사슬이 완성도를 극대화합니다.`,
  );

  if (selfControlA >= 65 && selfControlB >= 65) {
    synergyMomentBody = pick(
      locale,
      `You're both highly focused and driven to deliver — with a clear split on who owns what, you can move through work at roughly twice the pace of a typical team. One of you wraps up the planning and external communication while the other pushes the execution through to completion, and that combination compounds into real momentum.`,
      `두 사람 모두 높은 몰입도와 성과 집착력을 지니고 있어, 업무 구역이 명확히 분정된 상태에서는 일반적인 팀의 두 배 속도로 과제를 해결해냅니다. 한쪽이 기획 및 대외 정리를 끝내면 다른 한쪽이 실무 개발/검토를 완벽히 쳐내는 강력한 성과 증폭이 일어납니다.`,
    );
  }

  // 04. 삐걱거리기 시작하는 순간 (Office Risk Preview / Friction Trigger)
  let frictionMomentBody = pick(
    locale,
    `When a deadline gets tight or something unexpected happens outside your control, a fast call or a change request made without checking in first can land as either overstepping or leaving the other person out of the loop — that's usually where the first friction shows up. The fix is simple: when you change the plan or the feedback gets sharper, say why.`,
    `과제 마감이 촉박해지거나 예상치 못한 외부 변수가 터졌을 때, 사전에 상의되지 않은 빠른 판단이나 수정 요청이 발생하면 순간적으로 "권한 침해"나 "공유 부족"으로 느껴져 첫 삐걱거림이 생길 수 있습니다. 피드백 톤이나 룰 변경 시 이유를 덧붙이는 것이 핵심입니다.`,
  );

  if (autonomyA >= 70 && autonomyB >= 70) {
    frictionMomentBody = pick(
      locale,
      `Friction shows up when your standards clash over the final call or the ground rules mid-project. If it's unclear who actually has the final say and one of you decides alone anyway, that can trigger real tension in the moment.`,
      `업무 진행 중 최종 가이드라인이나 결정권을 둘러싸고 두 사람의 기준이 대립할 때 마찰이 생길 수 있습니다. "누가 이 과제의 최종 판단권자인가"가 불분명한 상태에서 한쪽이 독자 결정을 내리면 순간적인 정서적 긴장감이 유발될 수 있습니다.`,
    );
  }

  const lifecycleNarrative: WorkProjectLifecycleNarrative = {
    kickoff: {
      title: pick(locale, "01. When a New Task Lands", "01. 일이 처음 들어왔을 때"),
      body: kickoffBody,
    },
    inFlight: {
      title: pick(locale, "02. Once Work Is Underway", "02. 일이 굴러가기 시작하면"),
      body: inFlightBody,
    },
    synergyMoment: {
      title: pick(locale, "03. Where Your Strengths Click Together", "03. 서로의 강점이 붙는 순간"),
      body: synergyMomentBody,
    },
    frictionMoment: {
      title: pick(locale, "04. Where the First Friction Shows Up", "04. 삐걱거리기 시작하는 순간"),
      body: frictionMomentBody,
    },
  };

  // -------------------------------------------------------------------
  // FINAL TEAM PORTRAIT ("그래서 이 둘은 어떤 팀인가")
  // -------------------------------------------------------------------
  let headline = pick(
    locale,
    `A team where fast structure meets creative problem-solving`,
    `판을 빠르게 정리하는 힘과 막힌 곳에서 해법을 찾는 힘이 만나는 팀`,
  );
  let body = pick(
    locale,
    `${aName}'s knack for structure and scheduling combines with ${bName}'s knack for practical solutions, giving you both speed and follow-through. Set a light framework early on — who owns what, and how you'll decide when something comes up — and you'll keep this level of output going.`,
    `${aName}의 구조화 및 일정 정돈력과 ${bName}의 실무 대안 제시력이 결합해 빠른 템포와 높은 완결성을 동시에 챙길 수 있는 팀입니다. 초기 역할 분담과 이슈 시 판단 룰을 가볍게 정해둔다면 지속적으로 높은 성과를 만들어냅니다.`,
  );

  if (autonomyA >= 70 && autonomyB >= 70) {
    headline = pick(
      locale,
      `A fast, independent team where you each drive your own lane`,
      `각자의 구역에서 강력한 주도성을 발휘하는 고속 독립 추진 팀`,
    );
    body = pick(
      locale,
      `You're both highly accountable and execution-driven — once the boundaries between your roles are clear, this partnership needs very little oversight to produce your best work.`,
      `두 사람 모두 뛰어난 책임감과 실행력을 갖추어, 업무 경계만 명확히 나누어지면 최소한의 관리만으로도 최고의 성과를 도출해내는 주도적 파트너십입니다.`,
    );
  } else if (selfControlA >= 65 && selfControlB >= 65) {
    headline = pick(
      locale,
      `A team that moves fast once the target is set`,
      `목표가 정해지면 압도적인 속도로 성과를 쳐내는 성과 증폭 팀`,
    );
    body = pick(
      locale,
      `Your shared focus and drive to execute mean you can break down even a complicated task quickly and turn it into concrete results — a genuinely strong execution partnership.`,
      `높은 몰입도와 실행 태도가 호흡을 맞춰, 복잡한 과제도 빠르게 분해하고 구체적인 결과물로 변환해내는 강력한 실행 동반자입니다.`,
    );
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
