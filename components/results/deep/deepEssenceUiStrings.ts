import type { Locale } from "@/lib/i18n/locale";

/**
 * Static (non-LLM-generated) UI copy for the deep-essence report — part
 * numbers, section labels, table headers, badges. The report's actual
 * content (strengths, energy summary, etc.) comes from the LLM in the
 * requested locale already; this file only covers the surrounding chrome.
 * Adapted from the Lovable "Inner Compass" design's own `ui` dictionary.
 */
export type DeepEssenceUiStrings = {
  summaryLabels: { coreMode: string; energyBalance: string; growthEdge: string };
  radar: { caption: string; current: string; potential: string };
  layeredIdentity: {
    sectionTitle: string;
    sectionTag: string;
    layers: {
      firstImpression: string;
      knownSelf: string;
      closePrivateSelf: string;
      naturalSelfAndDeepNeeds: string;
    };
  };
  part1: {
    num: string;
    label: string;
    subtitle: string;
    title: string;
    strengthsTitle: string;
    strengthsTag: string;
    watchoutsTitle: string;
    watchoutsTag: string;
  };
  part2: {
    num: string;
    label: string;
    subtitle: string;
    title: string;
    metaPrefix: string;
    fuels: string;
    drains: string;
    optimal: string;
    relationalSpend: string;
    selfReturn: string;
    others: string;
  };
  part3: {
    num: string;
    label: string;
    subtitle: string;
    title: string;
    meta: string;
    peopleFit: string;
    peopleFriction: string;
    languageRewritten: string;
    wounds: string;
    steadies: string;
  };
  part4: {
    num: string;
    label: string;
    subtitle: string;
    title: string;
    meta: string;
    situationalTips: string;
    situation: string;
    oldResponse: string;
    tryInstead: string;
    whenHeated: string;
    weeklyReset: string;
  };
  part5: {
    num: string;
    label: string;
    subtitle: string;
    title: string;
    meta: string;
    remember: string;
    nextLeap: string;
  };
  checklist: { appendix: string; title: string; todaySuffix: string };
};

const EN: DeepEssenceUiStrings = {
  summaryLabels: {
    coreMode: "Core mode",
    energyBalance: "Energy balance",
    growthEdge: "Growth edge",
  },
  radar: {
    caption: "Current state vs. essence potential",
    current: "Current state",
    potential: "Essence potential",
  },
  layeredIdentity: {
    sectionTitle: "The many layers of you",
    sectionTag: "Layers",
    layers: {
      firstImpression: "How you land on someone new",
      knownSelf: "How you show up once they know you",
      closePrivateSelf: "How you are with people closest to you",
      naturalSelfAndDeepNeeds: "Your most natural self & deepest needs",
    },
  },
  part1: {
    num: "Part 01",
    label: "Self",
    subtitle: "Restoring your interior baseline",
    title: "Who you are, underneath.",
    strengthsTitle: "Your three strengths",
    strengthsTag: "Signal",
    watchoutsTitle: "Three things to watch",
    watchoutsTag: "Friction",
  },
  part2: {
    num: "Part 02",
    label: "Energy",
    subtitle: "Where your reserves quietly go",
    title: "Where your energy actually goes",
    metaPrefix: "Relational spend",
    fuels: "Fuels",
    drains: "Drains",
    optimal: "Optimal",
    relationalSpend: "Relational spend",
    selfReturn: "Self return",
    others: "Others",
  },
  part3: {
    num: "Part 03",
    label: "Relationships",
    subtitle: "How closeness lands with you",
    title: "How you connect",
    meta: "Deep · watch for deference",
    peopleFit: "People who fit",
    peopleFriction: "Where friction shows up",
    languageRewritten: "Language, rewritten",
    wounds: "Wounds",
    steadies: "Steadies",
  },
  part4: {
    num: "Part 04",
    label: "Practice",
    subtitle: "Scripts for the harder moments",
    title: "A playbook for the harder moments",
    meta: "Solutions · scripts",
    situationalTips: "Situational playbook",
    situation: "Situation",
    oldResponse: "Old response",
    tryInstead: "Try instead",
    whenHeated: "When it heats up",
    weeklyReset: "Weekly reset",
  },
  part5: {
    num: "Part 05",
    label: "Forward",
    subtitle: "The direction already yours",
    title: "What's next for you",
    meta: "Direction · leap",
    remember: "Three things to remember",
    nextLeap: "The next leap",
  },
  checklist: {
    appendix: "Appendix",
    title: "A checklist for today",
    todaySuffix: "% today",
  },
};

const KO: DeepEssenceUiStrings = {
  summaryLabels: {
    coreMode: "핵심 모드",
    energyBalance: "에너지 균형",
    growthEdge: "성장의 지점",
  },
  radar: {
    caption: "현재 상태 vs. 본질적 잠재력",
    current: "현재 상태",
    potential: "본질적 잠재력",
  },
  layeredIdentity: {
    sectionTitle: "당신의 여러 겹",
    sectionTag: "레이어",
    layers: {
      firstImpression: "처음 만난 사람이 느끼는 나",
      knownSelf: "알고 나면 보이는 나",
      closePrivateSelf: "아주 가까운 사람이 아는 나",
      naturalSelfAndDeepNeeds: "가장 자연스러운 나 / 깊은 욕구",
    },
  },
  part1: {
    num: "Part 01",
    label: "나 자신",
    subtitle: "표면 아래의 결을 다시 감각하기",
    title: "표면 아래의 당신",
    strengthsTitle: "당신의 세 가지 강점",
    strengthsTag: "시그널",
    watchoutsTitle: "지켜봐야 할 세 가지",
    watchoutsTag: "마찰",
  },
  part2: {
    num: "Part 02",
    label: "에너지",
    subtitle: "당신의 에너지가 조용히 빠져나가는 곳",
    title: "당신의 에너지는 어디로 흐르는가",
    metaPrefix: "관계 소모",
    fuels: "채워주는 것",
    drains: "빼앗는 것",
    optimal: "최적의 환경",
    relationalSpend: "관계 소모",
    selfReturn: "나에게 돌아옴",
    others: "타인",
  },
  part3: {
    num: "Part 03",
    label: "관계",
    subtitle: "가까움이 당신에게 닿는 방식",
    title: "당신이 연결되는 방식",
    meta: "깊은 연결 · 의존 주의",
    peopleFit: "잘 맞는 사람들",
    peopleFriction: "마찰이 생기는 지점",
    languageRewritten: "다시 쓰는 말",
    wounds: "상처",
    steadies: "안정",
  },
  part4: {
    num: "Part 04",
    label: "실천",
    subtitle: "어려운 순간을 위한 문장들",
    title: "어려운 순간을 위한 플레이북",
    meta: "해결책 · 스크립트",
    situationalTips: "상황별 실전팁",
    situation: "상황",
    oldResponse: "예전 반응",
    tryInstead: "이렇게 바꿔보세요",
    whenHeated: "감정이 격해질 때",
    weeklyReset: "주간 리셋",
  },
  part5: {
    num: "Part 05",
    label: "앞으로",
    subtitle: "이미 당신의 것인 방향",
    title: "당신에게 다가올 것",
    meta: "방향 · 도약",
    remember: "기억해야 할 세 가지",
    nextLeap: "다음 도약",
  },
  checklist: {
    appendix: "부록",
    title: "오늘의 체크리스트",
    todaySuffix: "% 완료",
  },
};

export function getDeepEssenceUiStrings(locale: Locale): DeepEssenceUiStrings {
  return locale === "ko-KR" ? KO : EN;
}
