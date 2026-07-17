import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { PsychMatchResult } from "@/lib/relationship/psychMatch";
import {
  WORK_DOMAIN_AXES,
  WORK_DOMAIN_AXES_EN,
  resolveWorkCopy,
} from "./domainCopyTables";
import { buildDomainPsychBundle, buildDomainPsychLens } from "./shared";
import type { DomainPsychMatchBundle } from "./types";
import type { Locale } from "@/lib/i18n/locale";
import { pick, LEGACY_FALLBACK_LOCALE } from "@/lib/relationship/workColleague/workColleagueCopy";

function buildWorkLens(psychMatch: PsychMatchResult, locale: Locale) {
  return buildDomainPsychLens({
    psychMatch,
    domainAxes: locale === "en-US" ? WORK_DOMAIN_AXES_EN : WORK_DOMAIN_AXES,
    lensTitle: pick(locale, "🏢 Axes that stand out most when working together", "🏢 같이 일할 때 특히 눈에 띄는 축"),
    chartNote: pick(
      locale,
      "We compared how you two show up right now as colleagues/partners across the 11-axis survey. (Same standard as the romantic deep-dive.)",
      "동료·파트너 둘의 현재 모습을 11축 설문으로 비교했어요. (연인 심화와 같은 기준이에요.)",
    ),
    introTension: pick(
      locale,
      "The chart above covers all 11 axes. Below are the scenes that come up especially often on the same team.",
      "위 차트는 11축 전체예요. 아래는 한 팀에서 특히 자주 터지는 장면을 짚었어요.",
    ),
    introDefault: pick(
      locale,
      "The chart above covers all 11 axes. Below are the questions that tend to come up in collaboration. Just splitting up roles makes this a lot easier.",
      "위 차트는 11축 전체예요. 아래는 협업에서 체감되기 쉬운 질문들이에요. 역할만 나눠도 훨씬 편해져요.",
    ),
    resolveCopy: (row, meta) => resolveWorkCopy(row, meta, locale),
    locale,
  });
}

export function buildWorkPsychMatchBundle(
  psychA: PsychMasterJson | null | undefined,
  psychB: PsychMasterJson | null | undefined,
  locale: Locale = LEGACY_FALLBACK_LOCALE,
): DomainPsychMatchBundle | null {
  return buildDomainPsychBundle(psychA, psychB, (psychMatch) =>
    buildWorkLens(psychMatch, locale),
  );
}
