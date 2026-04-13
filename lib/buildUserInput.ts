export function buildUserInput(data: any) {
  const survey = data?.survey || {};
  const saju = data?.saju || {};
  const relation = data?.relation || {};

  const surveyBehaviors = Array.isArray(survey.behaviors)
    ? survey.behaviors
    : [];

  const sajuTraits = Array.isArray(saju.traits) ? saju.traits : [];

  const relationPatterns = Array.isArray(relation.patterns)
    ? relation.patterns
    : [];

  return `
  [설문 기반 행동 패턴]
  ${surveyBehaviors.map((item: string) => `${item}`).join("\n")}
  
  [안쪽 기질 해석]
  ${sajuTraits.map((item: string) => `${item}`).join("\n")}
  
  [관계에서 반복되는 흐름]
  ${relationPatterns.map((item: string) => `${item}`).join("\n")}
  `.trim();
}
