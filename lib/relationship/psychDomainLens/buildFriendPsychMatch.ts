import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { PsychMatchResult } from "@/lib/relationship/psychMatch";
import {
  FRIEND_DOMAIN_AXES,
  resolveFriendCopy,
} from "./domainCopyTables";
import { buildDomainPsychBundle, buildDomainPsychLens } from "./shared";
import type { DomainPsychMatchBundle } from "./types";

function buildFriendLens(psychMatch: PsychMatchResult) {
  return buildDomainPsychLens({
    psychMatch,
    domainAxes: FRIEND_DOMAIN_AXES,
    lensTitle: "🍻 우정에서 특히 눈에 띄는 축",
    chartNote:
      "친구 둘의 현재 모습을 11축 설문으로 비교했어요. (연인 심화와 같은 기준이에요.)",
    introTension:
      "위 차트는 11축 전체예요. 아래는 우정에서 특히 자주 느껴지는 장면이에요.",
    introDefault:
      "위 차트는 11축 전체예요. 아래 질문들로 어디가 맞고 어디가 다른지 짚어 보세요.",
    resolveCopy: resolveFriendCopy,
  });
}

export function buildFriendPsychMatchBundle(
  psychA: PsychMasterJson | null | undefined,
  psychB: PsychMasterJson | null | undefined,
): DomainPsychMatchBundle | null {
  return buildDomainPsychBundle(psychA, psychB, buildFriendLens);
}
