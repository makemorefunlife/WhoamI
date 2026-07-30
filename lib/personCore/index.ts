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

export {
  INDIVIDUAL_SAJU_CHART_VERSION,
  INDIVIDUAL_SAJU_ENGINE_ID,
  buildIndividualSajuChart,
  verifyIndividualParity,
  computeRefDataFingerprint,
} from "./individualSaju";
export type {
  IndividualSajuChart,
  ParityReport,
  PillarSlot,
  StemRef,
  BranchRef,
  TenGodRef,
} from "./individualSaju";

export {
  REFERENCE_DICTIONARY_VERSION,
  buildReferenceDictionary,
  getReferenceDictionary,
  lookupReference,
  listByCategory,
  assertDictionaryPurity,
} from "./referenceDictionary";
export type {
  ReferenceDictionary,
  ReferenceEntry,
  DictionaryCategory,
} from "./referenceDictionary";

export {
  PERSONAL_CE_VERSION,
  PERSONAL_INNATE_LENS,
  runPersonalContextEngine,
  assertPersonalContextPurity,
  adaptPersonalContextForSlim,
  SLIM_INSERTION_POINTS,
  POLICY_DEFAULTS,
  DOCUMENTED_SSOT_GAPS,
} from "./personalContextEngine";
export type {
  PersonalContextEngineInput,
  PersonalContextEngineOutput,
  PersonalContextPacket,
  SlimPersonalContextPackage,
  PersonalSignalTier,
} from "./personalContextEngine";

export {
  PAIR_SAJU_FACTS_VERSION,
  buildPairSajuFacts,
  isStemClash,
} from "./pairSaju";
export type { PairSajuFacts, PairSajuFactsInput } from "./pairSaju";

export {
  PAIR_CE_VERSION,
  PAIR_SHARED_LENS,
  runPairContextEngine,
  assertPairContextPurity,
  applyDomainPairLens,
  applyRomanticPairLens,
  applyFriendPairLens,
  applyFamilyPairLens,
  applyWorkPairLens,
  romanticNonTensionPackets,
  buildDomainPairLensFromCharts,
  buildPairCeFixtureInput,
} from "./pairContextEngine";
export type {
  PairContextEngineInput,
  PairContextEngineOutput,
  PairContextPacket,
  DomainPairLensOutput,
  DomainPairLensId,
} from "./pairContextEngine";

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
  type PersonCoreSajuSource,
} from "./services/bundlePersonCoreForPremium";
export {
  legacySajuInputsFromPersonCore,
  rehydrateSajuDataForIntegrated,
} from "./adapters/rehydrateSajuFromPersonCore";
export {
  legacySajuInputsFromIndividual,
  rehydrateChartContextFromIndividual,
  rehydrateProvenanceFromIndividual,
  rehydrateSajuDataFromIndividual,
  rehydrateSajuMasterFromIndividual,
} from "./adapters/rehydrateFromIndividual";
export type { LegacySajuInputsFromIndividual } from "./adapters/rehydrateFromIndividual";
