export {
  PAIR_CE_VERSION,
  PAIR_SHARED_LENS,
  PAIR_POLICY_DEFAULTS,
  BRANCH_TENSION_TYPES,
  BRANCH_BOND_TYPES,
} from "./constants";
export type {
  PairContextGroupId,
  PairRoleInLens,
  PairSignalTier,
  PairFactKind,
} from "./constants";

export type {
  PairContextPacket,
  PairContextEngineInput,
  PairContextEngineOutput,
  PairContextExclusion,
  PairContextAggregates,
  PairContextProvenance,
  DomainPairLensId,
  DomainPairLensOutput,
  PairDirectionality,
  ResolvedBaseMeaning,
  UnresolvedReference,
} from "./types";

export { runPairContextEngine } from "./runPairContextEngine";
export { selectPairSharedCandidates } from "./selectPairShared";
export { assertPairContextPurity } from "./purity";
export {
  applyDomainPairLens,
  applyRomanticPairLens,
  applyFriendPairLens,
  applyFamilyPairLens,
  applyWorkPairLens,
  romanticNonTensionPackets,
} from "./lenses";
export { buildDomainPairLensFromCharts } from "./fromBlueprint";
export { buildPairCeFixtureInput } from "./fixtures";
export type { PairCeFixtureId } from "./fixtures";
