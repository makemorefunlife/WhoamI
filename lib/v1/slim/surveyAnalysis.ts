import type { CurrentSelfProfile } from "@/lib/v2/survey/types";
import { normalizeLocale, type Locale } from "@/lib/i18n/locale";
import { PRIMARY_AXIS_EN_LABELS, PRIMARY_AXIS_ORDER } from "@/lib/v2/framework/axisLabels";

const CONCERN_EN: Record<string, string> = {
  money: "Money & finances",
  relationship: "Relationships",
  health: "Health",
  career: "Career",
  other: "Other",
};

const CONCERN_KO: Record<string, string> = {
  money: "돈·재정",
  relationship: "관계",
  health: "건강",
  career: "커리어",
  other: "기타",
};

/** v2 10문항 → Human Framework 6축 (통합 리포트 설문 입력) */
export function buildSurveyAnalysisFromV2Profile(
  profile: CurrentSelfProfile,
  locale?: Locale | string,
): string {
  const isEn = normalizeLocale(locale) === "en-US";
  const axisLines = PRIMARY_AXIS_ORDER.map(
    (k) => `- ${PRIMARY_AXIS_EN_LABELS[k]}: ${profile.primary_axes[k] ?? 50}/100`,
  ).join("\n");
  const concern = profile.personalization.primary_concern;
  if (isEn) {
    return `## Current Patterns — Human Framework (10-question survey)

### Six axis scores
${axisLines}

### Area of most concern right now
${concern ? CONCERN_EN[concern] ?? concern : "Not answered"}`;
  }
  return `## 현재의 나 — Human Framework (v2 설문 10문항)

### 6대 축 점수
${axisLines}

### 지금 가장 신경 쓰는 영역
${concern ? CONCERN_KO[concern] ?? concern : "미응답"}`;
}

export function buildSurveyAnalysisFallback(locale?: Locale | string): string {
  if (normalizeLocale(locale) === "en-US") {
    return `## Current Patterns
No survey responses are available, so this report relies on the birth-derived Natural Tendencies analysis.`;
  }
  return `## 현재의 나
설문 응답이 없어 Essence 분석·출생 맥락 위주로 통합합니다.`;
}

/** Slim V1 전용 — v2 10문항만. 18문항 Y/N·레거시 미사용 */
export function buildSurveyAnalysisForSlimV1(
  v2Profile?: CurrentSelfProfile | null,
  locale?: Locale | string,
): { text: string; source: "v2_survey_10q" | "none_fallback" } {
  if (v2Profile) {
    return {
      text: buildSurveyAnalysisFromV2Profile(v2Profile, locale),
      source: "v2_survey_10q",
    };
  }
  return { text: buildSurveyAnalysisFallback(locale), source: "none_fallback" };
}

/** 통합 리포트 설문 입력 — v2 10문항만 */
export function buildSurveyAnalysisForIntegrated(input: {
  v2Profile?: CurrentSelfProfile | null;
  locale?: Locale | string;
}): { text: string; source: "v2_survey_10q" | "none_fallback" } {
  if (input.v2Profile) {
    return {
      text: buildSurveyAnalysisFromV2Profile(input.v2Profile, input.locale),
      source: "v2_survey_10q",
    };
  }
  return { text: buildSurveyAnalysisFallback(input.locale), source: "none_fallback" };
}
