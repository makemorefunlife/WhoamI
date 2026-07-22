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
import type { FamilyCompareRowId } from "@/lib/relationship/familyParent/familySajuCompareTable";
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

/** Part2 UI — 핵심 4행만 표시. affection/recovery는 report body에 유지, 렌더만 제외. */
const PART2_COMPARE_TABLE_DISPLAY_IDS: readonly FamilyCompareRowId[] = [
  "correction_style",
  "bond_distance",
  "guidance_balance",
  "home_climate",
];

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

function buildRelationshipIndexSection(
  report: FamilyParentReportBody,
  t: ReturnType<typeof catalog>,
): FamilyReportSection | null {
  const r = report.family?.section_relationship_index;
  if (!r) return null;
  return {
    id: "relationship_index",
    type: "relationship_index",
    partNumber: 2,
    title: r.headline || t.relationshipIndexCardTitle,
    frictionIndex: r.friction_index,
    safeDistanceNote: r.safe_distance_note,
    decisionAxisNote: r.decision_axis_note,
  };
}

function buildCompareTableSection(
  report: FamilyParentReportBody,
  t: ReturnType<typeof catalog>,
): FamilyReportSection | null {
  const allRows = report.family?.section_compare_table;
  if (!allRows?.length) return null;
  const byId = new Map(allRows.map((row) => [row.id, row]));
  const rows = PART2_COMPARE_TABLE_DISPLAY_IDS.map((id) => byId.get(id)).filter(
    (row): row is NonNullable<typeof row> => row != null,
  );
  if (!rows.length) return null;
  return {
    id: "compare_table",
    type: "compare_table",
    partNumber: 2,
    title: t.compareTableCardTitle,
    rows,
  };
}

function buildHouseholdRolesSection(
  report: FamilyParentReportBody,
  t: ReturnType<typeof catalog>,
): FamilyReportSection | null {
  const roles = report.family?.section_household_roles;
  if (!roles) return null;
  return {
    id: "household_roles",
    type: "household_roles",
    partNumber: 2,
    title: t.householdRolesCardTitle,
    selfName: roles.self_name,
    partnerName: roles.partner_name,
    selfRoleLabel: roles.self_role_label,
    selfRoleDetail: roles.self_role_detail,
    partnerRoleLabel: roles.partner_role_label,
    partnerRoleDetail: roles.partner_role_detail,
    complement: roles.complement,
    tension: roles.tension,
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

function buildTalentSection(
  report: FamilyParentReportBody,
): FamilyReportSection | null {
  const s = report.family?.section_talent;
  if (!s) return null;
  return {
    id: "talent",
    type: "talent",
    partNumber: 3,
    title: s.headline,
    studyType: s.study_type,
    studyTypeLabel: s.study_type_label,
    studyTypeNote: s.study_type_note,
    wealthVessel: s.wealth_vessel,
    wealthVesselLabel: s.wealth_vessel_label,
    wealthVesselNote: s.wealth_vessel_note,
    inheritedNote: s.inherited_note,
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

function buildFamilyRoleSectionView(
  report: FamilyParentReportBody,
  t: ReturnType<typeof catalog>,
): FamilyReportSection | null {
  const r = report.family?.section_family_role;
  if (!r) return null;
  return {
    id: "family_role",
    type: "family_role",
    partNumber: 3,
    title: t.familyRoleCardTitle,
    childRole: r.child_role,
    roleLabel: r.role_label,
    roleDescription: r.role_description,
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

function buildSosScriptSection(
  report: FamilyParentReportBody,
): FamilyReportSection | null {
  const s = report.family?.section_sos_script;
  if (!s) return null;
  return {
    id: "sos_script",
    type: "sos_script",
    partNumber: 4,
    title: s.headline,
    triggerLabel: s.trigger_label,
    sosLine: s.sos_line,
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
    () => buildRelationshipIndexSection(report, t),
    () => buildCompareTableSection(report, t),
    () => buildHouseholdRolesSection(report, t),
    () => buildPsychRadarSection(report, t),
    () => buildChildDnaSection(report, t),
    () => buildTalentSection(report),
    () => buildGrowthTunnelSection(report, t),
    () => buildFamilyRoleSectionView(report, t),
    () => buildDestinySection(report, t),
    () => buildFilialRewardSection(report, t),
    () => buildSosScriptSection(report),
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
