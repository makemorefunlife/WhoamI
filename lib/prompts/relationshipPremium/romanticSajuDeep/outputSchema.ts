/** 연인 심화 Output Schema — LLM용 JSON 골격 (v2.2 풍부 출력) */
export const ROMANTIC_SAJU_DEEP_OUTPUT_SCHEMA = `{
  "report": {
    "section_1_summary": "(서버 Headline Selector가 채움 — LLM은 생성하지 마세요)",
    "section_2_nature": {
      "comparison_table": [
        { "aspect": "감정 표현", "a": "A (1~2문장)", "b": "B (1~2문장)" },
        { "aspect": "갈등 반응", "a": "A (1~2문장)", "b": "B (1~2문장)" },
        { "aspect": "애정 언어", "a": "A (1~2문장)", "b": "B (1~2문장)" },
        { "aspect": "스트레스 패턴", "a": "A (1~2문장)", "b": "B (1~2문장)" },
        { "aspect": "의사결정", "a": "A (1~2문장)", "b": "B (1~2문장)" },
        { "aspect": "소통 방식", "a": "A (1~2문장)", "b": "B (1~2문장)" }
      ],
      "a_nature": {
        "image_metaphor": "A를 한 장면으로 압축한 이미지",
        "first_person_voice": "사실 나는... (5~8문장, 1인칭)",
        "description": "A 타고난 기질·강점·약점·혼자일 때 (5~8문장)",
        "data_combination_note": "어떤 신호들을 조합해 이렇게 읽었는지 (용어 없이)",
        "meeting_b": "B를 만나며 달라진 점 (5문장+)",
        "together_change": "약점이 B 강점과 만나 변화 (5문장+)"
      },
      "b_nature": {
        "image_metaphor": "B 이미지",
        "first_person_voice": "사실 나는... (5~8문장)",
        "description": "B 기질 (5~8문장)",
        "data_combination_note": "조합 논리",
        "meeting_a": "A를 만나며 (5문장+)",
        "together_change": "변화 (5문장+)"
      }
    },
    "section_4_special_bond": {
      "a_gives_b": "A가 B에게 주는 힘 (5문장+, 구체적 장면)",
      "b_gives_a": "B가 A에게 주는 힘 (5문장+)",
      "only_together": "둘이 있을 때만 가능한 시너지 (5문장+)",
      "relationship_formula": "관계 방정식 한 줄",
      "why_special": "특별한 이유 (3~5문장)"
    },
    "section_4_hidden_hearts": {
      "a_hidden": {
        "need": "A 무의식적 욕구/두려움",
        "reason": "왜 그런지 (3문장+)",
        "voice": "사실 나는... (날것의 1인칭, 5~8문장)"
      },
      "b_hidden": {
        "need": "B 욕구/두려움",
        "reason": "이유",
        "voice": "사실 나는... (5~8문장)"
      },
      "mutual_gift": "서로에게 주는 치유 (4문장+)"
    },
    "section_3_conversation_patterns": {
      "conflict_situation": {
        "title": "갈등 상황 제목",
        "dialogue_table": [
          {
            "speaker": "A",
            "label": "A닉네임",
            "bad_line": "나쁜 예 대사 (이모지 포함 가능)",
            "good_line": "좋은 예 대사",
            "emoji": "😤"
          },
          {
            "speaker": "B",
            "label": "B닉네임",
            "bad_line": "나쁜 예",
            "good_line": "좋은 예",
            "emoji": "🤔"
          }
        ]
      }
    },
    "section_5_action": {
      "advice_for_a": [
        {
          "title": "행동 제목",
          "detail": "왜·어떻게 (2~3문장)",
          "phrase_example": "📱 이렇게 말해보세요: \\"실제 대사 한두 문장\\""
        }
      ],
      "advice_for_b": [
        {
          "title": "행동 제목",
          "detail": "2~3문장",
          "phrase_example": "📱 이렇게 말해보세요: \\"실제 대사\\""
        }
      ],
      "together": "함께보면 좋을 것 (3문장+)",
      "together_starter": "📱 이렇게 시작해보세요: \\"대화 시작 대사\\"",
      "promise": "따뜻한 격려 한 문장"
    },
    "section_6_timeline": {
      "current": {
        "period": "📍 지금 (2026년)",
        "description": "현재 특징·과제 (4~6문장)",
        "focus": "지금 집중할 것"
      },
      "in_3_years": {
        "period": "📍 3년 후 (2029년)",
        "change": "변화 (4~6문장)",
        "prepare": "준비할 것"
      },
      "in_5_years": {
        "period": "📍 5년 후 (2031년)",
        "growth": "성숙한 모습 (4~6문장)",
        "goal": "목표"
      },
      "in_10_years": {
        "period": "📍 10년 후 (2036년)",
        "vision": "장기 비전 (4~6문장)",
        "memory": "지금 갈등이 추억이 되는 방식"
      },
      "turning_point": {
        "period": "핵심 전환점",
        "advice": "기회로 만드는 방법",
        "message": "미래의 두 분에게 응원"
      }
    },
    "meta": {
      "analysis_version": "v2.7",
      "layers_used": ["individual", "elemental", "yongsin", "day_pillar", "month_branch", "hidden_stem", "branch_conflict", "archetype", "psychological", "resolution", "timeline"],
      "generated_at": "ISO8601"
    }
  }
}`;

export type AdviceItem =
  | string
  | { title?: string; detail?: string; phrase_example?: string };

export type DialogueTableRow = {
  speaker?: string;
  label?: string;
  bad_line?: string;
  good_line?: string;
  line?: string;
  emoji?: string;
};

export type RomanticSajuDeepReport = {
  report: {
    section_1_summary: {
      relationship_name: string;
      one_line_summary: string;
      grade: string;
      total_score?: number;
      keywords?: string[];
    };
    section_2_nature: {
      comparison_table?: Array<{ aspect: string; a: string; b: string }>;
      a_nature: {
        image_metaphor?: string;
        first_person_voice?: string;
        description: string;
        data_combination_note?: string;
        meeting_b: string;
        together_change: string;
      };
      b_nature: {
        image_metaphor?: string;
        first_person_voice?: string;
        description: string;
        data_combination_note?: string;
        meeting_a: string;
        together_change: string;
      };
    };
    section_4_special_bond?: {
      a_gives_b?: string;
      b_gives_a?: string;
      power_to_each_other?: string;
      only_together: string;
      relationship_formula: string;
      why_special: string;
    };
    section_3_conversation_patterns: Record<string, unknown>;
    section_4_hidden_hearts: Record<string, unknown>;
    section_5_action: Record<string, unknown>;
    section_6_timeline: Record<string, unknown>;
    meta?: Record<string, unknown>;
  };
};

export function isRomanticSajuDeepReport(v: unknown): v is RomanticSajuDeepReport {
  if (!v || typeof v !== "object") return false;
  const r = (v as RomanticSajuDeepReport).report;
  return Boolean(
    r?.section_2_nature?.a_nature?.description &&
      r?.section_2_nature?.b_nature?.description,
  );
}
