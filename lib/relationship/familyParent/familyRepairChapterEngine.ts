/**
 * Family Premium Part 07: Family Recovery Intelligence Engine
 *
 * Core responsibility:
 * Dynamically synthesizes pair recovery rhythms, timing analysis, repair prerequisites,
 * effective vs harmful repair patterns, high-value recovery switches, pair anti-patterns,
 * and chapter synthesis principles from actual parent & child psychology, CE, and Part 05 conflict evidence.
 *
 * ABSOLUTE RULES:
 * 1. Absolute anti-hardcoding: Dynamically computed from child's and parent's actual CE/chart,
 *    Primary 6, Secondary 11, Child DNA, and Part 05 conflict loop evidence.
 * 2. NO invented precise clock times (e.g., "3시간", "30분"). Use calibrated natural Korean time phrases.
 * 3. ZERO raw Saju technical terms (천간, 지지, 십성, 일간, 신살, etc.) in user-facing Korean.
 * 4. Proper Korean particle handling (josaEunNeun, josaIGa, josaGwaWa, josaEulReul, josaE).
 */

import type { Locale } from "@/lib/i18n/locale";
import type { FamilyRepairChapterBundle, FamilyConflictLoopV2 } from "./familyStoryPlanTypes";
import { josaEunNeun, josaIGa, josaGwaWa, josaEulReul, josaE } from "./familyParentLanguage";
import { pick } from "./familyParentCopy";

export type BuildFamilyRepairChapterParams = {
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

  /** Saju Ten-God Counts */
  countsChild?: {
    food?: number;
    seal?: number;
    wealth?: number;
    officer?: number;
    self?: number;
  } | null;

  countsParent?: {
    food?: number;
    seal?: number;
    wealth?: number;
    officer?: number;
    self?: number;
  } | null;

  /** Part 05 Conflict Loop Evidence (the same conflictChapterBundle.conflictLoop Ch05 renders) */
  conflictLoop?: FamilyConflictLoopV2 | null;
};

export function buildFamilyRepairChapterBundle(
  params: BuildFamilyRepairChapterParams
): FamilyRepairChapterBundle {
  const {
    childNickname,
    parentNickname,
    locale = "ko-KR",
    psychChild,
    psychParent,
    countsChild,
    countsParent,
    conflictLoop,
  } = params;

  const cName = childNickname || "아이";
  const pName = parentNickname || "부모";

  const cEunNeun = josaEunNeun(cName);
  const cIGa = josaIGa(cName);
  const cGwaWa = josaGwaWa(cName);
  const cEulReul = josaEulReul(cName);
  const cE = josaE(cName);

  const pEunNeun = josaEunNeun(pName);
  const pIGa = josaIGa(pName);
  const pGwaWa = josaGwaWa(pName);
  const pEulReul = josaEulReul(pName);
  const pGwa = josaGwaWa(pName);

  // Extract Child Axes
  const secC = psychChild?.secondaryAxes || {};
  const primC = psychChild?.primaryAxes || {};

  const resilienceC = secC.resilience ?? 50;
  const selfControlC = secC.self_control ?? primC.structure ?? 50;
  const autonomyC = secC.autonomy ?? primC.autonomy ?? 50;
  const recognitionC = secC.recognition ?? 50;
  const analyticalC = secC.analytical_thinking ?? 50;
  const extEnergyC = secC.external_energy ?? primC.connection ?? 50;
  const stimulationC = secC.stimulation ?? primC.growth ?? 50;
  const stabilityC = secC.stability_orientation ?? primC.stability ?? 50;

  // Extract Parent Axes
  const secP = psychParent?.secondaryAxes || {};
  const primP = psychParent?.primaryAxes || {};

  const selfControlP = secP.self_control ?? primP.structure ?? 50;
  const structureP = secP.structure ?? primP.structure ?? 50;
  const analyticalP = secP.analytical_thinking ?? 50;
  const recognitionP = secP.recognition ?? 50;
  const stabilityP = secP.stability_orientation ?? primP.stability ?? 50;
  const extEnergyP = secP.external_energy ?? primP.connection ?? 50;

  // Ten-God Counts
  const foodCountC = countsChild?.food ?? 0;
  const sealCountC = countsChild?.seal ?? 0;
  const wealthCountC = countsChild?.wealth ?? 0;
  const officerCountC = countsChild?.officer ?? 0;
  const selfCountC = countsChild?.self ?? 0;

  const foodCountP = countsParent?.food ?? 0;
  const sealCountP = countsParent?.seal ?? 0;
  const wealthCountP = countsParent?.wealth ?? 0;
  const officerCountP = countsParent?.officer ?? 0;
  const selfCountP = countsParent?.self ?? 0;

  // -------------------------------------------------------------------
  // Section 01: ◤ 01. 감정이 올라온 뒤 각자는 어떻게 풀릴까요 (Recovery Rhythms)
  // -------------------------------------------------------------------
  let parentHeadline = `${pEunNeun} 관계의 안정성을 확인하고 당일 안으로 상황을 정돈할 때 마음이 편안해져요.`;
  let parentDesc = `${pIGa} 감정이 상했을 때 길게 냉전을 끌기보다는 빠른 확인과 매끄러운 수습을 선호합니다. 아이의 반응이 늦어지면 무시당한다는 느낌을 받기 쉬우므로, 작은 안심 신호를 주고받는 것이 중요합니다.`;

  if (analyticalP >= 60 || sealCountP >= 2) {
    parentHeadline = `${pEunNeun} 왜 문제가 생겼는지 원인을 이해하고 나야 비로소 서운함이 가라앉아요.`;
    parentDesc = `${pIGa} 단순히 "죄송해요"라는 말보다는 아까 있었던 일의 이유와 맥락을 파악할 때 이성적 평정을 되찾습니다. 본래는 바로 확인하고 싶지만, 감정이 높을 때 한 번 멈추고 관조하려는 성향도 함께 작용합니다.`;
  } else if (structureP >= 60 || officerCountP >= 2) {
    parentHeadline = `${pEunNeun} 정해진 규칙과 역할이 재확인될 때 마음의 질서가 복원돼요.`;
    parentDesc = `${pIGa} 감정적인 섣부른 타협보다 원칙이 유지되고 있다는 확신이 생길 때 마음을 엽니다.`;
  }

  let childHeadline = `${cEunNeun} 감정이 가라앉는 동안 혼자 생각할 조용한 안전지대가 필요해요.`;
  let childDesc = `${cIGa} 갈등 직후에는 뇌 과부하가 생겨 즉각적인 답을 내기 어려워요. 억지로 대화를 강요받지 않고 스스로 마음을 누그러뜨릴 시공간을 확보할 때 가장 안전하게 회복합니다.`;

  if (foodCountC >= 2 || (stimulationC >= 60 && extEnergyC >= 55)) {
    childHeadline = `${cEunNeun} 무거운 분위기를 가볍게 바꾸는 환경 전환이 있을 때 빠르게 기분이 리셋돼요.`;
    childDesc = `${cIGa} 뒤끝이 길지 않은 편이라, 진지하고 무거운 설교보다는 좋아하는 활동이나 음식을 건네받을 때 자연스럽게 감정의 앙금이 털어집니다.`;
  } else if (selfCountC >= 2 || autonomyC >= 65) {
    childHeadline = `${cEunNeun} 자신의 자존심과 주도성이 존중받았다고 느낄 때 마음의 경계 태세가 풀려요.`;
    childDesc = `${cIGa} 부모의 일방적인 지시나 잘잘못 추궁 앞에서는 방어벽을 단단히 세우지만, 아이의 선택권을 인정해주는 태도에는 빠르게 부드러워집니다.`;
  } else if (officerCountC >= 2 || selfControlC >= 60) {
    childHeadline = `${cEunNeun} 무엇이 문제였고 앞으로 어떻게 할지 구체적인 대안을 들을 때 앙금이 정리돼요.`;
    childDesc = `${cIGa} 막연한 감정 호소보다 명확한 사실 확인과 향후 규칙에 대해 서로 합의가 이루어질 때 비로소 마음이 안정됩니다.`;
  }

  // -------------------------------------------------------------------
  // Section 02: ◤ 02. 언제 다시 말을 거는 게 좋을까요 (Timing Analysis)
  // -------------------------------------------------------------------
  let timingHeadline = "즉각적인 본론 해결보다 감정이 가라앉은 뒤 짧은 안심 신호부터 건네는 타이밍";
  let timingDesc = `${pEunNeun} 바로 대화를 이어가고 싶고 ${cEunNeun} 충분히 가라앉을 시간이 필요한 구도예요. 바로 본론으로 들어가기보다 "생각 정리되면 천천히 얘기하자"는 짧은 안심 신호만 먼저 건네고 시간을 보장해주는 흐름이 가장 좋습니다.`;
  let sequencingRule = "짧은 온기 신호 건네기 → 생각 정리할 여유 보장 → 감정 수용 → 필요시 이성적 대안 정돈";

  if (sealCountC >= 2 || analyticalC >= 60) {
    timingHeadline = "당일 안에서 충분히 정리할 시간을 준 뒤 다가가는 점진적 타이밍";
    timingDesc = `${cEunNeun} 뇌 과부하 상태에서 즉시 말을 걸면 방어적으로 닫힐 수 있어요. 당일 안에서 스스로 마음이 가라앉았음을 표정이나 일상 행동으로 보일 때 가볍게 말 걸어주는 순서가 자연스럽습니다.`;
    sequencingRule = "독립 시공간 보장 → 표정 완화 확인 → 가벼운 일상 대화로 문 열기 → 본론 공유";
  } else if (foodCountC >= 2 || stimulationC >= 60) {
    timingHeadline = "무거운 분위기가 길어지기 전 당일 안에서 가볍게 기분을 전환하는 타이밍";
    timingDesc = `${cEunNeun} 장시간 냉전을 이어가면 오히려 지치고 힘들어해요. 서두르지 않되, 당일 안에서 음료나 산책 등 분위기 전환을 시도하는 타이밍이 이상적입니다.`;
    sequencingRule = "짧은 쿨링 → 분위기 전환 시도 → 가벼운 미소와 안부 → 뒤끝 없는 마무리";
  }

  // -------------------------------------------------------------------
  // Section 03: ◤ 03. 다시 마음이 열리려면 무엇이 먼저 필요할까요 (Prerequisites)
  // -------------------------------------------------------------------
  let parentNeed = `${pEunNeun} 관계의 신뢰가 유지되고 있다는 안심 신호와 아이의 성의 있는 태도가 먼저 필요합니다.`;
  let childNeed = `${cEunNeun} 자신의 입장과 감정이 섣불리 평가당하지 않고 존중받는다는 확신이 먼저 필요합니다.`;
  let repairSequence = [
    "1단계: 관계가 안전하다는 짧은 안심 신호",
    "2단계: 아이가 감정을 누그러뜨릴 생각 정리 여유",
    "3단계: 잘잘못 추궁 없이 아이의 서운함 경청",
    "4단계: 향후 방식에 대한 짧은 합의와 일상 복귀",
  ];

  if (recognitionC >= 60 || selfCountC >= 2) {
    childNeed = `${cEunNeun} 자신의 자존심이 상하지 않도록 존재 가치와 시도 자체를 먼저 인정받는 분위기가 필요합니다.`;
    repairSequence = [
      "1단계: 존재 가치와 자존심 인정",
      "2단계: 억압 없는 경청",
      "3단계: 서로의 대안 제시",
      "4단계: 뒤끝 없는 온화한 마감",
    ];
  } else if (analyticalC >= 60 || officerCountC >= 2) {
    childNeed = `${cEunNeun} 무작정 억지 사과를 강요받기보다 아까 상황의 원인과 개연성이 수용되는 과정이 필요합니다.`;
    repairSequence = [
      "1단계: 원인과 입장에 대한 이성적 경청",
      "2단계: 사실 인정 및 명확한 개선 약속",
      "3단계: 일상 루틴으로의 자연스러운 복귀",
    ];
  }

  // -------------------------------------------------------------------
  // Section 04: ◤ 04. 잘 풀리는 화해 / 다시 꼬이는 화해 (Do & Don't Repair)
  // -------------------------------------------------------------------
  let effectiveTitle = "과정에서의 서운함을 먼저 인정하고 뒤끝 없이 가벼운 톤으로 연결하기";
  let effectiveReason = `${cEunNeun} 잘잘못의 잣대로 판단당하지 않는다고 느낄 때 방어 태세를 풀고 빠르게 마음을 엽니다.`;
  let harmfulTitle = "누가 옳고 틀렸는지 즉시 논리적으로 분석하고 인정받으려 하는 훈계조 재개";
  let harmfulReason = `${pEunNeun} 성급한 확인 요구와 ${cName}의 감정 닫힘이 맞물려 Part 05의 갈등 증폭 루프가 그대로 재발합니다.`;

  if (autonomyC >= 60 || foodCountC >= 2) {
    effectiveTitle = "진지한 사과보다 환경을 바꾸고 좋아하는 기분 전환을 함께 건네기";
    effectiveReason = `무거운 설교 대신 기분을 바꿔줄 때 아이가 감정의 고집을 빠르게 내려놓기 때문입니다.`;
    harmfulTitle = "방으로 따라 들어가서 정색하고 긴 시간을 할애해 설교 이어가기";
    harmfulReason = `아이에게 심각한 중압감과 조급함을 유발해 Part 05의 갈등 증폭 루프가 그대로 재발합니다.`;
  }

  if (conflictLoop?.step1ParentTrigger && conflictLoop?.step2ChildReaction) {
    harmfulReason += ` [${conflictLoop.step1ParentTrigger} → ${conflictLoop.step2ChildReaction} 갈등 증폭 루프]`;
  }

  // -------------------------------------------------------------------
  // Section 05: ◤ 05. 이 관계에 잘 맞는 회복 스위치 (Recovery Switches)
  // -------------------------------------------------------------------
  const recoverySwitches: FamilyRepairChapterBundle["recoverySwitches"] = [];

  if (foodCountC >= 2 || stimulationC >= 60) {
    recoverySwitches.push({
      title: "장소 바꾸기와 기분 전환",
      desc: "집안의 답답한 공간에서 나와 잠시 함께 걸으며 시각적 자극을 바꿔줄 때 감정이 빠르게 리셋됩니다.",
      speechTip: `${pName}가 "${cName}야, 우리 둘 다 꿀꿀한데 잠깐 산책 다녀올까?"라고 먼저 제안해보세요.`,
    });
    recoverySwitches.push({
      title: "좋아하는 간식 및 음료 건네기",
      desc: "말없는 긴 설교보다 아이가 좋아하는 음료나 간식을 챙겨주는 따뜻한 챙김 행동이 최고의 스위치입니다.",
      speechTip: `말없이 책상 위에 음료를 두고 가볍게 어깨를 다독여주는 행동이 진지한 복기보다 빠르게 마음을 엽니다.`,
    });
  } else if (sealCountC >= 2 || analyticalC >= 60) {
    recoverySwitches.push({
      title: "부담 없는 문자·메모로 안심 신호 건네기",
      desc: "얼굴을 대면하고 즉각 대답을 요구하는 대신, 문자로 안심 신호를 전달하면 아이의 과부하가 멈춥니다.",
      speechTip: `"${cName}야, 아까 속상했던 마음 이해해. 생각 정리되면 편하게 얘기하자."라고 메시지를 남겨두세요.`,
    });
    recoverySwitches.push({
      title: "스스로 다가올 동굴 시간 보장",
      desc: "성급하게 방문을 두드리지 않고 스스로 정리하고 밖으로 나올 때까지 온화하게 기다려주는 것이 최고의 조력입니다.",
    });
  } else {
    recoverySwitches.push({
      title: "존재 인정과 따뜻한 톤 복귀",
      desc: "아이의 자존심을 긁지 않고, 잘잘못 이전에 아이가 소중한 존재임을 먼저 확인시켜주는 스위치입니다.",
      speechTip: `"${cName}야, 아까 내가 목소리가 조금 컸네. 네 마음 상하게 하려던 건 아니었어."라고 건네보세요.`,
    });
    recoverySwitches.push({
      title: "평소 일상 톤으로 부드럽게 말 걸기",
      desc: "쿨링 시간 경과 후 정색을 풀고 저녁 식사나 일상 주제로 평소처럼 다가가는 방식입니다.",
    });
  }

  // -------------------------------------------------------------------
  // Section 06: ◤ 06. 이럴 때는 오히려 역효과예요 (Anti-Patterns)
  // -------------------------------------------------------------------
  const antiPatterns: FamilyRepairChapterBundle["antiPatterns"] = [];

  antiPatterns.push({
    title: "즉각적인 답과 사과를 촉구하는 성급함",
    whyItFails: `아이가 이미 감정적으로 과부하를 겪는 상태에서는 설명의 길이가 늘어날수록 "내 입장은 전혀 중요하지 않다"는 거부감을 키울 수 있어요.`,
  });

  antiPatterns.push({
    title: "기분 풀어주려다가 '아직도 화났어?'라며 다그치기",
    whyItFails: `아이가 스스로 마음을 가라앉히는 과정에서 조급하게 반응을 확인하려 들면, 다시 갈등 증폭 루프가 재발합니다.`,
  });

  if (autonomyC >= 60 || selfCountC >= 2) {
    antiPatterns.push({
      title: "타인이나 형제와의 비교를 섞은 지적",
      whyItFails: `아이가 자존심에 깊은 상처를 입고 대화 자체를 거부하게 만듭니다.`,
    });
  }

  // -------------------------------------------------------------------
  // Section 07: ◤ 07. 다음번에는 조금 덜 오래 끌기 위해 (Synthesis Principle)
  // -------------------------------------------------------------------
  const corePrinciple = `관계 안전을 먼저 확인하고, 설명은 감정이 충분히 내려간 뒤에.`;
  const summaryDesc = `${pGwa} ${cName} 사이의 회복은 상대를 바adamente 설득하는 데 있지 않고, 감정 쿨링의 차이를 인정하고 안심 신호를 먼저 나누는 데에 있습니다. 앙금 없이 가볍게 넘겨줄 때 두 사람의 신뢰 그릇이 더욱 단단해집니다.`;

  return {
    recoveryRhythms: {
      parentHeadline,
      parentDesc,
      childHeadline,
      childDesc,
    },
    timingAnalysis: {
      timingHeadline,
      timingDesc,
      sequencingRule,
    },
    prerequisites: {
      parentNeed,
      childNeed,
      repairSequence,
    },
    doAndDontRepair: {
      effectiveTitle,
      effectiveReason,
      harmfulTitle,
      harmfulReason,
    },
    recoverySwitches,
    antiPatterns,
    synthesisPrinciple: {
      corePrinciple,
      summaryDesc,
    },
  };
}
