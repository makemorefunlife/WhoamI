export {
  PERSONAL_CE_VERSION,
  PERSONAL_INNATE_LENS,
  POLICY_DEFAULTS,
  DOCUMENTED_SSOT_GAPS,
  COMBINE_RELATION_TYPES,
  TENSION_RELATION_TYPES,
} from "./constants";
export type {
  PersonalContextGroupId,
  PersonalLensId,
  PersonalRoleInLens,
  PersonalSignalTier,
} from "./constants";

export type {
  PersonalContextAggregates,
  PersonalContextEngineInput,
  PersonalContextEngineOutput,
  PersonalContextExclusion,
  PersonalContextPacket,
  PersonalContextProvenance,
  ResolvedBaseMeaning,
  UnresolvedReference,
} from "./types";

export { runPersonalContextEngine } from "./runPersonalContextEngine";
export { assertPersonalContextPurity } from "./purity";
export {
  selectPersonalInnateCandidates,
  aggregateTenGodStemCounts,
} from "./selectPersonalInnate";
export type { CandidateFact } from "./selectPersonalInnate";

export {
  adaptPersonalContextForSlim,
  SLIM_INSERTION_POINTS,
  SLIM_PERSONAL_CONTEXT_ADAPTER_VERSION,
} from "./adaptPersonalContextForSlim";
export type { SlimPersonalContextPackage } from "./adaptPersonalContextForSlim";

export { buildPersonalCeFixtureChart, PERSONAL_CE_FIXTURE_SPECS } from "./fixtures";
export type { PersonalCeFixtureId } from "./fixtures";
