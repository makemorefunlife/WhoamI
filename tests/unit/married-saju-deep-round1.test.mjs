/**
 * Round 1 — Married saju-deep postValidate + prompt builders (no OpenAI).
 * Run: npx tsx tests/unit/married-saju-deep-round1.test.mjs
 */
import assert from "node:assert/strict";
import {
  buildMarriedSajuDeepPromptBundle,
  finalizeMarriedSajuDeepNarrative,
  adviceHasLeadingEvidenceBridge,
} from "../../lib/prompts/relationshipPremium/marriedSajuDeep/index.ts";

function ok(name) {
  console.log(`ok - ${name}`);
}

{
  const bundle = buildMarriedSajuDeepPromptBundle({
    nicknameA: "나",
    nicknameB: "지후",
    householdDigestBlock:
      "household_digest\n- marital_conflict: explosive vs stonewall\n- operating_cfo.side: a",
  });
  assert.equal(bundle.format, "married_saju_deep_v1_round1");
  assert.match(bundle.system, /married \/ cohabiting|household-operations|Married Couples/i);
  assert.match(bundle.user, /Evidence bridge|가사·루틴|tip3/i);
  assert.doesNotMatch(bundle.user, /compare_affection|expression_speed/);
  ok("prompt bundle marriage domain");
}

{
  const raw = {
    section_2_nature: {
      b_nature: {
        first_person_voice: "사실 나는 지후와의 관계에서 상처받기 싫다.",
        description: "나는 지후과의 관계에서 안정을 원한다.",
      },
      comparison_table: [
        {
          aspect: "부부 갈등",
          a: "폭발적으로 반응한다.",
          b: "침묵으로 피한다.",
        },
      ],
    },
    section_4_household_frames: {
      role_balance_signal: {
        a_body:
          "이미 잘 맞춰 사는 부부입니다. 역할이 이미 완벽히 분담되어 있습니다.",
        b_body: "갈등이 없는 가정입니다.",
        match_note: "우리는 문제 없습니다.",
      },
    },
    section_5_action: {
      advice_for_a: [
        {
          action_title: "가사 리듬 존중",
          saju_reason:
            "가사·루틴 스트레스 드러내는 방식이 다르게 잡히므로, 상대 리듬을 먼저 묻는다.",
          real_speech_tip: "이번 주 뭐가 제일 지쳐?",
          real_life_example: "",
        },
        {
          action_title: "재정 한 줄",
          saju_reason: "큰 지출 전에 한 줄만 공유하자.",
          real_speech_tip: "금액만 먼저 말하자.",
          real_life_example: "",
        },
        {
          action_title: "감정 확인",
          saju_reason: "서로의 차이를 이해하세요. 나님은 참으세요.",
          real_speech_tip: "잠깐만.",
          real_life_example: "",
        },
      ],
      advice_for_b: [
        {
          action_title: "규칙 말하기",
          saju_reason: "침묵 대신 규칙을 말한다.",
          real_speech_tip: "오늘은 역할만.",
          real_life_example: "",
        },
        {
          action_title: "경계",
          saju_reason: "원가족 방문은 미리 정하자.",
          real_speech_tip: "일정부터.",
          real_life_example: "",
        },
        {
          action_title: "육아",
          saju_reason: "원칙을 먼저 합의하자.",
          real_speech_tip: "오늘은 취침만.",
          real_life_example: "",
        },
      ],
      together:
        "두 사람의 다름은 서로를 채워주는 가장 아름다운 조각입니다. 따뜻한 차 한 잔을 사이에 두고 설레는 데이트처럼.",
    },
  };

  const out = finalizeMarriedSajuDeepNarrative(raw, {
    nicknameA: "나",
    nicknameB: "지후",
    mismatchRoles: true,
    operatingCfoSide: "a",
    comparisonLeans: {
      marital_conflict: {
        band_a: "explosive",
        band_b: "stonewall",
        confidence: "low",
        align: "caution",
      },
      household_stress: {
        band_a: "wealth",
        band_b: "officer",
        confidence: "med",
      },
      asset_management: {
        band_a: "high",
        band_b: "low",
      },
    },
  });

  const text = JSON.stringify(out);
  assert.equal((text.match(/나님/g) || []).length, 0);
  assert.doesNotMatch(
    out.section_2_nature.b_nature.first_person_voice,
    /지후와의|지후과의/,
  );
  assert.doesNotMatch(
    out.section_2_nature.b_nature.description,
    /지후와의|지후과의/,
  );

  const tips = [
    ...out.section_5_action.advice_for_a,
    ...out.section_5_action.advice_for_b,
  ];
  for (const tip of tips) {
    assert.ok(
      adviceHasLeadingEvidenceBridge(tip.saju_reason),
      `missing bridge: ${tip.saju_reason}`,
    );
  }

  assert.match(
    out.section_4_household_frames.role_balance_signal.match_note,
    /어긋|확인|조율|분담/,
  );
  assert.doesNotMatch(
    out.section_4_household_frames.role_balance_signal.a_body,
    /이미 잘 맞춰 사는 부부입니다/,
  );
  assert.doesNotMatch(out.section_5_action.together, /가장 아름다운 조각/);

  const conflictRow = out.section_2_nature.comparison_table.find(
    (r) => r.aspect === "부부 갈등",
  );
  assert.match(conflictRow.a, /편으로 보일 수 있으며|확인해 볼/);
  assert.match(conflictRow.b, /편으로 보일 수 있으며|확인해 볼/);

  assert.ok(out.meta.narrative_guards.length >= 1);
  assert.equal(
    out.meta.narrative_guards_mode,
    "deterministic_post_validate_married_v1",
  );
  ok("postValidate naming / B-self / bridge / soft-wash / low-conf");
}

console.log("\nmarried-saju-deep-round1: all passed");
