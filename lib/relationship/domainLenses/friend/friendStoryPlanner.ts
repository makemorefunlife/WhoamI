/**
 * Friend Domain 7-Scene Story Planner
 *
 * Sequences evaluated Friend Domain Lenses into the 7 approved product scenes.
 * Does NOT recalculate Saju, Survey, or Lens math.
 * Does NOT author final narrative prose.
 * Maps canonical meaning packets and evidence into structured planning slots.
 */

import type { PairSajuFacts } from "../../../personCore/pairSaju/types";
import type { DomainLensEvaluation, LensConfidenceLevel } from "../types";
import type {
  DomainStoryPlan,
  DomainStoryScene,
  DomainStorySceneNumber,
  StoryBeats,
} from "../storyPlannerTypes";
import { makeCanonicalPacket } from "../canonicalPackets";

function buildSceneFromEvaluations(params: {
  scene_number: DomainStorySceneNumber;
  scene_id: string;
  title_ko: string;
  title_en: string;
  primaryLensId: string;
  contributingLensIds?: string[];
  evalMap: Map<string, DomainLensEvaluation>;
}): DomainStoryScene {
  const {
    scene_number,
    scene_id,
    title_ko,
    title_en,
    primaryLensId,
    contributingLensIds = [],
    evalMap,
  } = params;

  const primary = evalMap.get(primaryLensId);
  const contribs = contributingLensIds
    .map((id) => evalMap.get(id))
    .filter((e): e is DomainLensEvaluation => Boolean(e));

  if (!primary) {
    return {
      scene_number,
      scene_id,
      title_ko,
      title_en,
      primary_lens_id: primaryLensId as any,
      contributing_lens_ids: contributingLensIds as any,
      canonical_meaning_id: null,
      canonical_packet: null,
      confidence: "insufficient",
      directionality: {
        polarity: "symmetric",
        impact_on_a_ko: "근거 데이터 부족으로 판단 유보",
        impact_on_b_ko: "근거 데이터 부족으로 판단 유보",
      },
      is_abstaining: true,
      abstain_reason: "insufficient_evidence",
      beats: {
        recognition: {
          canonical_meaning_ids: [],
          observable_contrast_facts: [],
          evidence_refs: [],
          required_v1_assets: [],
          observed_scene_focus: title_ko,
        },
        translation: {
          mechanism_ids: [],
          saju_source_attribution: [],
          survey_axis_attribution: [],
          directionality: {
            polarity: "symmetric",
            impact_on_a_ko: "",
            impact_on_b_ko: "",
          },
          tension_level: "low",
        },
        reframing: {
          protected_meaning: "",
          gift_to_cost_relationship: "",
          prohibited_generic_interpretations: [],
          allowed_themes: [],
        },
        action: {
          prescription_id: `${primaryLensId}_abstain`,
          prescription_keys: [],
          script_assets: [],
          role_rules: [],
          behavioral_assets: [],
        },
      },
    };
  }

  const allEvals = [primary, ...contribs];
  const allCanonicalMeaningIds = allEvals.map((e) => e.canonical_meaning_id);
  const allObservableFacts = allEvals.map((e) => e.headline_ko);
  const allEvidenceRefs = allEvals.flatMap((e) => e.primary_saju_evidence);
  const allV1Assets = allEvals
    .map((e) => e.recovered_v1_asset_id)
    .filter((id): id is string => Boolean(id));

  const allMechanismIds = Array.from(
    new Set(allEvals.flatMap((e) => e.supporting_packet_ids)),
  );
  const allSajuAttributions = allEvidenceRefs.map(
    (ev) => `${ev.kind}:${ev.pillar_slot ?? "pair"}`,
  );
  const allSurveyAttributions = allEvals.flatMap((e) => [
    ...(e.personal_ce_contributions.a ?? []),
    ...(e.personal_ce_contributions.b ?? []),
  ]);

  const allProhibitions = Array.from(
    new Set(allEvals.flatMap((e) => e.llm_synthesis_allowance.prohibited_claims)),
  );
  const allAllowedThemes = Array.from(
    new Set(allEvals.flatMap((e) => e.llm_synthesis_allowance.allowed_themes)),
  );

  const directionality = primary.directionality ?? {
    polarity: "symmetric",
    impact_on_a_ko: primary.narrative_ko,
    impact_on_b_ko: primary.narrative_ko,
  };

  const canonicalPacket = makeCanonicalPacket({
    meaning_id: primary.canonical_meaning_id,
    status: primary.is_abstaining ? "abstained" : "supported",
    confidence: primary.confidence,
    directionality: {
      polarity: directionality.polarity,
      lead_party: directionality.lead_party,
    },
    value: primary.canonical_meaning_id,
    evidence: primary.primary_saju_evidence.map((ev) => ev.kind),
    reason: primary.narrative_ko,
    is_abstaining: primary.is_abstaining,
    abstain_reason: primary.abstain_reason,
  });

  const beats: StoryBeats = {
    recognition: {
      canonical_meaning_ids: allCanonicalMeaningIds,
      observable_contrast_facts: allObservableFacts,
      evidence_refs: allEvidenceRefs,
      required_v1_assets: allV1Assets,
      observed_scene_focus: primary.user_question,
    },
    translation: {
      mechanism_ids: allMechanismIds,
      saju_source_attribution: Array.from(new Set(allSajuAttributions)),
      survey_axis_attribution: Array.from(new Set(allSurveyAttributions)),
      directionality,
      tension_level: primary.tension_level,
    },
    reframing: {
      protected_meaning: primary.narrative_ko,
      gift_to_cost_relationship: primary.emotional_outcome,
      prohibited_generic_interpretations: allProhibitions,
      allowed_themes: allAllowedThemes,
    },
    action: {
      prescription_id: primary.recovered_v1_asset_id
        ? `${primary.recovered_v1_asset_id}_prescription`
        : `${primary.lens_id}_action`,
      prescription_keys: [primary.lens_id, ...contributingLensIds],
      script_assets: [
        {
          title: primary.headline_ko,
          script_template_id: primary.canonical_meaning_id,
          category: "friend",
        },
      ],
      role_rules: directionality.lead_party
        ? [`${directionality.lead_party}_leads_friendship_dynamic`]
        : ["balanced_friendship_cadence"],
      behavioral_assets: allAllowedThemes,
    },
  };

  return {
    scene_number,
    scene_id,
    title_ko,
    title_en,
    primary_lens_id: primary.lens_id,
    contributing_lens_ids: contributingLensIds as any,
    canonical_meaning_id: primary.canonical_meaning_id,
    canonical_packet: canonicalPacket,
    confidence: primary.confidence,
    directionality,
    is_abstaining: Boolean(primary.is_abstaining),
    abstain_reason: primary.abstain_reason,
    beats,
  };
}

export function buildFriendStoryPlan(params: {
  facts: PairSajuFacts;
  evaluations: DomainLensEvaluation[];
  partyNames?: { a: string; b: string };
  roleLabels?: { a: string; b: string };
}): DomainStoryPlan {
  const { facts, evaluations, partyNames, roleLabels } = params;
  const evalMap = new Map(evaluations.map((e) => [e.lens_id, e]));

  const nameA = partyNames?.a ?? "A";
  const nameB = partyNames?.b ?? "B";

  const scene1 = buildSceneFromEvaluations({
    scene_number: 1,
    scene_id: "friend_scene_1_vibe",
    title_ko: "첫 만남의 주파수와 시그니처 바이브",
    title_en: "First Vibe & Chemistry Resonance",
    primaryLensId: "friend_core_vibe",
    evalMap,
  });

  const scene2 = buildSceneFromEvaluations({
    scene_number: 2,
    scene_id: "friend_scene_2_taste",
    title_ko: "취향과 놀이 코드의 시너지",
    title_en: "Shared Taste & Play Code",
    primaryLensId: "friend_taste_shared",
    evalMap,
  });

  const scene3 = buildSceneFromEvaluations({
    scene_number: 3,
    scene_id: "friend_scene_3_treasurer",
    title_ko: "정산과 지출의 깔끔한 룰",
    title_en: "Expense Splitting & The Treasurer Rule",
    primaryLensId: "friend_treasurer_split",
    evalMap,
  });

  const scene4 = buildSceneFromEvaluations({
    scene_number: 4,
    scene_id: "friend_scene_4_travel",
    title_ko: "여행과 일정 기획의 핑퐁",
    title_en: "Travel Planning & Pace Harmony",
    primaryLensId: "friend_travel_lead",
    evalMap,
  });

  const scene5 = buildSceneFromEvaluations({
    scene_number: 5,
    scene_id: "friend_scene_5_emotional_vent",
    title_ko: "속마음 토로와 위로의 언어",
    title_en: "Emotional Venting & Listening Cadence",
    primaryLensId: "friend_emotional_vent",
    evalMap,
  });

  const scene6 = buildSceneFromEvaluations({
    scene_number: 6,
    scene_id: "friend_scene_6_distance_jealousy",
    title_ko: "편안한 거리감과 성장의 축복",
    title_en: "Comfort Distance & Growth Security",
    primaryLensId: "friend_comfort_distance",
    contributingLensIds: ["friend_jealousy_guard"],
    evalMap,
  });

  const scene7 = buildSceneFromEvaluations({
    scene_number: 7,
    scene_id: "friend_scene_7_repair",
    title_ko: "서운함 해소와 쿨한 회복 스크립트",
    title_en: "De-escalation & Restorative Repair",
    primaryLensId: "friend_repair_reconciliation",
    evalMap,
  });

  const scenes: [
    DomainStoryScene,
    DomainStoryScene,
    DomainStoryScene,
    DomainStoryScene,
    DomainStoryScene,
    DomainStoryScene,
    DomainStoryScene,
  ] = [scene1, scene2, scene3, scene4, scene5, scene6, scene7];

  const overallConfidence: LensConfidenceLevel =
    facts.birth_time_unknown_a || facts.birth_time_unknown_b
      ? "medium"
      : "high";

  const highConfidenceCount = scenes.filter(
    (s) => s.confidence === "high" || s.confidence === "medium",
  ).length;
  const abstainingCount = scenes.filter((s) => s.is_abstaining).length;

  const allowedBulletPoints = Array.from(
    new Set(scenes.flatMap((s) => s.beats.reframing.allowed_themes)),
  );
  const strictProhibitions = Array.from(
    new Set(
      scenes.flatMap(
        (s) => s.beats.reframing.prohibited_generic_interpretations,
      ),
    ),
  );

  const primaryTension = scenes.find(
    (s) => s.beats.translation.tension_level === "high" || s.beats.translation.tension_level === "critical",
  );
  const primarySynergy = scenes.find(
    (s) => s.beats.translation.tension_level === "low" && s.confidence === "high",
  );

  return {
    schema_version: "domain_7_scene_story_plan_v1",
    domain: "friend",
    parties: {
      a_name: nameA,
      b_name: nameB,
      a_role_label: roleLabels?.a,
      b_role_label: roleLabels?.b,
    },
    overall_confidence: overallConfidence,
    birth_time_unknown_a: Boolean(facts.birth_time_unknown_a),
    birth_time_unknown_b: Boolean(facts.birth_time_unknown_b),
    scenes,
    grounding_summary: {
      total_scenes: 7,
      high_confidence_count: highConfidenceCount,
      abstaining_count: abstainingCount,
      dominant_element_dynamic:
        facts.element_flow?.interaction_label ?? "상호보완적 오행 흐름",
      primary_tension_scene_id: primaryTension?.scene_id,
      primary_synergy_scene_id: primarySynergy?.scene_id,
    },
    evidence_boundary: {
      allowed_synthesis_bullet_points: allowedBulletPoints,
      strict_prohibitions: strictProhibitions,
    },
  };
}
