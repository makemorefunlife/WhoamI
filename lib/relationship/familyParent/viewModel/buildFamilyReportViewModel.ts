/**
 * Family Premium → 렌더링 전용 ViewModel 어댑터. work·friend·marriage와
 * 동일한 패턴 — 순수 함수, 이미 로드된 `FamilyParentReportBody`를
 * `FamilyReportSection[]`로 재구성만 한다. 소스 필드가 없으면 해당 섹션을
 * 생략한다(가짜 데이터로 채우지 않음).
 *
 * Part1(가족 서사)은 아직 콘텐츠가 없어 섹션을 만들지 않는다(marriage와
 * 동일 원칙). Part2~5만 기존 family 섹션을 재배치한다.
 *
 * 카드 타이틀은 en-US/ko-KR 메시지 카탈로그를 직접 재사용한다 — ko-KR 전용
 * 하드코딩 금지 원칙 유지.
 */
import { resolveReportPsychDisplay, swapPsychAxisForViewer } from "@/lib/relationship/psychDomainLens/resolvePsychDisplay";
import { buildFamilyPsychMatchBundle } from "@/lib/relationship/psychDomainLens/buildFamilyPsychMatch";
import type { FamilyParentReportBody } from "@/lib/relationship/familyParent/buildFamilyParentReport";
import type { Locale } from "@/lib/i18n/locale";
import { messagesEnUS } from "@/lib/i18n/messages/en-US";
import { messagesKoKR } from "@/lib/i18n/messages/ko-KR";
import type {
  OpeningBlock,
  FamilyReportSection,
  FamilyReportViewModel,
} from "./familyReportSectionTypes";

export type BuildFamilyReportViewModelParams = {
  locale?: Locale;
};

function catalog(locale: Locale) {
  return (locale === "en-US" ? messagesEnUS : messagesKoKR).relationshipDrilldown.family;
}

function buildOpening(report: FamilyParentReportBody): OpeningBlock {
  const roles = report.family?.section_roles;
  const names: [string, string] = [
    roles?.child_nickname ?? report.meta?.nickname_a ?? "",
    roles?.parent_nickname ?? report.meta?.nickname_b ?? "",
  ];
  return {
    headline: report.headline || report.one_line_family,
    subtitle: report.one_line_family ?? "",
    grade: report.meta?.grade ?? "",
    gradeReason: report.meta?.grade_reason ?? "",
    names,
  };
}

function buildSnapshotSection(
  report: FamilyParentReportBody,
): FamilyReportSection | null {
  const s = report.family?.section_snapshot;
  if (!s) return null;
  return {
    id: "snapshot",
    type: "snapshot",
    partNumber: 2,
    title: "",
    scores: { bondPct: s.bond_pct, synergyPct: s.synergy_pct, riskPct: s.risk_pct },
    panel: report.snapshot_panel,
  };
}

function buildCompareTableSection(
  report: FamilyParentReportBody,
  t: ReturnType<typeof catalog>,
): FamilyReportSection | null {
  const rows = report.family?.section_compare_table;
  if (!rows?.length) return null;
  return {
    id: "compare_table",
    type: "compare_table",
    partNumber: 2,
    title: t.compareTableCardTitle,
    rows,
  };
}

function buildPsychRadarSection(
  report: FamilyParentReportBody,
  t: ReturnType<typeof catalog>,
): FamilyReportSection | null {
  const psychDisplay = resolveReportPsychDisplay(report.meta, buildFamilyPsychMatchBundle);
  if (!psychDisplay) return null;
  return {
    id: "psych_radar",
    type: "psych_radar",
    partNumber: 2,
    title: t.psychRadarCardTitle,
    // family는 viewer 토글이 없는 고정 parent/child 순서라 swap을 항상 false로 둔다.
    axisResults: swapPsychAxisForViewer(psychDisplay.psych_match.axis_results, true),
    chartNote: psychDisplay.psych_lens.chart_note,
    highlights: psychDisplay.psych_lens.highlights,
  };
}

function buildChildDnaSection(
  report: FamilyParentReportBody,
  t: ReturnType<typeof catalog>,
): FamilyReportSection | null {
  const dna = report.family?.section_child_dna;
  if (!dna) return null;
  return {
    id: "child_dna",
    type: "child_dna",
    partNumber: 3,
    title: t.dnaCardTitle,
    geniusTitle: dna.genius_title,
    communicationStyle: dna.communication_style,
    hiddenSensitivity: dna.hidden_sensitivity,
    attentionFocusStyle: dna.attention_focus_style,
    hiddenGenius: dna.hidden_genius,
  };
}

function buildGrowthTunnelSection(
  report: FamilyParentReportBody,
  t: ReturnType<typeof catalog>,
): FamilyReportSection | null {
  const g = report.family?.section_growth_tunnel;
  if (!g) return null;
  return {
    id: "growth_tunnel",
    type: "growth_tunnel",
    partNumber: 3,
    title: t.growthTunnelCardTitle,
    currentChallenge: g.current_challenge,
    focusAreas: g.focus_areas,
  };
}

function buildDestinySection(
  report: FamilyParentReportBody,
  t: ReturnType<typeof catalog>,
): FamilyReportSection | null {
  const d = report.family?.section_destiny;
  if (!d) return null;
  return {
    id: "destiny",
    type: "destiny",
    partNumber: 4,
    title: t.destinyCardTitle,
    harmonyOneLiner: d.harmony_one_liner,
    favoritismWarning: d.favoritism_warning,
    parentLensSummary: report.family?.parent_lens_summary ?? "",
  };
}

function buildFilialRewardSection(
  report: FamilyParentReportBody,
  t: ReturnType<typeof catalog>,
): FamilyReportSection | null {
  const f = report.family?.section_filial_reward;
  if (!f) return null;
  return {
    id: "filial_reward",
    type: "filial_reward",
    partNumber: 4,
    title: t.filialRewardCardTitle,
    futureReward: f.future_reward,
    rewardIndex: f.reward_index,
  };
}

function buildDeEscalationSection(
  report: FamilyParentReportBody,
  t: ReturnType<typeof catalog>,
): FamilyReportSection | null {
  const card = report.family?.section_de_escalation;
  if (!card) return null;
  return {
    id: "de_escalation",
    type: "de_escalation",
    partNumber: 5,
    title: t.deEscalationCardTitle,
    card,
  };
}

function buildPrescriptionSection(
  report: FamilyParentReportBody,
  t: ReturnType<typeof catalog>,
): FamilyReportSection | null {
  const pack = report.meta?.prescription_family;
  if (!pack?.items?.length) return null;
  return {
    id: "prescription",
    type: "prescription",
    partNumber: 5,
    title: t.prescriptionCardTitle,
    introLine: pack.intro_line,
    items: pack.items,
  };
}

export function buildFamilyReportViewModel(
  report: FamilyParentReportBody,
  params: BuildFamilyReportViewModelParams,
): FamilyReportViewModel {
  const t = catalog(params.locale ?? "ko-KR");

  const builders: Array<() => FamilyReportSection | null> = [
    () => buildSnapshotSection(report),
    () => buildCompareTableSection(report, t),
    () => buildPsychRadarSection(report, t),
    () => buildChildDnaSection(report, t),
    () => buildGrowthTunnelSection(report, t),
    () => buildDestinySection(report, t),
    () => buildFilialRewardSection(report, t),
    () => buildDeEscalationSection(report, t),
    () => buildPrescriptionSection(report, t),
  ];

  const sections = builders
    .map((build) => build())
    .filter((section): section is FamilyReportSection => section != null);

  return {
    kind: "family",
    opening: buildOpening(report),
    sections,
    raw: { report },
  };
}
