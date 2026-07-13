import type OpenAI from "openai";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import { buildWorkColleagueReport } from "@/lib/relationship/workColleague/buildWorkColleagueReport";
import type { SajuChartProvenance } from "@/lib/saju/loadSajuBundleFromReport";
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
  },
): Promise<WorkColleagueDeepPayload> {
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
  });

  return {
    format: WORK_COLLEAGUE_DEEP_FORMAT,
    report,
  };
}
