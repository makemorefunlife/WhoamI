/**
 * Work / Coworker Domain Lenses
 *
 * Implements 8 canonical Work Lenses grounded in Pair CE, Personal CE,
 * Ten-God Matrix runtime resolutions, and authoritative V1 Gold canonical adapters.
 */

import type { PairContextPacket } from "@/lib/personCore/pairContextEngine/types";
import type { PairSajuFacts, PairElementFlowFact } from "@/lib/personCore/pairSaju";
import type { PersonalContextEngineOutput } from "@/lib/personCore/personalContextEngine/types";
import type { WorkSajuSignals } from "@/lib/personCore/sajuSignals/types";
import type {
  DomainLensEvaluation,
  WorkLensId,
  LensConfidenceLevel,
  LensTensionLevel,
  LensDirectionalityEvaluation,
} from "../types";
import { resolveTenGodDomainExpression, type TenGodCode } from "../tenGodLensMatrix";
import {
  resolveWorkLeadershipSplitCanonical,
  resolveWorkTaskExecutionCanonical,
  resolveWorkFeedbackCushionCanonical,
  resolveWorkMicromanageGuardCanonical,
  resolveWorkStressReactionCanonical,
  resolveWorkDecisionStyleCanonical,
  resolveWorkSpecialWeaponCanonical,
  resolveWorkBurnoutRecoveryCanonical,
} from "@/lib/relationship/workColleague/workCanonicalAdapters";

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

export function evaluateWorkLenses(params: {
  facts: PairSajuFacts;
  packets?: PairContextPacket[];
  personalCeA?: PersonalContextEngineOutput;
  personalCeB?: PersonalContextEngineOutput;
  partyNames?: { a: string; b: string };
  psychScores?: Record<string, number>;
}): DomainLensEvaluation<WorkLensId>[] {
  const { facts, packets = [], personalCeA, personalCeB, partyNames } = params;
  const nameA = partyNames?.a ?? "동료 A";
  const nameB = partyNames?.b ?? "동료 B";
  const unknownHour = facts.birth_time_unknown_a || facts.birth_time_unknown_b;

  const crossHits = facts.cross_hits ?? [];
  const stemCombines = crossHits.filter((h) => h.type === "천간합");
  const stemClashes = crossHits.filter((h) => h.type === "천간충");
  const branchCombines = crossHits.filter((h) => ["육합", "삼합", "반합"].includes(h.type));
  const branchClashes = crossHits.filter((h) => ["충", "형", "파", "해"].includes(h.type));
  const wonjinHits = crossHits.filter((h) => ["원진", "귀문"].includes(h.type));
  const trioHits = facts.trio_hits ?? [];
  const elementFlow = facts.element_flow;

  const profA = personalCeA?.aggregates?.relational_profile;
  const profB = personalCeB?.aggregates?.relational_profile;
  const countsA = personalCeA?.aggregates?.ten_god_stem_counts ?? {};
  const countsB = personalCeB?.aggregates?.ten_god_stem_counts ?? {};

  const workSignalsA: WorkSajuSignals | undefined = Object.keys(countsA).length > 0 ? {
    month_geokguk: {
      month_stem_ten_god_ko: null,
      month_stem_category: "self",
      geokguk_label_ko: "기본",
      month_branch_element: "earth",
      day_master_element_support: true,
    },
    drive_stubborn: {
      officer_count: (countsA["정관"] ?? 0) + (countsA["편관"] ?? 0),
      self_count: (countsA["비견"] ?? 0) + (countsA["겁재"] ?? 0),
      seal_count: (countsA["정인"] ?? 0) + (countsA["편인"] ?? 0),
      wealth_count: (countsA["정재"] ?? 0) + (countsA["편재"] ?? 0),
      food_count: (countsA["식신"] ?? 0) + (countsA["상관"] ?? 0),
      food_intensity: 50,
      self_intensity: 50,
      drive_band: "balanced",
      stubborn_band: "balanced",
    },
    literary_noble: {
      has_munchang_guin: false,
      has_jangseong_sal: false,
      has_cheoneul_guin: false,
      noble_star_hits: [],
      work_support_index: 50,
    },
    johu_profile: {
      heat_score: 50,
      moisture_score: 50,
      temperature_band: "neutral",
      dominant_element: "earth",
    },
  } : undefined;

  const workSignalsB: WorkSajuSignals | undefined = Object.keys(countsB).length > 0 ? {
    month_geokguk: {
      month_stem_ten_god_ko: null,
      month_stem_category: "self",
      geokguk_label_ko: "기본",
      month_branch_element: "earth",
      day_master_element_support: true,
    },
    drive_stubborn: {
      officer_count: (countsB["정관"] ?? 0) + (countsB["편관"] ?? 0),
      self_count: (countsB["비견"] ?? 0) + (countsB["겁재"] ?? 0),
      seal_count: (countsB["정인"] ?? 0) + (countsB["편인"] ?? 0),
      wealth_count: (countsB["정재"] ?? 0) + (countsB["편재"] ?? 0),
      food_count: (countsB["식신"] ?? 0) + (countsB["상관"] ?? 0),
      food_intensity: 50,
      self_intensity: 50,
      drive_band: "balanced",
      stubborn_band: "balanced",
    },
    literary_noble: {
      has_munchang_guin: false,
      has_jangseong_sal: false,
      has_cheoneul_guin: false,
      noble_star_hits: [],
      work_support_index: 50,
    },
    johu_profile: {
      heat_score: 50,
      moisture_score: 50,
      temperature_band: "neutral",
      dominant_element: "earth",
    },
  } : undefined;

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
    resolveTenGodDomainExpression({ god, domain: "work", isTension });

  const evaluations: DomainLensEvaluation<WorkLensId>[] = [
    // 1. Work Leadership Split
    (() => {
      const canonicalPacket = resolveWorkLeadershipSplitCanonical({
        workSignalsA,
        workSignalsB,
        psychA: psychMasterA,
        psychB: psychMasterB,
        nicknameA: nameA,
        nicknameB: nameB,
        hasStemCombine: stemCombines.length > 0,
        hasFlow: Boolean(elementFlow && elementFlow.direction !== "none"),
        unknownHour,
      });

      if (canonicalPacket.status === "abstained") {
        return {
          lens_id: "work_leadership_split",
          domain: "work",
          user_question: "프로젝트를 리드할 때 대외적 방향 결정과 내부 실행 조율은 어떻게 나눌까?",
          emotional_outcome: "리더십 분담 지표 부족 (공동 합의)",
          canonical_meaning_id: "work_leadership_insufficient_evidence",
          headline_ko: "리더십 역할 분담에 대한 특이 지표가 확인되지 않습니다.",
          headline_en: "No pronounced indicators found for leadership division.",
          narrative_ko: "프로젝트별 특성과 전문성에 맞춰 유연하게 PM/PL 역할을 분담하길 권장합니다.",
          narrative_en: "Allocate strategic and tactical leadership fluidly based on project context.",
          confidence: "insufficient" as LensConfidenceLevel,
          tension_level: "low" as LensTensionLevel,
          is_abstaining: true,
          abstain_reason: "insufficient_evidence",
          directionality: { polarity: "symmetric", impact_on_a_ko: "공동 기획", impact_on_b_ko: "공동 실행" },
          primary_saju_evidence: [],
          supporting_packet_ids: [],
          personal_ce_contributions: {},
          llm_synthesis_allowance: {
            allowed_themes: ["유연한 분담", "R&R 합의"],
            prohibited_claims: ["조직 와해", "권력 투쟁"],
          },
        };
      }

      const tgExpr = resolveGod("정관");
      const isCoArchitect = canonicalPacket.meaning_id === "work_leadership_co_architect";

      return {
        lens_id: "work_leadership_split",
        domain: "work",
        user_question: "프로젝트를 리드할 때 대외적 방향 결정과 내부 실행 조율은 어떻게 나눌까?",
        emotional_outcome: "주도권 다툼 없이 비전 제시와 디테일 실행이 완벽하게 맞물리는 원팀 리더십",
        canonical_meaning_id: canonicalPacket.meaning_id,
        headline_ko: isCoArchitect
          ? `${nameA}와(과) ${nameB}의 전략적 비전과 치밀한 운영이 결합된 원팀 리더십`
          : `${nameA}와(과) ${nameB}의 영역별 전문성을 상호 존중하는 역할 분담`,
        headline_en: isCoArchitect
          ? `Co-architect leadership seamlessly unifying high-level strategic vision with operational precision`
          : `Clear leadership division honoring domain expertise across planning and execution`,
        narrative_ko: isCoArchitect
          ? `${canonicalPacket.value.summary ?? "천간합의 가치관 일치로 한쪽이 방향성을 제시하고 다른 쪽이 로드맵을 체계화하는 완벽한 호흡을 보여줍니다."} ${tgExpr.selected_summary_ko}`
          : `${canonicalPacket.value.summary ?? "대외 커뮤니케이션과 내부 일정 조율을 분리하여 각자의 강점을 극대화하는 협업입니다."}`,
        narrative_en: `Structured leadership division prevents friction and accelerates milestone delivery.`,
        confidence: canonicalPacket.confidence,
        tension_level: canonicalPacket.status === "mixed" ? "moderate" : "low",
        directionality: deriveDirectionality(elementFlow, "전략 기획 및 의사결정 총괄", "프로세스 최적화 및 리소스 조율"),
        primary_saju_evidence: stemCombines.map((h) => ({ kind: "stem_combine" as const, description_ko: `${h.personA_pillar}×${h.personB_pillar} ${h.detail ?? h.type}` })),
        supporting_packet_ids: packets.filter((p) => p.group === "bonding").map((p) => p.packet_id),
        personal_ce_contributions: {
          a: profA ? [`expression_style:${profA.expression_style}`] : [],
          b: profB ? [`expression_style:${profB.expression_style}`] : [],
        },
        llm_synthesis_allowance: {
          allowed_themes: ["원팀 리더십", "R&R 명시", "전략과 실행"],
          prohibited_claims: tgExpr.prohibited_claims,
        },
      };
    })(),

    // 2. Work Task Execution
    (() => {
      const canonicalPacket = resolveWorkTaskExecutionCanonical({
        workSignalsA,
        workSignalsB,
        psychA: psychMasterA,
        psychB: psychMasterB,
        hasBranchCombine: branchCombines.length > 0,
        hasTrio: trioHits.length > 0,
        hasStemCombine: stemCombines.length > 0,
        nicknameA: nameA,
        nicknameB: nameB,
        unknownHour,
      });

      if (canonicalPacket.status === "abstained") {
        return {
          lens_id: "work_task_execution",
          domain: "work",
          user_question: "실제 업무를 쳐낼 때 마일스톤 관리와 마감 기한 핸드오프는 어떻게 맞출까?",
          emotional_outcome: "업무 실행 지표 부족 (기본 협업)",
          canonical_meaning_id: "work_execution_insufficient_evidence",
          headline_ko: "업무 실행 핸드오프에 대한 특이 결속 지표가 확인되지 않습니다.",
          headline_en: "No pronounced combine anchors found for operational milestone execution.",
          narrative_ko: "명확한 완료 정의(DoD)와 지라/노션 티켓 관리를 통해 체계적으로 협업하길 권장합니다.",
          narrative_en: "Maintain transparent milestone tracking through standard ticketing and documentation.",
          confidence: "insufficient" as LensConfidenceLevel,
          tension_level: "low" as LensTensionLevel,
          is_abstaining: true,
          abstain_reason: "insufficient_evidence",
          directionality: { polarity: "symmetric", impact_on_a_ko: "명확한 DoD 수립", impact_on_b_ko: "투명한 마일스톤 관리" },
          primary_saju_evidence: [],
          supporting_packet_ids: [],
          personal_ce_contributions: {},
          llm_synthesis_allowance: {
            allowed_themes: ["DoD 준수", "티켓 관리", "안정적 핸드오프"],
            prohibited_claims: ["납기 지연", "태업"],
          },
        };
      }

      const tgExpr = resolveGod("정재");
      const hasTrio = trioHits.length > 0;
      const isStrategic = canonicalPacket.meaning_id === "work_execution_strategic_cadence";

      return {
        lens_id: "work_task_execution",
        domain: "work",
        user_question: "실제 업무를 쳐낼 때 마일스톤 관리와 마감 기한 핸드오프는 어떻게 맞출까?",
        emotional_outcome: "일정 딜레이 없이 톱니바퀴처럼 빈틈없이 맞물리는 완벽한 태스크 핸드오프",
        canonical_meaning_id: canonicalPacket.meaning_id,
        headline_ko: isStrategic
          ? `${nameA}와(과) ${nameB}의 마일스톤 관리와 치밀한 스프린트 완주 호흡`
          : `${nameA}와(과) ${nameB}의 각자의 태스크를 우직하게 완수하는 안정적 핸드오프`,
        headline_en: isStrategic
          ? `High-velocity milestone cadence and flawless sprint execution bound by structural synergy`
          : `Reliable and disciplined task handoffs ensuring consistent release cadences`,
        narrative_ko: isStrategic
          ? `삼합과 육합의 결합력으로 인해 기획부터 QA까지 병목 현상 없이 부드러운 핸드오프가 일어납니다. ${tgExpr.selected_summary_ko}`
          : `서로의 작업 영역을 존중하며 정해진 기한 내에 결과물을 책임감 있게 전달합니다.`,
        narrative_en: `Synchronized execution rhythms prevent deployment bottlenecks.`,
        confidence: canonicalPacket.confidence,
        tension_level: "low",
        directionality: {
          polarity: "symmetric",
          impact_on_a_ko: "기획안 및 요구사항 명세 작성",
          impact_on_b_ko: "스프린트 개발 및 QA 패스",
        },
        primary_saju_evidence: [
          ...branchCombines.map((h) => ({ kind: "branch_combine" as const, description_ko: `${h.personA_pillar}×${h.personB_pillar} ${h.detail ?? h.type}` })),
          ...trioHits.map((h) => ({ kind: "branch_trio" as const, description_ko: `삼합/방합: ${h.name}` })),
        ],
        supporting_packet_ids: packets.filter((p) => p.group === "bonding" || p.group === "structure").map((p) => p.packet_id),
        personal_ce_contributions: {
          a: profA ? [`structure_spontaneity:${profA.structure_spontaneity}`] : [],
          b: profB ? [`structure_spontaneity:${profB.structure_spontaneity}`] : [],
        },
        llm_synthesis_allowance: {
          allowed_themes: ["스프린트 완주", "병목 제로", "치밀한 핸드오프"],
          prohibited_claims: tgExpr.prohibited_claims,
        },
      };
    })(),

    // 3. Work Feedback Cushion
    (() => {
      const canonicalPacket = resolveWorkFeedbackCushionCanonical({
        nicknameA: nameA,
        nicknameB: nameB,
        psychA: psychMasterA,
        psychB: psychMasterB,
        hasStemClash: stemClashes.length > 0,
        hasBranchClash: branchClashes.length > 0,
        unknownHour,
      });

      if (canonicalPacket.status === "abstained") {
        return {
          lens_id: "work_feedback_cushion",
          domain: "work",
          user_question: "코드 리뷰나 업무 피드백을 주고받을 때 감정 상하지 않는 쿠션 화법은?",
          emotional_outcome: "피드백 긴장 지표 부족 (기본 존중)",
          canonical_meaning_id: "work_feedback_insufficient_evidence",
          headline_ko: "피드백 소통에 대한 특이 긴장 지표가 확인되지 않습니다.",
          headline_en: "No pronounced friction indicators found for feedback delivery.",
          narrative_ko: "객관적인 팩트와 명확한 제안을 중심으로 건설적인 피드백을 나누길 권장합니다.",
          narrative_en: "Maintain constructive feedback through objective code and document reviews.",
          confidence: "insufficient" as LensConfidenceLevel,
          tension_level: "low" as LensTensionLevel,
          is_abstaining: true,
          abstain_reason: "insufficient_evidence",
          directionality: { polarity: "symmetric", impact_on_a_ko: "명확한 제안", impact_on_b_ko: "열린 수용" },
          primary_saju_evidence: [],
          supporting_packet_ids: [],
          personal_ce_contributions: {},
          llm_synthesis_allowance: {
            allowed_themes: ["건설적 피드백", "객관적 검토"],
            prohibited_claims: ["인신공격", "비난"],
          },
        };
      }

      const tgExpr = resolveGod("편관", true);
      const isObjectiveCushion = canonicalPacket.meaning_id === "work_feedback_objective_cushion";

      return {
        lens_id: "work_feedback_cushion",
        domain: "work",
        user_question: "코드 리뷰나 업무 피드백을 주고받을 때 감정 상하지 않는 쿠션 화법은?",
        emotional_outcome: "방어적 태도 없이 제품 퀄리티만을 위해 치열하고 솔직하게 피드백하는 문화 정착",
        canonical_meaning_id: canonicalPacket.meaning_id,
        headline_ko: isObjectiveCushion
          ? `${nameA}와(과) ${nameB}의 인신공격 배제 및 데이터 기반 객관적 피드백 프로토콜`
          : `${nameA}와(과) ${nameB}의 PR 템플릿과 정형화된 루브릭 기반의 안전한 리뷰`,
        headline_en: isObjectiveCushion
          ? `Blameless, data-driven code review and feedback protocols mitigating cognitive friction`
          : `Safe and standardized PR review rubric fostering psychological safety`,
        narrative_ko: isObjectiveCushion
          ? `천간충의 언어적 직설성으로 인해 '사람'이 아닌 '코드/데이터'에 초점을 맞추는 쿠션어가 필수적입니다. ${tgExpr.selected_summary_ko}`
          : `정형화된 체크리스트를 활용하여 주관적 감정을 배제하고 명확한 기준에 따라 피드백을 전달합니다.`,
        narrative_en: `Structured feedback rubrics separate professional critique from personal defensiveness.`,
        confidence: canonicalPacket.confidence,
        tension_level: canonicalPacket.status === "mixed" ? "moderate" : "low",
        directionality: {
          polarity: "symmetric",
          impact_on_a_ko: "질문형 리뷰(PBI) 제안 및 칭찬 선행",
          impact_on_b_ko: "기술적 근거 제시 및 신속한 반영",
        },
        primary_saju_evidence: stemClashes.map((h) => ({ kind: "stem_clash" as const, description_ko: `${h.personA_pillar}×${h.personB_pillar} ${h.detail ?? h.type}` })),
        supporting_packet_ids: packets.filter((p) => p.group === "friction").map((p) => p.packet_id),
        personal_ce_contributions: {
          a: profA ? [`criticism_sensitivity:${profA.criticism_sensitivity}`] : [],
          b: profB ? [`criticism_sensitivity:${profB.criticism_sensitivity}`] : [],
        },
        llm_synthesis_allowance: {
          allowed_themes: ["쿠션어", "블레임리스", "데이터 기반 리뷰"],
          prohibited_claims: tgExpr.prohibited_claims,
        },
      };
    })(),

    // 4. Work Micromanage Guard
    (() => {
      const canonicalPacket = resolveWorkMicromanageGuardCanonical({
        dayBranchCrossHits: branchClashes,
        psychA: psychMasterA,
        psychB: psychMasterB,
        nicknameA: nameA,
        nicknameB: nameB,
        hasWonjin: wonjinHits.length > 0,
        unknownHour,
      });

      if (canonicalPacket.status === "abstained") {
        return {
          lens_id: "work_micromanage_guard",
          domain: "work",
          user_question: "지나친 간섭이나 불신 없이 각자의 오너십과 자율성을 보장하는 경계선은?",
          emotional_outcome: "오너십 경계 지표 부족 (기본 신뢰)",
          canonical_meaning_id: "work_autonomy_insufficient_evidence",
          headline_ko: "자율성 침해나 마이크로매니징 지표가 확인되지 않습니다.",
          headline_en: "No pronounced friction found regarding micromanagement or autonomy.",
          narrative_ko: "각자의 책임 영역을 신뢰하며 정기적인 싱크 미팅으로 정합성을 맞추길 권장합니다.",
          narrative_en: "Preserve professional autonomy through trust and regular sprint syncs.",
          confidence: "insufficient" as LensConfidenceLevel,
          tension_level: "low" as LensTensionLevel,
          is_abstaining: true,
          abstain_reason: "insufficient_evidence",
          directionality: { polarity: "symmetric", impact_on_a_ko: "자율성 보장", impact_on_b_ko: "자율성 보장" },
          primary_saju_evidence: [],
          supporting_packet_ids: [],
          personal_ce_contributions: {},
          llm_synthesis_allowance: {
            allowed_themes: ["자율성 보장", "정기 싱크"],
            prohibited_claims: ["감시", "불신"],
          },
        };
      }

      const tgExpr = resolveGod("편인");
      const isAsyncScrum = canonicalPacket.meaning_id === "work_autonomy_asynchronous_scrum";

      return {
        lens_id: "work_micromanage_guard",
        domain: "work",
        user_question: "지나친 간섭이나 불신 없이 각자의 오너십과 자율성을 보장하는 경계선은?",
        emotional_outcome: "사소한 과정 체크에 시달리지 않고 결과로 증명하는 완벽한 심리적 안전감",
        canonical_meaning_id: canonicalPacket.meaning_id,
        headline_ko: isAsyncScrum
          ? `${nameA}와(과) ${nameB}의 과정 간섭 배제와 비동기 결과 중심 스크럼 체계`
          : `${nameA}와(과) ${nameB}의 상호 오너십을 100% 신뢰하는 자율적 업무 환경`,
        headline_en: isAsyncScrum
          ? `High-autonomy asynchronous pod eliminating micromanagement friction through outcome-based reporting`
          : `Autonomous workspace built on mutual domain trust and end-to-end ownership`,
        narrative_ko: isAsyncScrum
          ? `원진/귀문의 민감성으로 인해 수시 구두 확인보다 슬랙/지라를 통한 비동기 상태 공유가 훨씬 높은 몰입도를 만듭니다. ${tgExpr.selected_summary_ko}`
          : `각자가 맡은 모듈에 대해 전권을 위임하고 결과물로 소통하여 최고의 자율성을 보장합니다.`,
        narrative_en: `Outcome-driven autonomy prevents process fatigue and boosts engineering velocity.`,
        confidence: canonicalPacket.confidence,
        tension_level: canonicalPacket.status === "mixed" ? "moderate" : "low",
        directionality: {
          polarity: "symmetric",
          impact_on_a_ko: "과정 간섭 금지 및 마일스톤 결과 확인",
          impact_on_b_ko: "비동기 상태 업데이트 및 블로커 즉시 공유",
        },
        primary_saju_evidence: wonjinHits.map((h) => ({ kind: "wonjin" as const, description_ko: `${h.personA_pillar}×${h.personB_pillar} ${h.detail ?? h.type}` })),
        supporting_packet_ids: packets.filter((p) => p.fact_kind === "wonjin_guimun").map((p) => p.packet_id),
        personal_ce_contributions: {
          a: profA ? [`boundary_defense_strength:${profA.boundary_defense_strength}`] : [],
          b: profB ? [`boundary_defense_strength:${profB.boundary_defense_strength}`] : [],
        },
        llm_synthesis_allowance: {
          allowed_themes: ["비동기 스크럼", "결과 중심", "오너십 위임"],
          prohibited_claims: tgExpr.prohibited_claims,
        },
      };
    })(),

    // 5. Work Stress Reaction
    (() => {
      const canonicalPacket = resolveWorkStressReactionCanonical({
        hasStemClash: stemClashes.length > 0,
        hasBranchClash: branchClashes.length > 0,
        elementFlow,
        unknownHour,
      });

      if (canonicalPacket.status === "abstained") {
        return {
          lens_id: "work_stress_reaction",
          domain: "work",
          user_question: "서버 장애, 배포 오류 등 긴급 장애 상황에서 패닉 없이 대응하는 룰은?",
          emotional_outcome: "스트레스 반응 지표 부족 (기본 침착)",
          canonical_meaning_id: "work_stress_insufficient_evidence",
          headline_ko: "긴급 상황 스트레스에 대한 특이 충돌 지표가 확인되지 않습니다.",
          headline_en: "No pronounced friction indicators found for high-stress incidents.",
          narrative_ko: "표준 온콜 런북과 역할 분담을 사전에 정의하여 위기에 대응하길 권장합니다.",
          narrative_en: "Follow standard on-call incident response playbooks collaboratively.",
          confidence: "insufficient" as LensConfidenceLevel,
          tension_level: "low" as LensTensionLevel,
          is_abstaining: true,
          abstain_reason: "insufficient_evidence",
          directionality: { polarity: "symmetric", impact_on_a_ko: "침착한 대응", impact_on_b_ko: "침착한 대응" },
          primary_saju_evidence: [],
          supporting_packet_ids: [],
          personal_ce_contributions: {},
          llm_synthesis_allowance: {
            allowed_themes: ["온콜 런북", "차분한 대응"],
            prohibited_claims: ["패닉", "장애 방치"],
          },
        };
      }

      const tgExpr = resolveGod("상관", true);
      const isBlameless = canonicalPacket.meaning_id === "work_stress_blameless_protocol";

      return {
        lens_id: "work_stress_reaction",
        domain: "work",
        user_question: "서버 장애, 배포 오류 등 긴급 장애 상황에서 패닉 없이 대응하는 룰은?",
        emotional_outcome: "위기 앞에서 서로 탓하지 않고 침착하게 롤백과 복구를 해내는 든든한 전우애",
        canonical_meaning_id: canonicalPacket.meaning_id,
        headline_ko: isBlameless
          ? `${nameA}와(과) ${nameB}의 긴급 장애 시 범인 찾기 금지 및 롤백 우선 원칙`
          : `${nameA}와(과) ${nameB}의 상황 전파와 핫픽스 롤백의 즉각적 2인 1조 분담`,
        headline_en: isBlameless
          ? `Blameless emergency on-call response prioritizing rapid rollback over fault-finding`
          : `Rapid incident triaging pairing hotfix release with customer mitigation`,
        narrative_ko: isBlameless
          ? `천간충의 압박 상황에서는 '누구 탓인가'를 따지기보다 즉각 서비스 정상화에만 집중하는 룰이 필수입니다. ${tgExpr.selected_summary_ko}`
          : `한쪽이 장애 원인을 파악하는 동안 다른 쪽이 커뮤니케이션과 배포를 맡아 신속하게 수습합니다.`,
        narrative_en: `Structured emergency protocols prevent blame culture and minimize mean time to recovery (MTTR).`,
        confidence: canonicalPacket.confidence,
        tension_level: canonicalPacket.status === "mixed" ? "moderate" : "low",
        directionality: {
          polarity: "symmetric",
          impact_on_a_ko: "로그 분석 및 핫픽스 코드 작성",
          impact_on_b_ko: "배포 파이프라인 트리거 및 대외 상황 공유",
        },
        primary_saju_evidence: [
          ...stemClashes.map((h) => ({ kind: "stem_clash" as const, description_ko: `${h.personA_pillar}×${h.personB_pillar} ${h.detail ?? h.type}` })),
          ...branchClashes.map((h) => ({ kind: "branch_clash" as const, description_ko: `${h.personA_pillar}×${h.personB_pillar} ${h.detail ?? h.type}` })),
        ],
        supporting_packet_ids: packets.filter((p) => p.group === "friction").map((p) => p.packet_id),
        personal_ce_contributions: {
          a: profA ? [`pressure_response:${profA.pressure_response}`] : [],
          b: profB ? [`pressure_response:${profB.pressure_response}`] : [],
        },
        llm_synthesis_allowance: {
          allowed_themes: ["블레임리스 포스트모텀", "롤백 우선", "온콜 2인1조"],
          prohibited_claims: tgExpr.prohibited_claims,
        },
      };
    })(),

    // 6. Work Decision Style
    (() => {
      const canonicalPacket = resolveWorkDecisionStyleCanonical({
        elementFlow,
        unknownHour,
      });

      if (canonicalPacket.status === "abstained") {
        return {
          lens_id: "work_decision_style",
          domain: "work",
          user_question: "데이터 기반 분석과 직관적 빠른 실행 사이의 의사결정 방식 충돌은?",
          emotional_outcome: "의사결정 스타일 지표 부족 (기본 균형)",
          canonical_meaning_id: "work_decision_insufficient_evidence",
          headline_ko: "의사결정 속도나 검증 방식에 대한 특이 비대칭이 확인되지 않습니다.",
          headline_en: "No pronounced asymmetries found in analytical versus intuitive decision heuristics.",
          narrative_ko: "데이터 검증과 신속한 가설 실험이 균형을 이루고 있는 조화로운 협업입니다.",
          narrative_en: "Balanced decision styles synthesize empirical validation with rapid prototyping.",
          confidence: "insufficient" as LensConfidenceLevel,
          tension_level: "low" as LensTensionLevel,
          is_abstaining: true,
          abstain_reason: "insufficient_evidence",
          directionality: { polarity: "symmetric", impact_on_a_ko: "균형 잡힌 판단", impact_on_b_ko: "균형 잡힌 판단" },
          primary_saju_evidence: [],
          supporting_packet_ids: [],
          personal_ce_contributions: {},
          llm_synthesis_allowance: {
            allowed_themes: ["데이터 분석", "가설 검증"],
            prohibited_claims: ["독단적 결정", "무능"],
          },
        };
      }

      const tgExpr = resolveGod("정재");
      const isDominantA = canonicalPacket.meaning_id === "work_decision_fast_prototype_drive";

      return {
        lens_id: "work_decision_style",
        domain: "work",
        user_question: "데이터 기반 분석과 직관적 빠른 실행 사이의 의사결정 방식 충돌은?",
        emotional_outcome: "탁상공론에 빠지지 않고 정밀한 데이터와 빠른 실행력이 결합된 완벽한 의사결정",
        canonical_meaning_id: canonicalPacket.meaning_id,
        headline_ko: isDominantA
          ? `${nameA}와(과) ${nameB}의 빠른 가설 검증과 프로토타입 실행 중심으로 돌파하는 의사결정`
          : `${nameA}와(과) ${nameB}의 가설 검증의 속도와 데이터 분석의 정밀함이 균형을 잡는 의사결정`,
        headline_en: isDominantA
          ? `Rapid prototyping and lean hypothesis testing driving decisive momentum`
          : `Heuristic balance combining rapid MVP hypothesis validation with rigorous metric analytics`,
        narrative_ko: `오행 상생의 흐름으로 한쪽이 신속하게 MVP를 만들어 실험하고 다른 쪽이 지표를 분석해 방향을 최적화합니다. ${tgExpr.selected_summary_ko}`,
        narrative_en: `Complementary decision styles prevent premature optimization while maintaining execution speed.`,
        confidence: canonicalPacket.confidence,
        tension_level: "low",
        directionality: deriveDirectionality(elementFlow, "가설 수립 및 신속한 프로토타이핑", "데이터 검증 및 리스크 사전 방어"),
        primary_saju_evidence: [{ kind: "element_flow", description_ko: `오행 상생 흐름: ${elementFlow?.interaction_code ?? elementFlow?.direction}` }],
        supporting_packet_ids: packets.filter((p) => p.fact_kind === "element_flow").map((p) => p.packet_id),
        personal_ce_contributions: {
          a: profA ? [`decision_pace:${profA.decision_pace}`] : [],
          b: profB ? [`decision_pace:${profB.decision_pace}`] : [],
        },
        llm_synthesis_allowance: {
          allowed_themes: ["A/B 테스트", "가설과 데이터", "신속한 프로토타입"],
          prohibited_claims: tgExpr.prohibited_claims,
        },
      };
    })(),

    // 7. Work Special Weapon
    (() => {
      const canonicalPacket = resolveWorkSpecialWeaponCanonical({
        hasBranchCombine: branchCombines.length > 0,
        hasStemCombine: stemCombines.length > 0,
        hasTrio: trioHits.length > 0,
        nicknameA: nameA,
        nicknameB: nameB,
        unknownHour,
      });

      if (canonicalPacket.status === "abstained") {
        return {
          lens_id: "work_special_weapon",
          domain: "work",
          user_question: "둘이 뭉쳤을 때 어떤 프로젝트나 과제도 뚫어내는 둘만의 필살 무기는?",
          emotional_outcome: "시너지 무기 지표 부족 (기본 성실)",
          canonical_meaning_id: "work_synergy_insufficient_evidence",
          headline_ko: "둘만의 특화된 슈퍼 파워 결합 지표가 확인되지 않습니다.",
          headline_en: "No pronounced combine anchors found for distinct cross-functional superpowers.",
          narrative_ko: "각자의 직무에서 우직하게 역할을 완수하며 안정적인 성과를 만들어내는 협업입니다.",
          narrative_en: "Reliable professional teamwork delivering steady output across routine tasks.",
          confidence: "insufficient" as LensConfidenceLevel,
          tension_level: "low" as LensTensionLevel,
          is_abstaining: true,
          abstain_reason: "insufficient_evidence",
          directionality: { polarity: "symmetric", impact_on_a_ko: "성실한 실행", impact_on_b_ko: "성실한 실행" },
          primary_saju_evidence: [],
          supporting_packet_ids: [],
          personal_ce_contributions: {},
          llm_synthesis_allowance: {
            allowed_themes: ["안정적 협업", "성실한 실행"],
            prohibited_claims: ["성과 부재", "실패"],
          },
        };
      }

      const tgExpr = resolveGod("식신");
      const isCrossFunctional = canonicalPacket.meaning_id === "work_synergy_cross_functional_power";

      return {
        lens_id: "work_special_weapon",
        domain: "work",
        user_question: "둘이 뭉쳤을 때 어떤 프로젝트나 과제도 뚫어내는 둘만의 필살 무기는?",
        emotional_outcome: "고난도 기술 블로커나 불가능한 일정 앞에서도 판을 뒤집는 둘만의 치명적 시너지",
        canonical_meaning_id: canonicalPacket.meaning_id,
        headline_ko: isCrossFunctional
          ? `${nameA}와(과) ${nameB}의 기획력과 실행력이 결합되어 불가능한 납기도 뚫어내는 전사적 시너지`
          : `${nameA}와(과) ${nameB}의 각자의 역할을 우직하게 완수하여 끝내 목표를 달성하는 견고한 협업`,
        headline_en: isCrossFunctional
          ? `Cross-functional superpower fusing visionary scoping with high-output execution to break high blockers`
          : `Steadfast and reliable partnership achieving ambitious project milestones through discipline`,
        narrative_ko: isCrossFunctional
          ? `삼합/육합의 강력한 결합력은 기술적 난제나 촉박한 일정 앞에서도 완벽한 분업으로 돌파구를 만들어냅니다. ${tgExpr.selected_summary_ko}`
          : `서로의 사각지대를 메워주며 어떤 프로젝트든 끝까지 완주해내는 단단한 신뢰가 둘의 무기입니다.`,
        narrative_en: `Structural astrological harmony creates immense cross-functional leverage.`,
        confidence: canonicalPacket.confidence,
        tension_level: "low",
        directionality: {
          polarity: "symmetric",
          impact_on_a_ko: "아키텍처 설계 및 핵심 로직 구현",
          impact_on_b_ko: "인프라 최적화 및 프로덕션 안정화",
        },
        primary_saju_evidence: [
          ...branchCombines.map((h) => ({ kind: "branch_combine" as const, description_ko: `${h.personA_pillar}×${h.personB_pillar} ${h.detail ?? h.type}` })),
          ...trioHits.map((h) => ({ kind: "branch_trio" as const, description_ko: `삼합/방합: ${h.name}` })),
        ],
        supporting_packet_ids: packets.filter((p) => p.group === "bonding" || p.group === "structure").map((p) => p.packet_id),
        personal_ce_contributions: {},
        llm_synthesis_allowance: {
          allowed_themes: ["필살 무기", "블로커 돌파", "페어 오너십"],
          prohibited_claims: tgExpr.prohibited_claims,
        },
      };
    })(),

    // 8. Work Burnout Recovery
    (() => {
      const canonicalPacket = resolveWorkBurnoutRecoveryCanonical({
        hasBranchCombine: branchCombines.length > 0,
        elementFlow,
        unknownHour,
      });

      if (canonicalPacket.status === "abstained") {
        return {
          lens_id: "work_burnout_recovery",
          domain: "work",
          user_question: "업무 과부하나 번아웃이 왔을 때 서로를 지치지 않게 지탱해 주는 회복법은?",
          emotional_outcome: "번아웃 회복 지표 부족 (중립 확인)",
          canonical_meaning_id: "work_burnout_insufficient_evidence",
          headline_ko: "업무 번아웃 회복에 대한 특이 결속 지표가 확인되지 않습니다.",
          headline_en: "No pronounced combine anchors found for sustainable burnout pacing.",
          narrative_ko: "개인별 연차 사용과 지속 가능한 업무 템포 유지를 통해 번아웃을 예방하길 권장합니다.",
          narrative_en: "Maintain sustainable pacing through regular leave and balanced workload allocation.",
          confidence: "insufficient" as LensConfidenceLevel,
          tension_level: "low" as LensTensionLevel,
          is_abstaining: true,
          abstain_reason: "insufficient_evidence",
          directionality: { polarity: "symmetric", impact_on_a_ko: "페이스 유지", impact_on_b_ko: "페이스 유지" },
          primary_saju_evidence: [],
          supporting_packet_ids: [],
          personal_ce_contributions: {},
          llm_synthesis_allowance: {
            allowed_themes: ["지속 가능한 페이스", "휴식 권장"],
            prohibited_claims: ["퇴사", "번아웃 방치"],
          },
        };
      }

      const tgExpr = resolveGod("정인");
      const hasCombine = canonicalPacket.meaning_id === "work_burnout_sustainable_pacing";

      return {
        lens_id: "work_burnout_recovery",
        domain: "work",
        user_question: "업무 과부하나 번아웃이 왔을 때 서로를 지치지 않게 지탱해 주는 회복법은?",
        emotional_outcome: "한쪽이 지쳤을 때 묵묵히 백업해 주며 롱런할 수 있도록 지켜주는 든든한 동료애",
        canonical_meaning_id: canonicalPacket.meaning_id,
        headline_ko: hasCombine
          ? `${nameA}와(과) ${nameB}의 동료의 과부하를 먼저 알아채고 업무를 백업해 주는 성숙한 동료애`
          : `${nameA}와(과) ${nameB}의 커피 한잔과 따뜻한 응원으로 지친 일상에 활력을 불어넣는 쉼표`,
        headline_en: hasCombine
          ? `Mature peer solidarity proactively sensing workload overload and providing temporary task backups`
          : `Restorative coffee chats and sincere encouragement injecting vitality into exhausting sprints`,
        narrative_ko: hasCombine
          ? `지지 합의 끈끈함으로 인해 스프린트 막바지에 동료의 지친 기색을 먼저 알아채고 티켓을 분담해 줍니다. ${tgExpr.selected_summary_ko}`
          : `따뜻한 응원과 공감으로 지친 멘탈을 다독이며 지속 가능한 개발 페이스를 유지하도록 돕습니다.`,
        narrative_en: `Proactive mutual backup prevents chronic developer burnout and boosts retention.`,
        confidence: canonicalPacket.confidence,
        tension_level: "low",
        directionality: deriveDirectionality(elementFlow, "휴식 권유 및 긴급 태스크 백업", "에너지 재충전 및 팀 복귀"),
        primary_saju_evidence: branchCombines.map((h) => ({ kind: "branch_combine" as const, description_ko: `${h.personA_pillar}×${h.personB_pillar} ${h.detail ?? h.type}` })),
        supporting_packet_ids: packets.filter((p) => p.group === "bonding").map((p) => p.packet_id),
        personal_ce_contributions: {
          a: profA ? [`pressure_response:${profA.pressure_response}`] : [],
          b: profB ? [`pressure_response:${profB.pressure_response}`] : [],
        },
        llm_synthesis_allowance: {
          allowed_themes: ["태스크 백업", "지속 가능한 롱런", "따뜻한 배려"],
          prohibited_claims: tgExpr.prohibited_claims,
        },
      };
    })(),
  ];

  return evaluations;
}
