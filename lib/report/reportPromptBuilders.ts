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
  sajuData: {
    saju?: {
      yearPillar?: string;
      monthPillar?: string;
      dayPillar?: string;
      hourPillar?: string;
    };
    dayStemData?: { kor_name?: string; metaphor_ko?: string };
    dayBranchData?: { kor_name?: string; meaning_ko?: string };
    hiddenStemsData?: Array<{ stem_code?: string; meaning_ko?: string }>;
    tenGods?: Array<{
      pillar?: string;
      godData?: { kor_name?: string; meaning_ko?: string };
    }>;
    twelveStageData?: { kor_name?: string; meaning_ko?: string };
    relations?: Array<{ type?: string; interpretation?: string }>;
    shinsals?: Array<{
      name_ko?: string;
      meaning_ko?: string | null;
      strength_ko?: string | null;
      weakness_ko?: string | null;
      advice_ko?: string | null;
    }>;
  } | null;
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
          .map((h: { stem_code?: string; meaning_ko?: string }) =>
            `${h.stem_code ?? ""} — ${h.meaning_ko ?? ""}`.trim(),
          )
          .join("\n")
      : "(없음)";

  const tenGodBlock =
    Array.isArray(s?.tenGods) && s.tenGods.length > 0
      ? s.tenGods
          .map(
            (t: {
              pillar?: string;
              godData?: { kor_name?: string; meaning_ko?: string };
            }) =>
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
          .map((r: { type?: string; interpretation?: string }) =>
            `${r.type ?? ""}: ${r.interpretation ?? ""}`,
          )
          .join("\n")
      : "(없음)";

  const shinsalBlock =
    Array.isArray(s?.shinsals) && s.shinsals.length > 0
      ? s.shinsals
          .map(
            (sh: {
              name_ko?: string;
              meaning_ko?: string | null;
              strength_ko?: string | null;
              weakness_ko?: string | null;
            }) =>
              `${sh.name_ko ?? ""}: ${sh.meaning_ko ?? ""} (강점: ${sh.strength_ko ?? ""}, 주의: ${sh.weakness_ko ?? ""})`,
          )
          .join("\n")
      : "(없음)";

  return `
[설문 기반 성향 — 실제 행동·패턴 해석]
${personality || "(없음)"}

[기질 분석 데이터 — 타고난 성향]
- 원국: ${pillars}
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
- 신살(특수 기질 신호)
${shinsalBlock}

[출생 에너지 맥락 — 본문에는 점성 용어 없이 일상어로만]
${astrologyText?.trim() || "(별도 데이터 없음 — 설문·기질 분석만으로 통합해줘)"}

위 전체를 바탕으로 하나의 통합 보고서를 작성해줘. 사주·점성·신살·천을귀인 같은 전문 용어는 쓰지 말고, '기질 분석에 따르면' 정도만 사용하거나 출처 없이 체험·행동으로 풀어줘. 신살 신호는 반드시 해석에 반영해.
`.trim();
}
