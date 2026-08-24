/**
 * Family(가족) Premium → 렌더링 전용 ViewModel 타입. work·friend·marriage
 * 도메인과 동일한 패턴 — DB·캐시 output schema는 안 바꾼다.
 * `FamilyParentReportBody`(buildFamilyParentReport.ts)가 유일한 저장
 * SSOT이고, 여기 정의된 shape는 buildFamilyReportViewModel()이 렌더링
 * 직전에 파생시키는 비영속(non-persisted) 값이다.
 *
 * Part1(관계 입체 진단)은 `RelationshipIndexSection`으로 partNumber:2(스코어링
 * 그룹)에 편입 — 마스터 사양서의 Part 번호와 이 파일의 partNumber는 1:1이
 * 아니다(누적 개발 순서를 따름, family_role도 스펙 Part3이지만 partNumber:3
 * 그룹인 것과 동일한 사정).
 *
 * family는 friend/marriage와 달리 대칭 페어(A/B)가 아니라 비대칭
 * 부모-자녀 관계라, `PersonSlot<T>`(me/partner) 대신 항상 고정된
 * parent/child 순서로 표현한다 — viewer 토글 없음(기존
 * FamilyParentReportView.tsx도 동일하게 고정 순서로 렌더링해 왔음).
 */
import type { TriScoreSnapshotPanel as TriScoreSnapshotPanelData } from "@/lib/relationship/triScoreSnapshot/types";
import type { PsychMatchAxisResult } from "@/lib/relationship/psychMatch";
import type { DomainPsychHighlight } from "@/lib/relationship/psychDomainLens/types";
import type { FamilyCompareRow } from "@/lib/relationship/familyParent/familySajuCompareTable";
import type { ChildDeEscalationCard } from "@/lib/relationship/familyParent/childDeEscalationPrescriptions";
import type { PairPrescriptionItem } from "@/lib/relationship/shared/pairPrescriptionUiTypes";
import type { FamilyParentReportBody } from "@/lib/relationship/familyParent/buildFamilyParentReport";
import type { FamilyPsychRole } from "@/lib/relationship/familyParent/familyPsychRoles";
import type { GeniusArchetype } from "@/lib/relationship/familyParent/familyKillerSections";
import type { FilialFrequencyType } from "@/lib/relationship/familyParent/familyFilialFrequency";
import type { DeepReadViewModel } from "@/lib/relationship/shared/deepReadViewModel";

export type OpeningBlock = {
  headline: string;
  subtitle: string;
  grade: string;
  gradeReason: string;
  names: [string, string];
};

type BaseSection = {
  id: string;
  partNumber: 2 | 3 | 4 | 5;
  title: string;
};

// ---- Part 2: 스코어링 + 비교표 + 11축 매칭 -----------------------------------

export type SnapshotSection = BaseSection & {
  type: "snapshot";
  scores: { bondPct: number; synergyPct: number; riskPct: number };
  panel: TriScoreSnapshotPanelData;
};

export type RelationshipIndexSection = BaseSection & {
  type: "relationship_index";
  frictionIndex: number;
  safeDistanceNote: string;
  decisionAxisNote: string | null;
};

export type CompareTableSection = BaseSection & {
  type: "compare_table";
  rows: FamilyCompareRow[];
};

export type HouseholdRolesSection = BaseSection & {
  type: "household_roles";
  selfName: string;
  partnerName: string;
  selfRoleLabel: string;
  selfRoleDetail: string;
  partnerRoleLabel: string;
  partnerRoleDetail: string;
  complement: string;
  tension: string;
  // Role Intelligence fields
  pairStructureOverview?: string;
  parentNormalLabel?: string;
  parentNormalDesc?: string;
  parentStressLabel?: string;
  parentStressDesc?: string;
  parentMeaning?: string;
  childNormalLabel?: string;
  childNormalDesc?: string;
  childStressLabel?: string;
  childStressDesc?: string;
  childMeaning?: string;
  unexpectedRole?: import("../familyRoleIntelligence").UnexpectedRoleResult;
  roleReversal?: import("../familyRoleIntelligence").RoleReversalResult;
  pairCausalMechanism?: string;
  pairSynergyWhenSmooth?: string;
  roleBurden?: import("../familyRoleIntelligence").RoleBurdenResult;
};

export type PsychRadarSection = BaseSection & {
  type: "psych_radar";
  axisResults: PsychMatchAxisResult[];
  chartNote: string;
  highlights: DomainPsychHighlight[];
};

// ---- Part 3: 자녀 DNA + 성장 터널 --------------------------------------------

export type ChildDnaSection = BaseSection & {
  type: "child_dna";
  geniusTitle: string;
  geniusArchetype: GeniusArchetype;
  communicationStyle: string;
  hiddenSensitivity: string;
  attentionFocusStyle: string;
  hiddenGenius: string;
  praiseTriggerNote?: string | null;
};

export type TalentSection = BaseSection & {
  type: "talent";
  studyType: string;
  studyTypeLabel: string;
  studyTypeNote: string;
  wealthVessel: string;
  wealthVesselLabel: string;
  wealthVesselNote: string;
  inheritedNote: string | null;
};

export type GrowthTunnelSection = BaseSection & {
  type: "growth_tunnel";
  currentChallenge: string;
  focusAreas: string[];
};

export type FamilyRoleSection = BaseSection & {
  type: "family_role";
  childRole: FamilyPsychRole;
  roleLabel: string;
  roleDescription: string;
};

export type FilialFrequencySection = BaseSection & {
  type: "filial_frequency";
  frequencyType: FilialFrequencyType;
  frequencyLabel: string;
  frequencyNote: string;
};

// ---- Part 4: 운명적 케미 + 부모 렌즈 + 미래 보답 ------------------------------

/**
 * meta.family_saju_deep LLM explain overlay — attach-only 이후 처음 렌더.
 * CE 판정을 재분류하지 않는다(explain-only); 원본 스키마는
 * lib/prompts/relationshipPremium/familySajuDeep/outputSchema.ts.
 * family는 viewer 스왑이 없다 — 항상 부모가 첫 슬롯, 자녀가 두 번째 슬롯.
 */
export type DeepReadSection = BaseSection & {
  type: "deep_read";
  vm: DeepReadViewModel;
};

export type DestinySection = BaseSection & {
  type: "destiny";
  harmonyOneLiner: string;
  favoritismWarning: string;
  parentLensSummary: string;
};

export type FilialRewardSection = BaseSection & {
  type: "filial_reward";
  futureReward: string;
  rewardIndex: "high" | "moderate" | "developing";
};

export type SosScriptSection = BaseSection & {
  type: "sos_script";
  triggerLabel: string;
  sosLine: string;
};

// ---- Part 5: 갈등 완화 + 실전 처방 -------------------------------------------

export type DeEscalationSection = BaseSection & {
  type: "de_escalation";
  card: ChildDeEscalationCard;
};

export type PrescriptionSection = BaseSection & {
  type: "prescription";
  introLine: string;
  items: PairPrescriptionItem[];
};

export type ParentDnaSectionView = BaseSection & {
  type: "parent_dna";
  protectionStyle: string;
  anxietyTriggerBehavior: string;
  trustAutonomyStyle: string;
  disciplineStyle: string;
  growthSupportStyle: string;
  shadowSideWarning: string;
};

export type ParentChildBridgeSectionView = BaseSection & {
  type: "parent_child_bridge";
  bestHarmonyPoint: string;
  frictionRiskMoment: string;
  optimalParentPosition: string;
};

export type FamilyReportSection =
  | SnapshotSection
  | RelationshipIndexSection
  | CompareTableSection
  | HouseholdRolesSection
  | PsychRadarSection
  | ChildDnaSection
  | ParentDnaSectionView
  | ParentChildBridgeSectionView
  | TalentSection
  | GrowthTunnelSection
  | FamilyRoleSection
  | FilialFrequencySection
  | DeepReadSection
  | DestinySection
  | FilialRewardSection
  | SosScriptSection
  | DeEscalationSection
  | PrescriptionSection;

import type {
  CanonicalFamilyPairMeanings,
  CanonicalFamilyStoryPlan,
  FamilyClaim,
  FamilyInsightCandidate,
  FamilyActionCandidate,
  FamilySynthesisResult,
} from "@/lib/relationship/familyParent/familyStoryPlanTypes";

export type FamilyEditorialChapterId =
  | "ch_core"
  | "ch_roles"
  | "ch_comm"
  | "ch_conflict"
  | "ch_growth"
  | "ch_repair"
  | "ch_deep"
  | "ch_action";

export type FamilyEditorialChapterViewModel = {
  id: FamilyEditorialChapterId;
  number: string;
  title: string;
  subtitle: string;
  summary?: string;
  claims: FamilyClaim[];
  insights: FamilyInsightCandidate[];
  actions: FamilyActionCandidate[];
  synthesis: FamilySynthesisResult[];
  /** 4 Core Pair Meanings UI Bindings */
  childCoreNeeds?: CanonicalFamilyPairMeanings["childCoreNeeds"];

  /** Reusable legacy section contents attached to this chapter ownership */
  legacySections: FamilyReportSection[];
};

export type FamilyReportViewModel = {
  kind: "family";
  opening: OpeningBlock;
  /** High-level overview cards & 11-axis snapshot */
  snapshot?: SnapshotSection | null;
  relationshipIndex?: RelationshipIndexSection | null;
  psychRadar?: PsychRadarSection | null;
  /** Editorial 8 chapters driven by canonical_projections.story_plan */
  editorialChapters: FamilyEditorialChapterViewModel[];
  /** StoryPlan SSOT payload reference */
  storyPlan?: CanonicalFamilyStoryPlan | null;
  /** Fallback: Legacy flat sections list for backwards compatibility */
  sections: FamilyReportSection[];
  raw: { report: FamilyParentReportBody };
};

