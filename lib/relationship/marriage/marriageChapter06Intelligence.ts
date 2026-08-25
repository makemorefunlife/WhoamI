import type { MarriageRuleContext } from "./buildMarriageRuleContext";
import type { Locale } from "@/lib/i18n/config";

// -----------------------------------------------------------------------------
// TYPES FOR CHAPTER 06: FAMILY SYSTEM INTELLIGENCE
// -----------------------------------------------------------------------------

// --- Section 01: COUPLE_BOUNDARY ---
export type CoupleBoundarySection = {
  title: string;
  profileA: {
    personName: string;
    editorialLabel: string;
    narrative: string;
  };
  profileB: {
    personName: string;
    editorialLabel: string;
    narrative: string;
  };
  boundarySynthesis: string;
};

// --- Section 02: ORIGIN_FAMILY_DYNAMICS ---
export type OriginFamilyPairRoleKey =
  | "HARD_TO_REFUSE_PARENTS"
  | "SPOUSE_FIRST_PROTECTOR"
  | "EARLY_BOUNDARY_SPEAKER"
  | "LONG_FAMILY_CONFLICT_CARRIER";

export type OriginFamilyPairRole = {
  roleKey: OriginFamilyPairRoleKey;
  roleLabel: string;
  personName: string;
};

export type OriginFamilyDynamicsSection = {
  title: string;
  pairRoles: OriginFamilyPairRole[];
  cautionMoment: string;
};

// --- Section 03: PARENTING_DNA ---
export type ParentingDnaProfile = {
  personName: string;
  editorialIdentity: string;
  narrative: string;
  firstFocusKeywords: string[];
  easyToMissNote: string;
};

export type ParentingDnaSection = {
  title: string;
  profileA: ParentingDnaProfile;
  profileB: ParentingDnaProfile;
};

// --- Section 04: PARENTING_DIFFERENCE ---
export type SituationReaction = {
  situationTitle: string;
  reactionA: string;
  reactionB: string;
};

export type ParentingDifferenceSection = {
  title: string;
  situations: SituationReaction[];
};

// --- Section 05: PAIR_PARENTING_SYSTEM ---
export type PairParentingSystemSection = {
  title: string;
  headline: string;
  ourStrengths: string;
  whatToWatchOut: string;
  oneLineSynthesis: string;
};

// --- Section 06: FAMILY_LOAD_REDISTRIBUTION ---
export type FamilyLoadRoleKey =
  | "SCHEDULE_FIRST_ADJUSTER"
  | "FAMILY_PROBLEM_ABSORBER"
  | "PERSONAL_GOAL_PROTECTOR"
  | "LATE_BURNOUT_RISK";

export type FamilyLoadPairRole = {
  roleKey: FamilyLoadRoleKey;
  roleLabel: string;
  personName: string;
};

export type FamilyLoadRedistributionSection = {
  title: string;
  pairRoles: FamilyLoadPairRole[];
  oneLineSynthesis: string;
};

// --- Section 07: FAMILY_IDENTITY ---
export type FamilyIdentitySection = {
  title: string;
  familyIdentityHeadline: string;
  coupleBoundarySummary: string;
  giftToChildSummary: string;
  cautionSummary: string;
  familyStrengthSummary: string;
};

// --- Full Chapter 06 Intelligence ---
export type MarriageChapter06Intelligence = {
  introQuestion: string;
  coupleBoundary: CoupleBoundarySection; // 01
  originFamilyDynamics: OriginFamilyDynamicsSection; // 02
  parentingDna: ParentingDnaSection; // 03
  parentingDifference: ParentingDifferenceSection; // 04
  pairParentingSystem: PairParentingSystemSection; // 05
  familyLoadRedistribution: FamilyLoadRedistributionSection; // 06
  familyIdentity: FamilyIdentitySection; // 07
};

// -----------------------------------------------------------------------------
// INTELLIGENCE BUILDER
// -----------------------------------------------------------------------------

export function buildMarriageChapter06Intelligence(params: {
  ctx: MarriageRuleContext;
  psychA?: any;
  psychB?: any;
  locale?: Locale;
}): MarriageChapter06Intelligence {
  const { ctx, psychA, psychB, locale = "ko-KR" } = params;
  const isEn = locale === "en-US";

  const nameA = ctx.nicknameA;
  const nameB = ctx.nicknameB;

  const countsA = ctx.tenGod?.countsA ?? {};
  const countsB = ctx.tenGod?.countsB ?? {};

  const psychAxesA = psychA?.secondary_axes ?? psychA?.traits ?? {};
  const psychAxesB = psychB?.secondary_axes ?? psychB?.traits ?? {};

  const fmtName = (name: string) => (name === "둘 다" ? "두 사람" : `${name}님`);

  // Helper for abstention resolution
  const resolvePairPerson = (scoreA: number, scoreB: number, threshold = 1.5): string => {
    const diff = scoreA - scoreB;
    if (diff >= threshold) return nameA;
    if (diff <= -threshold) return nameB;
    if (Math.abs(diff) < 0.5) return "둘 다";
    return "뚜렷한 우위 없음";
  };

  // ---------------------------------------------------------------------------
  // 01. COUPLE_BOUNDARY (결혼하면 우리는 얼마나 독립된 팀이 될까?)
  // ---------------------------------------------------------------------------
  const boundScoreA = (countsA["관성"] ?? 0) + (countsA["비겁"] ?? 0) * 1.5 + ((psychAxesA.autonomy ?? 50) > 55 ? 2 : 0);
  const boundScoreB = (countsB["관성"] ?? 0) + (countsB["비겁"] ?? 0) * 1.5 + ((psychAxesB.autonomy ?? 50) > 55 ? 2 : 0);

  const connScoreA = (countsA["인성"] ?? 0) * 1.5 + ((psychAxesA.connection ?? 50) > 55 ? 2 : 0);
  const connScoreB = (countsB["인성"] ?? 0) * 1.5 + ((psychAxesB.connection ?? 50) > 55 ? 2 : 0);

  const getBoundaryProfile = (name: string, bScore: number, cScore: number) => {
    if (bScore >= cScore + 1.0) {
      return {
        personName: name,
        editorialLabel: "부부의 기준을 먼저 세우는 편",
        narrative: `${name}님은 양가의 기대나 주변의 시선보다 두 사람이 합의한 기준과 부부의 자율성을 최우선으로 지켜내려는 편입니다.`,
      };
    } else if (cScore >= bScore + 1.0) {
      return {
        personName: name,
        editorialLabel: "가족의 마음까지 함께 살피는 편",
        narrative: `${name}님은 원가족의 정서적 흐름과 부모의 필요를 세심히 살피며 도의적 연결고리를 조화롭게 챙기려는 편입니다.`,
      };
    } else {
      return {
        personName: name,
        editorialLabel: "단단한 우리 울타리를 지키는 편",
        narrative: `${name}님은 현실적인 상황에 따라 원가족과의 거리감과 부부 내부의 독립성을 균형 있게 조율해나가는 편입니다.`,
      };
    }
  };

  const coupleBoundary: CoupleBoundarySection = {
    title: isEn ? "Couple Boundary & Independence" : "결혼하면 우리는 얼마나 독립된 팀이 될까?",
    profileA: getBoundaryProfile(nameA, boundScoreA, connScoreA),
    profileB: getBoundaryProfile(nameB, boundScoreB, connScoreB),
    boundarySynthesis: `${nameA}님과 ${nameB}님이 만나 새로운 가정을 이룰 때, 원가족과의 정서적 교감과 독립적인 부부 우선순위 사이에서 건강한 경계선을 형성해갑니다.`,
  };

  // ---------------------------------------------------------------------------
  // 02. ORIGIN_FAMILY_DYNAMICS (시댁·처가 문제에서 누가 더 흔들릴까?)
  // ---------------------------------------------------------------------------
  // 1. HARD_TO_REFUSE_PARENTS: Saju 印/官 + Psych connection/empathy
  const refuseA = (countsA["인성"] ?? 0) * 1.5 + (countsA["관성"] ?? 0) + ((psychAxesA.connection ?? 50) > 55 ? 2 : 0) + ((psychAxesA.empathy ?? 50) > 55 ? 1 : 0);
  const refuseB = (countsB["인성"] ?? 0) * 1.5 + (countsB["관성"] ?? 0) + ((psychAxesB.connection ?? 50) > 55 ? 2 : 0) + ((psychAxesB.empathy ?? 50) > 55 ? 1 : 0);

  // 2. SPOUSE_FIRST_PROTECTOR: Saju 比劫/官 + Psych autonomy/decision_style
  const protA = (countsA["비겁"] ?? 0) * 1.5 + (countsA["관성"] ?? 0) + ((psychAxesA.autonomy ?? 50) > 55 ? 2 : 0) + ((psychAxesA.decision_style ?? 50) > 55 ? 1 : 0);
  const protB = (countsB["비겁"] ?? 0) * 1.5 + (countsB["관성"] ?? 0) + ((psychAxesB.autonomy ?? 50) > 55 ? 2 : 0) + ((psychAxesB.decision_style ?? 50) > 55 ? 1 : 0);

  // 3. EARLY_BOUNDARY_SPEAKER: Saju 比劫/食傷 + Psych conflict_style/autonomy
  const spkA = (countsA["비겁"] ?? 0) + (countsA["식상"] ?? 0) * 1.5 + ((psychAxesA.autonomy ?? 50) > 55 ? 1.5 : 0) + ((psychAxesA.conflict_style ?? 50) > 55 ? 1.5 : 0);
  const spkB = (countsB["비겁"] ?? 0) + (countsB["식상"] ?? 0) * 1.5 + ((psychAxesB.autonomy ?? 50) > 55 ? 1.5 : 0) + ((psychAxesB.conflict_style ?? 50) > 55 ? 1.5 : 0);

  // 4. LONG_FAMILY_CONFLICT_CARRIER: Saju 印 + Psych empathy/resilience(low)
  const carA = (countsA["인성"] ?? 0) * 1.5 + ((psychAxesA.empathy ?? 50) > 55 ? 2 : 0) + ((psychAxesA.resilience ?? 50) < 45 ? 1.5 : 0);
  const carB = (countsB["인성"] ?? 0) * 1.5 + ((psychAxesB.empathy ?? 50) > 55 ? 2 : 0) + ((psychAxesB.resilience ?? 50) < 45 ? 1.5 : 0);

  const pairRoles02: OriginFamilyPairRole[] = [
    { roleKey: "HARD_TO_REFUSE_PARENTS", roleLabel: "부모의 부탁을 거절하기 어려운 쪽", personName: resolvePairPerson(refuseA, refuseB) },
    { roleKey: "SPOUSE_FIRST_PROTECTOR", roleLabel: "배우자 편을 먼저 지키는 쪽", personName: resolvePairPerson(protA, protB) },
    { roleKey: "EARLY_BOUNDARY_SPEAKER", roleLabel: "경계를 먼저 말하는 쪽", personName: resolvePairPerson(spkA, spkB) },
    { roleKey: "LONG_FAMILY_CONFLICT_CARRIER", roleLabel: "가족 갈등을 오래 담는 쪽", personName: resolvePairPerson(carA, carB) },
  ];

  const originFamilyDynamics: OriginFamilyDynamicsSection = {
    title: isEn ? "Origin Family Dynamics" : "시댁·처가 문제에서 누가 더 흔들릴까?",
    pairRoles: pairRoles02,
    cautionMoment: "원가족의 기대와 부부의 필요가 충돌할 때, 양쪽 모두 서운함이 생기지 않도록 두 사람만의 경계선과 사전 소통 원칙을 먼저 세우는 것이 중요합니다.",
  };

  // ---------------------------------------------------------------------------
  // 03. PARENTING_DNA (아이가 생기면 나는 어떤 부모가 될까?)
  // ---------------------------------------------------------------------------
  const warmthA = (countsA["인성"] ?? 0) * 1.5 + (countsA["식상"] ?? 0) + ((psychAxesA.empathy ?? 50) > 55 ? 2 : 0) + ((psychAxesA.connection ?? 50) > 55 ? 1.5 : 0);
  const warmthB = (countsB["인성"] ?? 0) * 1.5 + (countsB["식상"] ?? 0) + ((psychAxesB.empathy ?? 50) > 55 ? 2 : 0) + ((psychAxesB.connection ?? 50) > 55 ? 1.5 : 0);

  const structA = (countsA["관성"] ?? 0) * 1.5 + (countsA["인성"] ?? 0) + ((psychAxesA.structure ?? 50) > 55 ? 2 : 0) + ((psychAxesA.self_control ?? 50) > 55 ? 1.5 : 0);
  const structB = (countsB["관성"] ?? 0) * 1.5 + (countsB["인성"] ?? 0) + ((psychAxesB.structure ?? 50) > 55 ? 2 : 0) + ((psychAxesB.self_control ?? 50) > 55 ? 1.5 : 0);

  const autoA = (countsA["비겁"] ?? 0) * 1.5 + (countsA["식상"] ?? 0) + ((psychAxesA.autonomy ?? 50) > 55 ? 2 : 0) + ((psychAxesA.adaptability ?? 50) > 55 ? 1.5 : 0);
  const autoB = (countsB["비겁"] ?? 0) * 1.5 + (countsB["식상"] ?? 0) + ((psychAxesB.autonomy ?? 50) > 55 ? 2 : 0) + ((psychAxesB.adaptability ?? 50) > 55 ? 1.5 : 0);

  const growthA = (countsA["관성"] ?? 0) + (countsA["식상"] ?? 0) * 1.5 + ((psychAxesA.growth ?? 50) > 55 ? 2 : 0) + ((psychAxesA.decision_style ?? 50) > 55 ? 1.5 : 0);
  const growthB = (countsB["관성"] ?? 0) + (countsB["식상"] ?? 0) * 1.5 + ((psychAxesB.growth ?? 50) > 55 ? 2 : 0) + ((psychAxesB.decision_style ?? 50) > 55 ? 1.5 : 0);

  const buildParentingProfile = (name: string, wScore: number, sScore: number, aScore: number, gScore: number): ParentingDnaProfile => {
    const maxVal = Math.max(wScore, sScore, aScore, gScore);

    if (maxVal === wScore) {
      return {
        personName: name,
        editorialIdentity: "아이의 마음과 감정을 먼저 읽는 부모",
        narrative: `${name}님은 아이의 기분과 정서적 필요를 가장 빠르고 섬세하게 알아차려, 따뜻한 수용과 안도감을 먼저 제공하려는 성향입니다.`,
        firstFocusKeywords: ["감정 수용", "정서적 안정", "따뜻한 공감"],
        easyToMissNote: "상황에 따라 명확하게 선을 그어주는 규칙 수용 한계",
      };
    } else if (maxVal === sScore) {
      return {
        personName: name,
        editorialIdentity: "규칙과 일관된 기준을 세워주는 부모",
        narrative: `${name}님은 일상의 틀과 올바른 행동 수칙을 명확히 제시하여, 아이가 혼란 없이 바르게 자라도록 규칙과 기반을 다져주는 성향입니다.`,
        firstFocusKeywords: ["일상 루틴", "명확한 경계", "행동 일관성"],
        easyToMissNote: "아이의 자발적인 선택과 유연한 감정 여백",
      };
    } else if (maxVal === aScore) {
      return {
        personName: name,
        editorialIdentity: "스스로 겪고 선택하도록 터전을 주는 부모",
        narrative: `${name}님은 아이가 자신의 의지로 시도하고 시행착오를 겪으며 스스로 깨달아갈 수 있도록 독립적인 선택 공간을 보장해주는 성향입니다.`,
        firstFocusKeywords: ["자율 선택", "실패 경험 허용", "독립심"],
        easyToMissNote: "즉각적인 울타리와 세밀한 안전망 대처",
      };
    } else {
      return {
        personName: name,
        editorialIdentity: "도전과 성장의 가능성을 끌어내어 주는 부모",
        narrative: `${name}님은 아이가 자신의 한계를 넘어 능력을 발휘하고 새로운 도전을 성취해 나가도록 자극과 동기를 부여해주는 성향입니다.`,
        firstFocusKeywords: ["성장 목표", "성취 경험", "잠재력 인도"],
        easyToMissNote: "결과 이전의 마음 인정과 편안하게 쉬어감",
      };
    }
  };

  const parentingDna: ParentingDnaSection = {
    title: isEn ? "Parenting DNA" : "아이가 생기면 나는 어떤 부모가 될까?",
    profileA: buildParentingProfile(nameA, warmthA, structA, autoA, growthA),
    profileB: buildParentingProfile(nameB, warmthB, structB, autoB, growthB),
  };

  // ---------------------------------------------------------------------------
  // 04. PARENTING_DIFFERENCE (아이 앞에서 우리 의견이 갈리면?)
  // ---------------------------------------------------------------------------
  const structGap = Math.abs(structA - structB);
  const warmthGap = Math.abs(warmthA - warmthB);

  const situations: SituationReaction[] = [];

  if (structGap >= 1.5) {
    situations.push({
      situationTitle: "아이가 약속이나 생활 규칙을 어겼을 때",
      reactionA: structA > structB ? `${nameA}님은 규칙의 원칙과 일관성을 지키길 요구하는 편` : `${nameA}님은 아이의 사정과 감정을 짚어주며 조율하려는 편`,
      reactionB: structB > structA ? `${nameB}님은 규칙의 원칙과 일관성을 지키길 요구하는 편` : `${nameB}님은 아이의 사정과 감정을 짚어주며 조율하려는 편`,
    });
  } else {
    situations.push({
      situationTitle: "아이가 떼를 쓰거나 고집을 부릴 때",
      reactionA: `${nameA}님은 스스로 감정을 다스릴 시간을 주는 편`,
      reactionB: `${nameB}님은 대화와 달램으로 상황을 풀어가는 편`,
    });
  }

  if (warmthGap >= 1.5) {
    situations.push({
      situationTitle: "아이가 실패하거나 정서적으로 불안해할 때",
      reactionA: warmthA > warmthB ? `${nameA}님은 무조건적인 다독임과 감정 공감을 우선하는 편` : `${nameA}님은 해결책 제시와 다음 행동 노하우를 건네는 편`,
      reactionB: warmthB > warmthA ? `${nameB}님은 무조건적인 다독임과 감정 공감을 우선하는 편` : `${nameB}님은 해결책 제시와 다음 행동 노하우를 건네는 편`,
    });
  } else {
    situations.push({
      situationTitle: "새로운 도전이나 독립적인 선택을 해야 할 때",
      reactionA: `${nameA}님은 아이의 자율적 결정을 지지하는 편`,
      reactionB: `${nameB}님은 사전 점검과 안전망 구축을 조언하는 편`,
    });
  }

  const parentingDifference: ParentingDifferenceSection = {
    title: isEn ? "Parenting Differences & Scenarios" : "아이 앞에서 우리 의견이 갈리면?",
    situations,
  };

  // ---------------------------------------------------------------------------
  // 05. PAIR_PARENTING_SYSTEM (아이에게 우리는 어떤 팀이 될까?)
  // ---------------------------------------------------------------------------
  let headline = "";
  let strengths = "";
  let watchOut = "";
  let pairOneLine = "";

  if (structGap >= 2.0 || warmthGap >= 2.0) {
    headline = "한 사람은 따뜻하게 품고 한 사람은 바른 길을 잡아주는 조화로운 양육 팀";
    strengths = `${nameA}님과 ${nameB}님이 서로 다른 영역에서 강점을 발휘하여 아이가 정서적 온기와 현실적 규칙을 함께 경험할 수 있습니다.`;
    watchOut = "양육 방식의 차이가 아이 앞에서 직접적인 의견 대립으로 드러나지 않도록 부부 간 사전 조율이 필요합니다.";
    pairOneLine = "두 부모가 각자의 시각으로 아이를 보호하므로, 서투른 부분은 채워주고 균형 잡힌 울타리를 만듭니다.";
  } else {
    headline = "아이에게 일관된 가치관과 안정적인 환경을 제공하는 단단한 양육 파트너십";
    strengths = "두 부모의 양육 기준과 공감대가 일치하여 아이가 일관되고 예측 가능한 환경에서 안정감을 느끼기 쉽습니다.";
    watchOut = "두 사람의 공통적인 양육 맹점이 생길 경우(예: 과도한 엄격함 또는 과도한 허용), 유연한 조율 과정을 점검하는 것이 좋습니다.";
    pairOneLine = "가치관의 통일성이 강하여 아이에게 신뢰감 있는 보금자리를 만들어주는 팀워크를 발휘합니다.";
  }

  const pairParentingSystem: PairParentingSystemSection = {
    title: isEn ? "Pair Parenting System" : "아이에게 우리는 어떤 팀이 될까?",
    headline,
    ourStrengths: strengths,
    whatToWatchOut: watchOut,
    oneLineSynthesis: pairOneLine,
  };

  // ---------------------------------------------------------------------------
  // 06. FAMILY_LOAD_REDISTRIBUTION (가족을 위해 누가 더 많이 자기 삶을 조정할까?)
  // ---------------------------------------------------------------------------
  // 1. SCHEDULE_FIRST_ADJUSTER: Saju 印/官 + Psych empathy/self_control
  const schA = (countsA["인성"] ?? 0) + (countsA["관성"] ?? 0) + ((psychAxesA.empathy ?? 50) > 55 ? 2 : 0);
  const schB = (countsB["인성"] ?? 0) + (countsB["관성"] ?? 0) + ((psychAxesB.empathy ?? 50) > 55 ? 2 : 0);

  // 2. FAMILY_PROBLEM_ABSORBER: Saju 官/印 + Psych self_control/stability
  const absA = (countsA["관성"] ?? 0) * 1.5 + (countsA["인성"] ?? 0) + ((psychAxesA.self_control ?? 50) > 55 ? 2 : 0);
  const absB = (countsB["관성"] ?? 0) * 1.5 + (countsB["인성"] ?? 0) + ((psychAxesB.self_control ?? 50) > 55 ? 2 : 0);

  // 3. PERSONAL_GOAL_PROTECTOR: Saju 比劫/食傷 + Psych autonomy/growth
  const pgoA = (countsA["비겁"] ?? 0) * 1.5 + (countsA["식상"] ?? 0) + ((psychAxesA.autonomy ?? 50) > 55 ? 2 : 0);
  const pgoB = (countsB["비겁"] ?? 0) * 1.5 + (countsB["식상"] ?? 0) + ((psychAxesB.autonomy ?? 50) > 55 ? 2 : 0);

  // 4. LATE_BURNOUT_RISK: Saju 印 + Psych self_control / resilience(low)
  const bntA = (countsA["인성"] ?? 0) * 1.5 + ((psychAxesA.self_control ?? 50) > 55 ? 1.5 : 0) + ((psychAxesA.resilience ?? 50) < 45 ? 1.5 : 0);
  const bntB = (countsB["인성"] ?? 0) * 1.5 + ((psychAxesB.self_control ?? 50) > 55 ? 1.5 : 0) + ((psychAxesB.resilience ?? 50) < 45 ? 1.5 : 0);

  const pairRoles06: FamilyLoadPairRole[] = [
    { roleKey: "SCHEDULE_FIRST_ADJUSTER", roleLabel: "일정을 먼저 조정하기 쉬운 쪽", personName: resolvePairPerson(schA, schB) },
    { roleKey: "FAMILY_PROBLEM_ABSORBER", roleLabel: "가족 문제를 자기 책임으로 가져가기 쉬운 쪽", personName: resolvePairPerson(absA, absB) },
    { roleKey: "PERSONAL_GOAL_PROTECTOR", roleLabel: "자기 일과 목표를 더 오래 지키려는 쪽", personName: resolvePairPerson(pgoA, pgoB) },
    { roleKey: "LATE_BURNOUT_RISK", roleLabel: "참다가 뒤늦게 지치기 쉬운 쪽", personName: resolvePairPerson(bntA, bntB) },
  ];

  const familyLoadRedistribution: FamilyLoadRedistributionSection = {
    title: isEn ? "Family Load Redistribution" : "가족을 위해 누가 더 많이 자기 삶을 조정할까?",
    pairRoles: pairRoles06,
    oneLineSynthesis: "가족 이슈가 생겼을 때 한 쪽에게 비대칭적인 부담이 가중되지 않도록, 역할과 일정을 정기적으로 수평 재배치하는 것이 중요합니다.",
  };

  // ---------------------------------------------------------------------------
  // 07. FAMILY_IDENTITY (결국 우리는 어떤 가족이 될까?)
  // ---------------------------------------------------------------------------
  const familyIdentity: FamilyIdentitySection = {
    title: isEn ? "Family Identity & System Summary" : "결국 우리는 어떤 가족이 될까?",
    familyIdentityHeadline: `${nameA}님과 ${nameB}님이 만드는 가정을 둘러싼 건강한 독립성과 따뜻한 양육 파트너십`,
    coupleBoundarySummary: coupleBoundary.boundarySynthesis,
    giftToChildSummary: pairParentingSystem.headline,
    cautionSummary: originFamilyDynamics.cautionMoment,
    familyStrengthSummary: pairParentingSystem.ourStrengths,
  };

  return {
    introQuestion: isEn
      ? "When parents and children enter our lives, who do we protect first and what kind of family system do we build?"
      : "부모와 아이까지 우리 삶에 들어오면, 우리는 누구를 먼저 지키고 어떤 부모가 될까?",
    coupleBoundary,
    originFamilyDynamics,
    parentingDna,
    parentingDifference,
    pairParentingSystem,
    familyLoadRedistribution,
    familyIdentity,
  };
}

export function createDefaultMarriageChapter06Intelligence(params: {
  nameA: string;
  nameB: string;
  locale?: Locale;
}): MarriageChapter06Intelligence {
  const { nameA, nameB, locale = "ko-KR" } = params;
  const isEn = locale === "en-US";

  return {
    introQuestion: isEn
      ? "When parents and children enter our lives, who do we protect first and what kind of family system do we build?"
      : "부모와 아이까지 우리 삶에 들어오면, 우리는 누구를 먼저 지키고 어떤 부모가 될까?",
    coupleBoundary: {
      title: isEn ? "Couple Boundary & Independence" : "결혼하면 우리는 얼마나 독립된 팀이 될까?",
      profileA: {
        personName: nameA,
        editorialLabel: "부부의 기준을 먼저 세우는 편",
        narrative: `${nameA}님은 양가의 기대나 주변의 시선보다 두 사람이 합의한 기준과 부부의 자율성을 최우선으로 지켜내려는 편입니다.`,
      },
      profileB: {
        personName: nameB,
        editorialLabel: "가족의 마음까지 함께 살피는 편",
        narrative: `${nameB}님은 원가족의 정서적 흐름과 부모의 필요를 세심히 살피며 도의적 연결고리를 조화롭게 챙기려는 편입니다.`,
      },
      boundarySynthesis: `${nameA}님과 ${nameB}님이 만나 새로운 가정을 이룰 때, 원가족과의 정서적 교감과 독립적인 부부 우선순위 사이에서 건강한 경계선을 형성해갑니다.`,
    },
    originFamilyDynamics: {
      title: isEn ? "Origin Family Dynamics" : "시댁·처가 문제에서 누가 더 흔들릴까?",
      pairRoles: [
        { roleKey: "HARD_TO_REFUSE_PARENTS", roleLabel: "부모의 부탁을 거절하기 어려운 쪽", personName: nameB },
        { roleKey: "SPOUSE_FIRST_PROTECTOR", roleLabel: "배우자 편을 먼저 지키는 쪽", personName: nameA },
        { roleKey: "EARLY_BOUNDARY_SPEAKER", roleLabel: "경계를 먼저 말하는 쪽", personName: nameA },
        { roleKey: "LONG_FAMILY_CONFLICT_CARRIER", roleLabel: "가족 갈등을 오래 담는 쪽", personName: nameB },
      ],
      cautionMoment: "원가족의 기대와 부부의 필요가 충돌할 때, 양쪽 모두 서운함이 생기지 않도록 두 사람만의 경계선과 사전 소통 원칙을 먼저 세우는 것이 중요합니다.",
    },
    parentingDna: {
      title: isEn ? "Parenting DNA" : "아이가 생기면 나는 어떤 부모가 될까?",
      profileA: {
        personName: nameA,
        editorialIdentity: "아이의 마음과 감정을 먼저 읽는 부모",
        narrative: `${nameA}님은 아이의 기분과 정서적 필요를 가장 빠르고 섬세하게 알아차려, 따뜻한 수용과 안도감을 먼저 제공하려는 성향입니다.`,
        firstFocusKeywords: ["감정 수용", "정서적 안정", "따뜻한 공감"],
        easyToMissNote: "상황에 따라 명확하게 선을 그어주는 규칙 수용 한계",
      },
      profileB: {
        personName: nameB,
        editorialIdentity: "규칙과 일관된 기준을 세워주는 부모",
        narrative: `${nameB}님은 일상의 틀과 올바른 행동 수칙을 명확히 제시하여, 아이가 혼란 없이 바르게 자라도록 규칙과 기반을 다져주는 성향입니다.`,
        firstFocusKeywords: ["일상 루틴", "명확한 경계", "행동 일관성"],
        easyToMissNote: "아이의 자발적인 선택과 유연한 감정 여백",
      },
    },
    parentingDifference: {
      title: isEn ? "Parenting Differences & Scenarios" : "아이 앞에서 우리 의견이 갈리면?",
      situations: [
        {
          situationTitle: "아이가 약속이나 생활 규칙을 어겼을 때",
          reactionA: `${nameA}님은 아이의 사정과 감정을 짚어주며 조율하려는 편`,
          reactionB: `${nameB}님은 규칙의 원칙과 일관성을 지키길 요구하는 편`,
        },
        {
          situationTitle: "아이가 실패하거나 정서적으로 불안해할 때",
          reactionA: `${nameA}님은 무조건적인 다독임과 감정 공감을 우선하는 편`,
          reactionB: `${nameB}님은 해결책 제시와 다음 행동 노하우를 건네는 편`,
        },
      ],
    },
    pairParentingSystem: {
      title: isEn ? "Pair Parenting System" : "아이에게 우리는 어떤 팀이 될까?",
      headline: "한 사람은 따뜻하게 품고 한 사람은 바른 길을 잡아주는 조화로운 양육 팀",
      ourStrengths: `${nameA}님과 ${nameB}님이 서로 다른 영역에서 강점을 발휘하여 아이가 정서적 온기와 현실적 규칙을 함께 경험할 수 있습니다.`,
      whatToWatchOut: "양육 방식의 차이가 아이 앞에서 직접적인 의견 대립으로 드러나지 않도록 부부 간 사전 조율이 필요합니다.",
      oneLineSynthesis: "두 부모가 각자의 시각으로 아이를 보호하므로, 서투른 부분은 채워주고 균형 잡힌 울타리를 만듭니다.",
    },
    familyLoadRedistribution: {
      title: isEn ? "Family Load Redistribution" : "가족을 위해 누가 더 많이 자기 삶을 조정할까?",
      pairRoles: [
        { roleKey: "SCHEDULE_FIRST_ADJUSTER", roleLabel: "일정을 먼저 조정하기 쉬운 쪽", personName: nameB },
        { roleKey: "FAMILY_PROBLEM_ABSORBER", roleLabel: "가족 문제를 자기 책임으로 가져가기 쉬운 쪽", personName: nameA },
        { roleKey: "PERSONAL_GOAL_PROTECTOR", roleLabel: "자기 일과 목표를 더 오래 지키려는 쪽", personName: nameA },
        { roleKey: "LATE_BURNOUT_RISK", roleLabel: "참다가 뒤늦게 지치기 쉬운 쪽", personName: nameB },
      ],
      oneLineSynthesis: "가족 이슈가 생겼을 때 한 쪽에게 비대칭적인 부담이 가중되지 않도록, 역할과 일정을 정기적으로 수평 재배치하는 것이 중요합니다.",
    },
    familyIdentity: {
      title: isEn ? "Family Identity & System Summary" : "결국 우리는 어떤 가족이 될까?",
      familyIdentityHeadline: `${nameA}님과 ${nameB}님이 만드는 가정을 둘러싼 건강한 독립성과 따뜻한 양육 파트너십`,
      coupleBoundarySummary: `${nameA}님과 ${nameB}님이 만나 새로운 가정을 이룰 때, 원가족과의 정서적 교감과 독립적인 부부 우선순위 사이에서 건강한 경계선을 형성해갑니다.`,
      giftToChildSummary: "한 사람은 따뜻하게 품고 한 사람은 바른 길을 잡아주는 조화로운 양육 팀",
      cautionSummary: "원가족의 기대와 부부의 필요가 충돌할 때, 양쪽 모두 서운함이 생기지 않도록 두 사람만의 경계선과 사전 소통 원칙을 먼저 세우는 것이 중요합니다.",
      familyStrengthSummary: `${nameA}님과 ${nameB}님이 서로 다른 영역에서 강점을 발휘하여 아이가 정서적 온기와 현실적 규칙을 함께 경험할 수 있습니다.`,
    },
  };
}
