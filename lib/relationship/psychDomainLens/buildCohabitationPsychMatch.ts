import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { PsychMatchResult } from "@/lib/relationship/psychMatch";
import {
  COHABITATION_CHART_NOTE,
  COHABITATION_DOMAIN_AXES,
  resolveCohabitationCopy,
} from "./cohabitationCopyTables";
import { buildDomainPsychBundle, buildDomainPsychLens } from "./shared";
import type { DomainPsychMatchBundle } from "./types";

function buildCohabitationLens(psychMatch: PsychMatchResult) {
  return buildDomainPsychLens({
    psychMatch,
    domainAxes: COHABITATION_DOMAIN_AXES,
    lensTitle: "🏠 동거에서 특히 눈에 띄는 축",
    chartNote: COHABITATION_CHART_NOTE,
    introTension:
      "위 차트는 11축 전체예요. 아래는 같이 살면서 특히 체감되기 쉬운 장면을 짚었어요 — 읽다 보면 '아, 우리 그 얘기네'가 나올 수 있어요.",
    introDefault:
      "위 차트는 11축 전체예요. 아래는 한 지붕 아래서 자주 나오는 질문들이에요. 편한 건 그대로 두고, 엇갈리는 부분만 역할로 나눠 보세요.",
    resolveCopy: resolveCohabitationCopy,
    maxHighlights: 3,
  });
}

export function buildCohabitationPsychMatchBundle(
  psychA: PsychMasterJson | null | undefined,
  psychB: PsychMasterJson | null | undefined,
): DomainPsychMatchBundle | null {
  return buildDomainPsychBundle(psychA, psychB, buildCohabitationLens);
}
