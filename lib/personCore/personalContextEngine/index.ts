export {
  PERSONAL_CE_VERSION,
  PERSONAL_INNATE_LENS,
} from "./constants";
export type {
  PersonalContextGroupId,
  PersonalLensId,
  PersonalRoleInLens,
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

export {
  adaptPersonalContextForSlim,
  SLIM_INSERTION_POINTS,
  SLIM_PERSONAL_CONTEXT_ADAPTER_VERSION,
} from "./adaptPersonalContextForSlim";
export type { SlimPersonalContextPackage } from "./adaptPersonalContextForSlim";
