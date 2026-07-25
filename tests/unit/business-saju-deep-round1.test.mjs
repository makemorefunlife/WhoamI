/**
 * Round 1 — Business saju-deep postValidate + prompt builders (no OpenAI).
 * Run: npx tsx tests/unit/business-saju-deep-round1.test.mjs
 */
import assert from "node:assert/strict";
import {
  buildBusinessSajuDeepPromptBundle,
  finalizeBusinessSajuDeepNarrative,
  adviceHasLeadingEvidenceBridge,
} from "../../lib/prompts/relationshipPremium/businessSajuDeep/index.ts";

function ok(name) {
  console.log(`ok - ${name}`);
}

{
  const bundle = buildBusinessSajuDeepPromptBundle({
    nicknameA: "나",
    nicknameB: "지후",
    businessDigestBlock:
      "business_digest\n- boundary: a=clear, b=blurry\n- risk_taking: a=cautious, b=bold\n- leadership: external_lead=a",
  });
  assert.equal(bundle.format, "business_saju_deep_v1_round1");
  assert.match(bundle.system, /business|Work|파트너|리스크|역할/i);
  assert.match(bundle.user, /Evidence bridge|업무 경계|tip3/i);
  assert.doesNotMatch(bundle.user, /operating_cfo|가사 분담|설레는|양육/);
  assert.doesNotMatch(bundle.user, /compare_affection|expression_speed|bond_distance/);
  ok("prompt bundle business domain");
}

{
  const raw = {
    section_2_nature: {
      b_nature: {
        first_person_voice: "사실 나는 지후와의 관계에서 답답하다.",
        description: "나는 지후과의 사이에서 더 리드하고 싶다.",
      },
      a_nature: {
        first_person_voice: "사실 나는 파트너와의 협업에서 속도가 답답하다.",
        description: "나는 의사결정을 더 신중하게 가져가고 싶다.",
      },
      comparison_table: [
        {
          aspect: "리스크 감수",
          a: "더 보수적으로 본다.",
          b: "더 공격적으로 본다.",
        },
        {
          aspect: "업무 경계",
          a: "소유권을 분명히 한다.",
          b: "경계가 흐리다.",
        },
      ],
    },
    section_4_business_frames: {
      role_gap_signal: {
        a_body:
          "일이 잘 안 풀려도 서로 믿으면 된다. 파트너니까 괜찮습니다.",
        b_body: "사이만 좋으면 사업은 된다. 다 잘될 거예요.",
        match_note: "우리는 문제 없는 파트너십입니다.",
      },
    },
    section_5_action: {
      advice_for_a: [
        {
          action_title: "소유권 한 줄 확인",
          saju_reason:
            "업무 경계·역할 소유가 다르게 잡히기 때문에, 핸드오프 전에 누가 최종 소유자인지 적는다.",
          real_speech_tip: "이번 안건 최종 오너는 누구야?",
          real_life_example: "",
        },
        {
          action_title: "리스크 한도",
          saju_reason: "이번 주 한도를 숫자로 정하자.",
          real_speech_tip: "손실 한도는 얼마까지?",
          real_life_example: "",
        },
        {
          action_title: "신뢰",
          saju_reason: "서로 믿으면 된다. 나님은 참으세요.",
          real_speech_tip: "일단 믿자.",
          real_life_example: "",
        },
      ],
      advice_for_b: [
        {
          action_title: "보고 리듬",
          saju_reason: "주간 공유 시간을 잡자.",
          real_speech_tip: "금요일 15분만.",
          real_life_example: "",
        },
        {
          action_title: "피드백",
          saju_reason: "회의 전에 메모를 보내자.",
          real_speech_tip: "미리 세 줄만.",
          real_life_example: "",
        },
        {
          action_title: "시너지",
          saju_reason: "서로의 차이를 이해하세요.",
          real_speech_tip: "나도 노력할게.",
          real_life_example: "",
        },
      ],
      together:
        "서로 믿으면 된다. 가장 아름다운 조각처럼 따뜻한 차 한 잔을 사이에 두고.",
    },
  };

  const out = finalizeBusinessSajuDeepNarrative(raw, {
    nicknameA: "나",
    nicknameB: "지후",
    mismatchRoles: true,
    comparisonLeans: {
      boundary: {
        band_a: "clear",
        band_b: "blurry",
        confidence: "low",
        align: "caution",
      },
      risk_taking: {
        band_a: "cautious",
        band_b: "bold",
        confidence: "low",
        align: "caution",
      },
      leadership: {
        band_a: "external",
        band_b: "internal",
      },
      feedback: {
        band_a: "direct",
        band_b: "cushion",
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
    out.section_4_business_frames.role_gap_signal.match_note,
    /어긋|확인|조율|역할|리스크|보고|한도/,
  );
  assert.doesNotMatch(
    out.section_4_business_frames.role_gap_signal.a_body,
    /서로 믿으면 된다/,
  );
  assert.doesNotMatch(out.section_5_action.together, /서로 믿으면 된다/);

  const riskRow = out.section_2_nature.comparison_table.find(
    (r) => r.aspect === "리스크 감수",
  );
  assert.match(riskRow.a, /편으로 보일 수 있으며|확인해 볼|상황에 따라/);
  assert.match(riskRow.b, /편으로 보일 수 있으며|확인해 볼|상황에 따라/);

  assert.ok(out.meta.narrative_guards.length >= 1);
  assert.equal(
    out.meta.narrative_guards_mode,
    "deterministic_post_validate_business_v1",
  );
  assert.equal(out.meta.domain, "business");
  ok("postValidate naming / B-self / bridge / soft-wash / low-conf");
}

console.log("\nbusiness-saju-deep-round1: all passed");
