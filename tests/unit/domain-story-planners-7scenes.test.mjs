/**
 * Domain 7-Scene Story Planners Characterization & Invariant Test Suite
 *
 * Validates the deterministic 7-scene Story Planners across:
 * - Friend (7 Scenes)
 * - Work (7 Scenes)
 * - Family (7 Scenes)
 * - Life Partner / Marriage (7 Scenes)
 *
 * Invariants Tested:
 * 1. Exactly 7 approved scenes per domain
 * 2. Exact approved scene IDs and order (1..7)
 * 3. Canonical packet identity, meaning_id, value, and status preservation
 * 4. V1 Gold asset references preserved
 * 5. Structured 4-beat contract (Recognition -> Translation -> Reframing -> Action) without free-form prose synthesis
 * 6. Action positioning rule (behavior tips, scripts, rules placed after recognition & translation)
 * 7. Evidence-sensitive abstention propagation
 * 8. Unknown-hour reliability downgrade propagation
 * 9. Directional A/B swap and symmetric invariance
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  evaluateFriendLenses,
  evaluateWorkLenses,
  evaluateFamilyLenses,
  evaluatePartnerLenses,
  buildFriendStoryPlan,
  buildWorkStoryPlan,
  buildFamilyStoryPlan,
  buildPartnerStoryPlan,
  buildDomain7SceneStoryPlan,
} from "../../lib/relationship/domainLenses/index.ts";

function createMockPairSajuFacts(overrides = {}) {
  return {
    cross_hits: [
      {
        type: "천간합",
        p1_pillar: "day",
        p2_pillar: "day",
        stems: ["갑", "기"],
        label: "갑기합",
      },
      {
        type: "육합",
        p1_pillar: "day",
        p2_pillar: "day",
        branches: ["자", "축"],
        label: "자축합",
      },
    ],
    stem_branch_interactions: [
      {
        type: "stem_combine",
        p1_pillar: "day",
        p2_pillar: "day",
        stems: ["갑", "기"],
        element_result: "토",
      },
      {
        type: "branch_combine_six",
        p1_pillar: "day",
        p2_pillar: "day",
        branches: ["자", "축"],
        element_result: "토",
      },
    ],
    element_flow: {
      p1_dominant_element: "wood",
      p2_dominant_element: "earth",
      flow_type: "complementary",
      interaction_label: "목극토 상호조화",
    },
    johu: {
      p1_temperature: "warm",
      p2_temperature: "cool",
      complementary: true,
      balance_score: 85,
    },
    birth_time_unknown_a: false,
    birth_time_unknown_b: false,
    ...overrides,
  };
}

function createMockPairPackets() {
  return [
    {
      packet_id: "pkg_core_combine",
      source: "pair_saju",
      category: "attraction_chemistry",
      confidence: "high",
      meaning_id: "stem_combine_day_day",
      raw_findings: ["갑기합 토 생성"],
    },
    {
      packet_id: "pkg_johu_balance",
      source: "pair_saju",
      category: "intimacy_temperature",
      confidence: "high",
      meaning_id: "johu_thermal_complement",
      raw_findings: ["한열 조후 조화"],
    },
  ];
}

test("Domain 7-Scene Story Planners Suite", async (t) => {

  // ==========================================================================
  // SECTION 1: Friend Domain (7 Scenes)
  // ==========================================================================
  await t.test("Friend Story Planner — Exactly 7 approved scenes & order", () => {
    const facts = createMockPairSajuFacts();
    const packets = createMockPairPackets();
    const evals = evaluateFriendLenses({ facts, packets });
    const plan = buildFriendStoryPlan({ facts, evaluations: evals, partyNames: { a: "철수", b: "영희" } });

    assert.equal(plan.schema_version, "domain_7_scene_story_plan_v1");
    assert.equal(plan.domain, "friend");
    assert.equal(plan.scenes.length, 7);
    assert.equal(plan.grounding_summary.total_scenes, 7);

    const expectedFriendSceneIds = [
      "friend_scene_1_vibe",
      "friend_scene_2_taste",
      "friend_scene_3_treasurer",
      "friend_scene_4_travel",
      "friend_scene_5_emotional_vent",
      "friend_scene_6_distance_jealousy",
      "friend_scene_7_repair",
    ];

    plan.scenes.forEach((scene, idx) => {
      assert.equal(scene.scene_number, idx + 1);
      assert.equal(scene.scene_id, expectedFriendSceneIds[idx]);
      assert.ok(scene.primary_lens_id, `Scene ${idx + 1} must have primary_lens_id`);
      assert.ok(scene.beats.recognition, `Scene ${idx + 1} must have recognition beat`);
      assert.ok(scene.beats.translation, `Scene ${idx + 1} must have translation beat`);
      assert.ok(scene.beats.reframing, `Scene ${idx + 1} must have reframing beat`);
      assert.ok(scene.beats.action, `Scene ${idx + 1} must have action beat`);
      assert.ok(scene.beats.action.prescription_id, `Scene ${idx + 1} must have prescription_id`);
    });

    // Verify Scene 6 includes friend_jealousy_guard as contributing lens
    const scene6 = plan.scenes[5];
    assert.equal(scene6.scene_id, "friend_scene_6_distance_jealousy");
    assert.deepEqual(scene6.contributing_lens_ids, ["friend_jealousy_guard"]);

    // Verify canonical packet preserved in scene 3 (Treasurer)
    const scene3 = plan.scenes[2];
    assert.equal(scene3.primary_lens_id, "friend_treasurer_split");
    assert.ok(scene3.canonical_packet);
    assert.ok(scene3.canonical_meaning_id);
    assert.equal(scene3.canonical_packet.meaning_id, scene3.canonical_meaning_id);
  });

  // ==========================================================================
  // SECTION 2: Work Domain (7 Scenes)
  // ==========================================================================
  await t.test("Work Story Planner — Exactly 7 approved scenes & order", () => {
    const facts = createMockPairSajuFacts();
    const packets = createMockPairPackets();
    const evals = evaluateWorkLenses({ facts, packets });
    const plan = buildWorkStoryPlan({ facts, evaluations: evals, partyNames: { a: "팀장", b: "팀원" } });

    assert.equal(plan.schema_version, "domain_7_scene_story_plan_v1");
    assert.equal(plan.domain, "work");
    assert.equal(plan.scenes.length, 7);

    const expectedWorkSceneIds = [
      "work_scene_1_leadership",
      "work_scene_2_execution",
      "work_scene_3_decision",
      "work_scene_4_synergy",
      "work_scene_5_autonomy",
      "work_scene_6_stress",
      "work_scene_7_feedback_recovery",
    ];

    plan.scenes.forEach((scene, idx) => {
      assert.equal(scene.scene_number, idx + 1);
      assert.equal(scene.scene_id, expectedWorkSceneIds[idx]);
      assert.ok(scene.primary_lens_id);
      assert.ok(scene.beats.recognition.canonical_meaning_ids.length > 0);
      assert.ok(scene.beats.action.prescription_id);
    });

    // Verify Scene 7 includes work_burnout_recovery
    const scene7 = plan.scenes[6];
    assert.equal(scene7.scene_id, "work_scene_7_feedback_recovery");
    assert.deepEqual(scene7.contributing_lens_ids, ["work_burnout_recovery"]);
  });

  // ==========================================================================
  // SECTION 3: Family Domain (7 Scenes)
  // ==========================================================================
  await t.test("Family Story Planner — Exactly 7 approved scenes & order", () => {
    const facts = createMockPairSajuFacts();
    const packets = createMockPairPackets();
    const evals = evaluateFamilyLenses({ facts, packets });
    const plan = buildFamilyStoryPlan({ facts, evaluations: evals, partyNames: { a: "엄마", b: "딸" } });

    assert.equal(plan.schema_version, "domain_7_scene_story_plan_v1");
    assert.equal(plan.domain, "family");
    assert.equal(plan.scenes.length, 7);

    const expectedFamilySceneIds = [
      "family_scene_1_core_dynamic",
      "family_scene_2_distance",
      "family_scene_3_hidden_needs",
      "family_scene_4_praise",
      "family_scene_5_household_roles",
      "family_scene_6_discipline_boundary",
      "family_scene_7_crisis_recovery",
    ];

    plan.scenes.forEach((scene, idx) => {
      assert.equal(scene.scene_number, idx + 1);
      assert.equal(scene.scene_id, expectedFamilySceneIds[idx]);
      assert.ok(scene.primary_lens_id);
    });

    // Verify Scene 6 includes family_safe_boundary
    const scene6 = plan.scenes[5];
    assert.equal(scene6.scene_id, "family_scene_6_discipline_boundary");
    assert.deepEqual(scene6.contributing_lens_ids, ["family_safe_boundary"]);
  });

  // ==========================================================================
  // SECTION 4: Life Partner Domain (10 Lenses -> 7 Scenes)
  // ==========================================================================
  await t.test("Partner Story Planner — Exactly 7 approved scenes & order", () => {
    const facts = createMockPairSajuFacts();
    const packets = createMockPairPackets();
    const evals = evaluatePartnerLenses({ facts, packets });
    const plan = buildPartnerStoryPlan({ facts, evaluations: evals, partyNames: { a: "남편", b: "아내" } });

    assert.equal(plan.schema_version, "domain_7_scene_story_plan_v1");
    assert.equal(plan.domain, "partner");
    assert.equal(plan.scenes.length, 7);

    const expectedPartnerSceneIds = [
      "partner_scene_1_foundational_bond",
      "partner_scene_2_cfo_finances",
      "partner_scene_3_home_living",
      "partner_scene_4_intimate_resonance",
      "partner_scene_5_conflict_protocol",
      "partner_scene_6_crisis_shield",
      "partner_scene_7_future_horizons",
    ];

    plan.scenes.forEach((scene, idx) => {
      assert.equal(scene.scene_number, idx + 1);
      assert.equal(scene.scene_id, expectedPartnerSceneIds[idx]);
      assert.ok(scene.primary_lens_id);
    });

    // Verify Scene 1 combines partner_core_bond + partner_tempo_rhythm
    assert.deepEqual(plan.scenes[0].contributing_lens_ids, ["partner_tempo_rhythm"]);
    // Verify Scene 3 combines partner_household_chores + partner_private_sanctuary
    assert.deepEqual(plan.scenes[2].contributing_lens_ids, ["partner_private_sanctuary"]);
    // Verify Scene 7 combines partner_longterm_vision + partner_parenting_alignment
    assert.deepEqual(plan.scenes[6].contributing_lens_ids, ["partner_parenting_alignment"]);
  });

  // ==========================================================================
  // SECTION 5: Unified Dispatcher Test
  // ==========================================================================
  await t.test("Unified buildDomain7SceneStoryPlan dispatcher", () => {
    const facts = createMockPairSajuFacts();
    const packets = createMockPairPackets();

    const friendEvals = evaluateFriendLenses({ facts, packets });
    const friendPlan = buildDomain7SceneStoryPlan({
      domain: "friend",
      facts,
      evaluations: friendEvals,
    });
    assert.equal(friendPlan.domain, "friend");
    assert.equal(friendPlan.scenes.length, 7);

    const workEvals = evaluateWorkLenses({ facts, packets });
    const workPlan = buildDomain7SceneStoryPlan({
      domain: "work",
      facts,
      evaluations: workEvals,
    });
    assert.equal(workPlan.domain, "work");
    assert.equal(workPlan.scenes.length, 7);

    const familyEvals = evaluateFamilyLenses({ facts, packets });
    const familyPlan = buildDomain7SceneStoryPlan({
      domain: "family",
      facts,
      evaluations: familyEvals,
    });
    assert.equal(familyPlan.domain, "family");
    assert.equal(familyPlan.scenes.length, 7);

    const partnerEvals = evaluatePartnerLenses({ facts, packets });
    const partnerPlan = buildDomain7SceneStoryPlan({
      domain: "partner",
      facts,
      evaluations: partnerEvals,
    });
    assert.equal(partnerPlan.domain, "partner");
    assert.equal(partnerPlan.scenes.length, 7);
  });

  // ==========================================================================
  // SECTION 6: Abstention & Missing Evidence Propagation
  // ==========================================================================
  await t.test("Abstention & Missing-Evidence Propagation", () => {
    // Empty facts simulate missing evidence
    const emptyFacts = {
      cross_hits: [],
      stem_branch_interactions: [],
      element_flow: null,
      johu: null,
      birth_time_unknown_a: false,
      birth_time_unknown_b: false,
    };
    const emptyPackets = [];

    const friendEvals = evaluateFriendLenses({ facts: emptyFacts, packets: emptyPackets });
    const plan = buildFriendStoryPlan({ facts: emptyFacts, evaluations: friendEvals });

    assert.ok(plan.grounding_summary.abstaining_count > 0, "Abstaining count should reflect missing facts");

    // All abstaining scenes should have is_abstaining = true and confidence = insufficient/low
    const abstainingScenes = plan.scenes.filter((s) => s.is_abstaining);
    abstainingScenes.forEach((scene) => {
      assert.equal(scene.is_abstaining, true);
      assert.ok(scene.confidence === "insufficient" || scene.confidence === "low");
      assert.ok(scene.abstain_reason);
    });
  });

  // ==========================================================================
  // SECTION 7: Unknown-Hour Reliability Downgrade Propagation
  // ==========================================================================
  await t.test("Unknown-Hour Reliability Downgrade Propagation", () => {
    const unknownHourFacts = createMockPairSajuFacts({
      birth_time_unknown_a: true,
      birth_time_unknown_b: false,
    });
    const packets = createMockPairPackets();
    const evals = evaluatePartnerLenses({ facts: unknownHourFacts, packets });
    const plan = buildPartnerStoryPlan({ facts: unknownHourFacts, evaluations: evals });

    assert.equal(plan.overall_confidence, "medium", "Unknown birth hour must downgrade overall confidence");
    assert.equal(plan.birth_time_unknown_a, true);
  });

  // ==========================================================================
  // SECTION 8: Directional A/B Inversion Behavior
  // ==========================================================================
  await t.test("Directional A/B Inversion in Scenes", () => {
    const factsA = createMockPairSajuFacts();
    const evalsA = evaluatePartnerLenses({
      facts: factsA,
      packets: createMockPairPackets(),
      personalCeA: {
        aggregates: {
          relational_profile: { resource_governance: "diligent_steward" },
          ten_god_stem_counts: { "정재": 2 },
        },
      },
      personalCeB: {
        aggregates: {
          relational_profile: { resource_governance: "opportunity_investor" },
          ten_god_stem_counts: {},
        },
      },
    });

    const planA = buildPartnerStoryPlan({ facts: factsA, evaluations: evalsA });
    const sceneCfoA = planA.scenes.find((s) => s.scene_id === "partner_scene_2_cfo_finances");
    assert.ok(sceneCfoA);
    assert.equal(sceneCfoA.directionality.lead_party, "A");

    // Invert facts (B has diligent steward, A has investor)
    const evalsB = evaluatePartnerLenses({
      facts: factsA,
      packets: createMockPairPackets(),
      personalCeA: {
        aggregates: {
          relational_profile: { resource_governance: "opportunity_investor" },
          ten_god_stem_counts: {},
        },
      },
      personalCeB: {
        aggregates: {
          relational_profile: { resource_governance: "diligent_steward" },
          ten_god_stem_counts: { "정재": 2 },
        },
      },
    });

    const planB = buildPartnerStoryPlan({ facts: factsA, evaluations: evalsB });
    const sceneCfoB = planB.scenes.find((s) => s.scene_id === "partner_scene_2_cfo_finances");
    assert.ok(sceneCfoB);
    assert.equal(sceneCfoB.directionality.lead_party, "B", "Inverting personal governance must flip lead_party from A to B");
  });

  // ==========================================================================
  // SECTION 9: V1 Gold Assets and 4-Beat Non-Prose Slot Verification
  // ==========================================================================
  await t.test("V1 Gold Assets & Structured 4-Beat Slots", () => {
    const facts = createMockPairSajuFacts();
    const packets = createMockPairPackets();
    const evals = evaluateFriendLenses({ facts, packets });
    const plan = buildFriendStoryPlan({ facts, evaluations: evals });

    plan.scenes.forEach((scene) => {
      // 1. Recognition slot
      assert.ok(Array.isArray(scene.beats.recognition.canonical_meaning_ids));
      assert.ok(Array.isArray(scene.beats.recognition.observable_contrast_facts));
      assert.ok(Array.isArray(scene.beats.recognition.evidence_refs));
      assert.ok(Array.isArray(scene.beats.recognition.required_v1_assets));
      assert.ok(typeof scene.beats.recognition.observed_scene_focus === "string");

      // 2. Translation slot
      assert.ok(Array.isArray(scene.beats.translation.mechanism_ids));
      assert.ok(Array.isArray(scene.beats.translation.saju_source_attribution));
      assert.ok(Array.isArray(scene.beats.translation.survey_axis_attribution));
      assert.ok(scene.beats.translation.directionality);
      assert.ok(scene.beats.translation.tension_level);

      // 3. Reframing slot
      assert.ok(typeof scene.beats.reframing.protected_meaning === "string");
      assert.ok(typeof scene.beats.reframing.gift_to_cost_relationship === "string");
      assert.ok(Array.isArray(scene.beats.reframing.prohibited_generic_interpretations));
      assert.ok(Array.isArray(scene.beats.reframing.allowed_themes));

      // 4. Action slot
      assert.ok(typeof scene.beats.action.prescription_id === "string");
      assert.ok(Array.isArray(scene.beats.action.prescription_keys));
      assert.ok(Array.isArray(scene.beats.action.script_assets));
      assert.ok(Array.isArray(scene.beats.action.role_rules));
      assert.ok(Array.isArray(scene.beats.action.behavioral_assets));
    });
  });
});
