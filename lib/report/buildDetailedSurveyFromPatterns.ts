import { getPatternInterpretation } from "@/lib/hardcoded/patternLookup";

const DOMAIN_KEYS = [
  "mbti",
  "disc",
  "enneagram",
  "riasec",
  "pss",
  "tci",
] as const;

const DOMAIN_SECTIONS: Record<(typeof DOMAIN_KEYS)[number], string> = {
  mbti: "MBTI - 사고 방식",
  disc: "DISC - 에너지 방향",
  enneagram: "에니어그램 - 핵심 동기",
  riasec: "RIASEC - 직업 흥미",
  pss: "PSS/PHQ-9 - 현재 상태 (스트레스/불안/우울)",
  tci: "TCI - 기질·성격",
};

function expandDomainParagraph(
  domain: (typeof DOMAIN_KEYS)[number],
  pattern: string,
  interpretation: string,
): string {
  const label = DOMAIN_SECTIONS[domain];
  if (interpretation === "해석 없음") {
    return `### ${label}\n설문 패턴(${pattern})에 대한 해석 데이터가 없어. Y/N 조합만 참고해: ${pattern}`;
  }
  return `### ${label}\n너는 ${interpretation} 쪽 성향이야. 평소에도 이 패턴(${pattern})이 행동과 선택에 자주 드러나는 편이야.`;
}

function buildSummarySection(
  interpretations: Record<string, string>,
): string {
  const strengths = Object.entries(interpretations)
    .filter(([, v]) => v && v !== "해석 없음")
    .slice(0, 3)
    .map(([, v]) => v);

  const lines = [
    "### 종합 분석",
    strengths.length > 0
      ? `- 현재 너의 강점: ${strengths.join(" · ")}`
      : "- 현재 너의 강점: 설문 패턴을 바탕으로 한 성향 윤곽이 잡혀 있어",
    "- 주의할 점: 한 가지 패턴에만 기대지 말고, 상황에 따라 다른 면이 나올 수 있어",
    "- 스트레스 상황: 평소 패턴이 더 극단적으로 보일 수 있으니 호흡부터 가다듬는 게 도움이 돼",
    "- 관계에서: 상대와의 차이를 ‘틀림’이 아니라 ‘다름’으로 읽으면 훨씬 편해져",
  ];
  return lines.join("\n");
}

/** pattern_base 하드코딩 데이터로 detailed_survey 본문 생성 (LLM 없음) */
export function buildDetailedSurveyFromPatterns(
  patterns: Record<string, string> | null,
): string | null {
  if (!patterns) return null;

  const interpretations: Record<string, string> = {};
  const sections: string[] = [];

  for (const key of DOMAIN_KEYS) {
    const pattern = patterns[key]?.trim() ?? "";
    if (!pattern || pattern.length < 3) continue;
    const interpretation =
      getPatternInterpretation(key, pattern) ?? "해석 없음";
    interpretations[key] = interpretation;
    sections.push(expandDomainParagraph(key, pattern, interpretation));
  }

  if (sections.length === 0) return null;

  sections.push(buildSummarySection(interpretations));
  return sections.join("\n\n");
}
