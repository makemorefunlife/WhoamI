import type { FamilyRuleContext } from "./buildFamilyRuleContext";
import type { FamilyParentChildReport } from "./familyReportTemplate";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";

export type NeedsDimension =
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

export type ChildNeedDimensionDetail = {
  dimension: NeedsDimension;
  label: string;
  desiredScore: number; // 0 ~ 100
  suppliedScore: number; // 0 ~ 100
  gap: number; // desiredScore - suppliedScore
  status: "WELL_SUPPLIED" | "PARTIALLY_SUPPLIED" | "MISMATCHED" | "NEEDS_ATTENTION";
  confidence: "high" | "medium";
  evidence: string[];
  discrepancyNote?: string;
};

export type ChildParentingNeedsOutput = {
  innateParentingNeeds: { dimension: NeedsDimension; label: string; description: string }[];
  wellSuppliedNeeds: { dimension: NeedsDimension; label: string; description: string }[];
  primaryNeeds: { dimension: NeedsDimension; label: string; description: string; gapStatus: string }[];
  summary: string;
  discrepancySummary?: string;
  dimensionDetails: ChildNeedDimensionDetail[];
};

const DIMENSION_LABELS: Record<NeedsDimension, { ko: string; en: string }> = {
  emotional_acceptance: { ko: "정서적 수용과 무조건적 안전지대", en: "Emotional Acceptance & Safe Haven" },
  recognition: { ko: "조건 없는 인정과 세심한 칭찬", en: "Unconditional Recognition & Praise" },
  structure: { ko: "예측 가능한 규칙과 명확한 기준", en: "Predictable Structure & Standards" },
  autonomy: { ko: "스스로 탐색할 자율성과 선택권", en: "Autonomy & Power of Choice" },
  patience: { ko: "아이의 속도에 맞춘 기다림", en: "Patience & Pace Respect" },
  explanation: { ko: "이유 있는 설명과 납득 중심 대화", en: "Reasoned Explanation & Dialogue" },
  practical_support: { ko: "현실적 도구와 실질적 조력", en: "Practical Support & Tools" },
  challenge: { ko: "적절한 자극과 새로운 성취 도전", en: "Optimal Challenge & Growth Edge" },
  consistent_boundaries: { ko: "일관된 한계 설정과 흔들리지 않는 경계", en: "Consistent Boundaries" },
  warm_expression: { ko: "따뜻한 애정 표현과 신체적 친밀감", en: "Warm Expression & Affection" },
};

export function computeChildParentingNeedsEngine(params: {
  ctx: FamilyRuleContext;
  report: FamilyParentChildReport;
  psychParent: PsychMasterJson | null;
  psychChild: PsychMasterJson | null;
}): ChildParentingNeedsOutput {
  const { ctx, report, psychParent, psychChild } = params;

  // 1. Child Saju Structure & Canonical Facts
  const countsChild = ctx.tenGod.countsChild;
  const sealChild = (countsChild["정인"] ?? 0) + (countsChild["편인"] ?? 0);
  const foodChild = (countsChild["식신"] ?? 0) + (countsChild["상관"] ?? 0);
  const officerChild = (countsChild["정관"] ?? 0) + (countsChild["편관"] ?? 0);
  const selfChild = (countsChild["비견"] ?? 0) + (countsChild["겁재"] ?? 0);
  const wealthChild = (countsChild["정재"] ?? 0) + (countsChild["편재"] ?? 0);

  const isChildWeak = ctx.canonicalPersonalChild?.isWeak ?? false;

  // Ten God Counts for Parent
  const countsParent = ctx.tenGod.countsParent;
  const sealParent = (countsParent["정인"] ?? 0) + (countsParent["편인"] ?? 0);
  const officerParent = (countsParent["정관"] ?? 0) + (countsParent["편관"] ?? 0);
  const foodParent = (countsParent["식신"] ?? 0) + (countsParent["상관"] ?? 0);

  // Psych Secondary Axes
  const pChildEmpathy = psychChild?.secondary_axes?.empathy ?? 50;
  const pChildRecognition = psychChild?.secondary_axes?.recognition ?? 50;
  const pChildStructure = psychChild?.secondary_axes?.structure ?? 50;
  const pChildStimulation = psychChild?.secondary_axes?.stimulation ?? 50;

  const pParentEmpathy = psychParent?.secondary_axes?.empathy ?? 50;
  const pParentStructure = psychParent?.secondary_axes?.structure ?? 50;

  // Pair Delivery Signals from StoryPlan
  const storyPlan = report.canonical_projections?.story_plan;
  const pairMeanings = storyPlan?.pairMeanings;
  const isLoveMisaligned = pairMeanings?.loveExpressionVsReception?.alignment === "misaligned";
  const isPressureHigh = pairMeanings?.expectationVsPressure?.gapLevel === "high";
  const roleReversalRisk = pairMeanings?.dependencyProtection?.roleReversalRisk === true;

  // Calculate Child Desired Scores (0 ~ 100) per Dimension
  const desiredScores: Record<NeedsDimension, { score: number; evidence: string[]; confidence: "high" | "medium"; discrepancy?: string }> = {
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

  // A. Resource / 인성 (신강/신약 명식 구조 및 과유불급 반영)
  if (sealChild === 1 || (sealChild >= 2 && isChildWeak)) {
    // 인성이 유용하거나 신약하여 든든한 서포트가 필요한 경우
    desiredScores.emotional_acceptance.score += 25;
    desiredScores.warm_expression.score += 20;
    desiredScores.emotional_acceptance.evidence.push(
      isChildWeak
        ? "신약한 명식 내 인성 지원: 부모의 정서적 포용과 따뜻한 든든한 서포트가 꼭 필요함"
        : "명식 내 적정 인성: 부모의 따뜻한 보호와 정서적 안전지대 필요"
    );
  } else if (sealChild >= 2 && !isChildWeak) {
    // 신강 + 인성 과다 -> 밀착 과보호 시 답답함 유발, 자율성과 거리두기 선호
    desiredScores.autonomy.score += 25;
    desiredScores.patience.score += 25;
    desiredScores.emotional_acceptance.score -= 10;
    desiredScores.autonomy.evidence.push("명식 내 인성 과다: 밀착 과보호 시 답답함 유발, 적절한 거리와 기다림 필요");
  }

  // B. Output / 식상
  if (foodChild >= 1) {
    desiredScores.autonomy.score += 25;
    desiredScores.explanation.score += 20;
    desiredScores.challenge.score += 15;
    desiredScores.autonomy.evidence.push("명식 내 식상 기운: 지시 통제보다 스스로 해보는 자율성과 선택권 필요");
  }

  // C. Officer / 관성
  if (officerChild >= 1 && foodChild === 0) {
    desiredScores.structure.score += 25;
    desiredScores.consistent_boundaries.score += 20;
    desiredScores.structure.evidence.push("명식 내 관성 유용: 명확한 기준과 일관된 규칙이 안정감을 줌");
  } else if (officerChild >= 1 && foodChild >= 1) {
    desiredScores.explanation.score += 25;
    desiredScores.patience.score += 20;
    desiredScores.explanation.evidence.push("명식 내 식상-관성 공존: 일방적 지시 시 저항, 이유 있는 설명과 설득 필수");
  }

  // D. 比劫 / 비겁
  if (selfChild >= 2) {
    desiredScores.autonomy.score += 20;
    desiredScores.recognition.score += 20;
    desiredScores.autonomy.evidence.push("명식 내 비겁 강세: 자기주도성과 동등한 대등 존중 필요");
  }

  // E. 재성
  if (wealthChild >= 2) {
    desiredScores.practical_support.score += 25;
    desiredScores.recognition.score += 15;
    desiredScores.practical_support.evidence.push("명식 내 재성 발달: 구체적 피드백과 실질적 성취 보상 선호");
  }

  // Combine with Psych 11-Axis & Discrepancy
  if (pChildRecognition >= 65) {
    desiredScores.recognition.score += 20;
    desiredScores.recognition.confidence = "high";
    desiredScores.recognition.evidence.push("심리 11축 인정 욕구(recognition) 밴드 높음");
  }
  if (pChildEmpathy >= 65) {
    desiredScores.emotional_acceptance.score += 20;
    desiredScores.emotional_acceptance.confidence = "high";
    desiredScores.emotional_acceptance.evidence.push("심리 11축 공감(empathy) 밴드 높음");
  }
  if (pChildStructure >= 65) {
    desiredScores.structure.score += 20;
    desiredScores.structure.confidence = "high";
    desiredScores.structure.evidence.push("심리 11축 구조(structure) 밴드 높음");
  }
  if (pChildStimulation >= 65) {
    desiredScores.autonomy.score += 20;
    desiredScores.challenge.score += 15;
    desiredScores.autonomy.confidence = "high";
    desiredScores.autonomy.evidence.push("심리 11축 자극/탐색(stimulation) 밴드 높음");
  }

  if (foodChild >= 1 && pChildStructure >= 65) {
    desiredScores.autonomy.discrepancy = "본래는 자율성(식상) 욕구가 강하나, 현재는 부모의 규칙(structure)에 익숙해져 수동적으로 맞춰주는 경향이 있음";
  }

  // 2. Parent Actual Supply (Pair-Level Delivery Evidence Integration)
  let rawSupplyAcceptance = pParentEmpathy;
  let rawSupplyWarmth = (pParentEmpathy + (sealParent >= 1 ? 70 : 40)) / 2;
  let rawSupplyRecognition = (pParentEmpathy + (foodParent >= 1 ? 70 : 40)) / 2;
  let rawSupplyStructure = pParentStructure;
  let rawSupplyBoundaries = (pParentStructure + (officerParent >= 1 ? 70 : 40)) / 2;
  let rawSupplyAutonomy = 100 - pParentStructure;
  let rawSupplyPatience = 100 - pParentStructure;

  // Apply Pair Delivery Corrections
  if (isLoveMisaligned) {
    rawSupplyAcceptance -= 25;
    rawSupplyRecognition -= 20;
    rawSupplyWarmth -= 20;
  }

  if (isPressureHigh) {
    rawSupplyStructure -= 30; // 훈육 압박이 크면 건강한 규칙 제공이 아님
    rawSupplyBoundaries -= 20;
    rawSupplyPatience -= 20;
  }

  if (roleReversalRisk) {
    rawSupplyAcceptance -= 20;
    rawSupplyBoundaries -= 25;
  }

  const suppliedScores: Record<NeedsDimension, number> = {
    emotional_acceptance: Math.max(0, rawSupplyAcceptance),
    warm_expression: Math.max(0, rawSupplyWarmth),
    recognition: Math.max(0, rawSupplyRecognition),
    structure: Math.max(0, rawSupplyStructure),
    consistent_boundaries: Math.max(0, rawSupplyBoundaries),
    autonomy: Math.max(0, rawSupplyAutonomy),
    patience: Math.max(0, rawSupplyPatience),
    explanation: (rawSupplyAcceptance + rawSupplyAutonomy) / 2,
    practical_support: (rawSupplyStructure + (sealParent >= 1 ? 65 : 45)) / 2,
    challenge: rawSupplyStructure,
  };

  // 3. Compute Dimension Details & Gaps with Overrides
  const dimensions: NeedsDimension[] = [
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

  const dimensionDetails: ChildNeedDimensionDetail[] = dimensions.map((dim) => {
    const desired = Math.min(100, Math.max(0, desiredScores[dim].score));
    const supplied = Math.min(100, Math.max(0, suppliedScores[dim]));
    const gap = desired - supplied;

    let status: ChildNeedDimensionDetail["status"] = "PARTIALLY_SUPPLIED";

    // Pair Delivery Exception Overrides
    const isLoveRelated = dim === "emotional_acceptance" || dim === "recognition" || dim === "warm_expression";
    const isStructureRelated = dim === "structure" || dim === "consistent_boundaries" || dim === "challenge";

    if (isLoveRelated && isLoveMisaligned) {
      status = gap > 20 ? "NEEDS_ATTENTION" : "MISMATCHED"; // 절대 WELL_SUPPLIED 불허
    } else if (isStructureRelated && isPressureHigh) {
      status = gap > 15 ? "NEEDS_ATTENTION" : "MISMATCHED"; // 압박 시 WELL_SUPPLIED 불허
    } else if (supplied >= desired - 10) {
      status = "WELL_SUPPLIED";
    } else if (gap > 35) {
      status = "NEEDS_ATTENTION";
    } else if (gap > 20) {
      status = "MISMATCHED";
    }

    return {
      dimension: dim,
      label: DIMENSION_LABELS[dim].ko,
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
  const innateParentingNeeds = sortedByDesired.slice(0, 3).map((d) => ({
    dimension: d.dimension,
    label: d.label,
    description: d.evidence[0] || `아이의 명식과 심리 성향상 ${d.label} 성향이 강함`,
  }));

  const wellSuppliedNeeds = dimensionDetails
    .filter((d) => d.status === "WELL_SUPPLIED" && d.desiredScore >= 50)
    .slice(0, 3)
    .map((d) => ({
      dimension: d.dimension,
      label: d.label,
      description: `부모가 이미 충분히 제공하고 있어 아이가 안정감을 느끼는 부분입니다.`,
    }));

  const primaryNeedsList = dimensionDetails
    .filter((d) => d.status !== "WELL_SUPPLIED" && d.desiredScore >= 50)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 3)
    .map((d) => ({
      dimension: d.dimension,
      label: d.label,
      description: d.discrepancyNote || `${d.label} 욕구(선호도 ${d.desiredScore}점) 대비 부모의 현 공급(${d.suppliedScore}점) 사이에 갭이 존재합니다.`,
      gapStatus: d.status === "NEEDS_ATTENTION" ? "시급한 조율 필요" : "부분 보충 추천",
    }));

  if (primaryNeedsList.length === 0) {
    primaryNeedsList.push({
      dimension: sortedByDesired[0]!.dimension,
      label: sortedByDesired[0]!.label,
      description: "현재 부모님이 아이의 핵심 욕구를 훌륭히 채워주고 계시며, 현 기조를 유지해 주시면 충분합니다.",
      gapStatus: "현재 훌륭함",
    });
  }

  const discrepancySignal = dimensionDetails.find((d) => d.discrepancyNote)?.discrepancyNote;

  return {
    innateParentingNeeds,
    wellSuppliedNeeds,
    primaryNeeds: primaryNeedsList,
    summary: `${ctx.childNickname}에게 본래 필요한 parenting 태도는 '${innateParentingNeeds[0]?.label}'이며, 현재 이 관계에서 특히 채워주어야 할 핵심 욕구는 '${primaryNeedsList[0]?.label}'입니다.`,
    discrepancySummary: discrepancySignal,
    dimensionDetails,
  };
}
