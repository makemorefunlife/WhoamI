import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import {
  buildPsychMatchResult,
  psychMatchAxisKoLabel,
  type PsychMatchAxisResult,
  type PsychMatchResult,
  type PsychMatchType,
} from "@/lib/relationship/psychMatch";
import { buildNeutralV2Profile } from "@/lib/v2/survey/neutralProfile";
import type { CurrentSelfProfile, SecondaryAxisKey } from "@/lib/v2/survey/types";

type HomeAxisCopyConfig = {
  home_topic: string;
  section_hint: string;
  /** money_chores | bedroom | family_boundary | upset | dna */
  section_key: string;
};

const HOME_AXIS_CONFIG: Record<SecondaryAxisKey, HomeAxisCopyConfig | null> = {
  conflict_style: {
    home_topic: "갈등·화해",
    section_hint: "아래 「갈등 & 화해」",
    section_key: "upset",
  },
  practicality: {
    home_topic: "돈·생활 실리",
    section_hint: "「돈과 집안일」",
    section_key: "money_chores",
  },
  structure: {
    home_topic: "집안 루틴",
    section_hint: "「돈과 집안일」",
    section_key: "money_chores",
  },
  self_control: {
    home_topic: "수면·생활 리듬",
    section_hint: "「침실 케미스트리」",
    section_key: "bedroom",
  },
  energy_style: {
    home_topic: "에너지·활동량",
    section_hint: "「홈 라이프 DNA」",
    section_key: "dna",
  },
  empathy: {
    home_topic: "시댁·경계",
    section_hint: "「가족 경계」",
    section_key: "family_boundary",
  },
  stimulation: null,
  resilience: null,
  recognition: null,
  thinking_style: null,
  decision_style: null,
};

export type MarriageHomePsychHighlight = {
  axis_key: SecondaryAxisKey;
  axis_label: string;
  gap: number;
  match_type: PsychMatchType;
  home_topic: string;
  section_hint: string;
  hook: string;
  narrative: string;
};

export type MarriageHomePsychLens = {
  intro_line: string;
  highlights: MarriageHomePsychHighlight[];
};

export type MarriagePsychMatchBundle = {
  psych_match: PsychMatchResult;
  home_psych_lens: MarriageHomePsychLens;
};

function psychHasSurvey(psych: PsychMasterJson): boolean {
  return psych.survey_source === "v2_10q";
}

function profileFromPsychMaster(psych: PsychMasterJson): CurrentSelfProfile {
  const base = buildNeutralV2Profile();
  return {
    ...base,
    secondary_axes: { ...psych.secondary_axes },
  };
}

function scoreLean(
  scoreA: number,
  scoreB: number,
): "a_high" | "b_high" | "even" {
  const gap = Math.abs(scoreA - scoreB);
  if (gap < 10) return "even";
  return scoreA > scoreB ? "a_high" : "b_high";
}

type HomeNarrativeCopy = {
  hook: string;
  narrative: string;
};

function copyForAxis(
  row: PsychMatchAxisResult,
  cfg: HomeAxisCopyConfig,
): HomeNarrativeCopy {
  const lean = scoreLean(row.score_a, row.score_b);
  const key = row.axis_key;

  if (row.match_type === "tension") {
    return tensionCopy(key, cfg);
  }
  if (row.match_type === "similarity") {
    return similarityCopy(key, cfg);
  }
  return complementaryCopy(key, cfg, lean);
}

function tensionCopy(
  key: SecondaryAxisKey,
  cfg: HomeAxisCopyConfig,
): HomeNarrativeCopy {
  const byAxis: Partial<Record<SecondaryAxisKey, HomeNarrativeCopy>> = {
    conflict_style: {
      hook: "싸운 뒤 밤, 먼저 말 걸 사람이 없으면 집 안 공기가 얼어붙나요?",
      narrative: `둘 다 ${cfg.home_topic}에서 '내 방식'이 맞다고 느끼기 쉬워요. 작은 불씨도 키우지 말고, ${cfg.section_hint}에서 화해 루틴을 미리 정해 두는 게 좋아요.`,
    },
    practicality: {
      hook: "통장·생활비 얘기만 나오면 분위기가 급격히 무거워지나요?",
      narrative: `돈과 실리를 보는 기준이 꽤 달라요. 숫자 싸움이 감정 싸움이 되지 않게, ${cfg.section_hint}의 역할 분담을 참고해 보세요.`,
    },
    structure: {
      hook: "집안일은 '대충 오늘 하자' vs '표부터 짜자'로 갈리나요?",
      narrative: `루틴과 계획에 대한 기대가 달라서, 사소한 집안일도 서운함으로 번지기 쉬워요. ${cfg.section_hint}와 함께 보면 덜 헷갈려요.`,
    },
    self_control: {
      hook: "한 명은 일찍 자고, 다른 한 명은 밤늦게까지 깨어 있나요?",
      narrative: `수면·생활 리듬 격차가 커서, 피곤한 날 작은 말투에도 예민해질 수 있어요. ${cfg.section_hint}에서 맞춰볼 포인트가 나와요.`,
    },
    energy_style: {
      hook: "주말에 '집콕' vs '밖에 나가자'가 자주 충돌하나요?",
      narrative: `에너지를 충전하는 방식이 달라, 쉬는 날에도 서로 지칠 수 있어요. ${cfg.section_hint}에서 각자 배터리 타입을 확인해 보세요.`,
    },
    empathy: {
      hook: "시댁·처가 이야기만 나와도 집 분위기가 바뀌나요?",
      narrative: `감정을 읽고 맞추는 속도가 달라, '왜 몰라줘' 싸움이 생기기 쉬워요. ${cfg.section_hint}에서 경계선을 같이 짜 보세요.`,
    },
  };
  return (
    byAxis[key] ?? {
      hook: `한 지붕 아래서 ${cfg.home_topic}만큼은 자주 엇갈릴 수 있어요.`,
      narrative: `이 축은 격차가 커서, 말하지 않으면 오해가 쌓이기 쉬워요. ${cfg.section_hint}을 함께 보면 좋아요.`,
    }
  );
}

function similarityCopy(
  key: SecondaryAxisKey,
  cfg: HomeAxisCopyConfig,
): HomeNarrativeCopy {
  const byAxis: Partial<Record<SecondaryAxisKey, HomeNarrativeCopy>> = {
    conflict_style: {
      hook: "불편한 얘기도 비교적 빨리 꺼내는 편인가요, 둘 다?",
      narrative: `갈등을 미루지 않는 편이라, 쌓인 서운함이 덜해요. 다만 둘 다 직설적이면 말투만 부드럽게 조절하는 게 포인트예요.`,
    },
    practicality: {
      hook: "영수증·통장, 둘 다 챙기는 편인가요?",
      narrative: `돈·실리 감각이 비슷해서 생활비·저축 얘기가 수월해요. ${cfg.section_hint}에서 역할만 나누면 더 편해져요.`,
    },
    structure: {
      hook: "집안일도 '언제 할지'부터 맞추는 편인가요?",
      narrative: `루틴·계획 스타일이 비슷해, 같이 살며 규칙을 맞추기 쉬운 조합이에요.`,
    },
    self_control: {
      hook: "둘 다 밤늦게까지 버티는 편, 아니면 일찍 쉬는 편?",
      narrative: `생활 리듬이 비슷하면 침실·쉬는 시간에서 마찰이 적어요. ${cfg.section_hint}도 읽기 편해요.`,
    },
    energy_style: {
      hook: "주말에 둘 다 '나가자' vs '집이 좋다' 쪽이 비슷한가요?",
      narrative: `에너지 사용 패턴이 맞아, 휴일 계획에서 덜 싸워요.`,
    },
    empathy: {
      hook: "상대 기분부터 읽는 편, 둘 다 그런가요?",
      narrative: `시댁·처가 이슈에서도 감정 공감이 빨라, '왜 이해 못 해' 싸움이 적은 편이에요. ${cfg.section_hint}에서 경계만 정하면 돼요.`,
    },
  };
  return (
    byAxis[key] ?? {
      hook: `${cfg.home_topic}에서는 둘이 꽤 비슷한 편이에요.`,
      narrative: `큰 설명 없이도 맞춰가기 쉬운 영역이에요.`,
    }
  );
}

function complementaryCopy(
  key: SecondaryAxisKey,
  cfg: HomeAxisCopyConfig,
  lean: "a_high" | "b_high" | "even",
): HomeNarrativeCopy {
  const byAxis: Record<
    SecondaryAxisKey,
    Record<"a_high" | "b_high" | "even", HomeNarrativeCopy> | null
  > = {
    conflict_style: {
      even: {
        hook: "싸운 뒤, 한 명은 바로 말하고 다른 한 명은 숙성시키나요?",
        narrative: `갈등을 다루는 속도가 달라요. '오늘 말할까, 내일 말할까'만 합의해도 밤싸움이 줄어요. ${cfg.section_hint}을 같이 보세요.`,
      },
      a_high: {
        hook: "불편한 얘기, 먼저 꺼내는 쪽이 한 명 있나요?",
        narrative: `한쪽이 불을 먼저 끄고, 다른 쪽이 나중에 솔직해지는 패턴이 될 수 있어요. 먼저 말하는 사람·정리하는 사람 역할을 나눠 보세요.`,
      },
      b_high: {
        hook: "불편한 얘기, 먼저 꺼내는 쪽이 한 명 있나요?",
        narrative: `한쪽이 불을 먼저 끄고, 다른 쪽이 나중에 솔직해지는 패턴이 될 수 있어요. 먼저 말하는 사람·정리하는 사람 역할을 나눠 보세요.`,
      },
    },
    practicality: {
      even: {
        hook: "장보기·통장 확인, 손이 더 빨리 가는 쪽이 한 명인가요?",
        narrative: `한쪽은 숫자·실리부터 보고, 다른 쪽은 분위기·여유를 먼저 챙기는 식으로 갈릴 수 있어요. ${cfg.section_hint}에서 CFO 역할만 정해도 편해져요.`,
      },
      a_high: {
        hook: "생활비·저축, 더 꼼꼼히 챙기는 쪽이 있나요?",
        narrative: `한쪽이 영수증·통장부터 확인하고, 다른 쪽은 '괜찮아' 파이프일 수 있어요. 돈 얘기는 숫자 담당·분위기 담당으로 나누면 덜 싸워요.`,
      },
      b_high: {
        hook: "생활비·저축, 더 꼼꼼히 챙기는 쪽이 있나요?",
        narrative: `한쪽이 영수증·통장부터 확인하고, 다른 쪽은 '괜찮아' 파이프일 수 있어요. 돈 얘기는 숫자 담당·분위기 담당으로 나누면 덜 싸워요.`,
      },
    },
    structure: {
      even: {
        hook: "집안일은 '오늘 하자' vs '일정부터 짜자'로 갈리나요?",
        narrative: `한쪽은 유연하게, 다른 쪽은 표·루틴부터 잡으려 할 수 있어요. 청소·장보기 담당을 번갈아 정하면 서운함이 줄어요.`,
      },
      a_high: {
        hook: "집안일 표·체크리스트, 더 좋아하는 쪽이 있나요?",
        narrative: `계획형과 즉흥형이 한 집에 살면 '느슨해 보인다' vs '빡빡하다' 오해가 생기기 쉬워요. ${cfg.section_hint}의 분담 가이드를 참고하세요.`,
      },
      b_high: {
        hook: "집안일 표·체크리스트, 더 좋아하는 쪽이 있나요?",
        narrative: `계획형과 즉흥형이 한 집에 살면 '느슨해 보인다' vs '빡빡하다' 오해가 생기기 쉬워요. ${cfg.section_hint}의 분담 가이드를 참고하세요.`,
      },
    },
    self_control: {
      even: {
        hook: "밤 12시가 넘어도 한 명은 깨어 있고, 다른 한 명은 이미 쳐져 있나요?",
        narrative: `수면·자기관리 리듬이 달라 피곤한 날 말투가 거칠어지기 쉬워요. ${cfg.section_hint}에서 수면 핏을 확인해 보세요.`,
      },
      a_high: {
        hook: "일찍 자고 일찍 일어나는 쪽, 한 명 있나요?",
        narrative: `생활 리듬이 다른 만큼, '조용히 해' vs '왜 일찍 자' 갈등이 생길 수 있어요. 침실·취침 시간만 맞춰도 홈 리스크가 줄어요.`,
      },
      b_high: {
        hook: "일찍 자고 일찍 일어나는 쪽, 한 명 있나요?",
        narrative: `생활 리듬이 다른 만큼, '조용히 해' vs '왜 일찍 자' 갈등이 생길 수 있어요. 침실·취침 시간만 맞춰도 홈 리스크가 줄어요.`,
      },
    },
    energy_style: {
      even: {
        hook: "주말에 '집이 최고' vs '나가야 숨 쉰다'가 갈리나요?",
        narrative: `에너지를 채우는 방식이 달라, 휴일 계획에서 자주 엇갈릴 수 있어요. 번갈아 '집콕 주'·'외출 주'만 정해도 싸움이 줄어요.`,
      },
      a_high: {
        hook: "사람 만나고 돌아다니는 쪽, 한 명 있나요?",
        narrative: `외향·내향 배터리가 다르면 '왜 안 나가' vs '왜 또 나가'가 반복되기 쉬워요. ${cfg.section_hint}에서 각자 충전 방식을 확인하세요.`,
      },
      b_high: {
        hook: "사람 만나고 돌아다니는 쪽, 한 명 있나요?",
        narrative: `외향·내향 배터리가 다르면 '왜 안 나가' vs '왜 또 나가'가 반복되기 쉬워요. ${cfg.section_hint}에서 각자 충전 방식을 확인하세요.`,
      },
    },
    empathy: {
      even: {
        hook: "시댁 문자 왔을 때, 먼저 표정 읽는 쪽이 한 명인가요?",
        narrative: `한쪽은 분위기·감정부터, 다른 쪽은 사실·해결부터 잡으려 할 수 있어요. 시댁·처가 이야기는 '감정 담당·정리 담당'만 나눠도 덜 지쳐요.`,
      },
      a_high: {
        hook: "상대 기분부터 살피는 쪽, 한 명 있나요?",
        narrative: `감정 공감 속도가 달라 '왜 몰라줘' vs '그냥 해결하면 되잖아'가 생기기 쉬워요. ${cfg.section_hint}에서 경계선을 같이 짜 보세요.`,
      },
      b_high: {
        hook: "상대 기분부터 살피는 쪽, 한 명 있나요?",
        narrative: `감정 공감 속도가 달라 '왜 몰라줘' vs '그냥 해결하면 되잖아'가 생기기 쉬워요. ${cfg.section_hint}에서 경계선을 같이 짜 보세요.`,
      },
    },
    stimulation: null,
    resilience: null,
    recognition: null,
    thinking_style: null,
    decision_style: null,
  };

  const axisCopy = byAxis[key];
  if (!axisCopy) {
    return {
      hook: `${cfg.home_topic}, 둘의 방식이 꽤 다른 편이에요.`,
      narrative: `역할을 나누면 ${cfg.home_topic}이 훨씬 수월해져요. ${cfg.section_hint}을 참고하세요.`,
    };
  }
  return axisCopy[lean];
}

function homeAxisInterestScore(row: PsychMatchAxisResult): number {
  let score = row.gap;
  if (row.match_type === "tension") score += 35;
  else if (row.match_type === "complementary") score += 12;
  else score += 4;
  return score;
}

function pickHomeHighlights(
  axisResults: PsychMatchAxisResult[],
): PsychMatchAxisResult[] {
  const homeRows = axisResults.filter((row) => HOME_AXIS_CONFIG[row.axis_key]);
  const ranked = [...homeRows].sort(
    (a, b) => homeAxisInterestScore(b) - homeAxisInterestScore(a),
  );

  const picked: PsychMatchAxisResult[] = [];
  const usedSectionKeys = new Set<string>();

  for (const row of ranked) {
    if (picked.length >= 3) break;
    const cfg = HOME_AXIS_CONFIG[row.axis_key]!;
    if (picked.length >= 1 && usedSectionKeys.has(cfg.section_key)) {
      continue;
    }
    picked.push(row);
    usedSectionKeys.add(cfg.section_key);
  }

  if (picked.length < 3) {
    for (const row of ranked) {
      if (picked.length >= 3) break;
      if (picked.some((p) => p.axis_key === row.axis_key)) continue;
      picked.push(row);
    }
  }

  return picked.slice(0, 3);
}

export function buildMarriageHomePsychLens(
  psychMatch: PsychMatchResult,
): MarriageHomePsychLens {
  const highlights = pickHomeHighlights(psychMatch.axis_results).map((row) => {
    const cfg = HOME_AXIS_CONFIG[row.axis_key]!;
    const copy = copyForAxis(row, cfg);
    return {
      axis_key: row.axis_key,
      axis_label: psychMatchAxisKoLabel(row.axis_key),
      gap: row.gap,
      match_type: row.match_type,
      home_topic: cfg.home_topic,
      section_hint: cfg.section_hint,
      hook: copy.hook,
      narrative: copy.narrative,
    };
  });

  const hasTension = highlights.some((h) => h.match_type === "tension");

  return {
    intro_line: hasTension
      ? "위 차트는 11축 전체예요. 아래는 같이 살면서 특히 체감되기 쉬운 장면을 짚었어요 — 읽다 보면 '아, 우리 그 얘기네'가 나올 수 있어요."
      : "위 차트는 11축 전체예요. 아래는 한 지붕 아래서 자주 나오는 질문들이에요. 편한 건 그대로 두고, 엇갈리는 부분만 역할로 나눠 보세요.",
    highlights,
  };
}

export function buildMarriagePsychMatchBundle(
  psychA: PsychMasterJson | null | undefined,
  psychB: PsychMasterJson | null | undefined,
): MarriagePsychMatchBundle | null {
  if (!psychA || !psychB) return null;
  if (!psychHasSurvey(psychA) || !psychHasSurvey(psychB)) return null;

  const psych_match = buildPsychMatchResult({
    profileA: profileFromPsychMaster(psychA),
    profileB: profileFromPsychMaster(psychB),
  });

  return {
    psych_match,
    home_psych_lens: buildMarriageHomePsychLens(psych_match),
  };
}
