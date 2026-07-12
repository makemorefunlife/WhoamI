export type RelationshipTriScores = {
  affection: number;
  chemistry: number;
  sensitivity: number;
};

export type RelationshipIndexInsightPattern =
  | "balanced"
  | "affection_over_chemistry"
  | "chemistry_dominant"
  | "sensitivity_high"
  | "sensitivity_low"
  | "affection_dominant"
  | "mixed_gap";

const BALANCE_GAP = 10;
const DOMINANCE_GAP = 8;

const INSIGHT_LINES: Record<RelationshipIndexInsightPattern, readonly string[]> = {
  balanced: [
    "끌림·편안함·마찰의 강도가 비슷하게 맞춰져 있어, 관계 전반이 고르게 흘러가는 편이에요.",
    "세 지표가 크게 어긋나지 않아, 가까워질 때도 다툴 때도 균형을 찾기 쉬운 조합이에요.",
  ],
  affection_over_chemistry: [
    "끌림은 강한데 함께 편안하게 맞춰 가는 감은 조금 뒤따라올 수 있어요. 설렘과 일상 사이를 천천히 잇는 게 포인트예요.",
    "마음이 먼저 가는 편이라 끌림은 분명한데, 함께 있는 편안함은 천천히 깊어지는 조합이에요. 있는 그대로의 리듬을 존중하면 좋아요.",
  ],
  chemistry_dominant: [
    "함께 있을 때의 편안함과 맞춤이 강점이에요. 끌림보다 ‘잘 맞는 느낌’이 관계를 단단하게 붙여 줍니다.",
    "함께 있는 편안함이 두드러져서, 같이 있으면 일이 잘 풀리는 조합이에요. 그 편안함을 자주 경험할수록 관계가 깊어져요.",
  ],
  sensitivity_high: [
    "가까워질수록 신경 쓰이는 지점이 또렷해요. 아래 갈등 패턴에서 짚어 드릴게요.",
    "가까워질수록 마음이 흔들리는 지점이 다른 면보다 또렷해요. 어디서 마찰이 나는지 아래에서 함께 살펴볼게요.",
  ],
  sensitivity_low: [
    "부딪혀도 금방 회복되는 편안한 흐름이에요. 크게 상처받기보다 다시 맞춰 가기 쉬운 조합입니다.",
    "마음이 흔들리는 정도가 낮아 갈등이 길게 끌지 않는 흐름이에요. 마음이 가는 대로 가까워지기 좋아요.",
  ],
  affection_dominant: [
    "서로 끌리는 마음이 가장 두드러져, 만남의 설렘이 관계의 중심축이에요.",
    "끌림이 앞서는 조합이라, 서로를 향한 마음이 관계의 온도를 올려 주는 편이에요.",
  ],
  mixed_gap: [
    "세 지표 사이에 차이가 있어, 강점과 조심할 지점이 나뉘는 편이에요.",
    "끌림·편안함·마찰의 세기가 제각각이라, 상황마다 느껴지는 면이 조금씩 다를 수 있어요.",
  ],
};

function clampScore(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function scoreSpread(scores: RelationshipTriScores): number {
  const values = [
    clampScore(scores.affection),
    clampScore(scores.chemistry),
    clampScore(scores.sensitivity),
  ];
  return Math.max(...values) - Math.min(...values);
}

export function detectRelationshipIndexPattern(
  raw: RelationshipTriScores,
): RelationshipIndexInsightPattern {
  const affection = clampScore(raw.affection);
  const chemistry = clampScore(raw.chemistry);
  const sensitivity = clampScore(raw.sensitivity);
  const spread = scoreSpread({ affection, chemistry, sensitivity });

  if (spread < BALANCE_GAP) {
    return "balanced";
  }

  const max = Math.max(affection, chemistry, sensitivity);
  const min = Math.min(affection, chemistry, sensitivity);

  if (
    sensitivity === max &&
    sensitivity - affection >= DOMINANCE_GAP &&
    sensitivity - chemistry >= DOMINANCE_GAP
  ) {
    return "sensitivity_high";
  }

  if (
    sensitivity === min &&
    affection - sensitivity >= DOMINANCE_GAP &&
    chemistry - sensitivity >= DOMINANCE_GAP
  ) {
    return "sensitivity_low";
  }

  if (affection - chemistry >= DOMINANCE_GAP) {
    return "affection_over_chemistry";
  }

  if (chemistry === max) {
    return "chemistry_dominant";
  }

  if (affection === max) {
    return "affection_dominant";
  }

  return "mixed_gap";
}

function pickVariationIndex(
  scores: RelationshipTriScores,
  pattern: RelationshipIndexInsightPattern,
  variationCount: number,
): number {
  if (variationCount <= 1) return 0;
  const seed =
    clampScore(scores.affection) * 17 +
    clampScore(scores.chemistry) * 31 +
    clampScore(scores.sensitivity) * 47 +
    pattern.length * 13;
  return Math.abs(seed) % variationCount;
}

export type RelationshipIndexInsight = {
  pattern: RelationshipIndexInsightPattern;
  spread: number;
  line: string;
};

export function pickRelationshipIndexInsight(
  scores: RelationshipTriScores,
): RelationshipIndexInsight {
  const pattern = detectRelationshipIndexPattern(scores);
  const lines = INSIGHT_LINES[pattern];
  const index = pickVariationIndex(scores, pattern, lines.length);
  return {
    pattern,
    spread: scoreSpread(scores),
    line: lines[index] ?? lines[0] ?? "",
  };
}
