import type { Locale } from "@/lib/i18n/locale";
import type { PrimaryAxisKey } from "@/lib/v2/survey/types";

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
  axisInterpretation: {
    /** IA Batch 1 — Part-level header (this section's own toggle-header title/tag, distinct from the sub-heading fields below). */
    sectionTitle: string;
    sectionTag: string;
    glossaryTitle: string;
    glossaryTag: string;
    /** Batch 8 — static, neutral, spectrum-framed per-axis meaning. Never LLM-generated. */
    glossary: Record<PrimaryAxisKey, string>;
    gapSectionTitle: string;
    gapSectionTag: string;
    alignmentSectionTitle: string;
    alignmentSectionTag: string;
    naturalTendencyLabel: string;
    currentPatternLabel: string;
    currentPatternAlignedLabel: string;
    givesYouLabel: string;
    mayCostLabel: string;
    mayWorkBetterLabel: string;
    whyItFeelsEasyLabel: string;
  };
  /** Dynamic behavioral translation based on actual scoring direction */
  axisBehaviorSentences: Record<PrimaryAxisKey, { high: string; low: string }>;
  layeredIdentity: {
    sectionTitle: string;
    sectionTag: string;
    /** IA Batch 2 — small editorial lead-in shown above the synthesis closing paragraph. Omit rendering it (not just the string) if it ever reads as over-explaining rather than framing. */
    synthesisLabel: string;
    layers: {
      firstImpression: string;
      knownSelf: string;
      closePrivateSelf: string;
      naturalSelfAndDeepNeeds: string;
    };
  };
  /** IA Batch 3 — Part 04 ("그래서 나는 왜 이렇게 살아왔을까요?"). No numbered `num`/`meta` here — the display number is computed dynamically from section position in DeepEssenceReport.tsx, same as layeredIdentity/axisInterpretation. */
  adaptationStory: {
    sectionTitle: string;
    sectionTag: string;
  };
  part1: {
    num: string;
    label: string;
    subtitle: string;
    title: string;
    /** Unused since IA Batch 1 (strengths/watchouts moved to part2) — kept so no reference site needs updating if one still points here. */
    strengthsTitle: string;
    strengthsTag: string;
    watchoutsTitle: string;
    watchoutsTag: string;
    /** IA Batch 1 — deterministic (radarCurrent max/min axis), no LLM involved. */
    mostUsedAxisLabel: string;
    leastUsedAxisLabel: string;
    highestTag: string;
    lowestTag: string;
  };
  part2: {
    num: string;
    label: string;
    subtitle: string;
    title: string;
    metaPrefix: string;
    fuels: string;
    drains: string;
    /** Unused here since IA Batch 1 (moved to part3.optimal) — kept for reference-site safety. */
    optimal: string;
    relationalSpend: string;
    selfReturn: string;
    others: string;
    /** IA Batch 1 — strengths/watchouts moved in from part1, reframed per the new IA's "pattern, not people" tone. */
    strengthsTitle: string;
    strengthsTag: string;
    watchoutsTitle: string;
    watchoutsTag: string;
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
    /** IA Batch 1 — energy.optimal merged in from part2. */
    optimal: string;
    optimalTitle: string;
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
    keepLabel: string;
    loosenLabel: string;
    recoverLabel: string;
    decisionCompassTitle: string;
    doTitle: string;
    dontTitle: string;
    decisionRulesTitle: string;
    oneNextMoveTitle: string;
    oneNextMoveTag: string;
  };
  checklist: { appendix: string; title: string; todaySuffix: string };
};

const EN: DeepEssenceUiStrings = {
  summaryLabels: {
    coreMode: "Core Operating Mode",
    energyBalance: "Relational Spend / Recovery Ratio",
    growthEdge: "Growth Opportunity",
  },
  radar: {
    caption: "Current state vs. essence potential",
    current: "Current state",
    potential: "Essence potential",
  },
  axisInterpretation: {
    sectionTitle: "How have I changed over time?",
    sectionTag: "Gap & Alignment",
    glossaryTitle: "What do the six criteria mean?",
    glossaryTag: "Glossary",
    glossary: {
      structure: "How much planning and set criteria you need when doing things",
      connection: "How much energy you gain from connecting with people",
      stability: "How much you value familiarity and predictability",
      growth: "How actively you pursue new challenges and growth",
      adaptability: "How easily you shift your approach when conditions change",
      autonomy: "How much weight you place on your own judgment when choosing",
    },
    gapSectionTitle: "Where you've adapted the most",
    gapSectionTag: "Gap",
    alignmentSectionTitle: "Where it already comes easy",
    alignmentSectionTag: "Aligned",
    naturalTendencyLabel: "Original natural style",
    currentPatternLabel: "How you adapted in real life",
    currentPatternAlignedLabel: "How you still operate naturally",
    givesYouLabel: "Strengths built over time",
    mayCostLabel: "Energy spent to maintain",
    mayWorkBetterLabel: "What may work better",
    whyItFeelsEasyLabel: "Why it takes less effort",
  },
  axisBehaviorSentences: {
    structure: {
      high: "Places high weight on clear plans and set criteria when doing things",
      low: "Adjusts with the moment rather than relying heavily on set plans or criteria",
    },
    connection: {
      high: "Gains significant energy from connecting and spending time with people",
      low: "Gains more energy from quiet personal time than from social connection",
    },
    stability: {
      high: "Places high weight on familiarity, routine, and predictability",
      low: "Values new changes and fresh attempts over familiar predictability",
    },
    growth: {
      high: "Actively pursues new challenges, learning, and growth",
      low: "Values preserving existing stability over pursuing new challenges",
    },
    adaptability: {
      high: "Pivots and adapts approach easily when circumstances change",
      low: "Holds firmly to existing ways and principles even when circumstances change",
    },
    autonomy: {
      high: "Places primary weight on personal judgment when making choices",
      low: "Places more weight on others' input and advice than on personal judgment when making choices",
    },
  },
  adaptationStory: {
    sectionTitle: "So this is how you've been living",
    sectionTag: "The story so far",
  },
  layeredIdentity: {
    sectionTitle: "The many layers of you",
    sectionTag: "Layers",
    synthesisLabel: "So people may describe you a little differently",
    layers: {
      firstImpression: "How you land on someone new",
      knownSelf: "How you show up once they know you",
      closePrivateSelf: "How you are with people closest to you",
      naturalSelfAndDeepNeeds: "Your most natural self & deepest needs",
    },
  },
  part1: {
    num: "Part 01",
    label: "Now",
    subtitle: "How you're actually living right now",
    title: "This is you, right now.",
    strengthsTitle: "Your three strengths",
    strengthsTag: "Signal",
    watchoutsTitle: "Three things to watch",
    watchoutsTag: "Friction",
    mostUsedAxisLabel: "What you're leaning on most right now",
    leastUsedAxisLabel: "What's getting less use right now",
    highestTag: "Primary operating trait",
    lowestTag: "Complementary flexible trait",
  },
  part2: {
    num: "Part 02",
    label: "Energy",
    subtitle: "Not weaker — just spending energy differently",
    title: "Doing well, and still tired sometimes",
    metaPrefix: "Relational spend",
    fuels: "Fuels",
    drains: "Drains",
    optimal: "Optimal",
    relationalSpend: "Relational spend",
    selfReturn: "Self return",
    others: "Others",
    strengthsTitle: "The strengths you use naturally",
    strengthsTag: "Signal",
    watchoutsTitle: "What's strong, but tiring to keep up",
    watchoutsTag: "Cost",
  },
  part3: {
    num: "Part 03",
    label: "Fit",
    subtitle: "Where you function more like yourself",
    title: "Who and where you're more like yourself",
    meta: "Preference · Environment",
    peopleFit: "People who fit",
    peopleFriction: "Where friction shows up",
    languageRewritten: "Communication that lands better",
    wounds: "Triggers defensiveness",
    steadies: "Reaches you effectively",
    optimal: "Optimal",
    optimalTitle: "Environments that fit",
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
    label: "Choosing",
    subtitle: "A standard to come back to",
    title: "Choosing more like yourself, going forward",
    meta: "Direction · leap",
    remember: "Three things to remember",
    nextLeap: "The next leap",
    keepLabel: "What to keep",
    loosenLabel: "What to loosen",
    recoverLabel: "What to recover",
    decisionCompassTitle: "Decision Compass",
    doTitle: "DO — Intentionally keep doing these",
    dontTitle: "DON'T — Patterns not to overuse",
    decisionRulesTitle: "My Decision Rules",
    oneNextMoveTitle: "One Next Move",
    oneNextMoveTag: "Next Step",
  },
  checklist: {
    appendix: "Appendix",
    title: "A checklist for today",
    todaySuffix: "% today",
  },
};

const KO: DeepEssenceUiStrings = {
  summaryLabels: {
    coreMode: "지금 나를 움직이는 방식",
    energyBalance: "관계 소모 / 자기 회복 비율",
    growthEdge: "지금 더 키워갈 힘",
  },
  radar: {
    caption: "현재 상태 vs. 본질적 잠재력",
    current: "현재 상태",
    potential: "본질적 잠재력",
  },
  axisInterpretation: {
    sectionTitle: "살아오면서, 나는 어떻게 달라졌을까요?",
    sectionTag: "차이와 정렬",
    glossaryTitle: "여섯 가지 기준은 무엇을 의미하나요?",
    glossaryTag: "용어",
    glossary: {
      structure: "일을 할 때 계획과 기준이 얼마나 필요한가",
      connection: "사람과의 연결에서 얼마나 에너지를 얻는가",
      stability: "익숙함과 예측 가능성을 얼마나 중요하게 여기는가",
      growth: "새로운 도전과 발전을 얼마나 적극적으로 추구하는가",
      adaptability: "상황이 바뀌었을 때 얼마나 쉽게 방식을 바꾸는가",
      autonomy: "선택할 때 내 판단을 얼마나 중요하게 두는가",
    },
    gapSectionTitle: "가장 많이 적응해온 부분",
    gapSectionTag: "차이",
    alignmentSectionTitle: "이미 편하게 잘 맞는 부분",
    alignmentSectionTag: "정렬",
    naturalTendencyLabel: "본래 더 편한 방식",
    currentPatternLabel: "현실에서 익숙해진 방식",
    currentPatternAlignedLabel: "지금도 자연스럽게 쓰는 방식",
    givesYouLabel: "살아오며 생긴 힘",
    mayCostLabel: "그만큼 드는 에너지",
    mayWorkBetterLabel: "더 편하게 활용하는 방법",
    whyItFeelsEasyLabel: "그래서 힘을 덜 들이고 잘 쓰는 부분",
  },
  axisBehaviorSentences: {
    structure: {
      high: "일을 할 때 계획과 기준을 중요하게 둬요",
      low: "일을 할 때 계획이나 기준보다 상황에 맞춰 움직여요",
    },
    connection: {
      high: "사람과의 연결에서 에너지를 많이 얻어요",
      low: "사람과의 연결보다 혼자만의 시간에서 에너지를 얻어요",
    },
    stability: {
      high: "익숙함과 예측 가능성을 중요하게 여겨요",
      low: "익숙함보다 새로운 변화나 시도를 더 중요하게 여겨요",
    },
    growth: {
      high: "새로운 도전과 발전을 적극적으로 추구해요",
      low: "새로운 도전보다 현재 갖춰진 안정을 소중히 여겨요",
    },
    adaptability: {
      high: "상황이 바뀌었을 때 방식을 쉽게 잘 바꿔요",
      low: "상황이 바뀌어도 기존 방식이나 소신을 쉽게 바꾸지 않아요",
    },
    autonomy: {
      high: "선택할 때 내 판단을 가장 중요하게 둬요",
      low: "선택할 때 내 판단보다 주변의 의견을 더 중요하게 둬요",
    },
  },
  adaptationStory: {
    sectionTitle: "그래서 나는 왜 이렇게 살아왔을까요?",
    sectionTag: "지금까지의 이야기",
  },
  layeredIdentity: {
    sectionTitle: "당신의 여러 겹",
    sectionTag: "레이어",
    synthesisLabel: "그래서 사람마다 보는 당신이 조금 다를 수 있어요",
    layers: {
      firstImpression: "처음 만난 사람이 느끼는 나",
      knownSelf: "알고 나면 보이는 나",
      closePrivateSelf: "아주 가까운 사람이 아는 나",
      naturalSelfAndDeepNeeds: "가장 자연스러운 나 / 깊은 욕구",
    },
  },
  part1: {
    num: "Part 01",
    label: "지금",
    subtitle: "지금, 당신은 이렇게 살아가고 있어요",
    title: "지금의 당신",
    strengthsTitle: "당신의 세 가지 강점",
    strengthsTag: "시그널",
    watchoutsTitle: "지켜봐야 할 세 가지",
    watchoutsTag: "마찰",
    mostUsedAxisLabel: "지금 가장 많이 쓰고 있는 축",
    leastUsedAxisLabel: "지금 상대적으로 덜 쓰고 있는 축",
    highestTag: "이게 있어야 편한 성향",
    lowestTag: "억지로 하지 않아도 편한 성향",
  },
  part2: {
    num: "Part 02",
    label: "에너지",
    subtitle: "약해서가 아니라, 이렇게 에너지를 쓰고 있었어요",
    title: "잘하고 있는데, 왜 피곤할 때가 있을까요",
    metaPrefix: "관계 소모",
    fuels: "채워주는 것",
    drains: "빼앗는 것",
    optimal: "최적의 환경",
    relationalSpend: "관계 소모",
    selfReturn: "나에게 돌아옴",
    others: "타인",
    strengthsTitle: "내가 자연스럽게 잘 쓰는 힘",
    strengthsTag: "시그널",
    watchoutsTitle: "잘하지만 오래 쓰면 지치는 방식",
    watchoutsTag: "비용",
  },
  part3: {
    num: "Part 03",
    label: "어울림",
    subtitle: "내가 더 나답게 기능하는 곳",
    title: "나는 어떤 사람과 환경에서 가장 나다워질까요",
    meta: "관계 선호 · 최적 환경",
    peopleFit: "잘 맞는 사람들",
    peopleFriction: "마찰이 생기는 지점",
    languageRewritten: "이렇게 말하면 더 잘 들려요",
    wounds: "나를 닫게 만드는 방식",
    steadies: "나에게 더 잘 들어오는 방식",
    optimal: "최적의 환경",
    optimalTitle: "나에게 잘 맞는 환경",
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
    label: "선택",
    subtitle: "돌아올 수 있는 기준",
    title: "앞으로 더 나답게 선택한다는 것",
    meta: "방향 · 나침반",
    remember: "선택을 앞두고 조용히 점검할 기준",
    nextLeap: "선택할 때 기억할 단 하나의 기준",
    keepLabel: "01 · 계속 가져갈 것",
    loosenLabel: "02 · 조금 덜 해도 되는 것",
    recoverLabel: "03 · 다시 회복해도 되는 것",
    decisionCompassTitle: "선택할 때 기억할 단 하나의 기준",
    oneNextMoveTitle: "지금 당신에게 가장 중요한 한 가지",
    oneNextMoveTag: "작은 실험",
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
