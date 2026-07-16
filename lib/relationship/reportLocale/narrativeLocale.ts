/**
 * Non-LLM relationship report locale wiring.
 * Structure/scoring stay shared; user-facing narrative packs are selected here.
 *
 * Full English narrative for work/friend/family/cohabitation templates is still
 * largely Korean in *ReportTemplate files — callers should pass locale and use
 * packs for chrome/headlines. Expand packs incrementally.
 */
import type { Locale } from "@/lib/i18n/locale";
import { normalizeLocale } from "@/lib/i18n/locale";

export type NarrativeChrome = {
  locale: Locale;
  deepLabel: string;
  fallbackHeadline: string;
  loadingHint: string;
};

export function getNarrativeChrome(
  locale: Locale | string,
  kind: "work" | "friendship" | "family" | "cohabitation" | "romantic",
): NarrativeChrome {
  const loc = normalizeLocale(locale);
  if (loc === "ko-KR") {
    const labels: Record<typeof kind, string> = {
      work: "동료 심화",
      friendship: "친구 심화",
      family: "가족 심화",
      cohabitation: "동거·결혼 심화",
      romantic: "연인 심화",
    };
    return {
      locale: loc,
      deepLabel: labels[kind],
      fallbackHeadline: "두 사람의 관계 리포트",
      loadingHint: "분석을 준비하는 중…",
    };
  }
  const labels: Record<typeof kind, string> = {
    work: "Work deep analysis",
    friendship: "Friendship deep analysis",
    family: "Family deep analysis",
    cohabitation: "Cohabitation deep analysis",
    romantic: "Romantic deep analysis",
  };
  return {
    locale: loc,
    deepLabel: labels[kind],
    fallbackHeadline: "Your relationship report",
    loadingHint: "Preparing analysis…",
  };
}
