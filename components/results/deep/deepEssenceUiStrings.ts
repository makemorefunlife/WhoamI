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
    oneNextMoveTitle: string;
    oneNextMoveTag: string;
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
  axisInterpretation: {
    sectionTitle: "Where you and your essence differ",
    sectionTag: "Gap & Alignment",
    glossaryTitle: "What the six axes mean",
    glossaryTag: "Glossary",
    glossary: {
      autonomy:
        "Where you tend to put more weight when making decisions — your own judgment, or other people's input.",
      connection:
        "Where you land between closeness with others and time on your own — whichever feels more comfortable.",
      stability:
        "Whether familiar, predictable situations or new changes tend to feel more steadying to you.",
      growth:
        "Whether sticking with what already works or trying and learning something new pulls at you more.",
      structure:
        "How much planning and structure feels comfortable to you — a set way of doing things, or adjusting as you go, whichever comes more naturally.",
      adaptability:
        "When things change, whether holding your existing approach or shifting with the moment feels more natural.",
    },
    gapSectionTitle: "Where you've adapted the most",
    gapSectionTag: "Gap",
    alignmentSectionTitle: "Where it already comes easy",
    alignmentSectionTag: "Aligned",
    naturalTendencyLabel: "Original natural style",
    currentPatternLabel: "How you adapted in real life",
    currentPatternAlignedLabel: "How you still operate naturally",
    givesYouLabel: "The capability you gained",
    mayCostLabel: "The hidden energy cost",
    mayWorkBetterLabel: "What may work better",
    whyItFeelsEasyLabel: "Why it takes less effort",
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
    languageRewritten: "Language, rewritten",
    wounds: "Wounds",
    steadies: "Steadies",
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
    coreMode: "핵심 모드",
    energyBalance: "에너지 균형",
    growthEdge: "성장의 지점",
  },
  radar: {
    caption: "현재 상태 vs. 본질적 잠재력",
    current: "현재 상태",
    potential: "본질적 잠재력",
  },
  axisInterpretation: {
    sectionTitle: "지금의 나와 본래의 나는 어디에서 달라졌을까요?",
    sectionTag: "차이와 정렬",
    glossaryTitle: "여섯 축이 보여주는 것",
    glossaryTag: "용어",
    glossary: {
      autonomy:
        "결정을 내릴 때 자신의 판단과 다른 사람의 의견 사이에서 어디에 더 무게를 두는지를 보여줘요.",
      connection:
        "사람들과 가깝게 연결되어 있는 것과 혼자만의 시간 사이에서 어느 쪽이 더 편안한지를 보여줘요.",
      stability:
        "익숙하고 예측 가능한 상황과 새로운 변화 사이에서 어느 쪽에 더 안정감을 느끼는지를 보여줘요.",
      growth:
        "지금의 방식을 유지하는 것과 새로운 걸 시도하고 배우는 것 사이에서 어디에 더 끌리는지를 보여줘요.",
      structure:
        "계획과 구조가 어느 정도 있어야 편한지를 보여줘요. 미리 정해진 방식과 상황에 따라 유연하게 바꾸는 방식 중 어느 쪽이 더 자연스러운지도 함께 봐요.",
      adaptability:
        "상황이 바뀔 때 기존 방식을 지키는 것과 그때그때 맞춰 바꾸는 것 중 어느 쪽이 더 자연스러운지를 보여줘요.",
    },
    gapSectionTitle: "가장 많이 적응해온 부분",
    gapSectionTag: "차이",
    alignmentSectionTitle: "이미 편하게 잘 맞는 부분",
    alignmentSectionTag: "정렬",
    naturalTendencyLabel: "본래 더 편한 방식",
    currentPatternLabel: "현실에서 익숙해진 방식",
    currentPatternAlignedLabel: "지금도 자연스럽게 쓰는 방식",
    givesYouLabel: "그 과정에서 얻은 힘",
    mayCostLabel: "대신 더 많이 쓰게 된 에너지",
    mayWorkBetterLabel: "더 편하게 활용하는 방법",
    whyItFeelsEasyLabel: "그래서 힘을 덜 들이고 잘 쓰는 부분",
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
    languageRewritten: "다시 쓰는 말",
    wounds: "상처",
    steadies: "안정",
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
