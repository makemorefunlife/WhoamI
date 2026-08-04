import type { PairSajuFacts } from "../pairSaju";
import type { PersonalRelationalProfile } from "../personalContextEngine/types";
import type {
  CanonicalPairCapability,
  CanonicalPairCapabilityId,
  PairContextPacket,
  PairDirectionality,
  PairPartyId,
} from "./types";

/**
 * Computes confidence for a Pair CE capability based on corroborating evidence density and source independence.
 * Rule: High confidence requires at least 2 independent corroborating sources. Medium requires at least 1 affirmative source.
 * Birth time presence alone does not grant High confidence.
 */
function computePairCapConfidence(
  evidenceCount: number,
  independentSourcesCount: number,
  isAbstaining: boolean,
): "high" | "medium" | "low" | "insufficient" {
  if (isAbstaining || evidenceCount === 0) return "insufficient";
  if (independentSourcesCount >= 2 && evidenceCount >= 2) return "high";
  if (evidenceCount >= 1) return "medium";
  return "low";
}

/**
 * Helper to construct an explicit neutral abstained capability slot.
 * Ensures no behavioral fallback meaning is inferred from the absence of negative evidence.
 */
function buildAbstainedCapability<TId extends CanonicalPairCapabilityId>(
  capability_id: TId,
  abstain_reason: string,
  summary_ko: string,
  diagnostic_reason?: string,
  directionality: PairDirectionality = { polarity: "symmetric" },
  prohibited_claims: string[] = ["근거 없는 관계성 및 행동 패턴 단정 금지"],
): CanonicalPairCapability<TId> {
  return {
    capability_id,
    status: "abstained",
    canonical_meaning_id: null,
    variant: null,
    summary_ko,
    directionality,
    confidence: "insufficient",
    tension_level: "low",
    is_abstaining: true,
    abstain_reason,
    diagnostic_reason,
    is_mixed: false,
    evidence_sources: [],
    corroboration: {
      is_corroborated: false,
      corroborating_evidence_count: 0,
      independent_sources: [],
    },
    prohibited_claims,
  };
}

/**
 * Builds the canonical relational Pair CE capabilities from raw facts, packets, and personal relational profiles.
 *
 * Enforces:
 * - Evidence independence (never assumes raw combine/clash = behavioral conclusion)
 * - Directionality (A→B, B→A, symmetric, mutual)
 * - Genuine mixed states & contradiction resolution
 * - Explicit abstention when supportable evidence is missing (no evidence-free fallbacks)
 * - Prohibited stronger claims
 */
export function buildCanonicalPairCapabilities(
  facts: PairSajuFacts,
  packets: PairContextPacket[],
  profileA?: PersonalRelationalProfile,
  profileB?: PersonalRelationalProfile,
): Record<CanonicalPairCapabilityId, CanonicalPairCapability> {
  const crossHits = facts.cross_hits ?? [];
  const stemCombines = crossHits.filter((h) => h.category === "stem_combine" || h.type === "stem_combine");
  const branchCombines = crossHits.filter((h) => h.type === "branch_six_combine" || (facts.trio_hits && facts.trio_hits.length > 0));
  const clashes = crossHits.filter((h) => h.category === "stem_clash" || h.type === "stem_clash" || h.type === "branch_clash" || h.type === "branch_punishment");
  const wonjinHits = crossHits.filter((h) => h.category === "wonjin_guimun" || h.type === "wonjin_guimun");
  const flow = facts.element_flow;

  // 1. directional_support_exchange
  const supportAtoB = flow?.direction === "a_to_b" || flow?.interaction_code === "generates_a_to_b" || profileA?.support_giving_style === "nurturing_empath";
  const supportBtoA = flow?.direction === "b_to_a" || flow?.interaction_code === "generates_b_to_a" || profileB?.support_giving_style === "nurturing_empath";
  let cap1: CanonicalPairCapability<"directional_support_exchange">;
  if (supportAtoB && supportBtoA) {
    const isMixed = clashes.length > 0;
    const meaningId = isMixed ? "mixed_support_tension" : "reciprocal_balanced_support";
    const sources = [
      { source_kind: "raw_fact" as const, ref_id: "element_flow", detail: `오행 흐름: ${flow?.direction ?? "none"}` },
      { source_kind: "personal_ce_dimension" as const, ref_id: "support_giving_style", detail: `A: ${profileA?.support_giving_style}, B: ${profileB?.support_giving_style}` },
    ];
    const indep = ["element_flow", "support_giving_style"];
    cap1 = {
      capability_id: "directional_support_exchange",
      status: isMixed ? "mixed" : "supported",
      canonical_meaning_id: meaningId,
      variant: meaningId,
      summary_ko: isMixed ? "상호 지지와 마찰이 공존하는 복합적 지원" : "상호 보완적인 양방향 에너지 지원 교환",
      directionality: { polarity: "symmetric" },
      confidence: computePairCapConfidence(sources.length, indep.length, false),
      tension_level: isMixed ? "moderate" : "low",
      is_abstaining: false,
      is_mixed: isMixed,
      evidence_sources: sources,
      corroboration: { is_corroborated: true, corroborating_evidence_count: sources.length, independent_sources: indep },
      prohibited_claims: ["무조건적 일방 희생", "영구적 결속 보장"],
    };
  } else if (supportAtoB) {
    const sources = [
      { source_kind: "raw_fact" as const, ref_id: "element_flow", detail: "A->B 생조 흐름" },
      { source_kind: "personal_ce_dimension" as const, ref_id: "support_giving_style", detail: `A: ${profileA?.support_giving_style}` },
    ];
    const indep = ["element_flow", "support_giving_style"];
    cap1 = {
      capability_id: "directional_support_exchange",
      status: "supported",
      canonical_meaning_id: "a_supports_b_nurturing",
      variant: "a_supports_b_nurturing",
      summary_ko: "A가 B의 에너지와 심리적 안정을 주도적으로 지탱하는 지원 교환",
      directionality: { polarity: "a_to_b", from: "A", to: "B" },
      lead_party: "A",
      confidence: computePairCapConfidence(sources.length, indep.length, false),
      tension_level: "low",
      is_abstaining: false,
      is_mixed: false,
      evidence_sources: sources,
      corroboration: { is_corroborated: true, corroborating_evidence_count: sources.length, independent_sources: indep },
      prohibited_claims: ["B의 의존성 단정", "A의 일방적 탈진 단정"],
    };
  } else if (supportBtoA) {
    const sources = [
      { source_kind: "raw_fact" as const, ref_id: "element_flow", detail: "B->A 생조 흐름" },
      { source_kind: "personal_ce_dimension" as const, ref_id: "support_giving_style", detail: `B: ${profileB?.support_giving_style}` },
    ];
    const indep = ["element_flow", "support_giving_style"];
    cap1 = {
      capability_id: "directional_support_exchange",
      status: "supported",
      canonical_meaning_id: "b_supports_a_nurturing",
      variant: "b_supports_a_nurturing",
      summary_ko: "B가 A의 에너지와 심리적 안정을 주도적으로 지탱하는 지원 교환",
      directionality: { polarity: "b_to_a", from: "B", to: "A" },
      lead_party: "B",
      confidence: computePairCapConfidence(sources.length, indep.length, false),
      tension_level: "low",
      is_abstaining: false,
      is_mixed: false,
      evidence_sources: sources,
      corroboration: { is_corroborated: true, corroborating_evidence_count: sources.length, independent_sources: indep },
      prohibited_claims: ["A의 의존성 단정", "B의 일방적 탈진 단정"],
    };
  } else {
    cap1 = buildAbstainedCapability(
      "directional_support_exchange",
      "생조 흐름 및 지지 양식 신호 부재",
      "상호 지원 교환을 특정할 십성/오행 생조 근거 부족",
      "neither element flow nor personal support style provides affirmative support signal",
    );
  }

  // 2. initiative_and_response
  const aPace = profileA?.decision_pace;
  const bPace = profileB?.decision_pace;
  let cap2: CanonicalPairCapability<"initiative_and_response">;
  if (aPace === "swift_initiative" && bPace === "deliberate_evaluator") {
    const sources = [
      { source_kind: "personal_ce_dimension" as const, ref_id: "decision_pace_a", detail: "A 신속 결단" },
      { source_kind: "personal_ce_dimension" as const, ref_id: "decision_pace_b", detail: "B 심사숙고" },
    ];
    cap2 = {
      capability_id: "initiative_and_response",
      status: "supported",
      canonical_meaning_id: "a_leads_b_anchors",
      variant: "a_leads_b_anchors",
      summary_ko: "A가 실행과 주도를 열고 B가 정밀한 평가로 균형을 잡는 주도-응답 구조",
      directionality: { polarity: "a_to_b", from: "A", to: "B" },
      lead_party: "A",
      confidence: computePairCapConfidence(sources.length, 2, false),
      tension_level: "low",
      is_abstaining: false,
      is_mixed: false,
      evidence_sources: sources,
      corroboration: { is_corroborated: true, corroborating_evidence_count: 2, independent_sources: ["pace_a", "pace_b"] },
      prohibited_claims: ["B의 수동성 비하", "A의 독단 단정"],
    };
  } else if (bPace === "swift_initiative" && aPace === "deliberate_evaluator") {
    const sources = [
      { source_kind: "personal_ce_dimension" as const, ref_id: "decision_pace_b", detail: "B 신속 결단" },
      { source_kind: "personal_ce_dimension" as const, ref_id: "decision_pace_a", detail: "A 심사숙고" },
    ];
    cap2 = {
      capability_id: "initiative_and_response",
      status: "supported",
      canonical_meaning_id: "b_leads_a_anchors",
      variant: "b_leads_a_anchors",
      summary_ko: "B가 실행과 주도를 열고 A가 정밀한 평가로 균형을 잡는 주도-응답 구조",
      directionality: { polarity: "b_to_a", from: "B", to: "A" },
      lead_party: "B",
      confidence: computePairCapConfidence(sources.length, 2, false),
      tension_level: "low",
      is_abstaining: false,
      is_mixed: false,
      evidence_sources: sources,
      corroboration: { is_corroborated: true, corroborating_evidence_count: 2, independent_sources: ["pace_b", "pace_a"] },
      prohibited_claims: ["A의 수동성 비하", "B의 독단 단정"],
    };
  } else if (aPace === "swift_initiative" && bPace === "swift_initiative") {
    const isMixed = clashes.length > 0;
    const meaningId = isMixed ? "mixed_pacing_friction" : "synchronized_dual_initiators";
    const sources: CanonicalPairCapability["evidence_sources"] = [{ source_kind: "personal_ce_dimension" as const, ref_id: "dual_swift", detail: "양측 신속 결단 템포" }];
    if (isMixed) {
      sources.push({ source_kind: "raw_fact" as const, ref_id: "cross_clashes", detail: "지지/천간 충" });
    }
    cap2 = {
      capability_id: "initiative_and_response",
      status: isMixed ? "mixed" : "supported",
      canonical_meaning_id: meaningId,
      variant: meaningId,
      summary_ko: isMixed ? "양측의 강한 주도 욕구로 인한 템포 경합 및 마찰" : "양측의 빠른 템포가 결합된 공동 추진 주도 구조",
      directionality: { polarity: "symmetric" },
      confidence: computePairCapConfidence(sources.length, sources.length, false),
      tension_level: isMixed ? "high" : "low",
      is_abstaining: false,
      is_mixed: isMixed,
      evidence_sources: sources,
      corroboration: { is_corroborated: sources.length >= 2, corroborating_evidence_count: sources.length, independent_sources: sources.map((s) => s.ref_id) },
      prohibited_claims: ["파국적 충돌 단정"],
    };
  } else if (aPace === "deliberate_evaluator" && bPace === "deliberate_evaluator") {
    const sources = [{ source_kind: "personal_ce_dimension" as const, ref_id: "dual_deliberate", detail: "양측 심사숙고 템포" }];
    cap2 = {
      capability_id: "initiative_and_response",
      status: "supported",
      canonical_meaning_id: "hesitant_dual_evaluators",
      variant: "hesitant_dual_evaluators",
      summary_ko: "양측 모두 신중한 평가형으로 실행 개시 시점의 상호 관망 경향",
      directionality: { polarity: "symmetric" },
      confidence: computePairCapConfidence(sources.length, 1, false),
      tension_level: "low",
      is_abstaining: false,
      is_mixed: false,
      evidence_sources: sources,
      corroboration: { is_corroborated: false, corroborating_evidence_count: 1, independent_sources: ["pace_dual"] },
      prohibited_claims: ["실행 불능 단정"],
    };
  } else if (aPace === "swift_initiative" && bPace === "steady_anchor") {
    const sources = [
      { source_kind: "personal_ce_dimension" as const, ref_id: "decision_pace_a", detail: "A 신속 결단" },
      { source_kind: "personal_ce_dimension" as const, ref_id: "decision_pace_b", detail: "B 안정적 중심" },
    ];
    cap2 = {
      capability_id: "initiative_and_response",
      status: "supported",
      canonical_meaning_id: "a_leads_b_anchors",
      variant: "a_leads_b_anchors",
      summary_ko: "A가 실행과 주도를 열고 B가 안정적으로 받쳐주는 주도-응답 구조",
      directionality: { polarity: "a_to_b", from: "A", to: "B" },
      lead_party: "A",
      confidence: computePairCapConfidence(sources.length, 2, false),
      tension_level: "low",
      is_abstaining: false,
      is_mixed: false,
      evidence_sources: sources,
      corroboration: { is_corroborated: true, corroborating_evidence_count: sources.length, independent_sources: ["pace_a", "pace_b"] },
      prohibited_claims: ["B의 수동성 비하"],
    };
  } else if (bPace === "swift_initiative" && aPace === "steady_anchor") {
    const sources = [
      { source_kind: "personal_ce_dimension" as const, ref_id: "decision_pace_b", detail: "B 신속 결단" },
      { source_kind: "personal_ce_dimension" as const, ref_id: "decision_pace_a", detail: "A 안정적 중심" },
    ];
    cap2 = {
      capability_id: "initiative_and_response",
      status: "supported",
      canonical_meaning_id: "b_leads_a_anchors",
      variant: "b_leads_a_anchors",
      summary_ko: "B가 실행과 주도를 열고 A가 정밀한 평가로 균형을 잡는 주도-응답 구조",
      directionality: { polarity: "b_to_a", from: "B", to: "A" },
      lead_party: "B",
      confidence: computePairCapConfidence(sources.length, 2, false),
      tension_level: "low",
      is_abstaining: false,
      is_mixed: false,
      evidence_sources: sources,
      corroboration: { is_corroborated: true, corroborating_evidence_count: 2, independent_sources: ["pace_b", "pace_a"] },
      prohibited_claims: ["A의 수동성 비하"],
    };
  } else {
    cap2 = buildAbstainedCapability(
      "initiative_and_response",
      "주도 및 응답 템포를 특정할 결단 기질 신호 부재",
      "주도와 응답 호흡을 특정할 결단 템포 근거 부족",
      "decision pace neutral or uninformative on both parties",
    );
  }

  // 3. mutual_recognition
  const recA = profileA?.recognition_need;
  const recB = profileB?.recognition_need;
  let cap3: CanonicalPairCapability<"mutual_recognition">;
  if (recA === "empathy_seeking" && recB === "empathy_seeking" && (stemCombines.length > 0 || branchCombines.length > 0)) {
    const sources = [
      { source_kind: "personal_ce_dimension" as const, ref_id: "rec_need_dual", detail: "양측 공감 인정 욕구" },
      { source_kind: "raw_fact" as const, ref_id: "combines", detail: "천간/지지 합 형성" },
    ];
    cap3 = {
      capability_id: "mutual_recognition",
      status: "supported",
      canonical_meaning_id: "deep_mutual_validation",
      variant: "deep_mutual_validation",
      summary_ko: "정서적 공감 욕구와 합(Combine) 구조가 맞물린 깊은 상호 인정",
      directionality: { polarity: "symmetric" },
      confidence: computePairCapConfidence(sources.length, 2, false),
      tension_level: "low",
      is_abstaining: false,
      is_mixed: false,
      evidence_sources: sources,
      corroboration: { is_corroborated: true, corroborating_evidence_count: 2, independent_sources: ["recognition_need", "cross_combines"] },
      prohibited_claims: ["절대적 무결성"],
    };
  } else if (wonjinHits.length > 0 || (profileA?.criticism_sensitivity === "high_defensive_cushion_needed" && profileB?.criticism_sensitivity === "high_defensive_cushion_needed")) {
    const isMixed = stemCombines.length > 0;
    const meaningId = isMixed ? "mixed_recognition_clash" : "high_defensive_friction";
    const sources = [
      { source_kind: "raw_fact" as const, ref_id: "wonjin_hits", detail: "원진/귀문 상호작용" },
      { source_kind: "personal_ce_dimension" as const, ref_id: "criticism_sensitivity", detail: "비판 민감성 방어 신호" },
    ];
    cap3 = {
      capability_id: "mutual_recognition",
      status: isMixed ? "mixed" : "supported",
      canonical_meaning_id: meaningId,
      variant: meaningId,
      summary_ko: isMixed ? "강한 유대감 속에서 평가 민감성이 교차하는 복합적 인정" : "상호 방어적 긴장으로 인해 인정보다 평가 왜곡이 발생하기 쉬운 상태",
      directionality: { polarity: "symmetric" },
      confidence: computePairCapConfidence(sources.length, 2, false),
      tension_level: "high",
      is_abstaining: false,
      is_mixed: isMixed,
      evidence_sources: sources,
      corroboration: { is_corroborated: true, corroborating_evidence_count: 2, independent_sources: ["wonjin", "criticism_sensitivity"] },
      prohibited_claims: ["인격적 악의 단정"],
    };
  } else if (recA === "empathy_seeking" && recB === "standards_driven") {
    const sources = [
      { source_kind: "personal_ce_dimension" as const, ref_id: "rec_a", detail: "A 공감 추구" },
      { source_kind: "personal_ce_dimension" as const, ref_id: "rec_b", detail: "B 원칙 기준" },
    ];
    cap3 = {
      capability_id: "mutual_recognition",
      status: "supported",
      canonical_meaning_id: "asymmetric_recognition_hunger_a",
      variant: "asymmetric_recognition_hunger_a",
      summary_ko: "A는 정서적 위로를 원하나 B는 원칙적 성과로 응답하여 생기는 비대칭 인정",
      directionality: { polarity: "a_to_b", from: "A", to: "B" },
      lead_party: "A",
      confidence: computePairCapConfidence(sources.length, 2, false),
      tension_level: "moderate",
      is_abstaining: false,
      is_mixed: false,
      evidence_sources: sources,
      corroboration: { is_corroborated: true, corroborating_evidence_count: 2, independent_sources: ["rec_a", "rec_b"] },
      prohibited_claims: ["상호 불통 단정"],
    };
  } else if (recB === "empathy_seeking" && recA === "standards_driven") {
    const sources = [
      { source_kind: "personal_ce_dimension" as const, ref_id: "rec_b", detail: "B 공감 추구" },
      { source_kind: "personal_ce_dimension" as const, ref_id: "rec_a", detail: "A 원칙 기준" },
    ];
    cap3 = {
      capability_id: "mutual_recognition",
      status: "supported",
      canonical_meaning_id: "asymmetric_recognition_hunger_b",
      variant: "asymmetric_recognition_hunger_b",
      summary_ko: "B는 정서적 위로를 원하나 A는 원칙적 성과로 응답하여 생기는 비대칭 인정",
      directionality: { polarity: "b_to_a", from: "B", to: "A" },
      lead_party: "B",
      confidence: computePairCapConfidence(sources.length, 2, false),
      tension_level: "moderate",
      is_abstaining: false,
      is_mixed: false,
      evidence_sources: sources,
      corroboration: { is_corroborated: true, corroborating_evidence_count: 2, independent_sources: ["rec_b", "rec_a"] },
      prohibited_claims: ["상호 불통 단정"],
    };
  } else {
    cap3 = buildAbstainedCapability(
      "mutual_recognition",
      "상호 인정 욕구를 특정할 인성/관성/원진 신호 부재",
      "상호 인정 방식을 특정할 인정 욕구 및 신살 근거 부족",
      "recognition need and sensitivity signals absent",
    );
  }

  // 4. expression_emotional_pace_mismatch
  const expA = profileA?.expression_style;
  const expB = profileB?.expression_style;
  let cap4: CanonicalPairCapability<"expression_emotional_pace_mismatch">;
  if ((expA === "expressive_creator" && expB === "reserved_observer") || (expB === "expressive_creator" && expA === "reserved_observer")) {
    const sources = [
      { source_kind: "personal_ce_dimension" as const, ref_id: "exp_a", detail: `A: ${expA}` },
      { source_kind: "personal_ce_dimension" as const, ref_id: "exp_b", detail: `B: ${expB}` },
    ];
    cap4 = {
      capability_id: "expression_emotional_pace_mismatch",
      status: "supported",
      canonical_meaning_id: "expressive_vs_reserved_gap",
      variant: "expressive_vs_reserved_gap",
      summary_ko: "발산형 표현과 내향적 관찰형 태도 사이의 감정 표현 속도차",
      directionality: expA === "expressive_creator" ? { polarity: "a_to_b", from: "A", to: "B" } : { polarity: "b_to_a", from: "B", to: "A" },
      lead_party: expA === "expressive_creator" ? "A" : "B",
      confidence: computePairCapConfidence(sources.length, 2, false),
      tension_level: "moderate",
      is_abstaining: false,
      is_mixed: false,
      evidence_sources: sources,
      corroboration: { is_corroborated: true, corroborating_evidence_count: 2, independent_sources: ["exp_a", "exp_b"] },
      prohibited_claims: ["표현 불능 또는 무감정 단정"],
    };
  } else if (aPace && bPace && aPace !== "neutral_unspecified" && bPace !== "neutral_unspecified" && aPace !== bPace && clashes.length > 0) {
    const sources = [
      { source_kind: "personal_ce_dimension" as const, ref_id: "pace_diff", detail: `A: ${aPace}, B: ${bPace}` },
      { source_kind: "raw_fact" as const, ref_id: "cross_clashes", detail: "지지/천간 충 발생" },
    ];
    cap4 = {
      capability_id: "expression_emotional_pace_mismatch",
      status: "supported",
      canonical_meaning_id: "pace_misalignment_cooling",
      variant: "pace_misalignment_cooling",
      summary_ko: "템포 불일치와 충(Clash) 상호작용으로 인한 감정적 쿨다운 간극",
      directionality: { polarity: "symmetric" },
      confidence: computePairCapConfidence(sources.length, 2, false),
      tension_level: "moderate",
      is_abstaining: false,
      is_mixed: false,
      evidence_sources: sources,
      corroboration: { is_corroborated: true, corroborating_evidence_count: 2, independent_sources: ["pace_diff", "clashes"] },
      prohibited_claims: [],
    };
  } else if (expA === "expressive_creator" && expB === "expressive_creator") {
    const isMixed = clashes.length > 0;
    const meaningId = isMixed ? "mixed_emotional_rhythm" : "fluid_emotional_resonance";
    const sources: CanonicalPairCapability["evidence_sources"] = [{ source_kind: "personal_ce_dimension" as const, ref_id: "dual_expressive", detail: "양측 발산형 표현" }];
    if (isMixed) {
      sources.push({ source_kind: "raw_fact" as const, ref_id: "cross_clashes", detail: "지지/천간 충" });
    }
    cap4 = {
      capability_id: "expression_emotional_pace_mismatch",
      status: isMixed ? "mixed" : "supported",
      canonical_meaning_id: meaningId,
      variant: meaningId,
      summary_ko: isMixed ? "풍부한 표현력 속에서 간헐적 감정 충돌이 교차하는 복합 리듬" : "풍부하고 즉각적인 정서 교류와 상호 감정 공명",
      directionality: { polarity: "symmetric" },
      confidence: computePairCapConfidence(sources.length, sources.length, false),
      tension_level: isMixed ? "moderate" : "low",
      is_abstaining: false,
      is_mixed: isMixed,
      evidence_sources: sources,
      corroboration: { is_corroborated: sources.length >= 2, corroborating_evidence_count: sources.length, independent_sources: sources.map((s) => s.ref_id) },
      prohibited_claims: [],
    };
  } else {
    cap4 = buildAbstainedCapability(
      "expression_emotional_pace_mismatch",
      "감정 표현 속도차를 특정할 식상/재관 표현 성향 부재",
      "감정 표현 속도와 리듬 간격을 특정할 근거 부족",
      "expression style neutral or uninformative on both parties",
    );
  }

  // 5. closeness_space_mismatch
  const solA = profileA?.solitude_autonomy;
  const solB = profileB?.solitude_autonomy;
  let cap5: CanonicalPairCapability<"closeness_space_mismatch">;
  if ((solA === "high_solitude_needed" && solB === "high_closeness_seeking") || (solB === "high_solitude_needed" && solA === "high_closeness_seeking")) {
    const sources = [
      { source_kind: "personal_ce_dimension" as const, ref_id: "sol_a", detail: `A: ${solA}` },
      { source_kind: "personal_ce_dimension" as const, ref_id: "sol_b", detail: `B: ${solB}` },
    ];
    cap5 = {
      capability_id: "closeness_space_mismatch",
      status: "supported",
      canonical_meaning_id: "proximity_vs_solitude_gap",
      variant: "proximity_vs_solitude_gap",
      summary_ko: "한쪽의 밀착 결속 추구와 다른 쪽의 독립적 안식처 확보 욕구 간 거리 차이",
      directionality: solA === "high_closeness_seeking" ? { polarity: "a_to_b", from: "A", to: "B" } : { polarity: "b_to_a", from: "B", to: "A" },
      lead_party: solA === "high_closeness_seeking" ? "A" : "B",
      confidence: computePairCapConfidence(sources.length, 2, false),
      tension_level: "high",
      is_abstaining: false,
      is_mixed: false,
      evidence_sources: sources,
      corroboration: { is_corroborated: true, corroborating_evidence_count: 2, independent_sources: ["sol_a", "sol_b"] },
      prohibited_claims: ["애정 결핍 단정", "회피형 진단"],
    };
  } else if (wonjinHits.length > 0 && branchCombines.length > 0) {
    const sources = [
      { source_kind: "raw_fact" as const, ref_id: "branch_combines", detail: "지지 합 형성" },
      { source_kind: "raw_fact" as const, ref_id: "wonjin_hits", detail: "원진/귀문 긴장" },
    ];
    cap5 = {
      capability_id: "closeness_space_mismatch",
      status: "mixed",
      canonical_meaning_id: "mixed_space_dynamic",
      variant: "mixed_space_dynamic",
      summary_ko: "합으로 인한 강한 끌림과 원진으로 인한 거리 조율 필요성이 공존하는 복합 역동",
      directionality: { polarity: "symmetric" },
      confidence: computePairCapConfidence(sources.length, 2, false),
      tension_level: "moderate",
      is_abstaining: false,
      is_mixed: true,
      evidence_sources: sources,
      corroboration: { is_corroborated: true, corroborating_evidence_count: 2, independent_sources: ["combines", "wonjin"] },
      prohibited_claims: [],
    };
  } else if (solA === "high_solitude_needed" && solB === "high_solitude_needed") {
    const sources = [{ source_kind: "personal_ce_dimension" as const, ref_id: "dual_solitude", detail: "양측 높은 고독/자율성 요구" }];
    cap5 = {
      capability_id: "closeness_space_mismatch",
      status: "supported",
      canonical_meaning_id: "sanctuary_boundary_tension",
      variant: "sanctuary_boundary_tension",
      summary_ko: "양측 모두 독립적 성소를 존중하며 적절한 상호 안전거리를 유지하는 구조",
      directionality: { polarity: "symmetric" },
      confidence: computePairCapConfidence(sources.length, 1, false),
      tension_level: "low",
      is_abstaining: false,
      is_mixed: false,
      evidence_sources: sources,
      corroboration: { is_corroborated: true, corroborating_evidence_count: 2, independent_sources: ["sol_a", "sol_b"] },
      prohibited_claims: [],
    };
  } else {
    cap5 = buildAbstainedCapability(
      "closeness_space_mismatch",
      "친밀도-거리감 조율을 특정할 비겁/인성/원진 신호 부재",
      "친밀도와 공간 요구 간격을 특정할 근거 부족",
      "solitude autonomy profile neutral or uninformative on both parties",
    );
  }

  // 6. decision_coordination
  const strA = profileA?.structure_spontaneity;
  const strB = profileB?.structure_spontaneity;
  let cap6: CanonicalPairCapability<"decision_coordination">;
  if ((strA === "disciplined_framework_driven" && strB === "spontaneous_creative_flow") || (strB === "disciplined_framework_driven" && strA === "spontaneous_creative_flow")) {
    const sources = [
      { source_kind: "personal_ce_dimension" as const, ref_id: "str_a", detail: `A: ${strA}` },
      { source_kind: "personal_ce_dimension" as const, ref_id: "str_b", detail: `B: ${strB}` },
    ];
    cap6 = {
      capability_id: "decision_coordination",
      status: "supported",
      canonical_meaning_id: "swift_operator_deliberate_evaluator_split",
      variant: "swift_operator_deliberate_evaluator_split",
      summary_ko: "한쪽의 체계적 계획성과 다른 쪽의 유연한 즉흥성이 결합된 역할 분담형 의사결정",
      directionality: strA === "disciplined_framework_driven" ? { polarity: "a_to_b", from: "A", to: "B" } : { polarity: "b_to_a", from: "B", to: "A" },
      lead_party: strA === "disciplined_framework_driven" ? "A" : "B",
      confidence: computePairCapConfidence(sources.length, 2, false),
      tension_level: "moderate",
      is_abstaining: false,
      is_mixed: false,
      evidence_sources: sources,
      corroboration: { is_corroborated: true, corroborating_evidence_count: 2, independent_sources: ["str_a", "str_b"] },
      prohibited_claims: ["통제 성향 낙인"],
    };
  } else if (clashes.length > 1 && (aPace === "swift_initiative" && bPace === "swift_initiative")) {
    const sources = [
      { source_kind: "raw_fact" as const, ref_id: "clashes", detail: "복수 충 상호작용" },
      { source_kind: "personal_ce_dimension" as const, ref_id: "pace", detail: "양측 신속 결단 충돌" },
    ];
    cap6 = {
      capability_id: "decision_coordination",
      status: "supported",
      canonical_meaning_id: "polarized_decision_gridlock",
      variant: "polarized_decision_gridlock",
      summary_ko: "강한 자기 기준과 충 상호작용으로 인한 의사결정 대립 및 교착 위험",
      directionality: { polarity: "symmetric" },
      confidence: computePairCapConfidence(sources.length, 2, false),
      tension_level: "high",
      is_abstaining: false,
      is_mixed: false,
      evidence_sources: sources,
      corroboration: { is_corroborated: true, corroborating_evidence_count: 2, independent_sources: ["clashes", "decision_pace"] },
      prohibited_claims: ["합의 불가능 단정"],
    };
  } else if (strA === "disciplined_framework_driven" && strB === "disciplined_framework_driven") {
    const sources = [{ source_kind: "personal_ce_dimension" as const, ref_id: "dual_structure", detail: "양측 체계적 계획성" }];
    cap6 = {
      capability_id: "decision_coordination",
      status: "supported",
      canonical_meaning_id: "synchronized_pragmatic_alignment",
      variant: "synchronized_pragmatic_alignment",
      summary_ko: "양측 모두 원칙과 체계를 중시하여 명확한 규칙 기반으로 합의 도출",
      directionality: { polarity: "symmetric" },
      confidence: computePairCapConfidence(sources.length, 1, false),
      tension_level: "low",
      is_abstaining: false,
      is_mixed: false,
      evidence_sources: sources,
      corroboration: { is_corroborated: true, corroborating_evidence_count: 2, independent_sources: ["str_a", "str_b"] },
      prohibited_claims: [],
    };
  } else {
    cap6 = buildAbstainedCapability(
      "decision_coordination",
      "의사결정 조율을 특정할 정관/정재/식상 구조 신호 부재",
      "의사결정 협의 방식을 특정할 체계/즉흥성 근거 부족",
      "structure spontaneity profile neutral or uninformative on both parties",
    );
  }

  // 7. role_formation
  const bndA = profileA?.boundary_defense_strength;
  const bndB = profileB?.boundary_defense_strength;
  let cap7: CanonicalPairCapability<"role_formation">;
  if (bndA === "uncompromising_sovereignty" && bndB === "tactful_diplomatic") {
    const sources = [
      { source_kind: "personal_ce_dimension" as const, ref_id: "bnd_a", detail: `A 주체 주도: ${bndA}` },
      { source_kind: "personal_ce_dimension" as const, ref_id: "bnd_b", detail: `B 외교 조율: ${bndB}` },
    ];
    cap7 = {
      capability_id: "role_formation",
      status: "supported",
      canonical_meaning_id: "specialized_complementary_roles",
      variant: "specialized_complementary_roles",
      summary_ko: "A가 대외적 방어와 원칙을 세우고 B가 유연한 조율을 맡는 상호보완적 역할 분담",
      directionality: { polarity: "a_to_b", from: "A", to: "B" },
      lead_party: "A",
      confidence: computePairCapConfidence(sources.length, 2, false),
      tension_level: "low",
      is_abstaining: false,
      is_mixed: false,
      evidence_sources: sources,
      corroboration: { is_corroborated: true, corroborating_evidence_count: 2, independent_sources: ["bnd_a", "bnd_b"] },
      prohibited_claims: ["위계적 종속 단정"],
    };
  } else if (bndB === "uncompromising_sovereignty" && bndA === "tactful_diplomatic") {
    const sources = [
      { source_kind: "personal_ce_dimension" as const, ref_id: "bnd_b", detail: `B 주체 주도: ${bndB}` },
      { source_kind: "personal_ce_dimension" as const, ref_id: "bnd_a", detail: `A 외교 조율: ${bndA}` },
    ];
    cap7 = {
      capability_id: "role_formation",
      status: "supported",
      canonical_meaning_id: "specialized_complementary_roles",
      variant: "specialized_complementary_roles",
      summary_ko: "B가 대외적 방어와 원칙을 세우고 A가 유연한 조율을 맡는 상호보완적 역할 분담",
      directionality: { polarity: "b_to_a", from: "B", to: "A" },
      lead_party: "B",
      confidence: computePairCapConfidence(sources.length, 2, false),
      tension_level: "low",
      is_abstaining: false,
      is_mixed: false,
      evidence_sources: sources,
      corroboration: { is_corroborated: true, corroborating_evidence_count: 2, independent_sources: ["bnd_b", "bnd_a"] },
      prohibited_claims: ["위계적 종속 단정"],
    };
  } else if (bndA === "uncompromising_sovereignty" && bndB === "uncompromising_sovereignty" && clashes.length > 0) {
    const sources = [
      { source_kind: "personal_ce_dimension" as const, ref_id: "dual_sovereignty", detail: "양측 확고한 주체성" },
      { source_kind: "raw_fact" as const, ref_id: "clashes", detail: "지지 충 상호작용" },
    ];
    cap7 = {
      capability_id: "role_formation",
      status: "supported",
      canonical_meaning_id: "territorial_role_clash",
      variant: "territorial_role_clash",
      summary_ko: "양측의 확고한 주체성과 충 상호작용으로 인한 영역 침범 민감성 및 마찰",
      directionality: { polarity: "symmetric" },
      confidence: computePairCapConfidence(sources.length, 2, false),
      tension_level: "high",
      is_abstaining: false,
      is_mixed: false,
      evidence_sources: sources,
      corroboration: { is_corroborated: true, corroborating_evidence_count: 2, independent_sources: ["boundaries", "clashes"] },
      prohibited_claims: ["협업 불가 단정"],
    };
  } else {
    cap7 = buildAbstainedCapability(
      "role_formation",
      "역할 형성을 특정할 비겁/신강/괴강/관인 신호 부재",
      "역할 분담 및 주도권을 특정할 경계 방어 근거 부족",
      "boundary defense profile neutral or uninformative on both parties",
    );
  }

  // 8. resource_responsibility_exchange
  const resA = profileA?.resource_governance;
  const resB = profileB?.resource_governance;
  let cap8: CanonicalPairCapability<"resource_responsibility_exchange">;
  if (resA === "diligent_steward" && resB && resB !== "diligent_steward" && resB !== "neutral_unspecified") {
    const sources = [
      { source_kind: "personal_ce_dimension" as const, ref_id: "res_a", detail: "A 정재형 자산 수호" },
      { source_kind: "personal_ce_dimension" as const, ref_id: "res_b", detail: `B 자원 운용: ${resB}` },
    ];
    cap8 = {
      capability_id: "resource_responsibility_exchange",
      status: "supported",
      canonical_meaning_id: "designated_steward_lead_a",
      variant: "designated_steward_lead_a",
      summary_ko: "A가 예산 기획과 자산 수호를 총괄하고 B가 유연하게 운용하는 자원 관리 분담",
      directionality: { polarity: "a_to_b", from: "A", to: "B" },
      lead_party: "A",
      confidence: computePairCapConfidence(sources.length, 2, false),
      tension_level: "low",
      is_abstaining: false,
      is_mixed: false,
      evidence_sources: sources,
      corroboration: { is_corroborated: true, corroborating_evidence_count: 2, independent_sources: ["res_a", "res_b"] },
      prohibited_claims: ["B의 낭비벽 단정", "재정 권력 독점 단정"],
    };
  } else if (resB === "diligent_steward" && resA && resA !== "diligent_steward" && resA !== "neutral_unspecified") {
    const sources = [
      { source_kind: "personal_ce_dimension" as const, ref_id: "res_b", detail: "B 정재형 자산 수호" },
      { source_kind: "personal_ce_dimension" as const, ref_id: "res_a", detail: `A 자원 운용: ${resA}` },
    ];
    cap8 = {
      capability_id: "resource_responsibility_exchange",
      status: "supported",
      canonical_meaning_id: "designated_steward_lead_b",
      variant: "designated_steward_lead_b",
      summary_ko: "B가 예산 기획과 자산 수호를 총괄하고 A가 유연하게 운용하는 자원 관리 분담",
      directionality: { polarity: "b_to_a", from: "B", to: "A" },
      lead_party: "B",
      confidence: computePairCapConfidence(sources.length, 2, false),
      tension_level: "low",
      is_abstaining: false,
      is_mixed: false,
      evidence_sources: sources,
      corroboration: { is_corroborated: true, corroborating_evidence_count: 2, independent_sources: ["res_b", "res_a"] },
      prohibited_claims: ["A의 낭비벽 단정", "재정 권력 독점 단정"],
    };
  } else if (resA === "opportunity_investor" && resB === "opportunity_investor") {
    const sources = [{ source_kind: "personal_ce_dimension" as const, ref_id: "dual_investor", detail: "양측 편재형 확장" }];
    cap8 = {
      capability_id: "resource_responsibility_exchange",
      status: "supported",
      canonical_meaning_id: "dual_diversified_exchange",
      variant: "dual_diversified_exchange",
      summary_ko: "양측 모두 적극적인 자원 확장과 기회 포착에 집중하는 역동적 분배",
      directionality: { polarity: "symmetric" },
      confidence: computePairCapConfidence(sources.length, 1, false),
      tension_level: "moderate",
      is_abstaining: false,
      is_mixed: false,
      evidence_sources: sources,
      corroboration: { is_corroborated: true, corroborating_evidence_count: 2, independent_sources: ["res_a", "res_b"] },
      prohibited_claims: [],
    };
  } else {
    cap8 = buildAbstainedCapability(
      "resource_responsibility_exchange",
      "자원 및 책임 교환을 특정할 재성 신호 부재",
      "자원 관리 및 분배 책임을 특정할 재성 근거 부족",
      "resource governance profile neutral or uninformative on both parties",
    );
  }

  // 9. pressure_amplification_buffering
  const prsA = profileA?.pressure_response;
  const prsB = profileB?.pressure_response;
  let cap9: CanonicalPairCapability<"pressure_amplification_buffering">;
  if (prsA === "resolute_crisis_fighter" && prsB === "resolute_crisis_fighter") {
    const sources = [{ source_kind: "personal_ce_dimension" as const, ref_id: "dual_fighter", detail: "양측 위기 돌파형 기질" }];
    cap9 = {
      capability_id: "pressure_amplification_buffering",
      status: "supported",
      canonical_meaning_id: "resilient_crisis_shield_pairing",
      variant: "resilient_crisis_shield_pairing",
      summary_ko: "위기 시 양측 모두 정면 돌파력과 회복 탄력성을 발휘하는 강력한 방패 구조",
      directionality: { polarity: "symmetric" },
      confidence: computePairCapConfidence(sources.length, 1, false),
      tension_level: "low",
      is_abstaining: false,
      is_mixed: false,
      evidence_sources: sources,
      corroboration: { is_corroborated: true, corroborating_evidence_count: 2, independent_sources: ["prs_a", "prs_b"] },
      prohibited_claims: ["무적성 단정"],
    };
  } else if (prsA === "stress_vulnerable_anchor_needed" && prsB === "stress_vulnerable_anchor_needed" && clashes.length > 0) {
    const sources = [
      { source_kind: "personal_ce_dimension" as const, ref_id: "dual_vulnerable", detail: "양측 스트레스 취약성" },
      { source_kind: "raw_fact" as const, ref_id: "clashes", detail: "충 상호작용" },
    ];
    cap9 = {
      capability_id: "pressure_amplification_buffering",
      status: "supported",
      canonical_meaning_id: "pressure_amplification_panic_risk",
      variant: "pressure_amplification_panic_risk",
      summary_ko: "압박 상황에서 양측의 스트레스 반응이 상호 증폭되어 긴장이 고조될 위험",
      directionality: { polarity: "symmetric" },
      confidence: computePairCapConfidence(sources.length, 2, false),
      tension_level: "high",
      is_abstaining: false,
      is_mixed: false,
      evidence_sources: sources,
      corroboration: { is_corroborated: true, corroborating_evidence_count: 2, independent_sources: ["prs_a", "prs_b", "clashes"] },
      prohibited_claims: ["공황 상태 단정"],
    };
  } else if (prsA === "resolute_crisis_fighter" && prsB === "stress_vulnerable_anchor_needed") {
    const sources = [
      { source_kind: "personal_ce_dimension" as const, ref_id: "prs_a", detail: "A 위기 돌파" },
      { source_kind: "personal_ce_dimension" as const, ref_id: "prs_b", detail: "B 앵커 필요" },
    ];
    cap9 = {
      capability_id: "pressure_amplification_buffering",
      status: "supported",
      canonical_meaning_id: "grounded_buffering_sanctuary",
      variant: "grounded_buffering_sanctuary",
      summary_ko: "A의 단단한 중심축이 B의 스트레스를 흡수 완충해주는 보호막 구조",
      directionality: { polarity: "a_to_b", from: "A", to: "B" },
      lead_party: "A",
      confidence: computePairCapConfidence(sources.length, 2, false),
      tension_level: "low",
      is_abstaining: false,
      is_mixed: false,
      evidence_sources: sources,
      corroboration: { is_corroborated: true, corroborating_evidence_count: 2, independent_sources: ["prs_a", "prs_b"] },
      prohibited_claims: ["A의 무제한 소모 강요"],
    };
  } else if (prsB === "resolute_crisis_fighter" && prsA === "stress_vulnerable_anchor_needed") {
    const sources = [
      { source_kind: "personal_ce_dimension" as const, ref_id: "prs_b", detail: "B 위기 돌파" },
      { source_kind: "personal_ce_dimension" as const, ref_id: "prs_a", detail: "A 앵커 필요" },
    ];
    cap9 = {
      capability_id: "pressure_amplification_buffering",
      status: "supported",
      canonical_meaning_id: "grounded_buffering_sanctuary",
      variant: "grounded_buffering_sanctuary",
      summary_ko: "B의 단단한 중심축이 A의 스트레스를 흡수 완충해주는 보호막 구조",
      directionality: { polarity: "b_to_a", from: "B", to: "A" },
      lead_party: "B",
      confidence: computePairCapConfidence(sources.length, 2, false),
      tension_level: "low",
      is_abstaining: false,
      is_mixed: false,
      evidence_sources: sources,
      corroboration: { is_corroborated: true, corroborating_evidence_count: 2, independent_sources: ["prs_b", "prs_a"] },
      prohibited_claims: ["B의 무제한 소모 강요"],
    };
  } else {
    cap9 = buildAbstainedCapability(
      "pressure_amplification_buffering",
      "압박 증폭 및 완충을 특정할 신강/편관/괴강/운성 신호 부재",
      "위기 상황 스트레스 완충 반응을 특정할 근거 부족",
      "pressure response profile neutral or uninformative on both parties",
    );
  }

  // 10. conflict_activation
  const cnfA = profileA?.conflict_decompression;
  const cnfB = profileB?.conflict_decompression;
  let cap10: CanonicalPairCapability<"conflict_activation">;
  if (clashes.length > 0 && (cnfA === "immediate_clarifier" || cnfB === "immediate_clarifier")) {
    const sources = [
      { source_kind: "raw_fact" as const, ref_id: "cross_clashes", detail: "상호 충/형 발생" },
      { source_kind: "personal_ce_dimension" as const, ref_id: "conflict_decompression", detail: `A: ${cnfA}, B: ${cnfB}` },
    ];
    cap10 = {
      capability_id: "conflict_activation",
      status: "supported",
      canonical_meaning_id: "rapid_flashpoint_combustion",
      variant: "rapid_flashpoint_combustion",
      summary_ko: "충(Clash) 신호와 즉각적 시비 판별 성향이 결합되어 빠르게 표출되는 긴장",
      directionality: { polarity: "symmetric" },
      confidence: computePairCapConfidence(sources.length, 2, false),
      tension_level: "high",
      is_abstaining: false,
      is_mixed: false,
      evidence_sources: sources,
      corroboration: { is_corroborated: true, corroborating_evidence_count: 2, independent_sources: ["clashes", "decompression"] },
      prohibited_claims: ["관계 파탄 단정"],
    };
  } else if (wonjinHits.length > 0 && (cnfA === "solitude_cooling_needed" || cnfB === "solitude_cooling_needed")) {
    const sources = [
      { source_kind: "raw_fact" as const, ref_id: "wonjin_hits", detail: "원진/귀문 상호작용" },
      { source_kind: "personal_ce_dimension" as const, ref_id: "cooling_signals", detail: "동굴 냉각 필요성" },
    ];
    cap10 = {
      capability_id: "conflict_activation",
      status: "supported",
      canonical_meaning_id: "silent_withdrawal_estrangement",
      variant: "silent_withdrawal_estrangement",
      summary_ko: "원진 신호와 동굴 침묵 성향으로 인해 직접적 다툼보다 냉각과 침묵으로 표출되는 갈등",
      directionality: { polarity: "symmetric" },
      confidence: computePairCapConfidence(sources.length, 2, false),
      tension_level: "moderate",
      is_abstaining: false,
      is_mixed: false,
      evidence_sources: sources,
      corroboration: { is_corroborated: true, corroborating_evidence_count: 2, independent_sources: ["wonjin", "cooling"] },
      prohibited_claims: ["영구적 소외 단정"],
    };
  } else if (clashes.length > 0 && branchCombines.length > 0) {
    const sources = [
      { source_kind: "raw_fact" as const, ref_id: "combines", detail: "합 형성" },
      { source_kind: "raw_fact" as const, ref_id: "clashes", detail: "충 형성" },
    ];
    cap10 = {
      capability_id: "conflict_activation",
      status: "mixed",
      canonical_meaning_id: "mixed_combustion_withdrawal",
      variant: "mixed_combustion_withdrawal",
      summary_ko: "합과 충이 병존하여 애착과 순간적 마찰이 복합적으로 교차하는 긴장 패턴",
      directionality: { polarity: "symmetric" },
      confidence: computePairCapConfidence(sources.length, 2, false),
      tension_level: "moderate",
      is_abstaining: false,
      is_mixed: true,
      evidence_sources: sources,
      corroboration: { is_corroborated: true, corroborating_evidence_count: 2, independent_sources: ["combines", "clashes"] },
      prohibited_claims: [],
    };
  } else {
    cap10 = buildAbstainedCapability(
      "conflict_activation",
      "갈등 촉발 패턴을 특정할 충/원진 및 감압 성향 신호 부재",
      "갈등 촉발 양상을 특정할 마찰 및 감압 기질 근거 부족",
      "no affirmative clash, wonjin, or decisive decompression trigger signal present",
    );
  }

  // 11. misunderstanding_translation
  let cap11: CanonicalPairCapability<"misunderstanding_translation">;
  if (wonjinHits.length > 0) {
    const isMixed = branchCombines.length > 0;
    const meaningId = isMixed ? "mixed_translation_gap" : "high_intent_distortion_vulnerability";
    const sources = [{ source_kind: "raw_fact" as const, ref_id: "wonjin_hits", detail: "원진/귀문 발생" }];
    if (isMixed) {
      sources.push({ source_kind: "raw_fact" as const, ref_id: "branch_combines", detail: "지지 합 형성" });
    }
    cap11 = {
      capability_id: "misunderstanding_translation",
      status: isMixed ? "mixed" : "supported",
      canonical_meaning_id: meaningId,
      variant: meaningId,
      summary_ko: isMixed ? "애정과 왜곡이 뒤섞여 해석의 번역 노력이 필요한 상태" : "원진/귀문 구조로 인해 상대방의 본의가 왜곡되거나 섭섭함으로 해석되기 쉬운 취약성",
      directionality: { polarity: "symmetric" },
      confidence: computePairCapConfidence(sources.length, sources.length, false),
      tension_level: "high",
      is_abstaining: false,
      is_mixed: isMixed,
      evidence_sources: sources,
      corroboration: { is_corroborated: sources.length >= 2, corroborating_evidence_count: sources.length, independent_sources: sources.map((s) => s.ref_id) },
      prohibited_claims: ["피해의식 낙인", "악의적 조작 단정"],
    };
  } else if ((profileA?.criticism_sensitivity === "high_defensive_cushion_needed" || profileB?.criticism_sensitivity === "high_defensive_cushion_needed") && clashes.length > 0) {
    const sources = [
      { source_kind: "personal_ce_dimension" as const, ref_id: "criticism_sensitivity", detail: "높은 방어 쿠션 요구" },
      { source_kind: "raw_fact" as const, ref_id: "clashes", detail: "충 발생" },
    ];
    cap11 = {
      capability_id: "misunderstanding_translation",
      status: "supported",
      canonical_meaning_id: "defensive_filtering_barrier",
      variant: "defensive_filtering_barrier",
      summary_ko: "방어적 필터링으로 인해 중립적 피드백이 비판으로 오인될 수 있는 해석 장벽",
      directionality: { polarity: "symmetric" },
      confidence: computePairCapConfidence(sources.length, 2, false),
      tension_level: "moderate",
      is_abstaining: false,
      is_mixed: false,
      evidence_sources: sources,
      corroboration: { is_corroborated: true, corroborating_evidence_count: 2, independent_sources: ["criticism_sensitivity", "clashes"] },
      prohibited_claims: [],
    };
  } else {
    cap11 = buildAbstainedCapability(
      "misunderstanding_translation",
      "오해 번역 및 의도 왜곡을 특정할 원진/귀문 및 비판 민감성 신호 부재",
      "의도 해석 왜곡 및 인지적 번역 난이도를 특정할 근거 부족",
      "no wonjin or active defensive filtering trigger present",
    );
  }

  // 12. repair_entry_loop
  let cap12: CanonicalPairCapability<"repair_entry_loop">;
  if (stemCombines.length > 0 || branchCombines.length > 0) {
    const isMixed = clashes.length > 0;
    const meaningId = isMixed ? "mixed_repair_circuit" : "spontaneous_reset_circuit";
    const sources = [{ source_kind: "raw_fact" as const, ref_id: "combines", detail: "천간/지지 합 회복 경로" }];
    if (isMixed) {
      sources.push({ source_kind: "raw_fact" as const, ref_id: "clashes", detail: "충 마찰 요소" });
    }
    cap12 = {
      capability_id: "repair_entry_loop",
      status: isMixed ? "mixed" : "supported",
      canonical_meaning_id: meaningId,
      variant: meaningId,
      summary_ko: isMixed ? "마찰 후 합의 결속력을 통해 복구되나 일정한 숙려 시간이 필요한 순환" : "합(Combine)의 자연스러운 이끌림을 통한 신속하고 자연스러운 관계 회복 회로",
      directionality: { polarity: "symmetric" },
      confidence: computePairCapConfidence(sources.length, sources.length, false),
      tension_level: isMixed ? "moderate" : "low",
      is_abstaining: false,
      is_mixed: isMixed,
      evidence_sources: sources,
      corroboration: { is_corroborated: sources.length >= 2, corroborating_evidence_count: sources.length, independent_sources: sources.map((s) => s.ref_id) },
      prohibited_claims: [],
    };
  } else if (cnfA === "solitude_cooling_needed" && cnfB === "solitude_cooling_needed") {
    const sources = [{ source_kind: "personal_ce_dimension" as const, ref_id: "dual_cooling", detail: "양측 쿨다운 루프" }];
    cap12 = {
      capability_id: "repair_entry_loop",
      status: "supported",
      canonical_meaning_id: "structured_timeout_cooling_loop",
      variant: "structured_timeout_cooling_loop",
      summary_ko: "양측 모두 충분한 개인적 감정 냉각 시간을 가진 뒤 논리적으로 화해에 진입하는 루프",
      directionality: { polarity: "symmetric" },
      confidence: computePairCapConfidence(sources.length, 1, false),
      tension_level: "low",
      is_abstaining: false,
      is_mixed: false,
      evidence_sources: sources,
      corroboration: { is_corroborated: true, corroborating_evidence_count: 2, independent_sources: ["cnf_a", "cnf_b"] },
      prohibited_claims: [],
    };
  } else if (clashes.length > 1 && wonjinHits.length > 0) {
    const sources = [
      { source_kind: "raw_fact" as const, ref_id: "clashes", detail: "복수 충 발생" },
      { source_kind: "raw_fact" as const, ref_id: "wonjin", detail: "원진 발생" },
    ];
    cap12 = {
      capability_id: "repair_entry_loop",
      status: "supported",
      canonical_meaning_id: "obstructed_repair_gridlock",
      variant: "obstructed_repair_gridlock",
      summary_ko: "충과 원진의 중첩으로 인해 화해 진입점이 좁고 자존심 대치가 길어질 수 있는 교착",
      directionality: { polarity: "symmetric" },
      confidence: computePairCapConfidence(sources.length, 2, false),
      tension_level: "high",
      is_abstaining: false,
      is_mixed: false,
      evidence_sources: sources,
      corroboration: { is_corroborated: true, corroborating_evidence_count: 2, independent_sources: ["clashes", "wonjin"] },
      prohibited_claims: ["화해 불가 단정"],
    };
  } else {
    cap12 = buildAbstainedCapability(
      "repair_entry_loop",
      "갈등 복구 회로를 특정할 합/충/냉각 신호 부재",
      "화해 및 관계 복구 진입로를 특정할 합 및 감압 근거 부족",
      "no combine or structured timeout signal present",
    );
  }

  // 13. hidden_needs_interaction
  let cap13: CanonicalPairCapability<"hidden_needs_interaction">;
  if (wonjinHits.length > 0) {
    const sources = [{ source_kind: "raw_fact" as const, ref_id: "wonjin_hits", detail: "원진/귀문 잠재 상호작용" }];
    cap13 = {
      capability_id: "hidden_needs_interaction",
      status: "supported",
      canonical_meaning_id: "unspoken_vulnerability_misinterpretation",
      variant: "unspoken_vulnerability_misinterpretation",
      summary_ko: "말하지 못한 내면의 인정 욕구와 취약성이 서운함이나 방어로 표현되는 상호작용",
      directionality: { polarity: "symmetric" },
      confidence: computePairCapConfidence(sources.length, 1, false),
      tension_level: "moderate",
      is_abstaining: false,
      is_mixed: false,
      evidence_sources: sources,
      corroboration: { is_corroborated: false, corroborating_evidence_count: 1, independent_sources: ["wonjin"] },
      prohibited_claims: [],
    };
  } else if (stemCombines.length > 0) {
    const sources = [{ source_kind: "raw_fact" as const, ref_id: "stem_combines", detail: "천간 합 암묵적 공명" }];
    cap13 = {
      capability_id: "hidden_needs_interaction",
      status: "supported",
      canonical_meaning_id: "tacit_empathic_attunement",
      variant: "tacit_empathic_attunement",
      summary_ko: "직접 말하지 않아도 상대방의 숨은 필요와 정서적 갈증을 본능적으로 감지하는 조율",
      directionality: { polarity: "symmetric" },
      confidence: computePairCapConfidence(sources.length, 1, false),
      tension_level: "low",
      is_abstaining: false,
      is_mixed: false,
      evidence_sources: sources,
      corroboration: { is_corroborated: false, corroborating_evidence_count: 1, independent_sources: ["stem_combines"] },
      prohibited_claims: ["독심술 단정"],
    };
  } else {
    cap13 = buildAbstainedCapability(
      "hidden_needs_interaction",
      "내면 욕구 상호작용을 특정할 원진/천간합 신호 부재",
      "숨은 욕구 감지 및 방어 반응을 특정할 근거 부족",
      "no wonjin or stem combine present to infer hidden need dynamics",
    );
  }

  // 14. stable_bonding_resources
  let cap14: CanonicalPairCapability<"stable_bonding_resources">;
  if (stemCombines.length > 0 && branchCombines.length > 0) {
    const sources = [
      { source_kind: "raw_fact" as const, ref_id: "stem_combines", detail: "천간합" },
      { source_kind: "raw_fact" as const, ref_id: "branch_combines", detail: "지지합/삼합" },
    ];
    cap14 = {
      capability_id: "stable_bonding_resources",
      status: "supported",
      canonical_meaning_id: "multi_pillar_structural_anchor",
      variant: "multi_pillar_structural_anchor",
      summary_ko: "천간합과 지지합이 다중 기둥에서 중첩 형성된 강력한 구조적 결속 자원",
      directionality: { polarity: "symmetric" },
      confidence: computePairCapConfidence(sources.length, 2, false),
      tension_level: "low",
      is_abstaining: false,
      is_mixed: false,
      evidence_sources: sources,
      corroboration: { is_corroborated: true, corroborating_evidence_count: 2, independent_sources: ["stem_combines", "branch_combines"] },
      prohibited_claims: ["운명적 불가분성 단정"],
    };
  } else if (stemCombines.length > 0 || branchCombines.length > 0) {
    const isMixed = clashes.length > 0;
    const meaningId = isMixed ? "mixed_bonding_friction" : "subtle_organic_bond";
    const sources = [{ source_kind: "raw_fact" as const, ref_id: "combine_single", detail: "단일 합 형성" }];
    if (isMixed) {
      sources.push({ source_kind: "raw_fact" as const, ref_id: "clashes", detail: "충 마찰 요소" });
    }
    cap14 = {
      capability_id: "stable_bonding_resources",
      status: isMixed ? "mixed" : "supported",
      canonical_meaning_id: meaningId,
      variant: meaningId,
      summary_ko: isMixed ? "결속 자원이 존재하나 마찰 요소와 공존하는 유대" : "은은하고 유기적으로 유지되는 결속 자원",
      directionality: { polarity: "symmetric" },
      confidence: computePairCapConfidence(sources.length, sources.length, false),
      tension_level: isMixed ? "moderate" : "low",
      is_abstaining: false,
      is_mixed: isMixed,
      evidence_sources: sources,
      corroboration: { is_corroborated: sources.length >= 2, corroborating_evidence_count: sources.length, independent_sources: sources.map((s) => s.ref_id) },
      prohibited_claims: [],
    };
  } else {
    cap14 = buildAbstainedCapability(
      "stable_bonding_resources",
      "안정적 결속 자원을 특정할 천간합/지지합/삼합 신호 부재",
      "구조적 결속 자원을 특정할 합 근거 부족",
      "absence of combine signals cannot be used to infer structural bond quality",
    );
  }

  // 15. recurring_friction
  let cap15: CanonicalPairCapability<"recurring_friction">;
  if (clashes.length >= 2) {
    const sources = [{ source_kind: "raw_fact" as const, ref_id: "multi_clashes", detail: `충/형 ${clashes.length}건 발생` }];
    cap15 = {
      capability_id: "recurring_friction",
      status: "supported",
      canonical_meaning_id: "chronic_axis_polarization",
      variant: "chronic_axis_polarization",
      summary_ko: "다중 충(Clash) 축 형성으로 인해 특정 주제나 가치관에서 주기적으로 재발하는 마찰",
      directionality: { polarity: "symmetric" },
      confidence: computePairCapConfidence(sources.length, 2, false),
      tension_level: "high",
      is_abstaining: false,
      is_mixed: false,
      evidence_sources: sources,
      corroboration: { is_corroborated: true, corroborating_evidence_count: 2, independent_sources: ["cross_clashes"] },
      prohibited_claims: ["해결 불가능 단정"],
    };
  } else if (clashes.length === 1 || wonjinHits.length > 0) {
    const isMixed = branchCombines.length > 0;
    const meaningId = isMixed ? "mixed_friction_bond_paradox" : "acute_periodic_friction";
    const sources = [{ source_kind: "raw_fact" as const, ref_id: "single_friction", detail: "단일 충/원진 발생" }];
    if (isMixed) {
      sources.push({ source_kind: "raw_fact" as const, ref_id: "branch_combines", detail: "지지 합 형성" });
    }
    cap15 = {
      capability_id: "recurring_friction",
      status: isMixed ? "mixed" : "supported",
      canonical_meaning_id: meaningId,
      variant: meaningId,
      summary_ko: isMixed ? "끈끈한 유대 속에서 간헐적 자극이 찾아오는 애증의 패러독스" : "특정 자극 상황에서 일시적으로 긴장이 고조되는 주기적 마찰",
      directionality: { polarity: "symmetric" },
      confidence: computePairCapConfidence(sources.length, sources.length, false),
      tension_level: isMixed ? "moderate" : "low",
      is_abstaining: false,
      is_mixed: isMixed,
      evidence_sources: sources,
      corroboration: { is_corroborated: sources.length >= 2, corroborating_evidence_count: sources.length, independent_sources: sources.map((s) => s.ref_id) },
      prohibited_claims: [],
    };
  } else {
    cap15 = buildAbstainedCapability(
      "recurring_friction",
      "반복 마찰을 특정할 충/형/원진 신호 부재",
      "주기적 긴장과 마찰을 특정할 충/원진 근거 부족",
      "absence of clash or wonjin cannot be used as an evidence-free positive harmony fallback",
    );
  }

  return {
    directional_support_exchange: cap1,
    initiative_and_response: cap2,
    mutual_recognition: cap3,
    expression_emotional_pace_mismatch: cap4,
    closeness_space_mismatch: cap5,
    decision_coordination: cap6,
    role_formation: cap7,
    resource_responsibility_exchange: cap8,
    pressure_amplification_buffering: cap9,
    conflict_activation: cap10,
    misunderstanding_translation: cap11,
    repair_entry_loop: cap12,
    hidden_needs_interaction: cap13,
    stable_bonding_resources: cap14,
    recurring_friction: cap15,
  };
}
