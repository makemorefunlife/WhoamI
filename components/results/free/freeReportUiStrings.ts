import type { Locale } from "@/lib/i18n/locale";

/**
 * Static UI copy for the free lite reports ("current" and "essence") —
 * matches the Lovable "Inner Compass Free" preview design. The report
 * body itself (current_pattern, key_strength, etc.) already comes from
 * the LLM via useCurrentLiteReport/useEssenceLiteReport in the requested
 * locale; this only covers chrome shared by the dashboard panel
 * (StitchLiteResultPanel) and the standalone /current page.
 */
export type FreeReportUiStrings = {
  badge: string;
  indicatorCaption: string;
  currentSectionTags: {
    pattern: string;
    strength: string;
    growth: string;
    hint: string;
    action: string;
  };
  essenceSectionTags: {
    personality: string;
    relationship: string;
    environment: string;
  };
  upsell: {
    kicker: string;
    headline: string;
    body: string;
    cta: string;
  };
};

const EN: FreeReportUiStrings = {
  badge: "Free",
  indicatorCaption: "A quick read on where you are today",
  currentSectionTags: {
    pattern: "Pattern",
    strength: "Signal",
    growth: "Friction",
    hint: "Hint",
    action: "Today",
  },
  essenceSectionTags: {
    personality: "Core",
    relationship: "Relational",
    environment: "Environment",
  },
  upsell: {
    kicker: "Go deeper",
    headline: "The full deep report",
    body: "Five parts across self, energy, relationships, practice, and forward — with scripts, a radar chart, and a weekly reset.",
    cta: "Open the full report",
  },
};

const KO: FreeReportUiStrings = {
  badge: "무료",
  indicatorCaption: "지금 당신이 서 있는 자리에 대한 짧은 스케치",
  currentSectionTags: {
    pattern: "패턴",
    strength: "시그널",
    growth: "마찰",
    hint: "힌트",
    action: "오늘",
  },
  essenceSectionTags: {
    personality: "본질",
    relationship: "관계",
    environment: "환경",
  },
  upsell: {
    kicker: "더 깊이 들어가기",
    headline: "심화 리포트 전체 보기",
    body: "자기 · 에너지 · 관계 · 실천 · 앞으로의 다섯 파트, 스크립트와 레이더 차트, 주간 리셋까지.",
    cta: "심화 리포트 열기",
  },
};

export function getFreeReportUiStrings(locale: Locale): FreeReportUiStrings {
  return locale === "ko-KR" ? KO : EN;
}
