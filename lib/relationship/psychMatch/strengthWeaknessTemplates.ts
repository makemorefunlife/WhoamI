import type { SecondaryAxisKey } from "@/lib/v2/survey/types";

type PsychMatchType = "similarity" | "complementary" | "tension";

type AxisStrengthWeaknessTemplates = {
  /** similarity · complementary 일 때 */
  strength: string;
  /** tension 일 때 */
  weakness: string;
};

/**
 * axis_key별 강점/약점 문장 템플릿.
 * 전문 용어 없이, 비난하지 않고 보완 가능한 패턴으로 서술.
 */
export const STRENGTH_WEAKNESS_TEMPLATES: Record<
  SecondaryAxisKey,
  AxisStrengthWeaknessTemplates
> = {
  stimulation: {
    strength:
      "함께하면 일상에 작은 변화와 재미를 넣기 쉬워 관계가 가볍게 이어질 수 있어요.",
    weakness:
      "안정보다 새로움을 찾다 보니 중요한 일을 미뤄두기 쉬울 수 있어요.",
  },
  self_control: {
    strength:
      "서로의 속도에 맞춰 균형 잡힌 생활 리듬을 만들기 쉬워요.",
    weakness:
      "스스로를 다그치기보다 미루는 습관이 더 굳어질 수 있어요.",
  },
  practicality: {
    strength:
      "돈·일정 같은 현실 문제를 함께 정리하기 수월해져요.",
    weakness:
      "당장 편한 쪽으로만 가다 보면 장기 계획이 느슨해질 수 있어요.",
  },
  structure: {
    strength:
      "해야 할 일을 나누고 약속을 지키는 데 서로 도움이 돼요.",
    weakness:
      "계획 없이 흘러가다 보면 중요한 일정이 밀릴 수 있어요.",
  },
  empathy: {
    strength:
      "상대 기분을 읽고 맞춰 주는 연습이 자연스럽게 늘 수 있어요.",
    weakness:
      "감정을 끝까지 말하지 않고 넘기는 패턴이 반복될 수 있어요.",
  },
  conflict_style: {
    strength:
      "불편한 이야기도 비교적 빨리 꺼내서 풀기 쉬운 편이에요.",
    weakness:
      "갈등을 미루는 습관이 굳어지면 작은 오해가 쌓일 수 있어요.",
  },
  resilience: {
    strength:
      "힘든 일 뒤에도 함께 다시 일어서는 법을 배우기 쉬워요.",
    weakness:
      "스트레스가 길어지면 서로 위로보다 피로만 쌓일 수 있어요.",
  },
  recognition: {
    strength:
      "서로의 노력을 알아주는 말이 관계 만족을 높이기 쉬워요.",
    weakness:
      "인정받지 못했다고 느끼면 작은 일에도 마음이 상하기 쉬워요.",
  },
  energy_style: {
    strength:
      "사람 만나기와 혼자만의 시간 사이 균형을 맞추는 법을 배울 수 있어요.",
    weakness:
      "에너지 소모 방식이 달라 피곤함을 늦게 알아차릴 수 있어요.",
  },
  thinking_style: {
    strength:
      "복잡한 문제를 차분히 나눠 이야기하기 좋아요.",
    weakness:
      "생각이 많아지면 말하기 전에 멈춰 서는 시간이 길어질 수 있어요.",
  },
  decision_style: {
    strength:
      "중요한 선택을 함께 검토할 때 실수를 줄이기 쉬워요.",
    weakness:
      "결정을 미루다 보니 기회를 놓치거나 답답함이 쌓일 수 있어요.",
  },
};

export type StrengthWeaknessAxisInput = {
  axis_key: string;
  match_type: PsychMatchType;
  gap?: number;
};

export type StrengthWeaknessItem = {
  axis_key: SecondaryAxisKey;
  text: string;
};

export type StrengthWeaknessLists = {
  strengths: StrengthWeaknessItem[];
  weaknesses: StrengthWeaknessItem[];
};

function isSecondaryAxisKey(key: string): key is SecondaryAxisKey {
  return key in STRENGTH_WEAKNESS_TEMPLATES;
}

export function strengthWeaknessTextForAxis(
  axisKey: string,
  matchType: PsychMatchType,
): string | null {
  if (!isSecondaryAxisKey(axisKey)) return null;
  const templates = STRENGTH_WEAKNESS_TEMPLATES[axisKey];
  if (matchType === "tension") return templates.weakness;
  if (matchType === "similarity" || matchType === "complementary") {
    return templates.strength;
  }
  return null;
}

/** 확언형 카피(강점·약점)에서 제외 — scoringMap 연결 문항 2개뿐이라 신호가 얕음 */
const STRENGTH_WEAKNESS_EXCLUDED_AXIS_KEYS = new Set<SecondaryAxisKey>([
  "conflict_style",
]);

export function buildStrengthWeaknessLists(
  axisResults: StrengthWeaknessAxisInput[],
): StrengthWeaknessLists {
  const strengths: StrengthWeaknessItem[] = [];
  const weaknesses: StrengthWeaknessItem[] = [];

  for (const row of axisResults) {
    if (!isSecondaryAxisKey(row.axis_key)) continue;
    if (STRENGTH_WEAKNESS_EXCLUDED_AXIS_KEYS.has(row.axis_key)) continue;
    const text = strengthWeaknessTextForAxis(row.axis_key, row.match_type);
    if (!text) continue;

    const item: StrengthWeaknessItem = {
      axis_key: row.axis_key,
      text,
    };

    if (row.match_type === "tension") {
      weaknesses.push(item);
    } else {
      strengths.push(item);
    }
  }

  if (weaknesses.length === 0 && axisResults.length > 0) {
    const gapSorted = axisResults
      .filter((row): row is StrengthWeaknessAxisInput & { axis_key: SecondaryAxisKey; gap: number } =>
        isSecondaryAxisKey(row.axis_key) &&
        !STRENGTH_WEAKNESS_EXCLUDED_AXIS_KEYS.has(row.axis_key) &&
        typeof row.gap === "number",
      )
      .sort((a, b) => b.gap - a.gap);

    for (const row of gapSorted.slice(0, 3)) {
      const text = STRENGTH_WEAKNESS_TEMPLATES[row.axis_key].weakness;
      weaknesses.push({ axis_key: row.axis_key, text });
    }
  }

  return { strengths, weaknesses };
}
