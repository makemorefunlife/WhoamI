/** `/api/saju` 응답 또는 toV1SajuApiPayload 형태 */
export type SajuDataForIntegrated = {
  saju?: {
    yearPillar?: string;
    monthPillar?: string;
    dayPillar?: string;
    hourPillar?: string;
  };
  dayStemData?: {
    kor_name?: string;
    metaphor_ko?: string | null;
    strength_ko?: string | null;
    weakness_ko?: string | null;
    advice_ko?: string | null;
  } | null;
  dayBranchData?: {
    kor_name?: string;
    meaning_ko?: string | null;
    strength_ko?: string | null;
    weakness_ko?: string | null;
    advice_ko?: string | null;
  } | null;
  hiddenStemsData?: Array<{
    stem_code?: string;
    meaning_ko?: string | null;
  }>;
  tenGods?: Array<{
    pillar?: string;
    godCode?: string;
    godData?: {
      kor_name?: string;
      meaning_ko?: string | null;
      relationship_ko?: string | null;
    } | null;
  }>;
  twelveStageData?: {
    kor_name?: string;
    meaning_ko?: string | null;
  } | null;
  growthStages?: Array<{
    pillar?: string;
    stageData?: { kor_name?: string; meaning_ko?: string | null } | null;
  }>;
  relations?: Array<{
    type?: string;
    name?: string;
    interpretation?: string;
  }>;
  shinsals?: Array<{
    name_ko?: string;
    name_hanja?: string | null;
    category?: string | null;
    meaning_ko?: string | null;
    strength_ko?: string | null;
    weakness_ko?: string | null;
    advice_ko?: string | null;
  }>;
};

function block(title: string, body: string): string {
  return `### ${title}\n${body.trim() || "(해당 없음)"}`;
}

function formatShinsalSection(
  shinsals: SajuDataForIntegrated["shinsals"],
): string {
  if (!shinsals?.length) {
    return "(해당 신살 없음 — 기질 분석의 다른 신호만 사용)";
  }
  return shinsals
    .map((s) => {
      const lines = [
        `- 이름(내부 참고용, 본문에 그대로 쓰지 말 것): ${s.name_ko ?? ""}`,
        s.meaning_ko ? `  핵심 의미: ${s.meaning_ko}` : null,
        s.strength_ko ? `  강점 경향: ${s.strength_ko}` : null,
        s.weakness_ko ? `  주의 경향: ${s.weakness_ko}` : null,
        s.advice_ko ? `  균형 제안: ${s.advice_ko}` : null,
      ].filter(Boolean);
      return lines.join("\n");
    })
    .join("\n\n");
}

/**
 * 통합 리포트 LLM 입력용 — 기질 분석(타고난 성향) 텍스트
 * 신살(천을귀인 등)을 명시 섹션으로 포함
 */
export function formatInnateAnalysisForIntegrated(
  data: SajuDataForIntegrated | null | undefined,
): string {
  if (!data) return "(기질 분석 데이터 없음)";

  const pillars = data.saju
    ? `년 ${data.saju.yearPillar} · 월 ${data.saju.monthPillar} · 일 ${data.saju.dayPillar} · 시 ${data.saju.hourPillar}`
    : "(없음)";

  const dayStem = data.dayStemData
    ? `${data.dayStemData.kor_name ?? ""} — ${data.dayStemData.metaphor_ko ?? ""}
강점: ${data.dayStemData.strength_ko ?? ""}
주의: ${data.dayStemData.weakness_ko ?? ""}`
    : "(없음)";

  const dayBranch = data.dayBranchData
    ? `${data.dayBranchData.kor_name ?? ""}: ${data.dayBranchData.meaning_ko ?? ""}`
    : "(없음)";

  const tenGods =
    data.tenGods?.length
      ? data.tenGods
          .map(
            (t) =>
              `${t.pillar}: ${t.godData?.kor_name ?? t.godCode ?? ""} — ${t.godData?.meaning_ko ?? ""}`,
          )
          .join("\n")
      : "(없음)";

  const stages =
    data.growthStages?.length
      ? data.growthStages
          .map(
            (g) =>
              `${g.pillar}: ${g.stageData?.kor_name ?? ""} — ${g.stageData?.meaning_ko ?? ""}`,
          )
          .join("\n")
      : data.twelveStageData
        ? `${data.twelveStageData.kor_name ?? ""} — ${data.twelveStageData.meaning_ko ?? ""}`
        : "(없음)";

  const relations =
    data.relations?.length
      ? data.relations
          .map((r) => `[${r.type ?? ""}] ${r.name ?? ""}: ${r.interpretation ?? ""}`)
          .join("\n")
      : "(없음)";

  const hiddenStems =
    data.hiddenStemsData?.length
      ? data.hiddenStemsData
          .map(
            (h) =>
              `${h.stem_code ?? ""}: ${h.meaning_ko ?? ""}`,
          )
          .join("\n")
      : "(없음)";

  const shinsals = formatShinsalSection(data.shinsals);

  return [
    block("원국(팔자)", pillars),
    block("일간 기질", dayStem),
    block("일지 기질", dayBranch),
    block("십성 분포", tenGods),
    block("12운성", stages),
    block("지장간", hiddenStems),
    block("합·충·형·파·해", relations),
    block("신살(특수 기질 신호) — 반드시 해석에 반영", shinsals),
    "",
    "[작성 지침 — LLM용]",
    "- 위 내용은 '기질 분석' 입력이다. 본문에 사주·팔자·십성·신살·천을귀인 등 전문 용어를 쓰지 말 것.",
    "- 신살 섹션의 의미·강점·주의를 일상 행동·관계·결정 패턴으로 풀어 Part 1~5에 녹일 것.",
    "- 근거를 말할 때 '사주에 따르면' 대신 '기질 분석에 따르면' 또는 아예 출처 없이 자연스럽게 서술할 것.",
  ].join("\n\n");
}

export function sajuDataToIntegratedSummary(
  sajuData: unknown,
): string {
  if (sajuData == null) return "(기질 분석 데이터 없음)";
  if (typeof sajuData === "string") return sajuData;
  return formatInnateAnalysisForIntegrated(sajuData as SajuDataForIntegrated);
}
