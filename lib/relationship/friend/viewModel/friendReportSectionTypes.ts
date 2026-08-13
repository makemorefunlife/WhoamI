/**
 * Friend(우정) Premium → 렌더링 전용 ViewModel 타입.
 *
 * work 도메인과 동일한 패턴: DB·캐시·LLM output schema를 변경하지 않는다.
 * `FriendReportBody`(lib/relationship/friend/buildFriendReport.ts)가 유일한
 * 저장 SSOT이고, 여기 정의된 shape는 buildFriendReportViewModel()이 렌더링
 * 직전에 파생시키는 비영속(non-persisted) 값이다.
 */
import type { TriScoreSnapshotPanel as TriScoreSnapshotPanelData } from "@/lib/relationship/triScoreSnapshot/types";
import type {
  FriendKillerSections,
  TravelStyleSplit,
  CounselingStyle,
  FriendScoreCardAudit,
} from "@/lib/relationship/friend/friendKillerSections";
import type { PsychMatchAxisResult } from "@/lib/relationship/psychMatch";
import type { DomainPsychHighlight } from "@/lib/relationship/psychDomainLens/types";
import type { PairPrescriptionItem } from "@/lib/relationship/shared/pairPrescriptionUiTypes";
import type { FriendReportBody } from "@/lib/relationship/friend/buildFriendReport";
import type { FriendCompareRow } from "@/lib/relationship/friend/friendSajuCompareTable";
import type { DeepReadViewModel } from "@/lib/relationship/shared/deepReadViewModel";
import type { WhyYouMeUsData } from "@/lib/relationship/shared/whyYouMeUs/whyYouMeUsTypes";

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

export type SnapshotSection = BaseSection & {
  type: "snapshot";
  scores: { connectionPct: number; banterPct: number; riskPct: number };
  panel: TriScoreSnapshotPanelData;
  /** 11축 확인/보정 문구 — psychMaster 없으면(레거시 캐시·설문 미완료) 생략 */
  vibeAxisNotes?: {
    connectionNote: string | null;
    banterNote: string | null;
    riskNote: string | null;
  };
  /** Research gap — when friendship shines */
  shineWhenBest?: string | null;
  /** current_enriched 전용 — shine_when_best의 대칭 짝(이 우정이 힘들어지는 순간) */
  shineWhenLow?: string | null;
  /** current_enriched 전용 — 3대 스코어 카드 감사(measures/why/level_meaning) */
  scoreCardAudit?: FriendScoreCardAudit | null;
};

export type PsychRadarSection = BaseSection & {
  type: "psych_radar";
  axisResults: PsychMatchAxisResult[];
  chartNote: string;
  highlights: DomainPsychHighlight[];
};

export type CompareTableSection = BaseSection & {
  type: "compare_table";
  rows: FriendCompareRow[];
};

export type SocialDnaSection = BaseSection & {
  type: "social_dna";
  dna: PersonSlot<FriendKillerSections["section_social_dna_a"] & { nickname: string }>;
};

export type SoulmateSection = BaseSection & {
  type: "soulmate";
  verdict: string;
};

export type PlayMoneySection = BaseSection & {
  type: "play_money";
  treasurerNickname: string;
  treasurerReason: string;
  optimalHangout: string;
  psychConfirmNote?: string | null;
  /** Typed treasurer badge from canonical_projections (optional legacy) */
  treasurerCanonicalLabel?: string | null;
};

export type HiddenFlowSection = BaseSection & {
  type: "hidden_flow";
  travelStyle: TravelStyleSplit | null;
  counseling: PersonSlot<CounselingStyle | null>;
  travelCanonicalLabel?: string | null;
  /** current_enriched 전용 — 공감 vs 해결 11축 격차 현실 해석 문구 */
  counselingGapNote?: string | null;
};

export type BreakupGuideSection = BaseSection & {
  type: "breakup_guide";
  warnings: PersonSlot<string>;
  jealousyGuard: PersonSlot<string | null>;
};

export type DeEscalationSection = BaseSection & {
  type: "de_escalation";
  hashtag: string;
  color: "red" | "yellow" | "orange" | "blue" | "green";
  archetypeLabel: string;
  cheatScript: string;
  reconciliationScript?: string | null;
  /** current_enriched 전용 — 회복탄력성 11축 격차 현실 해석 문구(화해 속도) */
  recoveryPaceNote?: string | null;
};

export type PrescriptionSection = BaseSection & {
  type: "prescription";
  introLine: string;
  items: PairPrescriptionItem[];
};

/**
 * meta.friend_saju_deep LLM explain overlay — attach-only 이후 처음 렌더.
 * CE 판정을 재분류하지 않는다(explain-only); 원본 스키마는
 * lib/prompts/relationshipPremium/friendSajuDeep/outputSchema.ts.
 */
export type DeepReadSection = BaseSection & {
  type: "deep_read";
  vm: DeepReadViewModel;
};

/**
 * "왜 너일까 / 왜 나일까 / 왜 우리일까" — shared cross-domain chapter
 * (Romantic/Marriage/Friend only). See lib/relationship/friend/buildFriendWhyYouMeUs.ts.
 */
export type WhyYouMeUsSection = BaseSection & {
  type: "why_you_me_us";
  data: WhyYouMeUsData;
};

export type FriendReportSection =
  | SnapshotSection
  | PsychRadarSection
  | CompareTableSection
  | SocialDnaSection
  | SoulmateSection
  | PlayMoneySection
  | HiddenFlowSection
  | DeepReadSection
  | WhyYouMeUsSection
  | BreakupGuideSection
  | DeEscalationSection
  | PrescriptionSection;

export type FriendChapterViewModel = {
  chapterKey: string;
  chapterNumber: number;
  title: string;
  userQuestion: string;
  narrativeGoal: string;
  narrativeText?: string | null;
  discrepancyNote?: string | null;
  v1Assets?: {
    whyYouMeUs?: WhyYouMeUsData | null;
    socialDnaMe?: any;
    socialDnaPartner?: any;
    counseling?: any;
    travelStyle?: any;
    deEscalation?: any;
    warnings?: any;
    jealousyGuard?: any;
    soulmateVerdict?: string | null;
    prescriptions?: PairPrescriptionItem[] | null;
    compareTableRows?: FriendCompareRow[] | null;
  };
  coverageCards?: {
    initiativeRole?: {
      contactInitiator: string;
      planningLead: string;
      reconnectionLead: string;
      headline: string;
    } | null;
    thirdPersonExclusion?: {
      category: string;
      allowedClaim: string;
      forbiddenClaim: string;
      headline: string;
    } | null;
    travelPlayRole?: {
      ideaCreator: string;
      practicalExecutor: string;
      energyPace: string;
      headline: string;
    } | null;
    distanceProfile?: {
      category: string;
      label: string;
      headline: string;
    } | null;
  };
};

export type FriendReportViewModel = {
  kind: "friendship";
  opening: OpeningBlock;
  sections: FriendReportSection[];
  chapters?: FriendChapterViewModel[];
  storyPlan?: import("../storyPlan/friendStoryPlanTypes").CanonicalFriendStoryPlan;
  raw: { report: FriendReportBody };
};
