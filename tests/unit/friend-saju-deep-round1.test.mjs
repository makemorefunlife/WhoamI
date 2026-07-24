/**
 * Round 1 — Friend saju-deep postValidate + prompt builders (no OpenAI).
 * Run: npx tsx tests/unit/friend-saju-deep-round1.test.mjs
 */
import assert from "node:assert/strict";
import {
  buildFriendSajuDeepPromptBundle,
  finalizeFriendSajuDeepNarrative,
  adviceHasLeadingEvidenceBridge,
} from "../../lib/prompts/relationshipPremium/friendSajuDeep/index.ts";

function ok(name) {
  console.log(`ok - ${name}`);
}

{
  const bundle = buildFriendSajuDeepPromptBundle({
    nicknameA: "나",
    nicknameB: "지후",
    friendDigestBlock:
      "friend_digest\n- daily_share_tempo: a=active, b=steady\n- communication_rhythm: a=strong, b=some",
  });
  assert.equal(bundle.format, "friend_saju_deep_v1_round1");
  assert.match(bundle.system, /friend|Friend|티키타카|거리|우정/i);
  assert.match(bundle.user, /Evidence bridge|연락 템포|tip3/i);
  assert.doesNotMatch(bundle.user, /operating_cfo|가사 분담|양육|핸드오프|손익/);
  assert.doesNotMatch(
    bundle.user,
    /compare_affection|expression_speed|bond_distance|risk_taking/,
  );
  ok("prompt bundle friend domain");
}

{
  const raw = {
    section_2_nature: {
      b_nature: {
        first_person_voice: "사실 나는 지후와의 관계에서 숨이 막힌다.",
        description: "나는 지후과의 사이에서 더 거리를 원한다.",
      },
      a_nature: {
        first_person_voice: "사실 나는 친구와의 연락이 느슨해도 편하다.",
        description: "나는 템포 차이를 인정하고 싶다.",
      },
      comparison_table: [
        {
          aspect: "연락 템포",
          a: "더 자주 공유한다.",
          b: "더 느리게 반응한다.",
        },
        {
          aspect: "소통 리듬",
          a: "티키타카가 빠르다.",
          b: "한 박자 여유를 둔다.",
        },
      ],
    },
    section_4_friend_frames: {
      friendship_gap_signal: {
        a_body:
          "친구니까 무조건 다 이해해 줘야 한다. 진짜 친구면 괜찮습니다.",
        b_body: "절교각. 다 잘될 거예요.",
        match_note: "우리는 문제 없는 친구입니다.",
      },
    },
    section_5_action: {
      advice_for_a: [
        {
          action_title: "연락 템포 합의",
          saju_reason:
            "일상 공유·연락 템포가 다르게 잡히기 때문에, 주 몇 번 정도면 편한지 먼저 묻는다.",
          real_speech_tip: "너는 보통 며칠에 한 번 톡이 편해?",
          real_life_example: "",
        },
        {
          action_title: "서운함 신호",
          saju_reason: "짧게만 말해도 된다.",
          real_speech_tip: "그날 좀 서운했어.",
          real_life_example: "",
        },
        {
          action_title: "무조건 이해",
          saju_reason: "친구니까 무조건 이해해. 나님은 참으세요.",
          real_speech_tip: "괜찮아.",
          real_life_example: "",
        },
      ],
      advice_for_b: [
        {
          action_title: "배터리 말하기",
          saju_reason: "혼자 충전 시간이 필요할 때 말한다.",
          real_speech_tip: "오늘은 좀 쉬고 내일 연락할게.",
          real_life_example: "",
        },
        {
          action_title: "만남 계획",
          saju_reason: "약속을 너무 자주 잡지 말자.",
          real_speech_tip: "이번 달은 한 번만.",
          real_life_example: "",
        },
        {
          action_title: "케미",
          saju_reason: "서로의 차이를 이해하세요.",
          real_speech_tip: "나도 노력할게.",
          real_life_example: "",
        },
      ],
      together:
        "친구니까 무조건. 가장 아름다운 조각처럼 따뜻한 차 한 잔을 사이에 두고.",
    },
  };

  const out = finalizeFriendSajuDeepNarrative(raw, {
    nicknameA: "나",
    nicknameB: "지후",
    mismatchRoles: true,
    comparisonLeans: {
      daily_share_tempo: {
        band_a: "active",
        band_b: "steady",
        confidence: "low",
        align: "caution",
      },
      communication_rhythm: {
        band_a: "strong",
        band_b: "some",
        confidence: "low",
        align: "caution",
      },
      upset_expression: {
        band_a: "food",
        band_b: "seal",
      },
      battery_recharge: {
        band_a: "strong",
        band_b: "weak",
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
    out.section_4_friend_frames.friendship_gap_signal.match_note,
    /어긋|확인|조율|거리|템포|연락|서운/,
  );
  assert.doesNotMatch(
    out.section_4_friend_frames.friendship_gap_signal.a_body,
    /친구니까 무조건 다 이해해 줘야 한다/,
  );
  assert.doesNotMatch(out.section_5_action.together, /친구니까 무조건/);

  const tempoRow = out.section_2_nature.comparison_table.find(
    (r) => r.aspect === "연락 템포",
  );
  assert.match(tempoRow.a, /편으로 보일 수 있으며|확인해 볼/);
  assert.match(tempoRow.b, /편으로 보일 수 있으며|확인해 볼/);

  assert.ok(out.meta.narrative_guards.length >= 1);
  assert.equal(
    out.meta.narrative_guards_mode,
    "deterministic_post_validate_friend_v1",
  );
  assert.equal(out.meta.domain, "friend");
  ok("postValidate naming / B-self / bridge / soft-wash / low-conf");
}

console.log("\nfriend-saju-deep-round1: all passed");
