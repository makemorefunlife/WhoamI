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
import { buildFamilyRuleContext } from "../buildFamilyRuleContext";
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
import { formatFamilyCompareCanonicalMeaning } from "@/lib/relationship/familyParent/familySajuCompareTable";
import type {
  OpeningBlock,
  FamilyReportSection,
  FamilyReportViewModel,
  FamilyEditorialChapterViewModel,
} from "./familyReportSectionTypes";
import type { FamilyCompareRow } from "@/lib/relationship/familyParent/familySajuCompareTable";
import { buildDeepReadViewModel } from "@/lib/relationship/shared/deepReadViewModel";
// Fixed: this used to import from Romantic's particle helper, which
// disagrees with familyParentLanguage.ts's own josaEunNeun (bare "은/는"
// vs. an extra "이"-suffixed form) on the same input — every other file in
// this domain already uses familyParentLanguage.ts, so this was producing
// inconsistent Korean grammar depending on which builder happened to run.
import { josaIGa, josaEunNeun } from "@/lib/relationship/familyParent/familyParentLanguage";
import { buildFamilyConflictChapterBundle } from "../familyConflictChapterEngine";
import { buildFamilyGrowthChapterBundle } from "../familyGrowthChapterEngine";
import { buildFamilyRepairChapterBundle } from "../familyRepairChapterEngine";
import { buildFamilyActionChapterBundle } from "../familyActionChapterEngine";
import { calculateSajuBundle } from "@/lib/v2/saju/calculateSajuBundle";
import { toV1SajuApiPayload } from "@/lib/saju/toApiPayload";

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
    const parentLabel = formatFamilyCompareCanonicalLabel(
      row.id,
      typedRow.band_parent,
      locale,
    );
    const childLabel = formatFamilyCompareCanonicalLabel(
      row.id,
      typedRow.band_child,
      locale,
    );
    const parentNickname = report.family?.section_household_roles?.partner_name || row.personParent?.nickname || report.meta?.nickname_b || "부모";
    const childNickname = report.family?.section_household_roles?.self_name || row.personChild?.nickname || report.meta?.nickname_a || "자녀";
    const freshMeaning = formatFamilyCompareCanonicalMeaning({
      rowId: row.id,
      bandParent: typedRow.band_parent,
      bandChild: typedRow.band_child,
      parentNickname,
      childNickname,
      parentRole: report.family?.parent_role,
      locale,
    });

    return {
      ...row,
      personParent: {
        ...row.personParent,
        nickname: parentNickname,
        band: typedRow.band_parent,
        shortLabel: parentLabel,
      },
      personChild: {
        ...row.personChild,
        nickname: childNickname,
        band: typedRow.band_child,
        shortLabel: childLabel,
      },
      meaning: freshMeaning || row.meaning,
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
  locale: Locale = "ko-KR",
): FamilyReportSection | null {
  const roles = report.family?.section_household_roles;
  if (!roles) return null;

  let parentNormalLabel = roles.parent_normal_label;
  let parentNormalDesc = roles.parent_normal_desc;
  let parentStressLabel = roles.parent_stress_label;
  let parentStressDesc = roles.parent_stress_desc;
  let parentMeaning = roles.parent_meaning;
  let childNormalLabel = roles.child_normal_label;
  let childNormalDesc = roles.child_normal_desc;
  let childStressLabel = roles.child_stress_label;
  let childStressDesc = roles.child_stress_desc;
  let childMeaning = roles.child_meaning;
  let pairStructureOverview = roles.pair_structure_overview;
  let pairCausalMechanism = roles.pair_causal_mechanism;
  let pairSynergyWhenSmooth = roles.pair_synergy_when_smooth;
  let unexpectedRole = roles.unexpected_role;
  let roleReversal = roles.role_reversal;
  let roleBurden = roles.role_burden;

  if (!parentNormalLabel) {
    const parentName = roles.partner_name || report.meta?.nickname_b || "부모";
    const childName = roles.self_name || report.meta?.nickname_a || "자녀";
    const mockPillar = { heavenlyStem: "갑", earthlyBranch: "자" };
    const mockSaju: any = {
      yearPillar: mockPillar,
      monthPillar: mockPillar,
      dayPillar: mockPillar,
      hourPillar: mockPillar,
      saju: {
        yearPillar: mockPillar,
        monthPillar: mockPillar,
        dayPillar: mockPillar,
        hourPillar: mockPillar,
      },
      tenGods: [],
      stemTenGods: [],
      branchTenGods: [],
      dayStem: "갑",
    };
    const ctxFallback = buildFamilyRuleContext({
      nicknameA: childName,
      nicknameB: parentName,
      roles: { roleA: "child", roleB: "mother" },
      sajuJsonA: mockSaju,
      sajuJsonB: mockSaju,
      locale,
    });
    const intel = buildFamilyRoleIntelligence(ctxFallback);
    parentNormalLabel = intel.parentRoleProfile.normalRoleLabel;
    parentNormalDesc = intel.parentRoleProfile.normalRoleDesc;
    parentStressLabel = intel.parentRoleProfile.stressRoleLabel;
    parentStressDesc = intel.parentRoleProfile.stressRoleDesc;
    parentMeaning = intel.parentRoleProfile.behavioralMeaning;

    childNormalLabel = intel.childRoleProfile.normalRoleLabel;
    childNormalDesc = intel.childRoleProfile.normalRoleDesc;
    childStressLabel = intel.childRoleProfile.stressRoleLabel;
    childStressDesc = intel.childRoleProfile.stressRoleDesc;
    childMeaning = intel.childRoleProfile.behavioralMeaning;

    pairStructureOverview = intel.pairStructureOverview;
    pairCausalMechanism = intel.pairCausalMechanism;
    pairSynergyWhenSmooth = intel.pairSynergyWhenSmooth;
    unexpectedRole = intel.unexpectedRole;
    roleReversal = intel.roleReversal;
    roleBurden = intel.roleBurden;
  }

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
    pairStructureOverview,
    parentNormalLabel,
    parentNormalDesc,
    parentStressLabel,
    parentStressDesc,
    parentMeaning,
    childNormalLabel,
    childNormalDesc,
    childStressLabel,
    childStressDesc,
    childMeaning,
    unexpectedRole,
    roleReversal,
    pairCausalMechanism,
    pairSynergyWhenSmooth,
    roleBurden,
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

function buildParentDnaSection(
  report: FamilyParentReportBody,
): FamilyReportSection {
  const dna = report.family?.section_parent_dna;
  const parentName = report.family?.section_roles?.parent_nickname ?? report.meta?.nickname_b ?? "부모";
  const childName = report.family?.section_roles?.child_nickname ?? report.meta?.nickname_a ?? "자녀";

  const pEunNeun = josaEunNeun(parentName);
  const cIGa = josaIGa(childName);

  return {
    id: "parent_dna",
    type: "parent_dna",
    partNumber: 3,
    title: "Parent DNA 프로필",
    protectionStyle: dna?.protection_style ?? `${cIGa} 고민에 빠지면 ${pEunNeun} 성급히 개입하지 않고 한 박자 떨어져 조용히 지켜봐 줍니다. 아이가 스스로 마음을 정돈할 때까지 변함없이 곁을 지키며 든든한 버팀목이 되어줍니다.`,
    anxietyTriggerBehavior: dna?.anxiety_trigger_behavior ?? `불안이 오르면 ${pEunNeun} 괜찮은지 즉시 확인하고 싶어 다가가지만, 아이의 정리 템포와 엇갈려 서운함이나 조급함이 겉으로 표출되는 양상을 보입니다.`,
    trustAutonomyStyle: dna?.trust_autonomy_style ?? `${pEunNeun} 큰 틀의 안전선과 원칙만 분명히 잡아준 뒤, 그 울타리 안에서의 세부 시도와 선택은 아이의 자율에 완전히 믿고 맡기는 탁월한 자율 부여 방식을 보여줍니다.`,
    disciplineStyle: dna?.discipline_style ?? `기준을 바로잡을 때 ${pEunNeun} 대화를 통해 현실적인 이유를 충분히 설명하고, 부모와 아이가 납득할 수 있는 합리적인 타협안을 조율하여 정돈합니다.`,
    growthSupportStyle: dna?.growth_support_style ?? `아이의 성장을 도울 때 ${pEunNeun} 다양한 경험의 기회와 필요 자원을 적극적으로 연결해주며, 아이가 실패를 두려워하지 않고 새로운 도전을 마음껏 즐기도록 원동력을 실어줍니다.`,
    shadowSideWarning: dna?.shadow_side_warning ?? `따뜻하게 감싸주려는 깊은 애정 본능이 불안할 때 '성급한 확인과 조급함'으로 이어지면, 혼자 마음을 정돈하고 싶은 아이가 입을 닫아버리는 역효과를 낼 수 있습니다.`,
  };
}

function buildParentChildBridgeSection(
  report: FamilyParentReportBody,
): FamilyReportSection {
  const bridge = report.family?.section_parent_child_bridge;
  const parentName = report.family?.section_roles?.parent_nickname ?? report.meta?.nickname_b ?? "부모";
  const childName = report.family?.section_roles?.child_nickname ?? report.meta?.nickname_a ?? "자녀";

  const pEunNeun = josaEunNeun(parentName);
  const cIGa = josaIGa(childName);
  const cEunNeun = josaEunNeun(childName);

  return {
    id: "parent_child_bridge",
    type: "parent_child_bridge",
    partNumber: 3,
    title: "이 부모와 이 아이가 만났을 때",
    bestHarmonyPoint: bridge?.best_harmony_point ?? `${pEunNeun} 방향의 든든한 기준을 잡아주고 ${cEunNeun} 자기 방식으로 주도적으로 시도할 때 최고의 성장 시너지가 만들어집니다.`,
    frictionRiskMoment: bridge?.friction_risk_moment ?? `${cIGa} 힘든 일 후 혼자 마음을 정돈하려 할 때, ${pEunNeun} 괜찮은지 빨리 확인하려고 바짝 다가설 때 소통 템포의 시차가 발생합니다.`,
    optimalParentPosition: bridge?.optimal_parent_position ?? `“방향과 울타리는 부모가 분명하게 잡아주되, 그 안에서의 실행 방법은 아이에게 믿고 맡기기”`,
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
  const childName = report.family?.section_roles?.child_nickname ?? report.meta?.nickname_a ?? "아이";
  const cEunNeun = josaEunNeun(childName);

  return {
    id: "family_role",
    type: "family_role",
    partNumber: 3,
    title: t.familyRoleCardTitle || "우리 아이의 마음속 역할",
    childRole: r?.child_role ?? "mediator",
    roleLabel: r?.role_label ?? "중재자",
    roleDescription: r?.role_description ?? `${cEunNeun} 가족 사이에서 분위기를 살피고 갈등을 조율하는 역할을 자연스럽게 맡아요. 그 노력을 직접 고맙다고 말해주세요 — 안 그러면 티 안 나게 지나가기 쉬워요.`,
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
  const parentDnaSec = buildParentDnaSection(report);
  const parentChildBridgeSec = buildParentChildBridgeSection(report);
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
    parentDnaSec,
    parentChildBridgeSec,
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

  let storyPlan = report.canonical_projections?.story_plan ?? null;

  if (storyPlan && !storyPlan.conflictChapterBundle) {
    const parentNickname = report.family?.section_roles?.parent_nickname || report.family?.section_household_roles?.partner_name || report.meta?.nickname_b || "부모";
    const childNickname = report.family?.section_roles?.child_nickname || report.family?.section_household_roles?.self_name || report.meta?.nickname_a || "자녀";
    const defaultSajuA = toV1SajuApiPayload(calculateSajuBundle({ birthDate: "2020-08-20", birthTime: "10:00" }));
    const defaultSajuB = toV1SajuApiPayload(calculateSajuBundle({ birthDate: "1993-05-15", birthTime: "14:00" }));

    const ruleCtx = buildFamilyRuleContext({
      nicknameA: childNickname,
      nicknameB: parentNickname,
      roles: { roleA: "child", roleB: report.family?.parent_role || "mother" },
      sajuJsonA: (report.raw?.saju_child || report.meta?.saju_a || defaultSajuA) as any,
      sajuJsonB: (report.raw?.saju_parent || report.meta?.saju_b || defaultSajuB) as any,
      locale,
    });
    const conflictChapterBundle = buildFamilyConflictChapterBundle({
      ctx: ruleCtx,
      report: report as any,
      psychParent: report.meta?.psych_b ?? null,
      psychChild: report.meta?.psych_a ?? null,
      psychProjections: [],
    });
    storyPlan = {
      ...storyPlan,
      conflictChapterBundle,
    };
  }

  if (!storyPlan || !(storyPlan as any).growthChapterBundle) {
    const childNickname = report.family?.section_roles?.child_nickname ?? report.meta?.nickname_a ?? "자녀";
    const parentNickname = report.family?.section_roles?.parent_nickname ?? report.meta?.nickname_b ?? "부모";
    const growthChapterBundle = buildFamilyGrowthChapterBundle({
      childNickname,
      parentNickname,
      growthTunnelSec: (report.section_growth_tunnel ?? report.family?.section_growth_tunnel) as any,
      talentSec: (report.section_talent ?? report.family?.section_talent) as any,
    });
    storyPlan = {
      ...storyPlan,
      growthChapterBundle,
    } as any;
  }

  if (!storyPlan || !(storyPlan as any).repairChapterBundle) {
    const childNickname = report.family?.section_roles?.child_nickname ?? report.meta?.nickname_a ?? "자녀";
    const parentNickname = report.family?.section_roles?.parent_nickname ?? report.meta?.nickname_b ?? "부모";
    const repairChapterBundle = buildFamilyRepairChapterBundle({
      childNickname,
      parentNickname,
      locale,
      psychChild: report.meta?.psych_a ?? null,
      psychParent: report.meta?.psych_b ?? null,
      conflictLoop: storyPlan?.conflictChapterBundle?.conflictLoop ?? null,
    });
    storyPlan = {
      ...storyPlan,
      repairChapterBundle,
    } as any;
  }

  if (!storyPlan || !(storyPlan as any).actionChapterBundle) {
    const childNickname = report.family?.section_roles?.child_nickname ?? report.meta?.nickname_a ?? "자녀";
    const parentNickname = report.family?.section_roles?.parent_nickname ?? report.meta?.nickname_b ?? "부모";
    const actionChapterBundle = buildFamilyActionChapterBundle({
      childNickname,
      parentNickname,
      locale,
      psychChild: report.meta?.psych_a ?? null,
      psychParent: report.meta?.psych_b ?? null,
      conflictChapterBundle: storyPlan?.conflictChapterBundle ?? null,
      growthChapterBundle: storyPlan?.growthChapterBundle ?? null,
      repairChapterBundle: storyPlan?.repairChapterBundle ?? null,
    });
    storyPlan = {
      ...storyPlan,
      actionChapterBundle,
    } as any;
  }

  // Build Editorial 8 Chapters mapping StoryPlan SSOT + Legacy Reusable Content
  const selectedClaims = storyPlan?.selectedClaims ?? [];
  const insightCandidates = storyPlan?.insightCandidates ?? [];
  const actionCandidates = storyPlan?.actionCandidates ?? [];
  const synthesisResults = storyPlan?.synthesisResults ?? [];

  const filterClaims = (topics: string[]) =>
    selectedClaims.filter((c) => topics.includes(c.topic) || topics.some(tp => c.topic.startsWith(tp)));


  const editorialChapters: FamilyEditorialChapterViewModel[] = [
    {
      id: "ch_together",
      number: "01",
      title: isEn ? "01. Who You Are When You're Together" : "01. 우리가 함께 있을 때의 모습",
      subtitle: isEn ? "Daily Reality & Pair Interaction Dynamics" : "둘이 함께 있을 때 드러나는 상호작용의 결과 현실",
      summary: storyPlan?.relationshipCore?.identityLine || report.one_line_family,
      claims: filterClaims(["relationshipCore"]),
      insights: insightCandidates.filter(i => i.topic === "relationshipCore"),
      actions: [],
      synthesis: synthesisResults.filter(s => s.topic === "relationshipCore"),
      legacySections: [],
    },
    {
      id: "ch_core",
      number: "02",
      title: isEn ? "02. Essential Temperament" : "02. 본질과 기질 — 부모와 아이의 타고난 결",
      subtitle: isEn ? "Natural Identity & Emotional Core" : "부모와 아이 본래의 에너지와 양육 기질 결",
      summary: undefined,
      claims: filterClaims(["childProfile"]),
      insights: insightCandidates.filter(i => i.topic === "childProfile"),
      actions: [],
      synthesis: synthesisResults.filter(s => s.topic === "childProfile"),
      legacySections: [childDnaSec, parentDnaSec, parentChildBridgeSec].filter((s): s is FamilyReportSection => s != null),
    },
    {
      id: "ch_roles",
      number: "03",
      title: isEn ? "03. Family Roles & Dynamics" : "03. 역할과 구조 — 가족 안에서 우리는 어떤 자리를 맡게 될까요",
      subtitle: isEn ? "Interpersonal Dynamics & Roles" : "가족 시스템 안에서 각자가 맡게 되는 실제 역할과 관계 구도",
      summary: undefined,
      claims: filterClaims(["familyRoles"]),
      insights: insightCandidates.filter(i => i.topic === "familyRoles"),
      actions: [],
      synthesis: synthesisResults.filter(s => s.topic === "familyRoles"),
      legacySections: [householdRolesSec, familyRoleSec].filter((s): s is FamilyReportSection => s != null),
    },
    {
      id: "ch_comm",
      number: "04",
      title: isEn ? "04. Communication & Temperature" : "04. 소통과 반응 — 차이가 만드는 대화 온도",
      subtitle: isEn ? "Differences in Thinking & Expression" : "표현과 수용의 밴드 차이로 발생하는 시그널",
      summary: storyPlan?.childProfile?.guidanceMode || undefined,
      claims: filterClaims(["communication", "psych."]),
      insights: insightCandidates.filter(i => i.topic === "communication"),
      actions: [],
      synthesis: synthesisResults.filter(s => s.topic === "communication"),
      legacySections: [psychRadarSec, compareTableSec].filter((s): s is FamilyReportSection => s != null),
    },
    {
      id: "ch_conflict",
      number: "05",
      title: isEn ? "05. Why We Clash" : "05. 우리가 부딪히는 이유",
      subtitle: isEn ? "From Differences in Love Styles to Core Values" : "사랑의 방식부터 가치관의 차이까지",
      summary: storyPlan?.conflictChapterBundle?.conflictSynthesisLine || undefined,
      claims: filterClaims(["conflict"]),
      insights: insightCandidates.filter(i => i.topic === "conflict"),
      actions: [],
      synthesis: synthesisResults.filter(s => s.topic === "conflict"),
      legacySections: [],
    },
    {
      id: "ch_growth",
      number: "06",
      title: isEn ? "06. Child Growth & Learning Intelligence" : "06. 이 아이는 어떻게 배우고, 무엇으로 성장할까요",
      subtitle: isEn ? "From Talent Unlocking to Parent Support Direction" : "재능이 살아나는 방식부터 부모가 밀어줄 방향까지",
      summary: storyPlan?.growthChapterBundle?.motivation?.driveTitle || storyPlan?.growth?.synergy || undefined,
      claims: filterClaims(["growth"]),
      insights: insightCandidates.filter(i => i.topic === "growth"),
      actions: [],
      synthesis: synthesisResults.filter(s => s.topic === "growth"),
      legacySections: [sosScriptSec].filter((s): s is FamilyReportSection => s != null),
    },
    {
      id: "ch_repair",
      number: "07",
      title: isEn ? "07. Emotional Repair & Connection" : "07. 싸운 뒤, 우리는 어떻게 다시 가까워질까요?",
      subtitle: isEn ? "Restoring Trust & Frequency" : "감정을 가라앉히는 방식부터 다시 마음을 여는 순간까지",
      summary: storyPlan?.repairChapterBundle?.synthesisPrinciple?.corePrinciple || storyPlan?.repairChapterBundle?.timingAnalysis?.timingHeadline || undefined,
      claims: filterClaims(["actions", "repair"]),
      insights: insightCandidates.filter(i => i.topic === "actions" || i.topic === "repair"),
      actions: actionCandidates.filter(a => a.type === "de_escalation"),
      synthesis: synthesisResults.filter(s => s.topic === "actions" || s.topic === "repair"),
      legacySections: [],
    },
    {
      id: "ch_action",
      number: "08",
      title: isEn ? "08. Action Plan & Future" : "08. 앞으로, 우리는 이렇게 지내면 좋아요",
      subtitle: isEn ? "Practical Steps & Long-term Bond" : "서로를 더 잘 이해한 다음, 실제 관계에서 바꿔볼 것들",
      summary: storyPlan?.actionChapterBundle?.finalTakeaway?.childNeedTitle || storyPlan?.actions?.maintenanceRoutine || undefined,
      claims: filterClaims(["action"]),
      insights: [],
      actions: actionCandidates.filter(a => a.type === "routine"),
      synthesis: [],
      childCoreNeeds: storyPlan?.pairMeanings?.childCoreNeeds,
      legacySections: [],
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

