import type OpenAI from "openai";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { SajuMasterJson } from "@/lib/personCore/types/sajuMaster";
import { buildPairDomainSignalsFromMasters } from "@/lib/personCore/sajuSignals/pairDomainSignals";
import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import { buildFriendReport } from "@/lib/relationship/friend/buildFriendReport";
import type { SajuChartProvenance } from "@/lib/saju/loadSajuBundleFromReport";
import type { Locale } from "@/lib/i18n/locale";
import {
  FRIEND_SOCIAL_DEEP_FORMAT,
  type FriendSocialDeepReport,
} from "./outputSchema";

export { FRIEND_SOCIAL_DEEP_FORMAT } from "./outputSchema";
export type { FriendSocialDeepReport } from "./outputSchema";
export { isFriendSocialDeepReport } from "./outputSchema";

export type FriendSocialDeepPayload = FriendSocialDeepReport;

/** 친구(Social DNA) 심화 분석 — rule-only */
export async function runFriendSocialDeepAnalysis(
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
): Promise<FriendSocialDeepPayload> {
  const pairFriendship =
    params.sajuMasterA && params.sajuMasterB
      ? buildPairDomainSignalsFromMasters(
          params.sajuMasterA,
          params.sajuMasterB,
        ).friendship
      : null;

  const report = buildFriendReport({
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
    pairFriendship,
    locale: params.locale,
  });

  return {
    format: FRIEND_SOCIAL_DEEP_FORMAT,
    report,
  };
}
