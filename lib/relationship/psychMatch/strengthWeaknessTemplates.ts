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

/** 영어 세션용 — 한글 템플릿과 1:1 대응, 같은 톤(비난 없이, 보완 가능한 패턴) 유지 */
export const STRENGTH_WEAKNESS_TEMPLATES_EN: Record<
  SecondaryAxisKey,
  AxisStrengthWeaknessTemplates
> = {
  stimulation: {
    strength:
      "Together you can easily bring small changes and fun into daily life, keeping things light.",
    weakness:
      "Chasing novelty over stability can mean important things get put off.",
  },
  self_control: {
    strength:
      "You can build a balanced daily rhythm by pacing with each other.",
    weakness:
      "Instead of pushing each other, the habit of putting things off can take hold.",
  },
  practicality: {
    strength:
      "Real-world matters like money and schedules get easier to sort out together.",
    weakness:
      "Always taking the easy route now can let long-term plans slip.",
  },
  structure: {
    strength:
      "You help each other split tasks and keep promises.",
    weakness:
      "Drifting without a plan can make important deadlines slide.",
  },
  empathy: {
    strength:
      "Reading and adjusting to each other's mood can come naturally and grow over time.",
    weakness:
      "Not fully voicing feelings can turn into a repeating pattern.",
  },
  conflict_style: {
    strength:
      "You tend to bring up uncomfortable topics fairly quickly and work through them.",
    weakness:
      "If putting off conflict becomes a habit, small misunderstandings can pile up.",
  },
  resilience: {
    strength:
      "You can learn to get back up together even after hard times.",
    weakness:
      "When stress drags on, fatigue can build up faster than comfort.",
  },
  recognition: {
    strength:
      "Acknowledging each other's efforts tends to raise relationship satisfaction.",
    weakness:
      "Feeling unrecognized can make even small things sting.",
  },
  energy_style: {
    strength:
      "You can learn to balance time with people and time alone.",
    weakness:
      "Different ways of using up energy can mean tiredness shows up late.",
  },
  thinking_style: {
    strength:
      "You're good at calmly breaking down complex problems together.",
    weakness:
      "When thoughts pile up, it can take longer to speak up before pausing.",
  },
  decision_style: {
    strength:
      "Reviewing important choices together helps cut down on mistakes.",
    weakness:
      "Putting off decisions can mean missed chances or built-up frustration.",
  },
};

export type StrengthWeaknessLocale = "ko" | "en";

function templatesForLocale(
  locale: StrengthWeaknessLocale,
): Record<SecondaryAxisKey, AxisStrengthWeaknessTemplates> {
  return locale === "en" ? STRENGTH_WEAKNESS_TEMPLATES_EN : STRENGTH_WEAKNESS_TEMPLATES;
}

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

/** 강점·약점 리스트 최소 노출 개수 */
export const STRENGTH_WEAKNESS_MIN_ITEMS = 3;

function isSecondaryAxisKey(key: string): key is SecondaryAxisKey {
  return key in STRENGTH_WEAKNESS_TEMPLATES;
}

function eligibleAxisRows(
  axisResults: StrengthWeaknessAxisInput[],
): Array<StrengthWeaknessAxisInput & { axis_key: SecondaryAxisKey; gap: number }> {
  return axisResults
    .filter(
      (
        row,
      ): row is StrengthWeaknessAxisInput & {
        axis_key: SecondaryAxisKey;
        gap: number;
      } =>
        isSecondaryAxisKey(row.axis_key) &&
        !STRENGTH_WEAKNESS_EXCLUDED_AXIS_KEYS.has(row.axis_key) &&
        typeof row.gap === "number",
    )
    .map((row) => ({
      ...row,
      gap: row.gap ?? 0,
    }));
}

function fillStrengthWeaknessList(params: {
  items: StrengthWeaknessItem[];
  axisResults: StrengthWeaknessAxisInput[];
  pickText: (axisKey: SecondaryAxisKey) => string;
  sortRows: (
    rows: Array<StrengthWeaknessAxisInput & { axis_key: SecondaryAxisKey; gap: number }>,
  ) => Array<StrengthWeaknessAxisInput & { axis_key: SecondaryAxisKey; gap: number }>;
  minItems?: number;
}): StrengthWeaknessItem[] {
  const minItems = params.minItems ?? STRENGTH_WEAKNESS_MIN_ITEMS;
  const out = [...params.items];
  if (out.length >= minItems) return out;

  const usedKeys = new Set(out.map((item) => item.axis_key));
  const usedTexts = new Set(out.map((item) => item.text));
  const candidates = params
    .sortRows(eligibleAxisRows(params.axisResults))
    .filter((row) => !usedKeys.has(row.axis_key));

  for (const row of candidates) {
    if (out.length >= minItems) break;
    const text = params.pickText(row.axis_key);
    if (usedTexts.has(text)) continue;
    out.push({ axis_key: row.axis_key, text });
    usedKeys.add(row.axis_key);
    usedTexts.add(text);
  }

  return out;
}

export function strengthWeaknessTextForAxis(
  axisKey: string,
  matchType: PsychMatchType,
  locale: StrengthWeaknessLocale = "ko",
): string | null {
  if (!isSecondaryAxisKey(axisKey)) return null;
  const templates = templatesForLocale(locale)[axisKey];
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
  locale: StrengthWeaknessLocale = "ko",
): StrengthWeaknessLists {
  const templates = templatesForLocale(locale);
  const strengths: StrengthWeaknessItem[] = [];
  const weaknesses: StrengthWeaknessItem[] = [];

  for (const row of axisResults) {
    if (!isSecondaryAxisKey(row.axis_key)) continue;
    if (STRENGTH_WEAKNESS_EXCLUDED_AXIS_KEYS.has(row.axis_key)) continue;
    const text = strengthWeaknessTextForAxis(row.axis_key, row.match_type, locale);
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

  return {
    strengths: fillStrengthWeaknessList({
      items: strengths,
      axisResults,
      pickText: (axisKey) => templates[axisKey].strength,
      sortRows: (rows) => [...rows].sort((a, b) => a.gap - b.gap),
    }),
    weaknesses: fillStrengthWeaknessList({
      items: weaknesses,
      axisResults,
      pickText: (axisKey) => templates[axisKey].weakness,
      sortRows: (rows) => [...rows].sort((a, b) => b.gap - a.gap),
    }),
  };
}
