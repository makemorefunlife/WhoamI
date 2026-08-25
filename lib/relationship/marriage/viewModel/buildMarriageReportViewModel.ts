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
import { createDefaultMarriageChapter05Intelligence } from "@/lib/relationship/marriage/marriageChapter05Intelligence";
import type {
  OpeningBlock,
  MarriageReportSection,
  MarriageReportViewModel,
} from "./marriageReportSectionTypes";
import type { MarriageCompareRow } from "@/lib/relationship/marriage/marriageSajuCompareTable";
import { buildDeepReadViewModel } from "@/lib/relationship/shared/deepReadViewModel";
import type { MarriedSajuDeepReport } from "@/lib/prompts/relationshipPremium/marriedSajuDeep";

export type BuildMarriageReportViewModelParams = {
  viewerIsReportA: boolean;
  myName: string;
  partnerName: string;
  locale?: Locale;
};

function catalog(locale: Locale) {
  return (locale === "en-US" ? messagesEnUS : messagesKoKR).relationshipDrilldown.cohabitation;
}

function cleanTaxonomyTitle(title: string | undefined, defaultTitle: string): string {
  if (!title) return defaultTitle;
  let cleaned = title;
  cleaned = cleaned.replace(/^[A-Za-z\s&-]+—\s*/g, "");
  cleaned = cleaned.replace(/Balanced & Harmony-First — /g, "");
  cleaned = cleaned.replace(/Harmony-First & Harmony-First — /g, "");
  cleaned = cleaned.replace(/Loyal & Pride — /g, "");
  cleaned = cleaned.replace(/운명적 정서 끌림형 패밀리,\s*/g, "서로의 공간을 깊이 존중하는 부부, ");
  cleaned = cleaned.replace(/설명하기 힘든 케미로 서로를 끌어당긴 하우스/g, "서로의 강점이 조화를 이루는 부부");
  cleaned = cleaned.replace(/패밀리/g, "부부");
  cleaned = cleaned.replace(/하우스/g, "부부");
  cleaned = cleaned.replace(/보완형 안정 커플/g, "서로의 강점이 조화를 이루는 부부");
  return cleaned.trim() || defaultTitle;
}

function buildOpening(
  report: MarriageReportBody,
  names: [string, string],
): OpeningBlock {
  const ch01Bundle = report.canonical_projections?.marriage_canonical_bundle?.chapter01Intelligence;
  const rawHeadline = ch01Bundle?.coupleIdentity?.title
    || ch01Bundle?.heroSynthesis
    || report.headline
    || report.one_line_household
    || `${names[0]}님과 ${names[1]}님의 부부 이야기`;

  const cleanedHeadline = cleanTaxonomyTitle(rawHeadline, `${names[0]}님과 ${names[1]}님의 부부 이야기`);

  return {
    headline: cleanedHeadline,
    subtitle: "",
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
  let ch01Bundle = report.canonical_projections?.marriage_canonical_bundle?.chapter01Intelligence;

  if (!ch01Bundle && (s || report.household?.section_dna)) {
    const nameA = report.household?.section_dna?.person_a?.nickname ?? "A";
    const nameB = report.household?.section_dna?.person_b?.nickname ?? "B";
    const defaultTitle = "밖에서는 각자 버티고, 서로에게 돌아와 힘을 내려놓는 부부";
    const heroSynthesis = `${nameA}님은 명확한 방향성과 결단력으로 삶의 중심을 잡고, ${nameB}님은 다정한 포용력으로 마음의 안식을 보태어, 밖에서의 중압감을 내려놓고 함께 성장하는 부부 동력을 완성합니다.`;

    ch01Bundle = {
      heroSynthesis,
      attraction: {
        drivers: [
          {
            category: "stimulating_magnetic",
            categoryLabel: "선명하고 강렬하게 이끄는 자극",
            headline: "처음 만날 때부터 느껴진 특별한 기류",
            whatDrawsA: `${nameA}님은 ${nameB}님의 차분한 수용력과 다정함이 자신의 무거운 긴장을 풀어줄 것이라는 안도감에 이끌리기 쉬웠습니다.`,
            whatDrawsB: `${nameB}님은 ${nameA}님이 지닌 묵직한 원칙과 주도적 결단력이 세상을 함께 헤쳐갈 힘이 될 것이라는 신뢰에 끌리기 쉬웠습니다.`,
            description: s?.why_us || `${nameA}님과 ${nameB}님이 처음 만났을 때 느껴진 정서적 이끌림입니다.`,
            confidence: "HIGH",
          },
        ],
        pairSynthesis: `${nameA}님에게는 ${nameB}님의 부부적 다정함이 긴장을 덜어주는 매력으로, ${nameB}님에게는 ${nameA}님의 명확한 주도성이 믿고 함께 움직일 수 있는 이끌림으로 다가오는 조합입니다.`,
        confidence: "HIGH",
      },
      mutualNeed: {
        needAtoB: {
          seekerName: nameA,
          partnerName: nameB,
          innateNeedLabel: "독립된 자율성과 안식",
          partnerExpectationLabel: "자립적이고 든든한 파트너",
          whySeekerHasNeed: `${nameA}님은 내가 다 결정하고 챙기려다 보니 마음의 긴장이 쌓일 때가 많아요. 그래서 가까운 사람 앞에서는 내가 다 주도하지 않아도 마음 편히 쉴 수 있는 여유가 꼭 필요해요.`,
          partnerTraitMeetingIt: `${nameB}님은 내 방식을 억지로 바꾸려 하지 않고, 내 기분과 상황을 다정하게 받아주는 넉넉한 마음이 있어요.`,
          howItFeelsInMarriage: `그래서 ${nameB}님과 함께 있을 때는 잘해야 한다는 부담을 내려놓고 가장 나다운 모습으로 편하게 머물 수 있어요.`,
          whyPartnerIsNeeded: `${nameA}님은 내가 다 결정하고 챙기려다 보니 마음의 긴장이 쌓일 때가 많아요. 그래서 가까운 사람 앞에서는 내가 다 주도하지 않아도 마음 편히 쉴 수 있는 여유가 꼭 필요해요. ${nameB}님은 내 방식을 억지로 바꾸려 하지 않고, 내 기분과 상황을 다정하게 받아주는 넉넉한 마음이 있어요. 그래서 ${nameB}님과 함께 있을 때는 잘해야 한다는 부담을 내려놓고 가장 나다운 모습으로 편하게 머물 수 있어요.`,
          deliveryStatusNarrative: `${nameB}님 특유의 다정한 응답력으로 ${nameA}님이 필요로 하는 내면의 안정감을 든든하게 채워주고 있습니다.`,
          semanticDimension: "AUTONOMY_AND_SANCTUARY",
          confidence: "HIGH",
        },
        needBtoA: {
          seekerName: nameB,
          partnerName: nameA,
          innateNeedLabel: "체계적인 원칙과 안심",
          partnerExpectationLabel: "중심을 잡아주는 리더",
          whySeekerHasNeed: `${nameB}님은 생각과 고민이 많아 중요한 순간에 선뜻 결정하기 어려울 때가 있어요. 그래서 불안할 때 딱 기준을 잡아주고 방향을 정해줄 사람을 필요로 해요.`,
          partnerTraitMeetingIt: `${nameA}님은 고민이 길어질 때 흔들리지 않고 확실하게 방향을 정해주는 단단한 결단력이 있어요.`,
          howItFeelsInMarriage: `그래서 중요한 갈림길에 섰을 때 ${nameA}님이 곁에 있으면 막연한 불안을 덜고 안심하며 함께 움직일 수 있어요.`,
          whyPartnerIsNeeded: `${nameB}님은 생각과 고민이 많아 중요한 순간에 선뜻 결정하기 어려울 때가 있어요. 그래서 불안할 때 딱 기준을 잡아주고 방향을 정해줄 사람을 필요로 해요. ${nameA}님은 고민이 길어질 때 흔들리지 않고 확실하게 방향을 정해주는 단단한 결단력이 있어요. 그래서 중요한 갈림길에 섰을 때 ${nameA}님이 곁에 있으면 막연한 불안을 덜고 안심하며 함께 움직일 수 있어요.`,
          deliveryStatusNarrative: `${nameA}님이 보여주는 분명한 소신과 결단력이 ${nameB}님에게 든든한 가이드가 되어줍니다.`,
          semanticDimension: "DECISION_AND_STRUCTURE",
          confidence: "HIGH",
        },
        confidence: "HIGH",
      },
      directionalMeaning: {
        meaningAtoB: {
          giverName: nameA,
          receiverName: nameB,
          roleTitle: "고민이 길어질 때 결정을 도와주는 사람",
          partnerOriginalState: "",
          giverStateChangeEffect: "",
          description: `${nameA}님이 보여주는 단단한 소신과 결단력은 ${nameB}님이 이것저것 재느라 주저할 때 고민을 덜고 안심하며 앞으로 나아가도록 이끌어줍니다.`,
          semanticDimension: "DECISION_AND_STRUCTURE",
          confidence: "HIGH",
        },
        meaningBtoA: {
          giverName: nameB,
          receiverName: nameA,
          roleTitle: "내 영역과 방식을 존중해주는 사람",
          partnerOriginalState: "",
          giverStateChangeEffect: "",
          description: `${nameB}님이 보여주는 강요 없는 존중은 ${nameA}님이 매번 신경을 곤두세우지 않고도 내 방식대로 편안하게 머무를 수 있는 마음의 여유를 지켜줍니다.`,
          semanticDimension: "AUTONOMY_GUARD",
          confidence: "HIGH",
        },
        confidence: "HIGH",
      },
      mutualTransformation: {
        transformationA: {
          targetName: nameA,
          partnerName: nameB,
          beforeState: `${nameA}님은 내가 다 챙기고 결정하느라 마음의 긴장을 잘 놓지 못하던 성향`,
          partnerInfluence: `${nameB}님이 보여주는 다정하고 여유 있게 받아주는 태도를 접하면서`,
          emergingSelf: `혼자서 다 짊어지지 않아도 괜찮다는 안도감 속에, 필요할 때 기꺼이 상대에게 편하게 기대는 여유를 갖게 돼요.`,
          primaryTransformation: s?.positive_change_a || `${nameB}님과 함께 지내며 ${nameA}님은 유연함과 정서적 여유를 배우게 됩니다.`,
          confidence: "HIGH",
        },
        transformationB: {
          targetName: nameB,
          partnerName: nameA,
          beforeState: `${nameB}님은 고민이 깊어 선뜻 결정하지 못하고 신중하게 살펴보기만 하던 성향`,
          partnerInfluence: `${nameA}님이 보여주는 확실한 방향 잡기와 빠른 실행 리듬을 곁에서 배우면서`,
          emergingSelf: `고민만 하다가 시간을 보내지 않고, 생각한 바를 빠르게 행동으로 옮기는 추진력을 얻게 돼요.`,
          primaryTransformation: s?.positive_change_b || `${nameA}님과 함께 지내며 ${nameB}님은 결단력과 추진력을 얻게 됩니다.`,
          confidence: "HIGH",
        },
        confidence: "HIGH",
      },
      coupleIdentity: {
        title: cleanTaxonomyTitle(report.one_line_household, defaultTitle),
        synthesisNarrative: `${nameA}님은 명확한 방향성과 결단력으로 관계의 중심을 잡고, ${nameB}님은 다정한 포용력과 평정심으로 마음의 안식을 보태줍니다. 그 결과 ${nameA}님은 일상의 중압감을 혼자 짊어지지 않아도 되고, ${nameB}님은 ${nameA}님의 명확한 가이드 덕분에 주저함 없이 실행에 나서는 부부 동력을 갖추게 됩니다.`,
        confidence: "HIGH",
      },
    };
  }

  if (!s && !ch01Bundle) return null;
  return {
    id: "origin_story",
    type: "origin_story",
    partNumber: 1,
    title: t.originStoryCardTitle,
    whyUs: s?.why_us ?? "",
    positiveChangeA: s?.positive_change_a ?? "",
    positiveChangeB: s?.positive_change_b ?? "",
    ch01Bundle,
  };
}

function buildDailyLifeMirrorSection(
  report: MarriageReportBody,
  t: ReturnType<typeof catalog>,
): MarriageReportSection | null {
  const vm = report.household?.section_daily_life_mirror;
  if (!vm) return null;
  return {
    id: "daily_life_mirror",
    type: "daily_life_mirror",
    partNumber: 1,
    title: t.dailyLifeMirrorCardTitle,
    vm,
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
  const ch05Intelligence =
    (report as any)?.canonical_projections?.chapter05Intelligence ??
    import("@/lib/relationship/marriage/marriageChapter05Intelligence").then ? undefined : undefined;

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
    ch05Intelligence: (report as any)?.canonical_projections?.chapter05Intelligence ?? createDefaultMarriageChapter05Intelligence({ nameA, nameB, locale }),
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
  // Purged in Chapter 04 V3 Rebuild — Chapter 04 now serves as canonical intimacy chapter
  return null;
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
  locale?: Locale,
): MarriageConflict4StageViewModel | undefined {
  if (!bundle?.conflict4Stage || !names) return undefined;
  const { stageA, stageB, pairSummary } = bundle.conflict4Stage;
  const isEn = locale === "en-US";

  const stageLabelMap: Record<string, string> = isEn
    ? {
        NORMAL: "Normally",
        TENSION_RISING: "When tension rises",
        OVERLOAD: "When overloaded",
        RECOVERY: "When recovering",
      }
    : {
        NORMAL: "평소",
        TENSION_RISING: "긴장이 올라올 때",
        OVERLOAD: "과부하가 올 때",
        RECOVERY: "회복할 때",
      };
  const genericStageLabel = isEn ? "Emotional pacing" : "감정 수순 조율";

  // Sentinel values from the bundle that mean "generic/duplicated — replace
  // with a person-specific fallback" (see below). Bundle text is already
  // locale-correct (verified: buildMarriageEconomicPartnership/etc. thread
  // locale through), so these Korean sentinels only ever match a ko-KR
  // bundle; an en-US bundle's narrative never equals them and always keeps
  // its own (English) text.
  const genericSentinels = [
    "평온하며 대화와 협의에 개방적인 상태",
    "문제를 즉시 짚고 넘어가야 직성이 풀리는 조급함",
    "감정적 방어 회로가 완전히 작동하여 지친 상태",
    "다시 정서적 안전감을 느끼며 마음을 염",
  ];

  const mapPersonStages = (personName: string, rawStages: any[], isFirstPerson: boolean): MarriageConflictPersonViewModel => {
    const stages = rawStages.map((st, idx) => {
      const stageKey = typeof st === "string" ? st : st.stage || (idx === 0 ? "NORMAL" : idx === 1 ? "TENSION_RISING" : idx === 2 ? "OVERLOAD" : "RECOVERY");
      const label = stageLabelMap[stageKey] || genericStageLabel;

      let narrative = "";
      if (typeof st === "object" && st !== null) {
        narrative = st.internalState || st.externalBehavior || st.description || st.title || "";
      }

      // Check if narrative is duplicated or generic, apply person-specific human voice differentiation
      if (!narrative || genericSentinels.includes(narrative)) {
        if (isEn) {
          if (isFirstPerson) {
            narrative = stageKey === "NORMAL"
              ? `${personName} likes to get to a clear, honest conclusion quickly in conversation.`
              : stageKey === "TENSION_RISING"
              ? `When ${personName} feels stuck, they ask for reasons and want a solution right away, which can come across as blunt.`
              : stageKey === "OVERLOAD"
              ? `At peak emotion, ${personName} tends to push for a clear answer or say what's bothering them very directly.`
              : `Once the heat cools down a little, ${personName} tends to take the lead on apologizing and re-opening the conversation.`;
          } else {
            narrative = stageKey === "NORMAL"
              ? `${personName} tends to listen carefully to their partner's view and hold back before reacting.`
              : stageKey === "TENSION_RISING"
              ? `When conflict signs appear, ${personName} tends to go quiet and look for time alone to think.`
              : stageKey === "OVERLOAD"
              ? `When overwhelmed, ${personName} may stop talking altogether or close off for a while.`
              : `Once ${personName} feels calm and safe enough, they gradually open up about what's really on their mind.`;
          }
        } else {
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

/**
 * Household-operating fit has no existing canonical numeric authority (see
 * docs/dev — Ch8 score integrity audit): plannerExecutor.alignmentType is a
 * categorical classification, not a percentage, and no other canonical
 * signal represents this concept as a number. Map the real enum to a
 * locale-safe human label instead of exposing the raw value or a fabricated
 * score. Kept in sync with the enum's own semantics in
 * buildMarriageCanonicalEngine.ts's "4.2 Planner vs Executor" section.
 */
function operatingStatusLabelFromAlignment(
  alignmentType: import("../marriageCanonicalTypes").PlannerExecutorResult["alignmentType"] | undefined,
  isEn: boolean,
): string {
  switch (alignmentType) {
    case "complementary":
      return isEn ? "Complementary roles" : "역할이 자연스럽게 맞물리는 조합";
    case "dual_planner_tension":
      return isEn ? "Co-planners who need clear ownership" : "둘 다 기획형, 역할 분리가 필요한 조합";
    case "dual_executor_gap":
      return isEn ? "Co-executors who need a clear planner" : "둘 다 실행형, 방향을 잡는 사람이 필요한 조합";
    case "flexible":
      return isEn ? "Flexible, situational roles" : "상황에 따라 유연하게 나누는 조합";
    default:
      // Old-cache safety: canonicalBundle predates plannerExecutor, or the
      // field is otherwise absent — neutral, non-fabricated status.
      return isEn ? "Household roles still settling" : "가정 운영 역할이 아직 정리되는 중이에요";
  }
}

function normalizeLifePartnershipVerdict(
  bundle?: import("../marriageCanonicalTypes").MarriageCanonicalBundle,
  names?: [string, string],
  locale?: Locale,
): MarriagePartnershipVerdictViewModel | undefined {
  if (!bundle?.lifePartnershipVerdict || !names) return undefined;
  const verdict = bundle.lifePartnershipVerdict;
  const isEn = locale === "en-US";

  // `verdict` is `LifePartnershipVerdictResult` (marriageCanonicalTypes.ts):
  // { lifeSyncPct, operationSyncPct, emotionalSyncPct, longTermSynergyPct,
  //   oneLineVerdict, narrative }. lifeSyncPct/emotionalSyncPct/
  // longTermSynergyPct are now real CE-computed percentages (see the Ch8
  // score integrity repair — buildMarriageCanonicalEngine.ts maps them to
  // masterScores.benefit/activation/(100-risk)). operationSyncPct itself
  // stays an internal-only legacy constant (never proven to have a numeric
  // authority) and is intentionally NOT read here — operatingStatusLabel
  // below replaces it with a real, non-numeric canonical status instead.
  const safeEmoFit = verdict.emotionalSyncPct ?? 80;
  const safeGrowthFit = verdict.longTermSynergyPct ?? 82;
  // This fallback path is not currently reachable — lifeSyncPct is always a
  // real number from computeMarriageMasterScores.benefit — kept only as a
  // last-resort guard, never treated as authoritative.
  const safeSyncPct = verdict.lifeSyncPct ?? 82;
  const operatingStatusLabel = operatingStatusLabelFromAlignment(
    bundle.plannerExecutor?.alignmentType,
    isEn,
  );

  const cleanNarrative = (text?: string): string => {
    if (!text || text.includes("null")) return "";
    return text.trim();
  };

  // Unlike the 3 fit percentages above, `greatestStrength`/`biggestVulnerability`
  // have no corresponding split fields anywhere on LifePartnershipVerdictResult
  // (only a single combined `narrative` string exists, and it isn't reliably
  // strength-only content — using it here risks showing vulnerability-toned
  // text under a "Greatest Strength" heading). There is no real per-field
  // data being masked for these two, so they stay on the locale-aware
  // generic fallback; only the 3 percentages above had a genuine mapping bug.
  const safeStrength = isEn
    ? `${names[0]} and ${names[1]}'s everyday pace and sense of home line up well, making each other feel steady and at ease.`
    : `${names[0]}님과 ${names[1]}님은 일상 생활 템포와 주거 가치관이 잘 맞아떨어져 서로에게 단단한 안식이 되는 커플이에요.`;
  const safeVulnerability = isEn
    ? `Your emotions cool down at different speeds after a fight, which can cause misunderstandings. Make sure to keep your timeout agreement.`
    : `싸울 때 감정이 식는 속도가 달라서 오해가 생길 수 있으니 타임아웃 규칙을 꼭 지켜주세요.`;
  const safeOneLine =
    cleanNarrative(verdict.oneLineVerdict) ||
    (isEn
      ? `${names[0]} and ${names[1]} respect each other's roles and make a pretty good long-term team.`
      : `${names[0]}님과 ${names[1]}님은 각자의 역할을 존중하면서 함께 오래 살아가기 꽤 좋은 팀이에요.`);

  return {
    lifeSyncPct: safeSyncPct,
    operatingStatusLabel,
    emotionalPartnerFit: safeEmoFit,
    longTermGrowthFit: safeGrowthFit,
    oneLineVerdict: safeOneLine,
    greatestStrength: safeStrength,
    biggestVulnerability: safeVulnerability,
  };
}

// ---- Deep-read canonical merge (married_saju_deep explain-only overlay) ----
// Additive expert-synthesis enrichment for the canonical 9-chapter report —
// see docs/dev/decisions/028 (LLM must not mutate canonical_projections/CFO/
// role/compare/scoring) and the Deep Read Content Ownership Audit. Every
// normalizer below returns undefined (never a fabricated fallback) when the
// overlay is missing, partial, or malformed — old cached reports without
// married_saju_deep must render exactly like today.

function normalizeChapter1ExpertVoice(
  overlay: MarriedSajuDeepReport | undefined,
  names: [string, string],
): import("./marriageUiContracts").MarriageExpertVoiceViewModel | undefined {
  const nature = overlay?.section_2_nature;
  const voiceA = nature?.a_nature?.first_person_voice?.trim();
  const voiceB = nature?.b_nature?.first_person_voice?.trim();
  if (!voiceA && !voiceB) return undefined;
  return {
    personA: voiceA ? { personName: names[0], voice: voiceA } : undefined,
    personB: voiceB ? { personName: names[1], voice: voiceB } : undefined,
  };
}

function normalizeChapter3RoleFitInsight(
  overlay: MarriedSajuDeepReport | undefined,
): string | undefined {
  const matchNote = overlay?.section_4_household_frames?.role_balance_signal?.match_note?.trim();
  return matchNote || undefined;
}

function normalizeChapter8TogetherInsight(
  overlay: MarriedSajuDeepReport | undefined,
): import("./marriageUiContracts").MarriageTogetherInsightViewModel | undefined {
  const text = overlay?.section_5_action?.together?.trim();
  if (!text) return undefined;
  const starter = overlay?.section_5_action?.together_starter?.trim();
  return { text, starter: starter || undefined };
}

function normalizeChapter9PersonalizedAdvice(
  overlay: MarriedSajuDeepReport | undefined,
): import("./marriageUiContracts").MarriagePersonalizedAdviceViewModel | undefined {
  const action = overlay?.section_5_action;

  const toTip = (
    raw: unknown,
  ): import("./marriageUiContracts").MarriagePersonalizedAdviceTip | null => {
    if (!raw || typeof raw !== "object") return null;
    const o = raw as Record<string, unknown>;
    const actionTitle = typeof o.action_title === "string" ? o.action_title.trim() : "";
    const reason = typeof o.saju_reason === "string" ? o.saju_reason.trim() : "";
    const speechTip = typeof o.real_speech_tip === "string" ? o.real_speech_tip.trim() : "";
    // A tip missing any of its three core fields is unusable — drop it
    // rather than rendering a partial/empty card.
    if (!actionTitle || !reason || !speechTip) return null;
    const example = typeof o.real_life_example === "string" ? o.real_life_example.trim() : "";
    return { actionTitle, reason, speechTip, example: example || undefined };
  };

  const forPersonA = Array.isArray(action?.advice_for_a)
    ? action.advice_for_a
        .map(toTip)
        .filter((t): t is import("./marriageUiContracts").MarriagePersonalizedAdviceTip => t !== null)
    : [];
  const forPersonB = Array.isArray(action?.advice_for_b)
    ? action.advice_for_b
        .map(toTip)
        .filter((t): t is import("./marriageUiContracts").MarriagePersonalizedAdviceTip => t !== null)
    : [];

  if (forPersonA.length === 0 && forPersonB.length === 0) return undefined;
  return { forPersonA, forPersonB };
}

export function buildMarriageReportViewModel(
  report: MarriageReportBody,
  params: BuildMarriageReportViewModelParams,
): MarriageReportViewModel {
  const { viewerIsReportA, myName, partnerName, locale } = params;
  const names: [string, string] = [myName, partnerName];
  const t = catalog(locale ?? "ko-KR");

  // 순서 근거: decisions/033_marriage-report-part-reorder.md
  //   헤드라인+트라이스코어 → origin_story → 일상 모습(신규) → deep_read
  //   → DNA 데이터증명(psych_radar 11축 → compare_table 사주 → home_dna)
  //   → 테마 무기화(프라이버시→침실→돈→양육→시댁, 감정 무게순)
  //   → 오해의 번역기(upset/warning) → 처방 → 웨더포캐스트(클로징)
  // home_dna/deep_read/upset의 정확한 하위 위치는 결정 문서에 명시되지
  // 않아 이 파일에서 합리적으로 배치함 — 필요시 조정.
  //
  // 주의(2026-08-21): 이 순서는 components/relationship/marriage/sections/
  // SectionRenderer.tsx의 CHAPTER_GROUPS(고정 9-챕터 그룹핑)에 의해
  // 다시 한번 재배치된다 — 이 배열 순서는 "같은 챕터 안에서의 순서"에만
  // 영향을 준다. 화면에 실제로 보이는 큰 순서를 바꾸려면 CHAPTER_GROUPS도
  // 함께 손봐야 한다(아직 미착수 — decisions/033 참고).
  const builders: Array<() => MarriageReportSection | null> = [
    () => buildHouseholdSnapshotSection(report, t),
    () => buildOriginStorySection(report, t),
    () => buildDailyLifeMirrorSection(report, t),
    () => buildDeepReadSection(report, viewerIsReportA, t),
    () => buildPsychRadarSection(report, viewerIsReportA, t),
    () => buildCompareTableSection(report, locale ?? "ko-KR", t),
    () => buildHomeDnaSection(report, viewerIsReportA, t),
    () => buildPrivacySection(report, t),
    () => buildBedroomSection(report, t),
    () => buildMoneyChoresSection(report, locale ?? "ko-KR", t),
    () => buildParentingSection(report, t),
    () => buildFamilyBoundarySection(report, t),
    () => buildUpsetSection(report, viewerIsReportA, t),
    () => buildWarningSection(report, t),
    () => buildPrescriptionSection(report, t),
    () => buildWeatherForecastSection(report, t),
  ];

  const sections = builders
    .map((build) => build())
    .filter((section): section is MarriageReportSection => section != null);

  const canonicalStoryPlan = report.canonical_projections?.marriage_canonical_story_plan;
  const canonicalBundle = report.canonical_projections?.marriage_canonical_bundle;

  // `names` above is VIEWER-relative ([myName, partnerName], swapped per
  // viewerIsReportA by the caller). canonicalStoryPlan-fed data
  // (conflict4Stage, economicPartnership, lifePartnershipVerdict, etc. — and
  // the deep_read merge) is keyed by CANONICAL report_id_a/report_id_b,
  // which does not move with the viewer. `canonicalNames` is the fixed
  // [personA, personB] pairing all canonically-keyed normalizers/cards must
  // use so labels never mismatch when viewerIsReportA is false.
  const canonicalNames: [string, string] = [
    report.household?.section_dna?.person_a?.nickname ?? names[0],
    report.household?.section_dna?.person_b?.nickname ?? names[1],
  ];

  const conflict4StageView = normalizeConflict4Stage(canonicalBundle, canonicalNames, locale);
  const lifePartnershipVerdictView = normalizeLifePartnershipVerdict(canonicalBundle, canonicalNames, locale);

  const deepReadOverlay = report.meta?.married_saju_deep;
  const chapter1ExpertVoice = normalizeChapter1ExpertVoice(deepReadOverlay, canonicalNames);
  const chapter3RoleFitInsight = normalizeChapter3RoleFitInsight(deepReadOverlay);
  const chapter8TogetherInsight = normalizeChapter8TogetherInsight(deepReadOverlay);
  const chapter9PersonalizedAdvice = normalizeChapter9PersonalizedAdvice(deepReadOverlay);

  return {
    kind: "cohabitation",
    schemaVersion: "2.0.0",
    opening: buildOpening(report, names),
    sections,
    canonicalStoryPlan,
    canonicalBundle,
    canonicalNames,
    conflict4StageView,
    lifePartnershipVerdictView,
    chapter1ExpertVoice,
    chapter3RoleFitInsight,
    chapter8TogetherInsight,
    chapter9PersonalizedAdvice,
    raw: { report },
  };
}
