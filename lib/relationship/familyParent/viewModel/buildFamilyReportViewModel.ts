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
import {
  resolveReportPsychDisplay,
  swapPsychAxisForViewer,
} from "@/lib/relationship/psychDomainLens/resolvePsychDisplay";
import { buildFamilyPsychMatchBundle } from "@/lib/relationship/psychDomainLens/buildFamilyPsychMatch";
import { nameExplicitHighlights } from "@/lib/relationship/psychDomainLens/shared";
import type { FamilyParentReportBody } from "@/lib/relationship/familyParent/buildFamilyParentReport";
import type { FamilyCompareRowId } from "@/lib/relationship/familyParent/familySajuCompareTable";
import type { Locale } from "@/lib/i18n/locale";
import { messagesEnUS } from "@/lib/i18n/messages/en-US";
import { messagesKoKR } from "@/lib/i18n/messages/ko-KR";
import {
  formatFamilyCompareCanonicalLabel,
  readFamilyComparisonTableCanonicalProjection,
} from "@/lib/relationship/familyParent/familyComparisonTableCanonical";
import type {
  OpeningBlock,
  FamilyReportSection,
  FamilyReportViewModel,
  FamilyEditorialChapterViewModel,
} from "./familyReportSectionTypes";
import type { FamilyCompareRow } from "@/lib/relationship/familyParent/familySajuCompareTable";
import { buildDeepReadViewModel } from "@/lib/relationship/shared/deepReadViewModel";

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
  locale: Locale,
  t: ReturnType<typeof catalog>,
): FamilyReportSection | null {
  const allRows = report.family?.section_compare_table;
  if (!allRows?.length) return null;
  const typed = readFamilyComparisonTableCanonicalProjection(report);
  const authorityAll: FamilyCompareRow[] = allRows.map((row) => {
    const typedRow = typed?.[row.id];
    if (!typedRow) return row;
    return {
      ...row,
      personParent: {
        ...row.personParent,
        band: typedRow.band_parent,
        shortLabel: formatFamilyCompareCanonicalLabel(
          row.id,
          typedRow.band_parent,
          locale,
        ),
      },
      personChild: {
        ...row.personChild,
        band: typedRow.band_child,
        shortLabel: formatFamilyCompareCanonicalLabel(
          row.id,
          typedRow.band_child,
          locale,
        ),
      },
    };
  });
  const byId = new Map(authorityAll.map((row) => [row.id, row]));
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
  locale: Locale,
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
    highlights: nameExplicitHighlights(
      psychDisplay.psych_lens.highlights,
      psychDisplay.psych_match.axis_results,
      report.meta.nickname_a,
      report.meta.nickname_b,
      locale
    ),
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
    geniusArchetype: dna.genius_archetype,
    communicationStyle: dna.communication_style,
    hiddenSensitivity: dna.hidden_sensitivity,
    attentionFocusStyle: dna.attention_focus_style,
    hiddenGenius: dna.hidden_genius,
    praiseTriggerNote: dna.praise_trigger_note ?? null,
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

function buildFilialFrequencySection(
  report: FamilyParentReportBody,
  t: ReturnType<typeof catalog>,
): FamilyReportSection | null {
  const f = report.family?.section_filial_frequency;
  if (!f) return null;
  return {
    id: "filial_frequency",
    type: "filial_frequency",
    partNumber: 3,
    title: t.filialFrequencyCardTitle,
    frequencyType: f.frequency_type,
    frequencyLabel: f.frequency_label,
    frequencyNote: f.frequency_note,
  };
}

function buildDeepReadSection(
  report: FamilyParentReportBody,
  t: ReturnType<typeof catalog>,
): FamilyReportSection | null {
  const overlay = report.meta?.family_saju_deep;
  const nature = overlay?.section_2_nature;
  const gap = overlay?.section_4_family_frames?.generation_gap_signal;
  const action = overlay?.section_5_action;

  const vm = buildDeepReadViewModel({
    natureA: nature?.parent_nature ?? nature?.a_nature,
    natureB: nature?.child_nature ?? nature?.b_nature,
    gapSignal: gap
      ? {
          a_body: gap.parent_body ?? gap.a_body,
          b_body: gap.child_body ?? gap.b_body,
          match_note: gap.match_note,
        }
      : undefined,
    adviceA: action?.advice_for_parent ?? action?.advice_for_a,
    adviceB: action?.advice_for_child ?? action?.advice_for_b,
    together: action?.together,
    togetherStarter: action?.together_starter,
    swap: false,
  });
  if (!vm) return null;

  return {
    id: "deep_read",
    type: "deep_read",
    partNumber: 4,
    title: t.deepReadCardTitle,
    vm,
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
  const locale = params.locale ?? "ko-KR";
  const isEn = locale === "en-US";
  const t = catalog(locale);

  const snapshotSec = buildSnapshotSection(report);
  const relationshipIndexSec = buildRelationshipIndexSection(report, t);
  const compareTableSec = buildCompareTableSection(report, locale, t);
  const householdRolesSec = buildHouseholdRolesSection(report, t);
  const psychRadarSec = buildPsychRadarSection(report, t, locale);
  const childDnaSec = buildChildDnaSection(report, t);
  const talentSec = buildTalentSection(report);
  const growthTunnelSec = buildGrowthTunnelSection(report, t);
  const familyRoleSec = buildFamilyRoleSectionView(report, t);
  const filialFrequencySec = buildFilialFrequencySection(report, t);
  const deepReadSec = buildDeepReadSection(report, t);
  const destinySec = buildDestinySection(report, t);
  const filialRewardSec = buildFilialRewardSection(report, t);
  const sosScriptSec = buildSosScriptSection(report);
  const deEscalationSec = buildDeEscalationSection(report, t);
  const prescriptionSec = buildPrescriptionSection(report, t);

  const legacySectionsList: FamilyReportSection[] = [
    snapshotSec,
    relationshipIndexSec,
    compareTableSec,
    householdRolesSec,
    psychRadarSec,
    childDnaSec,
    talentSec,
    growthTunnelSec,
    familyRoleSec,
    filialFrequencySec,
    deepReadSec,
    destinySec,
    filialRewardSec,
    sosScriptSec,
    deEscalationSec,
    prescriptionSec,
  ].filter((s): s is FamilyReportSection => s != null);

  const storyPlan = report.canonical_projections?.story_plan ?? null;

  // Build Editorial 8 Chapters mapping StoryPlan SSOT + Legacy Reusable Content
  const selectedClaims = storyPlan?.selectedClaims ?? [];
  const insightCandidates = storyPlan?.insightCandidates ?? [];
  const actionCandidates = storyPlan?.actionCandidates ?? [];
  const synthesisResults = storyPlan?.synthesisResults ?? [];

  const filterClaims = (topics: string[]) =>
    selectedClaims.filter((c) => topics.includes(c.topic) || topics.some(tp => c.topic.startsWith(tp)));

  const editorialChapters: FamilyEditorialChapterViewModel[] = [
    {
      id: "ch_core",
      number: "01",
      title: isEn ? "01. Essential Temperament" : "01. 본질과 기질 — 아이의 타고난 결",
      subtitle: isEn ? "Natural Identity & Emotional Core" : "아이 본래의 에너지와 감수성 밴드",
      summary: storyPlan?.relationshipCore?.identityLine || report.one_line_family,
      claims: filterClaims(["relationshipCore", "childProfile"]),
      insights: insightCandidates.filter(i => i.topic === "relationshipCore" || i.topic === "childProfile"),
      actions: [],
      synthesis: synthesisResults.filter(s => s.topic === "relationshipCore"),
      legacySections: [childDnaSec].filter((s): s is FamilyReportSection => s != null),
    },
    {
      id: "ch_roles",
      number: "02",
      title: isEn ? "02. Family Roles & Dynamics" : "02. 역할과 구조 — 가정 내 기운과 포지션",
      subtitle: isEn ? "Interpersonal Dynamics & Balance" : "부모와 자녀가 주고받는 역할의 궤적",
      summary: storyPlan?.familyRoles?.psychologicalChildRole
        ? `가정 내 심리적 포지션: ${storyPlan.familyRoles.psychologicalChildRole}`
        : undefined,
      claims: filterClaims(["familyRoles"]),
      insights: insightCandidates.filter(i => i.topic === "familyRoles"),
      actions: [],
      synthesis: synthesisResults.filter(s => s.topic === "familyRoles"),
      dependencyProtection: storyPlan?.pairMeanings?.dependencyProtection,
      legacySections: [householdRolesSec, familyRoleSec].filter((s): s is FamilyReportSection => s != null),
    },
    {
      id: "ch_comm",
      number: "03",
      title: isEn ? "03. Communication & Temperature" : "03. 소통과 반응 — 차이가 만드는 대화 온도",
      subtitle: isEn ? "Differences in Thinking & Expression" : "표현과 수용의 밴드 차이로 발생하는 시널",
      summary: storyPlan?.childProfile?.guidanceMode || undefined,
      claims: filterClaims(["communication", "psych."]),
      insights: insightCandidates.filter(i => i.topic === "communication"),
      actions: [],
      synthesis: synthesisResults.filter(s => s.topic === "communication"),
      loveExpressionVsReception: storyPlan?.pairMeanings?.loveExpressionVsReception,
      legacySections: [psychRadarSec, compareTableSec].filter((s): s is FamilyReportSection => s != null),
    },
    {
      id: "ch_conflict",
      number: "04",
      title: isEn ? "04. Conflict & De-escalation" : "04. 마찰과 경계 — 갈등 루프와 감정 안전거리",
      subtitle: isEn ? "Understanding Friction Triggers" : "부딪히는 순환 고리와 안전한 거리두기",
      summary: storyPlan?.conflict?.safeDistance || undefined,
      claims: filterClaims(["conflict"]),
      insights: insightCandidates.filter(i => i.topic === "conflict"),
      actions: actionCandidates.filter(a => a.type === "de_escalation"),
      synthesis: synthesisResults.filter(s => s.topic === "conflict"),
      conflictLoop: storyPlan?.conflictLoop ?? null,
      legacySections: [deEscalationSec].filter((s): s is FamilyReportSection => s != null),
    },
    {
      id: "ch_growth",
      number: "05",
      title: isEn ? "05. Autonomy & Growth Path" : "05. 자율과 성장 — 적성과 성원의 방향",
      subtitle: isEn ? "Talent Direction & Growth Edge" : "학업·재물 그릇과 올해의 성장 도전",
      summary: storyPlan?.growth?.synergy || undefined,
      claims: filterClaims(["growth"]),
      insights: insightCandidates.filter(i => i.topic === "growth"),
      actions: [],
      synthesis: synthesisResults.filter(s => s.topic === "growth"),
      growthTransition: storyPlan?.growthTransition ?? null,
      expectationVsPressure: storyPlan?.pairMeanings?.expectationVsPressure,
      legacySections: [talentSec, growthTunnelSec].filter((s): s is FamilyReportSection => s != null),
    },
    {
      id: "ch_repair",
      number: "06",
      title: isEn ? "06. Emotional Repair & Connection" : "06. 화해와 표현 — 감정 복원과 마음 주파수",
      subtitle: isEn ? "Restoring Trust & Frequency" : "마음이 풀리는 지점과 관계 회복의 순서",
      summary: undefined,
      claims: filterClaims(["actions", "repair"]),
      insights: insightCandidates.filter(i => i.topic === "actions" || i.topic === "repair"),
      actions: actionCandidates.filter(a => a.type === "sos_script"),
      synthesis: synthesisResults.filter(s => s.topic === "actions" || s.topic === "repair"),
      repairPattern: storyPlan?.repairPattern ?? null,
      legacySections: [filialFrequencySec, sosScriptSec].filter((s): s is FamilyReportSection => s != null),
    },
    {
      id: "ch_deep",
      number: "07",
      title: isEn ? "07. Deep Perspectives" : "07. 깊은 이해 — 부모와 자녀 각각의 시선",
      subtitle: isEn ? "Deep Read & Shared Wisdom" : "서로 다른 입장에서 바라보는 관계의 조화",
      summary: storyPlan?.deepRead?.parentAdvice || undefined,
      claims: filterClaims(["deepRead"]),
      insights: insightCandidates.filter(i => i.topic === "deepRead"),
      actions: [],
      synthesis: synthesisResults.filter(s => s.topic === "deepRead"),
      legacySections: [deepReadSec, destinySec].filter((s): s is FamilyReportSection => s != null),
    },
    {
      id: "ch_action",
      number: "08",
      title: isEn ? "08. Actionable Playbook" : "08. 실천과 단단한 관계 유지 — 오래 이어질 행복 행동 처방전",
      subtitle: isEn ? "Daily Routines & Long-term Bond" : "일상의 스크립트와 앞으로 다가올 보답",
      summary: storyPlan?.actions?.maintenanceRoutine || undefined,
      claims: filterClaims(["action"]),
      insights: [],
      actions: actionCandidates.filter(a => a.type === "routine"),
      synthesis: [],
      childCoreNeeds: storyPlan?.pairMeanings?.childCoreNeeds,
      legacySections: [filialRewardSec, prescriptionSec].filter((s): s is FamilyReportSection => s != null),
    },
  ];

  return {
    kind: "family",
    opening: buildOpening(report),
    snapshot: snapshotSec as Extract<FamilyReportSection, { type: "snapshot" }> | null,
    relationshipIndex: relationshipIndexSec as Extract<FamilyReportSection, { type: "relationship_index" }> | null,
    psychRadar: psychRadarSec as Extract<FamilyReportSection, { type: "psych_radar" }> | null,
    editorialChapters,
    storyPlan,
    sections: legacySectionsList,
    raw: { report },
  };
}

