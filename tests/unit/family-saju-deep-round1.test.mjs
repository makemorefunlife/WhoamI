/**
 * Round 1 — Family saju-deep postValidate + prompt builders (no OpenAI).
 * Run: npx tsx tests/unit/family-saju-deep-round1.test.mjs
 */
import assert from "node:assert/strict";
import {
  buildFamilySajuDeepPromptBundle,
  finalizeFamilySajuDeepNarrative,
  adviceHasLeadingEvidenceBridge,
} from "../../lib/prompts/relationshipPremium/familySajuDeep/index.ts";

function ok(name) {
  console.log(`ok - ${name}`);
}

{
  const bundle = buildFamilySajuDeepPromptBundle({
    nicknameParent: "엄마",
    nicknameChild: "민준",
    familyDigestBlock:
      "family_digest\n- bond_distance: parent=smothering, child=distant\n- guidance_balance: mixed vs receptive",
  });
  assert.equal(bundle.format, "family_saju_deep_v1_round1");
  assert.match(bundle.system, /parent–child|Family|양육|세대/i);
  assert.match(bundle.user, /Evidence bridge|정서적 거리|tip3/i);
  assert.doesNotMatch(bundle.user, /operating_cfo|가사 분담|설레는/);
  assert.doesNotMatch(bundle.user, /compare_affection|expression_speed/);
  ok("prompt bundle family domain");
}

{
  const raw = {
    section_2_nature: {
      child_nature: {
        first_person_voice: "사실 나는 민준과의 관계에서 숨이 막힌다.",
        description: "나는 민준와의 관계에서 거리를 원한다.",
      },
      parent_nature: {
        first_person_voice: "사실 나는 엄마와의 관계에서 걱정이 많다.",
        description: "나는 엄마과의 사이에서 더 챙기고 싶다.",
      },
      comparison_table: [
        {
          aspect: "정서적 거리",
          parent: "더 가까이 두고 싶어 한다.",
          child: "공간이 필요하다.",
        },
      ],
    },
    section_4_family_frames: {
      generation_gap_signal: {
        parent_body:
          "무조건 사랑하는 가족이니까 괜찮습니다. 피는 물보다 진하니까 괜찮습니다.",
        child_body: "다 잘될 거예요. 그냥 가족이라서 괜찮다.",
        match_note: "우리는 문제 없는 가족입니다.",
      },
    },
    section_5_action: {
      advice_for_parent: [
        {
          action_title: "잔소리 전 질문",
          saju_reason:
            "잔소리·지적에 반응하는 결이 다르게 잡히기 때문에, 먼저 한 줄 질문한다.",
          real_speech_tip: "지금 뭐가 제일 답답해?",
          real_life_example: "",
        },
        {
          action_title: "간격 합의",
          saju_reason: "연락 빈도를 같이 정하자.",
          real_speech_tip: "이번 주는 이틀에 한 번만.",
          real_life_example: "",
        },
        {
          action_title: "감정 확인",
          saju_reason: "무조건 사랑하면 된다. 나님은 참으세요.",
          real_speech_tip: "잠깐만.",
          real_life_example: "",
        },
      ],
      advice_for_child: [
        {
          action_title: "거리 말하기",
          saju_reason: "공간이 필요할 때 말로 말한다.",
          real_speech_tip: "지금은 혼자 정리할 시간이 필요해.",
          real_life_example: "",
        },
        {
          action_title: "기대 조율",
          saju_reason: "주말 약속은 미리 정하자.",
          real_speech_tip: "일요일 오후만.",
          real_life_example: "",
        },
        {
          action_title: "성찰",
          saju_reason: "서로의 차이를 이해하세요.",
          real_speech_tip: "나도 노력할게.",
          real_life_example: "",
        },
      ],
      together:
        "무조건 사랑하는 가족이니까 괜찮습니다. 가장 아름다운 조각처럼 따뜻한 차 한 잔을 사이에 두고.",
    },
  };

  const out = finalizeFamilySajuDeepNarrative(raw, {
    nicknameParent: "엄마",
    nicknameChild: "민준",
    mismatchGenerations: true,
    comparisonLeans: {
      bond_distance: {
        band_parent: "smothering",
        band_child: "distant",
        confidence: "low",
        align: "caution",
      },
      correction_style: {
        band_parent: "officer",
        band_child: "food",
        confidence: "low",
        align: "caution",
      },
      guidance_balance: {
        band_parent: "standards",
        band_child: "receptive",
      },
    },
  });

  const text = JSON.stringify(out);
  assert.equal((text.match(/나님/g) || []).length, 0);
  assert.doesNotMatch(
    out.section_2_nature.child_nature.first_person_voice,
    /민준과의|민준와의/,
  );
  assert.doesNotMatch(
    out.section_2_nature.child_nature.description,
    /민준과의|민준와의/,
  );
  assert.doesNotMatch(
    out.section_2_nature.parent_nature.first_person_voice,
    /엄마와의|엄마과의/,
  );

  const tips = [
    ...out.section_5_action.advice_for_parent,
    ...out.section_5_action.advice_for_child,
  ];
  for (const tip of tips) {
    assert.ok(
      adviceHasLeadingEvidenceBridge(tip.saju_reason),
      `missing bridge: ${tip.saju_reason}`,
    );
  }

  assert.match(
    out.section_4_family_frames.generation_gap_signal.match_note,
    /어긋|확인|조율|간격|거리/,
  );
  assert.doesNotMatch(
    out.section_4_family_frames.generation_gap_signal.parent_body,
    /무조건 사랑하는 가족이니까 괜찮습니다/,
  );
  assert.doesNotMatch(out.section_5_action.together, /무조건 사랑하는 가족/);

  const distRow = out.section_2_nature.comparison_table.find(
    (r) => r.aspect === "정서적 거리",
  );
  assert.match(distRow.parent, /편으로 보일 수 있으며|확인해 볼|상황에 따라/);
  assert.match(distRow.child, /편으로 보일 수 있으며|확인해 볼|상황에 따라/);

  assert.ok(out.meta.narrative_guards.length >= 1);
  assert.equal(
    out.meta.narrative_guards_mode,
    "deterministic_post_validate_family_v1",
  );
  ok("postValidate naming / self-as-other / bridge / soft-wash / low-conf");
}

console.log("\nfamily-saju-deep-round1: all passed");
