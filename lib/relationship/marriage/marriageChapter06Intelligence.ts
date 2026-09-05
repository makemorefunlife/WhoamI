import type { MarriageRuleContext } from "./buildMarriageRuleContext";
import type { Locale } from "@/lib/i18n/config";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import { pick } from "./marriageCopy";
import { resolvePrimaryAxisValue } from "./marriageEvidenceResolution";
import { profileTenGods, type PersonTenGodProfile } from "./marriageTenGodAnalysis";

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
  psychA?: PsychMasterJson | null;
  psychB?: PsychMasterJson | null;
  locale?: Locale;
}): MarriageChapter06Intelligence {
  const { ctx, psychA, psychB, locale = "ko-KR" } = params;
  const isEn = locale === "en-US";

  const nameA = ctx.nicknameA;
  const nameB = ctx.nicknameB;

  const countsA = ctx.tenGod?.countsA ?? {};
  const countsB = ctx.tenGod?.countsB ?? {};

  // Family-level Ten God aggregates (재성/관성/식상/인성/비겁). `countsA`/`countsB`
  // are only ever keyed by SPECIFIC Ten God labels — every formula in this
  // file that needs a family total must read it from here (see the same fix
  // in marriageChapter05Intelligence.ts; `counts["관성"]`-style family-name
  // lookups against a specific-label-only map always silently resolve to 0).
  const tenGodProfileA: PersonTenGodProfile = profileTenGods(countsA);
  const tenGodProfileB: PersonTenGodProfile = profileTenGods(countsB);

  // `psychA?.traits` never existed on PsychMasterJson — the only real
  // source is secondary_axes. `connection`/`growth`/`adaptability` below
  // are PRIMARY-axis names, not secondary keys, so they're read via
  // resolvePrimaryAxisValue (the real SSOT-approved approximation) rather
  // than a raw lookup that always silently returns undefined -> 50.
  const psychAxesA = psychA?.secondary_axes ?? {};
  const psychAxesB = psychB?.secondary_axes ?? {};
  const connectionA = resolvePrimaryAxisValue(psychA, "connection");
  const connectionB = resolvePrimaryAxisValue(psychB, "connection");
  const growthPrimaryA = resolvePrimaryAxisValue(psychA, "growth");
  const growthPrimaryB = resolvePrimaryAxisValue(psychB, "growth");
  const adaptabilityA = resolvePrimaryAxisValue(psychA, "adaptability");
  const adaptabilityB = resolvePrimaryAxisValue(psychB, "adaptability");
  // `autonomy` has NO mapping anywhere in the product (see
  // marriageEvidenceResolution.ts) — every `psychAxesX.autonomy` reference
  // below is removed rather than substituted, so these scores rely only on
  // real Ten God + secondary-axis evidence instead of a value that always
  // silently resolved to the same neutral default for everyone.

  const bothLabel = pick(locale, "Both of you", "둘 다");
  const noEdgeLabel = pick(locale, "No clear lead", "뚜렷한 우위 없음");

  // Helper for abstention resolution. Default threshold raised from 1.5 to 2:
  // family counts are integers 0-3 (one entry per non-day pillar) and a
  // single un-weighted family count alone can contribute 1-1.5 points, so a
  // 1.5 gap used to be reachable from one weak Saju signal alone with no
  // psych support at all. 2.0 requires more than that single weak signal.
  const resolvePairPerson = (scoreA: number, scoreB: number, threshold = 2): string => {
    const diff = scoreA - scoreB;
    if (diff >= threshold) return nameA;
    if (diff <= -threshold) return nameB;
    if (Math.abs(diff) < 0.5) return bothLabel;
    return noEdgeLabel;
  };

  // ---------------------------------------------------------------------------
  // 01. COUPLE_BOUNDARY (결혼하면 우리는 얼마나 독립된 팀이 될까?)
  // ---------------------------------------------------------------------------
  const boundScoreA = tenGodProfileA.officer + tenGodProfileA.self * 1.5;
  const boundScoreB = tenGodProfileB.officer + tenGodProfileB.self * 1.5;

  const connScoreA = tenGodProfileA.seal * 1.5 + ((connectionA ?? 50) > 55 ? 2 : 0);
  const connScoreB = tenGodProfileB.seal * 1.5 + ((connectionB ?? 50) > 55 ? 2 : 0);

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
  const refuseA = tenGodProfileA.seal * 1.5 + tenGodProfileA.officer + ((connectionA ?? 50) > 55 ? 2 : 0) + ((psychAxesA.empathy ?? 50) > 55 ? 1 : 0);
  const refuseB = tenGodProfileB.seal * 1.5 + tenGodProfileB.officer + ((connectionB ?? 50) > 55 ? 2 : 0) + ((psychAxesB.empathy ?? 50) > 55 ? 1 : 0);

  // 2. SPOUSE_FIRST_PROTECTOR: Saju 比劫/官 + Psych decision_style (autonomy has no real derivation — see above)
  const protA = tenGodProfileA.self * 1.5 + tenGodProfileA.officer + ((psychAxesA.decision_style ?? 50) > 55 ? 1 : 0);
  const protB = tenGodProfileB.self * 1.5 + tenGodProfileB.officer + ((psychAxesB.decision_style ?? 50) > 55 ? 1 : 0);

  // 3. EARLY_BOUNDARY_SPEAKER: Saju 比劫/食傷 + Psych conflict_style (autonomy has no real derivation — see above)
  const spkA = tenGodProfileA.self + tenGodProfileA.food * 1.5 + ((psychAxesA.conflict_style ?? 50) > 55 ? 1.5 : 0);
  const spkB = tenGodProfileB.self + tenGodProfileB.food * 1.5 + ((psychAxesB.conflict_style ?? 50) > 55 ? 1.5 : 0);

  // 4. LONG_FAMILY_CONFLICT_CARRIER: Saju 印 + Psych empathy/resilience(low)
  const carA = tenGodProfileA.seal * 1.5 + ((psychAxesA.empathy ?? 50) > 55 ? 2 : 0) + ((psychAxesA.resilience ?? 50) < 45 ? 1.5 : 0);
  const carB = tenGodProfileB.seal * 1.5 + ((psychAxesB.empathy ?? 50) > 55 ? 2 : 0) + ((psychAxesB.resilience ?? 50) < 45 ? 1.5 : 0);

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
  const warmthA = tenGodProfileA.seal * 1.5 + tenGodProfileA.food + ((psychAxesA.empathy ?? 50) > 55 ? 2 : 0) + ((connectionA ?? 50) > 55 ? 1.5 : 0);
  const warmthB = tenGodProfileB.seal * 1.5 + tenGodProfileB.food + ((psychAxesB.empathy ?? 50) > 55 ? 2 : 0) + ((connectionB ?? 50) > 55 ? 1.5 : 0);

  const structA = tenGodProfileA.officer * 1.5 + tenGodProfileA.seal + ((psychAxesA.structure ?? 50) > 55 ? 2 : 0) + ((psychAxesA.self_control ?? 50) > 55 ? 1.5 : 0);
  const structB = tenGodProfileB.officer * 1.5 + tenGodProfileB.seal + ((psychAxesB.structure ?? 50) > 55 ? 2 : 0) + ((psychAxesB.self_control ?? 50) > 55 ? 1.5 : 0);

  // autonomy has no real derivation (see above) — dropped rather than substituted.
  const autoA = tenGodProfileA.self * 1.5 + tenGodProfileA.food + ((adaptabilityA ?? 50) > 55 ? 1.5 : 0);
  const autoB = tenGodProfileB.self * 1.5 + tenGodProfileB.food + ((adaptabilityB ?? 50) > 55 ? 1.5 : 0);

  const parentingGrowthA = tenGodProfileA.officer + tenGodProfileA.food * 1.5 + ((growthPrimaryA ?? 50) > 55 ? 2 : 0) + ((psychAxesA.decision_style ?? 50) > 55 ? 1.5 : 0);
  const parentingGrowthB = tenGodProfileB.officer + tenGodProfileB.food * 1.5 + ((growthPrimaryB ?? 50) > 55 ? 2 : 0) + ((psychAxesB.decision_style ?? 50) > 55 ? 1.5 : 0);

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
    profileA: buildParentingProfile(nameA, warmthA, structA, autoA, parentingGrowthA),
    profileB: buildParentingProfile(nameB, warmthB, structB, autoB, parentingGrowthB),
  };

  // ---------------------------------------------------------------------------
  // 04. PARENTING_DIFFERENCE (아이 앞에서 우리 의견이 갈리면?)
  // ---------------------------------------------------------------------------
  const structGap = Math.abs(structA - structB);
  const warmthGap = Math.abs(warmthA - warmthB);

  // Family counts are integers 0-3 and a single un-weighted family count
  // alone can contribute 1-1.5 points, so 1.5 used to be reachable from one
  // weak Saju signal with zero psych support. Requiring 2 keeps a single
  // weak signal from deciding a directional split on its own.
  const PARENTING_GAP_THRESHOLD = 2;

  const situations: SituationReaction[] = [];

  if (structGap >= PARENTING_GAP_THRESHOLD) {
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
    // structGap is small: the evidence does not distinguish them on this
    // axis, so this must not invent a directional split (the previous
    // version hardcoded nameA=gives-space / nameB=talks-it-through
    // regardless of either person's actual score — a fixed slot pattern,
    // not a finding). Describe the SHARED tendency instead, derived from
    // their (similar) average level, per Global Rule D: two people may
    // legitimately receive the same role.
    const avgStruct = (structA + structB) / 2;
    const sharedReaction = avgStruct > 3
      ? pick(locale, "tends to hold a calm, consistent line rather than negotiate in the moment", "그 자리에서 타협하기보다 차분하고 일관된 기준을 지키려는 편")
      : pick(locale, "tends to give the child room to settle their own feelings first", "먼저 아이 스스로 감정을 가라앉힐 여유를 주는 편");
    situations.push({
      situationTitle: pick(locale, "When the child throws a tantrum or won't budge", "아이가 떼를 쓰거나 고집을 부릴 때"),
      reactionA: isEn ? `${nameA} ${sharedReaction}` : `${nameA}님은 ${sharedReaction}`,
      reactionB: isEn ? `${nameB} ${sharedReaction}` : `${nameB}님은 ${sharedReaction}`,
    });
  }

  if (warmthGap >= PARENTING_GAP_THRESHOLD) {
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
    // warmthGap is small: same reasoning as above — parentingDna (the
    // evidence-based section) is the one place allowed to assert a
    // structure/boundary vs autonomy-support CONTRAST between the two
    // people. This section must not manufacture a second, unconditional
    // "nameA supports autonomy" half just to look balanced when the actual
    // warmth evidence doesn't distinguish them — that was the exact source
    // of the parentingDna-vs-parentingDifference contradiction (an
    // evidence-based "Sera = rules" claim sitting next to an unconditional,
    // non-evidential "Sera = supports autonomy" claim elsewhere).
    const avgWarmth = (warmthA + warmthB) / 2;
    const sharedReaction = avgWarmth > 3
      ? pick(locale, "tends to lead with encouragement and emotional reassurance before anything else", "무엇보다 먼저 격려와 정서적 안심을 앞세우는 편")
      : pick(locale, "tends to walk through the practical next step together rather than only reassuring", "안심시키는 것에 그치지 않고 실질적인 다음 단계를 함께 짚어보는 편");
    situations.push({
      situationTitle: pick(locale, "When the child faces a new challenge or an independent choice", "새로운 도전이나 독립적인 선택을 해야 할 때"),
      reactionA: isEn ? `${nameA} ${sharedReaction}` : `${nameA}님은 ${sharedReaction}`,
      reactionB: isEn ? `${nameB} ${sharedReaction}` : `${nameB}님은 ${sharedReaction}`,
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
  const schA = tenGodProfileA.seal + tenGodProfileA.officer + ((psychAxesA.empathy ?? 50) > 55 ? 2 : 0);
  const schB = tenGodProfileB.seal + tenGodProfileB.officer + ((psychAxesB.empathy ?? 50) > 55 ? 2 : 0);

  // 2. FAMILY_PROBLEM_ABSORBER: Saju 官/印 + Psych self_control/stability
  const absA = tenGodProfileA.officer * 1.5 + tenGodProfileA.seal + ((psychAxesA.self_control ?? 50) > 55 ? 2 : 0);
  const absB = tenGodProfileB.officer * 1.5 + tenGodProfileB.seal + ((psychAxesB.self_control ?? 50) > 55 ? 2 : 0);

  // 3. PERSONAL_GOAL_PROTECTOR: Saju 比劫/食傷 + Psych growth (autonomy has no real derivation — see above)
  const pgoA = tenGodProfileA.self * 1.5 + tenGodProfileA.food + ((growthPrimaryA ?? 50) > 55 ? 2 : 0);
  const pgoB = tenGodProfileB.self * 1.5 + tenGodProfileB.food + ((growthPrimaryB ?? 50) > 55 ? 2 : 0);

  // 4. LATE_BURNOUT_RISK: Saju 印 + Psych self_control / resilience(low)
  const bntA = tenGodProfileA.seal * 1.5 + ((psychAxesA.self_control ?? 50) > 55 ? 1.5 : 0) + ((psychAxesA.resilience ?? 50) < 45 ? 1.5 : 0);
  const bntB = tenGodProfileB.seal * 1.5 + ((psychAxesB.self_control ?? 50) > 55 ? 1.5 : 0) + ((psychAxesB.resilience ?? 50) < 45 ? 1.5 : 0);

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

/**
 * True missing-data fallback (no ctx/psych available — see
 * buildMarriageReportViewModel.ts, which now only reaches for this after
 * the canonical bundle's own chapter06Intelligence is genuinely absent).
 * With no evidence to read, every per-person role below is deliberately
 * SHARED/neutral rather than split between nameA and nameB.
 */
export function createDefaultMarriageChapter06Intelligence(params: {
  nameA: string;
  nameB: string;
  locale?: Locale;
}): MarriageChapter06Intelligence {
  const { nameA, nameB, locale = "ko-KR" } = params;
  const isEn = locale === "en-US";
  const sharedRoleLabel = pick(locale, "Not yet distinguished by person", "개인별로 아직 구분되지 않음");

  return {
    introQuestion: isEn
      ? "When parents and children enter our lives, who do we protect first and what kind of family system do we build?"
      : "부모와 아이까지 우리 삶에 들어오면, 우리는 누구를 먼저 지키고 어떤 부모가 될까?",
    coupleBoundary: {
      title: isEn ? "Couple Boundary & Independence" : "결혼하면 우리는 얼마나 독립된 팀이 될까?",
      profileA: {
        personName: nameA,
        editorialLabel: sharedRoleLabel,
        narrative: isEn
          ? "No person-specific evidence is available yet to say which of you leans more toward setting couple standards versus tracking family feelings."
          : "부부의 기준을 세우는 쪽과 가족의 마음을 살피는 쪽 중 누가 더 그런지 구분할 개인별 근거가 아직 없습니다.",
      },
      profileB: {
        personName: nameB,
        editorialLabel: sharedRoleLabel,
        narrative: isEn
          ? "No person-specific evidence is available yet to say which of you leans more toward setting couple standards versus tracking family feelings."
          : "부부의 기준을 세우는 쪽과 가족의 마음을 살피는 쪽 중 누가 더 그런지 구분할 개인별 근거가 아직 없습니다.",
      },
      boundarySynthesis: isEn
        ? `As ${nameA} and ${nameB} come together to build a new household, forming a healthy boundary between emotional closeness with your families of origin and your priorities as an independent couple is a shared task, not one person's role.`
        : `${nameA}님과 ${nameB}님이 만나 새로운 가정을 이룰 때, 원가족과의 정서적 교감과 독립적인 부부 우선순위 사이의 건강한 경계선은 한 사람의 역할이 아니라 두 사람이 함께 만들어가는 과제입니다.`,
    },
    originFamilyDynamics: {
      title: isEn ? "Origin Family Dynamics" : "시댁·처가 문제에서 누가 더 흔들릴까?",
      pairRoles: [],
      cautionMoment: isEn
        ? "When your families' expectations collide with what you need as a couple, it matters to set your own boundary and communication ground rules ahead of time so neither of you ends up hurt."
        : "원가족의 기대와 부부의 필요가 충돌할 때, 양쪽 모두 서운함이 생기지 않도록 두 사람만의 경계선과 사전 소통 원칙을 먼저 세우는 것이 중요합니다.",
    },
    parentingDna: {
      title: isEn ? "Parenting DNA" : "아이가 생기면 나는 어떤 부모가 될까?",
      profileA: {
        personName: nameA,
        editorialIdentity: sharedRoleLabel,
        narrative: isEn
          ? "No person-specific evidence is available yet to describe a distinct parenting style for this person."
          : "이 사람만의 구체적인 양육 성향을 설명할 근거가 아직 없습니다.",
        firstFocusKeywords: [],
        easyToMissNote: "",
      },
      profileB: {
        personName: nameB,
        editorialIdentity: sharedRoleLabel,
        narrative: isEn
          ? "No person-specific evidence is available yet to describe a distinct parenting style for this person."
          : "이 사람만의 구체적인 양육 성향을 설명할 근거가 아직 없습니다.",
        firstFocusKeywords: [],
        easyToMissNote: "",
      },
    },
    parentingDifference: {
      title: isEn ? "Parenting Differences & Scenarios" : "아이 앞에서 우리 의견이 갈리면?",
      situations: [],
    },
    pairParentingSystem: {
      title: isEn ? "Pair Parenting System" : "아이에게 우리는 어떤 팀이 될까?",
      headline: isEn ? "A parenting team whose specific balance isn't yet established" : "구체적인 균형이 아직 확인되지 않은 양육 팀",
      ourStrengths: isEn
        ? "Without more information, it's best to discover each of your parenting strengths together rather than assume a split."
        : "추가 정보 없이는, 역할이 나뉘어 있다고 짐작하기보다 각자의 양육 강점을 함께 찾아가는 것이 좋습니다.",
      whatToWatchOut: isEn
        ? "It helps to align on parenting differences ahead of time as a couple, so they don't surface as open disagreement in front of the child."
        : "양육 방식의 차이가 아이 앞에서 직접적인 의견 대립으로 드러나지 않도록 부부 간 사전 조율이 필요합니다.",
      oneLineSynthesis: isEn
        ? "Whatever blind spots exist, they're best found together rather than assigned in advance."
        : "어떤 서투른 부분이 있든, 미리 나누기보다 함께 찾아가는 것이 좋습니다.",
    },
    familyLoadRedistribution: {
      title: isEn ? "Family Load Redistribution" : "가족을 위해 누가 더 많이 자기 삶을 조정할까?",
      pairRoles: [],
      oneLineSynthesis: isEn
        ? "When a family issue comes up, it matters to regularly rebalance roles and schedules so the load doesn't lopsidedly pile onto one of you."
        : "가족 이슈가 생겼을 때 한 쪽에게 비대칭적인 부담이 가중되지 않도록, 역할과 일정을 정기적으로 수평 재배치하는 것이 중요합니다.",
    },
    familyIdentity: {
      title: isEn ? "Family Identity & System Summary" : "결국 우리는 어떤 가족이 될까?",
      familyIdentityHeadline: isEn
        ? `The family identity ${nameA} and ${nameB} build together`
        : `${nameA}님과 ${nameB}님이 함께 만들어가는 가정의 정체성`,
      coupleBoundarySummary: isEn
        ? `As ${nameA} and ${nameB} come together to build a new household, forming a healthy boundary is a shared task.`
        : `${nameA}님과 ${nameB}님이 만나 새로운 가정을 이룰 때, 건강한 경계선은 두 사람이 함께 만들어가는 과제입니다.`,
      giftToChildSummary: isEn ? "A parenting team whose specific balance isn't yet established." : "구체적인 균형이 아직 확인되지 않은 양육 팀",
      cautionSummary: isEn
        ? "When your families' expectations collide with what you need as a couple, it matters to set your own boundary and communication ground rules ahead of time."
        : "원가족의 기대와 부부의 필요가 충돌할 때, 두 사람만의 경계선과 사전 소통 원칙을 먼저 세우는 것이 중요합니다.",
      familyStrengthSummary: isEn
        ? `Whatever strengths ${nameA} and ${nameB} each bring are best discovered together rather than assumed in advance.`
        : `${nameA}님과 ${nameB}님 각자의 강점은 미리 짐작하기보다 함께 찾아가는 것이 좋습니다.`,
    },
  };
}
