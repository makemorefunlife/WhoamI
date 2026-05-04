export function buildSurveyOnlyPrompt(interpretations: Record<string, string>) {
  const personality = Object.values(interpretations).filter(Boolean).join(", ");
  return `
[설문 기반 성향 — 실제 행동·패턴 해석]
${personality || "(설문 해석 없음)"}

위 설문 해석만을 근거로 분석해줘.
`.trim();
}

export function buildAstrologyContextForLlm(astro: {
  sun: string;
  moon: string;
  rising: string;
}) {
  return `[출생 시점 도식에서 읽히는 세 축 — 최종 글에는 아래 라벨·별자리명을 그대로 쓰지 말 것]
1) 삶에서 자기를 드러내고 추구하는 톤: "${astro.sun}" 계열 기질
2) 안식·감정 반응의 리듬: "${astro.moon}" 계열 기질
3) 낯선 사람에게 먼저 비치는 인상·접근 방식: "${astro.rising}" 계열 기질`;
}

export function buildIntegratedPrompt({
  interpretations,
  sajuData,
  astrologyText,
}: {
  interpretations: Record<string, string>;
  sajuData: any | null;
  astrologyText?: string | null;
}) {
  const personality = Object.values(interpretations).filter(Boolean).join(", ");
  const s = sajuData;
  const pillars = s?.saju
    ? `${s.saju.yearPillar} ${s.saju.monthPillar} ${s.saju.dayPillar} ${s.saju.hourPillar}`
    : "(사주 미계산)";

  const dayStemBlock = s?.dayStemData
    ? `- 표기: ${s.dayStemData.kor_name ?? ""}
- 비유·기질: ${s.dayStemData.metaphor_ko ?? ""}`
    : "(없음)";

  const dayBranchBlock = s?.dayBranchData
    ? `${s.dayBranchData.kor_name ?? ""}: ${s.dayBranchData.meaning_ko ?? ""}`
    : "(없음)";

  const hiddenBlock =
    Array.isArray(s?.hiddenStemsData) && s.hiddenStemsData.length > 0
      ? s.hiddenStemsData
          .map((h: any) =>
            `${h.stem_code ?? ""} — ${h.meaning_ko ?? ""}`.trim(),
          )
          .join("\n")
      : "(없음)";

  const tenGodBlock =
    Array.isArray(s?.tenGods) && s.tenGods.length > 0
      ? s.tenGods
          .map(
            (t: any) =>
              `${t.pillar ?? ""}: ${t.godData?.kor_name ?? ""} (${t.godData?.meaning_ko ?? ""})`,
          )
          .join("\n")
      : "(없음)";

  const twelveBlock = s?.twelveStageData
    ? `${s.twelveStageData.kor_name ?? ""} — ${s.twelveStageData.meaning_ko ?? ""}`
    : "(없음)";

  const relationsBlock =
    Array.isArray(s?.relations) && s.relations.length > 0
      ? s.relations
          .map((r: any) => `${r.type ?? ""}: ${r.interpretation ?? ""}`)
          .join("\n")
      : "(없음)";

  return `
[설문 기반 성향 — 실제 행동·패턴 해석]
${personality || "(없음)"}

[사주 구조 데이터 — 원국]
- 사주팔자: ${pillars}
- 일간(천간)
${dayStemBlock}
- 일지(지지)
${dayBranchBlock}
- 지장간
${hiddenBlock}
- 십성
${tenGodBlock}
- 12운성
${twelveBlock}
- 지지 관계(합·충·형·파·해 등)
${relationsBlock}

[출생 맥락·점성 보조 데이터 — 본문에는 점성 용어 없이 일상어로만]
${astrologyText?.trim() || "(별도 데이터 없음 — 설문·사주만으로 통합해줘)"}

위 전체를 바탕으로 하나의 통합 보고서를 작성해줘. 별자리명·태양/달/라이징 같은 점성학 용어는 쓰지 말고 체험·행동으로 풀어줘.
`.trim();
}
