import type OpenAI from "openai";
import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { SajuMasterJson } from "@/lib/personCore/types/sajuMaster";
import { buildPairDomainSignalsFromMasters } from "@/lib/personCore/sajuSignals/pairDomainSignals";
import { buildMarriageReport } from "@/lib/relationship/marriage/buildMarriageReport";
import type { SajuChartProvenance } from "@/lib/saju/loadSajuBundleFromReport";
import type { Locale } from "@/lib/i18n/locale";
import { attachMarriedSajuDeepOverlay } from "@/lib/prompts/relationshipPremium/marriedSajuDeep";
import {
  COHABITATION_DEEP_FORMAT,
  type CohabitationDeepReport,
} from "./outputSchema";

export { COHABITATION_DEEP_FORMAT } from "./outputSchema";
export type { CohabitationDeepReport } from "./outputSchema";
export { isCohabitationDeepReport } from "./outputSchema";

export type CohabitationDeepPayload = CohabitationDeepReport;

/**
 * 동거·결혼 심화 분석
 * 1) rule-only CE (`buildMarriageReport`) — classifications SSOT
 * 2) optional marriedSajuDeep LLM explain overlay → meta.married_saju_deep
 *    (RELATIONSHIP_MARRIED_NARRATIVE=0 to skip)
 */
export async function runCohabitationDeepAnalysis(
  openai: OpenAI,
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
    userCustomMyName?: string;
    userCustomTargetName?: string;
    /** Skip LLM overlay even if env enabled (tests). */
    skipMarriedNarrative?: boolean;
  },
  options?: { abortSignal?: AbortSignal },
): Promise<CohabitationDeepPayload> {
  const pairCohabitation =
    params.sajuMasterA && params.sajuMasterB
      ? buildPairDomainSignalsFromMasters(
          params.sajuMasterA,
          params.sajuMasterB,
        ).cohabitation
      : null;
  const cohabitationSignalsA =
    params.sajuMasterA?.domain_signals.cohabitation_signals;
  const cohabitationSignalsB =
    params.sajuMasterB?.domain_signals.cohabitation_signals;

  let report = buildMarriageReport({
    nicknameA: params.nicknameA,
    nicknameB: params.nicknameB,
    sajuJsonA: params.sajuJsonA,
    sajuJsonB: params.sajuJsonB,
    birthPlaceA: params.birthA.place,
    birthPlaceB: params.birthB.place,
    birthTimeUnknownA: params.sajuProvenanceA?.birthTimeUnknown,
    birthTimeUnknownB: params.sajuProvenanceB?.birthTimeUnknown,
    birthDateA: params.birthA.date,
    birthDateB: params.birthB.date,
    birthTimeA: params.birthA.time,
    birthTimeB: params.birthB.time,
    psychMasterA: params.psychMasterA,
    psychMasterB: params.psychMasterB,
    personCoreMeta: params.personCoreMeta,
    pairCohabitation,
    cohabitationSignalsA,
    cohabitationSignalsB,
    locale: params.locale,
  });

  if (!params.skipMarriedNarrative) {
    const short =
      typeof params.locale === "string" && params.locale.startsWith("en")
        ? "en"
        : "ko";
    report = await attachMarriedSajuDeepOverlay(
      openai,
      {
        nicknameA: params.nicknameA,
        nicknameB: params.nicknameB,
        report,
        userCustomMyName: params.userCustomMyName,
        userCustomTargetName: params.userCustomTargetName,
        locale: short,
      },
      options,
    );
  }

  return {
    format: COHABITATION_DEEP_FORMAT,
    report,
  };
}
