/**
 * Romantic report fixtures for experience VM tests (B1/B2).
 */

export function makeMinimalRomanticReport(overrides = {}) {
  return {
    section_1_summary: {
      relationship_name: "Test Bond",
      one_line_summary: "A short line",
      grade: "A+",
      total_score: 99,
      keywords: ["should-not-appear-on-vm"],
    },
    section_2_nature: {
      a_nature: {
        description: "A desc",
        meeting_b: "meets B",
        together_change: "changes",
      },
      b_nature: {
        description: "B desc",
        meeting_a: "meets A",
        together_change: "changes",
      },
    },
    section_3_conversation_patterns: {},
    section_4_hidden_hearts: {},
    section_5_action: {},
    section_6_timeline: {},
    section_4_special_bond: {
      only_together: "together",
      relationship_formula: "A + B = destiny",
      why_special: "special",
    },
    meta: {
      event_scores: { activation: 80, benefit: 70, risk: 20 },
    },
    ...overrides,
  };
}

export function makePartialRomanticReport() {
  return {
    section_1_summary: {
      relationship_name: "",
      one_line_summary: "",
      grade: "C",
    },
    section_2_nature: {
      a_nature: {
        description: "x",
        meeting_b: "",
        together_change: "",
      },
      b_nature: {
        description: "y",
        meeting_a: "",
        together_change: "",
      },
    },
    section_3_conversation_patterns: {},
    section_4_hidden_hearts: {},
    section_5_action: {},
    section_6_timeline: {},
  };
}

/** Rich fixture exercising M1–M10 B3 projectors. */
export function makeCompleteRomanticReport(overrides = {}) {
  return makeMinimalRomanticReport({
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
        description: "A desc",
        meeting_b: "meets B",
        together_change: "changes",
      },
      b_nature: {
        description: "B desc",
        meeting_a: "meets A",
        together_change: "changes",
      },
    },
    section_5_action: {
      advice_for_a: [
        {
          relationship_kind: "연인",
          target_user: "A",
          action_title: "평소에 짧은 확인 문장을 먼저 보내기",
          saju_reason: "표현이 빠른 쪽이 침묵을 오해하기 쉬워요.",
          real_speech_tip: "지금 바쁜지 30분만 기다려도 될까?",
          real_life_example: "",
        },
      ],
      advice_for_b: [
        {
          relationship_kind: "연인",
          target_user: "B",
          action_title: "평소에 정리 창을 미리 알려 주기",
          saju_reason: "숙성 리듬을 상대가 예측할 수 있으면 긴장이 줄어요.",
          real_speech_tip: "한 템포 쉬고 꼭 이어서 말할게.",
          real_life_example: "",
        },
      ],
      together: "주말에 템포 이야기를 짧게 나눠요.",
      together_starter: "우리 평소 속도 이야기 좀 할까?",
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
    section_4_special_bond: {
      a_gives_b_headline: "안정감",
      a_gives_b:
        "A는 B가 망설일 때 먼저 계획을 구체화해 주며 관계에 발을 디딜 자리를 만들어요. 그 경험이 B의 결정을 덜 무겁게 만들어요.",
      b_gives_a_headline: "깊이",
      b_gives_a:
        "B는 A의 빠른 감정을 받아 정리된 언어로 되돌려 주며 싸움이 커지기 전에 숨을 고르게 해요. A는 그 리듬에서 안전감을 배워요.",
      only_together_headline: "서로만의 템포",
      only_together:
        "둘만 있을 때 말의 속도와 침묵의 길이가 자연스럽게 교차하며 같은 장면을 다른 각도에서 읽어요.",
      relationship_formula: "촛불과 산의 운명적 방정식",
      why_special:
        "표현 속도 차이 때문에 다툰 뒤에도 서로의 회복 창을 기다리는 습관이 이 관계만의 맞춤법이에요.",
    },
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
    section_6_timeline: {
      current: {
        period: "지금 (2026년)",
        description: "서로의 템포 차이를 알아가는 구간이에요.",
        focus: "짧은 확인 문장",
      },
      in_1_year: {
        period: "1년 후",
        change: "갈등 후 회복 루틴이 익숙해져요.",
        prepare: "회복 신호 합의",
      },
      in_3_years: {
        period: "3년 후",
        change: "장기 리듬이 안정돼요.",
        prepare: "역할 대화",
      },
    },
    canonical_projections: {
      expression_speed: { direction: "A", align: "confirms", confidence: "high" },
      saju_frame_direction: { direction: "A", anchor_is_a: true },
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
    ...overrides,
  });
}
