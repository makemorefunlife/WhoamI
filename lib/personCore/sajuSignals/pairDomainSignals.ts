import type { SajuMasterJson } from "../types/sajuMaster";
import { pairCohabitationSignals } from "./pairCohabitationSignals";
import { pairFamilySignals } from "./pairFamilySignals";
import { pairFriendshipSignals } from "./pairFriendshipSignals";
import { pairWorkSignals } from "./pairWorkSignals";
import {
  PAIR_DOMAIN_SIGNALS_VERSION,
  type PairDomainSignalsPack,
} from "./pairTypes";
import type { DomainSajuSignalsPack } from "./types";

export type { PairDomainSignalsPack } from "./pairTypes";
export type {
  PairCohabitationSignals,
  PairWorkSignals,
  PairFriendshipSignals,
  PairFamilySignals,
  SecretAffinityLink,
} from "./pairTypes";

export { PAIR_DOMAIN_SIGNALS_VERSION } from "./pairTypes";

/**
 * 두 PersonCore `saju_master_json.domain_signals` 교차 연산.
 * UI·템플릿 미연결 — 소비처(킬러·처방전)에서 opt-in.
 */
export function buildPairDomainSignalsFromMasters(
  masterA: SajuMasterJson,
  masterB: SajuMasterJson,
): PairDomainSignalsPack {
  return buildPairDomainSignals(
    masterA.domain_signals,
    masterB.domain_signals,
    {
      hiddenStemsA: masterA.hidden_stems,
      hiddenStemsB: masterB.hidden_stems,
      dayStemA: masterA.stem_focus.day_stem_code,
      dayStemB: masterB.stem_focus.day_stem_code,
    },
  );
}

export function buildPairDomainSignals(
  signalsA: DomainSajuSignalsPack,
  signalsB: DomainSajuSignalsPack,
  stems?: {
    hiddenStemsA: SajuMasterJson["hidden_stems"];
    hiddenStemsB: SajuMasterJson["hidden_stems"];
    dayStemA: string;
    dayStemB: string;
  },
): PairDomainSignalsPack {
  const hiddenStemsA = stems?.hiddenStemsA ?? [];
  const hiddenStemsB = stems?.hiddenStemsB ?? [];
  const dayStemA = stems?.dayStemA ?? "";
  const dayStemB = stems?.dayStemB ?? "";

  return {
    schema_version: PAIR_DOMAIN_SIGNALS_VERSION,
    cohabitation: pairCohabitationSignals({
      signalsA,
      signalsB,
      hiddenStemsA,
      hiddenStemsB,
      dayStemA,
      dayStemB,
    }),
    work: pairWorkSignals(signalsA, signalsB),
    friendship: pairFriendshipSignals(signalsA, signalsB),
    family: pairFamilySignals(signalsA, signalsB),
  };
}
