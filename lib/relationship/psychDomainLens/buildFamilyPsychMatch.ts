import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { PsychMatchResult } from "@/lib/relationship/psychMatch";
import {
  FAMILY_DOMAIN_AXES,
  FAMILY_DOMAIN_AXES_EN,
  resolveFamilyCopy,
} from "./domainCopyTables";
import { buildDomainPsychBundle, buildDomainPsychLens } from "./shared";
import type { DomainPsychMatchBundle } from "./types";
import type { Locale } from "@/lib/i18n/locale";
import { pick, LEGACY_FALLBACK_LOCALE } from "@/lib/relationship/familyParent/familyParentCopy";

function buildFamilyLens(psychMatch: PsychMatchResult, locale: Locale) {
  return buildDomainPsychLens({
    psychMatch,
    domainAxes: locale === "en-US" ? FAMILY_DOMAIN_AXES_EN : FAMILY_DOMAIN_AXES,
    lensTitle: pick(locale, "👨‍👩‍👧 Axes that stand out most in the family relationship", "👨‍👩‍👧 가족 관계에서 특히 눈에 띄는 축"),
    chartNote: pick(
      locale,
      "We compared how you both show up right now across the 11 axes.",
      "두 분의 현재 모습을 11축으로 비교했어요.",
    ),
    introTension: pick(
      locale,
      "The chart above covers all 11 axes. Below are the scenes that come up especially often at home.",
      "위 차트는 11축 전체예요. 아래는 집안에서 특히 자주 터지는 장면을 짚었어요.",
    ),
    introDefault: pick(
      locale,
      "The chart above covers all 11 axes. Below are the questions that tend to come up between parent and child.",
      "위 차트는 11축 전체예요. 아래는 부모·자녀 사이에서 체감되기 쉬운 질문들이에요.",
    ),
    resolveCopy: (row, meta) => resolveFamilyCopy(row, meta, locale),
    locale,
  });
}

export function buildFamilyPsychMatchBundle(
  psychA: PsychMasterJson | null | undefined,
  psychB: PsychMasterJson | null | undefined,
  locale: Locale = LEGACY_FALLBACK_LOCALE,
): DomainPsychMatchBundle | null {
  return buildDomainPsychBundle(psychA, psychB, (psychMatch) =>
    buildFamilyLens(psychMatch, locale),
  );
}
