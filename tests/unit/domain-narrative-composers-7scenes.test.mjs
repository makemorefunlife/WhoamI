import test from "node:test";
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
  composeFriendNarrative,
  composeWorkNarrative,
  composeFamilyNarrative,
  composePartnerNarrative,
  composeDomain7SceneNarrative,
  resolveDomainLenses,
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

test("Friend Domain 7-Scene Narrative Composer produces complete bilingual narrative", () => {
  const facts = createMockPairSajuFacts();
  const packets = createMockPairPackets();
  const evals = evaluateFriendLenses({ facts, packets, partyNames: { a: "지우", b: "민호" } });

  const storyPlan = buildFriendStoryPlan({
    facts,
    evaluations: evals,
    partyNames: { a: "지우", b: "민호" },
  });

  assert.equal(storyPlan.scenes.length, 7);

  const narrative = composeFriendNarrative(storyPlan);

  assert.equal(narrative.schema_version, "domain_7_scene_narrative_v1");
  assert.equal(narrative.domain, "friend");
  assert.equal(narrative.parties.a_name, "지우");
  assert.equal(narrative.parties.b_name, "민호");
  assert.ok(narrative.overview.headline_ko.includes("지우"));
  assert.ok(narrative.overview.headline_en.includes("Friendship Story"));
  assert.equal(narrative.scenes.length, 7);

  for (const scene of narrative.scenes) {
    assert.ok(scene.headline_ko.length > 5, `Scene ${scene.scene_number} missing headline_ko`);
    assert.ok(scene.headline_en.length > 5, `Scene ${scene.scene_number} missing headline_en`);
    assert.ok(scene.recognition_ko.length > 20, `Scene ${scene.scene_number} missing recognition_ko`);
    assert.ok(scene.recognition_en.length > 20, `Scene ${scene.scene_number} missing recognition_en`);
    assert.ok(scene.translation_ko.length > 10, `Scene ${scene.scene_number} missing translation_ko`);
    assert.ok(scene.translation_en.length > 10, `Scene ${scene.scene_number} missing translation_en`);
    assert.ok(scene.reframing_ko.length > 15, `Scene ${scene.scene_number} missing reframing_ko`);
    assert.ok(scene.reframing_en.length > 15, `Scene ${scene.scene_number} missing reframing_en`);
    assert.ok(scene.action_guidance_ko.length > 10, `Scene ${scene.scene_number} missing action_guidance_ko`);
    assert.ok(scene.action_guidance_en.length > 10, `Scene ${scene.scene_number} missing action_guidance_en`);
    assert.ok(scene.scripts.length >= 1, `Scene ${scene.scene_number} missing scripts`);
    assert.ok(scene.scripts[0].dialogue_ko.length > 5);
    assert.ok(scene.scripts[0].dialogue_en.length > 5);
    assert.ok(scene.role_rules_ko.length >= 1);
    assert.ok(scene.role_rules_en.length >= 1);
  }

  assert.ok(narrative.action_playbook.golden_rules_ko.length >= 3);
  assert.ok(narrative.action_playbook.golden_rules_en.length >= 3);
  assert.equal(narrative.metadata.total_scenes, 7);
  assert.equal(
    narrative.metadata.active_scenes_count + narrative.metadata.abstained_scenes_count,
    7
  );
});

test("Work Domain 7-Scene Narrative Composer produces professional blameless playbook", () => {
  const facts = createMockPairSajuFacts();
  const packets = createMockPairPackets();
  const evals = evaluateWorkLenses({
    facts,
    packets,
    partyNames: { a: "수진", b: "현우" },
    roleLabels: { a: "PM", b: "Tech Lead" },
  });

  const storyPlan = buildWorkStoryPlan({
    facts,
    evaluations: evals,
    partyNames: { a: "수진", b: "현우" },
    roleLabels: { a: "PM", b: "Tech Lead" },
  });

  const narrative = composeWorkNarrative(storyPlan);

  assert.equal(narrative.schema_version, "domain_7_scene_narrative_v1");
  assert.equal(narrative.domain, "work");
  assert.equal(narrative.scenes.length, 7);

  // Check scene 1: leadership alignment
  const scene1 = narrative.scenes[0];
  assert.equal(scene1.scene_id, "work_scene_1_leadership");
  assert.ok(scene1.recognition_ko.length > 20);
  assert.ok(scene1.recognition_en.includes("strategic direction"));

  // Check scene 6: stress
  const scene6 = narrative.scenes[5];
  assert.equal(scene6.scene_id, "work_scene_6_stress");
  assert.ok(scene6.headline_ko.includes("무비난") || scene6.headline_ko.includes("표준"));
  assert.ok(scene6.headline_en.includes("Blameless") || scene6.headline_en.includes("Standard"));

  assert.ok(narrative.action_playbook.golden_rules_ko.some((r) => r.includes("DRI")));
});

test("Family Parent-Child 7-Scene Narrative Composer handles gentle de-escalation", () => {
  const facts = createMockPairSajuFacts();
  const packets = createMockPairPackets();
  const evals = evaluateFamilyLenses({
    facts,
    packets,
    partyNames: { a: "정옥", b: "서연" },
    roleLabels: { a: "엄마", b: "딸" },
  });

  const storyPlan = buildFamilyStoryPlan({
    facts,
    evaluations: evals,
    partyNames: { a: "정옥", b: "서연" },
    roleLabels: { a: "엄마", b: "딸" },
  });

  const narrative = composeFamilyNarrative(storyPlan);

  assert.equal(narrative.schema_version, "domain_7_scene_narrative_v1");
  assert.equal(narrative.domain, "family");
  assert.equal(narrative.scenes.length, 7);

  // Check scene 2: healthy distance
  const scene2 = narrative.scenes[1];
  assert.equal(scene2.scene_id, "family_scene_2_distance");
  assert.ok(scene2.headline_ko.includes("심리적 거리두기") || scene2.headline_ko.includes("평온한"));

  // Check scene 7: reconciliation
  const scene7 = narrative.scenes[6];
  assert.equal(scene7.scene_id, "family_scene_7_crisis_recovery");
  assert.ok(scene7.scripts.length > 0);
});

test("Life Partner / Marriage 7-Scene Narrative Composer covers 20-minute timeout & CFO", () => {
  const facts = createMockPairSajuFacts();
  const packets = createMockPairPackets();
  const evals = evaluatePartnerLenses({
    facts,
    packets,
    partyNames: { a: "도윤", b: "하은" },
  });

  const storyPlan = buildPartnerStoryPlan({
    facts,
    evaluations: evals,
    partyNames: { a: "도윤", b: "하은" },
  });

  const narrative = composePartnerNarrative(storyPlan);

  assert.equal(narrative.schema_version, "domain_7_scene_narrative_v1");
  assert.equal(narrative.domain, "partner");
  assert.equal(narrative.scenes.length, 7);

  // Check scene 2: CFO finances
  const scene2 = narrative.scenes[1];
  assert.equal(scene2.scene_id, "partner_scene_2_cfo_finances");
  assert.ok(scene2.headline_ko.includes("CFO") || scene2.headline_ko.includes("동반자"));

  // Check scene 5: 20-minute timeout
  const scene5 = narrative.scenes[4];
  assert.equal(scene5.scene_id, "partner_scene_5_conflict_protocol");
  assert.ok(scene5.scripts.length > 0);
});

test("composeDomain7SceneNarrative dispatcher routes correctly across all domains", () => {
  const domains = ["friend", "work", "family", "partner"];

  for (const domain of domains) {
    const facts = createMockPairSajuFacts();
    const packets = createMockPairPackets();
    const lensEvals = resolveDomainLenses({
      domain,
      facts,
      packets,
      partyNames: { a: "UserA", b: "UserB" },
    });

    const storyPlan = buildDomain7SceneStoryPlan({
      domain,
      evaluations: lensEvals,
      facts,
      partyNames: { a: "UserA", b: "UserB" },
    });

    const narrative = composeDomain7SceneNarrative({ storyPlan });

    assert.equal(narrative.schema_version, "domain_7_scene_narrative_v1");
    assert.equal(narrative.domain, domain);
    assert.equal(narrative.scenes.length, 7);
    assert.ok(narrative.overview.headline_ko.length > 0);
    assert.ok(narrative.overview.headline_en.length > 0);
    assert.equal(narrative.metadata.total_scenes, 7);
  }
});
