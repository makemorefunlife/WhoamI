/**
 * Domain Lenses Root Export
 *
 * Exports 34 Domain Lenses across Partner, Family, Friend, and Cowork.
 * Exports Layer and Ten-God Matrices, Proof Consumer, V1 Migration Inventory,
 * and 7-Scene Domain Story Planners.
 */

export type {
  DomainLensId,
  DomainLensEvaluation,
  LensConfidenceLevel,
  LensTensionLevel,
  LensDirectionalityEvaluation,
  LensSajuEvidenceItem,
  DomainStoryPlannerInput,
} from "./types";

export { TEN_GOD_LENS_MATRIX } from "./tenGodLensMatrix";
export type {
  TenGodCode,
  DomainTenGodExpression,
  TenGodMatrixEntry,
} from "./tenGodLensMatrix";

export {
  FIVE_ELEMENT_DOMAIN_MATRIX,
  INTERACTION_DOMAIN_MATRIX,
} from "./layersLensMatrix";
export type {
  ElementCode,
  DomainElementFlowExpression,
  InteractionDomainTranslation,
} from "./layersLensMatrix";

export { V1_MIGRATION_INVENTORY } from "./v1MigrationInventory";
export type {
  V1MigrationStatus,
  V1AssetMigrationRecord,
} from "./v1MigrationInventory";

export { resolveDomainLenses } from "./resolveDomainLenses";
export { buildDomainStoryPlannerInput } from "./buildDomainStoryPlannerInput";
export {
  buildDomainSectionViewModel,
  buildDomainReportViewModel,
  type DomainReportCardViewModel,
  type DomainSectionViewModel,
} from "./domainLensProofConsumer";

export { evaluatePartnerLenses } from "./partner/partnerLenses";
export { evaluateFamilyLenses } from "./family/familyLenses";
export { evaluateFriendLenses } from "./friend/friendLenses";
export { evaluateWorkLenses } from "./work/workLenses";

export { buildFriendStoryPlan } from "./friend/friendStoryPlanner";
export { buildWorkStoryPlan } from "./work/workStoryPlanner";
export { buildFamilyStoryPlan } from "./family/familyStoryPlanner";
export { buildPartnerStoryPlan } from "./partner/partnerStoryPlanner";
export { buildDomain7SceneStoryPlan } from "./domainStoryPlanner";
export type {
  DomainStoryPlan,
  DomainStoryScene,
  DomainStorySceneNumber,
  StoryBeats,
  StoryBeatRecognitionSlot,
  StoryBeatTranslationSlot,
  StoryBeatReframingSlot,
  StoryBeatActionSlot,
} from "./storyPlannerTypes";

export {
  makeCanonicalPacket,
  buildAbstainedCanonicalPacket,
  type CanonicalMeaningPacket,
  type CanonicalEvaluationStatus,
  type CanonicalSourceMode,
  type CanonicalPacketEvidence,
} from "./canonicalPackets";

export { composeDomain7SceneNarrative } from "./domainNarrativeComposer";
export { composeFriendNarrative } from "./friend/friendNarrativeComposer";
export { composeWorkNarrative } from "./work/workNarrativeComposer";
export { composeFamilyNarrative } from "./family/familyNarrativeComposer";
export { composePartnerNarrative } from "./partner/partnerNarrativeComposer";
export type {
  DomainNarrativePlan,
  DomainNarrativeScene,
  DomainNarrativeOverview,
  DomainNarrativeActionPlaybook,
  NarrativeScriptItem,
} from "./narrativeTypes";

