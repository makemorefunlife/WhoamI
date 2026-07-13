import type { PsychMatchAxisResult, PsychMatchType } from "@/lib/relationship/psychMatch";
import type { SecondaryAxisKey } from "@/lib/v2/survey/types";
import { scoreLean, type DomainAxisMeta } from "./shared";
import type { DomainNarrativeCopy } from "./types";

type LeanCopy = Record<"even" | "a_high" | "b_high", DomainNarrativeCopy>;
type AxisCopySet = {
  tension: DomainNarrativeCopy;
  similarity: DomainNarrativeCopy;
  complementary: LeanCopy;
};

function c(
  hook: string,
  narrative: string,
): DomainNarrativeCopy {
  return { hook, narrative };
}

function fallbackCopy(
  matchType: PsychMatchType,
  meta: DomainAxisMeta,
  lean: ReturnType<typeof scoreLean>,
): DomainNarrativeCopy {
  if (matchType === "tension") {
    return c(
      `${meta.topic}, 둘의 방식이 자주 엇갈리나요?`,
      `이 축은 격차가 커서 협업·관계에서 오해가 쌓이기 쉬워요. ${meta.section_hint}과 함께 보면 좋아요.`,
    );
  }
  if (matchType === "similarity") {
    return c(
      `${meta.topic}에서 둘이 꽤 비슷한 편인가요?`,
      `큰 설명 없이도 맞춰가기 쉬운 영역이에요.`,
    );
  }
  void lean;
  return c(
    `${meta.topic}, 한 명이 앞서고 다른 한 명이 받쳐주는 편인가요?`,
    `역할만 나누면 ${meta.topic}이 훨씬 수월해져요. ${meta.section_hint}을 참고하세요.`,
  );
}

function resolveFromSet(
  row: PsychMatchAxisResult,
  set: AxisCopySet | undefined,
  meta: DomainAxisMeta,
  lean: ReturnType<typeof scoreLean>,
): DomainNarrativeCopy {
  if (!set) return fallbackCopy(row.match_type, meta, lean);
  if (row.match_type === "tension") return set.tension;
  if (row.match_type === "similarity") return set.similarity;
  return set.complementary[lean];
}

export const WORK_AXIS_COPY: Partial<Record<SecondaryAxisKey, AxisCopySet>> = {
  structure: {
    tension: c(
      "회의는 '일단 해보자' vs '일정부터 짜자'로 갈리나요?",
      "업무 루틴 기대가 달라 마감·보고에서 서운함이 쌓이기 쉬워요. 「역할 분담」 섹션에서 분업을 정해 보세요.",
    ),
    similarity: c(
      "둘 다 체크리스트·일정 관리를 좋아하는 편인가요?",
      "계획 스타일이 비슷해 프로젝트 진행이 매끄러운 편이에요.",
    ),
    complementary: {
      even: c(
        "한 명은 유연하게, 다른 한 명은 표부터 짜나요?",
        "즉흥형과 계획형이 한 팀이면 '느슨하다' vs '빡빡하다' 오해가 생길 수 있어요. 기획·실행 역할을 나눠 보세요.",
      ),
      a_high: c(
        "일정·프로세스를 더 챙기는 쪽이 있나요?",
        "계획형이 뼈대를 잡고, 다른 쪽이 현장에서 유연하게 돌리면 시너지가 나요.",
      ),
      b_high: c(
        "일정·프로세스를 더 챙기는 쪽이 있나요?",
        "계획형이 뼈대를 잡고, 다른 쪽이 현장에서 유연하게 돌리면 시너지가 나요.",
      ),
    },
  },
  practicality: {
    tension: c(
      "예산·우선순위 얘기만 나오면 분위기가 무거워지나요?",
      "실리를 보는 기준이 달라 '왜 이렇게까지' 싸움이 될 수 있어요. 「믹스 핏」에서 소통 방식을 확인하세요.",
    ),
    similarity: c(
      "둘 다 '일단 효율'부터 보는 편인가요?",
      "현실적인 판단이 맞아 업무 결정이 빨라요.",
    ),
    complementary: {
      even: c(
        "숫자·데이터 vs 분위기·관계, 먼저 보는 쪽이 갈리나요?",
        "한쪽은 ROI부터, 다른 쪽은 팀 분위기부터 챙기면 균형이 좋아요.",
      ),
      a_high: c(
        "비용·효율을 먼저 따지는 쪽이 있나요?",
        "실리 담당과 관계 담당으로 나누면 회의가 짧아져요.",
      ),
      b_high: c(
        "비용·효율을 먼저 따지는 쪽이 있나요?",
        "실리 담당과 관계 담당으로 나누면 회의가 짧아져요.",
      ),
    },
  },
  conflict_style: {
    tension: c(
      "불편한 피드백, 바로 말할 사람과 미루는 사람이 있나요?",
      "갈등을 다루는 속도가 달라 작은 불만이 쌓이기 쉬워요. 「삐졌을 때」 가이드를 꼭 보세요.",
    ),
    similarity: c(
      "둘 다 불편한 얘기를 비교적 빨리 꺼내는 편인가요?",
      "미루지 않아서 팀 내 오해가 덜해요. 말투만 부드럽게 조절하면 충분해요.",
    ),
    complementary: {
      even: c(
        "회의 중 바로 지적 vs 회의 후 따로 말하기, 누가 어느 쪽인가요?",
        "불을 먼저 끄는 사람·정리하는 사람 역할을 정하면 덜 상처받아요.",
      ),
      a_high: c(
        "문제를 먼저 짚는 쪽이 있나요?",
        "직설 담당과 숙성 담당으로 나누면 프로젝트가 덜 멈춰요.",
      ),
      b_high: c(
        "문제를 먼저 짚는 쪽이 있나요?",
        "직설 담당과 숙성 담당으로 나누면 프로젝트가 덜 멈춰요.",
      ),
    },
  },
  decision_style: {
    tension: c(
      "'지금 결정' vs '좀 더 보고 결정'이 자주 충돌하나요?",
      "결정 속도가 달라 마감 직전에 스트레스가 커질 수 있어요.",
    ),
    similarity: c(
      "둘 다 신중하게 결론 내리는 편인가요?",
      "큰 실수는 줄지만, 속도가 느려질 때는 역할 분담이 필요해요.",
    ),
    complementary: {
      even: c(
        "빠른 결정 vs 충분한 검토, 둘 중 어디에 가깝나요?",
        "한 명은 문을 열고, 다른 한 명은 리스크를 체크하면 균형이 좋아요.",
      ),
      a_high: c(
        "더 빨리 결론 내리는 쪽이 있나요?",
        "속전속결 담당과 검토 담당으로 나누면 회의가 효율적이에요.",
      ),
      b_high: c(
        "더 빨리 결론 내리는 쪽이 있나요?",
        "속전속결 담당과 검토 담당으로 나누면 회의가 효율적이에요.",
      ),
    },
  },
  recognition: {
    tension: c(
      "칭찬·인정 표현, 기대하는 양이 다르진 않나요?",
      "노력이 보이지 않는다고 느끼면 사소한 일에도 서운해질 수 있어요.",
    ),
    similarity: c(
      "둘 다 '수고했어' 한마디에 힘이 나는 편인가요?",
      "서로 인정하는 문화를 만들기 쉬운 조합이에요.",
    ),
    complementary: {
      even: c(
        "조용히 일하는 쪽 vs 공개적으로 드러내는 쪽이 있나요?",
        "눈에 띄는 기여와 뒤에서 받치는 기여를 번갈아 인정해 주세요.",
      ),
      a_high: c(
        "인정·피드백을 더 자주 원하는 쪽이 있나요?",
        "짧은 칭찬 루틴만 있어도 팀 분위기가 달라져요.",
      ),
      b_high: c(
        "인정·피드백을 더 자주 원하는 쪽이 있나요?",
        "짧은 칭찬 루틴만 있어도 팀 분위기가 달라져요.",
      ),
    },
  },
  energy_style: {
    tension: c(
      "회의 후 '더 이야기하자' vs '이제 쉬자'로 갈리나요?",
      "에너지 충전 방식이 달라 협업 후 피로가 다르게 쌓여요.",
    ),
    similarity: c(
      "둘 다 사람 만나며 에너지를 얻거나, 둘 다 혼자 쉬며 충전하나요?",
      "휴식·네트워킹 리듬이 맞아 일정 조율이 쉬워요.",
    ),
    complementary: {
      even: c(
        "외부 미팅 vs 책상 작업, 누가 더 편한가요?",
        "대외·내부 역할을 나누면 각자 강점이 살아나요.",
      ),
      a_high: c(
        "사람 만나며 일하는 쪽이 있나요?",
        "대표·영업 담당과 집중 작업 담당으로 나누면 좋아요.",
      ),
      b_high: c(
        "사람 만나며 일하는 쪽이 있나요?",
        "대표·영업 담당과 집중 작업 담당으로 나누면 좋아요.",
      ),
    },
  },
};

export const WORK_DOMAIN_AXES: Partial<
  Record<SecondaryAxisKey, DomainAxisMeta>
> = {
  structure: {
    topic: "업무 루틴",
    section_hint: "「역할 분담」",
    section_key: "roles",
  },
  practicality: {
    topic: "실리·효율",
    section_hint: "「믹스 핏」",
    section_key: "mix_fit",
  },
  conflict_style: {
    topic: "갈등·피드백",
    section_hint: "「삐졌을 때」",
    section_key: "upset",
  },
  decision_style: {
    topic: "의사결정",
    section_hint: "「이상적 직군」",
    section_key: "ideal_roles",
  },
  recognition: {
    topic: "인정·피드백",
    section_hint: "「존중 경계」",
    section_key: "respect",
  },
  energy_style: {
    topic: "협업 에너지",
    section_hint: "「오피스 DNA」",
    section_key: "dna",
  },
};

export const FRIEND_AXIS_COPY: Partial<Record<SecondaryAxisKey, AxisCopySet>> = {
  energy_style: {
    tension: c(
      "약속은 '자주 만나자' vs '가끔 깊게 만나자'로 갈리나요?",
      "만남 빈도 기대가 달라 서운함이 쌓이기 쉬워요. 「우정 주파수」를 같이 보세요.",
    ),
    similarity: c(
      "둘 다 자주 만나거나, 둘 다 여유 있을 때 만나는 편인가요?",
      "연락·만남 리듬이 맞아 피로 없이 이어가기 쉬워요.",
    ),
    complementary: {
      even: c(
        "한 명은 연락왕, 다른 한 명은 답장 느린 편인가요?",
        "연락 담당·공간 담당으로 이해하면 우정이 덜 지쳐요.",
      ),
      a_high: c(
        "먼저 연락하고 약속 잡는 쪽이 있나요?",
        "불씨 담당과 깊이 담당으로 나누면 오래 가요.",
      ),
      b_high: c(
        "먼저 연락하고 약속 잡는 쪽이 있나요?",
        "불씨 담당과 깊이 담당으로 나누면 오래 가요.",
      ),
    },
  },
  empathy: {
    tension: c(
      "힘들다고 할 때, 위로 vs 해결책 중 뭐가 먼저 나오나요?",
      "공감 방식이 달라 '내 말을 몰라줘' 싸움이 생기기 쉬워요.",
    ),
    similarity: c(
      "둘 다 기분부터 읽고 맞춰 주는 편인가요?",
      "감정 공감이 빨라 오해가 덜해요.",
    ),
    complementary: {
      even: c(
        "감정 토크 vs 가볍게 놀기, 누가 어느 쪽에 강한가요?",
        "위로 담당·분위기 담당으로 나누면 편해요.",
      ),
      a_high: c(
        "상대 기분부터 살피는 쪽이 있나요?",
        "감정 라인을 먼저 읽어 주는 사람이 있으면 우정이 단단해져요.",
      ),
      b_high: c(
        "상대 기분부터 살피는 쪽이 있나요?",
        "감정 라인을 먼저 읽어 주는 사람이 있으면 우정이 단단해져요.",
      ),
    },
  },
  stimulation: {
    tension: c(
      "놀 때 '익숙한 데' vs '새로운 데'로 갈리나요?",
      "자극·새로움 욕구가 달라 약속 짜기가 피곤해질 수 있어요.",
    ),
    similarity: c(
      "둘 다 새로운 경험을 좋아하거나, 둘 다 익숙한 게 편한가요?",
      "놀거리 취향이 맞아 계획이 수월해요.",
    ),
    complementary: {
      even: c(
        "한 명은 기획자, 다른 한 명은 따라가며 즐기는 편인가요?",
        "아이디어 담당·실행 담당으로 나누면 심심하지 않아요.",
      ),
      a_high: c(
        "새로운 놀거리를 먼저 제안하는 쪽이 있나요?",
        "기획 담당과 편하게 따라오는 담당으로 나누면 좋아요.",
      ),
      b_high: c(
        "새로운 놀거리를 먼저 제안하는 쪽이 있나요?",
        "기획 담당과 편하게 따라오는 담당으로 나누면 좋아요.",
      ),
    },
  },
  conflict_style: {
    tension: c(
      "서운한 일, 바로 말할 사람과 숙성시킬 사람이 있나요?",
      "갈등을 미루면 친구 사이에도 어색함이 길어질 수 있어요. 「멀어질 때」 가이드를 보세요.",
    ),
    similarity: c(
      "둘 다 서운한 걸 비교적 빨리 털어놓는 편인가요?",
      "오해가 길게 안 가서 우정이 가벼워요.",
    ),
    complementary: {
      even: c(
        "당장 말하기 vs 며칠 뒤 말하기, 패턴이 갈리나요?",
        "'오늘 말할까'만 합의해도 멀어지는 속도가 줄어요.",
      ),
      a_high: c(
        "먼저 솔직하게 말하는 쪽이 있나요?",
        "불 끄는 사람·정리하는 사람 역할을 인정해 주세요.",
      ),
      b_high: c(
        "먼저 솔직하게 말하는 쪽이 있나요?",
        "불 끄는 사람·정리하는 사람 역할을 인정해 주세요.",
      ),
    },
  },
  recognition: {
    tension: c(
      "'고마워' 한마디, 기대하는 타이밍이 다르진 않나요?",
      "인정이 부족하다고 느끼면 작은 일에도 서운해질 수 있어요.",
    ),
    similarity: c(
      "둘 다 칭찬·인정에 힘이 나는 편인가요?",
      "서로 알아주는 말이 잘 통하는 우정이에요.",
    ),
    complementary: {
      even: c(
        "조용히 챙기는 친구 vs 티 내는 친구가 있나요?",
        "보이는 기여와 뒤에서 받치는 기여를 모두 인정해 주세요.",
      ),
      a_high: c(
        "인정·칭찬을 더 자주 원하는 쪽이 있나요?",
        "가벼운 칭찬 루틴만 있어도 우정 온도가 올라가요.",
      ),
      b_high: c(
        "인정·칭찬을 더 자주 원하는 쪽이 있나요?",
        "가벼운 칭찬 루틴만 있어도 우정 온도가 올라가요.",
      ),
    },
  },
  practicality: {
    tension: c(
      "더치·총무, 돈 얘기가 어색해지진 않나요?",
      "실리 감각이 달라 '왜 그렇게까지' 서운해질 수 있어요. 「노는 코드와 돈」을 보세요.",
    ),
    similarity: c(
      "둘 다 돈 계산을 비슷하게 하는 편인가요?",
      "모임비·더치에서 마찰이 적어요.",
    ),
    complementary: {
      even: c(
        "총무·정산을 잘하는 쪽이 한 명 있나요?",
        "숫자 담당·분위기 담당으로 나누면 놀 때 편해요.",
      ),
      a_high: c(
        "영수증·정산을 챙기는 쪽이 있나요?",
        "총무 역할을 인정해 주면 우정이 덜 힘들어져요.",
      ),
      b_high: c(
        "영수증·정산을 챙기는 쪽이 있나요?",
        "총무 역할을 인정해 주면 우정이 덜 힘들어져요.",
      ),
    },
  },
};

export const FRIEND_DOMAIN_AXES: Partial<
  Record<SecondaryAxisKey, DomainAxisMeta>
> = {
  energy_style: {
    topic: "만남·연락",
    section_hint: "「우정 주파수」",
    section_key: "soulmate",
  },
  empathy: {
    topic: "공감·위로",
    section_hint: "「Social DNA」",
    section_key: "dna",
  },
  stimulation: {
    topic: "놀거리·새로움",
    section_hint: "「노는 코드」",
    section_key: "play",
  },
  conflict_style: {
    topic: "서운함·화해",
    section_hint: "「멀어질 때」",
    section_key: "breakup",
  },
  recognition: {
    topic: "인정·칭찬",
    section_hint: "「우정 주파수」",
    section_key: "soulmate2",
  },
  practicality: {
    topic: "돈·더치",
    section_hint: "「노는 코드와 돈」",
    section_key: "money",
  },
};

export const FAMILY_AXIS_COPY: Partial<Record<SecondaryAxisKey, AxisCopySet>> = {
  empathy: {
    tension: c(
      "힘들다고 할 때, 말로 풀어주기 vs 해결책부터 제시하기로 갈리나요?",
      "공감 방식이 달라 '엄마/아빠는 날 몰라' 싸움이 생기기 쉬워요. 「Child DNA」 소통 방식을 보세요.",
    ),
    similarity: c(
      "부모와 자녀 모두 감정을 비교적 잘 말하는 편인가요?",
      "마음을 읽는 속도가 맞아 대화가 수월해요.",
    ),
    complementary: {
      even: c(
        "감정 토크 vs 행동·해결, 누가 어느 쪽에 가깝나요?",
        "위로 담당·실행 담당으로 나누면 훈육이 덜 아파요.",
      ),
      a_high: c(
        "감정을 먼저 읽어 주는 쪽이 있나요?",
        "말하기 전에 기분부터 확인하는 습관이 관계를 부드럽게 해요.",
      ),
      b_high: c(
        "감정을 먼저 읽어 주는 쪽이 있나요?",
        "말하기 전에 기분부터 확인하는 습관이 관계를 부드럽게 해요.",
      ),
    },
  },
  conflict_style: {
    tension: c(
      "화났을 때, 바로 말할 사람과 방에 들어가는 사람이 있나요?",
      "갈등 처리 속도가 달라 작은 일이 크게 번지기 쉬워요. 「갈등 진정」 카드를 보세요.",
    ),
    similarity: c(
      "둘 다 불편한 얘기를 비교적 빨리 꺼내는 편인가요?",
      "서운함이 쌓이지 않아 훈육 마찰이 줄어요.",
    ),
    complementary: {
      even: c(
        "당장 지적 vs 시간 두고 이야기, 패턴이 갈리나요?",
        "'지금 말할까, 저녁에 말할까'만 정해도 덜 상처받아요.",
      ),
      a_high: c(
        "먼저 대화를 시도하는 쪽이 있나요?",
        "불 끄는 사람·정리하는 사람 역할을 인정해 주세요.",
      ),
      b_high: c(
        "먼저 대화를 시도하는 쪽이 있나요?",
        "불 끄는 사람·정리하는 사람 역할을 인정해 주세요.",
      ),
    },
  },
  structure: {
    tension: c(
      "규칙은 '딱 지키자' vs '상황 봐서 유연하게'로 갈리나요?",
      "기준 차이로 '왜 이렇게까지' 훈육 싸움이 될 수 있어요.",
    ),
    similarity: c(
      "집안 규칙·루틴에 대한 기대가 비슷한가요?",
      "약속과 일정이 맞아 생활이 덜 흔들려요.",
    ),
    complementary: {
      even: c(
        "한 명은 틀을 잡고, 다른 한 명은 유연하게 맞추나요?",
        "규칙 설계·현장 조율 역할을 나누면 좋아요.",
      ),
      a_high: c(
        "일정·규칙을 더 챙기는 쪽이 있나요?",
        "구조 담당과 유연 담당으로 나누면 훈육이 수월해요.",
      ),
      b_high: c(
        "일정·규칙을 더 챙기는 쪽이 있나요?",
        "구조 담당과 유연 담당으로 나누면 훈육이 수월해요.",
      ),
    },
  },
  self_control: {
    tension: c(
      "감정이 올라올 때, 참는 쪽과 바로 터지는 쪽이 있나요?",
      "자기조절 격차가 커면 작은 말투에도 상처가 커질 수 있어요.",
    ),
    similarity: c(
      "둘 다 감정을 비교적 차분히 다루는 편인가요?",
      "폭발 전에 멈출 여유가 있어요.",
    ),
    complementary: {
      even: c(
        "한 명은 쿨다운이 빠르고, 다른 한 명은 감정이 길게 가나요?",
        "쉬는 시간·대화 시간을 미리 정해 두세요.",
      ),
      a_high: c(
        "감정을 먼저 삼키는 쪽이 있나요?",
        "참는 사람에게도 '말해도 돼' 신호를 주면 좋아요.",
      ),
      b_high: c(
        "감정을 먼저 삼키는 쪽이 있나요?",
        "참는 사람에게도 '말해도 돼' 신호를 주면 좋아요.",
      ),
    },
  },
  resilience: {
    tension: c(
      "실패·지적 후, 금방 회복하는 쪽과 오래 가는 쪽이 있나요?",
      "회복 속도가 달라 '이미 끝난 얘기' 싸움이 반복될 수 있어요.",
    ),
    similarity: c(
      "둘 다 힘든 일 뒤 비슷한 속도로 회복하나요?",
      "위로와 격려가 잘 통해요.",
    ),
    complementary: {
      even: c(
        "한 명은 금방 털고, 다른 한 명은 마음에 오래 담나요?",
        "회복 시간을 존중해 주는 것만으로도 싸움이 줄어요.",
      ),
      a_high: c(
        "더 빨리 회복하는 쪽이 있나요?",
        "먼저 일어서는 사람이 분위기를 끌어올릴 수 있어요.",
      ),
      b_high: c(
        "더 빨리 회복하는 쪽이 있나요?",
        "먼저 일어서는 사람이 분위기를 끌어올릴 수 있어요.",
      ),
    },
  },
  recognition: {
    tension: c(
      "'잘했어' 한마디, 부모와 자녀가 원하는 양이 다르진 않나요?",
      "인정 부족이 훈육·성적 스트레스로 이어지기 쉬워요. 「효도 리워드」를 보세요.",
    ),
    similarity: c(
      "칭찬·인정에 비슷하게 반응하는 편인가요?",
      "서로 알아주는 말이 관계를 따뜻하게 해요.",
    ),
    complementary: {
      even: c(
        "말로 칭찬 vs 행동으로 보여주기, 누가 어느 쪽인가요?",
        "인정 방식만 맞춰도 집안 분위기가 달라져요.",
      ),
      a_high: c(
        "인정·칭찬을 더 자주 원하는 쪽이 있나요?",
        "짧은 칭찬 루틴이 효과가 커요.",
      ),
      b_high: c(
        "인정·칭찬을 더 자주 원하는 쪽이 있나요?",
        "짧은 칭찬 루틴이 효과가 커요.",
      ),
    },
  },
};

export const FAMILY_DOMAIN_AXES: Partial<
  Record<SecondaryAxisKey, DomainAxisMeta>
> = {
  empathy: {
    topic: "소통·공감",
    section_hint: "「Child DNA」",
    section_key: "child_dna",
  },
  conflict_style: {
    topic: "갈등·훈육",
    section_hint: "「갈등 진정」",
    section_key: "de_escalation",
  },
  structure: {
    topic: "규칙·루틴",
    section_hint: "「성장 터널」",
    section_key: "growth",
  },
  self_control: {
    topic: "감정 조절",
    section_hint: "「Child DNA」",
    section_key: "self_control",
  },
  resilience: {
    topic: "회복·위로",
    section_hint: "「운명적 스코어」",
    section_key: "destiny",
  },
  recognition: {
    topic: "인정·칭찬",
    section_hint: "「효도 리워드」",
    section_key: "filial",
  },
};

export function resolveWorkCopy(
  row: PsychMatchAxisResult,
  meta: DomainAxisMeta,
): DomainNarrativeCopy {
  return resolveFromSet(
    row,
    WORK_AXIS_COPY[row.axis_key],
    meta,
    scoreLean(row.score_a, row.score_b),
  );
}

export function resolveFriendCopy(
  row: PsychMatchAxisResult,
  meta: DomainAxisMeta,
): DomainNarrativeCopy {
  return resolveFromSet(
    row,
    FRIEND_AXIS_COPY[row.axis_key],
    meta,
    scoreLean(row.score_a, row.score_b),
  );
}

export function resolveFamilyCopy(
  row: PsychMatchAxisResult,
  meta: DomainAxisMeta,
): DomainNarrativeCopy {
  return resolveFromSet(
    row,
    FAMILY_AXIS_COPY[row.axis_key],
    meta,
    scoreLean(row.score_a, row.score_b),
  );
}
