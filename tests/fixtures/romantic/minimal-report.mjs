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

/** Rich fixture exercising M1/M2/M3/M6/M10 projectors. */
export function makeCompleteRomanticReport(overrides = {}) {
  return makeMinimalRomanticReport({
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
    },
    ...overrides,
  });
}
