import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { PairSajuAnalysis, CanonicalPersonalSajuFacts } from "@/lib/saju/pairChartAnalysis";

export type RomanticNeedsDimension =
  | "emotional_acceptance"
  | "recognition"
  | "structure"
  | "autonomy"
  | "patience"
  | "explanation"
  | "practical_support"
  | "challenge"
  | "consistent_boundaries"
  | "warm_expression";

export type RomanticNeedDimensionDetail = {
  dimension: RomanticNeedsDimension;
  label: string;
  desiredScore: number; // 0 ~ 100
  suppliedScore: number; // 0 ~ 100
  gap: number; // desiredScore - suppliedScore
  status: "WELL_SUPPLIED" | "PARTIALLY_SUPPLIED" | "MISMATCHED" | "NEEDS_ATTENTION";
  confidence: "high" | "medium";
  evidence: string[];
  discrepancyNote?: string;
};

export type DirectionalRelationshipNeedsOutput = {
  personName: string;
  partnerName: string;
  innateNeeds: { dimension: RomanticNeedsDimension; label: string; description: string }[];
  wellSuppliedNeeds: { dimension: RomanticNeedsDimension; label: string; description: string }[];
  primaryNeeds: { dimension: RomanticNeedsDimension; label: string; description: string; gapStatus: string }[];
  summary: string;
  discrepancySummary?: string;
  dimensionDetails: RomanticNeedDimensionDetail[];
};

export type RomanticPairNeedsOutput = {
  needsA: DirectionalRelationshipNeedsOutput;
  needsB: DirectionalRelationshipNeedsOutput;
  overallSummary: string;
};

const DIMENSION_LABELS_ROMANTIC: Record<RomanticNeedsDimension, { ko: string; en: string }> = {
  emotional_acceptance: { ko: "정서적 수용과 무조건적 편안함", en: "Emotional Acceptance & Comfort" },
  recognition: { ko: "인정과 존재 가치 칭찬", en: "Recognition & Appreciation" },
  structure: { ko: "명확한 연애 기준과 안정적 리듬", en: "Clear Relationship Standards & Rhythm" },
  autonomy: { ko: "자기 공간과 서로의 독립성 존중", en: "Personal Space & Mutual Autonomy" },
  patience: { ko: "감정 처리 속도에 맞춘 기다림", en: "Patience & Emotional Pace Respect" },
  explanation: { ko: "이유 있는 대화와 납득 중심 소통", en: "Reasoned Dialogue & Understanding" },
  practical_support: { ko: "현실적 헌신과 구체적 도움", en: "Practical Support & Devotion" },
  challenge: { ko: "함께 성장하는 자극과 비전 공유", en: "Mutual Growth & Shared Challenge" },
  consistent_boundaries: { ko: "흔들리지 않는 건강한 애정 경계", en: "Consistent Emotional Boundaries" },
  warm_expression: { ko: "따뜻한 애정 표현과 다정한 스킨십", en: "Warm Affection & Physical Intimacy" },
};

function computeDirectionalNeeds(params: {
  seekerName: string;
  providerName: string;
  countsSeeker: Record<string, number>;
  countsProvider: Record<string, number>;
  canonicalSeeker?: CanonicalPersonalSajuFacts;
  canonicalProvider?: CanonicalPersonalSajuFacts;
  psychSeeker: PsychMasterJson | null;
  psychProvider: PsychMasterJson | null;
  isLoveMisaligned?: boolean;
  isPressureHigh?: boolean;
}): DirectionalRelationshipNeedsOutput {
  const {
    seekerName,
    providerName,
    countsSeeker,
    countsProvider,
    canonicalSeeker,
    psychSeeker,
    psychProvider,
    isLoveMisaligned,
    isPressureHigh,
  } = params;

  const sealSeeker = (countsSeeker["정인"] ?? 0) + (countsSeeker["편인"] ?? 0);
  const foodSeeker = (countsSeeker["식신"] ?? 0) + (countsSeeker["상관"] ?? 0);
  const officerSeeker = (countsSeeker["정관"] ?? 0) + (countsSeeker["편관"] ?? 0);
  const selfSeeker = (countsSeeker["비견"] ?? 0) + (countsSeeker["겁재"] ?? 0);
  const wealthSeeker = (countsSeeker["정재"] ?? 0) + (countsSeeker["편재"] ?? 0);

  const isSeekerWeak = canonicalSeeker?.isWeak ?? false;

  const sealProvider = (countsProvider["정인"] ?? 0) + (countsProvider["편인"] ?? 0);
  const officerProvider = (countsProvider["정관"] ?? 0) + (countsProvider["편관"] ?? 0);
  const foodProvider = (countsProvider["식신"] ?? 0) + (countsProvider["상관"] ?? 0);

  const pSeekerEmpathy = psychSeeker?.secondary_axes?.empathy ?? 50;
  const pSeekerRecognition = psychSeeker?.secondary_axes?.recognition ?? 50;
  const pSeekerStructure = psychSeeker?.secondary_axes?.structure ?? 50;
  const pSeekerStimulation = psychSeeker?.secondary_axes?.stimulation ?? 50;

  const pProviderEmpathy = psychProvider?.secondary_axes?.empathy ?? 50;
  const pProviderStructure = psychProvider?.secondary_axes?.structure ?? 50;

  const desiredScores: Record<RomanticNeedsDimension, { score: number; evidence: string[]; confidence: "high" | "medium"; discrepancy?: string }> = {
    emotional_acceptance: { score: 50, evidence: [], confidence: "medium" },
    recognition: { score: 50, evidence: [], confidence: "medium" },
    structure: { score: 50, evidence: [], confidence: "medium" },
    autonomy: { score: 50, evidence: [], confidence: "medium" },
    patience: { score: 50, evidence: [], confidence: "medium" },
    explanation: { score: 50, evidence: [], confidence: "medium" },
    practical_support: { score: 50, evidence: [], confidence: "medium" },
    challenge: { score: 50, evidence: [], confidence: "medium" },
    consistent_boundaries: { score: 50, evidence: [], confidence: "medium" },
    warm_expression: { score: 50, evidence: [], confidence: "medium" },
  };

  // 1. Saju Desired Needs Calculation
  if (sealSeeker === 1 || (sealSeeker >= 2 && isSeekerWeak)) {
    desiredScores.emotional_acceptance.score += 25;
    desiredScores.warm_expression.score += 20;
    desiredScores.emotional_acceptance.evidence.push(
      isSeekerWeak
        ? "신약한 명식 구조: 파트너의 온전한 정서적 수용과 따뜻한 안전지대가 꼭 필요함"
        : "명식 내 적정 인성: 파트너의 따뜻한 포용과 깊은 정서적 교감 선호"
    );
  } else if (sealSeeker >= 2 && !isSeekerWeak) {
    desiredScores.autonomy.score += 25;
    desiredScores.patience.score += 25;
    desiredScores.emotional_acceptance.score -= 10;
    desiredScores.autonomy.evidence.push("명식 내 인성 과다: 지나친 과밀착 시 답답함 유발, 자기 시간 존중과 기다림 필요");
  }

  if (foodSeeker >= 1) {
    desiredScores.autonomy.score += 25;
    desiredScores.explanation.score += 20;
    desiredScores.challenge.score += 15;
    desiredScores.autonomy.evidence.push("명식 내 식상 기운: 일방적 지시 통제보다 스스로 선택하고 표현할 자율성 필요");
  }

  if (officerSeeker >= 1 && foodSeeker === 0) {
    desiredScores.structure.score += 25;
    desiredScores.consistent_boundaries.score += 20;
    desiredScores.structure.evidence.push("명식 내 관성 유용: 명확한 애정 기준과 안정적인 연애 리듬 선호");
  } else if (officerSeeker >= 1 && foodSeeker >= 1) {
    desiredScores.explanation.score += 25;
    desiredScores.patience.score += 20;
    desiredScores.explanation.evidence.push("명식 내 식관 공존: 일방적 기대 시 부담, 납득 중심의 차분한 대화 필수");
  }

  if (selfSeeker >= 2) {
    desiredScores.autonomy.score += 20;
    desiredScores.recognition.score += 20;
    desiredScores.autonomy.evidence.push("명식 내 비겁 강세: 대등한 인격체로서의 존중과 연애 주도성 선호");
  }

  if (wealthSeeker >= 2) {
    desiredScores.practical_support.score += 25;
    desiredScores.recognition.score += 15;
    desiredScores.practical_support.evidence.push("명식 내 재성 발달: 말뿐인 애정보다 구체적 헌신과 현실적 도움 선호");
  }

  // 2. Combine with Psych 11-Axis
  if (pSeekerRecognition >= 65) {
    desiredScores.recognition.score += 20;
    desiredScores.recognition.confidence = "high";
    desiredScores.recognition.evidence.push("심리 11축 인정 욕구(recognition) 밴드 높음");
  }
  if (pSeekerEmpathy >= 65) {
    desiredScores.emotional_acceptance.score += 20;
    desiredScores.emotional_acceptance.confidence = "high";
    desiredScores.emotional_acceptance.evidence.push("심리 11축 공감(empathy) 밴드 높음");
  }
  if (pSeekerStructure >= 65) {
    desiredScores.structure.score += 20;
    desiredScores.structure.confidence = "high";
    desiredScores.structure.evidence.push("심리 11축 구조(structure) 밴드 높음");
  }
  if (pSeekerStimulation >= 65) {
    desiredScores.autonomy.score += 20;
    desiredScores.challenge.score += 15;
    desiredScores.autonomy.confidence = "high";
    desiredScores.autonomy.evidence.push("심리 11축 자극/탐색(stimulation) 밴드 높음");
  }

  if (foodSeeker >= 1 && pSeekerStructure >= 65) {
    desiredScores.autonomy.discrepancy = `${seekerName}님은 본래 자율성 욕구가 강하나 현재 파트너의 기준에 익숙해져 맞춰주고 있을 가능성이 있습니다.`;
  }

  // 3. Partner Actual Delivery Calculation (Applying Pair Evidence)
  let rawSupplyAcceptance = pProviderEmpathy;
  let rawSupplyWarmth = (pProviderEmpathy + (sealProvider >= 1 ? 70 : 40)) / 2;
  let rawSupplyRecognition = (pProviderEmpathy + (foodProvider >= 1 ? 70 : 40)) / 2;
  let rawSupplyStructure = pProviderStructure;
  let rawSupplyBoundaries = (pProviderStructure + (officerProvider >= 1 ? 70 : 40)) / 2;
  let rawSupplyAutonomy = 100 - pProviderStructure;
  let rawSupplyPatience = 100 - pProviderStructure;

  if (isLoveMisaligned) {
    rawSupplyAcceptance -= 25;
    rawSupplyRecognition -= 20;
    rawSupplyWarmth -= 20;
  }

  if (isPressureHigh) {
    rawSupplyStructure -= 30; // 중압감 작용 시 유용한 구조 전달량 감소
    rawSupplyBoundaries -= 20;
    rawSupplyPatience -= 20;
  }

  const suppliedScores: Record<RomanticNeedsDimension, number> = {
    emotional_acceptance: Math.max(0, rawSupplyAcceptance),
    warm_expression: Math.max(0, rawSupplyWarmth),
    recognition: Math.max(0, rawSupplyRecognition),
    structure: Math.max(0, rawSupplyStructure),
    consistent_boundaries: Math.max(0, rawSupplyBoundaries),
    autonomy: Math.max(0, rawSupplyAutonomy),
    patience: Math.max(0, rawSupplyPatience),
    explanation: (rawSupplyAcceptance + rawSupplyAutonomy) / 2,
    practical_support: (rawSupplyStructure + (sealProvider >= 1 ? 65 : 45)) / 2,
    challenge: rawSupplyStructure,
  };

  // 4. Compute Dimension Details & Pair Gaps
  const dimensions: RomanticNeedsDimension[] = [
    "emotional_acceptance",
    "recognition",
    "structure",
    "autonomy",
    "patience",
    "explanation",
    "practical_support",
    "challenge",
    "consistent_boundaries",
    "warm_expression",
  ];

  const dimensionDetails: RomanticNeedDimensionDetail[] = dimensions.map((dim) => {
    const desired = Math.min(100, Math.max(0, desiredScores[dim].score));
    const supplied = Math.min(100, Math.max(0, suppliedScores[dim]));
    const gap = desired - supplied;

    let status: RomanticNeedDimensionDetail["status"] = "PARTIALLY_SUPPLIED";

    const isLoveRelated = dim === "emotional_acceptance" || dim === "recognition" || dim === "warm_expression";
    const isStructureRelated = dim === "structure" || dim === "consistent_boundaries" || dim === "challenge";

    if (isLoveRelated && isLoveMisaligned) {
      status = gap > 20 ? "NEEDS_ATTENTION" : "MISMATCHED";
    } else if (isStructureRelated && isPressureHigh) {
      status = gap > 15 ? "NEEDS_ATTENTION" : "MISMATCHED";
    } else if (supplied >= desired - 10) {
      status = "WELL_SUPPLIED";
    } else if (gap > 35) {
      status = "NEEDS_ATTENTION";
    } else if (gap > 20) {
      status = "MISMATCHED";
    }

    return {
      dimension: dim,
      label: DIMENSION_LABELS_ROMANTIC[dim].ko,
      desiredScore: Math.round(desired),
      suppliedScore: Math.round(supplied),
      gap: Math.round(gap),
      status,
      confidence: desiredScores[dim].confidence,
      evidence: desiredScores[dim].evidence,
      discrepancyNote: desiredScores[dim].discrepancy,
    };
  });

  const sortedByDesired = [...dimensionDetails].sort((a, b) => b.desiredScore - a.desiredScore);
  const innateNeeds = sortedByDesired.slice(0, 3).map((d) => ({
    dimension: d.dimension,
    label: d.label,
    description: d.evidence[0] || `${seekerName}님의 본래 연애 성향상 ${d.label} 욕구가 높음`,
  }));

  const wellSuppliedNeeds = dimensionDetails
    .filter((d) => d.status === "WELL_SUPPLIED" && d.desiredScore >= 50)
    .slice(0, 3)
    .map((d) => ({
      dimension: d.dimension,
      label: d.label,
      description: `${providerName}님이 이미 충분히 채워주고 계셔서 안정감을 느끼는 부분입니다.`,
    }));

  const primaryNeedsList = dimensionDetails
    .filter((d) => d.status !== "WELL_SUPPLIED" && d.desiredScore >= 50)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 3)
    .map((d) => ({
      dimension: d.dimension,
      label: d.label,
      description: d.discrepancyNote || `${d.label} 욕구(선호도 ${d.desiredScore}점) 대비 ${providerName}님의 전달력(${d.suppliedScore}점) 사이에 갭이 존재합니다.`,
      gapStatus: d.status === "NEEDS_ATTENTION" ? "시급한 배려 필요" : "부분 조율 추천",
    }));

  if (primaryNeedsList.length === 0) {
    primaryNeedsList.push({
      dimension: sortedByDesired[0]!.dimension,
      label: sortedByDesired[0]!.label,
      description: `${providerName}님이 ${seekerName}님의 핵심 연애 욕구를 훌륭히 채워주고 계십니다.`,
      gapStatus: "조화로움",
    });
  }

  const discrepancySignal = dimensionDetails.find((d) => d.discrepancyNote)?.discrepancyNote;

  return {
    personName: seekerName,
    partnerName: providerName,
    innateNeeds,
    wellSuppliedNeeds,
    primaryNeeds: primaryNeedsList,
    summary: `${seekerName}님이 본래 필요로 하는 연애 태도는 '${innateNeeds[0]?.label}'이며, 현재 관계에서 ${providerName}님에게 더 받길 원하는 핵심 욕구는 '${primaryNeedsList[0]?.label}'입니다.`,
    discrepancySummary: discrepancySignal,
    dimensionDetails,
  };
}

export function computeRomanticRelationshipNeedsEngine(params: {
  nicknameA: string;
  nicknameB: string;
  countsA: Record<string, number>;
  countsB: Record<string, number>;
  canonicalA?: CanonicalPersonalSajuFacts;
  canonicalB?: CanonicalPersonalSajuFacts;
  psychA: PsychMasterJson | null;
  psychB: PsychMasterJson | null;
  isLoveMisaligned?: boolean;
  isPressureHigh?: boolean;
}): RomanticPairNeedsOutput {
  const needsA = computeDirectionalNeeds({
    seekerName: params.nicknameA,
    providerName: params.nicknameB,
    countsSeeker: params.countsA,
    countsProvider: params.countsB,
    canonicalSeeker: params.canonicalA,
    canonicalProvider: params.canonicalB,
    psychSeeker: params.psychA,
    psychProvider: params.psychB,
    isLoveMisaligned: params.isLoveMisaligned,
    isPressureHigh: params.isPressureHigh,
  });

  const needsB = computeDirectionalNeeds({
    seekerName: params.nicknameB,
    providerName: params.nicknameA,
    countsSeeker: params.countsB,
    countsProvider: params.countsA,
    canonicalSeeker: params.canonicalB,
    canonicalProvider: params.canonicalA,
    psychSeeker: params.psychB,
    psychProvider: params.psychA,
    isLoveMisaligned: params.isLoveMisaligned,
    isPressureHigh: params.isPressureHigh,
  });

  const overallSummary = `${params.nicknameA}님은 '${needsA.primaryNeeds[0]?.label}', ${params.nicknameB}님은 '${needsB.primaryNeeds[0]?.label}'을(를) 파트너에게 가장 기대하고 있습니다.`;

  return {
    needsA,
    needsB,
    overallSummary,
  };
}
