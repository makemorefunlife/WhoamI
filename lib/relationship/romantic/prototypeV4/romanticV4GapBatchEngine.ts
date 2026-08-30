import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import { josaIGa, josaEunNeun, josaRo } from "./romanticLanguage";
import { pick, type NarrativeLocale } from "./narrativeLocale";

export type RomanticRoleType =
  | "emotional_anchor"
  | "initiator"
  | "practical_stabilizer"
  | "affection_initiator"
  | "repair_initiator"
  | "autonomy_keeper"
  | "relationship_regulator";

export type RelationalRoleMatrix = {
  roleA: { type: RomanticRoleType; title: string; description: string };
  roleB: { type: RomanticRoleType; title: string; description: string };
  complement: string;
  collision: string;
  overFunctionRisk: string;
  underFunctionRisk: string;
};

export type BidirectionalGrowth = {
  aLearnsFromB: string;
  bLearnsFromA: string;
};

export type Chapter06RolePowerVulnerability = {
  greatestStrength: string;
  greatestVulnerability: string;
  depletionPattern: string;
  roleMatrix: RelationalRoleMatrix;
  growth: BidirectionalGrowth;
};

export type WantedVsGivenLoveDetail = {
  personName: string;
  partnerName: string;
  wantedLove: string;
  givenLove: string;
  partnerReception: string;
};

export type WantedVsGivenLovePair = {
  loveA: WantedVsGivenLoveDetail;
  loveB: WantedVsGivenLoveDetail;
  matchStatus: "MATCHED" | "PARTIALLY_MATCHED" | "MISALIGNED";
  summary: string;
};

export type WhatNotToExpect = {
  notToExpectAFromB: { title: string; reason: string }[];
  notToExpectBFromA: { title: string; reason: string }[];
};

export type WhenWeNeedEachOtherMost = {
  whenANeedsB: { sceneTitle: string; concreteContext: string }[];
  whenBNeedsA: { sceneTitle: string; concreteContext: string }[];
};

export type RomanticSosScriptDetail = {
  seekerName: string;
  providerName: string;
  trigger: string;
  doNot: string;
  firstLine: string;
  bridgeLine: string;
  reconnectionLine: string;
};

export type EmergencyRomanticSosScripts = {
  sosAtoB: RomanticSosScriptDetail;
  sosBtoA: RomanticSosScriptDetail;
};

export type LongTermRelationshipBondPrescription = {
  keepDoing: string[];
  watchOut: string[];
  relationshipRitual: string[];
};

export type ConflictStateTransition = {
  personName: string;
  normalState: string;
  tensionRising: string;
  overloadState: string;
  recoveryState: string;
  canonicalSummary: string;
};

/**
 * Final Evidence-to-Voice pass, item 1 — computeConflictStateTransition's
 * Pattern 4 (Harmony Adapter) is an unconditional fallback: anyone who
 * doesn't clear Patterns 1-3 lands here with the SAME fixed text, regardless
 * of how similar or different their actual psych scores are. When both
 * people in a pair land in Pattern 4, that previously produced two
 * byte-identical person cards with no evidence check at all.
 *
 * sharedBaseline is non-null only when both people are confirmed Pattern-4
 * AND a secondary check (self_control / thinking_style / decision_style —
 * axes Patterns 1-3 don't already gate on) finds no meaningful gap between
 * them: in that case the shared line is the honest, evidence-checked
 * output, not an unexamined accident. When a secondary gap IS found, the
 * two people get differentiated tension/overload/recovery text instead
 * (see computeConflictStateTransitionPair) and sharedBaseline stays null.
 */
export type ConflictStateTransitionPair = {
  /** Non-null only when both people are Pattern-4 AND no secondary gap was
   * found — the deliberate, evidence-checked "we're genuinely alike here"
   * case, not a silently-collapsed fallback. */
  sharedBaseline: string | null;
  transitionA: ConflictStateTransition;
  transitionB: ConflictStateTransition;
  /** True only when both people are confirmed Pattern-4 AND a real
   * secondary-axis gap differentiated their tension/overload/recovery text
   * (the middle case, distinct from both sharedBaseline-set and from either
   * person clearing Pattern 1-3 on their own). Exposed so callers (e.g. the
   * recognition synthesis layer) can build a "shared goal, different
   * strategy" insight without re-deriving this threshold check themselves. */
  wasHarmonyDifferentiated: boolean;
};

export type PhysicalIntimacyDetail = {
  desiredClosenessA: string;
  desiredClosenessB: string;
  tempoMatch: "MATCHED" | "PARTIALLY_MATCHED" | "TEMPO_GAP";
  spaceNeed: string;
  summary: string;
};

export type RomanticGapBatchOutput = {
  chapter06: Chapter06RolePowerVulnerability;
  wantedVsGivenLove: WantedVsGivenLovePair;
  whatNotToExpect: WhatNotToExpect;
  whenWeNeedEachOtherMost: WhenWeNeedEachOtherMost;
  emergencySos: EmergencyRomanticSosScripts;
  longTermBond: LongTermRelationshipBondPrescription;
  physicalIntimacy: PhysicalIntimacyDetail;
  conflictTransitions: ConflictStateTransitionPair;
};

const ROLE_TITLES_KO: Record<RomanticRoleType, { title: string; desc: string }> = {
  emotional_anchor: {
    title: "정서적 안식처 (Emotional Anchor)",
    desc: "관계가 흔들릴 때 변함없는 체온과 포용으로 상대를 감싸안는 따뜻한 버팀목",
  },
  initiator: {
    title: "관계의 추동자 (Initiator)",
    desc: "데이트 계획과 미래 비전을 제시하고 새로운 경험과 자극으로 관계를 이끄는 나침반",
  },
  practical_stabilizer: {
    title: "현실적 밸런서 (Practical Stabilizer)",
    desc: "감정에 치우치지 않고 현실적인 조언과 안정적인 체계로 연애의 울타리를 다지는 조정자",
  },
  affection_initiator: {
    title: "애정 표현기 (Affection Initiator)",
    desc: "다정한 표현과 먼저 다가가는 솔직함으로 관계의 온도를 올리는 표현의 리더",
  },
  repair_initiator: {
    title: "화해와 해소의 가교 (Repair Initiator)",
    desc: "마찰 발생 시 자존심보다 관계를 아끼며 먼저 손을 내밀고 대화를 여는 평화 유지자",
  },
  autonomy_keeper: {
    title: "자율의 수호자 (Autonomy Keeper)",
    desc: "서로의 건강한 경계와 개인 공간을 지키며 과밀착을 방지하는 독립성의 기둥",
  },
  relationship_regulator: {
    title: "관계 리듬 조율자 (Relationship Regulator)",
    desc: "소통의 주파수와 갈등의 템포를 조절하며 서두르지 않고 깊이 있는 동반을 유지하는 조율사",
  },
};

const ROLE_TITLES_EN: Record<RomanticRoleType, { title: string; desc: string }> = {
  emotional_anchor: {
    title: "Emotional Anchor",
    desc: "the warm support who wraps their partner in steady warmth and acceptance when the relationship wobbles",
  },
  initiator: {
    title: "Initiator",
    desc: "the compass who proposes dates and a future vision, leading the relationship with new experiences and spark",
  },
  practical_stabilizer: {
    title: "Practical Stabilizer",
    desc: "the steady hand who builds a solid foundation for the relationship with grounded advice, not swayed by emotion",
  },
  affection_initiator: {
    title: "Affection Initiator",
    desc: "the expressive lead who raises the relationship's warmth through open affection and reaching out first",
  },
  repair_initiator: {
    title: "Repair Initiator",
    desc: "the peacekeeper who values the relationship over pride when friction hits, reaching out first to open the conversation",
  },
  autonomy_keeper: {
    title: "Autonomy Keeper",
    desc: "the pillar of independence who protects healthy boundaries and personal space, guarding against over-enmeshment",
  },
  relationship_regulator: {
    title: "Relationship Regulator",
    desc: "the pacesetter who tunes the frequency of communication and the tempo of conflict, keeping the bond unhurried and deep",
  },
};

/**
 * Pair-first fix: chapter06's greatestVulnerability/depletionPattern/
 * roleMatrix.complement/collision/overFunctionRisk/underFunctionRisk/
 * growth.aLearnsFromB/bLearnsFromA used to be 1 fixed sentence each for
 * every couple (confirmed via audit — roleAType/roleBType were computed
 * right above but never consulted for these 6 fields, even though
 * greatestStrength right next to them already does). This gives each
 * RomanticRoleType a short vocabulary of "what depletes this role" and
 * "what a partner learns from this role," then composes them per-pair —
 * so the 5x4=20 real roleAType x roleBType combinations produce genuinely
 * different text, without hand-writing 20 separate paragraphs. Uses
 * .desc, never .title, to avoid ROLE_TITLES' English-parenthetical labels
 * (spec item 9 — tone rebuild explicitly disallows those).
 */
const ROLE_DEPLETES_WHEN_KO: Record<RomanticRoleType, string> = {
  emotional_anchor: "혼자만 계속 감정을 받아주고 정작 자기 마음은 못 챙길 때",
  initiator: "먼저 제안해도 매번 밍밍한 반응만 돌아올 때",
  practical_stabilizer: "감정보다 대책부터 말한다고 자꾸 지적받을 때",
  affection_initiator: "표현해도 상대가 늘 무덤덤하게 받을 때",
  repair_initiator: "매번 먼저 손 내밀어도 상대는 그대로일 때",
  autonomy_keeper: "혼자만의 공간이 계속 침범당한다고 느낄 때",
  relationship_regulator: "속도를 맞추려 해도 상대가 자꾸 앞서갈 때",
};

const ROLE_DEPLETES_WHEN_EN: Record<RomanticRoleType, string> = {
  emotional_anchor: "they're always the one absorbing the emotions and never get to tend to their own feelings",
  initiator: "they keep proposing things and only ever get a lukewarm response back",
  practical_stabilizer: "they keep getting told they lead with solutions instead of feelings",
  affection_initiator: "they express affection and their partner always takes it in stride, unmoved",
  repair_initiator: "they keep reaching out first and their partner never changes",
  autonomy_keeper: "they feel their personal space keeps getting encroached on",
  relationship_regulator: "they try to match the pace but their partner keeps rushing ahead",
};

// Pair-first fix: wantedVsGivenLove's wantedLove/givenLove used to be 1
// fixed pair of sentences for every couple regardless of loveA/loveB
// (audit: only partnerReception/matchStatus varied). Same
// per-role-vocabulary composition pattern as chapter06 above.
const ROLE_WANTS_KO: Record<RomanticRoleType, string> = {
  emotional_anchor: "말 한마디로도 확실하게 전해지는 다정한 지지",
  initiator: "함께 새로운 걸 시도해줄 때 느껴지는 활력",
  practical_stabilizer: "말보다 행동으로 보여주는 확실한 헌신",
  affection_initiator: "표현한 만큼 돌아오는 애정 표현",
  repair_initiator: "먼저 다가갔을 때 따뜻하게 받아주는 반응",
  autonomy_keeper: "간섭 없이도 느껴지는 편안한 신뢰",
  relationship_regulator: "서두르지 않고 맞춰주는 배려",
};

const ROLE_WANTS_EN: Record<RomanticRoleType, string> = {
  emotional_anchor: "warm support that comes through clearly, even in just one line",
  initiator: "the spark of trying something new together",
  practical_stabilizer: "solid commitment shown through action, not just words",
  affection_initiator: "affection that comes back in kind when they express it",
  repair_initiator: "a warm response when they're the one who reaches out first",
  autonomy_keeper: "comfortable trust that doesn't need constant checking in",
  relationship_regulator: "consideration that matches their pace without rushing",
};

const ROLE_GIVES_KO: Record<RomanticRoleType, string> = {
  emotional_anchor: "상대의 감정을 있는 그대로 받아주고 곁을 지키는 것",
  initiator: "새로운 경험과 자극으로 관계에 활력을 불어넣는 것",
  practical_stabilizer: "일상을 구체적으로 챙기고 현실적으로 도와주는 것",
  affection_initiator: "먼저 다정하게 표현하고 다가가는 것",
  repair_initiator: "마찰이 생기면 자존심보다 관계를 먼저 챙기는 것",
  autonomy_keeper: "서로의 공간을 존중하며 부담 주지 않는 것",
  relationship_regulator: "속도를 맞추고 서두르지 않는 것",
};

const ROLE_GIVES_EN: Record<RomanticRoleType, string> = {
  emotional_anchor: "accepting their partner's feelings as they are and staying close",
  initiator: "bringing new experiences and spark into the relationship",
  practical_stabilizer: "taking concrete care of everyday life and helping out practically",
  affection_initiator: "reaching out and expressing affection first",
  repair_initiator: "putting the relationship over pride when friction comes up",
  autonomy_keeper: "respecting each other's space without adding pressure",
  relationship_regulator: "matching the pace and never rushing",
};

const ROLE_TEACHES_PARTNER_KO: Record<RomanticRoleType, string> = {
  emotional_anchor: "감정을 있는 그대로 받아들이고 서두르지 않는 법",
  initiator: "가만히 있지 않고 먼저 움직여보는 용기",
  practical_stabilizer: "감정에 휘둘리지 않고 현실적으로 정리하는 법",
  affection_initiator: "마음을 말이나 행동으로 직접 표현하는 법",
  repair_initiator: "자존심보다 관계를 먼저 챙기는 법",
  autonomy_keeper: "서로의 공간을 존중하며 과밀착을 줄이는 법",
  relationship_regulator: "속도를 맞추고 서두르지 않는 법",
};

const ROLE_TEACHES_PARTNER_EN: Record<RomanticRoleType, string> = {
  emotional_anchor: "how to accept feelings as they are without rushing",
  initiator: "the courage to move first instead of staying still",
  practical_stabilizer: "how to stay grounded and organized instead of getting swept up in emotion",
  affection_initiator: "how to express what's on their mind directly, in words or action",
  repair_initiator: "how to put the relationship over pride",
  autonomy_keeper: "how to respect each other's space and ease up on over-closeness",
  relationship_regulator: "how to match the pace and not rush",
};

const ROLE_COMPLEMENT_KEYWORD_KO: Record<RomanticRoleType, { bring: string; support: string }> = {
  emotional_anchor: { bring: "변함없는 포용과 정서적 온기", support: "따뜻한 버팀목" },
  initiator: { bring: "새로운 경험과 활력 있는 제안", support: "추동력" },
  practical_stabilizer: { bring: "현실적인 조언과 안정적인 기준", support: "든든한 체계" },
  affection_initiator: { bring: "다정한 표현과 솔직한 온도", support: "다정한 솔직함" },
  repair_initiator: { bring: "먼저 다가가는 화해의 손길", support: "평화적인 대화" },
  autonomy_keeper: { bring: "서로의 건강한 경계와 개인적 공간", support: "독립적인 신뢰" },
  relationship_regulator: { bring: "소통의 주파수와 갈등의 템포", support: "여유 있는 리듬" },
};

const ROLE_COMPLEMENT_KEYWORD_EN: Record<RomanticRoleType, { bring: string; support: string }> = {
  emotional_anchor: { bring: "steady acceptance and emotional warmth", support: "warm support" },
  initiator: { bring: "new experiences and lively proposals", support: "momentum" },
  practical_stabilizer: { bring: "grounded advice and stable standards", support: "a dependable structure" },
  affection_initiator: { bring: "warm expression and honest warmth", support: "warm honesty" },
  repair_initiator: { bring: "reaching out first to make peace", support: "peaceful conversation" },
  autonomy_keeper: { bring: "healthy boundaries and personal space", support: "independent trust" },
  relationship_regulator: { bring: "the frequency of communication and the tempo of conflict", support: "an unhurried rhythm" },
};

function getRoleTitles(locale: NarrativeLocale) {
  return locale === "en-US" ? ROLE_TITLES_EN : ROLE_TITLES_KO;
}
function getRoleDepletesWhen(locale: NarrativeLocale) {
  return locale === "en-US" ? ROLE_DEPLETES_WHEN_EN : ROLE_DEPLETES_WHEN_KO;
}
function getRoleWants(locale: NarrativeLocale) {
  return locale === "en-US" ? ROLE_WANTS_EN : ROLE_WANTS_KO;
}
function getRoleGives(locale: NarrativeLocale) {
  return locale === "en-US" ? ROLE_GIVES_EN : ROLE_GIVES_KO;
}
function getRoleTeachesPartner(locale: NarrativeLocale) {
  return locale === "en-US" ? ROLE_TEACHES_PARTNER_EN : ROLE_TEACHES_PARTNER_KO;
}
function getRoleComplementKeyword(locale: NarrativeLocale) {
  return locale === "en-US" ? ROLE_COMPLEMENT_KEYWORD_EN : ROLE_COMPLEMENT_KEYWORD_KO;
}

function josaEulReulWord(word: string): string {
  if (!word) return word;
  const trimmed = word.trim();
  const lastChar = trimmed.charCodeAt(trimmed.length - 1);
  if (lastChar < 0xac00 || lastChar > 0xd7a3) return `${trimmed}를`;
  const hasJongsung = (lastChar - 0xac00) % 28 !== 0;
  return hasJongsung ? `${trimmed}을` : `${trimmed}를`;
}

function composeChapter06(params: {
  nameA: string;
  nameB: string;
  roleAType: RomanticRoleType;
  roleBType: RomanticRoleType;
  conflictStyleGap: number;
  locale: NarrativeLocale;
}): Pick<Chapter06RolePowerVulnerability, "greatestVulnerability" | "depletionPattern"> & {
  complement: string;
  collision: string;
  overFunctionRisk: string;
  underFunctionRisk: string;
  aLearnsFromB: string;
  bLearnsFromA: string;
} {
  const { nameA, nameB, roleAType, roleBType, conflictStyleGap, locale } = params;
  const L = (ko: string, en: string) => pick(locale, ko, en);
  const depletesWhen = getRoleDepletesWhen(locale);
  const teachesPartner = getRoleTeachesPartner(locale);
  const complementKeyword = getRoleComplementKeyword(locale);

  const isEn = locale === "en-US";
  const complementText = isEn
    ? `${nameA} brings ${complementKeyword[roleAType].bring}, and ${nameB} backs it up with ${complementKeyword[roleBType].support}.`
    : `${josaIGa(nameA)} ${josaEulReulWord(complementKeyword[roleAType].bring)} 가져오면, ${josaIGa(nameB)} ${josaRo(complementKeyword[roleBType].support)} 그걸 받쳐주는 조합이에요.`;

  return {
    greatestVulnerability:
      conflictStyleGap >= 25
        ? L(
            `갈등을 대하는 방식 자체가 달라서, ${josaEunNeun(nameA)} 빨리 풀고 싶어 하고 ${josaEunNeun(nameB)} 시간을 두고 싶어 할 때 서로 엇갈리는 지점`,
            `Your whole approach to conflict differs — ${nameA} wants to resolve things fast while ${nameB} wants time, and that's where you tend to miss each other`,
          )
        : L(
            `${josaEunNeun(nameA)} ${depletesWhen[roleAType]}, ${josaEunNeun(nameB)} ${depletesWhen[roleBType]} — 이 두 순간이 겹치면 서운함이 쌓이기 쉬운 지점`,
            `The point where hurt piles up is when ${nameA} is dealing with ${depletesWhen[roleAType]} at the same time ${nameB} is dealing with ${depletesWhen[roleBType]}`,
          ),
    depletionPattern: L(
      `${josaEunNeun(nameA)} ${depletesWhen[roleAType]}, ${josaEunNeun(nameB)} ${depletesWhen[roleBType]} — 둘 중 하나만 계속돼도 조용히 지칠 수 있어요.`,
      `Even just one of you quietly running low — ${nameA} when ${depletesWhen[roleAType]}, or ${nameB} when ${depletesWhen[roleBType]} — is enough to wear you both down.`,
    ),
    complement: complementText,
    collision: L(
      `${josaEunNeun(nameA)} ${depletesWhen[roleAType]}, ${josaEunNeun(nameB)} ${depletesWhen[roleBType]} — 이 두 지점이 부딪히기 쉬워요.`,
      `These two points tend to collide: ${nameA} when ${depletesWhen[roleAType]}, and ${nameB} when ${depletesWhen[roleBType]}.`,
    ),
    overFunctionRisk: L(
      `${josaIGa(nameA)} 혼자 다 떠안거나, ${josaIGa(nameB)} 필요 이상으로 개입해서 서로에게 부담을 줄 위험이에요.`,
      `The risk is ${nameA} taking on everything alone, or ${nameB} stepping in more than needed — either way, it puts pressure on both of you.`,
    ),
    underFunctionRisk: L(
      `마찰이 생기면 둘 다 상대가 먼저 나서주길 기다리며 조용히 시간만 흐를 수 있어요.`,
      "When friction comes up, you can both end up quietly waiting for the other to make the first move while time just passes.",
    ),
    aLearnsFromB: L(`${nameB}에게서 ${teachesPartner[roleBType]}을 배우게 돼요.`, `${nameA} learns ${teachesPartner[roleBType]} from ${nameB}.`),
    bLearnsFromA: L(`${nameA}에게서 ${teachesPartner[roleAType]}을 배우게 돼요.`, `${nameB} learns ${teachesPartner[roleAType]} from ${nameA}.`),
  };
}

export function computeRomanticV4GapBatchEngine(params: {
  nameA: string;
  nameB: string;
  psychA: PsychMasterJson | null;
  psychB: PsychMasterJson | null;
  locale?: NarrativeLocale;
}): RomanticGapBatchOutput {
  const { nameA, nameB, psychA, psychB, locale = "ko-KR" } = params;
  const L = (ko: string, en: string) => pick(locale, ko, en);
  const isEn = locale === "en-US";
  const roleTitles = getRoleTitles(locale);
  const roleWants = getRoleWants(locale);
  const roleGives = getRoleGives(locale);

  const empA = psychA?.secondary_axes?.empathy ?? 50;
  const structA = psychA?.secondary_axes?.structure ?? 50;
  const stimA = psychA?.secondary_axes?.stimulation ?? 50;
  const recA = psychA?.secondary_axes?.recognition ?? 50;
  const selfControlA = psychA?.secondary_axes?.self_control ?? 50;
  const conflictStyleA = psychA?.secondary_axes?.conflict_style ?? 50;

  const empB = psychB?.secondary_axes?.empathy ?? 50;
  const structB = psychB?.secondary_axes?.structure ?? 50;
  const stimB = psychB?.secondary_axes?.stimulation ?? 50;
  const recB = psychB?.secondary_axes?.recognition ?? 50;
  const selfControlB = psychB?.secondary_axes?.self_control ?? 50;
  const conflictStyleB = psychB?.secondary_axes?.conflict_style ?? 50;

  // 1. Role Matrix Determination
  let roleAType: RomanticRoleType = "emotional_anchor";
  if (empA >= 65 && structA < 60) roleAType = "emotional_anchor";
  else if (stimA >= 65) roleAType = "initiator";
  else if (structA >= 65) roleAType = "practical_stabilizer";
  else if (recA >= 65) roleAType = "affection_initiator";
  else roleAType = "autonomy_keeper";

  let roleBType: RomanticRoleType = "practical_stabilizer";
  if (structB >= 65) roleBType = "practical_stabilizer";
  else if (empB >= 65) roleBType = "repair_initiator";
  else if (stimB >= 65) roleBType = "initiator";
  else roleBType = "relationship_regulator";

  const composed06 = composeChapter06({
    nameA,
    nameB,
    roleAType,
    roleBType,
    conflictStyleGap: Math.abs(conflictStyleA - conflictStyleB),
    locale,
  });
  const chapter06: Chapter06RolePowerVulnerability = {
    greatestStrength: isEn
      ? `The point where ${nameA}'s ${roleTitles[roleAType].desc.split(" ").slice(0, 6).join(" ")} meets ${nameB}'s ${roleTitles[roleBType].desc.split(" ").slice(0, 6).join(" ")}`
      : `${josaIGa(nameA)} 가진 ${roleTitles[roleAType].desc.split(" ").slice(0, 4).join(" ")}과 ${josaIGa(nameB)} 가진 ${roleTitles[roleBType].desc.split(" ").slice(0, 4).join(" ")}이 맞물리는 지점`,
    greatestVulnerability: composed06.greatestVulnerability,
    depletionPattern: composed06.depletionPattern,
    roleMatrix: {
      roleA: { type: roleAType, title: roleTitles[roleAType].title, description: roleTitles[roleAType].desc },
      roleB: { type: roleBType, title: roleTitles[roleBType].title, description: roleTitles[roleBType].desc },
      complement: composed06.complement,
      collision: composed06.collision,
      overFunctionRisk: composed06.overFunctionRisk,
      underFunctionRisk: composed06.underFunctionRisk,
    },
    growth: {
      aLearnsFromB: composed06.aLearnsFromB,
      bLearnsFromA: composed06.bLearnsFromA,
    },
  };

  // 2. Wanted vs Given Love
  const wantedVsGivenLove: WantedVsGivenLovePair = {
    loveA: {
      personName: nameA,
      partnerName: nameB,
      wantedLove: roleWants[roleAType],
      givenLove: roleGives[roleAType],
      partnerReception: structB >= 60
        ? L(`${nameB}님은 이를 든든함으로 느끼지만 가끔은 부담으로 받아들일 수 있어요`, `${nameB} feels this as reassuring, though it can occasionally land as pressure`)
        : L(`${nameB}님은 이를 있는 그대로 따뜻하게 받아주는 편이에요`, `${nameB} tends to take this in warmly, just as it is`),
    },
    loveB: {
      personName: nameB,
      partnerName: nameA,
      wantedLove: roleWants[roleBType],
      givenLove: roleGives[roleBType],
      partnerReception: empA >= 60
        ? L(`${nameA}님은 해결책보다 먼저 공감해주길 바랄 수 있어요`, `${nameA} may want empathy first, before any solution`)
        : L(`${nameA}님은 이를 실질적인 도움으로 잘 받아들이는 편이에요`, `${nameA} tends to receive this well as practical help`),
    },
    matchStatus: Math.abs(empA - structB) > 25 ? "PARTIALLY_MATCHED" : "MATCHED",
    summary: L(
      `${josaIGa(nameA)} ${roleGives[roleAType]}으로, ${josaIGa(nameB)} ${roleGives[roleBType]}으로 사랑을 표현하는 커플이에요.`,
      `${nameA} expresses love by ${roleGives[roleAType]}, and ${nameB} expresses it by ${roleGives[roleBType]}.`,
    ),
  };

  // 3. What Not to Expect From Each Other (Evidence-Grounded, Strict Abstention, Fully Symmetric)
  const notToExpectAFromB: { title: string; reason: string }[] = [];
  const hasPsychB = Boolean(psychB && psychB.secondary_axes);
  if (hasPsychB) {
    if (structB >= 60 || empB <= 40) {
      notToExpectAFromB.push({
        title: L("즉각적인 감정 공감과 무조건적인 맞장구", "Instant emotional agreement and unconditional sympathy"),
        reason: L(`${nameB}님은 감정을 흡수하기 전 사건의 맥락과 이유를 먼저 정리해야 납득하는 타입입니다.`, `${nameB} needs to sort out the context and reasons behind a situation before taking the feelings in.`),
      });
    }
    if (structB >= 60 || recB <= 40) {
      notToExpectAFromB.push({
        title: L("말하지 않아도 내 기분을 알아서 알아차려 주기", "Reading their mood without being told"),
        reason: L(`${nameB}님은 모호한 신호보다 구체적인 대사로 요청할 때 훨씬 잘 반응합니다.`, `${nameB} responds far better to a specific, spoken request than to a vague signal.`),
      });
    }
    if (selfControlB >= 60) {
      notToExpectAFromB.push({
        title: L("갈등 직후 자리에 붙들어 매고 끝장 대화하기", "Pinning them down for a marathon talk right after a conflict"),
        reason: L(`${nameB}님은 감정이 과부하되면 혼자 차분히 정리할 쿨링다운 시간이 필요합니다.`, `When emotions overload, ${nameB} needs cooling-down time alone to settle before talking.`),
      });
    }
    if (empB >= 60 && structB < 60) {
      notToExpectAFromB.push({
        title: L("갈등 직후 칼같이 냉정하게 잘잘못을 가려내기", "Coldly sorting out right and wrong immediately after a conflict"),
        reason: L(`${nameB}님은 서운함이 가라앉기 전 훈계나 논리적 지적을 받으면 마음을 닫기 쉽습니다.`, `${nameB} tends to shut down if they get lectured or logically corrected before the hurt has settled.`),
      });
    }
    if (recB >= 60) {
      notToExpectAFromB.push({
        title: L("서운한 감정을 드러내지 않고 무조건 쿨하게 넘어가기", "Just brushing hurt feelings off and staying unbothered"),
        reason: L(`${nameB}님은 서운함을 미루지 않고 다정한 확답과 사과를 통해 안도감을 확인받고 싶어 합니다.`, `${nameB} doesn't want to sit on hurt feelings — they want reassurance through a warm, clear response and an apology.`),
      });
    }
    if (stimB >= 60) {
      notToExpectAFromB.push({
        title: L("변화 없는 고정된 데이트 루틴에 매번 만족하기", "Always being satisfied with the same fixed date routine"),
        reason: L(`${nameB}님은 관계 속에서 새로운 자극과 다채로운 경험을 함께 나눌 때 활력을 느낍니다.`, `${nameB} feels energized when the relationship brings new stimulation and varied experiences to share.`),
      });
    }
  }

  const notToExpectBFromA: { title: string; reason: string }[] = [];
  const hasPsychA = Boolean(psychA && psychA.secondary_axes);
  if (hasPsychA) {
    if (structA >= 60 || empA <= 40) {
      notToExpectBFromA.push({
        title: L("즉각적인 감정 공감과 무조건적인 맞장구", "Instant emotional agreement and unconditional sympathy"),
        reason: L(`${nameA}님은 감정을 흡수하기 전 사건의 맥락과 이유를 먼저 정리해야 납득하는 타입입니다.`, `${nameA} needs to sort out the context and reasons behind a situation before taking the feelings in.`),
      });
    }
    if (structA >= 60 || recA <= 40) {
      notToExpectBFromA.push({
        title: L("말하지 않아도 내 기분을 알아서 알아차려 주기", "Reading their mood without being told"),
        reason: L(`${nameA}님은 모호한 신호보다 구체적인 대사로 요청할 때 훨씬 잘 반응합니다.`, `${nameA} responds far better to a specific, spoken request than to a vague signal.`),
      });
    }
    if (selfControlA >= 60) {
      notToExpectBFromA.push({
        title: L("갈등 직후 자리에 붙들어 매고 끝장 대화하기", "Pinning them down for a marathon talk right after a conflict"),
        reason: L(`${nameA}님은 감정이 과부하되면 혼자 차분히 정리할 쿨링다운 시간이 필요합니다.`, `When emotions overload, ${nameA} needs cooling-down time alone to settle before talking.`),
      });
    }
    if (empA >= 60 && structA < 60) {
      notToExpectBFromA.push({
        title: L("갈등 직후 칼같이 냉정하게 잘잘못을 가려내기", "Coldly sorting out right and wrong immediately after a conflict"),
        reason: L(`${nameA}님은 서운함이 가라앉기 전 훈계나 논리적 지적을 받으면 마음을 닫기 쉽습니다.`, `${nameA} tends to shut down if they get lectured or logically corrected before the hurt has settled.`),
      });
    }
    if (recA >= 60) {
      notToExpectBFromA.push({
        title: L("서운한 감정을 드러내지 않고 무조건 쿨하게 넘어가기", "Just brushing hurt feelings off and staying unbothered"),
        reason: L(`${nameA}님은 서운함을 미루지 않고 다정한 확답과 사과를 통해 안도감을 확인받고 싶어 합니다.`, `${nameA} doesn't want to sit on hurt feelings — they want reassurance through a warm, clear response and an apology.`),
      });
    }
    if (stimA >= 60) {
      notToExpectBFromA.push({
        title: L("변화 없는 고정된 데이트 루틴에 매번 만족하기", "Always being satisfied with the same fixed date routine"),
        reason: L(`${nameA}님은 관계 속에서 새로운 자극과 다채로운 경험을 함께 나눌 때 활력을 느낍니다.`, `${nameA} feels energized when the relationship brings new stimulation and varied experiences to share.`),
      });
    }
  }

  const whatNotToExpect: WhatNotToExpect = {
    notToExpectAFromB: notToExpectAFromB.slice(0, 2),
    notToExpectBFromA: notToExpectBFromA.slice(0, 2),
  };

  // 4. When We Need Each Other Most (Evidence-Grounded)
  const whenANeedsBContext = structB >= 60
    ? L(`${nameB}님이 현실적인 조언과 안정적인 기준을 잡아줄 때 가장 든든함을 느낍니다.`, `${nameA} feels most reassured when ${nameB} sets a grounded, stable standard with practical advice.`)
    : empB >= 60
      ? L(`${nameB}님이 잘잘못을 묻지 않고 따뜻한 체온으로 다독여 줄 때 안도합니다.`, `${nameA} feels relief when ${nameB} comforts them with warmth, without asking who's right or wrong.`)
      : L(`${nameB}님이 곁에서 부담 주지 않고 템포를 조용히 맞춰줄 때 편안해집니다.`, `${nameA} feels comfortable when ${nameB} quietly matches their pace nearby, without adding pressure.`);

  const whenBNeedsAContext = empA >= 60
    ? L(`${nameA}님이 다정한 관심과 공감으로 마음을 안아줄 때 비로소 긴장이 풀어집니다.`, `${nameB}'s tension finally eases when ${nameA} holds their heart with warm attention and empathy.`)
    : structA >= 60
      ? L(`${nameA}님이 차분한 해결책과 명확한 방향을 제시해 줄 때 힘을 얻습니다.`, `${nameB} draws strength when ${nameA} offers a calm solution and a clear direction.`)
      : L(`${nameA}님이 신선한 자극과 새로운 경험을 제안하며 활력을 불어넣어 줄 때 기분이 환기됩니다.`, `${nameB} feels refreshed when ${nameA} brings fresh stimulation and new experiences to the relationship.`);

  const whenWeNeedEachOtherMost: WhenWeNeedEachOtherMost = {
    whenANeedsB: [
      {
        sceneTitle: structB >= 60
          ? L("일이나 일상의 복잡함으로 지침을 느낄 때", "When work or everyday complications leave them worn out")
          : L("마음의 안식처와 따뜻한 지지가 필요할 때", "When they need an emotional refuge and warm support"),
        concreteContext: whenANeedsBContext,
      },
    ],
    whenBNeedsA: [
      {
        sceneTitle: empA >= 60
          ? L("지친 하루 끝에 묵묵히 내 편이 되어주는 체온이 필요할 때", "When they need someone quietly on their side after an exhausting day")
          : L("명확한 방향과 새로운 시각이 필요할 때", "When they need a clear direction and a fresh perspective"),
        concreteContext: whenBNeedsAContext,
      },
    ],
  };

  // 5. Emergency Romantic SOS Scripts (Evidence-Grounded)
  const sosAtoBTrigger = (structB >= 60 || selfControlB >= 60)
    ? L(`${nameB}님이 논리적 잘잘못을 따지거나 차갑게 동굴로 물러설 때`, `When ${nameB} argues logically over who's right or coldly retreats into their own space`)
    : (conflictStyleB >= 60 || stimB >= 60)
      ? L(`${nameB}님이 직설적으로 팩트를 짚으며 강한 해명을 요구할 때`, `When ${nameB} bluntly points out the facts and demands a strong explanation`)
      : L(`${nameB}님이 대화를 피하거나 차가운 어조로 일관할 때`, `When ${nameB} avoids the conversation or keeps a cold tone`);

  const sosAtoBDoNot = (selfControlB >= 60)
    ? L(`${nameB}님의 방이나 동굴로 따라 들어가 즉각 사과를 다그치며 언쟁 확대하기`, `Following ${nameB} into their room or their own space to demand an immediate apology and escalating the argument`)
    : L(`누가 옳은지 시시비비를 가리며 서둘러 내 입장만 해명하려 재촉하기`, "Rushing to argue who's right and only pushing to explain your own side");

  const sosAtoBFirst = (empA >= 60 || recA >= 60)
    ? L(`"아까 당신 말이 서운해서 당황했어. 나 지금 불안해서 그래, 내 마음 좀 안아줘."`, `"What you said earlier caught me off guard — it hurt. I'm anxious right now, can you hold my heart for a minute?"`)
    : L(`"아까 당신 말이 많이 서운했어. 우리 감정 가라앉히고 대화할 시각을 정하자."`, `"What you said earlier really hurt. Let's both settle down and pick a time to talk it through."`);

  const sosAtoBBridge = (structB >= 60)
    ? L(`"잘잘못을 가리자는 게 아니라, 내 불안을 당신에게 다정하게 확인받고 싶었어."`, `"I'm not trying to argue who's right — I just wanted you to gently reassure me."`)
    : L(`"이 자존심 싸움보다 당신과의 평화로운 신뢰가 내게 훨씬 더 중요해."`, `"Our peaceful trust matters to me far more than winning this pride fight."`);

  const sosBtoATrigger = (empA >= 60 || recA >= 60)
    ? L(`${nameA}님의 서운함이 극에 달해 감정적인 확인을 강하게 다그칠 때`, `When ${nameA}'s hurt peaks and they push hard for emotional reassurance`)
    : (conflictStyleA >= 60)
      ? L(`${nameA}님이 직설적인 화법으로 문제를 즉각 짚으려 할 때`, `When ${nameA} tries to call out the problem immediately and bluntly`)
      : L(`${nameA}님의 감정이 과부하되어 대화의 결이 어긋날 때`, `When ${nameA}'s emotions overload and the conversation goes off track`);

  const sosBtoADoNot = (empA >= 60 || recA >= 60)
    ? L(`${nameA}님의 감정을 '예민하다'며 무시하거나 논리적 지적으로 훈계하기`, `Dismissing ${nameA}'s feelings as "too sensitive" or lecturing them with logic`)
    : L(`${nameA}님의 말을 중간에 자르거나 성급히 자리를 비켜서 버리기`, `Cutting ${nameA} off mid-sentence or hastily walking away`);

  const sosBtoAFirst = (structB >= 60)
    ? L(`"내가 이성적으로만 해명하려 해서 당신 마음을 아프게 했나 봐. 미안해."`, `"I think trying to explain everything so rationally hurt you. I'm sorry."`)
    : L(`"내가 표현이 딱딱해서 당신 마음을 서운하게 한 것 같아 미안해."`, `"I think my stiff way of putting it hurt your feelings. I'm sorry."`);

  const sosBtoABridge = L(
    `"내 의도는 당신을 지적하려던 게 아니라, 우리 관계를 잘 지켜내고 싶어서였어."`,
    `"I wasn't trying to criticize you — I just wanted to protect what we have."`,
  );

  const emergencySos: EmergencyRomanticSosScripts = {
    sosAtoB: {
      seekerName: nameA,
      providerName: nameB,
      trigger: sosAtoBTrigger,
      doNot: sosAtoBDoNot,
      firstLine: sosAtoBFirst,
      bridgeLine: sosAtoBBridge,
      reconnectionLine: L(`"잠깐 각자 숨 돌리고, 따뜻한 음료 마시면서 다시 이야기하자."`, `"Let's both take a breather, grab something warm to drink, and talk again."`),
    },
    sosBtoA: {
      seekerName: nameB,
      providerName: nameA,
      trigger: sosBtoATrigger,
      doNot: sosBtoADoNot,
      firstLine: sosBtoAFirst,
      bridgeLine: sosBtoABridge,
      reconnectionLine: L(`"잠깐 쿨링다운하고 당신 이야기를 끝까지 들어줄게."`, `"Let me cool down for a bit, then I'll hear you out all the way through."`),
    },
  };

  // 6. Long-Term Relationship Bond Prescription (Evidence-Grounded)
  const longTermBond: LongTermRelationshipBondPrescription = {
    keepDoing: [
      L(
        `${nameA}님과 ${nameB}님이 서로의 표현 방식을 존중하고 구체적인 대사로 고마움 전달하기`,
        `${nameA} and ${nameB} respecting each other's way of expressing things and saying thank you in specific words`,
      ),
      L(
        `${roleTitles[roleAType].title.split(" ")[0]} 역할과 ${roleTitles[roleBType].title.split(" ")[0]} 역할의 긍정적인 신뢰 구도 지키기`,
        `Protecting the positive trust between your ${roleTitles[roleAType].title} role and ${roleTitles[roleBType].title} role`,
      ),
    ],
    watchOut: [
      Math.abs(conflictStyleA - conflictStyleB) >= 25
        ? L(
            `갈등 시 ${nameA}님의 빠른 확인 욕구와 ${nameB}님의 동굴 시간이 부딪혀 서운함이 누적되는 패턴`,
            `The pattern where ${nameA}'s need for a quick check-in collides with ${nameB}'s need for space during conflict, letting hurt pile up`,
          )
        : L(
            "서운한 감정이 생겼을 때 즉시 꺼내지 않고 침묵으로 쌓아두는 피로감",
            "The fatigue of letting hurt feelings sit in silence instead of raising them right away",
          ),
      L(
        "상대의 선의나 조언을 감정적 '지적'이나 '통제'로 오해하는 조급함",
        "The impatience that mistakes a partner's good intentions or advice for emotional 'criticism' or 'control'",
      ),
    ],
    relationshipRitual: [
      stimA >= 60 || stimB >= 60
        ? L("한 달에 한 번 새로운 데이트 코스나 활동을 함께 시도하며 활력 불어넣기", "Trying a new date spot or activity together once a month to keep things energized")
        : L("주간 일정이나 마음 상태를 편안하게 나누는 차분한 대화 루틴 지키기", "Keeping a calm weekly routine of sharing your schedules and how you're each feeling"),
      L("갈등 발생 후 각자의 쿨링다운 시간을 인내심 있게 기다려주는 약속", "A promise to patiently wait out each other's cooling-down time after a conflict"),
    ],
  };

  function extractAxis(psych: any, key: string): number {
    if (!psych) return 50;
    if (psych.secondary_axes && typeof psych.secondary_axes[key] === "number") {
      return psych.secondary_axes[key];
    }
    if (typeof psych[key] === "number") {
      return psych[key];
    }
    return 50;
  }

  function computeConflictStateTransition(
    name: string,
    psych: PsychMasterJson | null,
    _isPersonA: boolean = true,
  ): ConflictStateTransition {
    const emp = extractAxis(psych, "empathy");
    const struct = extractAxis(psych, "structure");
    const selfControl = extractAxis(psych, "self_control");
    const conflictStyle = extractAxis(psych, "conflict_style");
    const rec = extractAxis(psych, "recognition");
    const stim = extractAxis(psych, "stimulation");

    const hasPsych = Boolean(psych && psych.secondary_axes);

    // Pattern 1: Expressive Anxious (Sera type: High self-control/empathy + high recognition need)
    if (hasPsych && (rec >= 60 || emp >= 60) && struct < 70) {
      return {
        personName: name,
        normalState: L(`평소에는 다정하고 상대의 기분을 세심하게 살피며 수용적인 태도`, "Normally warm, closely attuned to their partner's mood, and quick to accept"),
        tensionRising: L(`서운함이나 갈등 조짐이 생기면 즉시 드러내지 않고 감정을 억누르며 상대를 침묵 속에서 관찰함`, "When hurt or friction shows up, they don't show it right away — they hold the feeling in and quietly watch their partner"),
        overloadState: L(`감정적 억제가 임계점을 넘어서면 순간적으로 서운함과 불안이 한꺼번에 터져 나오며 즉각적인 사과와 확실한 감정 표현을 강력히 요구함`, "Once the bottled-up feelings cross a threshold, hurt and anxiety burst out all at once, and they strongly demand an immediate apology and a clear show of feeling"),
        recoveryState: L(`상대의 따뜻하고 명확한 인정과 다정한 확답을 듣고 나면 안도감을 느끼며 마음이 눈 녹듯 풀어짐`, "Once they hear a warm, clear acknowledgment and reassurance, they feel relieved and their guard melts away"),
        canonicalSummary: L(
          `${josaIGa(name)} 초기에는 서운함을 억누르며 참다가, 불안 임계점을 넘으면 즉시 명확한 감정 확인과 해결을 바라는 억제-후-즉시해결형 흐름을 보입니다.`,
          `${name} tends to hold in hurt at first, but once anxiety crosses a threshold, they want an immediate, clear resolution — a hold-then-resolve-fast pattern.`,
        ),
      };
    }

    // Pattern 2: Logical Withdrawing (Donggle type: High structure / self-control -> Logical analysis then silence/withdrawal)
    if (hasPsych && (struct >= 60 || (selfControl >= 60 && emp < 60))) {
      return {
        personName: name,
        normalState: L(`평소에는 든든하고 이성적이며 관계의 객관적인 밸런스를 지키는 안정적인 태도`, "Normally dependable and rational, keeping an objective balance in the relationship"),
        tensionRising: L(`갈등 분위기가 형성되면 감정적 조급함보다는 인과관계를 논리적으로 파악하고 이유를 분석하려 함`, "When tension builds, instead of reacting emotionally, they try to logically work out the cause and analyze the reasons"),
        overloadState: L(`상대가 일방적으로 감정을 몰아붙이거나 당장 해명을 요구하면 벅차서 입을 닫고 차갑게 거리를 둠`, "If their partner pushes emotion at them one-sidedly or demands an explanation on the spot, it becomes too much and they go quiet and pull away coldly"),
        recoveryState: L(`충분히 혼자 정리할 시간을 가진 뒤 이성적으로 대화할 준비가 되면 차분하게 다시 다가옴`, "After having enough time alone to sort things out, once they're ready to talk rationally, they come back calmly"),
        canonicalSummary: L(
          `${josaIGa(name)} 처음엔 상황을 논리적으로 분석하려다가, 벅차지면 침묵과 거리두기로 스스로를 지키는 흐름을 보입니다.`,
          `${name} tends to try analyzing the situation logically at first, then protects themselves with silence and distance once it becomes overwhelming.`,
        ),
      };
    }

    // Pattern 3: Active Confronter (High conflict style / stimulation -> Direct immediate confrontation)
    if (conflictStyle >= 65 || stim >= 65) {
      return {
        personName: name,
        normalState: L(`솔직하고 명확하며 문제 조짐이 보이면 돌려 말하지 않는 화끈한 태도`, "Honest and direct, with a bold streak that doesn't beat around the bush when a problem shows up"),
        tensionRising: L(`불합리함이나 서운함을 느끼면 그 자리에서 바로 문제를 짚고 직면하려 함`, "When something feels unfair or hurtful, they try to name the problem and face it head-on right away"),
        overloadState: L(`상대가 회피하거나 미루려 하면 언성이 높아지며 빠른 행동 변화와 직설적인 답변을 강력히 주도함`, "If their partner tries to avoid or stall, their voice rises and they push hard for fast changes in behavior and a direct answer"),
        recoveryState: L(`문제가 명확히 정리되고 확실한 약속이 세워지면 뒤끝 없이 쿨하게 회복함`, "Once the issue is clearly settled and a solid promise is made, they bounce back cleanly, without holding a grudge"),
        canonicalSummary: L(
          `${josaIGa(name)} 문제 조짐이 나타나면 피하지 않고 즉시 직면하여 확실한 결론을 도출하려는 주도형 흐름을 보입니다.`,
          `${name} tends to face a brewing problem head-on right away rather than avoiding it, driving toward a clear conclusion.`,
        ),
      };
    }

    // Pattern 4: Harmony Adapter (Default / Balanced)
    return {
      personName: name,
      normalState: L(`상대의 의견을 적극 경청하며 조화롭고 평화로운 관계 분위기를 최우선함`, "Actively listens to their partner's views and prioritizes a harmonious, peaceful atmosphere in the relationship"),
      tensionRising: L(`대립이 심해지는 것을 막기 위해 자신의 주장보다 상대의 톤과 기분에 맞춰줌`, "To keep things from escalating, they set their own opinion aside and match their partner's tone and mood"),
      overloadState: L(`갈등이 잦아지고 압박이 지속되면 자책하거나 깊은 무력감을 느끼며 마음의 문을 닫음`, "When conflict keeps recurring and the pressure continues, they blame themselves, feel deeply helpless, and close off"),
      recoveryState: L(`상대가 먼저 다정하게 다가와 감정을 부드럽게 쓰다듬어 주면 안정감을 찾음`, "They find stability again once their partner reaches out first, warmly and gently soothing their feelings"),
      canonicalSummary: L(
        `${josaIGa(name)} 평화 유지를 위해 조용히 수용하며 조율하다가, 따뜻한 다가옴에 빠르게 안정을 찾는 수용형 흐름을 보입니다.`,
        `${name} tends to quietly accept and adjust to keep the peace, then settles quickly once their partner warmly reaches out.`,
      ),
    };
  }

  /** True when this person does NOT clear Patterns 1-3's conditions and would
   * therefore land in the Pattern 4 (Harmony Adapter) fallback. Mirrors
   * computeConflictStateTransition's own condition order exactly. */
  function isHarmonyAdapterPattern(psych: PsychMasterJson | null): boolean {
    const emp = extractAxis(psych, "empathy");
    const struct = extractAxis(psych, "structure");
    const selfControl = extractAxis(psych, "self_control");
    const conflictStyle = extractAxis(psych, "conflict_style");
    const rec = extractAxis(psych, "recognition");
    const stim = extractAxis(psych, "stimulation");
    const hasPsych = Boolean(psych && psych.secondary_axes);

    if (hasPsych && (rec >= 60 || emp >= 60) && struct < 70) return false; // Pattern 1
    if (hasPsych && (struct >= 60 || (selfControl >= 60 && emp < 60))) return false; // Pattern 2
    if (conflictStyle >= 65 || stim >= 65) return false; // Pattern 3
    return true;
  }

  const HARMONY_SHARED_BASELINE = L("둘 다 관계의 평화와 조화를 중요하게 여기는 편입니다.", "Both of you tend to place real value on peace and harmony in the relationship.");
  /** Axes Patterns 1-3 don't already gate on for THIS pair once both are
   * confirmed Pattern-4 — used only to check whether a real secondary
   * difference exists, never to force one. */
  const HARMONY_SECONDARY_AXES = ["self_control", "thinking_style", "decision_style"] as const;
  const HARMONY_SECONDARY_GAP_THRESHOLD = 20;

  /**
   * Final Evidence-to-Voice pass, item 1. computeConflictStateTransition alone
   * cannot see the OTHER person, so it can't tell "both genuinely converge"
   * apart from "both happened to fall into the same unconditional fallback."
   * This wrapper makes that distinction explicit:
   *   - either person clears Pattern 1-3 -> unchanged, per-person text as before.
   *   - both are Pattern-4 AND a real secondary-axis gap exists -> deterministically
   *     differentiate tensionRising/overloadState/recoveryState from that gap
   *     (never fabricated — grounded in the actual score difference).
   *   - both are Pattern-4 AND no secondary gap exists -> sharedBaseline is set;
   *     this is the deliberate, evidence-checked "genuinely alike" case, not
   *     an unexamined duplicate.
   */
  function computeConflictStateTransitionPair(
    nA: string,
    pA: PsychMasterJson | null,
    nB: string,
    pB: PsychMasterJson | null,
  ): ConflictStateTransitionPair {
    const rawA = computeConflictStateTransition(nA, pA, true);
    const rawB = computeConflictStateTransition(nB, pB, false);

    if (!isHarmonyAdapterPattern(pA) || !isHarmonyAdapterPattern(pB)) {
      return { sharedBaseline: null, transitionA: rawA, transitionB: rawB, wasHarmonyDifferentiated: false };
    }

    const gaps = HARMONY_SECONDARY_AXES.map((key) => ({
      key,
      gap: Math.abs(extractAxis(pA, key) - extractAxis(pB, key)),
    }));
    const largestGap = gaps.reduce((max, g) => (g.gap > max.gap ? g : max), gaps[0]);

    if (largestGap.gap < HARMONY_SECONDARY_GAP_THRESHOLD) {
      // Confirmed genuinely similar, not just a fallback accident. One shared
      // baseline; per-person text stays (honestly) close since the evidence
      // really doesn't distinguish them further, but is no longer presented
      // as two independently-derived identical cards.
      return {
        sharedBaseline: HARMONY_SHARED_BASELINE,
        transitionA: { ...rawA, normalState: HARMONY_SHARED_BASELINE },
        transitionB: { ...rawB, normalState: HARMONY_SHARED_BASELINE },
        wasHarmonyDifferentiated: false,
      };
    }

    // A real secondary gap exists even within the shared harmony-seeking
    // baseline — differentiate how tension actually plays out, grounded in
    // that specific axis, not invented.
    const aHigher = extractAxis(pA, largestGap.key) >= extractAxis(pB, largestGap.key);

    const differentiatedText: Record<"higher" | "lower", Pick<ConflictStateTransition, "tensionRising" | "overloadState" | "recoveryState">> =
      largestGap.key === "self_control"
        ? {
            higher: {
              tensionRising: L(`평화를 지키고 싶은 마음은 같지만, 갈등 조짐이 보이면 감정을 안으로 누르며 스스로 정리할 시간부터 가지려 함`, "They want to keep the peace just as much, but when conflict brews, they hold the feeling in first and look for time alone to sort it out"),
              overloadState: L(`누르고 있던 감정이 쌓이면 티 내지 않고 조용히 거리를 두는 방식으로 지침을 표현함`, "As the bottled-up feelings build, they express being worn out by quietly creating distance rather than showing it outright"),
              recoveryState: L(`혼자 정리할 시간을 가진 뒤, 상대가 다정하게 다가오면 자연스럽게 다시 가까워짐`, "After time alone to process, once their partner reaches out warmly, they naturally grow close again"),
            },
            lower: {
              tensionRising: L(`평화를 지키고 싶은 마음은 같지만, 갈등 조짐이 보이면 참기보다 먼저 말을 걸어 확인받고 싶어함`, "They want to keep the peace just as much, but when conflict brews, instead of holding back they'd rather speak up first and get reassurance"),
              overloadState: L(`확인받지 못한 채 시간이 길어지면 서운함이 쌓여 먼저 다가가거나 재차 물어봄`, "If too much time passes without reassurance, hurt builds and they reach out or ask again"),
              recoveryState: L(`상대의 다정한 반응을 바로 받으면 빠르게 안정을 찾음`, "As soon as they get a warm response from their partner, they settle quickly"),
            },
          }
        : {
            higher: {
              tensionRising: L(`평화를 지키고 싶은 마음은 같지만, 상황을 논리적으로 정리해 본 뒤에야 반응함`, "They want to keep the peace just as much, but they only respond after working through the situation logically"),
              overloadState: L(`정리가 안 된 채 압박이 들어오면 판단을 미루고 조용해짐`, "If pressure comes before they've worked it out, they put off deciding and go quiet"),
              recoveryState: L(`납득할 수 있는 설명이나 흐름이 정리되면 다시 편안해짐`, "Once there's a satisfying explanation or the picture becomes clear, they relax again"),
            },
            lower: {
              tensionRising: L(`평화를 지키고 싶은 마음은 같지만, 분석보다 지금 이 순간의 감정과 분위기에 먼저 반응함`, "They want to keep the peace just as much, but they respond to the feeling and mood of the moment before any analysis"),
              overloadState: L(`분위기가 계속 무거우면 이유를 따지기보다 감정적으로 지쳐버림`, "If the mood stays heavy for too long, they become emotionally worn out rather than pinning down the reason"),
              recoveryState: L(`분위기 자체가 다시 편안해지면 별다른 설명 없이도 회복함`, "Once the atmosphere itself feels comfortable again, they recover without needing much explanation"),
            },
          };

    return {
      sharedBaseline: null,
      transitionA: { ...rawA, ...(aHigher ? differentiatedText.higher : differentiatedText.lower) },
      transitionB: { ...rawB, ...(aHigher ? differentiatedText.lower : differentiatedText.higher) },
      wasHarmonyDifferentiated: true,
    };
  }

  // 7. Conflict State Transitions (Narrative Canonicalization)
  const conflictTransitions = computeConflictStateTransitionPair(nameA, psychA, nameB, psychB);
  const physicalIntimacy: PhysicalIntimacyDetail = {
    desiredClosenessA: empA >= 60
      ? L("정서적 신뢰와 다정한 대화가 선행된 후의 자연스러운 스킨십", "Natural physical closeness that follows emotional trust and warm conversation")
      : L("적당한 거리감과 서로의 개인 공간을 존중하는 다정한 스킨십", "Warm physical closeness that still respects a comfortable distance and personal space"),
    desiredClosenessB: empB >= 60
      ? L("마음이 완전히 열렸을 때 표현하는 순수한 온기의 친밀감", "A pure, warm intimacy expressed once their heart is fully open")
      : L("서두르지 않고 템포를 맞춰가는 은은한 스킨십", "A gentle, unhurried physical closeness that builds at its own pace"),
    tempoMatch: Math.abs(empA - empB) <= 20 ? "MATCHED" : "TEMPO_GAP",
    spaceNeed: structA >= 65 || structB >= 65
      ? L("개인적인 침해 없는 선명한 경계 유지", "Keeping clear boundaries with no sense of personal space being crossed")
      : L("자연스러운 공유와 유연한 경계", "Natural sharing with flexible boundaries"),
    summary: L(
      `${nameA}님과 ${nameB}님은 서로의 정서적 안정 조건과 스킨십 템포를 존중할 때 가장 깊은 피지컬 케미스트리를 형성합니다.`,
      `${nameA} and ${nameB} build the deepest physical chemistry when you each respect what the other needs to feel emotionally secure and the pace that's comfortable for physical closeness.`,
    ),
  };

  return {
    chapter06,
    wantedVsGivenLove,
    whatNotToExpect,
    whenWeNeedEachOtherMost,
    emergencySos,
    longTermBond,
    physicalIntimacy,
    conflictTransitions,
  };
}
