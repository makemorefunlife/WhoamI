import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { PsychMatchResult } from "@/lib/relationship/psychMatch";
import {
  FRIEND_DOMAIN_AXES,
  FRIEND_DOMAIN_AXES_EN,
  resolveFriendCopy,
} from "./domainCopyTables";
import { buildDomainPsychBundle, buildDomainPsychLens } from "./shared";
import type { DomainPsychMatchBundle } from "./types";
import type { Locale } from "@/lib/i18n/locale";
import { pick, LEGACY_FALLBACK_LOCALE } from "@/lib/relationship/friend/friendCopy";

function buildFriendLens(psychMatch: PsychMatchResult, locale: Locale) {
  return buildDomainPsychLens({
    psychMatch,
    domainAxes: locale === "en-US" ? FRIEND_DOMAIN_AXES_EN : FRIEND_DOMAIN_AXES,
    lensTitle: pick(locale, "🍻 Axes that stand out most in friendship", "🍻 우정에서 특히 눈에 띄는 축"),
    chartNote: pick(
      locale,
      "We compared how you two show up right now across the 11-axis survey. (Same standard as the romantic deep-dive.)",
      "친구 둘의 현재 모습을 11축 설문으로 비교했어요. (연인 심화와 같은 기준이에요.)",
    ),
    introTension: pick(
      locale,
      "The chart above covers all 11 axes. Below are the scenes that come up especially often in friendships.",
      "위 차트는 11축 전체예요. 아래는 우정에서 특히 자주 느껴지는 장면이에요.",
    ),
    introDefault: pick(
      locale,
      "The chart above covers all 11 axes. Use the questions below to spot where you match and where you differ.",
      "위 차트는 11축 전체예요. 아래 질문들로 어디가 맞고 어디가 다른지 짚어 보세요.",
    ),
    resolveCopy: (row, meta) => resolveFriendCopy(row, meta, locale),
    locale,
  });
}

export function buildFriendPsychMatchBundle(
  psychA: PsychMasterJson | null | undefined,
  psychB: PsychMasterJson | null | undefined,
  locale: Locale = LEGACY_FALLBACK_LOCALE,
): DomainPsychMatchBundle | null {
  return buildDomainPsychBundle(psychA, psychB, (psychMatch) =>
    buildFriendLens(psychMatch, locale),
  );
}
