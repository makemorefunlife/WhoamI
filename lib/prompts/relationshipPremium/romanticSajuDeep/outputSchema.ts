import type {
  ChemistryApproxScores,
  StrengthWeaknessLists,
} from "@/lib/relationship/psychMatch";

/** 연인 심화 Output Schema — LLM용 JSON 골격 (v2.2 풍부 출력) */
export const ROMANTIC_SAJU_DEEP_OUTPUT_SCHEMA = `{
  "report": {
    "section_1_summary": "(서버 Headline Selector가 채움 — LLM은 생성하지 마세요)",
    "section_1_relationship_dynamics": {
      "balance_of_power": {
        "headline": "관계의 균형추 — 데이트·연락 주도권 한 줄 훅",
        "body": "아래 Input data의 dynamics_digest.balance_of_power(주도/수용/균형, 아이디어·결정·실행 서브 리드)를 근거로만 서술 (3~4문장, 판정을 새로 만들지 말고 주어진 판정을 문장으로 풀어쓰기)"
      },
      "recovery_speed": {
        "headline": "감정 회복 속도 차이 — 한 줄 훅",
        "body": "dynamics_digest.recovery_speed(급속회복/심층숙성/균형, 겉보기 속도 vs 내부 잔류도)를 근거로만 서술 (3~4문장)"
      }
    },
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
        "description": "A Essence·강점·약점·혼자일 때 (5~8문장)",
        "data_combination_note": "어떤 신호들을 조합해 이렇게 읽었는지 (용어 없이)",
        "meeting_b": "B를 만나며 달라진 점 (5문장+)",
        "together_change": "약점이 B 강점과 만나 변화 (5문장+)"
      },
      "b_nature": {
        "image_metaphor": "B 이미지",
        "first_person_voice": "사실 나는... (5~8문장)",
        "description": "B Essence (5~8문장)",
        "data_combination_note": "조합 논리",
        "meeting_a": "A를 만나며 (5문장+)",
        "together_change": "변화 (5문장+)"
      }
    },
    "section_4_special_bond": {
      "a_gives_b_headline": "A→B 한 줄 훅 (콜론 뒤 서브타이틀)",
      "a_gives_b": "A→B 본문 4~5문장 (새 경험·변화·더 나은 결정 역동 필수)",
      "b_gives_a_headline": "B→A 한 줄 훅",
      "b_gives_a": "B→A 본문 4~5문장 (감정 부담 경감·분석적 새 시각 역동 필수)",
      "only_together_headline": "A↔B 한 줄 훅",
      "only_together": "A↔B 상호보완·Essence 아우라 본문 3~4문장",
      "relationship_formula": "관계 방정식 한 줄 (선택)",
      "why_special": "💡 맞춰 가는 지점 — 갈등 패턴·실전 팁 (bond 칭찬 재탕 금지)"
    },
    "section_4_relationship_frames": {
      "reassurance_signal": {
        "headline": "안심 신호 — 한 줄 훅",
        "a_body": "dynamics_digest.reassurance(A need vs B give, 일치 여부)를 근거로 A가 무엇에 안심하는지 3문장+",
        "b_body": "B가 무엇에 안심하는지 3문장+",
        "match_note": "두 사람의 요구·제공 일치/불일치를 짚어주는 실전 팁 2~3문장"
      },
      "unconscious_role_play": {
        "headline": "무의식적 역할극 — 한 줄 훅",
        "body": "dynamics_digest.role_play(primaryFrame·sajuFrame·일치 여부)를 근거로 두 사람의 무의식적 관계 프레임과 균형 대안 3~4문장 (부모자식/구원자의존자/사제/단짝 중 하나를 단정하지 말고, 두 신호가 다르면 상황에 따라 다르게 나타날 수 있음을 자연스럽게 반영)"
      }
    },
    "section_4_hidden_hearts": {
      "a_hidden": {
        "need": "A 한 줄 후킹 — 무의식적 욕구·두려움 (겉모습 vs 속마음 대비)",
        "reason": "왜 그런지 — 구체 장면·습관 3문장+ (사주 용어 없이)",
        "voice": "사실 나는... (A 1인칭 날것 고백 5~8문장)"
      },
      "b_hidden": {
        "need": "B 한 줄 후킹",
        "reason": "이유 3문장+",
        "voice": "사실 나는... (B 1인칭 5~8문장)"
      },
      "mutual_gift": "💡 두 사람의 무의식 시너지 — 말하지 않아도 느끼는 긴장감 또는 보이지 않는 정서적 안전지대 (4문장+)"
    },
    "section_3_conversation_patterns": {
      "conflict_situation": {
        "title": "기질 차이 한 줄 (예: 표현의 속도차이와 내면의 과부하)",
        "dialogue_table": [
          {
            "speaker": "A",
            "label": "A 커스텀 이름",
            "bad_line": "빠른 감정 표현 쪽 — 침묵 오해형 bad (공격적이되 가해자 프레이밍 금지)",
            "good_line": "속도 인정 + 상대 듣기 good",
            "emoji": "😤"
          },
          {
            "speaker": "B",
            "label": "B 커스텀 이름",
            "bad_line": "신중·무거운 처리 쪽 — 과부하·이성 통제형 bad",
            "good_line": "상대 속상함 인정 + 정리·호흡 good",
            "emoji": "🤔"
          }
        ]
      }
    },
    "section_5_action": {
      "advice_for_a": [
        {
          "relationship_kind": "연인",
          "target_user": "A닉네임",
          "saju_reason": "왜 이 행동이 필요한지 — 기질·패턴 근거 3~4문장 (사주 용어·한자·기획 메모 톤 없이)",
          "action_title": "행동 강령 제목 한 줄 (후킹)",
          "real_speech_tip": "실전 대사 꿀팁 — 입으로 뱉을 1~2문장",
          "real_life_example": ""
        }
      ],
      "advice_for_b": [
        {
          "relationship_kind": "연인",
          "target_user": "B닉네임",
          "saju_reason": "3~4문장",
          "action_title": "행동 강령 제목",
          "real_speech_tip": "실전 대사",
          "real_life_example": ""
        }
      ],
      "together": "💌 에센스 다이어리 본문 — 관계 아카이브·주말 대화 제안 등 3~4문장+",
      "together_starter": "이렇게 대화의 문을 열어보세요 — 실전 대사 1~2문장",
      "promise": "따뜻한 격려 한 문장"
    },
    "section_6_timeline": {
      "current": {
        "period": "📍 지금 (2026년)",
        "description": "현재 특징·과제 (4~6문장)",
        "focus": "지금 집중할 것"
      },
      "in_1_year": {
        "period": "📍 1년 후 (2027년)",
        "change": "1년 후 변화 — 서로의 패턴을 알아가는 단계 (4~6문장)",
        "prepare": "지금부터 준비할 것"
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

export interface EssenceActionGuideline {
  relationship_kind: string;
  target_user: string;
  saju_reason: string;
  action_title: string;
  real_speech_tip: string;
  real_life_example: string;
}

/** @deprecated LLM 구 스키마 — normalizeActionGuideline이 변환 */
export type LegacyAdviceItem = {
  title?: string;
  detail?: string;
  phrase_example?: string;
};

export type AdviceItem =
  | string
  | EssenceActionGuideline
  | LegacyAdviceItem;

export type DialogueTableRow = {
  speaker?: string;
  label?: string;
  bad_line?: string;
  good_line?: string;
  line?: string;
  emoji?: string;
};

export type RomanticPsychMatchType = "similarity" | "complementary" | "tension";

export type RomanticPsychMatchAxisResult = {
  axis_key: string;
  score_a: number;
  score_b: number;
  gap: number;
  match_type: RomanticPsychMatchType;
};

export type RomanticPsychMatchResult = {
  axis_results: RomanticPsychMatchAxisResult[];
  conflict_triggers: Array<{
    axis_key: string;
    gap: number;
    match_type: RomanticPsychMatchType;
  }>;
};

export type RomanticFortuneFlowResult = {
  daewoon: {
    current_year: number;
    age_band_start: number;
    daewoon_pillar: string;
    daewoon_element: string;
    relationship_interaction: "supportive" | "neutral" | "tension";
    interaction_note: string;
  };
  sewoon: {
    current_year: number;
    years: Array<{
      year: number;
      sewoon_pillar: string;
      branch_relation: "combine" | "clash" | "neutral";
    }>;
  };
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
    /** deterministic input context — 클라이언트 strip 대상. LLM prose 아님. */
    romantic_context_input?: import("@/lib/relationship/romantic/romanticContextInput").RomanticContextInput;
    section_1_relationship_dynamics?: {
      balance_of_power?: { headline?: string; body?: string };
      recovery_speed?: { headline?: string; body?: string };
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
      a_gives_b_headline?: string;
      a_gives_b?: string;
      b_gives_a_headline?: string;
      b_gives_a?: string;
      power_to_each_other?: string;
      only_together_headline?: string;
      only_together: string;
      relationship_formula: string;
      why_special: string;
    };
    section_4_relationship_frames?: {
      reassurance_signal?: {
        headline?: string;
        a_body?: string;
        b_body?: string;
        match_note?: string;
      };
      unconscious_role_play?: { headline?: string; body?: string };
    };
    section_3_conversation_patterns: Record<string, unknown>;
    section_4_hidden_hearts: Record<string, unknown>;
    section_5_action: Record<string, unknown>;
    section_6_timeline: Record<string, unknown>;
    meta?: Record<string, unknown> & {
      romantic_fortune_flow?: RomanticFortuneFlowResult | null;
      psych_match?: RomanticPsychMatchResult | null;
      chemistry_approx?: ChemistryApproxScores | null;
      strength_weakness?: StrengthWeaknessLists | null;
    };
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
