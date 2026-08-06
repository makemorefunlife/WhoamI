/**
 * Domain Story Planner Input Builder
 *
 * Prepares the strictly typed, filtered input payload for the 7-scene Story Planner.
 * Extracts grounded claims, evidence boundaries, and prohibited claims from 
 * the canonical Domain Lens evaluations.
 */

import type { PairSajuFacts } from "../../personCore/pairSaju/types";
import type {
  DomainLensEvaluation,
  DomainStoryPlannerInput,
} from "./types";
import type { DomainPairLensId } from "../../personCore/pairContextEngine/types";

export function buildDomainStoryPlannerInput(params: {
  domain: DomainPairLensId;
  facts: PairSajuFacts;
  evaluations: DomainLensEvaluation[];
  partyNames?: { a: string; b: string };
  roleLabels?: { a: string; b: string };
}): DomainStoryPlannerInput {
  const { domain, facts, evaluations, partyNames, roleLabels } = params;

  const groundedLenses = evaluations.filter((e) => !e.is_abstaining);
  const abstainedLenses = evaluations.filter((e) => e.is_abstaining);

  // Aggregate all allowed themes and synthesis bullet points
  const allowedSynthesisPoints = groundedLenses.flatMap(
    (e) => e.llm_synthesis_allowance.allowed_themes
  );

  // Deduplicate and aggregate prohibited claims
  const prohibitedClaims = Array.from(
    new Set(evaluations.flatMap((e) => e.llm_synthesis_allowance.prohibited_claims))
  );

  // Calculate overall confidence (lowest of active lenses, or medium fallback)
  const confLevels = groundedLenses.map((e) => e.confidence);
  const overallConfidence =
    confLevels.includes("low") || facts.birth_time_unknown_a || facts.birth_time_unknown_b
      ? "low"
      : confLevels.includes("medium")
      ? "medium"
      : confLevels.length > 0
      ? "high"
      : "insufficient";

  const highConfidenceCount = groundedLenses.filter((e) => e.confidence === "high").length;
  const primaryTension = evaluations.find((e) => e.tension_level === "high" || e.tension_level === "critical");
  const primarySynergy = evaluations.find((e) => e.tension_level === "low" && e.confidence === "high");

  const chunkSize = Math.ceil(evaluations.length / 3);
  const chapterDefs = [
    {
      id: "ch1_core_bond",
      title_ko: "핵심 결속과 본질적 끌림",
      title_en: "Core Attachment & Synergy",
      summary_ko: "두 사람의 기질과 사주 원국이 만들어내는 근본적인 끌림과 결속력",
      summary_en: "Foundational attraction and bonding energy between the two charts",
      synthesis_guide_ko: "원국의 합과 오행 생조 흐름을 중심으로 본질적 안정감을 해석합니다.",
      synthesis_guide_en: "Synthesize foundational stability from chart combines and supportive flows.",
    },
    {
      id: "ch2_daily_dynamics",
      title_ko: "일상 역동과 상호 역할 분담",
      title_en: "Daily Dynamics & Operating Roles",
      summary_ko: "생활 공간과 실무 현장에서 나타나는 의사소통, 자원 관리 및 역할 조율",
      summary_en: "Daily communication, resource governance, and task coordination",
      synthesis_guide_ko: "십신 및 층위별 상호작용을 기반으로 일상적인 조율 패턴을 조명합니다.",
      synthesis_guide_en: "Highlight daily coordination dynamics grounded in Ten-God and layer interactions.",
    },
    {
      id: "ch3_conflict_safeguards",
      title_ko: "갈등 안전장치와 장기적 시너지",
      title_en: "Conflict Safeguards & Longterm Synergy",
      summary_ko: "충·원진 등 긴장 뇌관을 해독하고 위기 시 회복탄력성을 확보하는 안전장치",
      summary_en: "Conflict resolution buffers and long-term relational resilience",
      synthesis_guide_ko: "긴장 요인을 객관적으로 짚고 실천 가능한 대화법과 안전장치를 제시합니다.",
      synthesis_guide_en: "Objectively identify friction points and provide actionable communication safeguards.",
    },
  ];

  const chapters = chapterDefs.map((def, idx) => {
    const start = idx * chunkSize;
    const end = idx === 2 ? evaluations.length : Math.min(start + chunkSize, evaluations.length);
    const slice = evaluations.slice(start, end);
    return {
      chapter_id: def.id,
      title_ko: def.title_ko,
      title_en: def.title_en,
      summary_ko: def.summary_ko,
      summary_en: def.summary_en,
      lens_evaluations: slice,
      synthesis_guide_ko: def.synthesis_guide_ko,
      synthesis_guide_en: def.synthesis_guide_en,
    };
  });

  return {
    schema_version: "domain_story_planner_v1",
    domain,
    parties: {
      a_name: partyNames?.a ?? "A",
      b_name: partyNames?.b ?? "B",
      a_role_label: roleLabels?.a,
      b_role_label: roleLabels?.b,
    },
    overall_confidence: overallConfidence,
    birth_time_unknown_a: Boolean(facts.birth_time_unknown_a),
    birth_time_unknown_b: Boolean(facts.birth_time_unknown_b),
    chapters,
    grounding_summary: {
      total_lenses_evaluated: evaluations.length,
      high_confidence_count: highConfidenceCount,
      abstaining_count: abstainedLenses.length,
      dominant_element_dynamic: "standard",
      primary_tension_lens_id: primaryTension?.lens_id,
      primary_synergy_lens_id: primarySynergy?.lens_id,
    },
    evidence_boundary: {
      allowed_synthesis_bullet_points: allowedSynthesisPoints,
      strict_prohibitions: prohibitedClaims,
    },
  };
}
