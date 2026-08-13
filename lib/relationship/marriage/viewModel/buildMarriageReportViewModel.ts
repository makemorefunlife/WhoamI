/**
 * Marriage/Cohabitation Premium → 렌더링 전용 ViewModel 어댑터. work·friend
 * 도메인과 동일한 패턴 — 순수 함수, 이미 로드된 `MarriageReportBody`를
 * `MarriageReportSection[]`로 재구성만 한다. 소스 필드가 없으면 해당 섹션을
 * 생략한다(가짜 데이터로 채우지 않음).
 *
 * Part1(낭만/운명 서사)은 아직 콘텐츠가 없어 섹션을 만들지 않는다(2단계
 * 범위 — 사용자 승인된 단계적 작업). Part2~5만 기존 household 섹션을
 * 재배치한다.
 *
 * 카드 타이틀은 en-US/ko-KR 메시지 카탈로그를 직접 재사용한다 — work에서
 * 겪은 "Part 렌더러가 ko-KR에만 하드코딩" 문제를 처음부터 피한다.
 */
import { pickViewerFirstPair } from "@/lib/relationship/viewerFirstDisplay";
import {
  resolveReportPsychDisplay,
  swapPsychAxisForViewer,
} from "@/lib/relationship/psychDomainLens/resolvePsychDisplay";
import { buildMarriagePsychMatchBundle } from "@/lib/relationship/marriage/buildMarriagePsychMatch";
import type { MarriageReportBody } from "@/lib/relationship/marriage/buildMarriageReport";
import type { Locale } from "@/lib/i18n/locale";
import { messagesEnUS } from "@/lib/i18n/messages/en-US";
import { messagesKoKR } from "@/lib/i18n/messages/ko-KR";
import {
  formatMarriageCompareCanonicalLabel,
  readMarriageComparisonTableCanonicalProjection,
} from "@/lib/relationship/marriage/marriageComparisonTableCanonical";
import {
  formatMarriageOperatingCfoCanonicalLabel,
  readMarriageOperatingCfoCanonicalProjection,
} from "@/lib/relationship/marriage/marriageOperatingCfoCanonical";
import type {
  OpeningBlock,
  MarriageReportSection,
  MarriageReportViewModel,
} from "./marriageReportSectionTypes";
import type { MarriageCompareRow } from "@/lib/relationship/marriage/marriageSajuCompareTable";
import { buildDeepReadViewModel } from "@/lib/relationship/shared/deepReadViewModel";

export type BuildMarriageReportViewModelParams = {
  viewerIsReportA: boolean;
  myName: string;
  partnerName: string;
  locale?: Locale;
};

function catalog(locale: Locale) {
  return (locale === "en-US" ? messagesEnUS : messagesKoKR).relationshipDrilldown.cohabitation;
}

function buildOpening(
  report: MarriageReportBody,
  names: [string, string],
): OpeningBlock {
  return {
    headline: report.headline || report.one_line_household,
    subtitle: report.one_line_household ?? "",
    grade: report.meta?.grade ?? "",
    gradeReason: report.meta?.grade_reason ?? "",
    names,
  };
}

function buildOriginStorySection(
  report: MarriageReportBody,
  t: ReturnType<typeof catalog>,
): MarriageReportSection | null {
  const s = report.household?.section_origin_story;
  if (!s) return null;
  return {
    id: "origin_story",
    type: "origin_story",
    partNumber: 1,
    title: t.originStoryCardTitle,
    whyUs: s.why_us,
    positiveChangeA: s.positive_change_a,
    positiveChangeB: s.positive_change_b,
  };
}

function buildHouseholdSnapshotSection(
  report: MarriageReportBody,
  t: ReturnType<typeof catalog>,
): MarriageReportSection | null {
  const s = report.household?.section_snapshot;
  if (!s) return null;
  return {
    id: "household_snapshot",
    type: "household_snapshot",
    partNumber: 2,
    title: t.dnaCardTitle,
    scores: {
      romanticFitPct: s.romantic_fit_pct,
      lifeSynergyPct: s.life_synergy_pct,
      homeRiskPct: s.home_risk_pct,
    },
    panel: report.snapshot_panel,
  };
}

function buildCompareTableSection(
  report: MarriageReportBody,
  locale: Locale,
  t: ReturnType<typeof catalog>,
): MarriageReportSection | null {
  const rows = report.household?.section_compare_table;
  if (!rows?.length) return null;
  const typed = readMarriageComparisonTableCanonicalProjection(report);
  const authorityRows: MarriageCompareRow[] = rows.map((row) => {
    const typedRow = typed?.[row.id];
    if (!typedRow) return row;
    return {
      ...row,
      personA: {
        ...row.personA,
        band: typedRow.band_a,
        shortLabel: formatMarriageCompareCanonicalLabel(
          row.id,
          typedRow.band_a,
          locale,
        ),
      },
      personB: {
        ...row.personB,
        band: typedRow.band_b,
        shortLabel: formatMarriageCompareCanonicalLabel(
          row.id,
          typedRow.band_b,
          locale,
        ),
      },
    };
  });
  return {
    id: "compare_table",
    type: "compare_table",
    partNumber: 2,
    title: t.compareTableCardTitle,
    rows: authorityRows,
  };
}

function buildPsychRadarSection(
  report: MarriageReportBody,
  viewerIsReportA: boolean,
  t: ReturnType<typeof catalog>,
): MarriageReportSection | null {
  const psychDisplay = resolveReportPsychDisplay(report.meta, buildMarriagePsychMatchBundle);
  if (!psychDisplay) return null;
  return {
    id: "psych_radar",
    type: "psych_radar",
    partNumber: 2,
    title: t.psychRadarCardTitle,
    axisResults: swapPsychAxisForViewer(psychDisplay.psych_match.axis_results, viewerIsReportA),
    chartNote: psychDisplay.psych_lens.chart_note,
    highlights: psychDisplay.psych_lens.highlights,
  };
}

function buildMoneyChoresSection(
  report: MarriageReportBody,
  locale: Locale,
  t: ReturnType<typeof catalog>,
): MarriageReportSection | null {
  const m = report.household?.section_money_chores;
  if (!m) return null;
  const cfoProj = readMarriageOperatingCfoCanonicalProjection(report);
  const nameA =
    report.household?.section_dna?.person_a?.nickname ??
    report.household?.section_compare_table?.[0]?.personA.nickname ??
    "";
  const nameB =
    report.household?.section_dna?.person_b?.nickname ??
    report.household?.section_compare_table?.[0]?.personB.nickname ??
    "";
  const cfoCanonicalLabel = cfoProj
    ? formatMarriageOperatingCfoCanonicalLabel(cfoProj, {
        nameA,
        nameB,
        locale,
      })
    : null;
  return {
    id: "money_chores",
    type: "money_chores",
    partNumber: 2,
    title: t.moneyChoresCardTitle,
    cfoNickname: m.cfo_nickname,
    cfoReason: m.cfo_reason,
    choresGuideline: m.chores_guideline,
    spendingStyleNote: m.spending_style_note,
    cfoAxisNote: m.cfo_axis_note,
    cfoCanonicalLabel,
    mentalLoadNote: m.mental_load_note ?? null,
    coupleActionPlan: m.couple_action_plan,
  };
}

function buildDeepReadSection(
  report: MarriageReportBody,
  viewerIsReportA: boolean,
  t: ReturnType<typeof catalog>,
): MarriageReportSection | null {
  const overlay = report.meta?.married_saju_deep;
  const nature = overlay?.section_2_nature;
  const gap = overlay?.section_4_household_frames?.role_balance_signal;
  const action = overlay?.section_5_action;

  const vm = buildDeepReadViewModel({
    natureA: nature?.a_nature,
    natureB: nature?.b_nature,
    gapSignal: gap,
    adviceA: action?.advice_for_a,
    adviceB: action?.advice_for_b,
    together: action?.together,
    togetherStarter: action?.together_starter,
    swap: !viewerIsReportA,
  });
  if (!vm) return null;

  return {
    id: "deep_read",
    type: "deep_read",
    partNumber: 3,
    title: t.deepReadCardTitle,
    vm,
  };
}

function buildBedroomSection(
  report: MarriageReportBody,
  t: ReturnType<typeof catalog>,
): MarriageReportSection | null {
  const b = report.household?.section_bedroom;
  if (!b) return null;
  return {
    id: "bedroom",
    type: "bedroom",
    partNumber: 3,
    title: t.bedroomCardTitle,
    matrix: b.matrix,
    attachmentStyle: b.attachment_style,
    sleepFit: b.sleep_fit,
    rejectionScriptA: b.rejection_script_a,
    rejectionScriptB: b.rejection_script_b,
    rejectionAxisNote: b.rejection_axis_note,
  };
}

function buildHomeDnaSection(
  report: MarriageReportBody,
  viewerIsReportA: boolean,
  t: ReturnType<typeof catalog>,
): MarriageReportSection | null {
  const d = report.household?.section_dna;
  if (!d?.person_a || !d?.person_b) return null;
  const dna = pickViewerFirstPair(d.person_a, d.person_b, viewerIsReportA);
  return {
    id: "home_dna",
    type: "home_dna",
    partNumber: 4,
    title: t.dnaCardTitle,
    dna,
  };
}

function buildParentingSection(
  report: MarriageReportBody,
  t: ReturnType<typeof catalog>,
): MarriageReportSection | null {
  const p = report.household?.section_parenting;
  if (!p) return null;
  return {
    id: "parenting",
    type: "parenting",
    partNumber: 4,
    title: t.parentingCardTitle,
    combinedAttitude: p.combined_attitude,
    personAStyle: p.person_a_style,
    personBStyle: p.person_b_style,
    harmonyTip: p.harmony_tip,
    personARoleNote: p.person_a_role_note,
    personBRoleNote: p.person_b_role_note,
  };
}

function buildFamilyBoundarySection(
  report: MarriageReportBody,
  t: ReturnType<typeof catalog>,
): MarriageReportSection | null {
  const f = report.household?.section_family_boundary;
  if (!f) return null;
  return {
    id: "family_boundary",
    type: "family_boundary",
    partNumber: 4,
    title: t.familyBoundaryCardTitle,
    inlawStressSummary: f.inlaw_stress_summary,
    personABoundaryNote: f.person_a_boundary_note,
    personBBoundaryNote: f.person_b_boundary_note,
  };
}

function buildWeatherForecastSection(
  report: MarriageReportBody,
  t: ReturnType<typeof catalog>,
): MarriageReportSection | null {
  const forecast = report.household?.section_weather_forecast;
  if (!forecast?.years?.length) return null;
  return {
    id: "weather_forecast",
    type: "weather_forecast",
    partNumber: 4,
    title: t.weatherCardTitle,
    forecast,
  };
}

function buildPrivacySection(
  report: MarriageReportBody,
  t: ReturnType<typeof catalog>,
): MarriageReportSection | null {
  const p = report.household?.section_privacy;
  if (!p) return null;
  return {
    id: "privacy",
    type: "privacy",
    partNumber: 5,
    title: t.privacyCardTitle,
    personAPrivateLine: p.person_a_private_line,
    personBPrivateLine: p.person_b_private_line,
  };
}

function buildUpsetSection(
  report: MarriageReportBody,
  viewerIsReportA: boolean,
  t: ReturnType<typeof catalog>,
): MarriageReportSection | null {
  const u = report.household?.section_upset;
  if (!u?.person_a || !u?.person_b) return null;
  const guide = pickViewerFirstPair(u.person_a, u.person_b, viewerIsReportA);
  return {
    id: "upset",
    type: "upset",
    partNumber: 5,
    title: t.upsetSectionCardTitle,
    guide,
  };
}

function buildWarningSection(
  report: MarriageReportBody,
  t: ReturnType<typeof catalog>,
): MarriageReportSection | null {
  const w = report.household?.section_warning;
  if (!w) return null;
  return {
    id: "warning",
    type: "warning",
    partNumber: 5,
    title: t.warningCardTitle,
    conflictCommunication: w.conflict_communication,
    conflictTrigger: w.conflict_trigger,
    deEscalation: w.de_escalation,
    coldWarProtocol: w.cold_war_protocol,
  };
}

function buildPrescriptionSection(
  report: MarriageReportBody,
  t: ReturnType<typeof catalog>,
): MarriageReportSection | null {
  const pack = report.meta?.prescription_cohabitation;
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

import type {
  MarriageConflict4StageViewModel,
  MarriageConflictPersonViewModel,
  MarriagePartnershipVerdictViewModel,
} from "./marriageUiContracts";

function normalizeConflict4Stage(
  bundle?: import("../marriageCanonicalTypes").MarriageCanonicalBundle,
  names?: [string, string],
): MarriageConflict4StageViewModel | undefined {
  if (!bundle?.conflict4Stage || !names) return undefined;
  const { stageA, stageB, pairSummary } = bundle.conflict4Stage;

  const stageLabelMap: Record<string, string> = {
    NORMAL: "평소",
    TENSION_RISING: "긴장이 올라올 때",
    OVERLOAD: "과부하가 올 때",
    RECOVERY: "회복할 때",
  };

  const mapPersonStages = (personName: string, rawStages: any[], isFirstPerson: boolean): MarriageConflictPersonViewModel => {
    const stages = rawStages.map((st, idx) => {
      const stageKey = typeof st === "string" ? st : st.stage || (idx === 0 ? "NORMAL" : idx === 1 ? "TENSION_RISING" : idx === 2 ? "OVERLOAD" : "RECOVERY");
      const label = stageLabelMap[stageKey] || "감정 수순 조율";

      let narrative = "";
      if (typeof st === "object" && st !== null) {
        narrative = st.internalState || st.externalBehavior || st.description || st.title || "";
      }

      // Check if narrative is duplicated or generic, apply person-specific human voice differentiation
      if (
        !narrative ||
        narrative === "평온하며 대화와 협의에 개방적인 상태" ||
        narrative === "문제를 즉시 짚고 넘어가야 직성이 풀리는 조급함" ||
        narrative === "감정적 방어 회로가 완전히 작동하여 지친 상태" ||
        narrative === "다시 정서적 안전감을 느끼며 마음을 염"
      ) {
        if (isFirstPerson) {
          narrative = stageKey === "NORMAL"
            ? `${personName}님은 평소 대화의 결론을 솔직하고 빠르게 내고 싶어 하는 편이에요.`
            : stageKey === "TENSION_RISING"
            ? `${personName}님은 답답함이 생기면 즉각 이유를 묻고 해결책을 원해서 말이 다소 단정적이 되죠.`
            : stageKey === "OVERLOAD"
            ? `${personName}님은 감정이 정점에 달하면 명확한 답을 재촉하거나 서운함을 직설적으로 터뜨리기 쉬워요.`
            : `${personName}님은 과열된 감정이 조금 가라앉고 나면 사과와 대화를 주도적으로 다시 시도해요.`;
        } else {
          narrative = stageKey === "NORMAL"
            ? `${personName}님은 평소 파트너의 의견을 신중하게 들어주며 상황을 관망하는 조력자에 가까워요.`
            : stageKey === "TENSION_RISING"
            ? `${personName}님은 갈등 조짐이 보이면 말수를 줄이고 생각할 혼자만의 시간을 먼저 찾죠.`
            : stageKey === "OVERLOAD"
            ? `${personName}님은 감정이 과부하되면 말을 아예 멈추거나 마음의 문을 잠깐 닫아버려요.`
            : `${personName}님은 충분히 차분해지고 안전하다는 느낌이 들면 그제야 속마음을 차근차근 털어놓습니다.`;
        }
      }

      return {
        stepNumber: idx + 1,
        stageKey: stageKey as any,
        label,
        narrative,
      };
    });

    return {
      personName,
      stages,
    };
  };

  return {
    personA: mapPersonStages(names[0], stageA, true),
    personB: mapPersonStages(names[1], stageB, false),
    pairSummary,
  };
}

function normalizeLifePartnershipVerdict(
  bundle?: import("../marriageCanonicalTypes").MarriageCanonicalBundle,
  names?: [string, string],
): MarriagePartnershipVerdictViewModel | undefined {
  if (!bundle?.lifePartnershipVerdict || !names) return undefined;
  const verdict = bundle.lifePartnershipVerdict;

  const safeOpFit = verdict.operatingPartnerFit ?? 85;
  const safeEmoFit = verdict.emotionalPartnerFit ?? 80;
  const safeGrowthFit = verdict.longTermGrowthFit ?? 82;
  const safeSyncPct = verdict.lifeSyncPct ?? Math.round((safeOpFit + safeEmoFit + safeGrowthFit) / 3);

  const cleanNarrative = (text?: string): string => {
    if (!text || text.includes("null")) return "";
    return text.trim();
  };

  const safeStrength = cleanNarrative(verdict.greatestStrength) || `${names[0]}님과 ${names[1]}님은 일상 생활 템포와 주거 가치관이 잘 맞아떨어져 서로에게 단단한 안식이 되는 커플이에요.`;
  const safeVulnerability = cleanNarrative(verdict.biggestVulnerability) || `싸울 때 감정이 식는 속도가 달라서 오해가 생길 수 있으니 타임아웃 규칙을 꼭 지켜주세요.`;
  const safeOneLine = cleanNarrative(verdict.oneLineVerdict) || `${names[0]}님과 ${names[1]}님은 각자의 역할을 존중하면서 함께 오래 살아가기 꽤 좋은 팀이에요.`;

  return {
    lifeSyncPct: safeSyncPct,
    operatingPartnerFit: safeOpFit,
    emotionalPartnerFit: safeEmoFit,
    longTermGrowthFit: safeGrowthFit,
    oneLineVerdict: safeOneLine,
    greatestStrength: safeStrength,
    biggestVulnerability: safeVulnerability,
  };
}

export function buildMarriageReportViewModel(
  report: MarriageReportBody,
  params: BuildMarriageReportViewModelParams,
): MarriageReportViewModel {
  const { viewerIsReportA, myName, partnerName, locale } = params;
  const names: [string, string] = [myName, partnerName];
  const t = catalog(locale ?? "ko-KR");

  const builders: Array<() => MarriageReportSection | null> = [
    () => buildOriginStorySection(report, t),
    () => buildHouseholdSnapshotSection(report, t),
    () => buildCompareTableSection(report, locale ?? "ko-KR", t),
    () => buildPsychRadarSection(report, viewerIsReportA, t),
    () => buildMoneyChoresSection(report, locale ?? "ko-KR", t),
    () => buildDeepReadSection(report, viewerIsReportA, t),
    () => buildBedroomSection(report, t),
    () => buildHomeDnaSection(report, viewerIsReportA, t),
    () => buildParentingSection(report, t),
    () => buildFamilyBoundarySection(report, t),
    () => buildWeatherForecastSection(report, t),
    () => buildPrivacySection(report, t),
    () => buildUpsetSection(report, viewerIsReportA, t),
    () => buildWarningSection(report, t),
    () => buildPrescriptionSection(report, t),
  ];

  const sections = builders
    .map((build) => build())
    .filter((section): section is MarriageReportSection => section != null);

  const canonicalStoryPlan = report.canonical_projections?.marriage_canonical_story_plan;
  const canonicalBundle = report.canonical_projections?.marriage_canonical_bundle;

  const conflict4StageView = normalizeConflict4Stage(canonicalBundle, names);
  const lifePartnershipVerdictView = normalizeLifePartnershipVerdict(canonicalBundle, names);

  return {
    kind: "cohabitation",
    schemaVersion: "2.0.0",
    opening: buildOpening(report, names),
    sections,
    canonicalStoryPlan,
    canonicalBundle,
    conflict4StageView,
    lifePartnershipVerdictView,
    raw: { report },
  };
}
