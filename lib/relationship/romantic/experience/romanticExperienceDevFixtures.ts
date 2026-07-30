import type { RomanticSajuDeepReport } from "@/lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";

type RomanticReportBody = RomanticSajuDeepReport["report"];

export const romanticExperienceMinimalFixture: RomanticReportBody = {
  section_1_summary: {
    relationship_name: "깊어지는 계절",
    one_line_summary: "서로의 다름이 안식이 되는 특별한 균형",
    grade: "A+",
    total_score: 99,
    keywords: [],
  },
  section_2_nature: {
    a_nature: {
      description: "지민 쪽은 감정을 숨기지 않고 솔직하게 내보이는 편이에요.",
      meeting_b: "",
      together_change: "함께 있으면 마음이 빨리 열립니다.",
    },
    b_nature: {
      description: "정우 쪽은 상황을 차분하게 정리하고 나서 행동하는 편이에요.",
      meeting_a: "",
      together_change: "함께 있으면 속도가 한 템포 느려집니다.",
    },
  },
  section_3_conversation_patterns: {},
  section_4_hidden_hearts: {},
  section_5_action: {},
  section_6_timeline: {},
  section_4_special_bond: {
    only_together: "두 사람이 함께할 때 비로소 긴장을 풀 수 있는 여유가 생겨요.",
    relationship_formula: "지민 쪽의 표현력과 정우 쪽의 수용력",
    why_special: "서로의 빈 공간을 아주 자연스럽게 채워주고 있기 때문이에요.",
  },
  meta: {
    // Real production shape (see extractRomanticScores in the legacy view,
    // and projectPremiumOverview.ts): activation/benefit/risk nest under
    // `.overall`. Previously flat here — fixed so this dev fixture actually
    // exercises the Sprint 5 Premium Overview gauges.
    event_scores: { overall: { activation: 80, benefit: 70, risk: 20 } },
    psych_match: {
      axis_results: [
        { axis_key: "stimulation", score_a: 72, score_b: 40, gap: 32, match_type: "tension" },
        { axis_key: "self_control", score_a: 55, score_b: 60, gap: 5, match_type: "similarity" },
        { axis_key: "practicality", score_a: 48, score_b: 66, gap: 18, match_type: "complementary" },
        { axis_key: "structure", score_a: 70, score_b: 35, gap: 35, match_type: "tension" },
        { axis_key: "empathy", score_a: 65, score_b: 62, gap: 3, match_type: "similarity" },
        { axis_key: "conflict_style", score_a: 58, score_b: 44, gap: 14, match_type: "complementary" },
        { axis_key: "resilience", score_a: 50, score_b: 53, gap: 3, match_type: "similarity" },
        { axis_key: "recognition", score_a: 62, score_b: 47, gap: 15, match_type: "complementary" },
        { axis_key: "energy_style", score_a: 75, score_b: 41, gap: 34, match_type: "tension" },
        { axis_key: "thinking_style", score_a: 53, score_b: 57, gap: 4, match_type: "similarity" },
        { axis_key: "decision_style", score_a: 60, score_b: 46, gap: 14, match_type: "complementary" },
      ],
      conflict_triggers: [],
    },
  },
};

export const romanticExperienceCompleteFixture: RomanticReportBody = {
  ...romanticExperienceMinimalFixture,
  section_3_conversation_patterns: {
    conflict_situation: {
      title: "표현 속도와 침묵 오해",
      dialogue_table: [
        {
          speaker: "A",
          label: "A",
          bad_line: "왜 아무 말 없어? 무시하는 거지?",
          good_line: "지금 정리하는 중이지? 30분만 기다려도 될까?",
          emoji: "😤",
        },
        {
          speaker: "B",
          label: "B",
          bad_line: "네가 너무 급해서 말할 수가 없어.",
          good_line: "나도 상한 건 알아. 한 템포 쉬고 꼭 이어서 말할게.",
          emoji: "🤔",
        },
      ],
    },
  },
  section_4_hidden_hearts: {
    a_hidden: {
      need: "확인받고 싶어하는 마음",
      reason: "연락이 끊기면 불안이 커져요.",
      voice: "사실 나는 네가 괜찮은지 자주 듣고 싶어.",
    },
    b_hidden: {
      need: "정리할 시간이 필요해",
      reason: "바로 답하면 실수할까 봐 멈춰요.",
      voice: "사실 나는 마음을 모은 뒤에 말하고 싶어.",
    },
    mutual_gift: "말하지 않아도 서로의 속도를 조금씩 맞추는 감각이 있어요.",
  },
  section_2_nature: {
    comparison_table: [
      { aspect: "감정 표현", a: "바로 말해 풀어요.", b: "잠시 정리한 뒤 말해요." },
      { aspect: "갈등 반응", a: "바로 맞닥뜨려요.", b: "원칙을 먼저 세워요." },
      { aspect: "애정 언어", a: "말로 챙겨요.", b: "행동으로 보여요." },
      { aspect: "스트레스 패턴", a: "한꺼번에 토로해요.", b: "거리를 두고 식혀요." },
      { aspect: "의사결정", a: "빠르게 정해요.", b: "상의하며 정해요." },
      { aspect: "소통 방식", a: "직접적으로 말해요.", b: "상대 기분을 살피며 말해요." },
    ],
    a_nature: {
      description: "지민 쪽은 감정을 숨기지 않고 솔직하게 내보이는 편이에요.",
      meeting_b: "meets B",
      together_change: "changes",
    },
    b_nature: {
      description: "정우 쪽은 상황을 차분하게 정리하고 나서 행동하는 편이에요.",
      meeting_a: "meets A",
      together_change: "changes",
    },
  },
  canonical_projections: {
    expression_speed: { direction: "A", align: "confirms", confidence: "high" },
    saju_frame_direction: { direction: "A", anchor_is_a: true },
    // recovery_mismatch: true is required for Repair Guide to produce an
    // `interrupt` point — which is Reflection's sole realization source
    // (see projectReflection.ts). Without it, the /dev/romantic-v2-visual
    // "complete" variant would silently omit the Reflection section.
    recovery_speed: {
      recovery_a: "quick_recovery",
      recovery_b: "deep_processing",
      recovery_mismatch: true,
    },
    reassurance_signal: {
      need_a: "listening",
      need_b: "behavior_proof",
      give_a: "expression",
      give_b: "action",
      match_a_gives_b: false,
      match_b_gives_a: false,
    },
    unconscious_role_play: {
      primary_frame: "peer",
      saju_frame: "peer",
      agrees: true,
    },
    balance_of_power: {
      balance_a: "leader",
      balance_b: "receiver",
      sublead_idea_mood: "A",
      sublead_decision_approval: "balanced",
      sublead_execution: "B",
    },
    residual: { residual_a: "clears_fast", residual_b: "lingers" },
    cross_chart_tension: {
      band: "moderate",
      dominant_type: "충",
      hit_count: 1,
      hits: [
        {
          personA_pillar: "일주(갑자)",
          personB_pillar: "일주(경오)",
          type: "충",
          interpretation: "자오충 — 감정을 다루는 속도와 방향이 정면으로 부딪히기 쉬운 조합입니다.",
          priority: 80,
          palaceWeight: 1,
          weightedPriority: 80,
          category: "branch_pair",
          personA_pillarSlot: "일주",
          personA_code: "ja",
          personB_pillarSlot: "일주",
          personB_code: "o",
          detail: "자오충",
        },
      ],
    },
    comparison_table: {
      conflict: {
        lean_a: "direct",
        lean_b: "principled",
        align: "caution",
        confidence: "high",
      },
      affection: {
        lean_a: "emotional_care",
        lean_b: "action_gift",
        align: "confirms",
        confidence: "high",
      },
      stress: {
        lean_a: "explosive",
        lean_b: "withdrawn",
        align: "caution",
        confidence: "high",
      },
      expression: {
        lean_a: "expressive",
        lean_b: "reserved",
        align: "confirms",
        confidence: "high",
      },
      decision: {
        lean_a: "independent",
        lean_b: "consultative",
        align: "caution",
        confidence: "low",
      },
      communication: {
        lean_a: "direct",
        lean_b: "considerate",
        align: "caution",
        confidence: "high",
      },
    },
  },
};

/**
 * Isolates cross_chart_tension's effect on Conflict Translation: no
 * expression_speed (projector would otherwise fall to "low" confidence),
 * high-band structural tension present instead. Demonstrates the
 * confidence-only-ever-rises-one-step corroboration rule (low → medium),
 * visible in DEV as the "잠정적인 해석이에요" note disappearing versus the
 * "minimal" variant. See projectConflictPattern.ts.
 */
export const romanticExperienceStructuralTensionFixture: RomanticReportBody = {
  ...romanticExperienceCompleteFixture,
  canonical_projections: {
    ...romanticExperienceCompleteFixture.canonical_projections,
    expression_speed: undefined,
    cross_chart_tension: {
      band: "high",
      dominant_type: "충",
      hit_count: 2,
      hits: [
        {
          personA_pillar: "일주(갑자)",
          personB_pillar: "일주(경오)",
          type: "충",
          interpretation: "자오충 — 감정을 다루는 속도와 방향이 정면으로 부딪히기 쉬운 조합입니다.",
          priority: 80,
          palaceWeight: 1,
          weightedPriority: 80,
          category: "branch_pair",
          personA_pillarSlot: "일주",
          personA_code: "ja",
          personB_pillarSlot: "일주",
          personB_code: "o",
          detail: "자오충",
        },
        {
          personA_pillar: "월주(을묘)",
          personB_pillar: "월주(신유)",
          type: "충",
          interpretation: "묘유충 — 서로의 생활 리듬을 맞추는 방식에서 반복적으로 부딪히는 조합입니다.",
          priority: 70,
          palaceWeight: 0.75,
          weightedPriority: 52.5,
          category: "branch_pair",
          personA_pillarSlot: "월주",
          personA_code: "myo",
          personB_pillarSlot: "월주",
          personB_code: "yu",
          detail: "묘유충",
        },
      ],
    },
  },
};
