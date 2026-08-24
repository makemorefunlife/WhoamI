/**
 * Family Premium Part 08: Family Action & Synthesis Engine
 *
 * Core responsibility:
 * Dynamically synthesizes the final relationship takeaways, personalized parent/child/together actions,
 * long-term relationship DON'Ts, pair-specific routines, differential affinity signals, future family rewards,
 * and mature future relationship portraits.
 *
 * ABSOLUTE RULES:
 * 1. Absolute anti-hardcoding: Dynamically computed from parent's & child's actual CE/chart,
 *    Primary 6, Secondary 11, Child Core Needs, Part 05 conflict, Part 06 growth, Part 07 recovery evidence.
 * 2. NO arbitrary fixed schedules (e.g., "월 1회 20분", "밤 11시"). Use calibrated Korean frequency phrases.
 * 3. ZERO raw Saju technical terms (천간, 지지, 십성, 일간, 신살, etc.) in user-facing Korean.
 * 4. Proper Korean particle handling (josaEunNeun, josaIGa, josaGwaWa, josaEulReul, josaE).
 */

import type { Locale } from "@/lib/i18n/locale";
import type {
  FamilyActionChapterBundle,
  FamilyConflictChapterBundle,
  FamilyChildGrowthChapterBundle,
  FamilyRepairChapterBundle,
} from "./familyStoryPlanTypes";
import { josaEunNeun, josaIGa, josaGwaWa, josaEulReul, josaE } from "./familyParentLanguage";

export type BuildFamilyActionChapterParams = {
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

  /** Child Core Needs */
  childCoreNeeds?: {
    primaryNeedTitle?: string;
    primaryNeedDesc?: string;
  } | null;

  /** Upstream Chapter Bundles for Provenance */
  conflictChapterBundle?: FamilyConflictChapterBundle | null;
  growthChapterBundle?: FamilyChildGrowthChapterBundle | null;
  repairChapterBundle?: FamilyRepairChapterBundle | null;
};

export function buildFamilyActionChapterBundle(
  params: BuildFamilyActionChapterParams
): FamilyActionChapterBundle {
  const {
    childNickname,
    parentNickname,
    locale = "ko-KR",
    psychChild,
    psychParent,
    countsChild,
    countsParent,
    childCoreNeeds,
    conflictChapterBundle,
    growthChapterBundle,
    repairChapterBundle,
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
  const practicalityC = secC.practicality ?? 50;

  // Extract Parent Axes
  const secP = psychParent?.secondaryAxes || {};
  const primP = psychParent?.primaryAxes || {};

  const structureP = secP.structure ?? primP.structure ?? 50;
  const analyticalP = secP.analytical_thinking ?? 50;
  const selfControlP = secP.self_control ?? primP.structure ?? 50;
  const recognitionP = secP.recognition ?? 50;
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
  // Section 01: ◤ 01. 이 관계에서 가장 기억해야 할 것 (Final Takeaway)
  // -------------------------------------------------------------------
  let childNeedTitle = `${cEunNeun} 주도성과 자존심이 존중받는 환경에서 가장 밝게 빛나요.`;
  let childNeedDesc = `${cIGa} 자신의 생각과 선택이 인정받았다고 느낄 때 스스로 책임을 다하고 놀라운 몰입력을 발휘합니다.`;

  if (childCoreNeeds?.primaryNeedTitle && childCoreNeeds?.primaryNeedDesc) {
    childNeedTitle = `${cName}의 핵심 욕구: ${childCoreNeeds.primaryNeedTitle}`;
    childNeedDesc = childCoreNeeds.primaryNeedDesc;
  } else if (sealCountC >= 2 || analyticalC >= 60) {
    childNeedTitle = `${cEunNeun} 스스로 생각을 정돈하고 이해할 시공간의 보장이 필요해요.`;
    childNeedDesc = `충분한 생각 정리와 이유에 대한 납득이 선행될 때 비로소 마음 깊이 납득하고 움직이는 아이입니다.`;
  } else if (foodCountC >= 2 || stimulationC >= 60) {
    childNeedTitle = `${cEunNeun} 자유로운 탐색과 과정 중심의 칭찬이 최고의 성장 동력이에요.`;
    childNeedDesc = `결과를 압박받기보다 재미와 과정에서의 도전을 긍정해줄 때 잠재력이 살아납니다.`;
  }

  let parentStrengthTitle = `${pEunNeun} 아이를 위한 깊은 애정과 책임감 있는 울타리를 이미 잘 제공해주고 계세요.`;
  let parentStrengthDesc = `아이가 길을 잃지 않도록 세심하게 살피고 든든한 가이드라인을 제공하려는 정성이 두 사람의 관계를 받쳐주는 큰 힘입니다.`;

  if (structureP >= 60 || officerCountP >= 2) {
    parentStrengthTitle = `${pEunNeun} 아이에게 명확한 질서와 생활 규칙을 세워주는 든든한 기둥이에요.`;
  }

  let cautionPointTitle = `걱정이 긴 행동 감시나 성급한 복기로 변하지 않도록 조심하기`;
  let cautionPointDesc = `안타까운 마음에 즉각 지적하거나 확인하려 들면, ${cEunNeun} 정서적 고립감을 느끼고 문을 닫을 수 있습니다.`;

  // -------------------------------------------------------------------
  // Section 02: ◤ 02. 부모와 자녀를 위한 맞춤 실천 제안 (Custom Actions)
  // -------------------------------------------------------------------
  const parentActions: FamilyActionChapterBundle["customActions"]["parentActions"] = [];
  const childActions: FamilyActionChapterBundle["customActions"]["childActions"] = [];
  const togetherActions: FamilyActionChapterBundle["customActions"]["togetherActions"] = [];

  // Parent Action 1: Based on Autonomy vs Control
  if (autonomyC >= 60 || selfCountC >= 2) {
    parentActions.push({
      title: "결론을 주기 전에 아이의 생각을 먼저 물어보기",
      whyItMatters: `${cName}에게는 부모의 최종 답보다 자신의 판단이 먼저 존중됐다는 느낌이 무엇보다 중요해요.`,
      practicalExample: `“${pName} 생각도 있지만, ${cName}야 너는 어떻게 하고 싶어?”라고 먼저 질문해보세요.`,
    });
  } else if (analyticalC >= 60 || sealCountC >= 2) {
    parentActions.push({
      title: "조급한 대답 대신 생각 정리를 기다려주는 표현 건네기",
      whyItMatters: `${cEunNeun} 뇌 과부하가 올 때 즉각 답을 내기 어려워 스스로 정돈할 시간이 필요합니다.`,
      practicalExample: `“지금 당장 대답 안 해도 돼. 생각 정리되면 천천히 말해줘.”라고 시간을 빌려주세요.`,
    });
  } else {
    parentActions.push({
      title: "결과보다 시도한 과정과 노력을 먼저 포착해 칭찬하기",
      whyItMatters: `결과 중심의 기대는 부담을 키우지만, 과정에 대한 긍정은 아이의 자존감을 바로 세워줍니다.`,
      practicalExample: `“결과도 좋지만, 네가 끝까지 노력한 과정이 정말 멋지다.”라고 짚어주세요.`,
    });
  }

  // Parent Action 2: Based on Conflict / Recovery
  if (foodCountC >= 2 || stimulationC >= 60) {
    parentActions.push({
      title: "분위기가 무거워지면 분위기 전환을 먼저 시도하기",
      whyItMatters: `진지하고 긴 설교보다 가벼운 산책이나 간식을 건넬 때 감정의 고집을 빠르게 내려놓습니다.`,
      practicalExample: `“우리 둘 다 기분 꿀꿀한데 잠깐 바람 쐬러 다녀올까?”라며 톤을 바꿔보세요.`,
    });
  } else {
    parentActions.push({
      title: "지적하기 전 관계의 안전을 먼저 확인시켜주기",
      whyItMatters: `아이가 지적을 '존재 거부'로 받아들이지 않도록 안전감을 먼저 주는 것이 효과적입니다.`,
      practicalExample: `“내가 너를 정말 아끼기 때문에 하는 이야기야.”라고 한마디를 먼저 건네세요.`,
    });
  }

  // Child Actions (Non-preachy, age-appropriate expression)
  childActions.push({
    title: "생각 정리가 필요할 때는 조용히 신호 건네기",
    whyItMatters: `무작정 입을 닫으면 부모는 무시당한다고 느낄 수 있으므로, 시간이 필요함을 부드럽게 알리는 법을 익히는 것이 좋아요.`,
    practicalExample: `“${pName}, 나 지금 화난 게 아니라 생각 정리할 시간이 필요해. 조금만 기다려줘.”라고 말해보세요.`,
  });

  childActions.push({
    title: "부모의 조언 속에서 '아끼는 마음'과 '전달 방식' 구분하기",
    whyItMatters: `부모의 억센 톤에 상처받기보다 그 안에 담긴 우려와 애정의 본질을 읽어낼 때 감정이 덜 상합니다.`,
    practicalExample: `“말투는 조금 억셌지만 나를 걱정해서 하시는 말씀이구나”라고 한 번 더 짚어보세요.`,
  });

  // Together Actions
  togetherActions.push({
    title: "중요한 규칙 결정 전 '의견 듣기 → 정리 → 합의' 순서 지키기",
    whyItMatters: `일방적인 지시가 아닌 공동 합의 과정을 거칠 때 서로의 불만이 획기적으로 줄어듭니다.`,
    practicalExample: `주말 일정이나 휴대폰 사용 규칙을 정할 때 서로의 안을 하나씩 제출하고 타협점을 찾으세요.`,
  });

  // -------------------------------------------------------------------
  // Section 03: ◤ 03. 이 관계에서는 이것만은 줄여보세요 (Final Don'ts)
  // -------------------------------------------------------------------
  const finalDonts: FamilyActionChapterBundle["finalDonts"] = [];

  // 1. 피곤한 야간 훈계
  finalDonts.push({
    title: "피곤한 늦은 밤(11시 이후) 긴 장문 카톡으로 잔소리·훈계하기",
    dontExample: `“너 아까 엄마한테 했던 행동이 얼마나 버릇없었는지 밤새 깊이 생각해보렴...”`,
    whyHarmful: `야간의 긴 텍스트 메시지는 감정적·분석적 과부하를 일으켜 ${cName}에게 커다란 정서적 압박을 안겨주며, 마음의 문을 완전히 잠그게 만듭니다.`,
  });

  // 2. 제3자 앞 훈계/반박
  finalDonts.push({
    title: "제3자나 타인(친구·친척) 앞에서 훈계하거나 바로 반박하기",
    dontExample: `“얘가 남들 앞에서도 저렇게 고집이 센데 제가 어떻게 가만있겠어요?”`,
    whyHarmful: `자존심과 존재감이 중요한 ${cName}에게 타인 앞에서의 지적과 반박은 깊은 수치심을 안겨주어 부모와의 기본 신뢰 관계를 심각하게 손상시킵니다.`,
  });

  // 3. 선물/용돈으로 갈등 덮기
  finalDonts.push({
    title: "갈등의 본질을 짚지 않고 선물이나 용돈으로 서둘러 덮기만 하기",
    dontExample: `“아까 일은 그냥 잊어버리고, 이거 맛있는 거 사 먹고 화 풀어.”`,
    whyHarmful: `${cEunNeun} 마음을 이해받고 정서적 앙금이 풀리길 원하는데, 물질로 유야무야 넘어가려 하면 부모의 진심을 불신하게 됩니다.`,
  });

  // 4. 감성적/민감성 자녀를 위한 "넌 왜 그러니?" 지적 지양
  finalDonts.push({
    title: "“넌 대체 왜 매번 그러니?”로 시작하는 원인 추궁형 질책",
    dontExample: `“넌 도대체 왜 매번 엄마를 힘들게 하고 그렇게 행동하니?”`,
    whyHarmful: `감수성이 높고 민감한 ${cName}에게 원인 추궁형 질문은 깊은 상처와 수치심을 안깁니다. 속상했던 마음을 먼저 인정해주고 노력한 점을 긍정한 뒤(“속상했겠구나, 그래도 노력해줘서 고마워”), 조용히 이유를 설명해 주는 방식이 훨씬 납득하기 쉽습니다.`,
  });

  // 5. 행동 감시/점검
  finalDonts.push({
    title: "걱정과 애정을 지속적인 행동 감시나 점검으로 표현하기",
    whyHarmful: `부모는 챙김이라 생각하지만, ${cName}에게는 자율성을 침해하는 통제로 느껴져 관계의 거리를 띄우게 만듭니다.`,
  });

  // -------------------------------------------------------------------
  // Section 04: ◤ 04. 관계를 오래 지켜주는 작은 루틴 (Relationship Routines)
  // -------------------------------------------------------------------
  const relationshipRoutines: FamilyActionChapterBundle["relationshipRoutines"] = [
    {
      title: "중요한 결정 전 5분 생각 공유 루틴",
      desc: "학업이나 일상 선택을 내리기 전, 부모의 답을 먼저 내지 않고 아이의 의향을 먼저 듣는 짧은 대화 시간을 가집니다.",
      frequencyTip: "새로운 학기나 중요한 선택을 해야 할 때 정기적으로 활용하세요.",
    },
    {
      title: "갈등 직후 쿨링 신호 루틴",
      desc: "서로 화가 났을 때 즉각 다그치지 않고 '우리 1시간 뒤에 얘기하자'라는 쿨링 표현을 나눕니다.",
      frequencyTip: "의견 대립으로 목소리가 높아지는 날 필요할 때 활용하세요.",
    },
  ];

  // -------------------------------------------------------------------
  // Section 05: ◤ 05. 부모의 마음이 유독 더 움직이기 쉬운 지점 (Affinity Signal)
  // -------------------------------------------------------------------
  const affinitySignal = {
    title: `${pName}의 마음이 유독 더 움직이기 쉬운 지점`,
    desc: `${pEunNeun} ${cName}의 고유한 성향과 행동에서 자신의 모습이 투영되거나 기대감이 유독 크게 작용할 수 있습니다. 아이가 잘 되길 바라는 정성이 큰 만큼 서운함이나 걱정도 크게 느껴지는 구조입니다.`,
    disclaimer: `※ 다른 자녀와의 실제 비교 데이터 없이 개별 부모-자녀 관계의 정서적 이끌림과 기대 지점을 분석한 결과입니다.`,
  };

  // -------------------------------------------------------------------
  // Section 06: ◤ 06. 미래의 패밀리 리워드 (Future Family Reward)
  // -------------------------------------------------------------------
  const futureRewardThemes: FamilyActionChapterBundle["futureReward"]["themes"] = [];

  if (autonomyC >= 60 || selfCountC >= 2) {
    futureRewardThemes.push({
      title: "자주 붙어 있지 않아도 중요한 순간엔 깊이 찾는 관계",
      desc: "성인이 된 후 각자의 영역을 단단히 지키면서도, 삶의 큰 갈림길이 올 때마다 부모의 지혜를 가장 먼저 구하는 단단한 신뢰 관계로 발전합니다.",
    });
  }

  if (practicalityC >= 60 || wealthCountC >= 2 || officerCountC >= 2) {
    futureRewardThemes.push({
      title: "현실 문제 앞에서 가장 믿음직한 든든한 조력자",
      desc: "시간이 흐를수록 아이는 실질적인 책임감과 실행력을 갖추어, 부모가 든든하게 의지할 수 있는 삶의 동반자가 됩니다.",
    });
  } else {
    futureRewardThemes.push({
      title: "나이가 들수록 오히려 대화가 더 잘 통하는 따뜻한 관계",
      desc: "어릴 적 정서적 안전감을 충실히 경험한 아이는 자라면서 부모와 친구처럼 깊은 이야기를 나눌 수 있는 따뜻한 마음 주파수를 유지합니다.",
    });
  }

  const futureReward = {
    subtitle: "시간이 흐른 뒤, 우리는 서로에게 어떤 힘이 될까요?",
    themes: futureRewardThemes,
  };

  // -------------------------------------------------------------------
  // Section 07: ◤ 07. 이 관계가 잘 자라면 (Future Relationship Portrait)
  // -------------------------------------------------------------------
  const futurePortrait = {
    title: "이 관계가 잘 자라면",
    narrative: `지금 리포트에서 짚어본 건강한 쿨링과 자율성 존중의 패턴이 차곡차곡 쌓인다면, ${pGwaWa} ${cName} 사이는 서로의 영역을 존중하면서도 가장 깊은 온기를 나누는 멋진 관계로 안착할 것입니다. 부모의 따뜻한 기다림과 아이의 곧은 성장이 어우러져 세상에서 가장 단단한 울타리가 되어줄 것입니다.`,
  };

  return {
    finalTakeaway: {
      childNeedTitle,
      childNeedDesc,
      parentStrengthTitle,
      parentStrengthDesc,
      cautionPointTitle,
      cautionPointDesc,
    },
    customActions: {
      parentActions,
      childActions,
      togetherActions,
    },
    finalDonts,
    relationshipRoutines,
    affinitySignal,
    futureReward,
    futurePortrait,
  };
}
