import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { PsychMatchResult } from "@/lib/relationship/psychMatch";
import {
  WORK_DOMAIN_AXES,
  resolveWorkCopy,
} from "./domainCopyTables";
import { buildDomainPsychBundle, buildDomainPsychLens } from "./shared";
import type { DomainPsychMatchBundle } from "./types";

function buildWorkLens(psychMatch: PsychMatchResult) {
  return buildDomainPsychLens({
    psychMatch,
    domainAxes: WORK_DOMAIN_AXES,
    lensTitle: "🏢 같이 일할 때 특히 눈에 띄는 축",
    chartNote:
      "동료·파트너 둘의 현재 모습을 11축 설문으로 비교했어요. (연인 심화와 같은 기준이에요.)",
    introTension:
      "위 차트는 11축 전체예요. 아래는 한 팀에서 특히 자주 터지는 장면을 짚었어요.",
    introDefault:
      "위 차트는 11축 전체예요. 아래는 협업에서 체감되기 쉬운 질문들이에요. 역할만 나눠도 훨씬 편해져요.",
    resolveCopy: resolveWorkCopy,
  });
}

export function buildWorkPsychMatchBundle(
  psychA: PsychMasterJson | null | undefined,
  psychB: PsychMasterJson | null | undefined,
): DomainPsychMatchBundle | null {
  return buildDomainPsychBundle(psychA, psychB, buildWorkLens);
}
