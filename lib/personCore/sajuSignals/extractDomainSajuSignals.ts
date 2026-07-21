import type { SajuBundle } from "@/lib/v2/saju/calculateSajuBundle";
import { SAJU_ENGINE_VERSION } from "../schemaVersion";
import type { JohuClimateSnapshot } from "../types/sajuMaster";
import { extractCohabitationSignals } from "./extractCohabitationSignals";
import { extractFamilySignals } from "./extractFamilySignals";
import { extractFriendshipSignals } from "./extractFriendshipSignals";
import { extractRomanticSignals } from "./extractRomanticSignals";
import { extractWorkSignals } from "./extractWorkSignals";
import {
  DOMAIN_SAJU_SIGNALS_VERSION,
  type DomainSajuSignalsPack,
} from "./types";

/**
 * PersonCore bake-in — 4대 관계 도메인 명리 신호를 단 1회 계산.
 * (pair 분석은 소비처에서 A·B 스냅샷을 조합)
 */
export function extractDomainSajuSignals(
  bundle: SajuBundle,
  johuClimate: JohuClimateSnapshot,
): DomainSajuSignalsPack {
  return {
    schema_version: DOMAIN_SAJU_SIGNALS_VERSION,
    engine_version: SAJU_ENGINE_VERSION,
    cohabitation_signals: extractCohabitationSignals(bundle),
    work_signals: extractWorkSignals(bundle),
    friendship_signals: extractFriendshipSignals(bundle, johuClimate),
    family_signals: extractFamilySignals(bundle),
    romantic_signals: extractRomanticSignals(bundle, johuClimate),
  };
}
