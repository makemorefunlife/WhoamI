import type { PsychMasterJson } from "../types/psychMaster";

export type PersonCoreRelationMetaPayload = {
  report_id_a: string;
  report_id_b: string;
  input_fingerprint_a: string;
  input_fingerprint_b: string;
  psych_a: PsychMasterJson;
  psych_b: PsychMasterJson;
};

export function buildPersonCoreRelationMeta(params: {
  psychMasterA?: PsychMasterJson | null;
  psychMasterB?: PsychMasterJson | null;
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
  };
}
