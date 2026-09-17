import type { PsychMasterJson } from "../types/psychMaster";
import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import type { WorkSajuSignals, FriendshipSajuSignals } from "../sajuSignals/types";

export type PersonCoreRelationMetaPayload = {
  report_id_a: string;
  report_id_b: string;
  input_fingerprint_a: string;
  input_fingerprint_b: string;
  psych_a: PsychMasterJson;
  psych_b: PsychMasterJson;
  saju_chart_a?: SajuDataForIntegrated | null;
  saju_chart_b?: SajuDataForIntegrated | null;
  work_signals_a?: WorkSajuSignals | null;
  work_signals_b?: WorkSajuSignals | null;
  friend_signals_a?: FriendshipSajuSignals | null;
  friend_signals_b?: FriendshipSajuSignals | null;
};

export function buildPersonCoreRelationMeta(params: {
  psychMasterA?: PsychMasterJson | null;
  psychMasterB?: PsychMasterJson | null;
  sajuJsonA?: SajuDataForIntegrated | null;
  sajuJsonB?: SajuDataForIntegrated | null;
  workSignalsA?: WorkSajuSignals | null;
  workSignalsB?: WorkSajuSignals | null;
  friendSignalsA?: FriendshipSajuSignals | null;
  friendSignalsB?: FriendshipSajuSignals | null;
  personCoreMeta?: {
    reportIdA: string;
    reportIdB: string;
    inputFingerprintA: string;
    inputFingerprintB: string;
  } | null;
}): PersonCoreRelationMetaPayload | undefined {
  if (!params.psychMasterA || !params.psychMasterB || !params.personCoreMeta) {
    return undefined;
  }
  return {
    report_id_a: params.personCoreMeta.reportIdA,
    report_id_b: params.personCoreMeta.reportIdB,
    input_fingerprint_a: params.personCoreMeta.inputFingerprintA,
    input_fingerprint_b: params.personCoreMeta.inputFingerprintB,
    psych_a: params.psychMasterA,
    psych_b: params.psychMasterB,
    saju_chart_a: params.sajuJsonA ?? null,
    saju_chart_b: params.sajuJsonB ?? null,
    work_signals_a: params.workSignalsA ?? null,
    work_signals_b: params.workSignalsB ?? null,
    friend_signals_a: params.friendSignalsA ?? null,
    friend_signals_b: params.friendSignalsB ?? null,
  };
}
