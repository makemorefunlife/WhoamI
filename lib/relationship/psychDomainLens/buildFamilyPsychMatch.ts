import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { PsychMatchResult } from "@/lib/relationship/psychMatch";
import {
  FAMILY_DOMAIN_AXES,
  resolveFamilyCopy,
} from "./domainCopyTables";
import { buildDomainPsychBundle, buildDomainPsychLens } from "./shared";
import type { DomainPsychMatchBundle } from "./types";

function buildFamilyLens(psychMatch: PsychMatchResult) {
  return buildDomainPsychLens({
    psychMatch,
    domainAxes: FAMILY_DOMAIN_AXES,
    lensTitle: "👨‍👩‍👧 가족 관계에서 특히 눈에 띄는 축",
    chartNote:
      "부모와 자녀의 현재 모습을 11축 설문으로 비교했어요. (연인·동거와 같은 기준이에요.)",
    introTension:
      "위 차트는 11축 전체예요. 아래는 집안에서 특히 자주 터지는 장면을 짚었어요.",
    introDefault:
      "위 차트는 11축 전체예요. 아래는 부모·자녀 사이에서 체감되기 쉬운 질문들이에요.",
    resolveCopy: resolveFamilyCopy,
  });
}

export function buildFamilyPsychMatchBundle(
  psychA: PsychMasterJson | null | undefined,
  psychB: PsychMasterJson | null | undefined,
): DomainPsychMatchBundle | null {
  return buildDomainPsychBundle(psychA, psychB, buildFamilyLens);
}
