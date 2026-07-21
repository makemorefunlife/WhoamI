/**
 * Friend(우정) Premium → 렌더링 전용 ViewModel 타입.
 *
 * work 도메인과 동일한 패턴: DB·캐시·LLM output schema를 변경하지 않는다.
 * `FriendReportBody`(lib/relationship/friend/buildFriendReport.ts)가 유일한
 * 저장 SSOT이고, 여기 정의된 shape는 buildFriendReportViewModel()이 렌더링
 * 직전에 파생시키는 비영속(non-persisted) 값이다.
 */
import type { TriScoreSnapshotPanel as TriScoreSnapshotPanelData } from "@/lib/relationship/triScoreSnapshot/types";
import type { FriendKillerSections } from "@/lib/relationship/friend/friendKillerSections";
import type { PsychMatchAxisResult } from "@/lib/relationship/psychMatch";
import type { DomainPsychHighlight } from "@/lib/relationship/psychDomainLens/types";
import type { PairPrescriptionItem } from "@/lib/relationship/shared/pairPrescriptionUiTypes";
import type { FriendReportBody } from "@/lib/relationship/friend/buildFriendReport";
import type { FriendCompareRow } from "@/lib/relationship/friend/friendSajuCompareTable";

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
};

export type BreakupGuideSection = BaseSection & {
  type: "breakup_guide";
  warnings: PersonSlot<string>;
};

export type DeEscalationSection = BaseSection & {
  type: "de_escalation";
  hashtag: string;
  color: "red" | "yellow" | "orange" | "blue" | "green";
  archetypeLabel: string;
  cheatScript: string;
};

export type PrescriptionSection = BaseSection & {
  type: "prescription";
  introLine: string;
  items: PairPrescriptionItem[];
};

export type FriendReportSection =
  | SnapshotSection
  | PsychRadarSection
  | CompareTableSection
  | SocialDnaSection
  | SoulmateSection
  | PlayMoneySection
  | BreakupGuideSection
  | DeEscalationSection
  | PrescriptionSection;

export type FriendReportViewModel = {
  kind: "friendship";
  opening: OpeningBlock;
  sections: FriendReportSection[];
  raw: { report: FriendReportBody };
};
