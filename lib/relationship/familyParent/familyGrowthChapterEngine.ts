/**
 * Family Premium Part 06: Child Growth Intelligence Engine
 *
 * Core responsibility:
 * Decodes the selected child's learning style, motivation engines, social operating mode,
 * challenge resilience, environmental fit, potential unlocking pace, current-year growth theme,
 * and personalized parenting guidance.
 *
 * ABSOLUTE RULES:
 * 1. Absolute anti-hardcoding: Dynamically computed from child's actual CE/chart, Primary 6, Secondary 11,
 *    Child DNA, Core Needs, and temporal evidence.
 * 2. ZERO raw Saju technical terms (천간, 지지, 십성, 일간, 신살, etc.) in user-facing Korean.
 * 3. Proper Korean particle handling (josaEunNeun, josaIGa, josaGwaWa, josaEulReul).
 * 4. Parent profile is used ONLY in Section 09 (parent guidance) to determine support fit.
 *
 * Phase 2 English remediation: `locale` was already in the type and already
 * destructured with a default, but never referenced in the body — dead
 * param. Every returned string now goes through `pick(locale, en, ko)`; the
 * Korean strings and the score-threshold branching logic are unchanged.
 * English copy is a natural rewrite for a US reader.
 */

import type { Locale } from "@/lib/i18n/locale";
import type { FamilyChildGrowthChapterBundle } from "./familyStoryPlanTypes";
import { josaEunNeun, josaIGa, josaGwaWa, josaEulReul, josaE } from "@/lib/relationship/familyParent/familyParentLanguage";
import { pick, LEGACY_FALLBACK_LOCALE } from "./familyParentCopy";

void josaE;

export type BuildFamilyGrowthChapterParams = {
  childNickname: string;
  parentNickname: string;
  childIsViewer?: boolean;
  locale?: Locale;

  /** Child Core Psychology & Axes */
  psychChild?: {
    scores?: Record<string, number>;
    primaryAxes?: Record<string, number>;
    secondaryAxes?: Record<string, number>;
  } | null;

  /** Parent Core Psychology */
  psychParent?: {
    scores?: Record<string, number>;
    primaryAxes?: Record<string, number>;
    secondaryAxes?: Record<string, number>;
  } | null;

  /** Child Saju Ten-God & Chart Counts */
  countsChild?: {
    food?: number;
    seal?: number;
    wealth?: number;
    officer?: number;
    self?: number;
  } | null;

  /** Legacy Section Data for Temporal Layer */
  growthTunnelSec?: {
    current_challenge?: string;
    focus_areas?: string[];
  } | null;

  talentSec?: {
    study_type?: string;
    wealth_vessel?: string;
  } | null;

  /** Pair Meanings if available */
  pairMeanings?: {
    expectationVsPressure?: {
      parentExpectation?: string;
      childPressureReception?: string;
      summary?: string;
    };
    childCoreNeeds?: {
      summary?: string;
    };
  } | null;
};

export function buildFamilyGrowthChapterBundle(
  params: BuildFamilyGrowthChapterParams
): FamilyChildGrowthChapterBundle {
  const {
    childNickname,
    parentNickname,
    locale = LEGACY_FALLBACK_LOCALE,
    psychChild,
    psychParent,
    countsChild,
    growthTunnelSec,
    pairMeanings,
  } = params;
  void psychParent;

  const cName = childNickname || pick(locale, "the child", "아이");
  const pName = parentNickname || pick(locale, "the parent", "부모");

  const cEunNeun = josaEunNeun(cName);
  const cIGa = josaIGa(cName);
  const cGwaWa = josaGwaWa(cName);
  void cGwaWa;
  const cEulReul = josaEulReul(cName);
  void cEulReul;

  const pEunNeun = josaEunNeun(pName);
  const pIGa = josaIGa(pName);
  void pIGa;

  // Extract Child Axes (Secondary 11 & Primary 6)
  const sec = psychChild?.secondaryAxes || {};
  const prim = psychChild?.primaryAxes || {};

  const stimulation = sec.stimulation ?? prim.growth ?? 50;
  const growthOrient = sec.growth_orientation ?? prim.growth ?? 50;
  const recognition = sec.recognition ?? 50;
  const autonomy = sec.autonomy ?? prim.autonomy ?? 50;
  const stability = sec.stability_orientation ?? prim.stability ?? 50;
  const practical = sec.practicality ?? 50;
  const analytical = sec.analytical_thinking ?? 50;
  const selfControl = sec.self_control ?? prim.structure ?? 50;
  const resilience = sec.resilience ?? 50;
  const extEnergy = sec.external_energy ?? prim.connection ?? 50;
  const adaptability = sec.adaptability ?? prim.adaptability ?? 50;
  const structure = sec.structure ?? prim.structure ?? 50;

  // Extract Child Ten-God Dominance
  const foodCount = countsChild?.food ?? 0;
  const sealCount = countsChild?.seal ?? 0;
  const wealthCount = countsChild?.wealth ?? 0;
  const officerCount = countsChild?.officer ?? 0;

  // -------------------------------------------------------------------
  // Section 01: ◤ 이 아이를 움직이게 하는 힘 (Motivation)
  // -------------------------------------------------------------------
  let driveTitle = pick(
    locale,
    `${cName} lights up most when they get to find their own way and make the choice themselves.`,
    `${cEunNeun} 스스로 방법을 찾고 선택할 수 있을 때 몰입 엔진이 커져요.`,
  );
  let driveDesc = pick(
    locale,
    `${cName} feels the strongest sense of fun and pride when they're the one driving the attempt and the result. Give them the choice instead of an order, and real focus shows up on its own.`,
    `${cIGa} 주도적으로 시도하고 결과를 만들어내는 과정에서 가장 강한 재미와 뿌듯함을 느껴요. 억지로 시키는 지시보다는 아이에게 선택권을 줄 때 능동적인 집중력이 살아납니다.`,
  );
  let primaryMotivator = pick(locale, "Independent exploration and choice", "자율적 탐색과 선택권");

  if (foodCount >= 2 || (autonomy >= 60 && stimulation >= 55)) {
    driveTitle = pick(
      locale,
      `${cName}'s strength shows up most when they find their own new way, instead of following a set answer.`,
      `${cEunNeun} 정해진 답보다 스스로 새로운 방식을 찾을 때 강점이 살아나요.`,
    );
    driveDesc = pick(
      locale,
      `${cName}'s motivation spikes when they can add their own idea and try it themselves, instead of just repeating something. Feeling like their own approach is respected is the real engine here.`,
      `${cIGa} 단순 반복보다는 자기 아이디어를 얹어 직접 시도해볼 수 있을 때 동기가 급상승해요. 과정에서 자기만의 방식을 존중받는 느낌이 핵심 엔진입니다.`,
    );
    primaryMotivator = pick(locale, "Creative exploration and taking initiative", "창의적 탐색과 주도성");
  } else if (sealCount >= 2 || (analytical >= 60 && stability >= 55)) {
    driveTitle = pick(
      locale,
      `${cName} moves on their own once the "why" behind it actually makes sense to them.`,
      `${cEunNeun} '왜 그런지' 맥락과 이유가 납득될 때 스스로 움직여요.`,
    );
    driveDesc = pick(
      locale,
      `Rather than just going along with it, ${cName}'s curiosity kicks in hard once they understand the reasoning behind it. Give them an explanation that actually convinces them instead of pushing for quick compliance, and something switches on.`,
      `${cIGa} 무작정 따라 하기보다는 원리와 이유를 이해하고 나면 강한 지적 탐구심이 발동해요. 성급한 이행 요구보다 스스로 납득할 수 있는 설명을 해줄 때 마음이 켜집니다.`,
    );
    primaryMotivator = pick(locale, "Understanding the principle and being intellectually convinced", "원리 이해와 지적 납득");
  } else if (wealthCount >= 2 || (practical >= 60 && growthOrient >= 55)) {
    driveTitle = pick(
      locale,
      `${cName} gets real energy from seeing a tangible, useful result — a clear change they can point to.`,
      `${cEunNeun} 손에 잡히는 유용한 결과와 확실한 변화를 볼 때 에너지가 생겨요.`,
    );
    driveDesc = pick(
      locale,
      `${cName} feels real accomplishment when something turns out to actually be useful or visibly worked, more than from abstract theory. Show them a concrete goal and its real-world value, and their drive gets a lot stronger.`,
      `${cIGa} 막연한 이론보다 실제로 쓰임새가 있거나 눈에 보이는 성과가 만들어질 때 큰 성취감을 느껴요. 구체적인 목표와 활용 가치를 보여줄 때 추진력이 강해집니다.`,
    );
    primaryMotivator = pick(locale, "Practical results and a clear outcome", "실용적 성과와 명확한 결과");
  } else if (officerCount >= 2 || (recognition >= 65 && selfControl >= 55)) {
    driveTitle = pick(
      locale,
      `${cName}'s sense of responsibility surges when they have a clear role and get real recognition for it.`,
      `${cEunNeun} 분명한 역할과 그에 따른 인정을 받을 때 책임감이 솟구쳐요.`,
    );
    driveDesc = pick(
      locale,
      `${cName} gets deeply focused and motivated to grow when their role is clear and the people around them genuinely notice the effort. Clear expectations and real positive feedback are what move this kid most reliably.`,
      `${cIGa} 자신이 맡은 역할이 분명하고 그 노력을 주변에서 제대로 알아줄 때 강한 몰입과 성장의 의지가 생겨요. 명확한 기대와 긍정적 피드백이 아이를 움직이는 가장 단단한 힘입니다.`,
    );
    primaryMotivator = pick(locale, "A clear role and having their effort recognized", "명확한 역할과 성취 인정");
  } else if (stability >= 65) {
    driveTitle = pick(
      locale,
      `${cName}'s real ability shows up once they have a reassuring environment and a steady routine.`,
      `${cEunNeun} 안심할 수 있는 환경과 꾸준한 루틴이 갖춰질 때 실력이 나와요.`,
    );
    driveDesc = pick(
      locale,
      `${cName} performs comfortably once things feel predictable and safely bounded, rather than suddenly changing. A gentle, unhurried pace is the real foundation for their growth.`,
      `${cIGa} 급작스러운 변화보다는 예측 가능한 순서와 안전한 울타리가 느껴질 때 비로소 편안하게 역량을 발휘해요. 서두르지 않는 온화한 페이스 조율이 성장의 기반입니다.`,
    );
    primaryMotivator = pick(locale, "A stable routine and predictability", "안정된 루틴과 예측 가능성");
  }

  // -------------------------------------------------------------------
  // Section 02: ◤ 배우고 몰입하는 방식 (Learning & Focus)
  // -------------------------------------------------------------------
  let oneLineStudyType = pick(
    locale,
    "In one line: an independent explorer who charts their own path",
    "한 줄 타입: 새로운 길을 탐색하는 자율 탐색형",
  );
  if (sealCount >= 2 || analytical >= 60) {
    oneLineStudyType = pick(
      locale,
      "In one line: needs to understand the reasoning and context before they move",
      "한 줄 타입: 원리와 맥락이 이해되어야 움직이는 맥락 이해형",
    );
  } else if (selfControl >= 60 || structure >= 60) {
    oneLineStudyType = pick(
      locale,
      "In one line: builds real skill steadily, through a systematic order",
      "한 줄 타입: 체계적인 순서로 단단하게 실력을 쌓는 성실 수련형",
    );
  } else if (practical >= 60) {
    oneLineStudyType = pick(
      locale,
      "In one line: applies things practically and produces useful results",
      "한 줄 타입: 실제 적용과 유용한 성과를 만들어내는 실속 응용형",
    );
  }

  // 1. 집중이 켜지는 환경
  let focusEnvironment = pick(
    locale,
    `${cName} focuses best in a space with a bit of stimulation and change they can adjust themselves, rather than somewhere too quiet or rigid.`,
    `${cEunNeun} 너무 조용하거나 딱딱한 환경보다, 스스로 조율하며 약간의 자극과 변화가 있는 공간에서 집중이 잘 켜져요.`,
  );
  if (stimulation <= 45 && analytical >= 55) {
    focusEnvironment = pick(
      locale,
      `${cName} hits their best focus in a quiet, distraction-free space of their own, where they can think deeply for a long stretch.`,
      `${cEunNeun} 방해 요소가 없고 고요하며, 긴 시간 연속해서 깊게 생각할 수 있는 조용한 개별 공간에서 최상의 몰입이 나와요.`,
    );
  } else if (extEnergy >= 60 && stimulation >= 60) {
    focusEnvironment = pick(
      locale,
      `${cName}'s focus takes off in an active environment with short, intense goals, visual elements, and conversation mixed in — not from sitting still in one place for a long stretch.`,
      `${cEunNeun} 한 자리에 오래 앉아 정적인 공부만 하기보다는, 짧고 강렬한 목표나 시각적 요소, 대화가 섞인 활동적 환경에서 집중력이 솟아요.`,
    );
  } else if (structure >= 60) {
    focusEnvironment = pick(
      locale,
      `${cName} settles in and stays focused in an organized study environment — a tidy desk and a clear, step-by-step guide.`,
      `${cEunNeun} 정돈된 책상과 명확한 단계별 가이드가 준비된 안정적인 학습 환경에서 마음이 안정되고 집중이 잘 유지돼요.`,
    );
  }

  // 2. 이해가 되는 방식
  let understandingStyle = pick(
    locale,
    `${cName} picks up a concept fastest by seeing a real example or a concrete application, not by memorizing a formula outright.`,
    `${cEunNeun} 공식을 무작정 외우기보다, 실제 예시나 구체적인 적용 모습을 직접 볼 때 가장 빠르게 개념을 받아들여요.`,
  );
  if (analytical >= 60 || sealCount >= 2) {
    understandingStyle = pick(
      locale,
      `Once the logic and the "why" behind it actually make sense to ${cName}, it sticks — memorization just happens on its own.`,
      `${cEunNeun} 앞뒤 개연성과 '왜 그런지' 핵심 원리가 납득되어야 머릿속에 오래 남아 저절로 암기가 돼요.`,
    );
  } else if (foodCount >= 2 || autonomy >= 60) {
    understandingStyle = pick(
      locale,
      `The concept really clicks for ${cName} when they work toward the answer themselves or try a different way to solve it, more than from just listening to an explanation.`,
      `${cEunNeun} 설명만 들을 때보다 아이가 직접 정답을 유도해 보거나 다른 방식으로 풀어볼 때 개념이 완성돼요.`,
    );
  }

  // 3. 계획을 세우는 방식
  let planningStyle = pick(
    locale,
    `${cName} works best with a big goal and a few milestones, adjusting the details themselves, rather than a plan packed minute by minute.`,
    `${cEunNeun} 분 단위의 지나치게 빽빽한 계획보다는, 큰 목표와 마일스톤을 두고 실행 방법은 자율적으로 조정할 때 효과적이에요.`,
  );
  if (selfControl >= 60 || structure >= 60) {
    planningStyle = pick(
      locale,
      `${cName} likes laying out today's tasks in order and checking them off one by one, a systematic way of staying organized.`,
      `${cEunNeun} 오늘 할 일을 순서대로 정리하고 체크리스트를 하나씩 지워나가는 체계적인 정돈 방식을 좋아해요.`,
    );
  } else if (adaptability >= 60 || stimulation >= 60) {
    planningStyle = pick(
      locale,
      `A flexible plan suits ${cName} better — their output goes up when they can reorder what they focus on based on how they're feeling that day, instead of sticking to a fixed routine.`,
      `${cEunNeun} 유연한 계획이 맞아요. 굳어진 루틴보다는 그날의 상태에 따라 집중할 과목의 순서를 바꿀 수 있을 때 능률이 올라가요.`,
    );
  }

  // 4. 혼자 vs 함께
  let socialMode = pick(
    locale,
    `${cName} generally needs quiet time to think alone, but when they get stuck, talking it through or discussing it helps break through.`,
    `${cEunNeun} 기본적으로 혼자 조용히 생각하는 시간이 필요하지만, 막히는 지점에서는 대화나 토론을 통해 아이디어를 뚫어내는 것이 좋아요.`,
  );
  if (extEnergy >= 60) {
    socialMode = pick(
      locale,
      `${cName}'s energy really picks up when they explain what they've learned to a friend or parent, or study in a back-and-forth question-and-answer style.`,
      `${cEunNeun} 친구나 부모에게 자신이 배운 내용을 직접 설명해보거나, 서로 묻고 답하는 스터디 톤에서 에너지가 훨씬 커져요.`,
    );
  } else if (extEnergy <= 45 && autonomy >= 55) {
    socialMode = pick(
      locale,
      `${cName}'s real ability shows up when they get to focus alone and finish a task at their own pace, rather than in a rushed conversation or group work.`,
      `${cEunNeun} 성급한 대화나 그룹 작업보다는, 혼자 온전히 몰입하여 자기 속도로 과제를 끝까지 마칠 때 실력이 제대로 발휘돼요.`,
    );
  }

  // -------------------------------------------------------------------
  // Section 03: ◤ 칭찬과 기대가 동기가 되는 방식 (Motivation & Expectation)
  // -------------------------------------------------------------------
  let praiseGuidanceTitle = pick(
    locale,
    `${cName} lights up more from specific praise about the effort they put in than from vague praise about the outcome.`,
    `${cEunNeun} 막연한 결과 칭찬보다 아이가 들인 노력을 구체적으로 집어줄 때 기쁨이 커져요.`,
  );
  let praiseGuidanceDesc = pick(
    locale,
    `${cName}'s self-esteem gets a lot sturdier from a specific acknowledgment — like "the way you came up with that idea yourself was great" — than from a surface-level "good job."`,
    `${cIGa} "잘했어"라는 피상적인 칭찬보다는 "아이가 스스로 이 아이디어를 떠올린 부분이 훌륭하네"처럼 구체적인 역량을 알아줄 때 자존감이 단단해져요.`,
  );
  if (recognition >= 65) {
    praiseGuidanceTitle = pick(
      locale,
      `${cName} grows on recognition — clear, immediate feedback is their biggest fuel.`,
      `${cEunNeun} 인정을 먹고 자라는 아이 — 즉각적이고 선명한 피드백이 성장의 가장 큰 연료예요.`,
    );
    praiseGuidanceDesc = pick(
      locale,
      `${cName}'s eyes light up when a parent or the people around them actually notice the care and effort they put in. Encourage the process generously, and always name a specific achievement, however small — they'll deliver more than expected.`,
      `${cIGa} 자신이 들인 정성과 성과를 부모나 주변에서 알아봐 줄 때 눈빛이 살아나요. 과정을 아낌없이 격려하되, 작더라도 구체적인 성취를 꼭 짚어 말해주면 기대 이상의 역량을 발휘해요.`,
    );
  } else if (recognition <= 45) {
    praiseGuidanceTitle = pick(
      locale,
      `${cName} moves more deeply on quiet trust and autonomy than on heavy praise.`,
      `${cEunNeun} 과도한 칭찬보다는 조용한 신뢰와 자율권을 줄 때 더 깊게 움직여요.`,
    );
    praiseGuidanceDesc = pick(
      locale,
      `Whether ${cName} is satisfied with their own result matters more to them than swinging on other people's praise or evaluation. A calm, matter-of-fact "I trust your judgment" does more for them than a flood of compliments.`,
      `${cIGa} 남의 과한 칭찬이나 평가에 일희일비하기보다, 스스로 만족스러운 결과를 냈는지가 더 중요해요. 칭찬을 쏟아붓기보다 "너의 선택과 판단을 믿는다"는 담담한 신뢰의 톤이 마음을 편하게 해줍니다.`,
    );
  }

  let expectationTitle = pick(
    locale,
    `Where ${pName}'s expectations land as a warm guideline, not pressure`,
    `${pName}의 기대가 따뜻한 가이드라인으로 전달되는 지점`,
  );
  let expectationDesc = pick(
    locale,
    `Instead of pushing ${pName}'s standard quickly, setting the goal together with what the kid actually wants to reach turns expectation into a steady lighthouse instead of pressure.`,
    `${pName}가 바라는 기준을 성급하게 밀어붙이기보다, 아이가 다다르고 싶은 목표를 함께 설정할 때 기대는 중압감이 아니라 든든한 등대가 됩니다.`,
  );
  if (pairMeanings?.expectationVsPressure?.summary) {
    expectationDesc = pairMeanings.expectationVsPressure.summary;
  }

  // -------------------------------------------------------------------
  // Section 04: ◤ 새로운 도전과 실패를 다루는 방식 (Challenge)
  // -------------------------------------------------------------------
  let challengeTitle = pick(
    locale,
    `${cName} is the type who only gets bold about a challenge once they feel a safe fence around them.`,
    `${cEunNeun} 안전한 울타리가 느껴질 때 비로소 과감하게 도전에 나서는 타입이에요.`,
  );
  let challengeDesc = pick(
    locale,
    `${cName} has the caution to weigh their odds before trying, rather than diving straight into risk. Their range of challenges widens when a parent signals "it's fine if you fail, I've got your back."`,
    `${cIGa} 무작정 위험을 무릅쓰기보다는 성공 가능성을 가늠한 뒤 시도하는 신중함이 있어요. 부모가 "실패해도 괜찮아, 언제든 지켜봐 줄게"라는 백업 신호를 줄 때 도전의 폭이 넓어집니다.`,
  );
  let resiliencePattern = pick(
    locale,
    "A steady type who checks the safety net first, then expands step by step",
    "안전망 확인 후 차근차근 확장하는 안정적 도전형",
  );

  if (growthOrient >= 60 && stability >= 60) {
    challengeTitle = pick(
      locale,
      `It's not that ${cName} dislikes new challenges — they just get bold once the foundation feels secure.`,
      `${cEunNeun} 새로운 도전을 싫어하는 것이 아니라, 기반이 안전할 때 비로소 과감해지는 아이예요.`,
    );
    challengeDesc = pick(
      locale,
      `${cName} shows real focus once they've prepared and feel confident, rather than jumping in recklessly. A strategy of building up small wins step by step suits them best.`,
      `${cIGa} 무모하게 뛰어들기보다 준비 과정을 거친 후 확신이 들 때 뛰어난 몰입을 보여줍니다. 차근차근 단계를 밟아 성공 경험을 누적시키는 전략이 가장 잘 맞습니다.`,
    );
    resiliencePattern = pick(locale, "A late bloomer who unfolds on a solid foundation", "확고한 기반 위에서 펼쳐지는 대기만성 도전형");
  } else if (stimulation >= 60 && resilience <= 50) {
    challengeTitle = pick(
      locale,
      `${cName} starts fast on curiosity, but needs help staying in it through the early trial and error.`,
      `${cEunNeun} 호기심으로 시도는 빠르게 시작하지만, 초기 시행착오에서 지치지 않도록 조율이 필요해요.`,
    );
    challengeDesc = pick(
      locale,
      `${cName}'s eyes light up and they dive straight into a new topic, but can lose interest quickly if the result doesn't show up right away. Playing pacemaker — celebrating small early wins together — really helps.`,
      `${cIGa} 새로운 주제에는 눈을 반짝이며 선뜻 뛰어들지만, 원하는 결과가 즉시 나오지 않으면 쉽게 흥미를 잃을 수 있어요. 초반의 작은 성공을 함께 축하해주는 페이스메이커 역할이 도움이 됩니다.`,
    );
    resiliencePattern = pick(locale, "A fast starter who needs help with early follow-through", "시작은 빠르나 초반 지속력 보완이 필요한 탐색형");
  } else if (growthOrient >= 65 && resilience >= 60) {
    challengeTitle = pick(
      locale,
      `${cName} has real resilience — they treat failure as a lesson and get back up.`,
      `${cEunNeun} 실패를 배움의 계기로 삼고 다시 일어서는 단단한 복원력을 가졌어요.`,
    );
    challengeDesc = pick(
      locale,
      `Rather than getting discouraged by one or two failures, ${cName} has a strong drive to figure out what was missing and try again. The best thing to do is watch and cheer them on, instead of rushing to shield them from disappointment.`,
      `${cIGa} 한두 번의 실패로 좌절하기보다 무엇이 부족했는지 분석하고 재도전하는 성장의지가 강해요. 아이의 좌절을 성급히 막기보다 지켜보며 응원해주는 것이 최고입니다.`,
    );
    resiliencePattern = pick(locale, "A determined type who recovers from failure and tries again", "실패를 회복하고 재도전하는 단단한 성장의지형");
  }

  // -------------------------------------------------------------------
  // Section 05: ◤ 밖에 나가면 어떤 모습이 될까요 (Social Operating Mode)
  // -------------------------------------------------------------------
  let socialOperatingTitle = pick(
    locale,
    `${cName} earns trust at school or on a team by clearly doing their own part.`,
    `${cEunNeun} 학교나 팀 안에서 자기 역할을 또렷하게 해내며 신뢰를 얻어요.`,
  );
  let socialOperatingDesc = pick(
    locale,
    `${cName} doesn't need to grab for the lead — they earn recognition through quietly doing their part and a mature, considerate attitude toward others.`,
    `${cIGa} 무리하게 주도권을 잡으려 애쓰지 않아도, 묵묵히 제 몫을 해내고 타인을 배려하는 성숙한 태도로 주변의 인정을 받습니다.`,
  );
  let recommendedActivities = pick(
    locale,
    ["Independent deep-dives", "Small-team projects", "Practical, hands-on creative work", "Problem-solving discussions"],
    ["개별 전문 탐구", "소규모 팀 프로젝트", "실용적 창작 활동", "문제 해결 토론"],
  );

  if (officerCount >= 2 || (selfControl >= 60 && extEnergy >= 55)) {
    socialOperatingTitle = pick(
      locale,
      `In a group, ${cName} steps into leadership — organizing people and setting clear rules.`,
      `${cEunNeun} 외부 집단에 나가면 사람들과 규칙을 단단히 정돈하는 리더십을 발휘해요.`,
    );
    socialOperatingDesc = pick(
      locale,
      `${cName}'s strong sense of responsibility naturally puts them at the center of a group or project — setting direction, dividing up roles. They shine when given clear responsibility and authority.`,
      `${cIGa} 책임감이 강하여 모임이나 프로젝트에서 방향을 잡고 역할을 나누는 중추적인 역할을 자연스럽게 맡아요. 분명한 책임과 권한이 주어질 때 빛이 납니다.`,
    );
    recommendedActivities = pick(
      locale,
      ["Team lead roles", "Setting rules & project planning", "Presenting & mentoring", "Organized volunteer work"],
      ["팀 리더 역할", "규칙 및 프로젝트 기획", "발표 및 멘토링", "조직 봉사 활동"],
    );
  } else if (foodCount >= 2 || (stimulation >= 60 && extEnergy >= 60)) {
    socialOperatingTitle = pick(
      locale,
      `${cName} is the creative one who lightens the mood and brings fresh ideas.`,
      `${cEunNeun} 분위기를 밝게 만들고 참신한 아이디어를 내놓는 창의적 분위기 메이커예요.`,
    );
    socialOperatingDesc = pick(
      locale,
      `${cName} energizes a stalled room with angles nobody else thought of. Without being boxed in, they become the team's best idea generator.`,
      `${cIGa} 남들이 생각지 못한 자유로운 각도에서 대안을 제시하며 정체된 분위기에 활력을 불어넣어요. 틀에 가두지 않을 때 팀 내 최고의 아이디어 드라이버가 됩니다.`,
    );
    recommendedActivities = pick(
      locale,
      ["Idea generation & design", "Open discussion & performance/expression", "Creative brainstorming", "Taking on new projects"],
      ["아이디어 기획 및 디자인", "자유 토론 및 연극/표현", "창의적 브레인스토밍", "신규 프로젝트 도전"],
    );
  } else if (sealCount >= 2 || analytical >= 65) {
    socialOperatingTitle = pick(
      locale,
      `${cName} is the quiet expert who raises the team's level through deep analysis and advice.`,
      `${cEunNeun} 조용하지만 깊이 있는 분석과 자문으로 팀의 수준을 높여주는 전문가 톤이에요.`,
    );
    socialOperatingDesc = pick(
      locale,
      `Rather than speaking up a lot, ${cName} pinpoints exactly what matters — their real influence runs a lot deeper than it looks on the surface. They get recognized in an environment that allows for real depth.`,
      `${cIGa} 나서서 말을 많이 하기보다 핵심을 정확히 짚어내어 겉보기보다 훨씬 더 큰 실질적 영향력을 행사합니다. 깊은 탐구가 가능한 환경에서 인정받아요.`,
    );
    recommendedActivities = pick(
      locale,
      ["Deep research", "Experiments & data analysis", "Writing & papers", "Independent expert research"],
      ["심도 있는 자료 조사", "실험 및 데이터 분석", "글쓰기 및 논문 작성", "개인 전문 연구"],
    );
  }

  // -------------------------------------------------------------------
  // Section 06: ◤ 능력이 잘 살아나는 환경 (Environment Fit)
  // -------------------------------------------------------------------
  const envConditions = [
    {
      label: pick(locale, "Guidance style", "가이드 방식"),
      value: autonomy >= 55
        ? pick(locale, "Independent choice encouraged", "자율적 선택 권장")
        : pick(locale, "Clear step-by-step guidance", "명확한 단계 가이드"),
      left: pick(locale, "Step-by-step guidance", "단계별 가이드"),
      right: pick(locale, "Independent choice", "자율적 선택"),
      positionPct: Math.min(90, Math.max(10, autonomy)),
    },
    {
      label: pick(locale, "Focus space", "몰입 공간"),
      value: extEnergy <= 45 || analytical >= 60
        ? pick(locale, "An independent space of their own", "독립적 개별 공간")
        : pick(locale, "An active, communicative environment", "활발한 소통 환경"),
      left: pick(locale, "Independent space", "독립적 개별 공간"),
      right: pick(locale, "Active communication", "활발한 소통"),
      positionPct: Math.min(90, Math.max(10, extEnergy)),
    },
    {
      label: pick(locale, "Feedback tempo", "피드백 템포"),
      value: recognition >= 60
        ? pick(locale, "Frequent listening & feedback", "자주 경청·피드백")
        : pick(locale, "Self-reflection", "스스로 성찰 평가"),
      left: pick(locale, "Self-reflection", "스스로 성찰"),
      right: pick(locale, "Frequent listening & feedback", "자주 경청·피드백"),
      positionPct: Math.min(90, Math.max(10, recognition)),
    },
    {
      label: pick(locale, "Challenge tempo", "도전 템포"),
      value: stimulation >= 60
        ? pick(locale, "Bold goal-setting", "과감한 목표 도전")
        : pick(locale, "Gradual, step-by-step practice", "점진적 단계 수련"),
      left: pick(locale, "Gradual steps", "점진적 단계"),
      right: pick(locale, "Bold challenges", "과감한 도전"),
      positionPct: Math.min(90, Math.max(10, stimulation)),
    },
  ];

  const envSummary = pick(
    locale,
    `${cName} shows their full potential with the least friction in an environment that combines [${envConditions[0].value}] and [${envConditions[1].value}].`,
    `${cEunNeun} [${envConditions[0].value}]과 [${envConditions[1].value}]이 조합된 환경에서 가장 마찰 없이 본래의 잠재력을 마음껏 발휘해요.`,
  );

  // -------------------------------------------------------------------
  // Section 07: ◤ 잠재력이 자라는 방식 (Potential Pace - Upgrade Wealth Vessel)
  // -------------------------------------------------------------------
  let potentialTitle = pick(
    locale,
    `${cName} is a late bloomer whose strengths get clearer as experience and time build up.`,
    `${cEunNeun} 경험과 시간이 누적될수록 강점이 선명해지는 대기만성 누적 성장형이에요.`,
  );
  let potentialDesc = pick(
    locale,
    `Instead of showing all their ability at once, ${cName} builds their own depth gradually, through trial and error. Trust them and give it time instead of pushing for fast results, and their capacity grows enormous as they get older.`,
    `${cIGa} 처음부터 모든 실력을 단번에 터뜨리기보다, 차근차근 시행착오를 거치며 자기만의 깊이를 만들어가요. 조급하게 결과를 촉촉하지 않고 믿고 기다려줄 때 나이가 들수록 그릇이 거대해집니다.`,
  );

  if (wealthCount >= 2 || practical >= 65) {
    potentialTitle = pick(
      locale,
      `Given real opportunity and autonomy, ${cName} is the applied type who quickly makes something practical happen.`,
      `${cEunNeun} 실질적인 기회와 자율성이 주어지면 빠르게 실속을 만들어내는 응용형이에요.`,
    );
    potentialDesc = pick(
      locale,
      `${cName}'s strength comes out instinctively when they're facing an actual real-world task, not just theory. Getting them small real-world experience early is the fastest way to grow their capacity for success.`,
      `${cIGa} 이론에 그치지 않고 실제 현장이나 현실적 과제에 직면했을 때 강점이 직관적으로 터져 나와요. 조기에 작은 실전 경험을 갖게 해주는 것이 성공 그릇을 빨리 키우는 지름길입니다.`,
    );
  } else if (officerCount >= 2 || (selfControl >= 60 && growthOrient >= 60)) {
    potentialTitle = pick(
      locale,
      `Given a clear goal and role, ${cName} is the achiever whose trajectory climbs steadily.`,
      `${cEunNeun} 명확한 목표와 역할이 주어질 때 커리어가 단단하게 상승하는 성취형이에요.`,
    );
    potentialDesc = pick(
      locale,
      `Clear milestones and recognition within a group are what sharpen ${cName}'s ability quickly. Their potential really blooms once they're given a role that gives them a real sense of pride.`,
      `${cIGa} 뚜렷한 이정표와 조직 내 인정이 계기가 되어 역량이 빠르게 정돈돼요. 아이의 마음에 자부심을 심어주는 명예로운 역할이 주어질 때 잠재력이 크게 피어납니다.`,
    );
  }

  // -------------------------------------------------------------------
  // Section 08: ◤ 올해 특히 키우게 될 힘 (Yearly Temporal Layer)
  // -------------------------------------------------------------------
  let yearlyGrowth: FamilyChildGrowthChapterBundle["yearlyGrowth"] = null;
  if (growthTunnelSec && (growthTunnelSec.current_challenge || (growthTunnelSec.focus_areas && growthTunnelSec.focus_areas.length > 0))) {
    yearlyGrowth = {
      yearlyTheme:
        growthTunnelSec.current_challenge ||
        pick(
          locale,
          `This is the year ${cName} expands their range of independent judgment and responsibility by one more notch.`,
          `${cEunNeun} 올해 스스로 판단하고 책임지는 자율성의 범위를 한 단계 넓히는 시기예요.`,
        ),
      yearlyBehavior:
        (growthTunnelSec.focus_areas && growthTunnelSec.focus_areas[0]) ||
        pick(
          locale,
          `${cName} may show more of their own opinions and independent stubbornness in everyday choices and behavior than before.`,
          `${cIGa} 일상 선택이나 행동에서 이전보다 자기 주장이나 독립적인 고집을 더 드러낼 수 있어요.`,
        ),
      parentSupportRole:
        (growthTunnelSec.focus_areas && growthTunnelSec.focus_areas[1]) ||
        pick(
          locale,
          `Rather than jumping in to correct things quickly, it helps for ${pName} to step back one pace and act as the safety net while they experience the outcome themselves.`,
          `${pEunNeun} 성급하게 지적하거나 수정하려 하기보다, 스스로 결과를 경험해볼 수 있도록 한 발짝 물러서서 안전망 역할을 해주는 것이 좋아요.`,
        ),
      reassuranceNote: pick(
        locale,
        `The temporary stubbornness or exploratory behavior showing up this year isn't a bad habit forming — it's a natural growing pain of independence taking root, so there's no need to worry.`,
        `올해 나타나는 일시적인 고집이나 탐색적인 행동은 버릇이 나빠진 것이 아니라 자율성이 뿌리내리는 자연스러운 성장통이니 안심하셔도 돼요.`,
      ),
    };
  } else {
    // Default temporal growth theme
    yearlyGrowth = {
      yearlyTheme: pick(
        locale,
        `This is the year ${cName} builds the ability to express and organize their own thoughts and feelings more clearly.`,
        `${cEunNeun} 올해 자신의 생각과 감정을 더 또렷하게 표현하고 정리하는 힘을 키우는 해예요.`,
      ),
      yearlyBehavior: pick(
        locale,
        `${cName} may ask more for their own preferences and choices, or want more time to focus alone, than before.`,
        `${cIGa} 이전보다 자신의 선호나 선택권을 더 요구하거나, 혼자만의 집중 시간을 더 가질 수 있어요.`,
      ),
      parentSupportRole: pick(
        locale,
        `The best support ${pName} can offer is hearing them out fully without rushing to judge, and widening the room for their choices.`,
        `${pEunNeun} 아이의 이야기를 섣불리 평가하지 않고 끝까지 들어주며, 선택의 여지를 넓혀주는 것이 가장 좋은 조력입니다.`,
      ),
      reassuranceNote: pick(
        locale,
        `The changes showing up this year are a natural part of the kid's independence growing, so there's no need to rush or worry.`,
        `올해 나타나는 변화는 아이의 자율적 마음이 자라는 자연스러운 과정이므로 조급해하지 않으셔도 안심하셔도 괜찮아요.`,
      ),
    };
  }

  // -------------------------------------------------------------------
  // Section 09: ◤ 이 아이를 키울 때 기억하면 좋은 것 (Parent Guidance)
  // -------------------------------------------------------------------
  let pushForward = pick(
    locale,
    `When you talk with ${cName}, name the idea and the attempt itself specifically — not just the outcome.`,
    `${cName}과(와) 대화할 때 결과보다 과정에서 아이가 낸 아이디어와 시도 자체를 구체적으로 인정해주세요.`,
  );
  let scaffold = pick(
    locale,
    `Breaking the goal down into small first steps helps ${cName} start a task without feeling overwhelmed.`,
    `${cIGa} 과제를 시작할 때 첫 단계를 부담 없이 시작할 수 있도록 목표를 작게 쪼개어주는 조력이 도움이 돼요.`,
  );
  let lessOf = pick(
    locale,
    `It helps to ease off on stepping in with the answer before ${cName} has room to decide, or demanding an immediate check-in.`,
    `${cEunNeun} 스스로 판단할 여지없이 부모가 미리 답을 내려주거나 즉각적인 확인을 요구하는 개입은 덜 하셔도 괜찮아요.`,
  );

  if (autonomy >= 60 || foodCount >= 2) {
    pushForward = pick(
      locale,
      `Give ${cName} generous room to decide how to execute or in what order — the choice itself matters.`,
      `${cIGa} 실행 방법이나 계획의 순서를 스스로 결정해볼 수 있는 선택권을 아낌없이 밀어주세요.`,
    );
    scaffold = pick(
      locale,
      `Quietly keep the big-picture direction and boundaries in place so ${cName}'s ideas don't sprawl off track, without micromanaging the details.`,
      `${cIGa} 과도한 아이디어 확산으로 삼천포로 빠지지 않게 큰 방향과 울타리만 조용히 정돈해주세요.`,
    );
    lessOf = pick(
      locale,
      `It helps to dial back a controlling tone that insists ${cName} follow a fixed manual or the parent's own way, no exceptions.`,
      `${cEunNeun} 정해진 매뉴얼이나 부모의 고유한 방식만을 무조건 강요하는 통제 톤은 줄이시는 것이 좋아요.`,
    );
  } else if (analytical >= 60 || sealCount >= 2) {
    pushForward = pick(
      locale,
      `Protect real time for ${cName} to dig into the "why" and understand the underlying principle.`,
      `${cIGa} '왜 그런지' 깊이 생각하고 원리를 파악할 수 있는 탐구 시간을 든든히 지켜주세요.`,
    );
    scaffold = pick(
      locale,
      `When ${cName} hesitates to act because they're overthinking, gently give them the nudge to take a light first step.`,
      `${cIGa} 복잡한 생각이 많아 행동으로 옮기기 망설일 때 가볍게 첫 걸음을 뗄 수 있도록 부드럽게 용기를 주세요.`,
    );
    lessOf = pick(
      locale,
      `It helps to let go of pushing ${cName} for an immediate answer or action before they've had time to understand.`,
      `${cEunNeun} 이해할 시간 없이 당장 즉각적인 답이나 이행을 촉구하는 성급한 조급함은 내려놓으셔도 돼요.`,
    );
  } else if (recognition >= 60 || officerCount >= 2) {
    pushForward = pick(
      locale,
      `Give ${cName} a clearly defined role where they can feel real, earned pride in front of family or a bigger stage.`,
      `${cIGa} 무대나 가족 앞에서 정당한 인정과 자부심을 느낄 수 있는 분명한 역할을 정해 맡겨주세요.`,
    );
    scaffold = pick(
      locale,
      `When ${cName} makes a mistake, separate the outcome from who they are as a person clearly, and reassure them so their pride stays intact.`,
      `${cIGa} 실수했을 때 자존심이 상하지 않도록 결과와 인격을 철저히 분리하여 안심시켜주는 공감이 필요해요.`,
    );
    lessOf = pick(
      locale,
      `It's much better to ease off on comparisons to other kids or an outcome-focused tone that piles on pressure with ${cName}.`,
      `${cEunNeun} 타인과의 비교나 성과 중심의 과도한 중압감을 주는 기대 톤은 덜 건드리시는 것이 훨씬 좋습니다.`,
    );
  }

  return {
    motivation: {
      driveTitle,
      driveDesc,
      primaryMotivator,
    },
    learning: {
      oneLineStudyType,
      focusEnvironment,
      understandingStyle,
      planningStyle,
      socialMode,
    },
    motivationAndExpectation: {
      praiseGuidanceTitle,
      praiseGuidanceDesc,
      expectationTitle,
      expectationDesc,
    },
    challenge: {
      challengeTitle,
      challengeDesc,
      resiliencePattern,
    },
    socialOperating: {
      socialOperatingTitle,
      socialOperatingDesc,
      recommendedActivities,
    },
    environmentFit: {
      envConditions,
      envSummary,
    },
    potentialPace: {
      potentialTitle,
      potentialDesc,
    },
    yearlyGrowth,
    parentGuidance: {
      pushForward,
      scaffold,
      lessOf,
    },
  };
}
