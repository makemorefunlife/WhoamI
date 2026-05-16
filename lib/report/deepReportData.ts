"use client";

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends readonly unknown[]
    ? T[K]
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K];
};

export type ReportHeaderData = {
  partLabel: string;
  navigationLabel: string;
  title: string;
  subtitleLines?: string[];
};

export type ReportQuoteData = {
  heading: string;
  quote: string;
  caption: string;
};

export type ReportExpandableSectionData = {
  heading: string;
  summary: string;
  details?: string;
};

export type ReportListItemData = {
  title: string;
  body: string;
};

export type ReportCuratedItemData = {
  title: string;
  eyebrow?: string;
  body: string;
};

export type ReportLinesItemData = {
  lines: string[];
};

export type ReportPairItemData = {
  hurt: string;
  support: string;
};

export type ReportDialogueItemData = {
  context: string;
  before: string;
  after: string;
};

export type ReportMeterItemData = {
  label: string;
  value: number;
};

export type Part1ReportData = {
  header: ReportHeaderData;
  quote: ReportQuoteData;
  outer: ReportExpandableSectionData;
  inner: ReportExpandableSectionData;
  strengths: {
    heading: string;
    items: ReportCuratedItemData[];
  };
  caution: ReportExpandableSectionData;
  signature: {
    heading: string;
    items: ReportLinesItemData[];
  };
  next: {
    label: string;
    title: string;
    body: string;
  };
};

export type Part2ReportData = {
  header: ReportHeaderData;
  source: {
    heading: string;
    items: ReportListItemData[];
  };
  drain: {
    heading: string;
    items: ReportListItemData[];
  };
  rhythm: {
    heading: string;
    items: ReportListItemData[];
  };
  flow: {
    heading: string;
    meters: ReportMeterItemData[];
    summary: string;
  };
};

export type Part3ReportData = {
  header: ReportHeaderData;
  pattern: {
    heading: string;
    paragraphs: string[];
  };
  comfort: {
    heading: string;
    items: ReportListItemData[];
  };
  discomfort: {
    heading: string;
    items: ReportListItemData[];
  };
  words: {
    heading: string;
    hurtLabel: string;
    supportLabel: string;
    pairs: ReportPairItemData[];
  };
  balance: {
    heading: string;
    paragraphs: string[];
  };
};

export type Part4ReportData = {
  header: ReportHeaderData;
  rules: {
    heading: string;
    items: ReportListItemData[];
  };
  dialogue: {
    heading: string;
    items: ReportDialogueItemData[];
  };
  calm: {
    heading: string;
    items: ReportListItemData[];
  };
  boundary: {
    heading: string;
    items: ReportListItemData[];
  };
  closing: {
    heading: string;
    paragraphs: string[];
  };
};

export type Part5ReportData = {
  header: ReportHeaderData;
  remember: {
    heading: string;
    items: ReportListItemData[];
  };
  direction: {
    heading: string;
    items: ReportListItemData[];
  };
  closing: {
    heading: string;
    paragraphs: string[];
  };
  checklist: {
    heading: string;
    intro: string;
    items: string[];
    outro?: string;
  };
};

export type DeepReportData = {
  parts: {
    part1: Part1ReportData;
    part2: Part2ReportData;
    part3: Part3ReportData;
    part4: Part4ReportData;
    part5: Part5ReportData;
  };
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cloneValue<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => cloneValue(item)) as T;
  }
  if (isPlainObject(value)) {
    const result: Record<string, unknown> = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      result[key] = cloneValue(nestedValue);
    }
    return result as T;
  }
  return value;
}

function mergeWithFallbacks<T>(base: T, override?: DeepPartial<T>): T {
  if (override === undefined || override === null) {
    return cloneValue(base);
  }

  if (Array.isArray(base)) {
    if (Array.isArray(override) && override.length > 0) {
      return cloneValue(override as T);
    }
    return cloneValue(base);
  }

  if (isPlainObject(base)) {
    const result: Record<string, unknown> = {};
    const overrideObject = isPlainObject(override) ? override : {};

    for (const [key, value] of Object.entries(base)) {
      result[key] = mergeWithFallbacks(
        value,
        overrideObject[key as keyof typeof overrideObject] as DeepPartial<typeof value> | undefined,
      );
    }

    return result as T;
  }

  if (typeof base === "string") {
    if (typeof override === "string") {
      const overrideText = override as string;
      if (overrideText.trim()) {
        return overrideText as T;
      }
    }
    return base;
  }

  return (override as T) ?? base;
}

/**
 * TODO: Replace this sample object with user-specific LLM output mapped into `DeepReportData`.
 * The report UI should keep rendering from this shape only.
 */
export const SAMPLE_DEEP_REPORT_DATA: DeepReportData = {
  parts: {
    part1: {
      header: {
        partLabel: "Part 1",
        navigationLabel: "나",
        title: "나는 어떤 사람인가",
      },
      quote: {
        heading: "한 문장으로 표현한 당신",
        quote: "너는 자유로운 바람처럼, 새로운 가능성을 탐색하는 존재야.",
        caption: "새로운 생각과 가능성을 발견할 때, 가장 너다운 표정이 자연스럽게 드러나요.",
      },
      outer: {
        heading: "겉으로 보이는 모습",
        summary:
          "사람들과의 연결 속에서 자연스럽게 분위기를 이끄는 타입이에요. 먼저 다가가고, 흐름을 정리하고, 어색한 공기를 부드럽게 풀어내는 힘이 있어요.",
        details:
          "사람들과의 소통을 즐기고, 활발하게 활동하는 모습이 드러납니다. 친구들과의 대화에서 리더십을 발휘하고, 새로운 사람들과의 만남에서도 주도적으로 이야기를 이끌어가는 모습이 있습니다.",
      },
      inner: {
        heading: "내면의 흐름",
        summary:
          "겉은 밝지만, 내면은 생각보다 깊고 민감한 편이에요. 감정을 오래 품고 혼자 정리하려는 경향도 있어요. 누군가를 쉽게 지나치지 못하고, 작은 여운도 오래 마음속에 남겨 두는 편입니다.",
        details:
          "타인의 감정을 잘 이해하고 지지하려는 모습이 강합니다. 다만 때로는 감정에 쉽게 영향을 받거나, 속으로 복잡한 마음을 오래 품을 수 있습니다.",
      },
      strengths: {
        heading: "당신의 강점",
        items: [
          {
            title: "창의적인 사고",
            eyebrow: "익숙한 틀을 조금 비껴 바라보는 감각",
            body: "직관적으로 문제를 바라보며, 익숙한 방식 바깥에서 새로운 해결책을 제안하는 힘이 있어요.",
          },
          {
            title: "감정적 이해",
            eyebrow: "사람의 마음 결을 먼저 읽어내는 힘",
            body: "타인의 감정을 깊이 이해하고, 공감하며 지지하는 능력이 뛰어나요. 사람들은 당신 곁에서 쉽게 마음을 놓게 됩니다.",
          },
          {
            title: "안정감 제공",
            eyebrow: "흔들리는 흐름 안에서도 중심을 남기는 결",
            body: "주변에 편안함과 신뢰를 주고, 깊은 관계를 맺는 데 강점이 있어요. 복잡한 상황에서도 중심을 잃지 않게 하는 결이 있습니다.",
          },
        ],
      },
      caution: {
        heading: "조심하면 좋은 감정 흐름",
        summary:
          "스트레스와 감정의 영향을 쉽게 받는 편이에요. 감정에 휩쓸리기 전에, 스스로를 챙기는 시간이 필요해요.",
        details:
          "작은 일에도 부담을 느끼거나, 감정적으로 흔들릴 수 있습니다. 타인의 감정에 지나치게 영향을 받지 않도록 자기 관리가 필요합니다. 감정을 숨기기보다 적절하게 표현하는 연습도 도움이 됩니다.",
      },
      signature: {
        heading: "가장 나다운 순간",
        items: [
          {
            lines: ["친구들과의 대화 속에서", "아이디어를 나누며 이야기를 이끌어갈 때"],
          },
          {
            lines: ["친구가 힘들어할 때", "위로하고 함께 시간을 내며 기분을 전환시켜줄 때"],
          },
        ],
      },
      next: {
        label: "다음 탐험",
        title: "나의 에너지와 환경",
        body: "에너지가 어디에서 충전되고, 어디에서 소진되는지 이어서 천천히 살펴볼게요.",
      },
    },
    part2: {
      header: {
        partLabel: "Part 2",
        navigationLabel: "에너지",
        title: "나의 에너지와 환경",
        subtitleLines: ["어디에서 충전되고,", "어디에서 소진되는지 살펴볼게요."],
      },
      source: {
        heading: "나에게 힘을 주는 순간",
        items: [
          {
            title: "사람들과 깊게 연결될 때",
            body: "아이디어를 나누고 감정을 주고받는 순간, 당신의 에너지는 자연스럽게 살아나요. 대화의 온기가 곧 창의력의 불씨가 됩니다.",
          },
          {
            title: "자연의 숨을 따라 걸을 때",
            body: "바람과 나무의 향기를 느끼며 잠시 속도를 늦추면, 마음은 평온을 되찾고 안쪽의 열정도 천천히 다시 돌아와요.",
          },
          {
            title: "창작에 몰입하는 시간",
            body: "디자인이나 사회적 프로젝트처럼 아이디어를 손으로 옮기는 시간은 당신에게 큰 만족을 줘요. 몰입할수록 에너지도 더 또렷해집니다.",
          },
        ],
      },
      drain: {
        heading: "나를 지치게 하는 흐름",
        items: [
          {
            title: "모든 책임을 한꺼번에 안을 때",
            body: "해야 할 일을 모두 품으려는 순간, 당신의 흐름은 빠르게 무거워질 수 있어요. 먼저 우선순위를 나누는 것만으로도 에너지는 조금 가벼워집니다.",
          },
          {
            title: "타인의 감정을 오래 붙들고 있을 때",
            body: "누군가의 마음을 세심하게 읽는 일은 당신의 장점이지만, 그 감정을 너무 오래 품고 있으면 정작 내 마음은 뒤로 밀려날 수 있어요.",
          },
          {
            title: "작은 갈등이 오래 남을 때",
            body: "사람 사이의 균열은 생각보다 깊은 잔상을 남겨요. 바로 해결하려 하기보다, 한 발 물러서서 호흡을 정리하는 시간이 도움이 됩니다.",
          },
        ],
      },
      rhythm: {
        heading: "잘 맞는 환경과 리듬",
        items: [
          {
            title: "함께 목표를 만드는 환경",
            body: "사람들과 소통하고 협업하는 과정에서 당신의 강점은 더 또렷하게 살아나요. 연결 속에서 에너지가 자연스럽게 순환합니다.",
          },
          {
            title: "감정이 존중되는 분위기",
            body: "서로의 마음을 함부로 밀어붙이지 않는 환경일수록 당신은 더 편안하게 성장해요. 안정된 공기는 당신에게 가장 좋은 리듬이 됩니다.",
          },
          {
            title: "혼자 탐구할 수 있는 독립적인 시간",
            body: "아이디어를 천천히 파고들고 창작에 잠길 수 있는 고요한 시간이 있어야 에너지의 균형이 돌아옵니다. 혼자 있는 시간도 당신에게는 중요한 충전이에요.",
          },
        ],
      },
      flow: {
        heading: "나의 에너지 흐름",
        meters: [
          { label: "사람·관계에 쓰는 에너지", value: 80 },
          { label: "나에게 돌아오는 에너지", value: 40 },
          { label: "혼자 재충전하는 시간", value: 20 },
        ],
        summary:
          "사람들과의 관계에 많은 에너지를 쓰는 편이라, 즐거움도 크지만 스스로에게 되돌아오는 충전은 상대적으로 적을 수 있어요. 자연 속에서 쉬거나 예술 활동에 몰입하는 시간을 조금 더 늘릴수록, 당신의 리듬은 더 안정되고 부드럽게 이어질 거예요.",
      },
    },
    part3: {
      header: {
        partLabel: "Part 3",
        navigationLabel: "관계",
        title: "관계와 나",
        subtitleLines: ["사람들과 연결될 때,", "내 마음은 어떤 흐름을 가지는지 살펴볼게요."],
      },
      pattern: {
        heading: "관계에서 반복되는 패턴",
        paragraphs: [
          "당신은 관계 안에서 긍정적인 에너지를 나누고, 가능하면 더 깊은 연결로 이어가고 싶어 해요. 그래서 대화 속에서도 상대의 기분을 누구보다 먼저 눈치채고, 그 마음을 먼저 보듬으려는 쪽에 가까워요.",
          "하지만 그렇게 상대를 먼저 챙기다 보면, 정작 자신의 감정은 뒤로 밀릴 때가 있어요. 오래 이어지는 관계를 위해서는 솔직하게 마음을 드러내고, 내 감정도 같은 무게로 놓는 균형이 필요해요.",
        ],
      },
      comfort: {
        heading: "편안함을 느끼는 연결",
        items: [
          {
            title: "감정을 안정적으로 표현하는 사람",
            body: "스스로의 마음을 숨기지 않고 차분히 전하는 사람과 함께할 때, 당신도 자연스럽게 긴장을 풀고 깊은 연결을 느껴요.",
          },
          {
            title: "긍정과 유머를 잃지 않는 사람",
            body: "가벼운 웃음과 밝은 시선을 가진 사람은 당신의 에너지를 부드럽게 끌어올려 줘요. 함께 있는 시간이 더 따뜻하게 기억됩니다.",
          },
          {
            title: "열린 마음으로 소통하는 사람",
            body: "생각과 아이디어를 편견 없이 받아들이는 사람과는 대화 자체가 편안한 흐름이 돼요. 당신의 말도 더 자연스럽게 살아납니다.",
          },
        ],
      },
      discomfort: {
        heading: "불편함을 느끼는 흐름",
        items: [
          {
            title: "비판이 먼저 앞서는 대화",
            body: "지나치게 부정적이거나 비판적인 태도는 당신의 에너지를 빠르게 소모시켜요. 대화의 공기가 무거워질수록 마음도 쉽게 움츠러들 수 있어요.",
          },
          {
            title: "감정이 닫혀 있는 관계",
            body: "감정 표현이 너무 적은 사람과의 소통에서는 서로를 읽기 어려워져요. 이해받지 못한다는 느낌이 쌓이면 관계도 쉽게 멀어질 수 있어요.",
          },
          {
            title: "한쪽 의견만 남는 흐름",
            body: "고집이 세고 자신의 의견만 고수하는 사람과의 관계는 당신에게 스트레스로 남기 쉬워요. 생각이 무시되는 순간, 연결감도 빠르게 약해집니다.",
          },
        ],
      },
      words: {
        heading: "상처가 되는 말과 힘이 되는 말",
        hurtLabel: "상처가 되기 쉬운 말",
        supportLabel: "힘이 되는 말",
        pairs: [
          { hurt: "너는 항상 그렇게 생각해?", support: "너의 생각이 정말 흥미롭네." },
          { hurt: "왜 이렇게 감정적이야?", support: "너의 감정을 이해하려고 해." },
          { hurt: "그건 별로야.", support: "그 아이디어도 나쁘지 않은 것 같아." },
        ],
      },
      balance: {
        heading: "관계 안에서 필요한 균형",
        paragraphs: [
          "당신은 관계를 소중히 여기는 만큼, 상대의 마음을 먼저 살피는 편이에요.",
          "하지만 오래 지속되는 연결을 위해서는 당신의 감정도 같은 무게로 놓이는 시간이 필요해요. 솔직한 표현은 관계를 가볍게 만들기보다, 오히려 더 깊고 안정적으로 이어지게 해줄 거예요.",
        ],
      },
    },
    part4: {
      header: {
        partLabel: "Part 4",
        navigationLabel: "소통팁",
        title: "관계를 더 편하게",
        subtitleLines: ["조금 더 편안하고 건강하게 연결되기 위한 흐름을 살펴볼게요."],
      },
      rules: {
        heading: "나만의 소통 규칙",
        items: [
          {
            title: "감정을 존중하며 듣는 대화",
            body: "상대의 말을 서둘러 정리하기보다, 먼저 그 감정이 어떤 결인지 들어보는 태도가 관계를 부드럽게 만들어요.",
          },
          {
            title: "내 마음도 숨기지 않는 솔직함",
            body: "감정을 참는 것이 평화를 만드는 건 아니에요. 차분하게 표현된 진심은 오히려 서로를 더 깊이 이해하게 해줘요.",
          },
          {
            title: "불편할 때는 숨 쉴 틈을 만드는 것",
            body: "대화가 무거워질수록 잠시 다른 주제로 옮겨가거나 속도를 늦추는 선택이 필요해요. 여백은 관계를 지키는 방식이기도 해요.",
          },
          {
            title: "긍정적인 피드백을 남기는 습관",
            body: "상대의 생각이나 감정에 따뜻하게 반응하는 말 한마디는 연결의 밀도를 바꿔요. 관계는 그런 작은 신호로 깊어집니다.",
          },
        ],
      },
      dialogue: {
        heading: "상황 속의 대화 흐름",
        items: [
          {
            context: "친구가 힘들어할 때",
            before: "내가 어떻게 도와줄까?",
            after: "너의 기분을 이해해. 어떤 도움이 필요할까?",
          },
          {
            context: "갈등이 생겼을 때",
            before: "그냥 나 혼자 해결할게.",
            after: "우리 함께 해결책을 찾아보자.",
          },
          {
            context: "상대방이 나를 무시할 때",
            before: "내가 왜 무시당하지?",
            after: "그럴 수도 있겠지만, 내 생각도 중요해.",
          },
        ],
      },
      calm: {
        heading: "감정이 격해질 때 필요한 흐름",
        items: [
          {
            title: "한 발 물러서서 바라보기",
            body: "감정이 빠르게 올라올 때는 바로 반응하기보다, 상황을 조금 떨어져서 보는 시간이 필요해요. 그 짧은 거리감이 마음을 다시 정리해 줍니다.",
          },
          {
            title: "상대의 기분까지 함께 고려하며 말하기",
            body: "솔직함은 중요하지만, 감정이 격한 순간일수록 표현의 속도와 톤을 낮추는 것이 관계를 더 안전하게 지켜줘요.",
          },
          {
            title: "잠시 멈추고 숨을 고르는 선택",
            body: "상황이 지나치게 감정적으로 흐를 때는 대화를 잠깐 멈추는 것도 괜찮아요. 깊은 호흡 한 번이 불필요한 상처를 줄여줄 수 있어요.",
          },
        ],
      },
      boundary: {
        heading: "관계를 정리하거나 거리두어야 할 때",
        items: [
          {
            title: "반복해서 상처를 남기는 말과 행동",
            body: "상대의 말이나 태도가 계속 마음을 다치게 한다면, 그 관계를 다시 바라볼 필요가 있어요. 참는 것보다 먼저 스스로를 보호해야 해요.",
          },
          {
            title: "내 감정이 계속 소진되고 있다는 느낌",
            body: "함께한 뒤마다 지나치게 지치고 공허해진다면, 그 관계는 당신의 에너지를 너무 많이 가져가고 있을 수 있어요.",
          },
          {
            title: "대화가 늘 부정적이고 무거울 때",
            body: "만날 때마다 스트레스와 긴장만 남는 관계라면, 거리두기나 정리를 고려하는 것도 건강한 선택이에요. 관계를 지키는 일보다 나를 지키는 일이 먼저일 수 있어요.",
          },
        ],
      },
      closing: {
        heading: "관계 안에서 잊지 말아야 할 것",
        paragraphs: [
          "당신은 관계를 오래 지켜가고 싶은 마음이 큰 사람이에요.",
          "하지만 건강한 연결은 참는 것만으로 유지되지 않아요. 서로의 감정이 편안하게 머물 수 있는 관계 안에서, 당신도 조금 더 자연스럽고 안전해질 수 있어요.",
        ],
      },
    },
    part5: {
      header: {
        partLabel: "Part 5",
        navigationLabel: "앞으로",
        title: "앞으로의 나",
        subtitleLines: ["지금까지의 흐름을 안고,", "앞으로의 나를 천천히 바라볼게요."],
      },
      remember: {
        heading: "기억하면 좋을 세 가지",
        items: [
          {
            title: "너의 창의력과 독창성",
            body: "당신의 아이디어와 생각은 예상보다 더 멀리 닿을 수 있어요. 자연스럽게 떠오르는 시선과 감각이 누군가에게는 작은 영감이 되기도 해요.",
          },
          {
            title: "타인의 감정을 이해하는 마음",
            body: "감정적으로 민감하다는 것은 쉽게 흔들린다는 뜻만은 아니에요. 누군가의 마음을 깊이 읽고 관계를 다정하게 이어갈 수 있는 힘이기도 해요.",
          },
          {
            title: "스스로를 돌보는 감각",
            body: "감정적으로 힘든 순간이 와도, 결국 당신을 가장 오래 지켜주는 것은 자기 관리의 감각이에요. 나를 잘 돌보는 일이 곧 삶의 균형을 지켜줘요.",
          },
        ],
      },
      direction: {
        heading: "한 걸음 더 나가기 위한 방향",
        items: [
          {
            title: "감정을 조금 더 자주 표현해보기",
            body: "마음을 다양한 방식으로 나누는 연습은 관계를 억지로 넓히기보다, 지금 있는 연결을 더 깊게 만들어줄 수 있어요.",
          },
          {
            title: "상대의 감정보다 내 마음도 먼저 살피기",
            body: "누군가의 기분에 쉽게 닿는 사람일수록, 내 감정이 어디쯤 와 있는지 먼저 확인하는 시간이 필요해요. 그 균형이 당신을 더 편안하게 지켜줄 거예요.",
          },
          {
            title: "새로운 연결을 가볍게 열어두기",
            body: "새로운 사람들과의 만남은 거창한 변화가 아니라, 당신의 세계를 조금 더 넓히는 방식일 수 있어요. 가벼운 대화 하나도 충분한 시작이 됩니다.",
          },
        ],
      },
      closing: {
        heading: "마무리",
        paragraphs: [
          "당신은 이미 자신의 창의력과 감정의 결로, 주변의 공기를 조금 더 따뜻하게 만드는 사람이에요.",
          "앞으로도 그 고유한 에너지를 잃지 않으면서, 사람들과의 관계를 소중히 여기고 스스로를 돌보는 마음까지 함께 가져가면 좋아요.",
          "가끔은 멈추고 쉬어가도 괜찮아요. 당신의 감정과 필요를 다정하게 살피는 시간이, 앞으로의 삶을 조금 더 편안하고 풍요롭게 만들어줄 거예요.",
        ],
      },
      checklist: {
        heading: "오늘의 나를 위한 체크리스트",
        intro: "오늘을 완벽하게 채우기보다, 마음이 닿는 것 하나만 골라 지나가도 충분해요.",
        items: [
          "하루에 10분씩 나의 감정을 기록해보기",
          "친구와의 대화에서 긍정적인 피드백 주기",
          "자연 속에서 재충전하는 시간을 가지기",
          "상대방의 감정을 존중하며 경청하기",
          "갈등이 생겼을 때 함께 해결책 찾기",
          "내 감정을 솔직하게 표현하기",
          "불편한 관계에서 한 발 물러서기",
          "감정이 격해질 때 깊은 호흡하기",
        ],
        outro: "하나만 해내도, 오늘의 당신은 충분해요.",
      },
    },
  },
};

export function buildDeepReportData(override?: DeepPartial<DeepReportData>): DeepReportData {
  return mergeWithFallbacks(SAMPLE_DEEP_REPORT_DATA, override);
}

export function getDeepReportData(reportText?: string): DeepReportData {
  // TODO: Map user-specific LLM output into a `DeepPartial<DeepReportData>`.
  // For example, transform parsed output from `parseReportStructure` into this shape
  // and pass it to `buildDeepReportData(llmOverride)`.
  void reportText;

  const llmOverride: DeepPartial<DeepReportData> | undefined = undefined;
  return buildDeepReportData(llmOverride);
}
