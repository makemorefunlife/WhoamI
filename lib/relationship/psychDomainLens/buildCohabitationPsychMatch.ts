import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { PsychMatchResult } from "@/lib/relationship/psychMatch";
import {
  COHABITATION_CHART_NOTE,
  COHABITATION_CHART_NOTE_EN,
  COHABITATION_DOMAIN_AXES,
  COHABITATION_DOMAIN_AXES_EN,
  resolveCohabitationCopy,
} from "./cohabitationCopyTables";
import { buildDomainPsychBundle, buildDomainPsychLens } from "./shared";
import type { DomainPsychMatchBundle } from "./types";
import type { Locale } from "@/lib/i18n/locale";

/**
 * `locale` defaults to Korean so every pre-existing caller that doesn't pass
 * it keeps rendering exactly as before.
 */
function buildCohabitationLens(psychMatch: PsychMatchResult, locale: Locale = "ko-KR") {
  return buildDomainPsychLens({
    psychMatch,
    domainAxes: locale === "en-US" ? COHABITATION_DOMAIN_AXES_EN : COHABITATION_DOMAIN_AXES,
    lensTitle:
      locale === "en-US"
        ? "🏠 Axes that stand out most in cohabitation"
        : "🏠 동거에서 특히 눈에 띄는 축",
    chartNote: locale === "en-US" ? COHABITATION_CHART_NOTE_EN : COHABITATION_CHART_NOTE,
    introTension:
      locale === "en-US"
        ? "The chart above covers all 11 axes. Below are the scenes that come up especially often when living together — you may find yourself thinking 'oh, that's us' while reading."
        : "위 차트는 11축 전체예요. 아래는 같이 살면서 특히 체감되기 쉬운 장면을 짚었어요 — 읽다 보면 '아, 우리 그 얘기네'가 나올 수 있어요.",
    introDefault:
      locale === "en-US"
        ? "The chart above covers all 11 axes. Below are questions that come up often under one roof. Leave what's already comfortable alone, and just split up the parts where you differ."
        : "위 차트는 11축 전체예요. 아래는 한 지붕 아래서 자주 나오는 질문들이에요. 편한 건 그대로 두고, 엇갈리는 부분만 역할로 나눠 보세요.",
    resolveCopy: (row, meta) => resolveCohabitationCopy(row, meta, locale),
    maxHighlights: 3,
    locale,
  });
}

export function buildCohabitationPsychMatchBundle(
  psychA: PsychMasterJson | null | undefined,
  psychB: PsychMasterJson | null | undefined,
  locale: Locale = "ko-KR",
): DomainPsychMatchBundle | null {
  return buildDomainPsychBundle(psychA, psychB, (psychMatch) =>
    buildCohabitationLens(psychMatch, locale),
  );
}
