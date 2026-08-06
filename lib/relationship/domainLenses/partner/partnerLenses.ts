/**
 * Partner (Marriage / Life Partner) Domain Lenses
 *
 * Implements 10 canonical Partner Lenses grounded in Pair CE, Personal CE,
 * Ten-God Matrix runtime resolutions, and authoritative V1 Gold canonical adapters.
 */

import type { PairContextPacket } from "@/lib/personCore/pairContextEngine/types";
import type { PairSajuFacts, PairElementFlowFact } from "@/lib/personCore/pairSaju";
import type { PersonalContextEngineOutput } from "@/lib/personCore/personalContextEngine/types";
import type {
  DomainLensEvaluation,
  PartnerLensId,
  LensConfidenceLevel,
  LensTensionLevel,
  LensDirectionalityEvaluation,
} from "../types";
import { resolveTenGodDomainExpression, type TenGodCode } from "../tenGodLensMatrix";
import {
  resolvePartnerCoreBondCanonical,
  resolvePartnerOperatingCfoCanonical,
  resolvePartnerHouseholdChoresCanonical,
  resolvePartnerPrivateSanctuaryCanonical,
  resolvePartnerBedroomCanonical,
  resolvePartnerConflictTriggerCanonical,
  resolvePartnerTempoRhythmCanonical,
  resolvePartnerCrisisProtectorCanonical,
  resolvePartnerParentingCanonical,
  resolvePartnerLongtermVisionCanonical,
} from "@/lib/relationship/marriage/partnerCanonicalAdapters";

function deriveDirectionality(
  flow: PairElementFlowFact | null | undefined,
  impactLead: string,
  impactSupport: string,
): LensDirectionalityEvaluation {
  if (!flow || flow.direction === "symmetric" || flow.direction === "none") {
    return {
      polarity: "symmetric",
      impact_on_a_ko: impactLead,
      impact_on_b_ko: impactSupport,
    };
  }
  if (flow.direction === "a_to_b") {
    return {
      polarity: "a_to_b",
      lead_party: "A",
      impact_on_a_ko: impactLead,
      impact_on_b_ko: impactSupport,
    };
  }
  if (flow.direction === "b_to_a") {
    return {
      polarity: "b_to_a",
      lead_party: "B",
      impact_on_a_ko: impactSupport,
      impact_on_b_ko: impactLead,
    };
  }
  return {
    polarity: "symmetric",
    impact_on_a_ko: impactLead,
    impact_on_b_ko: impactSupport,
  };
}

export function evaluatePartnerLenses(params: {
  facts: PairSajuFacts;
  packets?: PairContextPacket[];
  personalCeA?: PersonalContextEngineOutput;
  personalCeB?: PersonalContextEngineOutput;
  partyNames?: { a: string; b: string };
  psychScores?: Record<string, number>;
}): DomainLensEvaluation<PartnerLensId>[] {
  const { facts, packets = [], personalCeA, personalCeB, partyNames } = params;
  const nameA = partyNames?.a ?? "A";
  const nameB = partyNames?.b ?? "B";
  const unknownHour = facts.birth_time_unknown_a || facts.birth_time_unknown_b;

  const crossHits = facts.cross_hits ?? [];
  const stemCombines = crossHits.filter((h) => h.type === "천간합");
  const stemClashes = crossHits.filter((h) => h.type === "천간충");
  const branchCombines = crossHits.filter((h) => ["육합", "삼합", "반합"].includes(h.type));
  const branchClashes = crossHits.filter((h) => ["충", "형", "파", "해"].includes(h.type));
  const wonjinHits = crossHits.filter((h) => ["원진", "귀문"].includes(h.type));
  const elementFlow = facts.element_flow;
  const johu = facts.johu_relation;
  const trioHits = facts.trio_hits ?? [];
  const yongsin = facts.yongsin_alignment;

  const profA = personalCeA?.aggregates?.relational_profile;
  const profB = personalCeB?.aggregates?.relational_profile;
  const stemCountsA = personalCeA?.aggregates?.ten_god_stem_counts ?? {};
  const stemCountsB = personalCeB?.aggregates?.ten_god_stem_counts ?? {};

  const resolveGod = (god: TenGodCode, isTension = false) =>
    resolveTenGodDomainExpression({ god, domain: "partner", isTension });

  const evaluations: DomainLensEvaluation<PartnerLensId>[] = [
    // 1. Partner Core Bond
    (() => {
      const canonicalPacket = resolvePartnerCoreBondCanonical({
        hasStemCombine: stemCombines.length > 0,
        hasBranchCombine: branchCombines.length > 0,
        hasClash: stemClashes.length > 0 || branchClashes.length > 0,
        elementFlow,
        hasFacts: crossHits.length > 0 || Boolean(facts.element_flow),
        unknownHour,
      });

      if (canonicalPacket.status === "abstained") {
        return {
          lens_id: "partner_core_bond",
          domain: "partner",
          user_question: "우리가 서로를 인생의 동반자로 선택한 근본적인 결속력과 끌림은 무엇일까?",
          emotional_outcome: "두 사람의 핵심 결속에 대한 사주 데이터 지표 부족 (중립 확인)",
          canonical_meaning_id: "partner_bond_insufficient_evidence",
          headline_ko: `${nameA}와(과) ${nameB}의 핵심 결속에 대한 충분한 사주 근거가 확인되지 않습니다.`,
          headline_en: `Insufficient astrological evidence to determine a core attachment pattern.`,
          narrative_ko: `천간합, 지지합 및 오행 상생 흐름이 확인되지 않아 특정 결속 패턴을 단정하지 않고 상호 소통을 통한 이해를 권장합니다.`,
          narrative_en: `No definitive combines or element flows were found; abstaining from deterministic claims.`,
          confidence: "insufficient" as LensConfidenceLevel,
          tension_level: "low" as LensTensionLevel,
          is_abstaining: true,
          abstain_reason: "insufficient_evidence",
          directionality: { polarity: "symmetric", impact_on_a_ko: "중립적 소통", impact_on_b_ko: "중립적 소통" },
          primary_saju_evidence: [],
          supporting_packet_ids: [],
          personal_ce_contributions: {},
          llm_synthesis_allowance: {
            allowed_themes: ["열린 대화", "서로 알아가기"],
            prohibited_claims: ["운명적 결속", "반드시 실패한다"],
          },
        };
      }

      const tgExpr = resolveGod("비견");
      const isDynamic = canonicalPacket.meaning_id === "partner_bond_dynamic_magnetic";
      const isStemCombine = stemCombines.length > 0;

      return {
        lens_id: "partner_core_bond",
        domain: "partner",
        user_question: "우리가 서로를 인생의 동반자로 선택한 근본적인 결속력과 끌림은 무엇일까?",
        emotional_outcome: "두 사람의 만남이 우연을 넘어 서로의 존재 자체로 완성되는 필연적 신뢰감 확인",
        canonical_meaning_id: canonicalPacket.meaning_id,
        headline_ko: isDynamic
          ? `${nameA}와(과) ${nameB}의 강렬한 매력과 자존심 조율이 공존하는 역동적 결속`
          : isStemCombine
            ? `${nameA}와(과) ${nameB}의 인생 가치관이 한 팀처럼 맞물리는 강력한 핵심 결속`
            : `${nameA}와(과) ${nameB}의 서로 다른 기질이 상호보완적으로 지탱해 주는 동반자 결속`,
        headline_en: isDynamic
          ? `A dynamic magnetic bond combining strong mutual attraction with active ego calibration`
          : isStemCombine
            ? `A foundational core bond where life visions align into a unified team`
            : `A complementary partnership where distinct temperaments support one another`,
        narrative_ko: isDynamic
          ? `천간합의 깊은 정신적 끌림과 지지 충의 자극이 어우러져 서로를 뜨겁게 성장시키는 관계입니다. ${tgExpr.selected_summary_ko}`
          : isStemCombine
            ? `천간합을 기반으로 서로의 존재가 삶의 안정적 안전기지가 되어 줍니다. ${tgExpr.selected_summary_ko}`
            : `오행 상생의 흐름으로 서로의 부족한 에너지를 자연스럽게 채워주는 관계입니다.`,
        narrative_en: `Evidence indicates foundational bond resonance between the partners.`,
        confidence: canonicalPacket.confidence,
        tension_level: isDynamic ? "moderate" : "low",
        directionality: deriveDirectionality(elementFlow, "든든한 지지 기반 형성", "안정적 정서 안식처 체감"),
        primary_saju_evidence: [
          ...stemCombines.map((h) => ({ kind: "stem_combine" as const, description_ko: `${h.personA_pillar}×${h.personB_pillar} ${h.detail ?? h.type}` })),
          ...branchCombines.map((h) => ({ kind: "branch_combine" as const, description_ko: `${h.personA_pillar}×${h.personB_pillar} ${h.detail ?? h.type}` })),
        ],
        supporting_packet_ids: packets.filter((p) => p.group === "bonding").map((p) => p.packet_id),
        personal_ce_contributions: {
          a: profA ? [`relational_profile:${profA.expression_style}`] : [],
          b: profB ? [`relational_profile:${profB.expression_style}`] : [],
        },
        llm_synthesis_allowance: {
          allowed_themes: ["핵심 가치관 일치", "상호 성장", "안전기지"],
          prohibited_claims: tgExpr.prohibited_claims,
        },
      };
    })(),

    // 2. Partner Operating CFO
    (() => {
      const canonicalPacket = resolvePartnerOperatingCfoCanonical({
        nicknameA: nameA,
        nicknameB: nameB,
        countsA: stemCountsA,
        countsB: stemCountsB,
        profA,
        profB,
        elementFlow: facts.element_flow,
        hasFacts: crossHits.length > 0 || Boolean(facts.element_flow),
        birthTimeUnknownA: facts.birth_time_unknown_a,
        birthTimeUnknownB: facts.birth_time_unknown_b,
      });

      if (canonicalPacket.status === "abstained") {
        return {
          lens_id: "partner_operating_cfo",
          domain: "partner",
          user_question: "가계 경제, 자산 관리, 통장 관리는 누구 주도로 어떻게 투명하게 운영해야 할까?",
          emotional_outcome: "가계 재정 주도권 지표 부족 (공동 관리 권장)",
          canonical_meaning_id: "partner_cfo_insufficient_evidence",
          headline_ko: "두 사람의 가계 재정 주도권에 대한 십신 지표가 부족합니다.",
          headline_en: "Insufficient ten-god indicators for singular household CFO leadership.",
          narrative_ko: "특정 1인 주도보다는 통장 쪼개기와 월간 정기 가계 결산을 통한 투명한 공동 관리를 권장합니다.",
          narrative_en: "Maintain transparent co-governance with monthly financial reviews and shared ledgers.",
          confidence: "insufficient" as LensConfidenceLevel,
          tension_level: "low" as LensTensionLevel,
          is_abstaining: true,
          abstain_reason: "insufficient_evidence",
          directionality: { polarity: "symmetric", impact_on_a_ko: "공동 예산 관리", impact_on_b_ko: "공동 예산 관리" },
          primary_saju_evidence: [],
          supporting_packet_ids: [],
          personal_ce_contributions: {},
          llm_synthesis_allowance: {
            allowed_themes: ["공동 관리", "투명한 결산", "통장 쪼개기"],
            prohibited_claims: ["독단적 지출", "파산 위기"],
          },
        };
      }

      const tgExpr = resolveGod("정재");
      const isLeadA = canonicalPacket.meaning_id === "partner_cfo_party_a_lead";
      const isLeadB = canonicalPacket.meaning_id === "partner_cfo_party_b_lead";

      return {
        lens_id: "partner_operating_cfo",
        domain: "partner",
        user_question: "가계 경제, 자산 관리, 통장 관리는 누구 주도로 어떻게 투명하게 운영해야 할까?",
        emotional_outcome: "돈 문제로 인한 불필요한 감정 소모를 원천 차단하고 미래 자산을 극대화하는 재정 시스템 안착",
        canonical_meaning_id: canonicalPacket.meaning_id,
        headline_ko: isLeadA
          ? `${nameA}의 꼼꼼한 가계 총괄 CFO 주도와 ${nameB}의 신뢰 기반 예산 협력`
          : (isLeadB
            ? `${nameB}의 체계적인 자산 운용 CFO 주도와 ${nameA}의 자율적 용돈 합의`
            : `${nameA}와(과) ${nameB}의 역할 분담형 투명 재정 공동 거버넌스`),
        headline_en: isLeadA
          ? `${nameA} leading household CFO governance with transparent budgetary alignment`
          : (isLeadB
            ? `${nameB} leading asset allocation CFO governance with mutual autonomy limits`
            : `Dual financial co-governance with divided fiscal responsibilities`),
        narrative_ko: isLeadA
          ? `${nameA}의 정재/편재 현실 감각을 활용하여 고정비 관리와 저축 설계를 총괄하는 것이 가계 안정에 가장 유리합니다. ${tgExpr.selected_summary_ko}`
          : (isLeadB
            ? `${nameB}의 재정 기획력을 바탕으로 투자와 지출 관리를 주도하되 월간 브리핑을 갖는 것이 효과적입니다. ${tgExpr.selected_summary_ko}`
            : `수입과 지출의 성격에 따라 생활비와 투자 파트를 분담하여 상호 견제와 균형을 이루는 방식이 최적입니다.`),
        narrative_en: `Structured fiscal governance minimizes financial friction and accelerates joint wealth compounding.`,
        confidence: canonicalPacket.confidence,
        tension_level: "low",
        directionality: {
          polarity: isLeadA ? "a_to_b" : isLeadB ? "b_to_a" : "symmetric",
          lead_party: isLeadA ? "A" : isLeadB ? "B" : undefined,
          impact_on_a_ko: isLeadA ? "가계부 총괄 및 고정비 집행" : "자율 예산 범위 준수",
          impact_on_b_ko: isLeadA ? "자율 예산 범위 준수" : "가계부 총괄 및 자산 배분",
        },
        primary_saju_evidence: [
          { kind: "ten_god_matrix", description_ko: `재성 십신 분포: A(${stemCountsA["정재"] ?? 0}정재/${stemCountsA["편재"] ?? 0}편재) vs B(${stemCountsB["정재"] ?? 0}정재/${stemCountsB["편재"] ?? 0}편재)` },
        ],
        supporting_packet_ids: packets.filter((p) => p.group === "structure").map((p) => p.packet_id),
        personal_ce_contributions: {
          a: profA ? [`spending_governance:${profA.resource_governance}`] : [],
          b: profB ? [`spending_governance:${profB.resource_governance}`] : [],
        },
        llm_synthesis_allowance: {
          allowed_themes: ["CFO 총괄", "월간 결산", "비상금 한도"],
          prohibited_claims: tgExpr.prohibited_claims,
        },
      };
    })(),

    // 3. Partner Household Chores
    (() => {
      const canonicalPacket = resolvePartnerHouseholdChoresCanonical({
        hasBranchClash: branchClashes.length > 0,
        hasBranchCombine: branchCombines.length > 0,
        hasFacts: crossHits.length > 0 || Boolean(facts.element_flow),
        unknownHour,
      });

      if (canonicalPacket.status === "abstained") {
        return {
          lens_id: "partner_household_chores",
          domain: "partner",
          user_question: "청소, 빨래, 요리 등 일상 가사 분담에서 생기는 보이지 않는 피로를 없애는 룰은?",
          emotional_outcome: "가사 분담 지표 부족 (기본 협력)",
          canonical_meaning_id: "partner_chores_insufficient_evidence",
          headline_ko: "가사 분담의 구조적 긴장 지표가 확인되지 않습니다.",
          headline_en: "No pronounced friction indicators found for domestic labor distribution.",
          narrative_ko: "상황에 맞춰 유연하게 서로를 돕는 일상적 가사 협력을 유지하세요.",
          narrative_en: "Maintain fluid day-to-day domestic coordination without rigid mandates.",
          confidence: "insufficient" as LensConfidenceLevel,
          tension_level: "low" as LensTensionLevel,
          is_abstaining: true,
          abstain_reason: "insufficient_evidence",
          directionality: { polarity: "symmetric", impact_on_a_ko: "유연한 분담", impact_on_b_ko: "유연한 분담" },
          primary_saju_evidence: [],
          supporting_packet_ids: [],
          personal_ce_contributions: {},
          llm_synthesis_allowance: {
            allowed_themes: ["유연한 협력", "일상적 배려"],
            prohibited_claims: ["가사 독박", "갈등 폭발"],
          },
        };
      }

      const tgExpr = resolveGod("정관");
      const isClash = branchClashes.length > 0;

      return {
        lens_id: "partner_household_chores",
        domain: "partner",
        user_question: "청소, 빨래, 요리 등 일상 가사 분담에서 생기는 보이지 않는 피로를 없애는 룰은?",
        emotional_outcome: "'왜 나만 해?'라는 억울함 없이 각자의 강점 구역을 책임지는 매끄러운 룸메이트 시스템",
        canonical_meaning_id: canonicalPacket.meaning_id,
        headline_ko: isClash
          ? `${nameA}와(과) ${nameB}의 완벽주의 기준차 완화와 명확한 구역별 1인 1책임제`
          : `${nameA}와(과) ${nameB}의 자연스러운 상황별 가사 유동 협력`,
        headline_en: isClash
          ? `Mitigating cleanliness standard disparities via strictly designated single-owner zones`
          : `Organic and fluid household task coordination built on mutual empathy`,
        narrative_ko: isClash
          ? `지지충의 생활 습관 차이로 인해 '눈에 보일 때 치우자'는 방식은 한쪽의 독박 피로를 낳으므로 청소/설거지 등 영역을 칼같이 나누는 것이 평화를 지킵니다. ${tgExpr.selected_summary_ko}`
          : `합의 조화로 인해 식사와 분리수거 등 손발이 잘 맞아 유연한 방식으로도 가사가 매끄럽게 운영됩니다.`,
        narrative_en: `Clear ownership zones eliminate invisible cognitive load and household resentment.`,
        confidence: canonicalPacket.confidence,
        tension_level: isClash ? "moderate" : "low",
        directionality: {
          polarity: "symmetric",
          impact_on_a_ko: "지정 구역 완결 책임 및 상대 방식 간섭 금지",
          impact_on_b_ko: "지정 구역 완결 책임 및 결과물 지적 자제",
        },
        primary_saju_evidence: [
          ...branchClashes.map((h) => ({ kind: "branch_clash" as const, description_ko: `${h.personA_pillar}×${h.personB_pillar} ${h.detail ?? h.type}` })),
          ...branchCombines.map((h) => ({ kind: "branch_combine" as const, description_ko: `${h.personA_pillar}×${h.personB_pillar} ${h.detail ?? h.type}` })),
        ],
        supporting_packet_ids: packets.filter((p) => p.group === "structure").map((p) => p.packet_id),
        personal_ce_contributions: {
          a: profA ? [`structure_spontaneity:${profA.structure_spontaneity}`] : [],
          b: profB ? [`structure_spontaneity:${profB.structure_spontaneity}`] : [],
        },
        llm_synthesis_allowance: {
          allowed_themes: ["구역 책임제", "기준치 조율", "가전 적극 활용"],
          prohibited_claims: tgExpr.prohibited_claims,
        },
      };
    })(),

    // 4. Partner Private Sanctuary
    (() => {
      const canonicalPacket = resolvePartnerPrivateSanctuaryCanonical({
        hasWonjin: wonjinHits.length > 0,
        profA,
        profB,
        hasFacts: crossHits.length > 0 || Boolean(facts.element_flow),
        unknownHour,
      });

      if (canonicalPacket.status === "abstained") {
        return {
          lens_id: "partner_private_sanctuary",
          domain: "partner",
          user_question: "한 공간에 함께 살면서도 서로의 사생활과 혼자만의 동굴 시간을 어떻게 보장할까?",
          emotional_outcome: "공간 분리 지표 부족 (자연스러운 공존)",
          canonical_meaning_id: "partner_space_insufficient_evidence",
          headline_ko: "물리적 공간 분리에 대한 특이 긴장 지표가 없습니다.",
          headline_en: "No pronounced spatial boundary friction found.",
          narrative_ko: "함께 있는 시간과 각자의 취미 시간이 자연스럽게 어우러지는 편안한 상태입니다.",
          narrative_en: "Coexistence and individual downtime balance organically.",
          confidence: "insufficient" as LensConfidenceLevel,
          tension_level: "low" as LensTensionLevel,
          is_abstaining: true,
          abstain_reason: "insufficient_evidence",
          directionality: { polarity: "symmetric", impact_on_a_ko: "자연스러운 공존", impact_on_b_ko: "자연스러운 공존" },
          primary_saju_evidence: [],
          supporting_packet_ids: [],
          personal_ce_contributions: {},
          llm_synthesis_allowance: {
            allowed_themes: ["자연스러운 공존", "자유로운 시간"],
            prohibited_claims: ["사생활 침해", "감금"],
          },
        };
      }

      const tgExpr = resolveGod("편인");

      return {
        lens_id: "partner_private_sanctuary",
        domain: "partner",
        user_question: "한 공간에 함께 살면서도 서로의 사생활과 혼자만의 동굴 시간을 어떻게 보장할까?",
        emotional_outcome: "상대방의 침묵을 거절로 오해하지 않고 각자의 에너지를 충전할 수 있는 심리적 안전거리 확보",
        canonical_meaning_id: canonicalPacket.meaning_id,
        headline_ko: `${nameA}와(과) ${nameB}의 심리적 탈진을 막는 독립 동굴 시간(Sanctuary) 공식 보장`,
        headline_en: `Securing non-negotiable psychological sanctuary time to prevent shared-space burnout`,
        narrative_ko: `원진/귀문의 민감성으로 인해 하루 1시간 혼자만의 서재나 방에 틀어박혀 침묵하는 시간은 애정의 식음이 아니라 필수 충전 과정입니다. ${tgExpr.selected_summary_ko}`,
        narrative_en: `Allocating dedicated solo recharge zones prevents sensory overload and preserves relational tenderness.`,
        confidence: canonicalPacket.confidence,
        tension_level: "moderate",
        directionality: {
          polarity: "symmetric",
          impact_on_a_ko: "상대의 침묵 요구 존중 및 서운함 배제",
          impact_on_b_ko: "동굴 진입 전 '충전 후 복귀' 사전 신호 공유",
        },
        primary_saju_evidence: wonjinHits.map((h) => ({ kind: "wonjin" as const, description_ko: `${h.personA_pillar}×${h.personB_pillar} ${h.detail ?? h.type}` })),
        supporting_packet_ids: packets.filter((p) => p.fact_kind === "wonjin_guimun").map((p) => p.packet_id),
        personal_ce_contributions: {
          a: profA ? [`solitude_autonomy:${profA.solitude_autonomy}`] : [],
          b: profB ? [`solitude_autonomy:${profB.solitude_autonomy}`] : [],
        },
        llm_synthesis_allowance: {
          allowed_themes: ["동굴 시간", "무언의 충전", "물리적 공간 분리"],
          prohibited_claims: tgExpr.prohibited_claims,
        },
      };
    })(),

    // 5. Partner Bedroom Intimacy
    (() => {
      const canonicalPacket = resolvePartnerBedroomCanonical({
        johuRelation: johu,
        hasFacts: crossHits.length > 0 || Boolean(facts.element_flow),
        unknownHour,
      });

      if (canonicalPacket.status === "abstained") {
        return {
          lens_id: "partner_bedroom_intimacy",
          domain: "partner",
          user_question: "수면 패턴, 침실 환경(온도/조명), 그리고 스킨십 친밀도의 리듬을 어떻게 맞출까?",
          emotional_outcome: "침실 조후 불균형 지표 부족 (기본 쾌적)",
          canonical_meaning_id: "partner_bedroom_insufficient_evidence",
          headline_ko: "침실 환경 및 수면 리듬에 대한 특이 조후 격차가 없습니다.",
          headline_en: "No pronounced thermal or pacing contrast found for bedroom environment.",
          narrative_ko: "서로에게 편안한 수면 환경과 친밀도 템포를 자연스럽게 찾아가실 수 있습니다.",
          narrative_en: "Sleep habits and physical intimacy flow comfortably without sharp environmental friction.",
          confidence: "insufficient" as LensConfidenceLevel,
          tension_level: "low" as LensTensionLevel,
          is_abstaining: true,
          abstain_reason: "insufficient_evidence",
          directionality: { polarity: "symmetric", impact_on_a_ko: "편안한 침실 환경", impact_on_b_ko: "편안한 침실 환경" },
          primary_saju_evidence: [],
          supporting_packet_ids: [],
          personal_ce_contributions: {},
          llm_synthesis_allowance: {
            allowed_themes: ["편안한 수면", "자연스러운 친밀감"],
            prohibited_claims: ["각방 필수", "성격 차이"],
          },
        };
      }

      const tgExpr = resolveGod("상관");
      const isContrast = johu?.relation === "mismatch" || Boolean(johu?.temperature_mismatch);

      return {
        lens_id: "partner_bedroom_intimacy",
        domain: "partner",
        user_question: "수면 패턴, 침실 환경(온도/조명), 그리고 스킨십 친밀도의 리듬을 어떻게 맞출까?",
        emotional_outcome: "수면의 질을 최우선으로 지키면서도 서로의 온도를 교환하는 깊은 신체적 안식",
        canonical_meaning_id: canonicalPacket.meaning_id,
        headline_ko: isContrast
          ? `${nameA}와(과) ${nameB}의 체질적 온습도 차이 극복과 맞춤형 침실 환경 튜닝`
          : `${nameA}와(과) ${nameB}의 포근한 조후 균형 기반 편안한 수면 일체감`,
        headline_en: isContrast
          ? `Calibrating thermal and sensory sleep preferences for deep nocturnal restoration`
          : `Harmonious thermal balance creating a soothing and comforting nocturnal rhythm`,
        narrative_ko: isContrast
          ? `조후의 한열(추위/더위) 차이로 인해 이불 분리나 수면 온도 조절이 필수적이며, 이는 신체적 피로를 막고 스킨십의 질을 높여줍니다. ${tgExpr.selected_summary_ko}`
          : `조후가 조화로워 침실의 분위기와 정서적 스킨십 교감이 매우 자연스럽고 따뜻하게 유지됩니다.`,
        narrative_en: `Nocturnal thermal alignment and sensory hygiene preserve long-term restorative intimacy.`,
        confidence: canonicalPacket.confidence,
        tension_level: "low",
        directionality: {
          polarity: "symmetric",
          impact_on_a_ko: "개별 이불/암막 커튼 활용 및 수면 리듬 존중",
          impact_on_b_ko: "취침 전 10분 온기 교감 및 온도 타협",
        },
        primary_saju_evidence: johu ? [{ kind: "johu_thermal", description_ko: `조후 관계: ${johu.relation} (${johu.temperature_complement ? "상호 보열/보한" : "조후 격차"})` }] : [],
        supporting_packet_ids: (packets ?? []).filter((p) => p.fact_path?.includes("johu") || p.group === "energy").map((p) => p.packet_id),
        personal_ce_contributions: {},
        llm_synthesis_allowance: {
          allowed_themes: ["이불 분리", "수면 온도 조절", "취침 전 루틴"],
          prohibited_claims: tgExpr.prohibited_claims,
        },
      };
    })(),

    // 6. Partner Conflict Trigger
    (() => {
      const canonicalPacket = resolvePartnerConflictTriggerCanonical({
        hasStemClash: stemClashes.length > 0,
        hasBranchClash: branchClashes.length > 0,
        profA,
        profB,
        hasFacts: crossHits.length > 0 || Boolean(facts.element_flow),
        unknownHour,
      });

      if (canonicalPacket.status === "abstained") {
        return {
          lens_id: "partner_conflict_trigger",
          domain: "partner",
          user_question: "말투, 표정, 혹은 가치관 차이로 부딪힐 때 감정싸움으로 번지지 않게 막는 트리거는?",
          emotional_outcome: "갈등 트리거 지표 부족 (기본 온화)",
          canonical_meaning_id: "partner_conflict_insufficient_evidence",
          headline_ko: "급격한 언어적·신체적 충돌 지표가 확인되지 않습니다.",
          headline_en: "No pronounced clash triggers found; baseline communication is gentle.",
          narrative_ko: "부정적 감정 증폭 없이 대화로 원만하게 풀어나갈 수 있는 건강한 소통 상태입니다.",
          narrative_en: "Communication flows without explosive reactivity or destructive escalations.",
          confidence: "insufficient" as LensConfidenceLevel,
          tension_level: "low" as LensTensionLevel,
          is_abstaining: true,
          abstain_reason: "insufficient_evidence",
          directionality: { polarity: "symmetric", impact_on_a_ko: "온화한 대화", impact_on_b_ko: "온화한 대화" },
          primary_saju_evidence: [],
          supporting_packet_ids: [],
          personal_ce_contributions: {},
          llm_synthesis_allowance: {
            allowed_themes: ["온화한 소통", "원만한 해결"],
            prohibited_claims: ["이혼 위기", "언어 폭력"],
          },
        };
      }

      const tgExpr = resolveGod("편관", true);
      const isStemClash = stemClashes.length > 0;

      return {
        lens_id: "partner_conflict_trigger",
        domain: "partner",
        user_question: "말투, 표정, 혹은 가치관 차이로 부딪힐 때 감정싸움으로 번지지 않게 막는 트리거는?",
        emotional_outcome: "상대의 말을 비난으로 듣지 않고 본심을 알아채는 성숙한 대화 필터 장착",
        canonical_meaning_id: canonicalPacket.meaning_id,
        headline_ko: isStemClash
          ? `${nameA}와(과) ${nameB}의 천간충 인지적 왜곡 차단과 '쿠션어(Cushion)' 필수화`
          : `${nameA}와(과) ${nameB}의 지지충 감정 격화 시 20분 의무 쿨링 타임아웃`,
        headline_en: isStemClash
          ? `Neutralizing cognitive distortion from stem clashes via proactive verbal cushioning`
          : `Mandatory 20-minute physical cooldown timeouts during heated branch friction`,
        narrative_ko: isStemClash
          ? `천간충은 사실 전달조차 '나를 무시하나?'라는 오해를 낳기 쉬우므로 '~해주면 좋겠어'라는 요청형 쿠션어가 결정적 방패가 됩니다. ${tgExpr.selected_summary_ko}`
          : `지지충의 감정 분출 시 즉각 논쟁을 멈추고 각자의 방으로 흩어져 심박수를 낮춘 뒤 재대화해야 합니다.`,
        narrative_en: `Structured communication buffers protect emotional safety during inevitable partner friction.`,
        confidence: canonicalPacket.confidence,
        tension_level: "moderate",
        directionality: {
          polarity: "symmetric",
          impact_on_a_ko: "지적하고 싶은 순간 3초 멈춤 및 쿠션어 사용",
          impact_on_b_ko: "상대 지적을 인격 비하로 해석하지 않는 인지 필터",
        },
        primary_saju_evidence: [
          ...stemClashes.map((h) => ({ kind: "stem_clash" as const, description_ko: `${h.personA_pillar}×${h.personB_pillar} ${h.detail ?? h.type}` })),
          ...branchClashes.map((h) => ({ kind: "branch_clash" as const, description_ko: `${h.personA_pillar}×${h.personB_pillar} ${h.detail ?? h.type}` })),
        ],
        supporting_packet_ids: packets.filter((p) => p.group === "friction").map((p) => p.packet_id),
        personal_ce_contributions: {
          a: profA ? [`conflict_decompression:${profA.conflict_decompression}`] : [],
          b: profB ? [`conflict_decompression:${profB.conflict_decompression}`] : [],
        },
        llm_synthesis_allowance: {
          allowed_themes: ["쿠션어", "타임아웃", "비난 필터링"],
          prohibited_claims: tgExpr.prohibited_claims,
        },
      };
    })(),

    // 7. Partner Tempo Rhythm
    (() => {
      const canonicalPacket = resolvePartnerTempoRhythmCanonical({
        elementFlow,
        profA,
        profB,
        hasFacts: crossHits.length > 0 || Boolean(facts.element_flow),
        unknownHour,
      });

      if (canonicalPacket.status === "abstained") {
        return {
          lens_id: "partner_tempo_rhythm",
          domain: "partner",
          user_question: "주말 휴식 방식, 외출/집콕 선호도, 일상 행동 속도(Pace)의 차이는?",
          emotional_outcome: "템포 비대칭 지표 부족 (자연스러운 템포)",
          canonical_meaning_id: "partner_tempo_insufficient_evidence",
          headline_ko: "행동 템포나 에너지 속도에 대한 특이 비대칭 지표가 없습니다.",
          headline_en: "No pronounced pace asymmetry found; daily rhythms align organically.",
          narrative_ko: "일상적인 주말 일정과 휴식 템포를 편안하게 맞춰가실 수 있습니다.",
          narrative_en: "Daily lifestyle pacing and weekend preferences align without friction.",
          confidence: "insufficient" as LensConfidenceLevel,
          tension_level: "low" as LensTensionLevel,
          is_abstaining: true,
          abstain_reason: "insufficient_evidence",
          directionality: { polarity: "symmetric", impact_on_a_ko: "자연스러운 템포", impact_on_b_ko: "자연스러운 템포" },
          primary_saju_evidence: [],
          supporting_packet_ids: [],
          personal_ce_contributions: {},
          llm_synthesis_allowance: {
            allowed_themes: ["자연스러운 템포", "편안한 휴식"],
            prohibited_claims: ["생활 불일치", "강박"],
          },
        };
      }

      const tgExpr = resolveGod("식신");
      const isAsymmetric = canonicalPacket.meaning_id === "partner_tempo_synchronized_flow";

      return {
        lens_id: "partner_tempo_rhythm",
        domain: "partner",
        user_question: "주말 휴식 방식, 외출/집콕 선호도, 일상 행동 속도(Pace)의 차이는?",
        emotional_outcome: "속도 차이로 인해 서로를 재촉하거나 답답해하지 않는 페이스메이커 호흡",
        canonical_meaning_id: canonicalPacket.meaning_id,
        headline_ko: isAsymmetric
          ? `${nameA}와(과) ${nameB}의 외향/내향 에너지 충전 방식 조율과 주말 50:50 룰`
          : `${nameA}와(과) ${nameB}의 동기화된 일상 템포와 편안한 라이프 리듬`,
        headline_en: isAsymmetric
          ? `Balancing contrasting social/recharge tempos with structured weekend compromise rules`
          : `Synchronized daily living paces creating a calm and effortless lifestyle rhythm`,
        narrative_ko: isAsymmetric
          ? `한쪽이 외출과 활동으로 에너지를 얻는다면 다른 쪽은 집콕 휴식이 필요하므로, 토요일은 외출/일요일은 완전 휴식의 균형이 관계를 살립니다. ${tgExpr.selected_summary_ko}`
          : `서로의 활동성과 휴식 주기가 비슷하여 주말 일정을 잡고 여가를 즐길 때 의견 일치가 매우 쉽습니다.`,
        narrative_en: `Pacing alignment ensures sustainable coexistence without relational exhaustion.`,
        confidence: canonicalPacket.confidence,
        tension_level: "low",
        directionality: deriveDirectionality(elementFlow, "활동성 제안 및 에너지 리드", "내적 안정감 및 충전 밸런스"),
        primary_saju_evidence: elementFlow ? [{ kind: "element_flow", description_ko: `오행 흐름: ${elementFlow.direction} (${elementFlow.interaction_code})` }] : [],
        supporting_packet_ids: packets.filter((p) => p.group === "friction" || p.group === "bonding").map((p) => p.packet_id),
        personal_ce_contributions: {},
        llm_synthesis_allowance: {
          allowed_themes: ["주말 50:50", "페이스메이커", "에너지 충전"],
          prohibited_claims: tgExpr.prohibited_claims,
        },
      };
    })(),

    // 8. Partner Crisis Protector
    (() => {
      const canonicalPacket = resolvePartnerCrisisProtectorCanonical({
        hasTrio: trioHits.length > 0,
        hasBranchCombine: branchCombines.length > 0,
        profA,
        profB,
        hasFacts: crossHits.length > 0 || Boolean(facts.element_flow),
        unknownHour,
      });

      if (canonicalPacket.status === "abstained") {
        return {
          lens_id: "partner_crisis_protector",
          domain: "partner",
          user_question: "이직, 질병, 재정 위기 등 인생의 풍파가 닥쳤을 때 서로를 지탱하는 회복 탄력성은?",
          emotional_outcome: "위기 방어 구조 지표 부족 (기본 지지)",
          canonical_meaning_id: "partner_crisis_insufficient_evidence",
          headline_ko: "특정 삼합 방패 구조나 삼합 결속 지표가 확인되지 않습니다.",
          headline_en: "No pronounced trio shield formations found for crisis buffering.",
          narrative_ko: "예상치 못한 위기 상황에서도 차분하게 대화하며 서로를 신뢰하고 격려해 주세요.",
          narrative_en: "Navigate unexpected life crises with steady mutual trust and practical teamwork.",
          confidence: "insufficient" as LensConfidenceLevel,
          tension_level: "low" as LensTensionLevel,
          is_abstaining: true,
          abstain_reason: "insufficient_evidence",
          directionality: { polarity: "symmetric", impact_on_a_ko: "차분한 격려", impact_on_b_ko: "차분한 격려" },
          primary_saju_evidence: [],
          supporting_packet_ids: [],
          personal_ce_contributions: {},
          llm_synthesis_allowance: {
            allowed_themes: ["상호 격려", "침착한 대응"],
            prohibited_claims: ["위기 붕괴", "파산"],
          },
        };
      }

      const tgExpr = resolveGod("정인");
      const isTrio = trioHits.length > 0;

      return {
        lens_id: "partner_crisis_protector",
        domain: "partner",
        user_question: "이직, 질병, 재정 위기 등 인생의 풍파가 닥쳤을 때 서로를 지탱하는 회복 탄력성은?",
        emotional_outcome: "세상이 다 등을 돌려도 내 곁에 이 사람이 있다는 절대적 심리적 보루 확인",
        canonical_meaning_id: canonicalPacket.meaning_id,
        headline_ko: isTrio
          ? `${nameA}와(과) ${nameB}의 삼합(三合) 완성 국면 기반 난관 돌파 최강 연대`
          : `${nameA}와(과) ${nameB}의 지지합 온기 기반 위기 극복 회복 탄력성`,
        headline_en: isTrio
          ? `Unbreakable crisis-buffering fortress anchored in completed trio formation`
          : `Resilient mutual support structure dissolving external adversity through branch harmony`,
        narrative_ko: isTrio
          ? `두 사람의 글자가 모여 거대한 삼합 국을 완성하므로, 외부 위기가 닥칠수록 결속이 더 단단해지는 난세의 동반자입니다. ${tgExpr.selected_summary_ko}`
          : `서로에 대한 든든한 정서적 안전판이 되어주어 외부 스트레스가 침실 문턱을 넘지 못하게 지켜냅니다.`,
        narrative_en: `Trio and branch harmony formations create robust systemic buffers against external adversity.`,
        confidence: canonicalPacket.confidence,
        tension_level: "low",
        directionality: {
          polarity: "symmetric",
          impact_on_a_ko: "위기 시 멘탈 기둥 역할 및 현실적 대안 제시",
          impact_on_b_ko: "정서적 안도감 회복 및 전폭적 신뢰 지지",
        },
        primary_saju_evidence: [
          ...trioHits.map((h) => ({ kind: "trio_structure" as const, description_ko: `삼합/방합 국면: ${h.name}` })),
          ...branchCombines.map((h) => ({ kind: "branch_combine" as const, description_ko: `${h.personA_pillar}×${h.personB_pillar} ${h.detail ?? h.type}` })),
        ],
        supporting_packet_ids: packets.filter((p) => p.group === "bonding").map((p) => p.packet_id),
        personal_ce_contributions: {
          a: profA ? [`resilience:${profA.conflict_decompression}`] : [],
          b: profB ? [`resilience:${profB.conflict_decompression}`] : [],
        },
        llm_synthesis_allowance: {
          allowed_themes: ["난세의 동반자", "철벽 방패", "정서적 안전판"],
          prohibited_claims: tgExpr.prohibited_claims,
        },
      };
    })(),

    // 9. Partner Parenting Alignment
    (() => {
      const canonicalPacket = resolvePartnerParentingCanonical({
        stemCountsA,
        stemCountsB,
        profA,
        profB,
        hasFacts: crossHits.length > 0 || Boolean(facts.element_flow),
        unknownHour,
      });

      if (canonicalPacket.status === "abstained") {
        return {
          lens_id: "partner_parenting_alignment",
          domain: "partner",
          user_question: "자녀 훈육관, 교육열, 그리고 아이 앞에서의 부모 역할 분담 원칙은?",
          emotional_outcome: "양육관 시주 미상 / 지표 부족 (공통 대화 권장)",
          canonical_meaning_id: "partner_parenting_insufficient_evidence",
          headline_ko: "출생시 미상 또는 관성/인성 지표 부족으로 자녀 양육관 분석이 제한됩니다.",
          headline_en: "Birth hour unknown or insufficient ten-god indicators for child rearing dynamic.",
          narrative_ko: "자녀 계획이나 양육 철학에 대해 두 분이 사전에 충분히 대화를 나누며 기준을 맞춰가시기를 권장합니다.",
          narrative_en: "Engage in proactive developmental dialogue regarding child rearing philosophies.",
          confidence: "insufficient" as LensConfidenceLevel,
          tension_level: "low" as LensTensionLevel,
          is_abstaining: true,
          abstain_reason: "birth_time_unknown",
          directionality: { polarity: "symmetric", impact_on_a_ko: "양육 가치관 대화", impact_on_b_ko: "양육 가치관 대화" },
          primary_saju_evidence: [],
          supporting_packet_ids: [],
          personal_ce_contributions: {},
          llm_synthesis_allowance: {
            allowed_themes: ["열린 대화", "양육 기준 합의"],
            prohibited_claims: ["부모 자격 없음", "자녀 불화"],
          },
        };
      }

      const tgExpr = resolveGod("정관");
      const hasOfficerSeal = canonicalPacket.meaning_id === "partner_parenting_complementary_roles";

      return {
        lens_id: "partner_parenting_alignment",
        domain: "partner",
        user_question: "자녀 훈육관, 교육열, 그리고 아이 앞에서의 부모 역할 분담 원칙은?",
        emotional_outcome: "아이 앞에서 부모가 한목소리를 내어 혼란 없이 자녀의 자존감을 지켜주는 팀 양육",
        canonical_meaning_id: canonicalPacket.meaning_id,
        headline_ko: hasOfficerSeal
          ? `${nameA}와(과) ${nameB}의 엄부자모(훈육-수용) 역할 조화와 원팀 양육 룰`
          : `${nameA}와(과) ${nameB}의 친구 같은 자율 존중형 현대적 양육 파트너십`,
        headline_en: hasOfficerSeal
          ? `Harmonious disciplinary and nurturing roles presenting a unified parental team`
          : `Autonomy-respecting and democratic modern parenting partnership`,
        narrative_ko: hasOfficerSeal
          ? `관성과 인성의 균형으로 한쪽이 단호한 규칙을 세우면 다른 쪽이 따뜻하게 보듬는 역할 분담이 완벽하게 작동합니다. ${tgExpr.selected_summary_ko}`
          : `자녀의 개별적 소질과 자율성을 최대한 존중하며 친구처럼 소통하는 양육 스타일을 공유합니다.`,
        narrative_en: `Complementary parenting roles establish secure boundaries while preserving emotional warmth.`,
        confidence: canonicalPacket.confidence,
        tension_level: "low",
        directionality: {
          polarity: "symmetric",
          impact_on_a_ko: "훈육 원칙 일관성 유지 및 아이 앞 비난 금지",
          impact_on_b_ko: "정서적 공감대 형성 및 양육 방침 일치",
        },
        primary_saju_evidence: [
          { kind: "ten_god_matrix", description_ko: `관성/인성 분포: 관성(${stemCountsA["정관"] ?? 0 + (stemCountsA["편관"] ?? 0)} vs ${stemCountsB["정관"] ?? 0 + (stemCountsB["편관"] ?? 0)}), 인성(${stemCountsA["정인"] ?? 0 + (stemCountsA["편인"] ?? 0)} vs ${stemCountsB["정인"] ?? 0 + (stemCountsB["편인"] ?? 0)})` },
        ],
        supporting_packet_ids: packets.filter((p) => p.group === "structure").map((p) => p.packet_id),
        personal_ce_contributions: {},
        llm_synthesis_allowance: {
          allowed_themes: ["원팀 양육", "아이 앞 한목소리", "자율 존중"],
          prohibited_claims: tgExpr.prohibited_claims,
        },
      };
    })(),

    // 10. Partner Longterm Vision
    (() => {
      const canonicalPacket = resolvePartnerLongtermVisionCanonical({
        hasTrio: trioHits.length > 0,
        yongsinAlignment: yongsin,
        hasStemCombine: stemCombines.length > 0,
        hasFacts: crossHits.length > 0 || Boolean(facts.element_flow) || Boolean(facts.yongsin_alignment),
        unknownHour,
      });

      if (canonicalPacket.status === "abstained") {
        return {
          lens_id: "partner_longterm_vision",
          domain: "partner",
          user_question: "10년 후, 20년 후 우리가 그리는 노후와 인생의 종착역은 같은 곳을 향하고 있을까?",
          emotional_outcome: "장기 비전 결속 지표 부족 (중립 확인)",
          canonical_meaning_id: "partner_vision_insufficient_evidence",
          headline_ko: "10년 이상 장기 비전 결속에 대한 특이 사주 지표가 확인되지 않습니다.",
          headline_en: "No pronounced structural anchors found for multi-decade vision convergence.",
          narrative_ko: "서로가 바라는 인생의 중장기 목표를 정기적으로 공유하며 로드맵을 함께 그려가세요.",
          narrative_en: "Continuously share evolving personal life aspirations to co-create a joint roadmap.",
          confidence: "insufficient" as LensConfidenceLevel,
          tension_level: "low" as LensTensionLevel,
          is_abstaining: true,
          abstain_reason: "insufficient_evidence",
          directionality: { polarity: "symmetric", impact_on_a_ko: "중장기 목표 공유", impact_on_b_ko: "중장기 목표 공유" },
          primary_saju_evidence: [],
          supporting_packet_ids: [],
          personal_ce_contributions: {},
          llm_synthesis_allowance: {
            allowed_themes: ["로드맵 공유", "인생 목표"],
            prohibited_claims: ["이별 운명", "비전 결렬"],
          },
        };
      }

      const tgExpr = resolveGod("비견");
      const isTrio = trioHits.length > 0;

      return {
        lens_id: "partner_longterm_vision",
        domain: "partner",
        user_question: "10년 후, 20년 후 우리가 그리는 노후와 인생의 종착역은 같은 곳을 향하고 있을까?",
        emotional_outcome: "시간이 흐를수록 단순한 부부를 넘어 인생이라는 위대한 여정을 함께 완주하는 소울메이트 확인",
        canonical_meaning_id: canonicalPacket.meaning_id,
        headline_ko: isTrio
          ? `${nameA}와(과) ${nameB}의 거대한 삶의 방향성이 하나로 융합되는 평생의 지향점`
          : `${nameA}와(과) ${nameB}의 서로의 개별 꿈을 나란히 응원하는 평행선 동행`,
        headline_en: isTrio
          ? `A unified multi-decade life horizon converging into a monumental joint destiny`
          : `A respectful parallel journey celebrating and bolstering each other's distinct lifetime dreams`,
        narrative_ko: isTrio
          ? `삼합의 장기적 궤적이 맞물려 있어 인생 후반부로 갈수록 자산, 가치관, 영적 성장이 하나의 지점으로 수렴합니다. ${tgExpr.selected_summary_ko}`
          : `각자의 꿈과 커리어를 존중하되 나란히 발맞추어 걷는 건강한 평행선 동반자로 오랜 시간 함께합니다.`,
        narrative_en: `Long-term architectural alignment secures shared multi-decade legacy compounding.`,
        confidence: canonicalPacket.confidence,
        tension_level: "low",
        directionality: {
          polarity: "symmetric",
          impact_on_a_ko: "공동의 10년 로드맵 구축 및 평생 신뢰",
          impact_on_b_ko: "공동의 노후 비전 설계 및 상호 지지",
        },
        primary_saju_evidence: [
          ...trioHits.map((h) => ({ kind: "trio_structure" as const, description_ko: `삼합 비전: ${h.name}` })),
          ...(yongsin ? [{ kind: "yongsin_harmony" as const, description_ko: `용신 조화: ${yongsin.relation}` }] : []),
        ],
        supporting_packet_ids: packets.filter((p) => p.group === "bonding" || p.group === "energy").map((p) => p.packet_id),
        personal_ce_contributions: {},
        llm_synthesis_allowance: {
          allowed_themes: ["소울메이트", "평생의 지향점", "10년 로드맵"],
          prohibited_claims: tgExpr.prohibited_claims,
        },
      };
    })(),
  ];

  return evaluations;
}
