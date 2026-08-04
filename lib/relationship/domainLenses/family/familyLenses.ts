/**
 * Family (Parent-Child) Domain Lenses
 *
 * Implements 8 canonical Family Lenses grounded in Pair CE, Personal CE,
 * Ten-God Matrix runtime resolutions, and authoritative V1 Gold canonical adapters.
 */

import type { PairContextPacket } from "@/lib/personCore/pairContextEngine/types";
import type { PairSajuFacts, PairElementFlowFact } from "@/lib/personCore/pairSaju";
import type { PersonalContextEngineOutput } from "@/lib/personCore/personalContextEngine/types";
import type {
  DomainLensEvaluation,
  FamilyLensId,
  LensConfidenceLevel,
  LensTensionLevel,
  LensDirectionalityEvaluation,
} from "../types";
import { resolveTenGodDomainExpression, type TenGodCode } from "../tenGodLensMatrix";
import {
  resolveFamilyCoreDynamicCanonical,
  resolveFamilyDisciplineCanonical,
  resolveFamilyDistanceCanonical,
  resolveFamilyHiddenNeedsCanonical,
  resolveFamilyPraiseCanonical,
  resolveFamilyHouseholdRolesCanonical,
  resolveFamilySafeBoundaryCanonical,
  resolveFamilyCrisisRecoveryCanonical,
} from "@/lib/relationship/familyParent/familyCanonicalAdapters";

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

export function evaluateFamilyLenses(params: {
  facts: PairSajuFacts;
  packets: PairContextPacket[];
  personalCeA?: PersonalContextEngineOutput;
  personalCeB?: PersonalContextEngineOutput;
  partyNames?: { a: string; b: string };
  psychScores?: Record<string, number>;
}): DomainLensEvaluation<FamilyLensId>[] {
  const { facts, packets, personalCeA, personalCeB, partyNames } = params;
  const nameA = partyNames?.a ?? "부모(A)";
  const nameB = partyNames?.b ?? "자녀(B)";
  const unknownHour = facts.birth_time_unknown_a || facts.birth_time_unknown_b;

  const stemCombines = facts.cross_hits.filter((h) => h.type === "천간합");
  const stemClashes = facts.cross_hits.filter((h) => h.type === "천간충");
  const branchCombines = facts.cross_hits.filter((h) => ["육합", "삼합", "반합"].includes(h.type));
  const branchClashes = facts.cross_hits.filter((h) => ["충", "형", "파", "해"].includes(h.type));
  const wonjinHits = facts.cross_hits.filter((h) => ["원진", "귀문"].includes(h.type));
  const gongmangHits = facts.cross_hits.filter((h) => h.type === "공망");
  const elementFlow = facts.element_flow;

  const profA = personalCeA?.aggregates?.relational_profile;
  const profB = personalCeB?.aggregates?.relational_profile;

  const resolveGod = (god: TenGodCode, isTension = false) =>
    resolveTenGodDomainExpression({ god, domain: "family", isTension });

  const evaluations: DomainLensEvaluation<FamilyLensId>[] = [
    // 1. Family Core Dynamic
    (() => {
      const canonicalPacket = resolveFamilyCoreDynamicCanonical({
        hasStemCombine: stemCombines.length > 0,
        hasBranchCombine: branchCombines.length > 0,
        elementFlow,
        profA,
        profB,
        hasFacts: facts.cross_hits.length > 0 || Boolean(facts.element_flow),
        unknownHour,
      });

      if (canonicalPacket.status === "abstained") {
        return {
          lens_id: "family_core_dynamic",
          domain: "family",
          user_question: "부모와 자녀 사이에 흐르는 본질적인 애착 관계와 기본 정서는?",
          emotional_outcome: "가족 애착 지표 부족 (중립 확인)",
          canonical_meaning_id: "family_core_insufficient_evidence",
          headline_ko: "부모-자녀 간 핵심 애착에 대한 사주 지표가 부족합니다.",
          headline_en: "Insufficient astrological indicators for core family attachment dynamic.",
          narrative_ko: "특정 애착 패턴을 단정하지 않고 일상적인 정서 교감과 열린 대화를 권장합니다.",
          narrative_en: "No definitive attachment combines found; foster open emotional communication.",
          confidence: "insufficient" as LensConfidenceLevel,
          tension_level: "low" as LensTensionLevel,
          is_abstaining: true,
          abstain_reason: "insufficient_evidence",
          directionality: { polarity: "symmetric", impact_on_a_ko: "중립적 소통", impact_on_b_ko: "중립적 소통" },
          primary_saju_evidence: [],
          supporting_packet_ids: [],
          personal_ce_contributions: {},
          llm_synthesis_allowance: {
            allowed_themes: ["정서 교감", "열린 소통"],
            prohibited_claims: ["애착 손상", "부모 실격"],
          },
        };
      }

      const tgExpr = resolveGod("정인");
      const isWarmNurture = canonicalPacket.meaning_id === "family_core_warm_nurture";

      return {
        lens_id: "family_core_dynamic",
        domain: "family",
        user_question: "부모와 자녀 사이에 흐르는 본질적인 애착 관계와 기본 정서는?",
        emotional_outcome: "서로에게 가장 든든한 정서적 안전기지가 되어주는 따뜻한 부모-자녀 유대 확인",
        canonical_meaning_id: canonicalPacket.meaning_id,
        headline_ko: isWarmNurture
          ? `${nameA}와(과) ${nameB}의 천간합 기반 깊은 정서적 유대와 신뢰 안전기지`
          : `${nameA}와(과) ${nameB}의 건강한 독립성을 존중하는 개별적 성장 유대`,
        headline_en: isWarmNurture
          ? `Deep emotional attachment and secure psychological haven rooted in stem harmony`
          : `Healthy individuation and mutual growth bond respecting developmental autonomy`,
        narrative_ko: isWarmNurture
          ? `부모의 헌신과 자녀의 수용이 아름답게 맞물려 세상에서 가장 든든한 안전기지가 되어 줍니다. ${tgExpr.selected_summary_ko}`
          : `서로의 고유한 성향을 인정하며 건강한 독립적 인격체로 성장하도록 지탱해 주는 관계입니다.`,
        narrative_en: `Evidence indicates supportive generational attachment.`,
        confidence: canonicalPacket.confidence,
        tension_level: "low",
        directionality: deriveDirectionality(elementFlow, "안정적인 울타리와 무조건적 지지", "정서적 안도감과 자존감 형성"),
        primary_saju_evidence: [
          ...stemCombines.map((h) => ({ kind: "stem_combine" as const, description_ko: `${h.personA_pillar}×${h.personB_pillar} ${h.detail ?? h.type}` })),
          ...branchCombines.map((h) => ({ kind: "branch_combine" as const, description_ko: `${h.personA_pillar}×${h.personB_pillar} ${h.detail ?? h.type}` })),
        ],
        supporting_packet_ids: packets.filter((p) => p.group === "bonding").map((p) => p.packet_id),
        personal_ce_contributions: {
          a: profA ? [`expression_style:${profA.expression_style}`] : [],
          b: profB ? [`expression_style:${profB.expression_style}`] : [],
        },
        llm_synthesis_allowance: {
          allowed_themes: ["안전기지", "정서적 유대", "독립적 존중"],
          prohibited_claims: tgExpr.prohibited_claims,
        },
      };
    })(),

    // 2. Family Discipline Friction
    (() => {
      const canonicalPacket = resolveFamilyDisciplineCanonical({
        hasStemClash: stemClashes.length > 0,
        hasBranchClash: branchClashes.length > 0,
        elementFlow,
        profA,
        profB,
        hasFacts: facts.cross_hits.length > 0 || Boolean(facts.element_flow),
        unknownHour,
      });

      if (canonicalPacket.status === "abstained") {
        return {
          lens_id: "family_discipline_friction",
          domain: "family",
          user_question: "부모의 훈육과 기대가 자녀에게 잔소리나 압박으로 느껴질 때의 충돌은?",
          emotional_outcome: "훈육 충돌 지표 부족 (기본 온화)",
          canonical_meaning_id: "family_discipline_insufficient_evidence",
          headline_ko: "훈육 과정에서 두드러진 충돌 지표가 확인되지 않습니다.",
          headline_en: "No pronounced friction indicators found for parental discipline.",
          narrative_ko: "부모의 지도가 자녀에게 자연스럽게 전달되는 편안한 소통 환경입니다.",
          narrative_en: "Parental guidance flows naturally without sharp conversational defensiveness.",
          confidence: "insufficient" as LensConfidenceLevel,
          tension_level: "low" as LensTensionLevel,
          is_abstaining: true,
          abstain_reason: "insufficient_evidence",
          directionality: { polarity: "symmetric", impact_on_a_ko: "온화한 지도", impact_on_b_ko: "자연스러운 수용" },
          primary_saju_evidence: [],
          supporting_packet_ids: [],
          personal_ce_contributions: {},
          llm_synthesis_allowance: {
            allowed_themes: ["온화한 지도", "원활한 소통"],
            prohibited_claims: ["가족 갈등", "반항아"],
          },
        };
      }

      const tgExpr = resolveGod("편관", true);
      const isStemClash = stemClashes.length > 0;
      const isBranchClash = branchClashes.length > 0;

      return {
        lens_id: "family_discipline_friction",
        domain: "family",
        user_question: "부모의 훈육과 기대가 자녀에게 잔소리나 압박으로 느껴질 때의 충돌은?",
        emotional_outcome: "훈육이 통제나 비난으로 변질되지 않고 자녀의 자존감을 살리는 지혜로운 대화법 정착",
        canonical_meaning_id: canonicalPacket.meaning_id,
        headline_ko: isStemClash
          ? `${nameA}의 직설적 훈육 톤 완화와 ${nameB}의 자존감 보호 대화법`
          : isBranchClash
            ? `${nameA}와(과) ${nameB}의 감정 격화 시 물리적 쿨링 스페이스 확보`
            : `${nameA}와(과) ${nameB}의 성향을 거스르지 않는 자연스럽고 온화한 지도`,
        headline_en: isStemClash
          ? `Softening direct parental guidance tones to protect child's self-esteem and prevent rebellion`
          : isBranchClash
            ? `Securing physical cooling space during heated disciplinary moments`
            : `Gentle and organic developmental guidance respecting natural temperament`,
        narrative_ko: isStemClash
          ? `천간충의 언어적 직설성으로 인해 직접적인 지시는 자녀의 방어기제를 자극하기 쉽습니다. ${tgExpr.selected_summary_ko}`
          : isBranchClash
            ? `지지충의 감정적 충돌을 방지하기 위해 훈육 중 감정이 격해지면 즉각 개별 공간으로 분리하는 것이 효과적입니다.`
            : `부모의 훈육이 자녀의 기질과 크게 충돌하지 않아 온화한 방식으로도 충분한 지도가 가능합니다.`,
        narrative_en: `Structured communication buffers protect developmental self-esteem during discipline.`,
        confidence: canonicalPacket.confidence,
        tension_level: canonicalPacket.status === "mixed" ? "moderate" : "low",
        directionality: {
          polarity: "a_to_b",
          lead_party: "A",
          impact_on_a_ko: "명령조 대신 질문형 대화로 전환",
          impact_on_b_ko: "압박감 해소 및 자율적 행동 수정",
        },
        primary_saju_evidence: [
          ...stemClashes.map((h) => ({ kind: "stem_clash" as const, description_ko: `${h.personA_pillar}×${h.personB_pillar} ${h.detail ?? h.type}` })),
          ...branchClashes.map((h) => ({ kind: "branch_clash" as const, description_ko: `${h.personA_pillar}×${h.personB_pillar} ${h.detail ?? h.type}` })),
        ],
        supporting_packet_ids: packets.filter((p) => p.group === "friction").map((p) => p.packet_id),
        personal_ce_contributions: {
          b: profB ? [`conflict_decompression:${profB.conflict_decompression}`] : [],
        },
        llm_synthesis_allowance: {
          allowed_themes: ["질문형 대화", "쿠션어", "비교 금지"],
          prohibited_claims: tgExpr.prohibited_claims,
        },
      };
    })(),

    // 3. Family Emotional Distance
    (() => {
      const canonicalPacket = resolveFamilyDistanceCanonical({
        hasWonjin: wonjinHits.length > 0,
        hasGongmang: gongmangHits.length > 0,
        profA,
        profB,
        hasFacts: facts.cross_hits.length > 0 || Boolean(facts.element_flow),
        unknownHour,
      });

      if (canonicalPacket.status === "abstained") {
        return {
          lens_id: "family_emotional_distance",
          domain: "family",
          user_question: "자녀의 독립적인 사생활과 부모의 애정 어린 관심 사이의 적정 거리는?",
          emotional_outcome: "거리 조절 지표 부족 (자연스러운 밀착)",
          canonical_meaning_id: "family_distance_insufficient_evidence",
          headline_ko: "부모-자녀 간 물리적·심리적 거리감에 대한 특이 지표가 없습니다.",
          headline_en: "No pronounced distance tension found; organic family closeness maintained.",
          narrative_ko: "자연스러운 애정 표현과 적절한 관심이 균형을 이루고 있는 건강한 관계입니다.",
          narrative_en: "Balanced family intimacy without excessive enmeshment or cold detachment.",
          confidence: "insufficient" as LensConfidenceLevel,
          tension_level: "low" as LensTensionLevel,
          is_abstaining: true,
          abstain_reason: "insufficient_evidence",
          directionality: { polarity: "symmetric", impact_on_a_ko: "따뜻한 관심", impact_on_b_ko: "편안한 소통" },
          primary_saju_evidence: [],
          supporting_packet_ids: [],
          personal_ce_contributions: {},
          llm_synthesis_allowance: {
            allowed_themes: ["자연스러운 친밀감", "건강한 관심"],
            prohibited_claims: ["과잉 간섭", "단절"],
          },
        };
      }

      const tgExpr = resolveGod("편인");
      const isWonjin = wonjinHits.length > 0;

      return {
        lens_id: "family_emotional_distance",
        domain: "family",
        user_question: "자녀의 독립적인 사생활과 부모의 애정 어린 관심 사이의 적정 거리는?",
        emotional_outcome: "과잉 밀착으로 인한 숨 막힘 없이 각자의 방과 시간을 존중하는 건강한 거리감 유지",
        canonical_meaning_id: canonicalPacket.meaning_id,
        headline_ko: isWonjin
          ? `${nameB}의 사적 성역(동굴) 보장과 ${nameA}의 한 걸음 물러선 신뢰 지원`
          : `${nameA}와(과) ${nameB}의 가벼운 부재감을 채워주는 정기적 안부 루틴`,
        headline_en: isWonjin
          ? `Guaranteed private developmental sanctuary for child paired with step-back parental trust`
          : `Healthy contact rhythms bridging generational physical and psychological space`,
        narrative_ko: isWonjin
          ? `원진/귀문의 민감성으로 인해 문을 닫고 혼자 있는 자녀의 시간을 존중하는 것이 관계를 지키는 비결입니다. ${tgExpr.selected_summary_ko}`
          : `공망의 결핍감을 보완하기 위해 일주일에 한 번 맛있는 식사를 나누는 가벼운 루틴이 큰 힘이 됩니다.`,
        narrative_en: `Respecting developmental private space prevents teenage rebellion and emotional withdrawal.`,
        confidence: canonicalPacket.confidence,
        tension_level: canonicalPacket.status === "mixed" ? "moderate" : "low",
        directionality: {
          polarity: "symmetric",
          impact_on_a_ko: "방문 노크 준수 및 일기/스마트폰 사생활 불침범",
          impact_on_b_ko: "식사 시간 참여 및 정기 안부 표현",
        },
        primary_saju_evidence: [
          ...wonjinHits.map((h) => ({ kind: "wonjin" as const, description_ko: `${h.personA_pillar}×${h.personB_pillar} ${h.detail ?? h.type}` })),
          ...gongmangHits.map((h) => ({ kind: "gongmang" as const, description_ko: `공망 결속: ${h.detail}` })),
        ],
        supporting_packet_ids: packets.filter((p) => p.fact_kind === "wonjin_guimun").map((p) => p.packet_id),
        personal_ce_contributions: {
          b: profB ? [`solitude_autonomy:${profB.solitude_autonomy}`] : [],
        },
        llm_synthesis_allowance: {
          allowed_themes: ["동굴 시간 보장", "노크 에티켓", "건강한 거리"],
          prohibited_claims: tgExpr.prohibited_claims,
        },
      };
    })(),

    // 4. Family Hidden Needs
    (() => {
      const canonicalPacket = resolveFamilyHiddenNeedsCanonical({
        hasStemCombine: stemCombines.length > 0,
        elementFlow,
        profA,
        profB,
        hasFacts: facts.cross_hits.length > 0 || Boolean(facts.element_flow),
        unknownHour,
      });

      if (canonicalPacket.status === "abstained") {
        return {
          lens_id: "family_hidden_needs",
          domain: "family",
          user_question: "자녀가 부모에게 겉으로 툴툴거리면서도 속으로 가장 바라는 인정의 형태는?",
          emotional_outcome: "숨은 욕구 지표 부족 (기본 소통)",
          canonical_meaning_id: "family_needs_insufficient_evidence",
          headline_ko: "자녀의 숨은 인정 욕구에 대한 특이 비대칭 지표가 확인되지 않습니다.",
          headline_en: "No pronounced asymmetric indicators found for unexpressed generational needs.",
          narrative_ko: "일상적인 격려와 편안한 지지를 통해 자녀의 자존감을 자연스럽게 북돋워 주세요.",
          narrative_en: "Maintain unconditional developmental encouragement in everyday interactions.",
          confidence: "insufficient" as LensConfidenceLevel,
          tension_level: "low" as LensTensionLevel,
          is_abstaining: true,
          abstain_reason: "insufficient_evidence",
          directionality: { polarity: "symmetric", impact_on_a_ko: "따뜻한 격려", impact_on_b_ko: "편안한 수용" },
          primary_saju_evidence: [],
          supporting_packet_ids: [],
          personal_ce_contributions: {},
          llm_synthesis_allowance: {
            allowed_themes: ["따뜻한 격려", "일상적 지지"],
            prohibited_claims: ["애정 결핍", "냉담"],
          },
        };
      }

      const tgExpr = resolveGod("식신");
      const isStemCombine = stemCombines.length > 0;

      return {
        lens_id: "family_hidden_needs",
        domain: "family",
        user_question: "자녀가 부모에게 겉으로 툴툴거리면서도 속으로 가장 바라는 인정의 형태는?",
        emotional_outcome: "부모의 칭찬 한마디에 자존감이 채워지며 스스로 동기부여를 얻는 긍정적 순환",
        canonical_meaning_id: canonicalPacket.meaning_id,
        headline_ko: isStemCombine
          ? `${nameB}이(가) 갈망하는 ${nameA}의 조건 없는 존재 가치 인정`
          : `${nameB}의 선택과 판단을 믿고 지지해 주는 자율성 인정`,
        headline_en: isStemCombine
          ? `Unconditional validation of inherent worth that child deeply craves from parent`
          : `Affirming autonomous decision-making to foster mature accountability`,
        narrative_ko: isStemCombine
          ? `천간합의 정서적 일치감으로 인해 '결과'보다 '존재 자체'를 인정해 주는 부모의 따뜻한 눈빛을 가장 필요로 합니다. ${tgExpr.selected_summary_ko}`
          : `부모가 자녀의 선택을 믿고 기다려줄 때 자녀는 가장 큰 안정감과 책임감을 배웁니다.`,
        narrative_en: `Validating developmental agency fosters intrinsic motivation and self-efficacy.`,
        confidence: canonicalPacket.confidence,
        tension_level: "low",
        directionality: {
          polarity: "a_to_b",
          lead_party: "A",
          impact_on_a_ko: "'네가 있어서 자랑스럽다'는 존재적 지지 표현",
          impact_on_b_ko: "자존감 충전 및 부모에 대한 깊은 신뢰",
        },
        primary_saju_evidence: stemCombines.map((h) => ({ kind: "stem_combine" as const, description_ko: `${h.personA_pillar}×${h.personB_pillar} ${h.detail ?? h.type}` })),
        supporting_packet_ids: packets.filter((p) => p.group === "bonding").map((p) => p.packet_id),
        personal_ce_contributions: {
          b: profB ? [`support_giving_style:${profB.support_giving_style}`] : [],
        },
        llm_synthesis_allowance: {
          allowed_themes: ["존재 자체 인정", "무조건적 사랑", "기다림"],
          prohibited_claims: tgExpr.prohibited_claims,
        },
      };
    })(),

    // 5. Family Praise Trigger
    (() => {
      const canonicalPacket = resolveFamilyPraiseCanonical({
        hasBranchCombine: branchCombines.length > 0,
        profA,
        profB,
        hasFacts: facts.cross_hits.length > 0 || Boolean(facts.element_flow),
        unknownHour,
      });

      if (canonicalPacket.status === "abstained") {
        return {
          lens_id: "family_praise_trigger",
          domain: "family",
          user_question: "자녀의 잠재력을 폭발시키고 기를 살려주는 가장 효과적인 칭찬 방식은?",
          emotional_outcome: "칭찬 방식 지표 부족 (기본 칭찬)",
          canonical_meaning_id: "family_praise_insufficient_evidence",
          headline_ko: "자녀 맞춤형 칭찬 코드에 대한 특이 결속 지표가 확인되지 않습니다.",
          headline_en: "No pronounced combine anchors found for tailored developmental praise triggers.",
          narrative_ko: "과장되지 않은 솔직한 칭찬과 구체적인 격려를 건네주시면 충분합니다.",
          narrative_en: "Maintain sincere and concrete positive reinforcement in everyday life.",
          confidence: "insufficient" as LensConfidenceLevel,
          tension_level: "low" as LensTensionLevel,
          is_abstaining: true,
          abstain_reason: "insufficient_evidence",
          directionality: { polarity: "symmetric", impact_on_a_ko: "구체적 칭찬", impact_on_b_ko: "동기 부여" },
          primary_saju_evidence: [],
          supporting_packet_ids: [],
          personal_ce_contributions: {},
          llm_synthesis_allowance: {
            allowed_themes: ["구체적 칭찬", "성실한 격려"],
            prohibited_claims: ["결과 비하", "비교"],
          },
        };
      }

      const tgExpr = resolveGod("상관");
      const hasCombine = branchCombines.length > 0;

      return {
        lens_id: "family_praise_trigger",
        domain: "family",
        user_question: "자녀의 잠재력을 폭발시키고 기를 살려주는 가장 효과적인 칭찬 방식은?",
        emotional_outcome: "막연한 칭찬이 아닌 구체적인 과정 인정으로 자녀의 날개를 달아주는 칭찬 공식",
        canonical_meaning_id: canonicalPacket.meaning_id,
        headline_ko: hasCombine
          ? `${nameA}의 디테일한 노력 과정 맞춤형 칭찬과 ${nameB}의 성취 동기 폭발`
          : `${nameA}의 결과보다 끈기를 북돋워 주는 진정성 있는 응원`,
        headline_en: hasCombine
          ? `Tailored praise celebrating minute effort processes that unlock massive child motivation`
          : `Sincere parental encouragement reinforcing resilience and grit over pure results`,
        narrative_ko: hasCombine
          ? `지지합의 감수성 조화로 인해 '잘했다'는 한마디보다 '이 디테일을 고민한 게 대단하다'는 과정 칭찬이 아이를 춤추게 합니다. ${tgExpr.selected_summary_ko}`
          : `결과가 다소 아쉽더라도 끝까지 포기하지 않고 해낸 끈기를 칭찬할 때 자녀는 가장 크게 성장합니다.`,
        narrative_en: `Process-oriented praise reinforces a growth mindset and developmental resilience.`,
        confidence: canonicalPacket.confidence,
        tension_level: "low",
        directionality: {
          polarity: "a_to_b",
          lead_party: "A",
          impact_on_a_ko: "구체적인 관찰 기반의 과정 칭찬",
          impact_on_b_ko: "성취 동기 고취 및 자발적 몰입",
        },
        primary_saju_evidence: branchCombines.map((h) => ({ kind: "branch_combine" as const, description_ko: `${h.personA_pillar}×${h.personB_pillar} ${h.detail ?? h.type}` })),
        supporting_packet_ids: packets.filter((p) => p.group === "bonding").map((p) => p.packet_id),
        personal_ce_contributions: {},
        llm_synthesis_allowance: {
          allowed_themes: ["과정 중심 칭찬", "디테일 관찰", "성장 마인드셋"],
          prohibited_claims: tgExpr.prohibited_claims,
        },
      };
    })(),

    // 6. Family Household Roles
    (() => {
      const canonicalPacket = resolveFamilyHouseholdRolesCanonical({
        hasBranchCombine: branchCombines.length > 0,
        hasStemCombine: stemCombines.length > 0,
        elementFlow,
        profA,
        profB,
        hasFacts: facts.cross_hits.length > 0 || Boolean(facts.element_flow),
        unknownHour,
      });

      if (canonicalPacket.status === "abstained") {
        return {
          lens_id: "family_household_roles",
          domain: "family",
          user_question: "집안일, 심부름, 용돈 관리 등 가정 내 책임과 역할 분담의 룰은?",
          emotional_outcome: "역할 분담 지표 부족 (기본 협력)",
          canonical_meaning_id: "family_roles_insufficient_evidence",
          headline_ko: "가정 내 역할 분담에 대한 특이 지표가 확인되지 않습니다.",
          headline_en: "No pronounced indicators found for household chore allocation.",
          narrative_ko: "가족 구성원으로서 작은 역할부터 자연스럽게 나누며 협동심을 길러주세요.",
          narrative_en: "Distribute everyday household responsibilities flexibly and collaboratively.",
          confidence: "insufficient" as LensConfidenceLevel,
          tension_level: "low" as LensTensionLevel,
          is_abstaining: true,
          abstain_reason: "insufficient_evidence",
          directionality: { polarity: "symmetric", impact_on_a_ko: "자연스러운 분담", impact_on_b_ko: "자연스러운 분담" },
          primary_saju_evidence: [],
          supporting_packet_ids: [],
          personal_ce_contributions: {},
          llm_synthesis_allowance: {
            allowed_themes: ["자연스러운 분담", "협동심"],
            prohibited_claims: ["노동 착취", "방임"],
          },
        };
      }

      const tgExpr = resolveGod("정재");
      const hasCombine = branchCombines.length > 0 || stemCombines.length > 0;

      return {
        lens_id: "family_household_roles",
        domain: "family",
        user_question: "집안일, 심부름, 용돈 관리 등 가정 내 책임과 역할 분담의 룰은?",
        emotional_outcome: "일방적 심부름이 아닌 주체적인 책임감과 경제 관념을 심어주는 가족 룰 수립",
        canonical_meaning_id: canonicalPacket.meaning_id,
        headline_ko: hasCombine
          ? `${nameA}와(과) ${nameB}의 자발적 역할 분담과 투명한 경제 관념 교육 룰`
          : `${nameA}와(과) ${nameB}의 명확한 구역 분담과 보상 체계 기반 협동`,
        headline_en: hasCombine
          ? `Autonomous household contribution and transparent financial literacy rules built on harmony`
          : `Clear zone division and milestone incentives fostering collaborative family order`,
        narrative_ko: hasCombine
          ? `합의 조화로 인해 자녀가 집안의 작은 일에 기여하며 스스로 가치를 느끼도록 유도하는 것이 매우 효과적입니다. ${tgExpr.selected_summary_ko}`
          : `자신의 방 정리나 분리수거 등 명확한 1인 1역할을 지정해 주었을 때 가장 책임감 있게 완수합니다.`,
        narrative_en: `Structured household routines cultivate early developmental autonomy.`,
        confidence: canonicalPacket.confidence,
        tension_level: "low",
        directionality: {
          polarity: "symmetric",
          impact_on_a_ko: "자녀 전용 역할 존중 및 정기 용돈 원칙 준수",
          impact_on_b_ko: "자기 구역 정리 책임 완수 및 용돈 기입장 기록",
        },
        primary_saju_evidence: [
          ...branchCombines.map((h) => ({ kind: "branch_combine" as const, description_ko: `${h.personA_pillar}×${h.personB_pillar} ${h.detail ?? h.type}` })),
          ...stemCombines.map((h) => ({ kind: "stem_combine" as const, description_ko: `${h.personA_pillar}×${h.personB_pillar} ${h.detail ?? h.type}` })),
        ],
        supporting_packet_ids: packets.filter((p) => p.group === "bonding" || p.group === "structure").map((p) => p.packet_id),
        personal_ce_contributions: {
          b: profB ? [`structure_spontaneity:${profB.structure_spontaneity}`] : [],
        },
        llm_synthesis_allowance: {
          allowed_themes: ["1인 1역할", "경제 관념", "자발적 기여"],
          prohibited_claims: tgExpr.prohibited_claims,
        },
      };
    })(),

    // 7. Family Safe Boundary
    (() => {
      const canonicalPacket = resolveFamilySafeBoundaryCanonical({
        hasWonjin: wonjinHits.length > 0,
        hasClash: stemClashes.length > 0 || branchClashes.length > 0,
        profA,
        profB,
        hasFacts: facts.cross_hits.length > 0 || Boolean(facts.element_flow),
        unknownHour,
      });

      if (canonicalPacket.status === "abstained") {
        return {
          lens_id: "family_safe_boundary",
          domain: "family",
          user_question: "자녀가 사춘기나 반항기에 접어들었을 때 선을 넘지 않는 안전한 한계선은?",
          emotional_outcome: "경계선 긴장 지표 부족 (안정적 수용)",
          canonical_meaning_id: "family_boundary_insufficient_evidence",
          headline_ko: "사춘기 반항이나 경계선 침범에 대한 특이 긴장 지표가 없습니다.",
          headline_en: "No pronounced boundary clash found; developmental transitions flow calmly.",
          narrative_ko: "자녀의 성장에 따른 자연스러운 변화를 열린 마음으로 수용해 주시면 충분합니다.",
          narrative_en: "Support adolescent growth transitions with consistent emotional presence.",
          confidence: "insufficient" as LensConfidenceLevel,
          tension_level: "low" as LensTensionLevel,
          is_abstaining: true,
          abstain_reason: "insufficient_evidence",
          directionality: { polarity: "symmetric", impact_on_a_ko: "따뜻한 수용", impact_on_b_ko: "편안한 성장" },
          primary_saju_evidence: [],
          supporting_packet_ids: [],
          personal_ce_contributions: {},
          llm_synthesis_allowance: {
            allowed_themes: ["따뜻한 수용", "자연스러운 성장"],
            prohibited_claims: ["비행", "통제 불능"],
          },
        };
      }

      const tgExpr = resolveGod("정관");
      const isWonjin = wonjinHits.length > 0;

      return {
        lens_id: "family_safe_boundary",
        domain: "family",
        user_question: "자녀가 사춘기나 반항기에 접어들었을 때 선을 넘지 않는 안전한 한계선은?",
        emotional_outcome: "감정적 폭언이나 가출 없이 건강하게 자아를 형성하고 지나가는 안전 울타리",
        canonical_meaning_id: canonicalPacket.meaning_id,
        headline_ko: isWonjin
          ? `${nameA}의 절대적 비난 금지 원칙과 ${nameB}의 감정 폭발 안전 브레이크`
          : `${nameA}와(과) ${nameB}의 상호 약속 기반 귀가 시간 및 디지털 기기 룰`,
        headline_en: isWonjin
          ? `Zero-blame baseline protocols and emotional safety brakes navigating stormy adolescent phases`
          : `Clear mutual boundaries for curfew and digital screen time preserving household peace`,
        narrative_ko: isWonjin
          ? `원진의 예민한 시기에는 사소한 잔소리도 자녀에게는 거대한 비난으로 느껴지므로 '너를 사랑하지만 이 행동은 위험하다'는 단호하되 따뜻한 경계선이 필요합니다. ${tgExpr.selected_summary_ko}`
          : `사전에 합의된 명확한 룰이 있을 때 자녀는 방황하지 않고 안전한 울타리 안에서 성장합니다.`,
        narrative_en: `Clear boundaries combined with unconditional love prevent destructive adolescent risk-taking.`,
        confidence: canonicalPacket.confidence,
        tension_level: canonicalPacket.status === "mixed" ? "moderate" : "low",
        directionality: {
          polarity: "a_to_b",
          lead_party: "A",
          impact_on_a_ko: "감정적 체벌/폭언 전면 배제 및 3대 핵심 룰 고수",
          impact_on_b_ko: "기본 규칙 준수 및 불안감 해소",
        },
        primary_saju_evidence: [
          ...wonjinHits.map((h) => ({ kind: "wonjin" as const, description_ko: `${h.personA_pillar}×${h.personB_pillar} ${h.detail ?? h.type}` })),
          ...stemClashes.map((h) => ({ kind: "stem_clash" as const, description_ko: `${h.personA_pillar}×${h.personB_pillar} ${h.detail ?? h.type}` })),
        ],
        supporting_packet_ids: packets.filter((p) => p.group === "friction").map((p) => p.packet_id),
        personal_ce_contributions: {
          b: profB ? [`boundary_defense_strength:${profB.boundary_defense_strength}`] : [],
        },
        llm_synthesis_allowance: {
          allowed_themes: ["안전 울타리", "3대 핵심 룰", "비난 금지"],
          prohibited_claims: tgExpr.prohibited_claims,
        },
      };
    })(),

    // 8. Family Crisis Recovery
    (() => {
      const canonicalPacket = resolveFamilyCrisisRecoveryCanonical({
        hasClash: stemClashes.length > 0 || branchClashes.length > 0,
        hasStemCombine: stemCombines.length > 0,
        profA,
        profB,
        hasFacts: facts.cross_hits.length > 0 || Boolean(facts.element_flow),
        unknownHour,
      });

      if (canonicalPacket.status === "abstained") {
        return {
          lens_id: "family_crisis_recovery",
          domain: "family",
          user_question: "한바탕 크게 부딪히거나 문을 쾅 닫고 들어갔을 때의 골든타임 화해법은?",
          emotional_outcome: "갈등 회복 지표 부족 (기본 화목)",
          canonical_meaning_id: "family_repair_insufficient_evidence",
          headline_ko: "가족 내 급성 갈등이나 단절에 대한 특이 지표가 확인되지 않습니다.",
          headline_en: "No pronounced friction indicators found for acute family ruptures.",
          narrative_ko: "갈등이 발생하더라도 자연스럽게 식사를 함께하며 부드럽게 풀리는 관계입니다.",
          narrative_en: "Family misunderstandings de-escalate organically over shared routines.",
          confidence: "insufficient" as LensConfidenceLevel,
          tension_level: "low" as LensTensionLevel,
          is_abstaining: true,
          abstain_reason: "insufficient_evidence",
          directionality: { polarity: "symmetric", impact_on_a_ko: "자연스러운 화해", impact_on_b_ko: "자연스러운 화해" },
          primary_saju_evidence: [],
          supporting_packet_ids: [],
          personal_ce_contributions: {},
          llm_synthesis_allowance: {
            allowed_themes: ["자연스러운 화해", "온화한 일상"],
            prohibited_claims: ["가족 해체", "의절"],
          },
        };
      }

      const tgExpr = resolveGod("정인");
      const hasStemCombine = stemCombines.length > 0;

      return {
        lens_id: "family_crisis_recovery",
        domain: "family",
        user_question: "한바탕 크게 부딪히거나 문을 쾅 닫고 들어갔을 때의 골든타임 화해법은?",
        emotional_outcome: "뒤끝 남기지 않고 따뜻한 밥 한 끼와 진심 어린 사과로 다시 끈끈해지는 회복 탄력성",
        canonical_meaning_id: canonicalPacket.meaning_id,
        headline_ko: hasStemCombine
          ? `${nameA}의 따뜻한 간식 노크와 ${nameB}의 마음을 여는 골든타임 회복 루틴`
          : `${nameA}와(과) ${nameB}의 충분한 감정 쿨링 타임 후 차분한 대화 재개`,
        headline_en: hasStemCombine
          ? `Golden-hour repair routine using gentle snack check-ins to soften defensive walls`
          : `Calm conversational re-engagement after mandatory emotional cooling periods`,
        narrative_ko: hasStemCombine
          ? `천간합의 근원적 결속력 덕분에 화가 난 상태에서도 과일 접시를 들고 들어가는 부모의 작은 제스처가 즉각 아이의 닫힌 문을 엽니다. ${tgExpr.selected_summary_ko}`
          : `감정이 격해졌을 때는 즉각적인 훈계보다 몇 시간의 냉각기를 거친 후 차분하게 대화를 나누는 것이 가장 확실한 해법입니다.`,
        narrative_en: `Gentle repair overtures during emotional cooldown protect long-term attachment trust.`,
        confidence: canonicalPacket.confidence,
        tension_level: canonicalPacket.status === "mixed" ? "moderate" : "low",
        directionality: {
          polarity: "symmetric",
          impact_on_a_ko: "자존심 세우지 않고 먼저 따뜻한 손 내밀기",
          impact_on_b_ko: "부모의 사과 수용 및 속마음 털어놓기",
        },
        primary_saju_evidence: [
          ...stemCombines.map((h) => ({ kind: "stem_combine" as const, description_ko: `${h.personA_pillar}×${h.personB_pillar} ${h.detail ?? h.type}` })),
          ...stemClashes.map((h) => ({ kind: "stem_clash" as const, description_ko: `${h.personA_pillar}×${h.personB_pillar} ${h.detail ?? h.type}` })),
        ],
        supporting_packet_ids: packets.filter((p) => p.group === "bonding" || p.group === "friction").map((p) => p.packet_id),
        personal_ce_contributions: {
          a: profA ? [`conflict_decompression:${profA.conflict_decompression}`] : [],
          b: profB ? [`conflict_decompression:${profB.conflict_decompression}`] : [],
        },
        llm_synthesis_allowance: {
          allowed_themes: ["골든타임 화해", "간식 노크", "쿨링 타임"],
          prohibited_claims: tgExpr.prohibited_claims,
        },
      };
    })(),
  ];

  return evaluations;
}
