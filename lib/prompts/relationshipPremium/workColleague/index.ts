import type OpenAI from "openai";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { SajuMasterJson } from "@/lib/personCore/types/sajuMaster";
import { buildPairDomainSignalsFromMasters } from "@/lib/personCore/sajuSignals/pairDomainSignals";
import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import { buildWorkColleagueReport } from "@/lib/relationship/workColleague/buildWorkColleagueReport";
import type { SajuChartProvenance } from "@/lib/saju/loadSajuBundleFromReport";
import type { Locale } from "@/lib/i18n/locale";
import {
  WORK_COLLEAGUE_DEEP_FORMAT,
  type WorkColleagueDeepReport,
} from "./outputSchema";

export { WORK_COLLEAGUE_DEEP_FORMAT } from "./outputSchema";
export type { WorkColleagueDeepReport } from "./outputSchema";
export { isWorkColleagueDeepReport } from "./outputSchema";

export type WorkColleagueDeepPayload = WorkColleagueDeepReport;

/**
 * 동료·비즈니스 파트너 심화 분석
 * — 월지·천간·십신 보완 규칙 기반 (연인 일지 중심 로직과 분리)
 */
export async function runWorkColleagueDeepAnalysis(
  _openai: OpenAI,
  params: {
    nicknameA: string;
    nicknameB: string;
    birthA: { date: string; time: string; place: string };
    birthB: { date: string; time: string; place: string };
    sajuJsonA: SajuDataForIntegrated;
    sajuJsonB: SajuDataForIntegrated;
    sajuProvenanceA?: SajuChartProvenance;
    sajuProvenanceB?: SajuChartProvenance;
    psychMasterA?: PsychMasterJson | null;
    psychMasterB?: PsychMasterJson | null;
    personCoreMeta?: {
      reportIdA: string;
      reportIdB: string;
      inputFingerprintA: string;
      inputFingerprintB: string;
    };
    sajuMasterA?: SajuMasterJson | null;
    sajuMasterB?: SajuMasterJson | null;
    locale?: Locale;
  },
): Promise<WorkColleagueDeepPayload> {
  const pairWork =
    params.sajuMasterA && params.sajuMasterB
      ? buildPairDomainSignalsFromMasters(
          params.sajuMasterA,
          params.sajuMasterB,
        ).work
      : null;

  // work 명리 신호(월주 격국·신살 등) — PersonCore가 person별로 1회 계산해 둔
  // 값을 그대로 읽어서 캐릭터 타입 판정(SSOT) + 이상적 역할 "why" 텍스트에
  // 반영한다. sajuMaster가 없으면(레거시 캐시 등) officeLanguage.ts가 raw-count
  // 방식으로 안전하게 폴백한다.
  const workSignalsA = params.sajuMasterA?.domain_signals.work_signals;
  const workSignalsB = params.sajuMasterB?.domain_signals.work_signals;

  const report = buildWorkColleagueReport({
    nicknameA: params.nicknameA,
    nicknameB: params.nicknameB,
    sajuJsonA: params.sajuJsonA,
    sajuJsonB: params.sajuJsonB,
    birthPlaceA: params.birthA.place,
    birthPlaceB: params.birthB.place,
    birthTimeUnknownA: params.sajuProvenanceA?.birthTimeUnknown,
    birthTimeUnknownB: params.sajuProvenanceB?.birthTimeUnknown,
    psychMasterA: params.psychMasterA,
    psychMasterB: params.psychMasterB,
    personCoreMeta: params.personCoreMeta,
    pairWork,
    workSignalsA,
    workSignalsB,
    locale: params.locale,
  });

  return {
    format: WORK_COLLEAGUE_DEEP_FORMAT,
    report,
  };
}
