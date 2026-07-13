import type OpenAI from "openai";
import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { SajuMasterJson } from "@/lib/personCore/types/sajuMaster";
import { buildPairDomainSignalsFromMasters } from "@/lib/personCore/sajuSignals/pairDomainSignals";
import { buildMarriageReport } from "@/lib/relationship/marriage/buildMarriageReport";
import type { SajuChartProvenance } from "@/lib/saju/loadSajuBundleFromReport";
import {
  COHABITATION_DEEP_FORMAT,
  type CohabitationDeepReport,
} from "./outputSchema";

export { COHABITATION_DEEP_FORMAT } from "./outputSchema";
export type { CohabitationDeepReport } from "./outputSchema";
export { isCohabitationDeepReport } from "./outputSchema";

export type CohabitationDeepPayload = CohabitationDeepReport;

/**
 * 동거·결혼 심화 분석 — 일주·시주·가정궁 규칙 기반 (연인·동료 파이프라인과 분리)
 */
export async function runCohabitationDeepAnalysis(
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
  },
): Promise<CohabitationDeepPayload> {
  const pairCohabitation =
    params.sajuMasterA && params.sajuMasterB
      ? buildPairDomainSignalsFromMasters(
          params.sajuMasterA,
          params.sajuMasterB,
        ).cohabitation
      : null;

  const report = buildMarriageReport({
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
    pairCohabitation,
  });

  return {
    format: COHABITATION_DEEP_FORMAT,
    report,
  };
}
