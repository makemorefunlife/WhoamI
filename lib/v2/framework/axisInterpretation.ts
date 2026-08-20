import { PRIMARY_AXIS_DEFINITIONS } from "@/lib/v2/framework/primaryAxisDefinitions";
import type { PrimaryAxisKey } from "@/lib/v2/survey/types";

type ScoreBand = "high" | "mid" | "low";

function scoreBand(score: number): ScoreBand {
  if (score >= 65) return "high";
  if (score <= 40) return "low";
  return "mid";
}

const SHORT_INTERPRETATIONS_EN: Record<
  PrimaryAxisKey,
  Record<ScoreBand, string>
> = {
  autonomy: {
    high: "You tend to trust your own judgment and prefer steering your path from the inside out.",
    mid: "You balance self-direction with input from others depending on the situation.",
    low: "You may feel more comfortable when plans and expectations are shared or clarified with others.",
  },
  connection: {
    high: "Emotional closeness and meaningful relationships are likely a strong motivator in how you live and decide.",
    mid: "You value connection, but you also leave room for independence and personal space.",
    low: "You may prioritize clarity, goals, or inner direction over emotional closeness in daily choices.",
  },
  stability: {
    high: "Security, consistency, and predictability probably help you feel grounded and effective.",
    mid: "You appreciate stability without needing everything to stay fixed.",
    low: "You may tolerate — or even welcome — more change and open-ended situations than most.",
  },
  growth: {
    high: "You are naturally drawn to learning, improvement, and new possibilities.",
    mid: "You seek growth in focused seasons rather than pushing for change all the time.",
    low: "You may prefer deepening what already works over constantly expanding into the new.",
  },
  structure: {
    high: "Clear plans, routines, and order likely help you feel more grounded and in control.",
    mid: "You use structure when it helps, without needing every detail locked in advance.",
    low: "Rigid plans may feel constraining; you may work better with flexible frameworks.",
  },
  adaptability: {
    high: "You adjust your thinking and behavior relatively easily when situations shift.",
    mid: "You can adapt when needed, though you still prefer some continuity.",
    low: "Sudden changes may cost you more energy; you may need time to recalibrate.",
  },
};

const SHORT_INTERPRETATIONS_KO: Record<
  PrimaryAxisKey,
  Record<ScoreBand, string>
> = {
  autonomy: {
    high: "내 판단과 선택을 스스로 신뢰하며, 나만의 방식으로 삶을 이끌어가려는 경향이 커요.",
    mid: "자신의 주관을 지키면서도 상황에 따라 타인의 조언과 의견을 유연하게 수용해요.",
    low: "중요한 결정일수록 타인과 의견을 나누고 목표를 함께 명확히 할 때 더 편안함을 느껴요.",
  },
  connection: {
    high: "정서적 친밀감과 깊이 있는 관계가 일상과 선택의 가장 큰 에너지가 돼요.",
    mid: "관계의 온기를 중요하게 여겨요. 나만의 독립된 영역과 개인 공간도 균형 있게 지켜요.",
    low: "감정적 밀착보다는 명확한 목표나 객관적 기준, 내면의 방향성에 무게를 두는 편이에요.",
  },
  stability: {
    high: "안정감, 예측 가능성, 일관된 환경이 갖춰질 때 가장 마음이 편안하고 역량이 잘 발휘돼요.",
    mid: "기본적인 안정감을 바탕으로 새로운 변화도 적절히 받아들이는 균형감을 갖고 있어요.",
    low: "정해진 틀에 얽매이기보다 변화와 새로운 기회가 열려 있는 상황을 부담 없이 즐겨요.",
  },
  growth: {
    high: "배움과 성장, 더 나은 가능성을 탐색하고 스스로를 발전시키는 데서 큰 보람을 느껴요.",
    mid: "항상 성장을 독촉하기보다, 필요한 시기에 집중적으로 배움과 발전을 도모해요.",
    low: "새로운 확장보다는 현재 잘 갖춰진 영역을 더 깊이 다지고 익숙하게 유지하는 편이에요.",
  },
  structure: {
    high: "체계적인 계획과 규칙, 정돈된 일상이 스스로를 차분하고 안정되게 지켜줘요.",
    mid: "계획과 구조를 적절히 활용하면서도, 모든 것을 미리 정해두어야 편한 편은 아니에요.",
    low: "엄격한 규칙보다는 유연하고 자율적인 환경에서 훨씬 창의적이고 편안하게 일해요.",
  },
  adaptability: {
    high: "상황이나 환경이 변하더라도 생각과 행동을 빠르게 조율하여 적응하는 편이에요.",
    mid: "급작스러운 변화에는 다소 시간이 필요하지만, 결국 상황에 맞춰 부드럽게 적응해 나가요.",
    low: "갑작스러운 환경 변화에 에너지를 많이 쓰는 편이며, 차분히 재정비할 시간이 필요해요.",
  },
};

export function buildAxisShortInterpretation(
  key: PrimaryAxisKey,
  score: number,
  locale?: string,
): string {
  const band = scoreBand(score);
  const isKo = locale === "ko-KR";
  const body = isKo
    ? SHORT_INTERPRETATIONS_KO[key][band]
    : SHORT_INTERPRETATIONS_EN[key][band];

  if (isKo) {
    return body;
  }

  const label = PRIMARY_AXIS_DEFINITIONS[key].label;
  return `Your ${label} score is ${score}. ${body}`;
}

export function buildOverallAxisSummary(
  axes: Record<PrimaryAxisKey, number>,
  order: readonly PrimaryAxisKey[],
  locale?: string,
): string {
  const isKo = locale === "ko-KR";
  const ranked = order
    .map((key) => ({ key, score: axes[key] }))
    .sort((a, b) => b.score - a.score);

  const top = ranked[0];
  const second = ranked[1];
  const edge = ranked[ranked.length - 1];

  if (!top) return "";

  const topLabel = isKo
    ? PRIMARY_AXIS_DEFINITIONS[top.key].koLabel
    : PRIMARY_AXIS_DEFINITIONS[top.key].label;
  const secondLabel = second
    ? isKo
      ? PRIMARY_AXIS_DEFINITIONS[second.key].koLabel
      : PRIMARY_AXIS_DEFINITIONS[second.key].label
    : null;
  const edgeLabel = edge
    ? isKo
      ? PRIMARY_AXIS_DEFINITIONS[edge.key].koLabel
      : PRIMARY_AXIS_DEFINITIONS[edge.key].label
    : null;

  if (isKo) {
    const lead = secondLabel
      ? `현재 모습은 ${topLabel}와(과) ${secondLabel} 성향이 가장 돋보여요.`
      : `현재 모습은 ${topLabel} 성향이 가장 돋보여요.`;
    const edgeNote = edgeLabel
      ? ` 상대적으로 덜 쓰이는 ${edgeLabel} 영역도 함께 살피면 더욱 균형 있는 성장에 도움이 될 수 있어요.`
      : "";
    return `${lead}${edgeNote}`;
  }

  const lead = secondLabel
    ? `Your profile leans toward ${topLabel} and ${secondLabel}.`
    : `Your profile leans toward ${topLabel}.`;

  const edgeNote = edgeLabel
    ? ` Paying attention to ${edgeLabel} may help you feel more balanced over time.`
    : "";

  return `${lead}${edgeNote}`;
}
