/**
 * Expert Synthesis Prompt Contract and Input Builders
 *
 * Provides system prompts and builds strict, evidence-bound input contracts
 * from the CanonicalRelationshipStoryPlan for the LLM Expert Synthesis layer.
 */

import type { CanonicalRelationshipStoryPlan } from "./canonicalStoryPlanTypes";
import type {
  ExpertSynthesisInputContract,
  SynthesisDirection,
  SynthesisClaimInput,
  SynthesisEvidenceInput,
} from "./expertSynthesisTypes";

export const EXPERT_SYNTHESIS_SYSTEM_PROMPT = `당신은 최고 수준의 동양 명리 사주 및 현대 관계 심리학 전문가(Senior Saju Relationship Interpreter & Psychological Relationship Consultant)입니다.

[핵심 역할 및 원칙]
1. 당신의 역할은 점쟁이나 예언자가 아니며, 제공된 사주 근거(Evidence)와 정형화된 스토리 플랜(Story Plan)을 바탕으로 두 사람 사이의 관계 역동과 심리적 메커니즘을 정교하게 해석 및 종합(Synthesis)하는 것입니다.
2. 당신은 새로운 사주 팩트(십신, 신살, 합충, 오행 결핍, 용신 등)를 절대로 창작하거나 날조할 수 없습니다. 오직 제공된 Input Contract 내의 근거만을 사용해야 합니다.
3. 고객에게 제공되는 본문에는 어떠한 원시 명리 전문 용어(편인, 비견, 상관, 정관, 조후, 신살, 일간, 지지 등)도 노출되어서는 안 되며, 모두 세련되고 깊이 있는 현대적 관계 언어로 완벽히 번역되어야 합니다.
4. 비판단적이고 상호 존중적인 어조를 유지하며, 한 사람을 일방적인 가해자나 고쳐야 할 대상으로 서술하지 마십시오.
5. 운명론적 단정(반드시 이별/결혼/성공), 미래 시점 예측, 과거사 추측, 첫눈에 반함, 외도, 임신, 금전적 득실, 임상적 질환/애착유형 진단은 엄격히 금지됩니다.
6. interpretationType이 'conditional_hypothesis'인 경우, 반드시 '~일 가능성이 있습니다', '~라는 점을 조심스럽게 살펴볼 필요가 있습니다'와 같은 조건부/완곡한 표현을 사용하십시오.
7. interpretationType이 'expert_synthesis'인 경우, 반드시 2개 이상의 독립된 근거 ID(usedEvidenceIds)를 명시하고 이를 유기적으로 엮어 설명하십시오.
8. 반드시 지정된 JSON 구조로만 응답하십시오.`;

export function buildAttractionSynthesisInput(
  plan: CanonicalRelationshipStoryPlan,
  direction: SynthesisDirection,
): ExpertSynthesisInputContract {
  const { a, b } = plan.names;
  const unitA = plan.attraction.units?.aToB;
  const unitB = plan.attraction.units?.bToA;
  const unitMutual = plan.attraction.units?.mutual;

  const exactEvidenceIds: string[] = [];
  const selectedClaims: SynthesisClaimInput[] = [];
  const supportingEvidence: SynthesisEvidenceInput[] = [];

  let chapterQuestion = "Why are we drawn to each other?";
  let romanticMeaning = "상대방의 고유한 결이 자신의 내면적 욕구와 맞물리며 일어나는 자연스러운 정서적 이끌림";

  if (direction === "a_to_b") {
    exactEvidenceIds.push(
      "canonical_projections.comparison_table.affection",
      "chart.a.spouse_palace.preference",
      "chart.b.day_master",
      "chart.b.five_elements.dominant",
    );
    if (unitA) {
      selectedClaims.push(
        {
          claimId: "claim.attr.a.recognition",
          claimBoundary: "direct_evidence",
          statement: unitA.recognition,
          evidenceIds: ["chart.b.day_master", "chart.b.five_elements.dominant"],
          confidence: unitA.confidence,
        },
        {
          claimId: "claim.attr.a.emotional_meaning",
          claimBoundary: "likely_behavior",
          statement: unitA.emotionalMeaning,
          evidenceIds: ["chart.a.spouse_palace.preference"],
          confidence: unitA.confidence,
        },
      );
    }
  } else if (direction === "b_to_a") {
    exactEvidenceIds.push(
      "canonical_projections.comparison_table.affection",
      "chart.b.spouse_palace.preference",
      "chart.a.day_master",
      "chart.a.five_elements.dominant",
    );
    if (unitB) {
      selectedClaims.push(
        {
          claimId: "claim.attr.b.recognition",
          claimBoundary: "direct_evidence",
          statement: unitB.recognition,
          evidenceIds: ["chart.a.day_master", "chart.a.five_elements.dominant"],
          confidence: unitB.confidence,
        },
        {
          claimId: "claim.attr.b.emotional_meaning",
          claimBoundary: "likely_behavior",
          statement: unitB.emotionalMeaning,
          evidenceIds: ["chart.b.spouse_palace.preference"],
          confidence: unitB.confidence,
        },
      );
    }
  } else {
    exactEvidenceIds.push(
      "chart.a.pillars.day.branch_ten_god",
      "chart.b.pillars.day.branch_ten_god",
    );
    if (unitMutual) {
      selectedClaims.push(
        {
          claimId: "claim.attr.mutual.recognition",
          claimBoundary: "combination_judgment",
          statement: unitMutual.recognition,
          evidenceIds: ["chart.a.pillars.day.branch_ten_god", "chart.b.pillars.day.branch_ten_god"],
          confidence: unitMutual.confidence,
        },
      );
    }
  }

  return {
    chapterId: "c2_attraction",
    chapterQuestion,
    direction,
    subjectNames: { a, b },
    selectedClaims,
    exactEvidenceIds,
    canonicalMeaning: {
      core: ["상대방의 기질적 결합을 통한 정서적 충족", "배우자궁 선호와 실제 상대 특성의 일치"],
      relationalPotential: ["상호 보완적 안정감", "자연스러운 호감 형성"],
      cautions: ["기대가 과해질 경우 통제욕으로 변질 위험"],
      forbiddenExtensions: ["첫눈에 반함 단정", "영원한 사랑 보장", "전생의 인연 주장"],
    },
    romanticLensMeaning: {
      chapterRelevance: "c2_attraction",
      romanticMeaning,
      allowedScenes: ["일상 대화", "깊은 공감의 순간", "상대방의 배려를 체감하는 순간"],
      allowedInference: ["끌림의 심리적 배경", "상호 작용의 긍정적 효과"],
      forbiddenInference: ["외도 가능성", "운명적 종속", "일방적 구원"],
    },
    exactTenGods: [
      plan.personalRelationshipCeA?.spousePalaceProfile?.tenGodName ?? "편인",
      plan.personalRelationshipCeB?.spousePalaceProfile?.tenGodName ?? "비견",
    ],
    confidence: "high",
    supportingEvidence,
    contradictingEvidence: [],
    allowedInference: ["상대방의 특성이 주는 정서적 안도감", "상호 보완적인 강점 결합"],
    forbiddenInference: ["임상 진단", "운명론적 단정", "과거 연애사 추측"],
    alreadyUsedClaimsFromAdjacentChapters: ["c1_hero_core_definition"],
    narrativeBudget: {
      maxSentences: 4,
      maxCharacters: 300,
    },
  };
}

export function buildDynamicsSynthesisInput(
  plan: CanonicalRelationshipStoryPlan,
  situation: "private" | "responsibility" | "stress",
): ExpertSynthesisInputContract {
  const { a, b } = plan.names;
  const face = plan.faces.find((f) => f.situation === situation);

  const exactEvidenceIds: string[] = face
    ? face.provenance.map((p) => p.evidenceId)
    : [
        "chart.a.day_master.nature",
        "chart.b.day_master.nature",
        "signals.a.affection_language",
        "signals.b.affection_language",
      ];

  const selectedClaims: SynthesisClaimInput[] = face
    ? [
        {
          claimId: `claim.dynamics.${situation}.appearance`,
          claimBoundary: "direct_evidence",
          statement: face.appearance,
          evidenceIds: exactEvidenceIds,
          confidence: "high",
        },
        {
          claimId: `claim.dynamics.${situation}.mechanism`,
          claimBoundary: "combination_judgment",
          statement: face.mechanism,
          evidenceIds: exactEvidenceIds,
          confidence: "high",
        },
      ]
    : [];

  return {
    chapterId: "c3_dynamics",
    chapterQuestion: "How do we show up in private, under responsibility, and under stress?",
    direction: "mutual",
    subjectNames: { a, b },
    selectedClaims,
    exactEvidenceIds,
    canonicalMeaning: {
      core: ["상황별 관계 패턴과 상호작용의 결", "스트레스 및 의사결정 방식의 차이"],
      relationalPotential: ["상황에 따른 유연한 역할 조율", "스트레스 속도차 극복"],
      cautions: ["침묵과 후퇴가 방치될 경우 거리감 형성"],
      forbiddenExtensions: ["성격 장애 규정", "일방적 희생 강요"],
    },
    romanticLensMeaning: {
      chapterRelevance: "c3_dynamics",
      romanticMeaning: "일상과 위기 상황에서 서로를 지탱하는 행동 역동",
      allowedScenes: ["둘만의 사적 공간", "공동의 책임 조율", "갈등 발생 직후"],
      allowedInference: ["행동 이면의 심리적 의도", "속도 차이의 순기능과 주의점"],
      forbiddenInference: ["가스라이팅 진단", "회피형/불안형 낙인"],
    },
    exactTenGods: [
      plan.personalRelationshipCeA?.spousePalaceProfile?.tenGodName ?? "편인",
      plan.personalRelationshipCeB?.spousePalaceProfile?.tenGodName ?? "비견",
    ],
    confidence: "high",
    supportingEvidence: [],
    contradictingEvidence: [],
    allowedInference: ["역할 분담의 조화", "스트레스 처리 속도 차이의 이해"],
    forbiddenInference: ["임상 진단", "절대적 파국 경고"],
    alreadyUsedClaimsFromAdjacentChapters: ["c2_attraction_core"],
    narrativeBudget: {
      maxSentences: 4,
      maxCharacters: 300,
    },
  };
}

export function buildHiddenHeartsSynthesisInput(
  plan: CanonicalRelationshipStoryPlan,
  person: "a" | "b",
): ExpertSynthesisInputContract {
  const { a, b } = plan.names;
  const targetName = person === "a" ? a : b;
  const partnerName = person === "a" ? b : a;
  const hidden = plan.hiddenHearts.find((h) => h.person === person);

  const exactEvidenceIds: string[] = hidden
    ? hidden.provenance.map((p) => p.evidenceId)
    : [
        `chart.${person}.spouse_palace.need`,
        `chart.${person}.hidden_vulnerability`,
        `chart.${person}.johu.stress`,
      ];

  const selectedClaims: SynthesisClaimInput[] = hidden
    ? [
        {
          claimId: `claim.hidden.${person}.visible_reaction`,
          claimBoundary: "direct_evidence",
          statement: hidden.visibleReaction,
          evidenceIds: [`chart.${person}.johu.stress`],
          confidence: "high",
        },
        {
          claimId: `claim.hidden.${person}.inner_feeling`,
          claimBoundary: "likely_behavior",
          statement: hidden.innerFeeling,
          evidenceIds: [`chart.${person}.hidden_vulnerability`],
          confidence: "high",
        },
        {
          claimId: `claim.hidden.${person}.fear`,
          claimBoundary: "likely_behavior",
          statement: hidden.fear,
          evidenceIds: [`chart.${person}.spouse_palace.need`],
          confidence: "high",
        },
      ]
    : [];

  return {
    chapterId: "c6_hidden_hearts",
    chapterQuestion: "What are the hidden fears and unspoken needs beneath the surface?",
    direction: person === "a" ? "a_to_b" : "b_to_a",
    subjectNames: { a, b },
    selectedClaims,
    exactEvidenceIds,
    canonicalMeaning: {
      core: ["겉으로 드러나는 방어 행동과 내면의 본래 욕구 분리", "인정과 안전에 대한 갈망"],
      relationalPotential: ["상대의 방어 뒤에 숨은 진심을 알아채는 깊은 유대"],
      cautions: ["방어적 침묵을 무관심으로 오해할 위험"],
      forbiddenExtensions: ["트라우마 확정", "애착 장애 진단"],
    },
    romanticLensMeaning: {
      chapterRelevance: "c6_hidden_hearts",
      romanticMeaning: "겉으로 표현하지 못하는 조심스러운 두려움과 파트너가 채워줄 수 있는 안식처",
      allowedScenes: ["서운함이 쌓인 순간", "혼자만의 동굴에 들어간 순간"],
      allowedInference: ["방어적 행동의 원인", "상대방의 따뜻한 지지가 주는 회복력"],
      forbiddenInference: ["정신과적 질환 진단", "치유 불가능 선언"],
    },
    exactTenGods: [
      person === "a"
        ? (plan.personalRelationshipCeA?.spousePalaceProfile?.tenGodName ?? "편인")
        : (plan.personalRelationshipCeB?.spousePalaceProfile?.tenGodName ?? "비견"),
    ],
    confidence: "high",
    supportingEvidence: [],
    contradictingEvidence: [],
    allowedInference: ["겉으로 드러난 단호함 뒤의 인정 욕구", "안전한 여백의 필요성"],
    forbiddenInference: ["트라우마 진단", "원가족 상처 단정"],
    alreadyUsedClaimsFromAdjacentChapters: ["c3_dynamics_stress"],
    narrativeBudget: {
      maxSentences: 4,
      maxCharacters: 300,
    },
  };
}

export function buildStrengthVulnerabilitySynthesisInput(
  plan: CanonicalRelationshipStoryPlan,
  scope: "a_to_b" | "b_to_a" | "shared",
): ExpertSynthesisInputContract {
  const { a, b } = plan.names;

  let direction: SynthesisDirection = "mutual";
  let exactEvidenceIds: string[] = [];
  const selectedClaims: SynthesisClaimInput[] = [];

  if (scope === "a_to_b") {
    direction = "a_to_b";
    const change = plan.bilateralChanges.find((c) => c.from === "a");
    exactEvidenceIds = change
      ? change.provenance.map((p) => p.evidenceId)
      : ["chart.a.strength_given", "chart.a.depletion_risk"];
    if (change) {
      selectedClaims.push(
        {
          claimId: "claim.gift.a_to_b",
          claimBoundary: "direct_evidence",
          statement: change.change,
          evidenceIds: ["chart.a.strength_given"],
          confidence: "high",
        },
        {
          claimId: "claim.excess.a",
          claimBoundary: "likely_behavior",
          statement: change.excessVulnerability,
          evidenceIds: ["chart.a.depletion_risk"],
          confidence: "high",
        },
      );
    }
  } else if (scope === "b_to_a") {
    direction = "b_to_a";
    const change = plan.bilateralChanges.find((c) => c.from === "b");
    exactEvidenceIds = change
      ? change.provenance.map((p) => p.evidenceId)
      : ["chart.b.strength_given", "chart.b.depletion_risk"];
    if (change) {
      selectedClaims.push(
        {
          claimId: "claim.gift.b_to_a",
          claimBoundary: "direct_evidence",
          statement: change.change,
          evidenceIds: ["chart.b.strength_given"],
          confidence: "high",
        },
        {
          claimId: "claim.excess.b",
          claimBoundary: "likely_behavior",
          statement: change.excessVulnerability,
          evidenceIds: ["chart.b.depletion_risk"],
          confidence: "high",
        },
      );
    }
  } else {
    direction = "mutual";
    exactEvidenceIds = [
      "ce.pair.common",
      "canonical_projections.pair_ce_bonding",
      "ce.pair.tension",
      "canonical_projections.pair_ce_tension",
    ];
    selectedClaims.push(
      {
        claimId: "claim.shared.strength",
        claimBoundary: "combination_judgment",
        statement: plan.sharedStrength,
        evidenceIds: ["ce.pair.common", "canonical_projections.pair_ce_bonding"],
        confidence: "high",
      },
      {
        claimId: "claim.shared.vulnerability",
        claimBoundary: "combination_judgment",
        statement: plan.sharedVulnerability,
        evidenceIds: ["ce.pair.tension", "canonical_projections.pair_ce_tension"],
        confidence: "high",
      },
    );
  }

  return {
    chapterId: "c8_strength_vulnerability",
    chapterQuestion: "What is our greatest power and vulnerability as a couple?",
    direction,
    subjectNames: { a, b },
    selectedClaims,
    exactEvidenceIds,
    canonicalMeaning: {
      core: ["상호 보완적인 강점과 그 이면의 에너지 소진 위험", "관계의 공동 방어선"],
      relationalPotential: ["서로의 결핍을 채우는 시너지", "자신을 잃지 않는 건강한 균형"],
      cautions: ["한 사람의 헌신이 당연시되거나 홀로 무게를 짊어질 위험"],
      forbiddenExtensions: ["일방적 의존 조장", "상대를 치료해야 할 환자로 취급"],
    },
    romanticLensMeaning: {
      chapterRelevance: "c8_strength_vulnerability",
      romanticMeaning: "함께할 때 증폭되는 힘과 동시에 조심해야 할 연약한 고리",
      allowedScenes: ["위기 속 상호 의지", "지친 순간 손 내미는 장면"],
      allowedInference: ["기여의 긍정적 효과", "과열 시 보호 장치"],
      forbiddenInference: ["착취 관계 단정", "파국적 종말 예측"],
    },
    exactTenGods: [
      plan.personalRelationshipCeA?.spousePalaceProfile?.tenGodName ?? "편인",
      plan.personalRelationshipCeB?.spousePalaceProfile?.tenGodName ?? "비견",
    ],
    confidence: "high",
    supportingEvidence: [],
    contradictingEvidence: [],
    allowedInference: ["서로에게 주는 용기와 현실적 기반", "동굴 후퇴 시 신호 약속의 중요성"],
    forbiddenInference: ["일방적 희생 요구", "운명론적 단정"],
    alreadyUsedClaimsFromAdjacentChapters: ["c3_dynamics_responsibility"],
    narrativeBudget: {
      maxSentences: 4,
      maxCharacters: 300,
    },
  };
}
