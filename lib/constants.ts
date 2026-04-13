// [추가] 설문 문항 도메인 라벨 (UI용)
export function getDomainLabel(questionId: string): string {
  const domainMap: Record<string, string> = {
    q1: "MBTI",
    q2: "MBTI",
    q3: "MBTI",
    q4: "DISC",
    q5: "DISC",
    q6: "DISC",
    q7: "Enneagram",
    q8: "Enneagram",
    q9: "Enneagram",
    q10: "RIASEC",
    q11: "RIASEC",
    q12: "RIASEC",
    q13: "PSS",
    q14: "PSS",
    q15: "PSS",
    q16: "TCI",
    q17: "TCI",
    q18: "TCI",
  };
  return domainMap[questionId] ?? "탐험";
}
