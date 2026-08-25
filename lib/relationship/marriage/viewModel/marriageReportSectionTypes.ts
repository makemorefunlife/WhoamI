/**
 * 부부/동거(Marriage/Cohabitation) Premium → 렌더링 전용 ViewModel 타입.
 *
 * work·friend 도메인과 동일한 패턴: DB·캐시·LLM output schema를 변경하지
 * 않는다. `MarriageReportBody`(lib/relationship/marriage/buildMarriageReport.ts)가
 * 유일한 저장 SSOT이고, 여기 정의된 shape는 buildMarriageReportViewModel()이
 * 렌더링 직전에 파생시키는 비영속(non-persisted) 값이다.
 *
 * Part1(낭만/운명 서사) — `OriginStorySection`(partNumber:1)으로 예고된
 * 단계적 작업이 반영됨(마스터 사양서 Batch 1).
 */
import type { TriScoreSnapshotPanel as TriScoreSnapshotPanelData } from "@/lib/relationship/triScoreSnapshot/types";
import type { PsychMatchAxisResult } from "@/lib/relationship/psychMatch";
import type { DomainPsychHighlight } from "@/lib/relationship/psychDomainLens/types";
import type { MarriageCompareRow } from "@/lib/relationship/marriage/marriageSajuCompareTable";
import type { HomeLifeDnaProfile, HomeUpsetGuide } from "@/lib/relationship/marriage/homeLifeLanguage";
import type { BedroomMatrixSection } from "@/lib/relationship/marriage/bedroomProfile";
import type { SleepFitSection } from "@/lib/relationship/marriage/marriageSleepFitSection";
import type { ThreeYearHomeRiskForecast } from "@/lib/relationship/marriage/marriageHomeRiskForecast";
import type { ConflictCommunicationSection } from "@/lib/relationship/marriage/marriageConflictCommunication";
import type {
  HomeDeEscalationPair,
  ColdWarProtocol,
} from "@/lib/relationship/marriage/homeDeEscalationPrescriptions";
import type { CohabitationPrescriptionItem } from "@/lib/relationship/marriage/cohabitationPrescriptionTypes";
import type { MarriageReportBody } from "@/lib/relationship/marriage/buildMarriageReport";
import type { DeepReadViewModel } from "@/lib/relationship/shared/deepReadViewModel";

export type PersonSlot<T> = { me: T; partner: T };

export type OpeningBlock = {
  headline: string;
  subtitle: string;
  grade: string;
  gradeReason: string;
  names: [string, string];
};

type BaseSection = {
  id: string;
  partNumber: 1 | 2 | 3 | 4 | 5;
  title: string;
};

// ---- Part 1: 우리가 부부가 된 이유 (낭만/운명 서사) --------------------------

export type OriginStorySection = BaseSection & {
  type: "origin_story";
  whyUs: string;
  positiveChangeA: string;
  positiveChangeB: string;
  ch01Bundle?: import("../marriageChapter01Intelligence").MarriageChapter01Bundle;
};

// ---- Part 1.5: 일상 모습 (일간/일지 결정론적 표) ------------------------------

export type DailyLifeMirrorSection = BaseSection & {
  type: "daily_life_mirror";
  vm: import("../marriageDailyLifeMirror").DailyLifeMirrorSection;
};

// ---- Part 2: 스코어링 + 11축 매칭 + 비교표 + 자산관리 ------------------------

export type HouseholdSnapshotSection = BaseSection & {
  type: "household_snapshot";
  scores: { romanticFitPct: number; lifeSynergyPct: number; homeRiskPct: number };
  panel: TriScoreSnapshotPanelData;
};

export type CompareTableSection = BaseSection & {
  type: "compare_table";
  rows: MarriageCompareRow[];
};

export type PsychRadarSection = BaseSection & {
  type: "psych_radar";
  axisResults: PsychMatchAxisResult[];
  chartNote: string;
  highlights: DomainPsychHighlight[];
};

export type MoneyChoresSection = BaseSection & {
  type: "money_chores";
  cfoNickname: string;
  cfoReason: string;
  choresGuideline: string;
  spendingStyleNote: string;
  cfoAxisNote?: string | null;
  /** Typed CE badge from canonical_projections (optional legacy) */
  cfoCanonicalLabel?: string | null;
  /** Invisible mental load enrichment */
  mentalLoadNote?: string | null;
  /** "우리를 위한 맞춤 제안" — CFO/갈등직면성/계획구조화 신호 게이트, 없으면 undefined */
  coupleActionPlan?: import("@/lib/relationship/enrichment/marriageCoupleActionPlan").CoupleActionPlanSection;
};

// ---- Part 3: 침실 케미스트리 + 수면 + 애착 -----------------------------------

export type BedroomSection = BaseSection & {
  type: "bedroom";
  matrix: BedroomMatrixSection;
  attachmentStyle: string;
  sleepFit: SleepFitSection;
  rejectionScriptA: string;
  rejectionScriptB: string;
  rejectionAxisNote?: string | null;
};

// ---- Part 4: 홈라이프 DNA + 육아 + 원가족 + 3년 리스크 ------------------------

export type HomeDnaSection = BaseSection & {
  type: "home_dna";
  dna: PersonSlot<HomeLifeDnaProfile>;
};

export type ParentingSection = BaseSection & {
  type: "parenting";
  combinedAttitude: string;
  personAStyle: string;
  personBStyle: string;
  harmonyTip: string;
  personARoleNote?: string | null;
  personBRoleNote?: string | null;
};

export type FamilyBoundarySection = BaseSection & {
  type: "family_boundary";
  inlawStressSummary: string;
  personABoundaryNote: string;
  personBBoundaryNote: string;
};

export type WeatherForecastSection = BaseSection & {
  type: "weather_forecast";
  forecast: ThreeYearHomeRiskForecast;
};

// ---- Part 5: 부부싸움 해독제 + 실전 처방 -------------------------------------

export type PrivacySection = BaseSection & {
  type: "privacy";
  personAPrivateLine: string;
  personBPrivateLine: string;
};

export type UpsetSection = BaseSection & {
  type: "upset";
  guide: PersonSlot<HomeUpsetGuide>;
};

export type WarningSection = BaseSection & {
  type: "warning";
  conflictCommunication: ConflictCommunicationSection;
  conflictTrigger: string;
  deEscalation: HomeDeEscalationPair;
  coldWarProtocol: ColdWarProtocol;
};

export type PrescriptionSection = BaseSection & {
  type: "prescription";
  introLine: string;
  items: CohabitationPrescriptionItem[];
};

/**
 * meta.married_saju_deep LLM explain overlay — attach-only 이후 처음 렌더.
 * CE 판정을 재분류하지 않는다(explain-only); 원본 스키마는
 * lib/prompts/relationshipPremium/marriedSajuDeep/outputSchema.ts.
 */
export type DeepReadSection = BaseSection & {
  type: "deep_read";
  vm: DeepReadViewModel;
};

export type MarriageReportSection =
  | OriginStorySection
  | DailyLifeMirrorSection
  | HouseholdSnapshotSection
  | CompareTableSection
  | PsychRadarSection
  | MoneyChoresSection
  | DeepReadSection
  | BedroomSection
  | HomeDnaSection
  | ParentingSection
  | FamilyBoundarySection
  | WeatherForecastSection
  | PrivacySection
  | UpsetSection
  | WarningSection
  | PrescriptionSection;

export type MarriageReportViewModel = {
  kind: "cohabitation";
  schemaVersion: "2.0.0";
  opening: OpeningBlock;
  sections: MarriageReportSection[];
  canonicalStoryPlan?: import("../canonicalMarriageStoryPlanTypes").CanonicalMarriageStoryPlan;
  canonicalBundle?: import("../marriageCanonicalTypes").MarriageCanonicalBundle;
  /**
   * [personAName, personBName] in CANONICAL (report_id_a/b) order — NOT
   * viewer-relative like `opening.names`. Canonically-keyed data
   * (conflict4Stage, economicPartnership, and this batch's deep_read merge)
   * should be labeled with these, not `opening.names`, or the label
   * mislabels the data whenever the viewer is report B (see Ch1/Ch9
   * enrichment blocks for the pattern).
   */
  canonicalNames: [string, string];
  conflict4StageView?: import("./marriageUiContracts").MarriageConflict4StageViewModel;
  lifePartnershipVerdictView?: import("./marriageUiContracts").MarriagePartnershipVerdictViewModel;
  /**
   * married_saju_deep explain-only overlay, folded into the canonical
   * 9-chapter presentation (see docs/dev/decisions/028 — LLM must not
   * mutate canonical_projections/CFO/role/compare/scoring; these are
   * additive expert-synthesis enrichments only, never a second authority).
   */
  chapter1ExpertVoice?: import("./marriageUiContracts").MarriageExpertVoiceViewModel;
  chapter3RoleFitInsight?: string;
  chapter8TogetherInsight?: import("./marriageUiContracts").MarriageTogetherInsightViewModel;
  chapter9PersonalizedAdvice?: import("./marriageUiContracts").MarriagePersonalizedAdviceViewModel;
  raw: { report: MarriageReportBody };
};
