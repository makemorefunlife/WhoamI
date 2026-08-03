/**
 * Romantic V4 Chapter Lens Resolvers.
 * Deterministically projects Personal CE and Pair CE into rich, typed, pair-specific narratives
 * for Chapter 3 (Dynamics), Chapter 6 (Hidden Hearts), and Chapter 8 (Strength & Vulnerability).
 */

import type {
  StoryFace,
  HiddenHeartBits,
  BilateralChange,
  ProvenanceRef,
} from "./canonicalStoryPlanTypes";
import type { PersonalRelationshipCe } from "./personalRelationshipCe";
import {
  topicParticle,
  subjectParticle,
  objectParticle,
  withParticle,
  roParticle,
  sanitizeKoreanParticles,
} from "../../koreanParticles";

function createProv(
  evidenceId: string,
  source: string,
  sourcePath: string,
  appliesTo: "a" | "b" | "pair" | "relationship",
  confidence: "deterministic" | "high" | "medium" | "low" | "tentative" = "high",
  claimBoundary: "direct_evidence" | "combination_judgment" | "likely_behavior" | "limited_inference" = "direct_evidence",
): ProvenanceRef {
  return {
    evidenceId,
    source,
    sourcePath,
    appliesTo,
    confidence,
    claimBoundary,
    priority: "primary",
  };
}

// -----------------------------------------------------------------------------------------
// 1. Chapter 6: Hidden Hearts Lens Resolver (가장 깊은 곳, 숨은 마음)
// -----------------------------------------------------------------------------------------

export function resolveHiddenHeartsLens(params: {
  relCeA?: PersonalRelationshipCe | null;
  relCeB?: PersonalRelationshipCe | null;
  names: { a: string; b: string };
}): HiddenHeartBits[] {
  const { relCeA, relCeB, names } = params;
  const a = names.a;
  const b = names.b;

  const result: HiddenHeartBits[] = [];

  if (relCeA) {
    const spA = relCeA.spousePalaceProfile;
    const needText = spA?.intimateNeed ?? relCeA.relationshipNeeds[0]?.text ?? "자신의 속도와 기준이 온전히 존중받는 정서적 안전감";
    const repairText = spA?.profile.repairNeed ?? "차분하게 생각을 정리할 수 있는 여유와 따뜻한 신뢰의 확인";
    const visReaction = relCeA.stressResponse?.text ?? "감정 충돌을 피하며 차분히 생각을 정리하려 합니다.";
    const innerFeel = relCeA.hiddenVulnerability?.text ?? "겉으로는 의연해 보이지만 내면 깊은 곳에서는 따뜻한 인정과 확신을 간절히 바라고 있습니다.";

    const reason = spA?.profile.core
      ? `${spA.profile.core}에서 비롯된 것으로, ${spA.profile.relationshipTendency}`
      : `${topicParticle(a)} 관계의 중심을 지키고 상처를 최소화하고자 하기 때문입니다.`;
    const fear = spA?.profile.shadow
      ? `${topicParticle(a)} 자신의 진심이 곡해되거나, ${spA.profile.shadow}`
      : `${topicParticle(a)} 자신의 진심이 곡해되거나 상대에게 부담과 거절로 돌아올지 모른다는 두려움`;

    const provenance: ProvenanceRef[] = [
      createProv(
        `chart.a.spouse_palace.need`,
        "personal_saju_chart",
        "pillars.day.branch_ten_god",
        "a",
        "high",
        "direct_evidence",
      ),
      createProv(
        `chart.a.hidden_vulnerability`,
        "personal_saju_chart",
        "day_master.vulnerability",
        "a",
        "high",
        "direct_evidence",
      ),
      createProv(
        `chart.a.johu.stress`,
        "personal_saju_chart",
        "johu.temperature_band",
        "a",
        "high",
        "direct_evidence",
      ),
    ];

    result.push({
      person: "a",
      visibleReaction: sanitizeKoreanParticles(
        `${topicParticle(a)} 갈등이나 서운함이 생겼을 때 ${visReaction}`,
        [a, b],
      ),
      innerFeeling: sanitizeKoreanParticles(
        `${innerFeel}`,
        [a, b],
      ),
      reason: sanitizeKoreanParticles(reason, [a, b]),
      fear: sanitizeKoreanParticles(fear, [a, b]),
      whatHelps: sanitizeKoreanParticles(
        `${subjectParticle(b)} ${repairText}를 실천하며, ${spA?.profile.recognitionNeed ?? "따뜻한 인정과 확신"}을 진심으로 지지해 주는 태도`,
        [a, b],
      ),
      unspokenNeed: sanitizeKoreanParticles(
        `말하지 않아도 가장 바라는 것은 ${needText}`,
        [a, b],
      ),
      provenance,
    });
  }

  if (relCeB) {
    const spB = relCeB.spousePalaceProfile;
    const needText = spB?.intimateNeed ?? relCeB.relationshipNeeds[0]?.text ?? "자신의 속도와 기준이 온전히 존중받는 정서적 안전감";
    const repairText = spB?.profile.repairNeed ?? "차분하게 생각을 정리할 수 있는 여유와 따뜻한 신뢰의 확인";
    const visReaction = relCeB.stressResponse?.text ?? "감정 충돌을 피하며 차분히 생각을 정리하려 합니다.";
    const innerFeel = relCeB.hiddenVulnerability?.text ?? "겉으로는 의연해 보이지만 내면 깊은 곳에서는 따뜻한 인정과 확신을 간절히 바라고 있습니다.";

    const reason = spB?.profile.core
      ? `${spB.profile.core}에서 비롯된 것으로, ${spB.profile.relationshipTendency}`
      : `${topicParticle(b)} 관계의 중심을 지키고 상처를 최소화하고자 하기 때문입니다.`;
    const fear = spB?.profile.shadow
      ? `${topicParticle(b)} 자신의 진심이 곡해되거나, ${spB.profile.shadow}`
      : `${topicParticle(b)} 자신의 진심이 곡해되거나 상대에게 부담과 거절로 돌아올지 모른다는 두려움`;

    const provenance: ProvenanceRef[] = [
      createProv(
        `chart.b.spouse_palace.need`,
        "personal_saju_chart",
        "pillars.day.branch_ten_god",
        "b",
        "high",
        "direct_evidence",
      ),
      createProv(
        `chart.b.hidden_vulnerability`,
        "personal_saju_chart",
        "day_master.vulnerability",
        "b",
        "high",
        "direct_evidence",
      ),
      createProv(
        `chart.b.johu.stress`,
        "personal_saju_chart",
        "johu.temperature_band",
        "b",
        "high",
        "direct_evidence",
      ),
    ];

    result.push({
      person: "b",
      visibleReaction: sanitizeKoreanParticles(
        `${topicParticle(b)} 갈등이나 서운함이 생겼을 때 ${visReaction}`,
        [a, b],
      ),
      innerFeeling: sanitizeKoreanParticles(
        `${innerFeel}`,
        [a, b],
      ),
      reason: sanitizeKoreanParticles(reason, [a, b]),
      fear: sanitizeKoreanParticles(fear, [a, b]),
      whatHelps: sanitizeKoreanParticles(
        `${subjectParticle(a)} ${repairText}를 실천하며, ${spB?.profile.recognitionNeed ?? "따뜻한 인정과 확신"}을 진심으로 지지해 주는 태도`,
        [a, b],
      ),
      unspokenNeed: sanitizeKoreanParticles(
        `말하지 않아도 가장 바라는 것은 ${needText}`,
        [a, b],
      ),
      provenance,
    });
  }

  return result;
}

// -----------------------------------------------------------------------------------------
// 2. Chapter 3: Dynamics Lens Resolver (우리가 관계를 맺는 방식)
// -----------------------------------------------------------------------------------------

export function resolveDynamicsLens(params: {
  relCeA?: PersonalRelationshipCe | null;
  relCeB?: PersonalRelationshipCe | null;
  names: { a: string; b: string };
  comparisonTable?: Record<string, any>;
}): StoryFace[] {
  const { relCeA, relCeB, names } = params;
  const a = names.a;
  const b = names.b;

  const faces: StoryFace[] = [];

  // Face 1: Private (둘만 있을 때)
  const careA = relCeA?.careExpression?.text ?? `${topicParticle(a)} 행동과 배려로 마음을 전합니다.`;
  const careB = relCeB?.careExpression?.text ?? `${topicParticle(b)} 묵묵한 신뢰와 세심함으로 마음을 전합니다.`;

  const facePrivateProv: ProvenanceRef[] = [
    createProv(
      "chart.a.day_master.nature",
      "personal_saju_chart",
      "day_master.stem",
      "a",
      "high",
      "direct_evidence",
    ),
    createProv(
      "chart.b.day_master.nature",
      "personal_saju_chart",
      "day_master.stem",
      "b",
      "high",
      "direct_evidence",
    ),
    createProv(
      "signals.a.affection_language",
      "romantic_saju_signals",
      "affection_language.affection_band",
      "a",
      "high",
      "direct_evidence",
    ),
    createProv(
      "signals.b.affection_language",
      "romantic_saju_signals",
      "affection_language.affection_band",
      "b",
      "high",
      "direct_evidence",
    ),
  ];

  faces.push({
    situation: "private",
    appearance: sanitizeKoreanParticles(
      `둘만의 편안한 공간에서 ${topicParticle(a)} ${careA} 한편, ${topicParticle(b)} ${careB} 이로써 두 사람은 서로에게 온전한 안식처가 되어줍니다.`,
      [a, b],
    ),
    mechanism: sanitizeKoreanParticles(
      `${topicParticle(a)} ${relCeA?.coreRelationshipNature?.text ?? "자신만의 온기"}를 나누고, ${topicParticle(b)} ${relCeB?.coreRelationshipNature?.text ?? "묵묵한 균형"}을 잡아주어 자연스럽게 정서적 안정을 이룹니다.`,
      [a, b],
    ),
    benefit: sanitizeKoreanParticles(
      `외부의 간섭 없이 둘만의 친밀한 교감과 온전한 휴식을 누릴 수 있는 편안한 안정감`,
      [a, b],
    ),
    riskWhenExcess: sanitizeKoreanParticles(
      `한쪽이 표현을 당연하게 여기거나 상대방의 침묵을 무관심으로 오해할 때 감정의 온도가 어긋날 수 있습니다.`,
      [a, b],
    ),
    observableSignal: sanitizeKoreanParticles(
      `지친 하루 끝에 만났을 때, ${subjectParticle(a)} 먼저 하루의 기분을 털어놓고 ${subjectParticle(b)} 이를 조용히 경청하며 편안한 쉼터를 내어주는 모습`,
      [a, b],
    ),
    provenance: facePrivateProv,
  });

  // Face 2: Responsibility (현실과 책임을 다룰 때)
  const decA = relCeA?.decisionStyle?.text ?? "상황을 직관적으로 파악하고 명확하게 결단을 내립니다.";
  const decB = relCeB?.decisionStyle?.text ?? "현실적인 세부 사항과 실리를 꼼꼼하게 검토하여 신중하게 결정합니다.";

  const faceRespProv: ProvenanceRef[] = [
    createProv(
      "chart.a.day_master.decision",
      "personal_saju_chart",
      "day_master.stem",
      "a",
      "high",
      "direct_evidence",
    ),
    createProv(
      "chart.b.day_master.decision",
      "personal_saju_chart",
      "day_master.stem",
      "b",
      "high",
      "direct_evidence",
    ),
    createProv(
      "chart.a.five_elements.dominant",
      "personal_saju_chart",
      "five_elements.dominant",
      "a",
      "high",
      "direct_evidence",
    ),
    createProv(
      "chart.b.five_elements.dominant",
      "personal_saju_chart",
      "five_elements.dominant",
      "b",
      "high",
      "direct_evidence",
    ),
  ];

  faces.push({
    situation: "responsibility",
    appearance: sanitizeKoreanParticles(
      `현실적인 과제나 일정을 조율할 때 ${topicParticle(a)} ${decA} ${topicParticle(b)} ${decB} 이처럼 두 사람은 각자의 강점을 발휘하여 상호 보완적인 역할 분담을 형성합니다.`,
      [a, b],
    ),
    mechanism: sanitizeKoreanParticles(
      `${a}의 ${relCeA?.coreRelationshipNature?.text ?? "명확한 원칙과 결단력"}과 ${b}의 ${relCeB?.coreRelationshipNature?.text ?? "묵묵한 현실 관리력"}이 결합하여 관계의 실질적 토대를 튼튼하게 세웁니다.`,
      [a, b],
    ),
    benefit: sanitizeKoreanParticles(
      `어려운 문제나 중요한 결정 앞에서도 우왕좌왕하지 않고 빠르고 견고하게 해결책을 찾아내는 실행력`,
      [a, b],
    ),
    riskWhenExcess: sanitizeKoreanParticles(
      `역할 분담이 고착화되어 한 사람에게 결정이나 현실 관리의 보이지 않는 노동이 집중될 경우 피로감이 쌓일 수 있습니다.`,
      [a, b],
    ),
    observableSignal: sanitizeKoreanParticles(
      `여행이나 공동의 계획을 세울 때 ${subjectParticle(a)} 큰 그림과 테마를 제안하고, ${subjectParticle(b)} 구체적인 동선과 예산을 꼼꼼히 정리하는 호흡`,
      [a, b],
    ),
    provenance: faceRespProv,
  });

  // Face 3: Stress (갈등 및 위기 상황)
  const stressA = relCeA?.stressResponse?.text ?? "감정이 고조되어 즉각적인 대화와 해답을 원합니다.";
  const stressB = relCeB?.stressResponse?.text ?? "혼자만의 시간을 가지며 생각을 차분히 정리한 뒤에야 마음을 엽니다.";

  const isSlowA = stressA.includes("동굴") || stressA.includes("침묵") || stressA.includes("물러나");
  const isSlowB = stressB.includes("동굴") || stressB.includes("침묵") || stressB.includes("물러나");
  const isFastA = stressA.includes("즉각") || stressA.includes("바로 대화") || stressA.includes("풀고자");
  const isFastB = stressB.includes("즉각") || stressB.includes("바로 대화") || stressB.includes("풀고자");

  let mechanismStress = `${a}와 ${b}은/는 각자의 방식으로 감정의 파도를 가라앉히고 차분하게 문제의 본질에 접근합니다.`;
  let riskStress = `서로의 스트레스 신호를 제때 감지하지 못해 작은 감정의 응어리가 방치될 위험`;
  let signalStress = `갈등 상황에서 잠시 숨을 고른 뒤 서로의 생각을 조심스럽게 꺼내놓는 순간`;

  if (isSlowA && isSlowB) {
    mechanismStress = `두 사람 모두 갈등 시 즉각적으로 맞서기보다 감정을 가라앉히고 혼자만의 생각을 정리할 시간을 우선시합니다.`;
    riskStress = `서로가 동시에 침묵의 동굴로 물러서며 오해가 장기화되거나 감정의 벽이 두터워질 위험`;
    signalStress = `의견이 부딪힌 후 두 사람 모두 말을 아끼며 각자의 공간에서 차분히 마음을 추스르는 순간`;
  } else if (isFastA && isFastB) {
    mechanismStress = `두 사람 모두 문제를 마음에 담아두지 않고 그 자리에서 즉각적인 대화와 확인을 통해 풀고자 합니다.`;
    riskStress = `감정이 동시에 고조되어 불필요한 언쟁으로 번지거나 서로에게 상처를 주는 말을 쏟아낼 위험`;
    signalStress = `의견이 엇갈렸을 때 두 사람 모두 즉시 상황을 짚으며 적극적으로 대화를 시도하는 순간`;
  } else if (isFastA && isSlowB) {
    mechanismStress = `${a}은/는 빠른 확인을 통해 불안을 해소하려 하고, ${b}은/는 감정의 정돈을 통해 이성적인 대화로 진입하려 합니다.`;
    riskStress = `${a}의 다급한 확인이 ${b}에게는 압박으로 느껴지고, ${b}의 침묵이 ${a}에게는 회피로 오해되어 추격-회피의 고리가 형성될 위험`;
    signalStress = `의견이 맞부딪힌 직후 ${subjectParticle(a)} 즉시 대화를 이어가려 하고, ${subjectParticle(b)} 한 걸음 물러서서 생각할 시간을 요청하는 순간`;
  } else if (isSlowA && isFastB) {
    mechanismStress = `${b}은/는 빠른 확인을 통해 불안을 해소하려 하고, ${a}은/는 감정의 정돈을 통해 이성적인 대화로 진입하려 합니다.`;
    riskStress = `${b}의 다급한 확인이 ${a}에게는 압박으로 느껴지고, ${a}의 침묵이 ${b}에게는 회피로 오해되어 추격-회피의 고리가 형성될 위험`;
    signalStress = `의견이 맞부딪힌 직후 ${subjectParticle(b)} 즉시 대화를 이어가려 하고, ${subjectParticle(a)} 한 걸음 물러서서 생각할 시간을 요청하는 순간`;
  }

  const faceStressProv: ProvenanceRef[] = [
    createProv(
      "chart.a.johu.stress",
      "personal_saju_chart",
      "johu.temperature_band",
      "a",
      "high",
      "direct_evidence",
    ),
    createProv(
      "chart.b.johu.stress",
      "personal_saju_chart",
      "johu.temperature_band",
      "b",
      "high",
      "direct_evidence",
    ),
    createProv(
      "signals.a.conflict_response",
      "romantic_saju_signals",
      "conflict_response.conflict_band",
      "a",
      "high",
      "direct_evidence",
    ),
    createProv(
      "signals.b.conflict_response",
      "romantic_saju_signals",
      "conflict_response.conflict_band",
      "b",
      "high",
      "direct_evidence",
    ),
  ];

  faces.push({
    situation: "stress",
    appearance: sanitizeKoreanParticles(
      `갈등이나 긴장 상황이 발생하면 ${topicParticle(a)} ${stressA} 반면 ${topicParticle(b)} ${stressB} 이로 인해 스트레스를 소화하는 처리 속도와 접근 방식의 차이가 드러납니다.`,
      [a, b],
    ),
    mechanism: sanitizeKoreanParticles(mechanismStress, [a, b]),
    benefit: sanitizeKoreanParticles(
      `즉각적인 폭발을 방지하면서도 문제를 덮어두지 않고 차분하게 본질을 해결할 수 있는 균형점`,
      [a, b],
    ),
    riskWhenExcess: sanitizeKoreanParticles(riskStress, [a, b]),
    observableSignal: sanitizeKoreanParticles(signalStress, [a, b]),
    provenance: faceStressProv,
  });

  return faces;
}

// -----------------------------------------------------------------------------------------
// 3. Chapter 8: Strength & Vulnerability Lens Resolver (함께라서 강해지는 것과 취약해지는 것)
// -----------------------------------------------------------------------------------------

export function resolveStrengthVulnerabilityLens(params: {
  relCeA?: PersonalRelationshipCe | null;
  relCeB?: PersonalRelationshipCe | null;
  names: { a: string; b: string };
}): {
  bilateralChanges: BilateralChange[];
  sharedStrength: string;
  sharedVulnerability: string;
  balancedProtection: string;
} {
  const { relCeA, relCeB, names } = params;
  const a = names.a;
  const b = names.b;

  const strengthA = relCeA?.strengthsGivenToPartner[0]?.text ?? "솔직한 열정과 추진력으로 활력을 불어넣어 줌";
  const deplA = relCeA?.depletionRisk?.text ?? "상대를 챙기느라 자신의 에너지를 과도하게 소진할 위험";

  const strengthB = relCeB?.strengthsGivenToPartner[0]?.text ?? "흔들림 없는 책임감과 신중함으로 든든한 버팀목이 되어줌";
  const deplB = relCeB?.depletionRisk?.text ?? "모든 무게를 혼자 짊어지다 침묵 속에 지칠 위험";

  const bilateralChanges: BilateralChange[] = [
    {
      from: "a",
      to: "b",
      change: sanitizeKoreanParticles(
        `${topicParticle(a)} ${withParticle(b)} 함께할 때 ${strengthA}의 면모를 유감없이 발휘하며, ${b}의 삶에 새로운 생기와 과감한 확장의 용기를 불어넣어 줍니다.`,
        [a, b],
      ),
      excessVulnerability: sanitizeKoreanParticles(
        `다만 ${deplA}이 있으므로, ${a}의 활력과 헌신이 당연시되지 않도록 상호 간의 세심한 인정과 배려가 필요합니다.`,
        [a, b],
      ),
      provenance: [
        createProv(
          "chart.a.strength_given",
          "personal_saju_chart",
          "day_master.strength",
          "a",
          "high",
          "direct_evidence",
        ),
        createProv(
          "chart.a.depletion_risk",
          "personal_saju_chart",
          "day_master.depletion",
          "a",
          "high",
          "direct_evidence",
        ),
      ],
    },
    {
      from: "b",
      to: "a",
      change: sanitizeKoreanParticles(
        `${topicParticle(b)} ${withParticle(a)} 함께할 때 ${strengthB}의 면모를 유감없이 발휘하며, ${a}의 조급함을 가라앉히고 안정적인 현실의 기반을 다져줍니다.`,
        [a, b],
      ),
      excessVulnerability: sanitizeKoreanParticles(
        `다만 ${deplB}이 있으므로, ${b}의 침묵과 인내를 알아채고 먼저 다정한 손을 내밀어 주는 노력이 필요합니다.`,
        [a, b],
      ),
      provenance: [
        createProv(
          "chart.b.strength_given",
          "personal_saju_chart",
          "day_master.strength",
          "b",
          "high",
          "direct_evidence",
        ),
        createProv(
          "chart.b.depletion_risk",
          "personal_saju_chart",
          "day_master.depletion",
          "b",
          "high",
          "direct_evidence",
        ),
      ],
    },
  ];

  const stressA = relCeA?.stressResponse?.text ?? "";
  const stressB = relCeB?.stressResponse?.text ?? "";
  const isSlowA = stressA.includes("동굴") || stressA.includes("침묵") || stressA.includes("물러나");
  const isSlowB = stressB.includes("동굴") || stressB.includes("침묵") || stressB.includes("물러나");
  const isFastA = stressA.includes("즉각") || stressA.includes("바로 대화") || stressA.includes("풀고자");
  const isFastB = stressB.includes("즉각") || stressB.includes("바로 대화") || stressB.includes("풀고자");

  let sharedVulnText = `두 사람의 가장 큰 취약점은 갈등 시 '서로의 스트레스 처리 속도 차이를 기다려주지 못할 때' 발생합니다. 한쪽의 확인 요구와 다른 쪽의 동굴 후퇴가 엇갈리면 강점이던 균형이 일시적으로 단절로 바뀔 수 있습니다.`;
  let balancedProtText = `이 기여를 지키는 핵심 합의: ${a}은/는 ${b}에게 생각할 시간을 보장하고, ${b}은/는 침묵 대신 '언제까지 정리해서 말하겠다'는 확실한 신호를 전달하는 것입니다.`;

  if (isSlowA && isSlowB) {
    sharedVulnText = `두 사람의 가장 큰 취약점은 갈등 시 '동시에 침묵의 동굴로 물러나 대화의 타이밍을 놓칠 때' 발생합니다. 서로가 먼저 손 내밀기를 기다리다 보면 감정의 거리가 벌어질 수 있습니다.`;
    balancedProtText = `이 기여를 지키는 핵심 합의: 혼자 삭이지 않고, '생각을 정리한 뒤 몇 시(또는 며칠 뒤)에 다시 이야기하자'는 대화 재개의 신호를 확실히 공유하는 것입니다.`;
  } else if (isFastA && isFastB) {
    sharedVulnText = `두 사람의 가장 큰 취약점은 갈등 시 '감정이 고조된 상태에서 즉각적인 결론을 밀어붙일 때' 발생합니다.`;
    balancedProtText = `이 기여를 지키는 핵심 합의: 감정이 격해졌을 때는 잠시 대화를 멈추고 각자 10분간 호흡을 가다듬은 뒤 차분하게 다시 마주하는 것입니다.`;
  }

  const sharedStrength = sanitizeKoreanParticles(
    `두 사람이 함께할 때 가장 강력해지는 지점은 '${a}의 ${relCeA?.coreRelationshipNature?.text ?? "결단력"}과 ${b}의 ${relCeB?.coreRelationshipNature?.text ?? "묵묵한 안정감"}'의 결합입니다. 혼자일 때는 놓치기 쉬운 시야와 세밀함을 서로가 빈틈없이 채워주어, 어떤 도전 앞에서도 흔들리지 않는 단단한 팀워크를 발휘합니다.`,
    [a, b],
  );

  const sharedVulnerability = sanitizeKoreanParticles(sharedVulnText, [a, b]);
  const balancedProtection = sanitizeKoreanParticles(balancedProtText, [a, b]);

  return {
    bilateralChanges,
    sharedStrength,
    sharedVulnerability,
    balancedProtection,
  };
}


