/**
 * Friend Domain Lenses
 *
 * Implements 8 canonical Friend Lenses grounded in Pair CE, Personal CE,
 * Ten-God Matrix runtime resolutions, and authoritative V1 Gold canonical adapters.
 */

import type { PairContextPacket } from "@/lib/personCore/pairContextEngine/types";
import type { PairSajuFacts, PairElementFlowFact } from "@/lib/personCore/pairSaju";
import type { PersonalContextEngineOutput } from "@/lib/personCore/personalContextEngine/types";
import type {
  DomainLensEvaluation,
  FriendLensId,
  LensConfidenceLevel,
  LensTensionLevel,
  LensDirectionalityEvaluation,
} from "../types";
import { resolveTenGodDomainExpression, type TenGodCode } from "../tenGodLensMatrix";
import { resolveFriendTreasurerCanonical } from "@/lib/relationship/friend/friendTreasurerCanonical";
import {
  resolveFriendCoreVibeCanonical,
  resolveFriendTravelLeadCanonical,
  resolveFriendComfortDistanceCanonical,
  resolveFriendCounselingCanonical,
  resolveFriendJealousyGuardCanonical,
  resolveFriendDeEscalationCanonical,
} from "@/lib/relationship/friend/friendCanonicalAdapters";

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

function deriveConfidence(
  evidenceCount: number,
  unknownHour: boolean,
  corroborated: boolean = false,
): LensConfidenceLevel {
  if (evidenceCount === 0) return "insufficient";
  if (unknownHour) return evidenceCount >= 2 ? "medium" : "low";
  if (corroborated && evidenceCount >= 2) return "high";
  if (evidenceCount >= 1) return "medium";
  return "low";
}

export function evaluateFriendLenses(params: {
  facts: PairSajuFacts;
  packets: PairContextPacket[];
  personalCeA?: PersonalContextEngineOutput;
  personalCeB?: PersonalContextEngineOutput;
  partyNames?: { a: string; b: string };
  psychScores?: Record<string, number>;
}): DomainLensEvaluation<FriendLensId>[] {
  const { facts, packets, personalCeA, personalCeB, partyNames } = params;
  const nameA = partyNames?.a ?? "친구 A";
  const nameB = partyNames?.b ?? "친구 B";
  const unknownHour = facts.birth_time_unknown_a || facts.birth_time_unknown_b;

  const stemCombines = facts.cross_hits.filter((h) => h.type === "천간합");
  const stemClashes = facts.cross_hits.filter((h) => h.type === "천간충");
  const branchCombines = facts.cross_hits.filter((h) => ["육합", "삼합", "반합"].includes(h.type));
  const branchClashes = facts.cross_hits.filter((h) => ["충", "형", "파", "해"].includes(h.type));
  const wonjinHits = facts.cross_hits.filter((h) => ["원진", "귀문"].includes(h.type));
  const elementFlow = facts.element_flow;

  const profA = personalCeA?.aggregates?.relational_profile;
  const profB = personalCeB?.aggregates?.relational_profile;
  const countsA = personalCeA?.aggregates?.ten_god_stem_counts ?? {};
  const countsB = personalCeB?.aggregates?.ten_god_stem_counts ?? {};

  const psychMasterA = params.psychScores
    ? ({
        secondary_axes: {
          practicality: params.psychScores.practicality_a ?? 50,
          structure: params.psychScores.structure_a ?? 50,
          empathy: params.psychScores.empathy_a ?? 50,
          energy_style: params.psychScores.energy_style_a ?? 50,
          stimulation: params.psychScores.stimulation_a ?? 50,
          conflict_style: params.psychScores.conflict_style_a ?? 50,
          thinking_style: params.psychScores.thinking_style_a ?? 50,
          recognition: params.psychScores.recognition_a ?? 50,
          self_control: params.psychScores.self_control_a ?? 50,
          intimacy_preference: params.psychScores.intimacy_a ?? 50,
          boundary_strength: params.psychScores.boundary_a ?? 50,
        },
      } as any)
    : profA
      ? ({
          secondary_axes: {
            practicality: profA.resource_governance === "diligent_steward" ? 80 : profA.resource_governance === "flexible_distributor" ? 30 : 50,
            structure: profA.structure_spontaneity === "disciplined_framework_driven" ? 80 : profA.structure_spontaneity === "spontaneous_creative_flow" ? 30 : 50,
            empathy: profA.support_giving_style === "nurturing_empath" ? 80 : profA.support_giving_style === "silent_standby" ? 30 : 50,
            energy_style: profA.expression_style === "expressive_creator" ? 80 : profA.expression_style === "reserved_observer" ? 30 : 50,
            stimulation: profA.expression_style === "expressive_creator" ? 80 : profA.expression_style === "reserved_observer" ? 30 : 50,
            conflict_style: profA.conflict_decompression === "immediate_clarifier" ? 80 : profA.conflict_decompression === "solitude_cooling_needed" ? 30 : 50,
            thinking_style: profA.decision_pace === "deliberate_evaluator" ? 80 : profA.decision_pace === "swift_initiative" ? 30 : 50,
            recognition: profA.recognition_need === "standards_driven" ? 80 : profA.recognition_need === "autonomous_independent" ? 30 : 50,
            self_control: profA.boundary_defense_strength === "uncompromising_sovereignty" ? 80 : profA.boundary_defense_strength === "tactful_diplomatic" ? 30 : 50,
            intimacy_preference: profA.intimacy_expression_style === "passionate_intensity" ? 80 : profA.intimacy_expression_style === "independent_space_valuing" ? 30 : 50,
            boundary_strength: profA.boundary_defense_strength === "uncompromising_sovereignty" ? 80 : profA.boundary_defense_strength === "tactful_diplomatic" ? 30 : 50,
          },
        } as any)
      : null;

  const psychMasterB = params.psychScores
    ? ({
        secondary_axes: {
          practicality: params.psychScores.practicality_b ?? 50,
          structure: params.psychScores.structure_b ?? 50,
          empathy: params.psychScores.empathy_b ?? 50,
          energy_style: params.psychScores.energy_style_b ?? 50,
          stimulation: params.psychScores.stimulation_b ?? 50,
          conflict_style: params.psychScores.conflict_style_b ?? 50,
          thinking_style: params.psychScores.thinking_style_b ?? 50,
          recognition: params.psychScores.recognition_b ?? 50,
          self_control: params.psychScores.self_control_b ?? 50,
          intimacy_preference: params.psychScores.intimacy_b ?? 50,
          boundary_strength: params.psychScores.boundary_b ?? 50,
        },
      } as any)
    : profB
      ? ({
          secondary_axes: {
            practicality: profB.resource_governance === "diligent_steward" ? 80 : profB.resource_governance === "flexible_distributor" ? 30 : 50,
            structure: profB.structure_spontaneity === "disciplined_framework_driven" ? 80 : profB.structure_spontaneity === "spontaneous_creative_flow" ? 30 : 50,
            empathy: profB.support_giving_style === "nurturing_empath" ? 80 : profB.support_giving_style === "silent_standby" ? 30 : 50,
            energy_style: profB.expression_style === "expressive_creator" ? 80 : profB.expression_style === "reserved_observer" ? 30 : 50,
            stimulation: profB.expression_style === "expressive_creator" ? 80 : profB.expression_style === "reserved_observer" ? 30 : 50,
            conflict_style: profB.conflict_decompression === "immediate_clarifier" ? 80 : profB.conflict_decompression === "solitude_cooling_needed" ? 30 : 50,
            thinking_style: profB.decision_pace === "deliberate_evaluator" ? 80 : profB.decision_pace === "swift_initiative" ? 30 : 50,
            recognition: profB.recognition_need === "standards_driven" ? 80 : profB.recognition_need === "autonomous_independent" ? 30 : 50,
            self_control: profB.boundary_defense_strength === "uncompromising_sovereignty" ? 80 : profB.boundary_defense_strength === "tactful_diplomatic" ? 30 : 50,
            intimacy_preference: profB.intimacy_expression_style === "passionate_intensity" ? 80 : profB.intimacy_expression_style === "independent_space_valuing" ? 30 : 50,
            boundary_strength: profB.boundary_defense_strength === "uncompromising_sovereignty" ? 80 : profB.boundary_defense_strength === "tactful_diplomatic" ? 30 : 50,
          },
        } as any)
      : null;

  const resolveGod = (god: TenGodCode, isTension = false) =>
    resolveTenGodDomainExpression({ god, domain: "friend", isTension });

  const evaluations: DomainLensEvaluation<FriendLensId>[] = [
    // 1. Friend Core Vibe
    (() => {
      const canonicalPacket = resolveFriendCoreVibeCanonical({
        psychA: psychMasterA,
        psychB: psychMasterB,
        hasStemCombine: stemCombines.length > 0,
        hasBranchCombine: branchCombines.length > 0,
      });

      if (canonicalPacket.status === "abstained") {
        return {
          lens_id: "friend_core_vibe",
          domain: "friend",
          user_question: "함께 있을 때 가장 재미있고 편안하게 통하는 우리만의 케미스트리는?",
          emotional_outcome: "친구 케미 지표 부족 (중립 확인)",
          canonical_meaning_id: "friend_vibe_insufficient_evidence",
          headline_ko: "친구 간 특별한 합 결속 지표가 확인되지 않습니다.",
          headline_en: "No pronounced combine indicators found for friendship chemistry.",
          narrative_ko: "특정 케미를 단정하지 않고 서로의 취향과 관심사를 편안하게 나누길 권장합니다.",
          narrative_en: "Neutral indicators; explore shared interests organically over time.",
          confidence: "insufficient" as LensConfidenceLevel,
          tension_level: "low" as LensTensionLevel,
          is_abstaining: true,
          abstain_reason: "insufficient_evidence",
          directionality: { polarity: "symmetric", impact_on_a_ko: "무던한 교류", impact_on_b_ko: "무던한 교류" },
          primary_saju_evidence: [],
          supporting_packet_ids: [],
          personal_ce_contributions: {},
          llm_synthesis_allowance: {
            allowed_themes: ["편안한 교류", "무던한 우정"],
            prohibited_claims: ["성격 불일치", "절교"],
          },
        };
      }

      const hasStemCombine = stemCombines.length > 0;
      const tgExpr = resolveGod("비견");

      return {
        lens_id: "friend_core_vibe",
        domain: "friend",
        user_question: "함께 있을 때 가장 재미있고 편안하게 통하는 우리만의 케미스트리는?",
        emotional_outcome: "가식 없이 본모습 그대로를 보여줘도 통하는 찰떡같은 티키타카 호흡 확인",
        canonical_meaning_id: canonicalPacket.meaning_id,
        headline_ko: hasStemCombine
          ? `${nameA}와(과) ${nameB}의 코드가 찰떡같이 맞아떨어지는 티키타카 케미`
          : `${nameA}와(과) ${nameB}의 무던하고 편안한 롱런 우정`,
        headline_en: hasStemCombine
          ? `Instant witty rapport and effortless conversational banter rooted in stem harmony`
          : `Effortless, low-maintenance peer bond built for sustainable lifelong friendship`,
        narrative_ko: hasStemCombine
          ? `천간합의 조화로 인해 말하지 않아도 유머 코드와 생각이 통하는 환상의 짝꿍입니다. ${tgExpr.selected_summary_ko}`
          : `서로에게 부담을 주지 않으며 오랜 시간 편안하게 곁을 지켜주는 든든한 친구입니다.`,
        narrative_en: `Natural energetic resonance fosters seamless peer banter.`,
        confidence: canonicalPacket.confidence,
        tension_level: canonicalPacket.status === "mixed" ? "moderate" : "low",
        directionality: { polarity: "symmetric", impact_on_a_ko: "유쾌한 에너지 교류", impact_on_b_ko: "편안한 본모습 수용" },
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
          allowed_themes: ["티키타카", "편안한 친구", "유쾌한 대화"],
          prohibited_claims: tgExpr.prohibited_claims,
        },
      };
    })(),

    // 2. Friend Treasurer Split
    (() => {
      const hasClash = stemClashes.length > 0 || branchClashes.length > 0;
      const hasCombine = stemCombines.length > 0 || branchCombines.length > 0;
      const hasWealth = Boolean(countsA["정재"] || countsA["편재"] || countsB["정재"] || countsB["편재"]);

      if (!hasWealth && !hasClash && !hasCombine && !profA && !profB && !psychMasterA && !psychMasterB) {
        return {
          lens_id: "friend_treasurer_split",
          domain: "friend",
          user_question: "밥값, 술값, 여행 경비 등 돈 계산할 때 서운함 없이 깔끔한 1/N 룰은?",
          emotional_outcome: "정산 스타일 지표 부족",
          canonical_meaning_id: "friend_money_insufficient_evidence",
          headline_ko: "정산 및 총무 역할 분담에 대한 사주/설문 지표가 확인되지 않습니다.",
          headline_en: "No pronounced treasurer or cost-split indicators found.",
          narrative_ko: "식사나 모임 후에는 상황에 맞춰 유연하게 1/N 정산을 진행하길 권장합니다.",
          narrative_en: "Adopt flexible mutual cost-splitting as needed.",
          confidence: "insufficient" as LensConfidenceLevel,
          tension_level: "low" as LensTensionLevel,
          is_abstaining: true,
          abstain_reason: "insufficient_evidence",
          directionality: { polarity: "symmetric", impact_on_a_ko: "유연한 정산", impact_on_b_ko: "유연한 정산" },
          primary_saju_evidence: [],
          supporting_packet_ids: [],
          personal_ce_contributions: {},
          llm_synthesis_allowance: {
            allowed_themes: ["유연한 정산", "상황별 조율"],
            prohibited_claims: ["사기", "불신"],
          },
        };
      }

      const canonical = resolveFriendTreasurerCanonical({
        nicknameA: nameA,
        nicknameB: nameB,
        countsA,
        countsB,
        psychA: psychMasterA,
        psychB: psychMasterB,
        birthTimeUnknownA: facts.birth_time_unknown_a,
        birthTimeUnknownB: facts.birth_time_unknown_b,
      });

      const selectedName = canonical.selected_nickname;
      const isLeadA = canonical.selected_person === "A";
      const meaningVariant = isLeadA ? "friend_money_exact_split_rule" : "friend_money_easy_rotation";

      return {
        lens_id: "friend_treasurer_split",
        domain: "friend",
        user_question: "밥값, 술값, 여행 경비 등 돈 계산할 때 서운함 없이 깔끔한 1/N 룰은?",
        emotional_outcome: "돈 문제로 어색해지거나 뒤끝 남지 않는 쿨하고 투명한 모임 정산 규칙",
        canonical_meaning_id: meaningVariant,
        headline_ko: `${selectedName}이(가) 이 우정의 1/N 정산과 모임 총무를 전담하는 깔끔한 룰`,
        headline_en: `${selectedName} designated as official treasurer for transparent peer cost splitting`,
        narrative_ko: canonical.reason,
        narrative_en: `Designated treasurer maintains peer transparency without friction.`,
        confidence: canonical.confidence as LensConfidenceLevel,
        tension_level: (canonical.align === "caution" ? "moderate" : "low") as LensTensionLevel,
        directionality: {
          polarity: isLeadA ? "a_to_b" : "b_to_a",
          lead_party: isLeadA ? "A" : "B",
          impact_on_a_ko: isLeadA ? "모임 총무 및 1/N 영수증 정리" : "정산 확인 즉시 송금",
          impact_on_b_ko: !isLeadA ? "모임 총무 및 1/N 영수증 정리" : "정산 확인 즉시 송금",
        },
        primary_saju_evidence: canonical.evidence.map((e) => ({
          kind: "ten_god_matrix" as const,
          description_ko: e.detail,
        })),
        supporting_packet_ids: packets
          .filter((p) => p.group === "friction" || p.group === "bonding")
          .map((p) => p.packet_id),
        personal_ce_contributions: {
          a: profA ? [`resource_governance:${profA.resource_governance}`] : [],
          b: profB ? [`resource_governance:${profB.resource_governance}`] : [],
        },
        llm_synthesis_allowance: {
          allowed_themes: ["총무 전담", "1/N 즉시 정산", "투명한 정산 앱 활용"],
          prohibited_claims: ["사기", "금전 갈취", "불신"],
        },
      };
    })(),

    // 3. Friend Travel Lead
    (() => {
      const canonicalPacket = resolveFriendTravelLeadCanonical({
        psychA: psychMasterA,
        psychB: psychMasterB,
        batteryModeA: "outdoor",
        batteryModeB: "homebody",
        tikitakaModeA: "popcorn",
        tikitakaModeB: "silent",
        nicknameA: nameA,
        nicknameB: nameB,
      });

      const hasCombine = branchCombines.length > 0;
      const hasFlow = elementFlow && elementFlow.direction !== "none";
      const totalEv = (hasCombine ? 1 : 0) + (hasFlow ? 1 : 0);

      if (totalEv === 0 && canonicalPacket.status === "abstained") {
        return {
          lens_id: "friend_travel_lead",
          domain: "friend",
          user_question: "여행을 가거나 모임을 잡을 때 계획 짜기와 일정 리드는 누가 맡아야 할까?",
          emotional_outcome: "여행 리드 지표 부족 (중립 확인)",
          canonical_meaning_id: "friend_travel_insufficient_evidence",
          headline_ko: "여행 일정 기획에 대한 특정 역할 지표가 확인되지 않습니다.",
          headline_en: "No pronounced leadership indicators found for travel planning.",
          narrative_ko: "서로 가고 싶은 장소를 하나씩 공유하며 자유로운 일정으로 여행을 즐기길 권장합니다.",
          narrative_en: "Collaborate freely on travel wishlists without rigid single-leader dynamics.",
          confidence: "insufficient" as LensConfidenceLevel,
          tension_level: "low" as LensTensionLevel,
          is_abstaining: true,
          abstain_reason: "insufficient_evidence",
          directionality: { polarity: "symmetric", impact_on_a_ko: "자유로운 여행", impact_on_b_ko: "자유로운 여행" },
          primary_saju_evidence: [],
          supporting_packet_ids: [],
          personal_ce_contributions: {},
          llm_synthesis_allowance: {
            allowed_themes: ["자유 여행", "함께 즐기기"],
            prohibited_claims: ["여행 파탄", "손절"],
          },
        };
      }

      const tgExpr = resolveGod("식신");
      const canonicalId = hasCombine ? "friend_travel_itinerary_harmony" : "friend_travel_spontaneous_wanderlust";

      return {
        lens_id: "friend_travel_lead",
        domain: "friend",
        user_question: "여행을 가거나 모임을 잡을 때 계획 짜기와 일정 리드는 누가 맡아야 할까?",
        emotional_outcome: "한 사람만 고생하지 않고 계획과 현장 리액션이 찰떡같이 분담되는 즐거운 여행",
        canonical_meaning_id: canonicalPacket.status !== "abstained" ? canonicalPacket.meaning_id : canonicalId,
        headline_ko: hasCombine
          ? `${nameA}와(과) ${nameB}의 맛집/코스를 짜는 리더와 즐겁게 호응하는 팔로워의 조화`
          : `${nameA}와(과) ${nameB}의 계획 없이 떠나도 발길 닿는 대로 유쾌한 즉흥 여행`,
        headline_en: hasCombine
          ? `Harmonious synergy between dedicated itinerary curation and enthusiastic foodie exploration`
          : `Spontaneous wanderlust and lighthearted serendipity traveling without rigid itineraries`,
        narrative_ko: hasCombine
          ? `지지 합의 팀워크로 한쪽이 코스와 맛집을 서칭하고 다른 쪽이 현장에서 완벽하게 호응하여 여행 만족도를 극대화합니다. ${tgExpr.selected_summary_ko}`
          : `엄격한 시간표 없이 발길 닿는 대로 움직여도 예상치 못한 재미를 발견하는 유연한 여행 궁합입니다.`,
        narrative_en: `Aligned travel rhythms maximize spontaneous joy and logistical ease.`,
        confidence: canonicalPacket.status !== "abstained" ? canonicalPacket.confidence : deriveConfidence(totalEv, unknownHour, hasCombine),
        tension_level: "low",
        directionality: deriveDirectionality(elementFlow, "숙소/교통 및 코스 기획", "현장 운전 및 분위기 메이킹"),
        primary_saju_evidence: branchCombines.map((h) => ({ kind: "branch_combine" as const, description_ko: `${h.personA_pillar}×${h.personB_pillar} ${h.detail ?? h.type}` })),
        supporting_packet_ids: packets.filter((p) => p.group === "bonding").map((p) => p.packet_id),
        personal_ce_contributions: {
          a: profA ? [`decision_pace:${profA.decision_pace}`] : [],
          b: profB ? [`decision_pace:${profB.decision_pace}`] : [],
        },
        llm_synthesis_allowance: {
          allowed_themes: ["맛집 탐방", "역할 분담", "호응과 감사"],
          prohibited_claims: tgExpr.prohibited_claims,
        },
      };
    })(),

    // 4. Friend Emotional Vent (Counseling Style)
    (() => {
      const canonicalPacket = resolveFriendCounselingCanonical({
        countsA,
        countsB,
        psychA: psychMasterA,
        psychB: psychMasterB,
      });

      const hasWonjin = wonjinHits.length > 0;
      const hasFlow = elementFlow && elementFlow.direction !== "none";
      const totalEv = wonjinHits.length + (hasFlow ? 1 : 0);

      if (totalEv === 0 && canonicalPacket.status === "abstained") {
        return {
          lens_id: "friend_emotional_vent",
          domain: "friend",
          user_question: "힘든 일이나 고민이 생겼을 때 서로에게 가장 든든한 하소연과 공감 방식은?",
          emotional_outcome: "공감 방식 지표 부족 (기본 경청)",
          canonical_meaning_id: "friend_vent_insufficient_evidence",
          headline_ko: "하소연 및 위로 방식에 대한 특이 민감성이 확인되지 않습니다.",
          headline_en: "No specialized emotional venting sensitivity indicators found.",
          narrative_ko: "힘들 때 언제든 편하게 털어놓고 담백하게 위로해 줄 수 있는 든든한 친구입니다.",
          narrative_en: "Natural empathetic listening baseline; offer straightforward comfort when called upon.",
          confidence: "insufficient" as LensConfidenceLevel,
          tension_level: "low" as LensTensionLevel,
          is_abstaining: true,
          abstain_reason: "insufficient_evidence",
          directionality: { polarity: "symmetric", impact_on_a_ko: "따뜻한 경청", impact_on_b_ko: "따뜻한 경청" },
          primary_saju_evidence: [],
          supporting_packet_ids: [],
          personal_ce_contributions: {},
          llm_synthesis_allowance: {
            allowed_themes: ["따뜻한 위로", "편안한 대화"],
            prohibited_claims: ["감정 쓰레기통", "인간관계 회의"],
          },
        };
      }

      const tgExpr = resolveGod("정인");
      const canonicalId = hasWonjin ? "friend_vent_solution_anchor" : "friend_vent_unconditional_empathy";
      const finalMeaningId = hasWonjin
        ? "friend_vent_solution_anchor"
        : canonicalPacket.status !== "abstained"
          ? canonicalPacket.meaning_id
          : canonicalId;

      return {
        lens_id: "friend_emotional_vent",
        domain: "friend",
        user_question: "힘든 일이나 고민이 생겼을 때 서로에게 가장 든든한 하소연과 공감 방식은?",
        emotional_outcome: "훈계나 지적이 아닌 온전히 내 편을 들어주는 세상 가장 든든한 힐링 대나무숲",
        canonical_meaning_id: finalMeaningId,
        headline_ko: hasWonjin
          ? `${nameA}와(과) ${nameB}의 해결책 제시보다 오롯이 내 편이 되어주는 무조건적 공감`
          : `${nameA}와(과) ${nameB}의 담백하게 들어주고 가벼운 웃음으로 고민을 덜어주는 안식처`,
        headline_en: hasWonjin
          ? `Unconditional validation taking each other's side first before offering analytical fixes`
          : `Soothing empathetic haven defusing heavy worries with lighthearted warmth`,
        narrative_ko: hasWonjin
          ? `원진/귀문의 섬세한 감수성으로 인해 하소연할 때 성급한 솔루션 제시는 상처가 되며, 무조건적인 편들기가 먼저 필요합니다. ${tgExpr.selected_summary_ko}`
          : `서로의 힘든 이야기를 담백하게 들어주고 맛있는 음식으로 기분을 전환시켜 주는 든든한 우정입니다.`,
        narrative_en: `Empathetic validation restores emotional balance swiftly.`,
        confidence: canonicalPacket.status !== "abstained" ? canonicalPacket.confidence : deriveConfidence(totalEv, unknownHour, hasWonjin),
        tension_level: hasWonjin ? "moderate" : "low",
        directionality: {
          polarity: "symmetric",
          impact_on_a_ko: "맞장구와 감정 지지 우선",
          impact_on_b_ko: "속마음 털어놓고 카타르시스 해소",
        },
        primary_saju_evidence: wonjinHits.map((h) => ({ kind: "wonjin" as const, description_ko: `${h.personA_pillar}×${h.personB_pillar} ${h.detail ?? h.type}` })),
        supporting_packet_ids: packets.filter((p) => p.fact_kind === "wonjin_guimun").map((p) => p.packet_id),
        personal_ce_contributions: {
          a: profA ? [`recognition_need:${profA.recognition_need}`] : [],
          b: profB ? [`recognition_need:${profB.recognition_need}`] : [],
        },
        llm_synthesis_allowance: {
          allowed_themes: ["무조건적 편들기", "경청과 맞장구", "힐링 안식처"],
          prohibited_claims: tgExpr.prohibited_claims,
        },
      };
    })(),

    // 5. Friend Jealousy Guard
    (() => {
      const hasStemClash = stemClashes.length > 0;
      const hasBranchClash = branchClashes.length > 0;
      const hasClash = hasStemClash || hasBranchClash;
      const totalEv = stemClashes.length + branchClashes.length;

      const canonicalPacket = resolveFriendJealousyGuardCanonical({
        countsA,
        countsB,
        psychA: psychMasterA,
        psychB: psychMasterB,
        nicknameA: nameA,
        nicknameB: nameB,
        hasBranchClash,
        hasStemClash,
      });

      if (totalEv === 0 && canonicalPacket.status === "abstained") {
        return {
          lens_id: "friend_jealousy_guard",
          domain: "friend",
          user_question: "한쪽이 먼저 성공하거나 취업/연애 등 환경이 달라졌을 때 질투를 막는 법은?",
          emotional_outcome: "시기 질투 지표 부족 (기본 축하)",
          canonical_meaning_id: "friend_jealousy_insufficient_evidence",
          headline_ko: "친구 간 비교 의식이나 시기 질투 지표가 확인되지 않습니다.",
          headline_en: "No pronounced comparison envy or rivalry indicators found.",
          narrative_ko: "서로의 성장과 기쁜 소식을 진심으로 축하해 주는 건강하고 성숙한 관계입니다.",
          narrative_en: "Secure peer dynamic naturally celebrates each other's milestones.",
          confidence: "insufficient" as LensConfidenceLevel,
          tension_level: "low" as LensTensionLevel,
          is_abstaining: true,
          abstain_reason: "insufficient_evidence",
          directionality: { polarity: "symmetric", impact_on_a_ko: "진심 어린 축하", impact_on_b_ko: "진심 어린 축하" },
          primary_saju_evidence: [],
          supporting_packet_ids: [],
          personal_ce_contributions: {},
          llm_synthesis_allowance: {
            allowed_themes: ["성숙한 축하", "각자의 속도"],
            prohibited_claims: ["배반", "시기 질투 파탄"],
          },
        };
      }

      const tgExpr = resolveGod("겁재", true);
      const canonicalId = hasStemClash
        ? "friend_jealousy_secure_boundary"
        : hasBranchClash
          ? "friend_jealousy_blooming_seasons"
          : "friend_jealousy_natural_celebration";

      return {
        lens_id: "friend_jealousy_guard",
        domain: "friend",
        user_question: "한쪽이 먼저 성공하거나 취업/연애 등 환경이 달라졌을 때 질투를 막는 법은?",
        emotional_outcome: "상대의 성공을 시기하지 않고 각자의 개화 시기를 응원하는 어른스러운 우정",
        canonical_meaning_id: canonicalPacket.status !== "abstained" ? canonicalPacket.meaning_id : canonicalId,
        headline_ko: hasClash
          ? `${nameA}와(과) ${nameB}의 비교 의식을 내려놓고 각자의 속도를 인정하며 축하하는 성숙함`
          : `${nameA}와(과) ${nameB}의 상대의 성공이 곧 나의 기쁨이 되는 건강한 축하`,
        headline_en: hasClash
          ? `Maturity dismantling social comparison and honoring unique blooming seasons`
          : `Healthy and spontaneous celebration where peer triumphs bring mutual joy`,
        narrative_ko: hasClash
          ? `지지 충/형의 긴장이 있을 때는 인생 피크 타이밍이 다름을 상기하고 자랑을 은근히 과시하지 않는 배려가 필요합니다. ${tgExpr.selected_summary_ko}`
          : `친구의 좋은 일을 마치 내 일처럼 기뻐하며 함께 축배를 들어주는 성숙한 관계입니다.`,
        narrative_en: `Affirming distinct blooming seasons eliminates rivalry in peer relationships.`,
        confidence: canonicalPacket.status !== "abstained" ? canonicalPacket.confidence : deriveConfidence(totalEv, unknownHour, hasClash),
        tension_level: hasClash ? "moderate" : "low",
        directionality: {
          polarity: "symmetric",
          impact_on_a_ko: "좋은 소식 겸손하게 나누기",
          impact_on_b_ko: "진심 어린 축하와 자기 페이스 유지",
        },
        primary_saju_evidence: branchClashes.map((h) => ({ kind: "branch_clash" as const, description_ko: `${h.personA_pillar}×${h.personB_pillar} ${h.detail ?? h.type}` })),
        supporting_packet_ids: packets.filter((p) => p.group === "friction").map((p) => p.packet_id),
        personal_ce_contributions: {},
        llm_synthesis_allowance: {
          allowed_themes: ["개화 시기 인정", "진심 어린 축하", "비교 금지"],
          prohibited_claims: tgExpr.prohibited_claims,
        },
      };
    })(),

    // 6. Friend Comfort Distance
    (() => {
      const hasDayCombine = branchCombines.some((h) => h.personA_pillar === "일지" || h.personB_pillar === "일지");
      const hasDayClash = branchClashes.some((h) => h.personA_pillar === "일지" || h.personB_pillar === "일지");
      const totalEv = (hasDayCombine ? 1 : 0) + (hasDayClash ? 1 : 0);

      const canonicalPacket = resolveFriendComfortDistanceCanonical({
        psychA: psychMasterA,
        psychB: psychMasterB,
        hasDayCombine,
        hasDayClash,
      });

      if (totalEv === 0 && canonicalPacket.status === "abstained") {
        return {
          lens_id: "friend_comfort_distance",
          domain: "friend",
          user_question: "매일 연락하지 않아도 편안한 우리 사이의 최적의 소통 거리와 만남 빈도는?",
          emotional_outcome: "소통 거리 지표 부족 (자연스러운 템포)",
          canonical_meaning_id: "friend_distance_insufficient_evidence",
          headline_ko: "소통 빈도 및 거리에 대한 특이 지표가 확인되지 않습니다.",
          headline_en: "No pronounced communication cadence indicators found.",
          narrative_ko: "서로의 일상을 존중하며 부담 없는 주기로 소통하길 권장합니다.",
          narrative_en: "Maintain natural and flexible communication rhythms without pressure.",
          confidence: "insufficient" as LensConfidenceLevel,
          tension_level: "low" as LensTensionLevel,
          is_abstaining: true,
          abstain_reason: "insufficient_evidence",
          directionality: { polarity: "symmetric", impact_on_a_ko: "자연스러운 연락", impact_on_b_ko: "자연스러운 연락" },
          primary_saju_evidence: [],
          supporting_packet_ids: [],
          personal_ce_contributions: {},
          llm_synthesis_allowance: {
            allowed_themes: ["자연스러운 연락", "부담 없는 우정"],
            prohibited_claims: ["연락 두절", "소외감"],
          },
        };
      }

      const tgExpr = resolveGod("편인");
      const canonicalId = hasDayClash
        ? "friend_distance_independent_respect"
        : hasDayCombine
          ? "friend_distance_frequent_checkins"
          : "friend_distance_flexible_cadence";

      return {
        lens_id: "friend_comfort_distance",
        domain: "friend",
        user_question: "매일 연락하지 않아도 편안한 우리 사이의 최적의 소통 거리와 만남 빈도는?",
        emotional_outcome: "1년 만에 만나도 어제 만난 것처럼 편안하고 부담 없는 평생의 안전거리",
        canonical_meaning_id: canonicalPacket.status !== "abstained" ? canonicalPacket.meaning_id : canonicalId,
        headline_ko: hasDayClash
          ? `${nameA}와(과) ${nameB}의 각자의 일상을 존중하며 가끔 만나도 어제 본 듯 편안한 거리`
          : `${nameA}와(과) ${nameB}의 사소한 일상도 메신저로 편하게 나누는 친밀한 소통`,
        headline_en: hasDayClash
          ? `Effortless peer connection that instantly reconnects without requiring daily check-ins`
          : `High-frequency banter sharing everyday moments seamlessly`,
        narrative_ko: hasDayClash
          ? `일지 충의 성향으로 인해 매일 의무적으로 연락하기보다 각자의 영역을 인정할 때 관계가 가장 오래갑니다. ${tgExpr.selected_summary_ko}`
          : `자주 소통하며 일상의 즐거움을 즉시 나누는 다정하고 친밀한 소통 스타일입니다.`,
        narrative_en: `Respecting natural communication rhythms ensures durable friendship.`,
        confidence: canonicalPacket.status !== "abstained" ? canonicalPacket.confidence : deriveConfidence(totalEv, unknownHour, hasDayCombine),
        tension_level: hasDayClash ? "moderate" : "low",
        directionality: {
          polarity: "symmetric",
          impact_on_a_ko: "독립적 시간 존중",
          impact_on_b_ko: "부담 없는 편안한 연락 유지",
        },
        primary_saju_evidence: hasDayClash
          ? branchClashes.map((h) => ({ kind: "branch_clash" as const, description_ko: `${h.personA_pillar}×${h.personB_pillar} ${h.detail ?? h.type}` }))
          : branchCombines.map((h) => ({ kind: "branch_combine" as const, description_ko: `${h.personA_pillar}×${h.personB_pillar} ${h.detail ?? h.type}` })),
        supporting_packet_ids: packets.filter((p) => p.group === "bonding" || p.group === "friction").map((p) => p.packet_id),
        personal_ce_contributions: {
          a: profA ? [`solitude_autonomy:${profA.solitude_autonomy}`] : [],
          b: profB ? [`solitude_autonomy:${profB.solitude_autonomy}`] : [],
        },
        llm_synthesis_allowance: {
          allowed_themes: ["편안한 소통 거리", "무부담 연락", "각자의 영역 존중"],
          prohibited_claims: tgExpr.prohibited_claims,
        },
      };
    })(),

    // 7. Friend Taste Shared
    (() => {
      const hasCombine = branchCombines.length > 0 || (facts.trio_hits && facts.trio_hits.length > 0);
      const hasStemCombine = stemCombines.length > 0;
      const totalEv = (hasCombine ? 2 : 0) + (hasStemCombine ? 1 : 0);

      if (totalEv === 0 && !profA && !profB) {
        return {
          lens_id: "friend_taste_shared",
          domain: "friend",
          user_question: "음식, 패션, 음악, 취미 등 둘이 함께 즐길 때 시너지가 폭발하는 관심사는?",
          emotional_outcome: "취향 공유 지표 부족 (자연스러운 탐색)",
          canonical_meaning_id: "friend_taste_insufficient_evidence",
          headline_ko: "취향 및 관심사 공유에 대한 특이 결속 지표가 확인되지 않습니다.",
          headline_en: "No pronounced shared interest indicators found.",
          narrative_ko: "서로의 다양한 취향을 부담 없이 탐색하며 즐거운 시간을 만들어가길 권장합니다.",
          narrative_en: "Explore diverse interests organically together.",
          confidence: "insufficient" as LensConfidenceLevel,
          tension_level: "low" as LensTensionLevel,
          is_abstaining: true,
          abstain_reason: "insufficient_evidence",
          directionality: { polarity: "symmetric", impact_on_a_ko: "자유로운 취향 공유", impact_on_b_ko: "자유로운 취향 공유" },
          primary_saju_evidence: [],
          supporting_packet_ids: [],
          personal_ce_contributions: {},
          llm_synthesis_allowance: {
            allowed_themes: ["자유로운 취향 공유", "다양성 존중"],
            prohibited_claims: ["취향 불일치", "절교"],
          },
        };
      }

      const tgExpr = resolveGod("식신");
      const canonicalId = hasCombine || hasStemCombine
        ? "friend_taste_synergistic_discovery"
        : "friend_taste_complementary_fun";

      return {
        lens_id: "friend_taste_shared",
        domain: "friend",
        user_question: "음식, 패션, 음악, 취미 등 둘이 함께 즐길 때 시너지가 폭발하는 관심사는?",
        emotional_outcome: "함께 맛집을 가거나 취미를 즐길 때 시간 가는 줄 모르고 배가 되는 즐거움",
        canonical_meaning_id: canonicalId,
        headline_ko: hasCombine || hasStemCombine
          ? `${nameA}와(과) ${nameB}의 서로의 취향을 공유하며 새로운 경험을 넓혀가는 시너지`
          : `${nameA}와(과) ${nameB}의 서로 다른 관심사를 구경하며 색다른 재미를 얻는 조화`,
        headline_en: hasCombine || hasStemCombine
          ? `Synergistic exploration expanding cultural tastes, dining, and hobbies effortlessly`
          : `Complementary interests discovering unexpected fun in each other's passions`,
        narrative_ko: hasCombine || hasStemCombine
          ? `지지 합의 기운으로 음식, 영화, 음악 등의 취향이 자연스럽게 통하며 함께할 때 즐거움이 배가됩니다. ${tgExpr.selected_summary_ko}`
          : `서로 다른 취향을 억지로 맞추기보다 색다른 시각을 배우며 경험의 폭을 넓히는 건강한 우정입니다.`,
        narrative_en: `Shared culinary and cultural resonance fuels vibrant bonding.`,
        confidence: deriveConfidence(totalEv > 0 ? totalEv : 1, unknownHour, hasCombine),
        tension_level: "low",
        directionality: {
          polarity: "symmetric",
          impact_on_a_ko: "새로운 취향/맛집 제안",
          impact_on_b_ko: "함께 즐기며 호응하기",
        },
        primary_saju_evidence: [
          ...branchCombines.map((h) => ({ kind: "branch_combine" as const, description_ko: `${h.personA_pillar}×${h.personB_pillar} ${h.detail ?? h.type}` })),
          ...stemCombines.map((h) => ({ kind: "stem_combine" as const, description_ko: `${h.personA_pillar}×${h.personB_pillar} ${h.detail ?? h.type}` })),
        ],
        supporting_packet_ids: packets.filter((p) => p.group === "bonding").map((p) => p.packet_id),
        personal_ce_contributions: {
          a: profA ? [`expression_style:${profA.expression_style}`] : [],
          b: profB ? [`expression_style:${profB.expression_style}`] : [],
        },
        llm_synthesis_allowance: {
          allowed_themes: ["취향 공유", "미식 탐방", "취미 시너지"],
          prohibited_claims: tgExpr.prohibited_claims,
        },
      };
    })(),

    // 8. Friend Repair Reconciliation (Prescriptions)
    (() => {
      const hasClash = stemClashes.length > 0 || branchClashes.length > 0;
      const hasWonjin = wonjinHits.length > 0;
      const totalEv = (hasClash ? 1 : 0) + (hasWonjin ? 1 : 0);

      const dominantA = personalCeA?.aggregates?.dominant_element ?? "wood";
      const dominantB = personalCeB?.aggregates?.dominant_element ?? "fire";

      const canonicalPacket = resolveFriendDeEscalationCanonical({
        countsA,
        countsB,
        dominantElementA: dominantA,
        dominantElementB: dominantB,
        psychA: psychMasterA,
        psychB: psychMasterB,
        nicknameA: nameA,
        nicknameB: nameB,
        hasWonjin,
        hasClash,
        hasClashOrWonjin: hasClash || hasWonjin,
      });

      if (totalEv === 0 && canonicalPacket.status === "abstained") {
        return {
          lens_id: "friend_repair_reconciliation",
          domain: "friend",
          user_question: "서운한 점이나 오해가 생겼을 때 자존심 상하지 않고 쿨하게 푸는 화해법은?",
          emotional_outcome: "화해 방식 지표 부족 (자연스러운 회복)",
          canonical_meaning_id: "friend_repair_insufficient_evidence",
          headline_ko: "갈등 회복에 대한 특정 마찰 지표가 확인되지 않습니다.",
          headline_en: "No pronounced friction indicators found for peer reconciliation.",
          narrative_ko: "서로에 대한 배려를 바탕으로 자연스럽게 대화를 나누며 오해를 풀길 권장합니다.",
          narrative_en: "Open and respectful dialogue resolves minor peer misunderstandings smoothly.",
          confidence: "insufficient" as LensConfidenceLevel,
          tension_level: "low" as LensTensionLevel,
          is_abstaining: true,
          abstain_reason: "insufficient_evidence",
          directionality: { polarity: "symmetric", impact_on_a_ko: "담백한 대화", impact_on_b_ko: "담백한 대화" },
          primary_saju_evidence: [],
          supporting_packet_ids: [],
          personal_ce_contributions: {},
          llm_synthesis_allowance: {
            allowed_themes: ["담백한 대화", "자연스러운 화해"],
            prohibited_claims: ["손절", "앙금 지속"],
          },
        };
      }

      const tgExpr = resolveGod("식신");
      const canonicalId = hasWonjin
        ? "friend_repair_circuit_reset"
        : hasClash
          ? "friend_repair_conversational_apology"
          : "friend_repair_cooling_timeout";

      return {
        lens_id: "friend_repair_reconciliation",
        domain: "friend",
        user_question: "서운한 점이나 오해가 생겼을 때 자존심 상하지 않고 쿨하게 푸는 화해법은?",
        emotional_outcome: "시간 끌며 앙금 남기지 않고 맛있는 밥 한 끼와 담백한 사과로 즉시 리셋",
        canonical_meaning_id: canonicalPacket.status !== "abstained" ? canonicalPacket.meaning_id : canonicalId,
        headline_ko: hasWonjin || hasClash
          ? `${nameA}와(과) ${nameB}의 긴 설명보다 맛있는 밥 한 끼와 진솔한 사과로 즉시 리셋하는 쿨함`
          : `${nameA}와(과) ${nameB}의 솔직한 대화로 오해를 풀고 한층 더 깊어지는 회복력`,
        headline_en: hasWonjin || hasClash
          ? `Swift conversational reset defusing pride and clearing misunderstandings effortlessly`
          : `Warm and candid dialogue transforming minor frictions into deeper trust`,
        narrative_ko: hasWonjin || hasClash
          ? `서운함이 생겼을 때 카톡 장문보다 '밥 한 끼 먹자'며 직접 만나 털어내는 것이 가장 빠른 회복제입니다. ${tgExpr.selected_summary_ko}`
          : `서로의 진심을 의심하지 않고 솔직하게 대화하여 관계의 신뢰를 회복하는 성숙한 우정입니다.`,
        narrative_en: `Simple shared moments and straightforward apologies resolve tensions swiftly.`,
        confidence: canonicalPacket.status !== "abstained" ? canonicalPacket.confidence : deriveConfidence(totalEv, unknownHour, hasClash || hasWonjin),
        tension_level: hasClash || hasWonjin ? "moderate" : "low",
        directionality: {
          polarity: "symmetric",
          impact_on_a_ko: "먼저 손 내밀고 밥 한 끼 제안",
          impact_on_b_ko: "쿨하게 응하고 앙금 털어내기",
        },
        primary_saju_evidence: [
          ...wonjinHits.map((h) => ({ kind: "wonjin" as const, description_ko: `${h.personA_pillar}×${h.personB_pillar} ${h.detail ?? h.type}` })),
          ...branchClashes.map((h) => ({ kind: "branch_clash" as const, description_ko: `${h.personA_pillar}×${h.personB_pillar} ${h.detail ?? h.type}` })),
        ],
        supporting_packet_ids: packets.filter((p) => p.group === "bonding" || p.group === "structure").map((p) => p.packet_id),
        personal_ce_contributions: {
          a: profA ? [`conflict_decompression:${profA.conflict_decompression}`] : [],
          b: profB ? [`conflict_decompression:${profB.conflict_decompression}`] : [],
        },
        llm_synthesis_allowance: {
          allowed_themes: ["쿨한 리셋", "밥 한 끼 제안", "장문 금지"],
          prohibited_claims: tgExpr.prohibited_claims,
        },
      };
    })(),
  ];

  return evaluations;
}
