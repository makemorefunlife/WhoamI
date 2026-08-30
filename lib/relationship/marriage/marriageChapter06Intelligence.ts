import type { MarriageRuleContext } from "./buildMarriageRuleContext";
import type { Locale } from "@/lib/i18n/config";
import { pick } from "./marriageCopy";

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

  const bothLabel = pick(locale, "Both of you", "둘 다");
  const noEdgeLabel = pick(locale, "No clear lead", "뚜렷한 우위 없음");

  // Helper for abstention resolution
  const resolvePairPerson = (scoreA: number, scoreB: number, threshold = 1.5): string => {
    const diff = scoreA - scoreB;
    if (diff >= threshold) return nameA;
    if (diff <= -threshold) return nameB;
    if (Math.abs(diff) < 0.5) return bothLabel;
    return noEdgeLabel;
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
        editorialLabel: pick(locale, "Sets the couple's standards first", "부부의 기준을 먼저 세우는 편"),
        narrative: pick(
          locale,
          `${name} tends to protect the standards the two of you agreed on and the couple's autonomy above either family's expectations or outside opinion.`,
          `${name}님은 양가의 기대나 주변의 시선보다 두 사람이 합의한 기준과 부부의 자율성을 최우선으로 지켜내려는 편입니다.`,
        ),
      };
    } else if (cScore >= bScore + 1.0) {
      return {
        personName: name,
        editorialLabel: pick(locale, "Watches out for the family's feelings too", "가족의 마음까지 함께 살피는 편"),
        narrative: pick(
          locale,
          `${name} carefully tracks the emotional undercurrents and needs of their family of origin, working to keep those ties in harmony.`,
          `${name}님은 원가족의 정서적 흐름과 부모의 필요를 세심히 살피며 도의적 연결고리를 조화롭게 챙기려는 편입니다.`,
        ),
      };
    } else {
      return {
        personName: name,
        editorialLabel: pick(locale, "Protects a firm boundary around 'us'", "단단한 우리 울타리를 지키는 편"),
        narrative: pick(
          locale,
          `${name} tends to balance distance from their family of origin with the couple's own independence, depending on the situation.`,
          `${name}님은 현실적인 상황에 따라 원가족과의 거리감과 부부 내부의 독립성을 균형 있게 조율해나가는 편입니다.`,
        ),
      };
    }
  };

  const coupleBoundary: CoupleBoundarySection = {
    title: isEn ? "Couple Boundary & Independence" : "결혼하면 우리는 얼마나 독립된 팀이 될까?",
    profileA: getBoundaryProfile(nameA, boundScoreA, connScoreA),
    profileB: getBoundaryProfile(nameB, boundScoreB, connScoreB),
    boundarySynthesis: pick(
      locale,
      `As ${nameA} and ${nameB} come together to build a new household, you'll form a healthy boundary between emotional closeness with your families of origin and your priorities as an independent couple.`,
      `${nameA}님과 ${nameB}님이 만나 새로운 가정을 이룰 때, 원가족과의 정서적 교감과 독립적인 부부 우선순위 사이에서 건강한 경계선을 형성해갑니다.`,
    ),
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
    { roleKey: "HARD_TO_REFUSE_PARENTS", roleLabel: pick(locale, "The one who finds it hard to say no to their parents", "부모의 부탁을 거절하기 어려운 쪽"), personName: resolvePairPerson(refuseA, refuseB) },
    { roleKey: "SPOUSE_FIRST_PROTECTOR", roleLabel: pick(locale, "The one who takes their spouse's side first", "배우자 편을 먼저 지키는 쪽"), personName: resolvePairPerson(protA, protB) },
    { roleKey: "EARLY_BOUNDARY_SPEAKER", roleLabel: pick(locale, "The one who names a boundary first", "경계를 먼저 말하는 쪽"), personName: resolvePairPerson(spkA, spkB) },
    { roleKey: "LONG_FAMILY_CONFLICT_CARRIER", roleLabel: pick(locale, "The one who carries family tension the longest", "가족 갈등을 오래 담는 쪽"), personName: resolvePairPerson(carA, carB) },
  ];

  const originFamilyDynamics: OriginFamilyDynamicsSection = {
    title: isEn ? "Origin Family Dynamics" : "시댁·처가 문제에서 누가 더 흔들릴까?",
    pairRoles: pairRoles02,
    cautionMoment: pick(
      locale,
      "When your families' expectations collide with what you need as a couple, it matters to set your own boundary and communication ground rules ahead of time so neither of you ends up hurt.",
      "원가족의 기대와 부부의 필요가 충돌할 때, 양쪽 모두 서운함이 생기지 않도록 두 사람만의 경계선과 사전 소통 원칙을 먼저 세우는 것이 중요합니다.",
    ),
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
        editorialIdentity: pick(locale, "A parent who reads the child's heart first", "아이의 마음과 감정을 먼저 읽는 부모"),
        narrative: pick(
          locale,
          `${name} tends to pick up on the child's mood and emotional needs fastest and most sensitively, offering warm acceptance and reassurance first.`,
          `${name}님은 아이의 기분과 정서적 필요를 가장 빠르고 섬세하게 알아차려, 따뜻한 수용과 안도감을 먼저 제공하려는 성향입니다.`,
        ),
        firstFocusKeywords: isEn ? ["Emotional acceptance", "Emotional stability", "Warm empathy"] : ["감정 수용", "정서적 안정", "따뜻한 공감"],
        easyToMissNote: pick(locale, "May find it harder to draw a clear line when the situation calls for one", "상황에 따라 명확하게 선을 그어주는 규칙 수용 한계"),
      };
    } else if (maxVal === sScore) {
      return {
        personName: name,
        editorialIdentity: pick(locale, "A parent who sets rules and consistent standards", "규칙과 일관된 기준을 세워주는 부모"),
        narrative: pick(
          locale,
          `${name} clearly lays out everyday structure and the right way to behave, building the rules and foundation for the child to grow up without confusion.`,
          `${name}님은 일상의 틀과 올바른 행동 수칙을 명확히 제시하여, 아이가 혼란 없이 바르게 자라도록 규칙과 기반을 다져주는 성향입니다.`,
        ),
        firstFocusKeywords: isEn ? ["Daily routine", "Clear boundaries", "Consistent behavior"] : ["일상 루틴", "명확한 경계", "행동 일관성"],
        easyToMissNote: pick(locale, "May leave less room for the child's own spontaneous choices and emotional flexibility", "아이의 자발적인 선택과 유연한 감정 여백"),
      };
    } else if (maxVal === aScore) {
      return {
        personName: name,
        editorialIdentity: pick(locale, "A parent who gives room to try and choose independently", "스스로 겪고 선택하도록 터전을 주는 부모"),
        narrative: pick(
          locale,
          `${name} guarantees space for the child to try things by their own will, learn through trial and error, and figure things out for themselves.`,
          `${name}님은 아이가 자신의 의지로 시도하고 시행착오를 겪으며 스스로 깨달아갈 수 있도록 독립적인 선택 공간을 보장해주는 성향입니다.`,
        ),
        firstFocusKeywords: isEn ? ["Independent choice", "Room to fail", "Independence"] : ["자율 선택", "실패 경험 허용", "독립심"],
        easyToMissNote: pick(locale, "May be slower to step in with immediate boundaries or a tight safety net", "즉각적인 울타리와 세밀한 안전망 대처"),
      };
    } else {
      return {
        personName: name,
        editorialIdentity: pick(locale, "A parent who draws out growth and new challenges", "도전과 성장의 가능성을 끌어내어 주는 부모"),
        narrative: pick(
          locale,
          `${name} motivates and pushes the child to go beyond their limits, develop their abilities, and take on new challenges.`,
          `${name}님은 아이가 자신의 한계를 넘어 능력을 발휘하고 새로운 도전을 성취해 나가도록 자극과 동기를 부여해주는 성향입니다.`,
        ),
        firstFocusKeywords: isEn ? ["Growth goals", "Achievement", "Guiding potential"] : ["성장 목표", "성취 경험", "잠재력 인도"],
        easyToMissNote: pick(locale, "May move to the next goal before pausing to acknowledge feelings or simply rest", "결과 이전의 마음 인정과 편안하게 쉬어감"),
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
      situationTitle: pick(locale, "When the child breaks a promise or a household rule", "아이가 약속이나 생활 규칙을 어겼을 때"),
      reactionA: structA > structB
        ? pick(locale, `${nameA} tends to insist on holding the rule's principle and consistency`, `${nameA}님은 규칙의 원칙과 일관성을 지키길 요구하는 편`)
        : pick(locale, `${nameA} tends to work it out by considering the child's circumstances and feelings`, `${nameA}님은 아이의 사정과 감정을 짚어주며 조율하려는 편`),
      reactionB: structB > structA
        ? pick(locale, `${nameB} tends to insist on holding the rule's principle and consistency`, `${nameB}님은 규칙의 원칙과 일관성을 지키길 요구하는 편`)
        : pick(locale, `${nameB} tends to work it out by considering the child's circumstances and feelings`, `${nameB}님은 아이의 사정과 감정을 짚어주며 조율하려는 편`),
    });
  } else {
    situations.push({
      situationTitle: pick(locale, "When the child throws a tantrum or won't budge", "아이가 떼를 쓰거나 고집을 부릴 때"),
      reactionA: pick(locale, `${nameA} tends to give the child time to settle their own emotions`, `${nameA}님은 스스로 감정을 다스릴 시간을 주는 편`),
      reactionB: pick(locale, `${nameB} tends to work through it with conversation and comforting`, `${nameB}님은 대화와 달램으로 상황을 풀어가는 편`),
    });
  }

  if (warmthGap >= 1.5) {
    situations.push({
      situationTitle: pick(locale, "When the child fails at something or feels emotionally unsteady", "아이가 실패하거나 정서적으로 불안해할 때"),
      reactionA: warmthA > warmthB
        ? pick(locale, `${nameA} tends to prioritize unconditional comfort and emotional empathy`, `${nameA}님은 무조건적인 다독임과 감정 공감을 우선하는 편`)
        : pick(locale, `${nameA} tends to offer a solution and know-how for the next step`, `${nameA}님은 해결책 제시와 다음 행동 노하우를 건네는 편`),
      reactionB: warmthB > warmthA
        ? pick(locale, `${nameB} tends to prioritize unconditional comfort and emotional empathy`, `${nameB}님은 무조건적인 다독임과 감정 공감을 우선하는 편`)
        : pick(locale, `${nameB} tends to offer a solution and know-how for the next step`, `${nameB}님은 해결책 제시와 다음 행동 노하우를 건네는 편`),
    });
  } else {
    situations.push({
      situationTitle: pick(locale, "When the child faces a new challenge or an independent choice", "새로운 도전이나 독립적인 선택을 해야 할 때"),
      reactionA: pick(locale, `${nameA} tends to support the child's own independent decision`, `${nameA}님은 아이의 자율적 결정을 지지하는 편`),
      reactionB: pick(locale, `${nameB} tends to advise checking things over first and building a safety net`, `${nameB}님은 사전 점검과 안전망 구축을 조언하는 편`),
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
    headline = pick(locale, "A balanced parenting team where one holds warmth and the other holds the right path", "한 사람은 따뜻하게 품고 한 사람은 바른 길을 잡아주는 조화로운 양육 팀");
    strengths = pick(
      locale,
      `${nameA} and ${nameB} each bring strength in a different area, so the child gets to experience both emotional warmth and real-world structure.`,
      `${nameA}님과 ${nameB}님이 서로 다른 영역에서 강점을 발휘하여 아이가 정서적 온기와 현실적 규칙을 함께 경험할 수 있습니다.`,
    );
    watchOut = pick(
      locale,
      "It helps to align on parenting differences ahead of time as a couple, so they don't surface as open disagreement in front of the child.",
      "양육 방식의 차이가 아이 앞에서 직접적인 의견 대립으로 드러나지 않도록 부부 간 사전 조율이 필요합니다.",
    );
    pairOneLine = pick(
      locale,
      "Because each parent watches over the child from their own angle, you fill in each other's blind spots and build a well-balanced boundary.",
      "두 부모가 각자의 시각으로 아이를 보호하므로, 서투른 부분은 채워주고 균형 잡힌 울타리를 만듭니다.",
    );
  } else {
    headline = pick(locale, "A solid parenting partnership offering the child consistent values and a stable environment", "아이에게 일관된 가치관과 안정적인 환경을 제공하는 단단한 양육 파트너십");
    strengths = pick(
      locale,
      "Your parenting standards and sense of what matters line up closely, making it easy for the child to feel secure in a consistent, predictable environment.",
      "두 부모의 양육 기준과 공감대가 일치하여 아이가 일관되고 예측 가능한 환경에서 안정감을 느끼기 쉽습니다.",
    );
    watchOut = pick(
      locale,
      "If a shared blind spot shows up (like being too strict or too permissive together), it's worth checking in on how flexible your approach really is.",
      "두 사람의 공통적인 양육 맹점이 생길 경우(예: 과도한 엄격함 또는 과도한 허용), 유연한 조율 과정을 점검하는 것이 좋습니다.",
    );
    pairOneLine = pick(
      locale,
      "Your shared sense of values is strong, giving you the kind of teamwork that builds a trustworthy home base for the child.",
      "가치관의 통일성이 강하여 아이에게 신뢰감 있는 보금자리를 만들어주는 팀워크를 발휘합니다.",
    );
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
    { roleKey: "SCHEDULE_FIRST_ADJUSTER", roleLabel: pick(locale, "The one more likely to adjust their schedule first", "일정을 먼저 조정하기 쉬운 쪽"), personName: resolvePairPerson(schA, schB) },
    { roleKey: "FAMILY_PROBLEM_ABSORBER", roleLabel: pick(locale, "The one more likely to take family problems on as their own", "가족 문제를 자기 책임으로 가져가기 쉬운 쪽"), personName: resolvePairPerson(absA, absB) },
    { roleKey: "PERSONAL_GOAL_PROTECTOR", roleLabel: pick(locale, "The one who holds onto their own work and goals longer", "자기 일과 목표를 더 오래 지키려는 쪽"), personName: resolvePairPerson(pgoA, pgoB) },
    { roleKey: "LATE_BURNOUT_RISK", roleLabel: pick(locale, "The one more likely to endure quietly and burn out later", "참다가 뒤늦게 지치기 쉬운 쪽"), personName: resolvePairPerson(bntA, bntB) },
  ];

  const familyLoadRedistribution: FamilyLoadRedistributionSection = {
    title: isEn ? "Family Load Redistribution" : "가족을 위해 누가 더 많이 자기 삶을 조정할까?",
    pairRoles: pairRoles06,
    oneLineSynthesis: pick(
      locale,
      "When a family issue comes up, it matters to regularly rebalance roles and schedules so the load doesn't lopsidedly pile onto one of you.",
      "가족 이슈가 생겼을 때 한 쪽에게 비대칭적인 부담이 가중되지 않도록, 역할과 일정을 정기적으로 수평 재배치하는 것이 중요합니다.",
    ),
  };

  // ---------------------------------------------------------------------------
  // 07. FAMILY_IDENTITY (결국 우리는 어떤 가족이 될까?)
  // ---------------------------------------------------------------------------
  const familyIdentity: FamilyIdentitySection = {
    title: isEn ? "Family Identity & System Summary" : "결국 우리는 어떤 가족이 될까?",
    familyIdentityHeadline: pick(
      locale,
      `A healthy independence and a warm parenting partnership around the family ${nameA} and ${nameB} build together`,
      `${nameA}님과 ${nameB}님이 만드는 가정을 둘러싼 건강한 독립성과 따뜻한 양육 파트너십`,
    ),
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
        editorialLabel: pick(locale, "Sets the couple's standards first", "부부의 기준을 먼저 세우는 편"),
        narrative: pick(
          locale,
          `${nameA} tends to protect the standards the two of you agreed on and the couple's autonomy above either family's expectations or outside opinion.`,
          `${nameA}님은 양가의 기대나 주변의 시선보다 두 사람이 합의한 기준과 부부의 자율성을 최우선으로 지켜내려는 편입니다.`,
        ),
      },
      profileB: {
        personName: nameB,
        editorialLabel: pick(locale, "Watches out for the family's feelings too", "가족의 마음까지 함께 살피는 편"),
        narrative: pick(
          locale,
          `${nameB} carefully tracks the emotional undercurrents and needs of their family of origin, working to keep those ties in harmony.`,
          `${nameB}님은 원가족의 정서적 흐름과 부모의 필요를 세심히 살피며 도의적 연결고리를 조화롭게 챙기려는 편입니다.`,
        ),
      },
      boundarySynthesis: pick(
        locale,
        `As ${nameA} and ${nameB} come together to build a new household, you'll form a healthy boundary between emotional closeness with your families of origin and your priorities as an independent couple.`,
        `${nameA}님과 ${nameB}님이 만나 새로운 가정을 이룰 때, 원가족과의 정서적 교감과 독립적인 부부 우선순위 사이에서 건강한 경계선을 형성해갑니다.`,
      ),
    },
    originFamilyDynamics: {
      title: isEn ? "Origin Family Dynamics" : "시댁·처가 문제에서 누가 더 흔들릴까?",
      pairRoles: [
        { roleKey: "HARD_TO_REFUSE_PARENTS", roleLabel: pick(locale, "The one who finds it hard to say no to their parents", "부모의 부탁을 거절하기 어려운 쪽"), personName: nameB },
        { roleKey: "SPOUSE_FIRST_PROTECTOR", roleLabel: pick(locale, "The one who takes their spouse's side first", "배우자 편을 먼저 지키는 쪽"), personName: nameA },
        { roleKey: "EARLY_BOUNDARY_SPEAKER", roleLabel: pick(locale, "The one who names a boundary first", "경계를 먼저 말하는 쪽"), personName: nameA },
        { roleKey: "LONG_FAMILY_CONFLICT_CARRIER", roleLabel: pick(locale, "The one who carries family tension the longest", "가족 갈등을 오래 담는 쪽"), personName: nameB },
      ],
      cautionMoment: pick(
        locale,
        "When your families' expectations collide with what you need as a couple, it matters to set your own boundary and communication ground rules ahead of time so neither of you ends up hurt.",
        "원가족의 기대와 부부의 필요가 충돌할 때, 양쪽 모두 서운함이 생기지 않도록 두 사람만의 경계선과 사전 소통 원칙을 먼저 세우는 것이 중요합니다.",
      ),
    },
    parentingDna: {
      title: isEn ? "Parenting DNA" : "아이가 생기면 나는 어떤 부모가 될까?",
      profileA: {
        personName: nameA,
        editorialIdentity: pick(locale, "A parent who reads the child's heart first", "아이의 마음과 감정을 먼저 읽는 부모"),
        narrative: pick(
          locale,
          `${nameA} tends to pick up on the child's mood and emotional needs fastest and most sensitively, offering warm acceptance and reassurance first.`,
          `${nameA}님은 아이의 기분과 정서적 필요를 가장 빠르고 섬세하게 알아차려, 따뜻한 수용과 안도감을 먼저 제공하려는 성향입니다.`,
        ),
        firstFocusKeywords: isEn ? ["Emotional acceptance", "Emotional stability", "Warm empathy"] : ["감정 수용", "정서적 안정", "따뜻한 공감"],
        easyToMissNote: pick(locale, "May find it harder to draw a clear line when the situation calls for one", "상황에 따라 명확하게 선을 그어주는 규칙 수용 한계"),
      },
      profileB: {
        personName: nameB,
        editorialIdentity: pick(locale, "A parent who sets rules and consistent standards", "규칙과 일관된 기준을 세워주는 부모"),
        narrative: pick(
          locale,
          `${nameB} clearly lays out everyday structure and the right way to behave, building the rules and foundation for the child to grow up without confusion.`,
          `${nameB}님은 일상의 틀과 올바른 행동 수칙을 명확히 제시하여, 아이가 혼란 없이 바르게 자라도록 규칙과 기반을 다져주는 성향입니다.`,
        ),
        firstFocusKeywords: isEn ? ["Daily routine", "Clear boundaries", "Consistent behavior"] : ["일상 루틴", "명확한 경계", "행동 일관성"],
        easyToMissNote: pick(locale, "May leave less room for the child's own spontaneous choices and emotional flexibility", "아이의 자발적인 선택과 유연한 감정 여백"),
      },
    },
    parentingDifference: {
      title: isEn ? "Parenting Differences & Scenarios" : "아이 앞에서 우리 의견이 갈리면?",
      situations: [
        {
          situationTitle: pick(locale, "When the child breaks a promise or a household rule", "아이가 약속이나 생활 규칙을 어겼을 때"),
          reactionA: pick(locale, `${nameA} tends to work it out by considering the child's circumstances and feelings`, `${nameA}님은 아이의 사정과 감정을 짚어주며 조율하려는 편`),
          reactionB: pick(locale, `${nameB} tends to insist on holding the rule's principle and consistency`, `${nameB}님은 규칙의 원칙과 일관성을 지키길 요구하는 편`),
        },
        {
          situationTitle: pick(locale, "When the child fails at something or feels emotionally unsteady", "아이가 실패하거나 정서적으로 불안해할 때"),
          reactionA: pick(locale, `${nameA} tends to prioritize unconditional comfort and emotional empathy`, `${nameA}님은 무조건적인 다독임과 감정 공감을 우선하는 편`),
          reactionB: pick(locale, `${nameB} tends to offer a solution and know-how for the next step`, `${nameB}님은 해결책 제시와 다음 행동 노하우를 건네는 편`),
        },
      ],
    },
    pairParentingSystem: {
      title: isEn ? "Pair Parenting System" : "아이에게 우리는 어떤 팀이 될까?",
      headline: pick(locale, "A balanced parenting team where one holds warmth and the other holds the right path", "한 사람은 따뜻하게 품고 한 사람은 바른 길을 잡아주는 조화로운 양육 팀"),
      ourStrengths: pick(
        locale,
        `${nameA} and ${nameB} each bring strength in a different area, so the child gets to experience both emotional warmth and real-world structure.`,
        `${nameA}님과 ${nameB}님이 서로 다른 영역에서 강점을 발휘하여 아이가 정서적 온기와 현실적 규칙을 함께 경험할 수 있습니다.`,
      ),
      whatToWatchOut: pick(
        locale,
        "It helps to align on parenting differences ahead of time as a couple, so they don't surface as open disagreement in front of the child.",
        "양육 방식의 차이가 아이 앞에서 직접적인 의견 대립으로 드러나지 않도록 부부 간 사전 조율이 필요합니다.",
      ),
      oneLineSynthesis: pick(
        locale,
        "Because each parent watches over the child from their own angle, you fill in each other's blind spots and build a well-balanced boundary.",
        "두 부모가 각자의 시각으로 아이를 보호하므로, 서투른 부분은 채워주고 균형 잡힌 울타리를 만듭니다.",
      ),
    },
    familyLoadRedistribution: {
      title: isEn ? "Family Load Redistribution" : "가족을 위해 누가 더 많이 자기 삶을 조정할까?",
      pairRoles: [
        { roleKey: "SCHEDULE_FIRST_ADJUSTER", roleLabel: pick(locale, "The one more likely to adjust their schedule first", "일정을 먼저 조정하기 쉬운 쪽"), personName: nameB },
        { roleKey: "FAMILY_PROBLEM_ABSORBER", roleLabel: pick(locale, "The one more likely to take family problems on as their own", "가족 문제를 자기 책임으로 가져가기 쉬운 쪽"), personName: nameA },
        { roleKey: "PERSONAL_GOAL_PROTECTOR", roleLabel: pick(locale, "The one who holds onto their own work and goals longer", "자기 일과 목표를 더 오래 지키려는 쪽"), personName: nameA },
        { roleKey: "LATE_BURNOUT_RISK", roleLabel: pick(locale, "The one more likely to endure quietly and burn out later", "참다가 뒤늦게 지치기 쉬운 쪽"), personName: nameB },
      ],
      oneLineSynthesis: pick(
        locale,
        "When a family issue comes up, it matters to regularly rebalance roles and schedules so the load doesn't lopsidedly pile onto one of you.",
        "가족 이슈가 생겼을 때 한 쪽에게 비대칭적인 부담이 가중되지 않도록, 역할과 일정을 정기적으로 수평 재배치하는 것이 중요합니다.",
      ),
    },
    familyIdentity: {
      title: isEn ? "Family Identity & System Summary" : "결국 우리는 어떤 가족이 될까?",
      familyIdentityHeadline: pick(
        locale,
        `A healthy independence and a warm parenting partnership around the family ${nameA} and ${nameB} build together`,
        `${nameA}님과 ${nameB}님이 만드는 가정을 둘러싼 건강한 독립성과 따뜻한 양육 파트너십`,
      ),
      coupleBoundarySummary: pick(
        locale,
        `As ${nameA} and ${nameB} come together to build a new household, you'll form a healthy boundary between emotional closeness with your families of origin and your priorities as an independent couple.`,
        `${nameA}님과 ${nameB}님이 만나 새로운 가정을 이룰 때, 원가족과의 정서적 교감과 독립적인 부부 우선순위 사이에서 건강한 경계선을 형성해갑니다.`,
      ),
      giftToChildSummary: pick(locale, "A balanced parenting team where one holds warmth and the other holds the right path", "한 사람은 따뜻하게 품고 한 사람은 바른 길을 잡아주는 조화로운 양육 팀"),
      cautionSummary: pick(
        locale,
        "When your families' expectations collide with what you need as a couple, it matters to set your own boundary and communication ground rules ahead of time so neither of you ends up hurt.",
        "원가족의 기대와 부부의 필요가 충돌할 때, 양쪽 모두 서운함이 생기지 않도록 두 사람만의 경계선과 사전 소통 원칙을 먼저 세우는 것이 중요합니다.",
      ),
      familyStrengthSummary: pick(
        locale,
        `${nameA} and ${nameB} each bring strength in a different area, so the child gets to experience both emotional warmth and real-world structure.`,
        `${nameA}님과 ${nameB}님이 서로 다른 영역에서 강점을 발휘하여 아이가 정서적 온기와 현실적 규칙을 함께 경험할 수 있습니다.`,
      ),
    },
  };
}
