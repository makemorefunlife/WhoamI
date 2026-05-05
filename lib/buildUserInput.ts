// lib/buildUserInput.ts
type BuildUserInputPayload = {
  survey?: { behaviors?: unknown };
  saju?: { traits?: unknown };
  relation?: { patterns?: unknown };
  astrology?: { sun?: unknown; moon?: unknown; rising?: unknown };
};

export function buildUserInput(data: BuildUserInputPayload) {
  const survey = data?.survey || {};
  const saju = data?.saju || {};
  const relation = data?.relation || {};
  const astrology = data?.astrology || {}; // 🔥 추가

  const surveyBehaviors = Array.isArray(survey.behaviors)
    ? survey.behaviors
    : [];
  const sajuTraits = Array.isArray(saju.traits) ? saju.traits : [];
  const relationPatterns = Array.isArray(relation.patterns)
    ? relation.patterns
    : [];

  return `
[설문 기반 행동 패턴 - 현재의 너]
${surveyBehaviors.map((item: string) => `- ${item}`).join("\n")}

[사주 기반 타고난 기질]
${sajuTraits.map((item: string) => `- ${item}`).join("\n")}

[점성학 기반 타고난 기질]
- 태양(Sun): ${astrology.sun || "정보 없음"} - 핵심 에너지, 삶의 방향성
- 달(Moon): ${astrology.moon || "정보 없음"} - 내면의 감정, 무의식적 욕구
- 라이징(Rising): ${astrology.rising || "정보 없음"} - 첫인상, 사회적 표정

[관계에서 반복되는 흐름]
${relationPatterns.map((item: string) => `- ${item}`).join("\n")}
  `.trim();
}
