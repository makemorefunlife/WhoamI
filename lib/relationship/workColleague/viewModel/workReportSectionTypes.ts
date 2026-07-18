/**
 * Work Colleague Premium — 렌더링 전용 ViewModel 타입.
 *
 * 이 타입들은 DB·캐시·LLM output schema를 변경하지 않는다. `WorkColleagueReportBody`
 * (lib/relationship/workColleague/buildWorkColleagueReport.ts)가 유일한 저장 SSOT이고,
 * 여기 정의된 shape는 buildWorkReportViewModel()이 렌더링 직전에 파생시키는
 * 비영속(non-persisted) 값이다.
 */
import type { TriScoreSnapshotPanel as TriScoreSnapshotPanelData } from "@/lib/relationship/triScoreSnapshot/types";
import type {
  DeEscalationCard,
  OfficeDnaProfile,
  OfficeIdealRoleFit,
  OfficeUpsetGuide,
} from "@/lib/relationship/workColleague/officeLanguage";
import type { OfficePersonRoleCard } from "@/lib/relationship/workColleague/officeReportTemplate";
import type { PsychMatchAxisResult } from "@/lib/relationship/psychMatch";
import type { DomainPsychHighlight } from "@/lib/relationship/psychDomainLens/types";
import type { PairPrescriptionItem } from "@/lib/relationship/shared/pairPrescriptionUiTypes";
import type { WorkColleagueReportBody } from "@/lib/relationship/workColleague/buildWorkColleagueReport";

/** viewer-first로 이미 정렬된 사람 슬롯 — me/partner 스왑은 어댑터에서 1회만 수행 */
export type PersonSlot<T> = { me: T; partner: T };

export type OpeningBlock = {
  headline: string;
  subtitle: string;
  grade: string;
  gradeReason: string;
  /** [내 이름, 상대 이름] — viewer-first */
  names: [string, string];
};

type BaseSection = {
  /** React key + 앵커(`#pair-prescription-work`류)로도 재사용 가능한 안정 id */
  id: string;
  /** 화면상 1차 배치 위치 힌트. 일부 섹션(warning의 upset 등)은 다른 Part에서도
   *  참조될 수 있으며, 그 조합은 렌더러(Phase 2)의 책임이지 이 타입의 책임이 아니다. */
  partNumber: 1 | 2 | 3 | 4 | 5;
  title: string;
};

export type SnapshotSection = BaseSection & {
  type: "snapshot";
  /** RelationshipReportLayout 상단 🔥🧩⚡ 게이지보드 전용 — TriScoreSnapshotPanel과는 별개 소스 */
  scores: { fitPct: number; synergyPct: number; riskPct: number };
  /** report.snapshot_panel 그대로(가공 없음) — 기존 <TriScoreSnapshotPanel panel=.../> 컴포넌트가 통째로 소비 */
  panel: TriScoreSnapshotPanelData;
};

export type PsychRadarSection = BaseSection & {
  type: "psych_radar";
  /** meta.psych_match.axis_results, viewer 기준으로 이미 swap 완료 */
  axisResults: PsychMatchAxisResult[];
  chartNote: string;
  /** "가장 강한 축 / 차이가 큰 축" 후보 — psych_lens.highlights 그대로 */
  highlights: DomainPsychHighlight[];
};

export type ComparisonSection = BaseSection & {
  type: "comparison";
  dna: PersonSlot<OfficeDnaProfile & { nickname: string }>;
  workStyle: PersonSlot<string>;
  communicationFit: string;
  /** section_respect가 없는 레거시 payload에서는 생략(빈 문자열로 채우지 않음) */
  boundary?: PersonSlot<string>;
};

export type RoleMatrixSection = BaseSection & {
  type: "role_matrix";
  roles: PersonSlot<OfficePersonRoleCard>;
  synergyOneLiner: string;
  /** section_ideal_roles가 없는 레거시 payload에서는 생략 */
  idealFit?: PersonSlot<OfficeIdealRoleFit>;
  togetherCombo?: string;
};

export type RelationshipLoopSection = BaseSection & {
  type: "relationship_loop";
  /** snapshot_panel.narrative.topics 중 isWarning=false 항목을 재배치 — 새 계산 없음 */
  positiveLoop: Array<{ title: string; body: string }>;
  /** isWarning 토픽 + section_warning.conflict_trigger를 재배치 — 새 계산 없음 */
  frictionLoop: Array<{ title: string; body: string }>;
};

export type WarningSection = BaseSection & {
  type: "warning";
  conflictTrigger: string;
  deEscalation: DeEscalationCard;
  /** section_upset이 없는 레거시 payload에서는 생략 */
  upset?: PersonSlot<OfficeUpsetGuide>;
};

export type PrescriptionSection = BaseSection & {
  type: "prescription";
  introLine: string;
  items: PairPrescriptionItem[];
  /** items 중 topic === "office_baseline" — Part5 "주간 10분 체크인" 전용 발췌 */
  weeklyCheckIn?: PairPrescriptionItem;
};

export type WorkReportSection =
  | SnapshotSection
  | PsychRadarSection
  | ComparisonSection
  | RoleMatrixSection
  | RelationshipLoopSection
  | WarningSection
  | PrescriptionSection;

export type WorkReportViewModel = {
  kind: "work";
  opening: OpeningBlock;
  sections: WorkReportSection[];
  /** 하위호환: 과도기에 기존 컴포넌트가 원본 report를 그대로 필요로 할 수 있음 */
  raw: { report: WorkColleagueReportBody };
};
