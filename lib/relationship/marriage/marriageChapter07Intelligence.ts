import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { TenGodCounts } from "./marriageTenGodAnalysis";
import { profileTenGods } from "./marriageTenGodAnalysis";
import type { Locale } from "@/lib/i18n/locale";

/**
 * Marriage VNext Chapter 07 Canonical Intelligence Engine
 * "왜 싸우고, 어떻게 다시 가까워지는가?"
 */

export type PersonConflictJourney = {
  personName: string;
  baseline: string; // 평소
  activation: string; // 서운함이 생기면
  overload: string; // 더 쌓이면
  outerGap?: string; // 겉으로는 이렇게 보여도 (optional)
  innerNeed: string; // 사실 원하는 것
};

export type PersonHurtPoint = {
  personName: string;
  headline: string;
  description: string;
};

export type PersonRepairGuide = {
  personName: string;
  firstNeed: string;
  nextNeed: string;
  howToApproach: string;
};

export type ExpectationReleaseItem = {
  fromName: string;
  toName: string;
  headline: string;
  description: string;
};

export type RelationshipProtectionItem = {
  headline: string;
  description: string;
};

export type DirectionalActionBlock = {
  actorName: string;
  targetName: string;
  dos: string[];
  donts: string[];
};

export type SharedActionBlock = {
  dos: string[];
  donts: string[];
};

export type MarriageChapter07Intelligence = {
  introNarrative: string;
  section01_journey: {
    personA: PersonConflictJourney;
    personB: PersonConflictJourney;
  };
  section02_conflictLoop: {
    headline: string;
    personAStep: { name: string; flow: string };
    personBStep: { name: string; flow: string };
    summary: string;
  };
  section03_hurtPoint: {
    personA: PersonHurtPoint;
    personB: PersonHurtPoint;
    summary: string;
  };
  section04_repair: {
    personA: PersonRepairGuide;
    personB: PersonRepairGuide;
    summary: string;
  };
  section05_expectationsToRelease: {
    expectationAtoB: ExpectationReleaseItem;
    expectationBtoA: ExpectationReleaseItem;
  };
  section06_relationshipProtection: {
    protectiveAsset: RelationshipProtectionItem;
    roleToRebalance: RelationshipProtectionItem;
    privacyBoundary: RelationshipProtectionItem;
  };
  section07_directionalActions: {
    actionAtoB: DirectionalActionBlock;
    actionBtoA: DirectionalActionBlock;
    sharedActions?: SharedActionBlock;
  };
};

/** Internal evidence profile derived per person */
type PersonConflictProfile = {
  name: string;
  conflictStyle: number; // Psych conflict_style (0-100)
  selfControl: number; // Psych self_control (0-100)
  resilience: number; // Psych resilience (0-100)
  thinkingStyle: number; // Psych thinking_style (0-100)
  empathy: number; // Psych empathy (0-100)
  tenGods: {
    self: number; // 비겁
    food: number; // 식상
    wealth: number; // 재성
    officer: number; // 관성
    seal: number; // 인성
  };
  isDirectExpressed: boolean;
  isAvoidantExpressed: boolean;
  hasInnateExpressionDrive: boolean; // 식상 >= 2
  hasInnateInwardDrive: boolean; // 인성 >= 2
  hasInnateStructureDrive: boolean; // 관성 >= 2
  hasInnatePrideDrive: boolean; // 비겁 >= 2
};

function buildPersonProfile(
  name: string,
  psych: PsychMasterJson | null | undefined,
  counts: TenGodCounts,
): PersonConflictProfile {
  const axes = psych?.secondary_axes ?? {};
  const conflictStyle = axes.conflict_style ?? 50;
  const selfControl = axes.self_control ?? 50;
  const resilience = axes.resilience ?? 50;
  const thinkingStyle = axes.thinking_style ?? 50;
  const empathy = axes.empathy ?? 50;

  const p = profileTenGods(counts);
  const tenGods = {
    self: p.self,
    food: p.food,
    wealth: p.wealth,
    officer: p.officer,
    seal: p.seal,
  };

  const isDirectExpressed = conflictStyle >= 55;
  const isAvoidantExpressed = conflictStyle < 45;

  return {
    name,
    conflictStyle,
    selfControl,
    resilience,
    thinkingStyle,
    empathy,
    tenGods,
    isDirectExpressed,
    isAvoidantExpressed,
    hasInnateExpressionDrive: p.food >= 2,
    hasInnateInwardDrive: p.seal >= 2,
    hasInnateStructureDrive: p.officer >= 2,
    hasInnatePrideDrive: p.self >= 2,
  };
}

export function buildMarriageChapter07Intelligence(params: {
  nameA: string;
  nameB: string;
  psychA?: PsychMasterJson | null;
  psychB?: PsychMasterJson | null;
  countsA: TenGodCounts;
  countsB: TenGodCounts;
  locale?: Locale;
}): MarriageChapter07Intelligence {
  const { nameA, nameB, psychA, psychB, countsA, countsB } = params;

  const profA = buildPersonProfile(nameA, psychA, countsA);
  const profB = buildPersonProfile(nameB, psychB, countsB);

  // --- 01. Person Conflict Journey Builder ---
  const buildPersonConflictJourney = (
    prof: PersonConflictProfile,
    otherProf: PersonConflictProfile,
    isPersonA: boolean,
  ): PersonConflictJourney => {
    const scoreSelf =
      prof.conflictStyle * 0.4 +
      prof.thinkingStyle * 0.3 +
      prof.tenGods.officer * 15 +
      prof.tenGods.food * 10;
    const scoreOther =
      otherProf.conflictStyle * 0.4 +
      otherProf.thinkingStyle * 0.3 +
      otherProf.tenGods.officer * 15 +
      otherProf.tenGods.food * 10;

    const isDirect =
      scoreSelf > scoreOther ||
      (scoreSelf === scoreOther && isPersonA);

    // 1. 평소 (Baseline)
    const baseline = isDirect
      ? "일상에서는 기준과 역할을 분명히 하며 대화하려는 편"
      : "평소 생각과 감정을 솔직하고 다정하게 나누는 편";

    // 2. 서운함이 생기면 (Activation / Initial Signal)
    const activation = isDirect
      ? "서운함이 생기면 말조가 다소 단정해지며 명확한 이유나 설명부터 요구함"
      : "의견 차이가 생기면 말수를 줄이고 한 걸음 물러나 관망함";

    // 3. 더 쌓이면 (Overload / Escalated Behavior)
    const overload = isDirect
      ? prof.thinkingStyle >= 55 || prof.tenGods.officer >= 1
        ? "감정이 올라오면 논리와 전후 관계를 따지며 즉각적인 시정 답을 재촉함"
        : "서운함이나 답답함이 쌓이면 직설적인 말로 표현을 터뜨리기 쉬움"
      : "감정이 과부하되면 방 문을 닫고 조용한 동굴 침묵 모드로 들어감";

    // 4. 겉으로는 이렇게 보여도 (Outer/Inner Gap - Optional)
    const outerGap = isDirect
      ? "겉으로는 차갑게 잘잘못을 따지는 듯해도 실제로는 분명한 관계 규칙과 안전을 원하는 것"
      : "겉으로는 무관심하게 입을 닫는 듯해도 실제로는 대화를 끊으려는 게 아니라 생각 정돈이 필요한 것";

    // 5. 사실 원하는 것 (Inner Need / Core Repair Signal)
    const innerNeed = isDirect
      ? "갈등 원인에 대한 분명한 인정과 앞으로의 현실적 재발 방지 약속"
      : "자신의 수고에 대한 인정과 마음이 차분해질 때까지 억지로 대화를 강요당하지 않을 시간";

    return {
      personName: prof.name,
      baseline,
      activation,
      overload,
      outerGap,
      innerNeed,
    };
  };

  const journeyA = buildPersonConflictJourney(profA, profB, true);
  const journeyB = buildPersonConflictJourney(profB, profA, false);

  const scoreA = profA.conflictStyle * 0.4 + profA.thinkingStyle * 0.3 + profA.tenGods.officer * 15 + profA.tenGods.food * 10;
  const scoreB = profB.conflictStyle * 0.4 + profB.thinkingStyle * 0.3 + profB.tenGods.officer * 15 + profB.tenGods.food * 10;

  const isADirect = scoreA >= scoreB;
  const isBAvoidant = scoreB < scoreA;

  // --- 02. Conflict Loop ---
  let loopHeadline: string;
  let flowA: string;
  let flowB: string;
  let loopSummary: string;

  if (isADirect && isBAvoidant) {
    loopHeadline = "빠른 확인 요구 × 생각할 시간의 필요";
    flowA = "불편함 발생 ➔ 답변 확인 시도 ➔ 답이 없으면 대화 재촉";
    flowB = "부담 감지 ➔ 생각 정리를 위해 입을 닫음 ➔ 동굴 침묵";
    loopSummary = `${nameA}님이 확인을 서두를수록 ${nameB}님은 생각할 시간이 부족해 침묵하고, 그 침묵이 다시 ${nameA}님을 불안하게 만드는 흐름입니다.`;
  } else if (!isADirect && !isBAvoidant) {
    loopHeadline = "빠른 확인 요구 × 생각할 시간의 필요";
    flowA = "부담 감지 ➔ 생각 정리를 위해 입을 닫음 ➔ 동굴 침묵";
    flowB = "불편함 발생 ➔ 답변 확인 시도 ➔ 답이 없으면 대화 재촉";
    loopSummary = `${nameB}님이 확인을 서두를수록 ${nameA}님은 생각할 시간이 부족해 침묵하고, 그 침묵이 다시 ${nameB}님을 불안하게 만드는 흐름입니다.`;
  } else {
    loopHeadline = "완만한 의견 조정 × 상황별 유연 반응";
    flowA = "불편함 발생 ➔ 대화 시도 ➔ 상대 반응 확인";
    flowB = "불편함 발생 ➔ 들어주기 ➔ 현실적 대안 탐색";
    loopSummary = "특정 한 쪽으로 치우치지 않고 상황에 따라 대화와 조율을 시도하는 안정적인 조율 루프입니다.";
  }

  // --- 03. Hurt Point (Multi-candidate Scored Deduplication) ---
  type HurtCandidate = {
    id: string;
    score: number;
    headline: string;
    description: string;
  };

  const getHurtCandidates = (prof: PersonConflictProfile): HurtCandidate[] => [
    {
      id: "PRIDE_RECOGNITION",
      score: prof.tenGods.self * 30 + (100 - prof.resilience) * 0.5 + (prof.hasInnatePrideDrive ? 40 : 0),
      headline: "내 존재와 노력이 무시당했다고 느낄 때",
      description: "가정과 일상에서 쏟은 수고를 당연하게 여겨지거나 상대방에게 지적받을 때 마음의 문을 가장 닫게 됩니다.",
    },
    {
      id: "STRUCTURE_RULES",
      score: prof.tenGods.officer * 30 + prof.thinkingStyle * 0.5 + (prof.hasInnateStructureDrive ? 40 : 0),
      headline: "말과 약속의 기준이 일관되지 않을 때",
      description: "정해진 가사/재정 원칙이 모호해지거나, 대화의 맥락이 무시된 채 감정적으로 쏘아붙여질 때 깊은 서운함을 느낍니다.",
    },
    {
      id: "PRESSURE_TIMEOUT",
      score: (100 - prof.conflictStyle) * 0.6 + prof.tenGods.seal * 25 + (prof.isAvoidantExpressed ? 40 : 0),
      headline: "생각할 틈 없이 즉각 답이나 사과를 강요받을 때",
      description: "마음이 정돈되지 않은 상태에서 대화를 계속 몰아붙여지면 숨이 턱 막히고 방어적으로 변하게 됩니다.",
    },
    {
      id: "PROCESS_EMPATHY",
      score: prof.tenGods.food * 30 + prof.empathy * 0.5 + (prof.hasInnateExpressionDrive ? 30 : 0),
      headline: "내 감정 상태나 힘듦을 전혀 알아주지 않을 때",
      description: "결과만 두고 잘잘못을 따지고, 그 과정에서 겪었던 내 마음과 고충을 건너뛸 때 깊은 실망감을 느낍니다.",
    },
    {
      id: "COLD_DISCONNECT",
      score: prof.conflictStyle * 0.4 + (100 - prof.selfControl) * 0.4 + 20,
      headline: "싸움 후 냉랭한 무관심과 차단이 오래 이어질 때",
      description: "갈등의 내용 자체보다 대화가 끊기고 정서적 접속이 차단된 상태가 길어지는 것에 가장 크게 상처받습니다.",
    },
  ];

  const candA = getHurtCandidates(profA).sort((a, b) => b.score - a.score);
  const candB = getHurtCandidates(profB).sort((a, b) => b.score - a.score);

  const bestA = candA[0]!;
  const bestB = candB[0]!.id === bestA.id ? (candB[1] ?? candB[0]!) : candB[0]!;

  const hurtA: PersonHurtPoint = {
    personName: profA.name,
    headline: bestA.headline,
    description: bestA.description,
  };

  const hurtB: PersonHurtPoint = {
    personName: profB.name,
    headline: bestB.headline,
    description: bestB.description,
  };

  const summary03 = bestA.id === bestB.id
    ? `두 사람 모두 갈등의 겉보기 주제보다 '상대가 나를 어떻게 대하고 있는가'라는 정서적 존중 여부에 더 크게 반응합니다.`
    : `${profA.name}님과 ${profB.name}님은 갈등 상황에서 마음이 상하는 핵심 자극 지점이 달라 서로의 민감한 지점을 배려해야 합니다.`;

  // --- 04. Repair & Reconnection (Scored Deduplication) ---
  type RepairCandidate = {
    id: string;
    score: number;
    firstNeed: string;
    nextNeed: string;
    howToApproach: string;
  };

  const getRepairCandidates = (prof: PersonConflictProfile): RepairCandidate[] => [
    {
      id: "COOLING_TIME",
      score: (100 - prof.conflictStyle) * 0.6 + prof.tenGods.seal * 25 + (prof.isAvoidantExpressed ? 40 : 0),
      firstNeed: "생각 정돈을 위한 고요한 시간",
      nextNeed: "압박 없는 가벼운 대화 재접속",
      howToApproach: `${prof.name}님에게는 답을 재촉하지 않고 스스로 마음을 정돈할 시간적 여유를 먼저 주는 것이 좋습니다.`,
    },
    {
      id: "RECOGNITION_RESPECT",
      score: prof.tenGods.self * 30 + (100 - prof.resilience) * 0.5 + (prof.hasInnatePrideDrive ? 40 : 0),
      firstNeed: "수고와 존재 가치에 대한 인정",
      nextNeed: "경청하는 태도와 문제 해결 의지",
      howToApproach: `${prof.name}님에게는 자존심을 건드리지 않고 그동안의 노고를 먼저 알아주는 진심 어린 한마디가 우선입니다.`,
    },
    {
      id: "EMPATHY_ACCEPTANCE",
      score: prof.empathy * 0.5 + prof.tenGods.food * 25 + 20,
      firstNeed: "감정이 상했음을 인정해 주는 태도",
      nextNeed: "향후 재발 방지를 위한 구체적 약속",
      howToApproach: `${prof.name}님에게는 잘잘못을 가리기 전에 마음이 불편했을 상황 자체를 공감해 주는 것이 마음을 엽니다.`,
    },
    {
      id: "LOGICAL_CLARITY",
      score: prof.thinkingStyle * 0.5 + prof.tenGods.officer * 25 + 15,
      firstNeed: "갈등 원인에 대한 명확한 정리",
      nextNeed: "서로 납득할 수 있는 현실적 대안",
      howToApproach: `${prof.name}님에게는 감정적 호소보다 어떤 부분에서 오해가 생겼는지 차분하고 명확하게 짚어주는 접근이 마음을 정돈하게 합니다.`,
    },
  ];

  const repCandA = getRepairCandidates(profA).sort((a, b) => b.score - a.score);
  const repCandB = getRepairCandidates(profB).sort((a, b) => b.score - a.score);

  const repBestA = repCandA[0]!;
  const repBestB = repCandB[0]!.id === repBestA.id ? (repCandB[1] ?? repCandB[0]!) : repCandB[0]!;

  const repairA: PersonRepairGuide = {
    personName: profA.name,
    firstNeed: repBestA.firstNeed,
    nextNeed: repBestA.nextNeed,
    howToApproach: repBestA.howToApproach,
  };

  const repairB: PersonRepairGuide = {
    personName: profB.name,
    firstNeed: repBestB.firstNeed,
    nextNeed: repBestB.nextNeed,
    howToApproach: repBestB.howToApproach,
  };

  const summary04 = `화해의 핵심은 승패를 가리는 것이 아니라, 상대방이 필요로 하는 조율 신호(시간 또는 존재 인정)를 먼저 건네는 것입니다.`;

  // --- 05. Expectations to Release ---
  const expAtoB: ExpectationReleaseItem = isBAvoidant
    ? {
        fromName: nameA,
        toName: nameB,
        headline: "갈등 순간 즉각적인 완벽한 대화 기대 내려놓기",
        description: `${nameB}님에게는 감정을 정돈할 시간이 필요하므로, 현장에서 모든 대답과 사과를 즉시 얻어내려 하지 않는 것이 관계 부담을 줄입니다.`,
      }
    : {
        fromName: nameA,
        toName: nameB,
        headline: "말하지 않아도 내 속마음을 다 알아주길 기대하지 않기",
        description: `${nameB}님에게 서운한 점이 있다면 대치가 길어지기 전에 원하는 대안을 구체적인 언어로 건네는 것이 훨씬 효과적입니다.`,
      };

  const expBtoA: ExpectationReleaseItem = isADirect
    ? {
        fromName: nameB,
        toName: nameA,
        headline: "집안일과 합의 사안을 대충 넘어가길 기대하지 않기",
        description: `${nameA}님에게는 가사와 생활 규칙의 명확성이 중요하므로, 모호한 반응으로 피하기보다 확인된 의사를 명확히 표현해 주세요.`,
      }
    : {
        fromName: nameB,
        toName: nameA,
        headline: "항상 내가 원하는 타이밍에 대화가 시작되길 기대하지 않기",
        description: `${nameA}님의 감정 온도가 정돈될 때까지 기다려주고, 대화가 가능한 시점을 서로 미리 약속해 두는 지혜가 필요합니다.`,
      };

  // --- 06. Relationship Protection ---
  const protAsset: RelationshipProtectionItem = {
    headline: "일상의 소소한 감사와 정서적 안부 나누기",
    description: "아무리 큰 갈등이 지나가도 매일 주고받던 가벼운 다정함과 인사만큼은 훼손되지 않도록 보호해야 합니다.",
  };

  const roleRebalance: RelationshipProtectionItem = {
    headline: "가사 기획과 현실 점검 부담의 한쪽 쏠림 방지",
    description: "집안 운영이나 재정 점검이 한 사람의 고유 숙제가 되지 않도록 정기적으로 역할을 재확인해야 합니다.",
  };

  const privacyBoundary: RelationshipProtectionItem = isBAvoidant || !isADirect
    ? {
        headline: "침실 문이 닫힌 후와 개인 동굴 시간에 감정 재개 않기",
        description: "상대가 혼자만의 시간이나 휴식을 취하러 들어갔을 때는 그날의 서운함을 따라가며 다시 꺼내지 않는 선을 지킵니다.",
      }
    : {
        headline: "싸움 중에 상대 원가족이나 지나간 과거 습관 끌어오지 않기",
        description: "현재 이슈와 상관없는 과거 발언이나 원가족 이야기를 갈등의 무기로 끌어오지 않는 경계를 서로 약속합니다.",
      };

  // --- 07. Directional Actions Architecture (Guaranteed Rich Populate) ---
  const dosAtoB: string[] = [
    `${nameB}님이 혼자만의 정리 시간이 필요할 때 억지로 쫓아가지 않고 다시 대화할 시점을 물어보기`,
    `${nameB}님의 감정과 일상 수고에 대해 "고생했어" 진심 어린 인정 표현 건네기`,
    `서로 감정이 과열되었음을 느낄 때 서둘러 답을 내기보다 잠시 대화를 멈추는 타임아웃 신호 제안하기`,
    `${nameB}님이 힘들어할 때 조언이나 해결책 대신 상대가 원하는 휴식 시간부터 먼저 챙겨주기`,
  ];

  const dontsAtoB: string[] = [
    `상대가 입을 닫았다고 방 문 앞까지 따라가며 즉각적인 답변 강요하지 않기`,
    `침실 문이 닫히거나 휴식 모드에 들어간 뒤 그날의 서운함을 따라가며 재개하지 않기`,
    `갈등 주제를 다룰 때 상대방의 성격이나 인성 전체를 '원래 그렇다'며 비난하지 않기`,
    `갈등 직후 홧김에 '각방·별거·관계 정리' 같은 극단적인 구조 변경 카드를 꺼내지 않기`,
  ];

  const dosBtoA: string[] = [
    `생각 정리가 필요할 때 무작정 입을 닫기보다 "정리하고 다시 이야기하자"며 복귀 시점 알려주기`,
    `${nameA}님의 집안 운영 기획과 일상 챙김 노고에 대해 구체적인 "고마워" 피드백해 주기`,
    `${nameA}님이 가사/재정 규칙을 짚을 때 모호하게 피하지 않고 명확한 의견 말해 주기`,
    `대화를 시작할 때는 잘잘못을 가리기 전에 상대가 느꼈을 서운함부터 공감해 주기`,
  ];

  const dontsBtoA: string[] = [
    `서운함이 생겼을 때 대화로 풀지 않고 며칠씩 싸늘한 무반응 침묵 유지하지 않기`,
    `정해진 가사/재정 원칙이나 대화 약속을 가볍게 생각하고 건너뛰지 않기`,
    `말없이도 통한다는 이유로 중요한 결정이나 약속을 구두로만 대충 넘어가지 않기`,
    `갈등 중 상대의 애정이나 노력을 시험 대상으로 삼거나 추궁하듯 몰아붙이지 않기`,
  ];

  const sharedDos: string[] = [
    "갈등 오버로드 시 승패보다 서로의 감정 과열 상황을 먼저 인정하기",
    "갈등 후 가벼운 음료나 안부 질문으로 정서적 재접속 신호 건네기",
    "한 달에 한 번 둘만의 소소한 긍정적 일상 루틴을 새로 정해 나누기",
  ];

  const sharedDonts: string[] = [
    "싸우는 도중 상대 원가족 이야기나 지나간 과거 일을 갈등 무기로 끌어오지 않기",
    "타인이나 SNS 앞에서 부부 관계를 과장하려다 집에서 반동으로 냉전하지 않기",
  ];

  return {
    introNarrative: "갈등은 관계의 위기가 아닌 서로의 다름을 알아가는 과정입니다. 싸움의 패턴과 회복의 열쇠를 살펴봅니다.",
    section01_journey: {
      personA: journeyA,
      personB: journeyB,
    },
    section02_conflictLoop: {
      headline: loopHeadline,
      personAStep: { name: nameA, flow: flowA },
      personBStep: { name: nameB, flow: flowB },
      summary: loopSummary,
    },
    section03_hurtPoint: {
      personA: hurtA,
      personB: hurtB,
      summary: summary03,
    },
    section04_repair: {
      personA: repairA,
      personB: repairB,
      summary: summary04,
    },
    section05_expectationsToRelease: {
      expectationAtoB: expAtoB,
      expectationBtoA: expBtoA,
    },
    section06_relationshipProtection: {
      protectiveAsset: protAsset,
      roleToRebalance: roleRebalance,
      privacyBoundary: privacyBoundary,
    },
    section07_directionalActions: {
      actionAtoB: {
        actorName: nameA,
        targetName: nameB,
        dos: dosAtoB,
        donts: dontsAtoB,
      },
      actionBtoA: {
        actorName: nameB,
        targetName: nameA,
        dos: dosBtoA,
        donts: dontsBtoA,
      },
      sharedActions: {
        dos: sharedDos,
        donts: sharedDonts,
      },
    },
  };
}
