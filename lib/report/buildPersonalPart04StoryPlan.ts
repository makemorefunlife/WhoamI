/**
 * Personal Premium V3 Batch 4B — Deterministic Part 04 Story Planner.
 *
 * Constructs a compact, deterministic synthesis plan BEFORE LLM prose generation.
 * Selects primary adaptation, secondary contrast, psych mechanisms, Saju anchors,
 * capability gains, and energy costs, and frames the exact synthesis question.
 *
 * Rules:
 * - Pure deterministic selection — NEVER writes final human Korean prose.
 * - Single SSOT input — reads directly from Part01IdentityEvidencePacket & Part01PromptEvidence.
 * - Restricts evidence_refs to selected keys only for strict provenance.
 */

import type { Part01IdentityEvidencePacket } from "@/lib/v1/slim/part01IdentityEvidence";
import type { Part01PromptEvidence, EvidenceFamily } from "@/lib/report/formatPart01EvidenceForPrompt";

export type PersonalPart04StoryPlan = {
  primaryAdaptation: {
    axis: string;
    direction: "innate_to_current" | "current_to_innate" | "aligned";
    innateBaseline: string;
    currentMode: string;
    evidenceRefs: string[];
  };

  secondaryContrast?: {
    kind: "layer_contrast" | "secondary_gap" | "alignment" | "psych_mechanism";
    key: string;
    description: string;
    evidenceRefs: string[];
  };

  requiredEvidence: {
    primaryRefs: string[];
    contrastRefs: string[];
  };

  optionalEvidence: {
    mechanismRefs: string[];
    supportingRefs: string[];
  };

  currentMechanism?: {
    key: string;
    label: string;
    evidenceRefs: string[];
  };

  supportingInnateStructure?: {
    key: string;
    label: string;
    evidenceRefs: string[];
  };

  gainedCapabilityFocus?: {
    concept: string;
    evidenceRefs: string[];
  };

  hiddenCostFocus?: {
    concept: string;
    evidenceRefs: string[];
  };

  synthesisFrame: {
    targetTension: string;
    question: string;
  };

  /** Union of all selected evidence_refs across this plan */
  selectedEvidenceRefs: string[];

  /** Distinct evidence families present in selectedEvidenceRefs */
  evidenceFamilies: EvidenceFamily[];
};

/**
 * Part A Semantic Context passed after Part A completes (Part 04 Batch 4D).
 */
export type PartASemanticContext = {
  layeredIdentitySynthesis?: string;
  primaryGapProse?: {
    naturalTendency?: string;
    currentPattern?: string;
    gainedStrength?: string;
    hiddenCost?: string;
  };
};

/**
 * Builds a deterministic Personal Part 04 Story Plan from the evidence packet,
 * optionally enriched with completed Part A semantic prose.
 */
export function buildPersonalPart04StoryPlan(
  packet: Part01IdentityEvidencePacket | null | undefined,
  promptEvidence: Part01PromptEvidence | null | undefined,
  partAContext?: PartASemanticContext | null,
): PersonalPart04StoryPlan | null {
  if (!packet || !promptEvidence || !promptEvidence.adaptationStoryEligible) {
    return null;
  }

  // 1. Select Primary Adaptation (widest valid gap axis)
  const gaps = promptEvidence.axisInterpretation.gaps;
  if (gaps.length === 0) return null;

  // Pick widest gap by absolute delta
  const primaryGap = [...gaps].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0];
  const primaryAxisKey = `axis:${primaryGap.axis}`;
  const matchingComparison = packet.axisComparisons.find((c) => c.axis === primaryGap.axis);
  
  // Find current psych keys associated with this gap
  const primaryCurrentKeys = [...primaryGap.currentKnownKeys];
  const primaryEvidenceRefs = [primaryAxisKey, ...primaryCurrentKeys.slice(0, 2)].filter((k) =>
    promptEvidence.adaptationStoryKnownKeys.has(k),
  );

  const axisLabelMap: Record<string, string> = {
    autonomy: "자율성과 주체적 판단",
    connection: "정서적 교감과 관계 조화",
    stability: "예측 가능성과 안정감",
    growth: "새로운 성장과 도전 추구",
    structure: "체계적 계획과 질서",
    adaptability: "유연한 상황 적응",
  };
  const humanAxisConcept = axisLabelMap[primaryGap.axis] || primaryGap.axis;

  const innateBaselineText = partAContext?.primaryGapProse?.naturalTendency ||
    `본래 ${humanAxisConcept}을(를) 우선시하는 성향`;
  const currentModeText = partAContext?.primaryGapProse?.currentPattern ||
    (primaryGap.delta < 0
      ? `현실에서 타인과의 관계 및 상황적 안정성을 위해 상대적으로 조절하게 된 방식`
      : `현실적 필요로 인해 ${humanAxisConcept}의 비중을 높인 방식`);

  const primaryAdaptation = {
    axis: primaryGap.axis,
    direction: (primaryGap.delta < 0 ? "innate_to_current" : "current_to_innate") as "innate_to_current" | "current_to_innate",
    innateBaseline: innateBaselineText,
    currentMode: currentModeText,
    evidenceRefs: primaryEvidenceRefs,
  };

  // 2. Select Secondary Contrast (must be distinct from primary axis)
  let secondaryContrast: PersonalPart04StoryPlan["secondaryContrast"] | undefined;
  
  // Check Layer Contrast (e.g. firstImpression/knownSelf vs closePrivateSelf/naturalSelf)
  const layers = promptEvidence.layeredIdentity;
  const hasPublicLayer = !!layers.firstImpression || !!layers.knownSelf;
  const hasPrivateLayer = !!layers.closePrivateSelf || !!layers.naturalSelfAndDeepNeeds;

  if (hasPublicLayer && hasPrivateLayer) {
    const publicKeys = [...(layers.firstImpression?.knownKeys || []), ...(layers.knownSelf?.knownKeys || [])];
    const privateKeys = [...(layers.closePrivateSelf?.knownKeys || []), ...(layers.naturalSelfAndDeepNeeds?.knownKeys || [])];
    const layerRefs = [...publicKeys.slice(0, 2), ...privateKeys.slice(0, 2)].filter((k) =>
      promptEvidence.adaptationStoryKnownKeys.has(k),
    );
    if (layerRefs.length > 0) {
      secondaryContrast = {
        kind: "layer_contrast",
        key: "relational_distance_shift",
        description: partAContext?.layeredIdentitySynthesis || "대외적 관계 방식과 가까운 관계/내면 욕구 사이의 온도 차이",
        evidenceRefs: layerRefs,
      };
    }
  }

  if (!secondaryContrast && gaps.length >= 2) {
    // Secondary Gap
    const secGap = gaps[1];
    const secAxisName = axisLabelMap[secGap.axis] || secGap.axis;
    secondaryContrast = {
      kind: "secondary_gap",
      key: `axis:${secGap.axis}`,
      description: `${secAxisName} 축에서의 적응 변화`,
      evidenceRefs: [`axis:${secGap.axis}`, ...secGap.currentKnownKeys.slice(0, 1)].filter((k) =>
        promptEvidence.adaptationStoryKnownKeys.has(k),
      ),
    };
  } else if (!secondaryContrast && promptEvidence.axisInterpretation.alignment) {
    // Alignment Axis
    const align = promptEvidence.axisInterpretation.alignment;
    const alignAxisName = axisLabelMap[align.axis] || align.axis;
    secondaryContrast = {
      kind: "alignment",
      key: `axis:${align.axis}`,
      description: `${alignAxisName} 축에서의 본래 성향 유지를 통한 안정적 기반`,
      evidenceRefs: [`axis:${align.axis}`, ...align.currentKnownKeys.slice(0, 1)].filter((k) =>
        promptEvidence.adaptationStoryKnownKeys.has(k),
      ),
    };
  }

  // 3. Select Current Psych Mechanism (CE dimension or secondary score)
  let currentMechanism: PersonalPart04StoryPlan["currentMechanism"] | undefined;
  const usableDims = packet.dimensions.allDimensions.filter(
    (d) => d.dimension !== "solitude_autonomy" || primaryGap.axis !== "autonomy",
  );
  if (usableDims.length > 0) {
    const topDim = usableDims[0];
    const dimKey = `dimension:${topDim.dimension}`;
    if (promptEvidence.adaptationStoryKnownKeys.has(dimKey)) {
      currentMechanism = {
        key: dimKey,
        label: `${topDim.dimension} 대처 기제`,
        evidenceRefs: [dimKey],
      };
    }
  }

  // 4. Select Supporting Innate Saju Structure (Day Master, Ten God, Pillar)
  let supportingInnateStructure: PersonalPart04StoryPlan["supportingInnateStructure"] | undefined;
  const sajuKeys = [...promptEvidence.axisInterpretation.innateEvidenceKnownKeys];
  const structuralSajuKeys = sajuKeys.filter(
    (k) => k === "day_master" || k.startsWith("pillars.") || k.includes("ten_god") || k.includes("element"),
  );
  const selectedSajuKey = structuralSajuKeys[0] || sajuKeys[0];
  if (selectedSajuKey && promptEvidence.adaptationStoryKnownKeys.has(selectedSajuKey)) {
    supportingInnateStructure = {
      key: selectedSajuKey,
      label: `본래 구조적 경향`,
      evidenceRefs: [selectedSajuKey],
    };
  }

  // 5. Gained Capability & Hidden Cost (Clean human concepts only)
  const rawGives = primaryGap.givesYouText;
  const cleanGives = (rawGives && !rawGives.includes("undefined") && !rawGives.includes("null") && !rawGives.includes("score="))
    ? rawGives
    : (partAContext?.primaryGapProse?.gainedStrength || "상황 적응 및 종합적 수용 능력");

  const rawCost = primaryGap.mayCostText;
  const cleanCost = (rawCost && !rawCost.includes("undefined") && !rawCost.includes("null") && !rawCost.includes("score="))
    ? rawCost
    : (partAContext?.primaryGapProse?.hiddenCost || "의사결정 에너지 소모 및 내면 요구 감수");

  const gainedCapabilityFocus = {
    concept: cleanGives,
    evidenceRefs: primaryEvidenceRefs.slice(0, 2),
  };
  const hiddenCostFocus = {
    concept: cleanCost,
    evidenceRefs: primaryEvidenceRefs.slice(0, 2),
  };

  // 6. Define Required and Optional Evidence Roles
  const requiredPrimaryRefs = primaryEvidenceRefs;
  const requiredContrastRefs = secondaryContrast ? secondaryContrast.evidenceRefs : [];
  const optionalMechanismRefs = currentMechanism ? currentMechanism.evidenceRefs : [];
  const optionalSupportingRefs = supportingInnateStructure ? supportingInnateStructure.evidenceRefs : [];

  const requiredEvidence = {
    primaryRefs: requiredPrimaryRefs,
    contrastRefs: requiredContrastRefs,
  };

  const optionalEvidence = {
    mechanismRefs: optionalMechanismRefs,
    supportingRefs: optionalSupportingRefs,
  };

  // Union of all selected evidence keys
  const selectedRefsSet = new Set<string>([
    ...requiredPrimaryRefs,
    ...requiredContrastRefs,
    ...optionalMechanismRefs,
    ...optionalSupportingRefs,
  ]);
  const selectedEvidenceRefs = [...selectedRefsSet].filter((k) =>
    promptEvidence.adaptationStoryKnownKeys.has(k),
  );

  // Derive Evidence Families
  const familySet = new Set<EvidenceFamily>();
  for (const ref of selectedEvidenceRefs) {
    const fam = promptEvidence.adaptationStoryKeyFamilies.get(ref);
    if (fam) familySet.add(fam);
  }
  const evidenceFamilies = [...familySet];

  // 7. Synthesis Frame Question & Tension (Fully sanitized human text)
  const contrastDesc = secondaryContrast ? secondaryContrast.description : "관계 및 환경 속에서의 역할 수행";
  
  const synthesisFrame = {
    targetTension: `본래 ${humanAxisConcept} 성향과 현재 삶에서의 적응 방식이 ${contrastDesc}와 함께 공존하면서 발생하는 역동`,
    question: `본래 ${humanAxisConcept} 성향이 현실에서 변모하게 된 까닭은 무엇이며, 이 변화가 ${contrastDesc}와 결합하여 얻게 된 강점(${gainedCapabilityFocus.concept})과 에너지 비용(${hiddenCostFocus.concept})의 공존 논리를 설명하라.`,
  };

  return {
    primaryAdaptation,
    secondaryContrast,
    requiredEvidence,
    optionalEvidence,
    currentMechanism,
    supportingInnateStructure,
    gainedCapabilityFocus,
    hiddenCostFocus,
    synthesisFrame,
    selectedEvidenceRefs,
    evidenceFamilies,
  };
}
