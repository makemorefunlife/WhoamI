import { PRIMARY_AXIS_KEYS, type PrimaryAxisKey, type PrimaryAxesScores } from "@/lib/v2/survey/types";
import type { GapAxisRow } from "@/lib/v2/analysis/gap";
import { PRIMARY_AXIS_LABELS } from "@/lib/v2/framework/axisLabels";
import type { PrimaryConcern } from "@/lib/v2/survey/types";

export type BlueprintHookCopy = {
  headline: string;
  subline: string;
  teaser: string;
};

const CONCERN_TAIL: Record<PrimaryConcern, string> = {
  money: "돈 문제로 막힐 때, 이 패턴이 ‘벌어도 불안한’ 느낌의 뿌리일 수 있어요.",
  relationship: "관계에서 반복되는 피로, 사실은 이 축의 괴리에서 시작되는 경우가 많아요.",
  health: "몸과 마음이 먼저 보내는 신호일 수 있어요. 지금 리듬이 나와 맞는지 점검해 볼 가치가 있어요.",
  career: "진로·커리어에서 ‘열심히 하는데 안 풀리는’ 느낌, 이 간극이 단서일 수 있어요.",
  other: "요즘 가장 신경 쓰이는 고민, 아래 점수 차이와 연결돼 있을 가능성이 커요.",
};

function topAxis(scores: PrimaryAxesScores) {
  return [...PRIMARY_AXIS_KEYS]
    .map((key) => ({ key, score: scores[key] }))
    .sort((a, b) => b.score - a.score)[0];
}

function bottomAxis(scores: PrimaryAxesScores) {
  return [...PRIMARY_AXIS_KEYS]
    .map((key) => ({ key, score: scores[key] }))
    .sort((a, b) => a.score - b.score)[0];
}

function axisSpread(scores: PrimaryAxesScores) {
  const vals = PRIMARY_AXIS_KEYS.map((k) => scores[k]);
  return { min: Math.min(...vals), max: Math.max(...vals) };
}

/**
 * 무료 Blueprint 상단 후킹 카피 — Gap + Current/Essence 대비 기반 (LLM 전 단계)
 */
export function buildBlueprintHookCopy(input: {
  current: PrimaryAxesScores;
  essence: PrimaryAxesScores;
  gapRows: GapAxisRow[];
  primaryConcern: PrimaryConcern | null;
}): BlueprintHookCopy {
  const { current, essence, gapRows, primaryConcern } = input;
  const topGap = [...gapRows].sort((a, b) => b.absDelta - a.absDelta)[0];
  const currentTop = topAxis(current);
  const essenceTop = topAxis(essence);
  const currentLow = bottomAxis(current);
  const concernTail = primaryConcern
    ? CONCERN_TAIL[primaryConcern]
    : CONCERN_TAIL.other;

  if (topGap && topGap.absDelta >= 12) {
    const label = PRIMARY_AXIS_LABELS[topGap.axis];
    if (topGap.delta >= 12) {
      return {
        headline: `겉으로는 ‘${label}’을 많이 쓰고 있는데, 내면의 본질은 그보다 낮아요.`,
        subline: `지금의 ${label}은 어느 정도 ‘맞춰 산 버릇’일 수 있어요. 이 간극이 길어질수록 피로가 쌓이기 쉽습니다.`,
        teaser: concernTail,
      };
    }
    if (topGap.delta <= -12) {
      return {
        headline: `원래는 ‘${label}’ 쪽이 더 강한데, 요즘 삶에서는 잘 드러나지 않고 있어요.`,
        subline: `억눌려 있던 ${label}이 다시 살아날 때, 방향을 잡기가 훨씬 수월해집니다. 지금이 그 전환점일 수 있어요.`,
        teaser: concernTail,
      };
    }
  }

  if (currentTop.key !== essenceTop.key) {
    return {
      headline: `지금은 ‘${PRIMARY_AXIS_LABELS[currentTop.key]}’으로 살고, 본질의 흐름은 ‘${PRIMARY_AXIS_LABELS[essenceTop.key]}’에 가깝습니다.`,
      subline: `두 선이 겹치지 않는 구간이 바로, 당신이 “뭔가 어긋난다”고 느끼는 지점일 수 있어요.`,
      teaser: concernTail,
    };
  }

  const spread = axisSpread(current);
  if (spread.max - spread.min >= 28) {
    return {
      headline: `한쪽으로 치우친 ${PRIMARY_AXIS_LABELS[currentTop.key]} — 그게 지금 당신의 ‘기본 모드’예요.`,
      subline: `반면 ${PRIMARY_AXIS_LABELS[currentLow.key]}은 상대적으로 비어 있어요. 이 균형이 깨질 때 결정 피로가 올라갑니다.`,
      teaser: concernTail,
    };
  }

  return {
    headline: `겉보기엔 비슷해도, 세부 축마다 미세한 간극이 쌓이고 있어요.`,
    subline: `숫자 하나만으로는 안 보이는 패턴이에요. 설문과 사주를 나눠 보면 어디서 에너지가 새는지 드러납니다.`,
    teaser: concernTail,
  };
}
