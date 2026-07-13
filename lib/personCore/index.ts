/**
 * PersonCore — 신규 SSOT 레이어 (깔고 → 연결하고 → 지운다).
 *
 * 1단계: 타입·DB 스키마만 정의. 레거시 import 금지.
 * 2단계: buildPersonCoreBlueprint(reportId) + upsert
 * 3단계: 관계·Blueprint 소비처를 스냅샷 읽기로 이주
 */

export {
  PERSON_CORE_BLUEPRINT_VERSION,
  PSYCH_MASTER_JSON_VERSION,
  SAJU_ENGINE_VERSION,
  SAJU_MASTER_JSON_VERSION,
  USER_META_JSON_VERSION,
} from "./schemaVersion";

export type {
  HiddenStemEntry,
  JohuClimateSnapshot,
  RelationDynamicsEntry,
  RelationDynamicsType,
  SajuMasterJson,
  SajuMasterPillar,
  SajuMasterStemFocus,
  SajuPillarSlot,
  SajuShinsalHit,
  SajuSpecialSignalFlag,
  SajuSpecialSignalKey,
  TenGodPillarEntry,
  TwelveStageEntry,
} from "./types/sajuMaster";

export type {
  HomeLifeDnaTags,
  HomeLifeFamilyCategory,
  PsychMasterJson,
  PsychSecondaryAxesScores,
  PsychSurveySource,
} from "./types/psychMaster";

export type { UserMetaJson } from "./types/userMeta";

export type {
  PersonCoreBlueprint,
  PersonCoreBlueprintRecord,
} from "./types/personCoreBlueprint";

export { PersonCoreError } from "./errors";
export type { PersonCoreErrorCode } from "./errors";

export { buildPersonCoreBlueprint } from "./services/buildPersonCoreBlueprint";
export { upsertPersonCoreBlueprint } from "./services/upsertPersonCoreBlueprint";
export { loadPerson } from "./services/loadPerson";
export {
  getOrBuildPersonCore,
  getOrBuildPersonCorePair,
  type GetOrBuildPersonCoreOptions,
  type PersonCorePair,
} from "./services/getOrBuildPersonCore";
export { computeCurrentInputFingerprint } from "./services/computeCurrentInputFingerprint";
export { invalidatePersonCoreBlueprint } from "./services/invalidatePersonCoreBlueprint";
export { extractDomainSajuSignals } from "./sajuSignals/extractDomainSajuSignals";
export type {
  CohabitationSajuSignals,
  DomainSajuSignalsPack,
  FamilySajuSignals,
  FriendshipSajuSignals,
  WorkSajuSignals,
} from "./sajuSignals/types";
export {
  buildPairDomainSignals,
  buildPairDomainSignalsFromMasters,
  PAIR_DOMAIN_SIGNALS_VERSION,
  type PairDomainSignalsPack,
  type PairCohabitationSignals,
  type PairWorkSignals,
  type PairFriendshipSignals,
  type PairFamilySignals,
} from "./sajuSignals/pairDomainSignals";
export {
  bundlePersonCoreForPremium,
  bundlePersonCorePairForPremium,
  personCoreRelationParamsFromBundles,
  type PremiumPersonCoreBundle,
  type PremiumPersonCorePairBundles,
} from "./services/bundlePersonCoreForPremium";
export {
  legacySajuInputsFromPersonCore,
  rehydrateSajuDataForIntegrated,
} from "./adapters/rehydrateSajuFromPersonCore";
