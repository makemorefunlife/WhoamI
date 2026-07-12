import type { ChemistryApproxScores } from "./chemistryApprox";

export type ChemistryScoreTier = "excellent" | "good" | "fair" | "low";

export function chemistryScoreTier(score: number): ChemistryScoreTier {
  if (score >= 90) return "excellent";
  if (score >= 70) return "good";
  if (score >= 50) return "fair";
  return "low";
}

const EMOTIONAL_BY_TIER: Record<ChemistryScoreTier, string[]> = {
  excellent: [
    "두 사람은 감정을 나눌 때 마음의 온도가 자연스럽게 맞아요.",
    "기분이 흔들려도 서로의 말이 와닿고, 위로가 금방 전해져요.",
  ],
  good: [
    "감정을 표현하는 방식이 대체로 잘 맞아요.",
    "가끔 어긋나도 금방 풀리는 편이에요.",
  ],
  fair: [
    "감정 표현 속도가 조금 달라 오해가 생길 수 있어요.",
    "기분을 말로 꺼내는 연습을 하면 더 편해져요.",
  ],
  low: [
    "감정을 읽고 맞춰 주는 데 시간이 더 필요해요.",
    "서로의 표현 방식 차이를 먼저 인정하는 게 도움이 돼요.",
  ],
};

const COMMUNICATION_BY_TIER: Record<ChemistryScoreTier, string[]> = {
  excellent: [
    "두 사람은 대화를 풀어갈 때도 리듬이 잘 맞아요.",
    "의견이 달라도 말의 결이 비슷해서 대화가 매끄러워요.",
  ],
  good: [
    "대화할 때 서로의 말이 대체로 잘 통하는 편이에요.",
    "갈등이 있어도 대화로 풀 수 있는 여지가 있어요.",
  ],
  fair: [
    "생각하는 속도나 말하는 방식이 달라 답답함이 생길 수 있어요.",
    "요점을 짧게 확인하는 습관이 도움이 돼요.",
  ],
  low: [
    "대화가 엇갈리기 쉬워, 같은 말도 다르게 들릴 수 있어요.",
    "말하기 전에 상대 입장을 한 번 확인해 보세요.",
  ],
};

const COMBINED_HEADLINE: Record<ChemistryScoreTier, string> = {
  excellent:
    "두 사람은 감정을 나눌 때도, 대화를 풀어갈 때도 자연스럽게 잘 맞아요.",
  good: "전반적으로 잘 맞는 편이에요. 작은 차이만 조율하면 더 편해져요.",
  fair: "잘 맞는 부분도 있지만, 감정·대화 방식에서 조율이 필요해요.",
  low: "지금은 맞춰 가는 연습이 더 필요한 단계예요. 서두르지 않아도 괜찮아요.",
};

export const CHEMISTRY_METHODOLOGY_NOTE =
  "Blueprint 설문에서 감정 케미는 공감·인정·회복·자기조절 네 가지, 소통 케미는 사고방식·결정·생활 구조 세 가지 성향이 얼마나 비슷한지를 보고 점수로 바꿨어요.";

export function pickChemistryInsight(
  kind: "emotional" | "communication",
  score: number,
): string {
  const tier = chemistryScoreTier(score);
  const pool =
    kind === "emotional" ? EMOTIONAL_BY_TIER[tier] : COMMUNICATION_BY_TIER[tier];
  return pool[0] ?? "";
}

export function pickChemistryHeadline(scores: ChemistryApproxScores): string {
  const values = [scores.emotional, scores.communication].filter(
    (s): s is number => s !== null,
  );
  if (values.length === 0) {
    return "설문이 더 채워지면 케미 점수를 보여 드릴게요.";
  }
  const avg = Math.round(
    values.reduce((sum, value) => sum + value, 0) / values.length,
  );
  return COMBINED_HEADLINE[chemistryScoreTier(avg)];
}
