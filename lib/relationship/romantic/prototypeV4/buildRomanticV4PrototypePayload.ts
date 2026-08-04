import {
  romanticExperienceCompleteFixture,
  romanticExperienceMinimalFixture,
  romanticExperienceStructuralTensionFixture,
} from "../experience/romanticExperienceDevFixtures";
import { buildRomanticExperienceViewModel } from "../experience/buildRomanticExperienceViewModel";
import {
  formatRomanticCompareLeanLabel,
  type RomanticCompareRowKey,
} from "../romanticComparisonTableCanonical";
import type {
  RomanticPsychMatchAxisResult,
  RomanticPsychMatchType,
} from "../../../prompts/relationshipPremium/romanticSajuDeep/outputSchema";
import { psychMatchAxisLabel } from "@/lib/relationship/psychMatch";
import {
  explainFourCeInfluence,
  type RomanticNarrativeInputContract,
} from "./fourCeNarrativeInput";
import { buildActualFourCeContract } from "./buildActualFourCeContract";
import { buildFourCeSemanticPlan } from "./fourCeSemanticPlanner";
import { buildCanonicalRomanticV4Report } from "./buildCanonicalRomanticV4Report";
import {
  resolveRomanticV4SurveyEvidence,
  type RomanticAxisOverviewRow,
  type RomanticV4SurveyInput,
  type SurveyPairEvidenceStatus,
} from "./romanticV4SurveyEvidence";
import {
  buildRomanticV4ComparisonFusion,
  type RomanticV4ComparisonRow,
} from "./romanticV4ComparisonFusion";
import type { RomanticSajuSignals } from "@/lib/personCore/sajuSignals/types";
import type { RomanticV4PairSajuInput } from "./romanticV4SajuInput";
import type {
  AxisInsightRow,
  AxisSelectionRejected,
  ChapterId,
  ConfidenceLevel,
  EvidenceTraceRow,
  OmittedContentRow,
  PrototypeLocale,
  PrototypeVariant,
  RomanticV4PrototypePayload,
  SajuComparisonRow,
  SourceKind,
} from "./types";

const AXIS_TO_COMPARE_ROW: Partial<Record<string, RomanticCompareRowKey>> = {
  conflict_style: "conflict",
  stimulation: "stress",
  self_control: "stress",
  empathy: "communication",
  thinking_style: "communication",
  decision_style: "decision",
  practicality: "decision",
  structure: "decision",
  energy_style: "affection",
};

const COMPARE_QUESTION: Record<RomanticCompareRowKey, string> = {
  conflict: "서로 부딪힐 때 우리는 무엇을 먼저 하나요?",
  affection: "사랑을 확인받고 전하는 방식은 어떻게 다른가요?",
  stress: "압박을 받을 때 어떤 패턴이 나오나요?",
  expression: "감정을 전달하는 속도와 밀도는 어떤가요?",
  decision: "중요한 결정을 내릴 때 어떤 기준을 쓰나요?",
  communication: "말을 고르고 해석하는 방식은 어떻게 다른가요?",
};

function fixtureOf(variant: PrototypeVariant) {
  if (variant === "minimal") return romanticExperienceMinimalFixture;
  if (variant === "tension") return romanticExperienceStructuralTensionFixture;
  return romanticExperienceCompleteFixture;
}

/** Thin wrapper over the canonical production psych-match label authority. */
export function labelOfAxis(locale: PrototypeLocale, axisKey: string) {
  return psychMatchAxisLabel(axisKey, locale);
}

function confidenceFromGap(gap: number): ConfidenceLevel {
  if (gap >= 28) return "high";
  if (gap >= 16) return "medium";
  if (gap >= 10) return "low";
  return "tentative";
}

function buildComparisonTable(params: {
  locale: PrototypeLocale;
  viewerIsReportA: boolean;
  variant: PrototypeVariant;
}) {
  const report = fixtureOf(params.variant);
  const table = report.canonical_projections?.comparison_table;
  if (!table) return [] as SajuComparisonRow[];

  // All 6 canonical rows — previously capped at 5 with "expression" silently
  // dropped despite the fixture (and projectDifferenceMap.ts) already having
  // it; no documented product rule limits display, so show every row present.
  const selectedKeys = [
    "conflict",
    "stress",
    "communication",
    "affection",
    "decision",
    "expression",
  ].filter((rowKey) => Boolean(table[rowKey as RomanticCompareRowKey])) as RomanticCompareRowKey[];

  return selectedKeys.slice(0, 6).map((rowKey) => {
    const row = table[rowKey]!;
    const personA = formatRomanticCompareLeanLabel(
      params.viewerIsReportA ? row.lean_a : row.lean_b,
      params.locale,
      rowKey,
    );
    const personB = formatRomanticCompareLeanLabel(
      params.viewerIsReportA ? row.lean_b : row.lean_a,
      params.locale,
      rowKey,
    );
    const manifestation =
      rowKey === "conflict"
        ? "같은 갈등 상황에서 한 사람은 곧바로 맞추려 하고, 다른 사람은 기준부터 세우려 해서 타이밍이 자꾸 어긋납니다."
        : rowKey === "stress"
          ? "압박이 커질수록 한쪽은 감정을 빠르게 쏟아내고, 다른 쪽은 잠시 물러나 마음을 정리합니다. 그 모습이 서로에게는 거절로 보이기 쉽습니다."
          : rowKey === "communication"
            ? "직설적인 표현과 배려 섞인 표현이 만나면서, 정작 하려던 말의 내용보다 어조와 순서가 먼저 쟁점이 되곤 합니다."
            : rowKey === "affection"
              ? "말과 행동, 서로 다른 방식으로 애정을 표현하다 보니 고마운 마음은 크지만 그 마음이 잘 전달되지 않을 때가 있습니다."
              : rowKey === "expression"
                ? "감정을 표현하는 속도와 밀도가 서로 달라서, 한 사람은 마음을 그때그때 꺼내고 다른 사람은 충분히 정리한 뒤에야 말을 꺼냅니다."
                : "결정을 내리는 기준이 서로 달라서(속도 중심과 합의 중심), 일정과 돈, 계획을 정할 때마다 작은 마찰이 반복됩니다.";
    const understandingPoint =
      rowKey === "conflict"
        ? "감정을 얼마나 강하게 표현하느냐보다, 어떤 순서로 풀어갈지를 먼저 맞춰두면 같은 문제도 덜 다치면서 다룰 수 있습니다."
        : rowKey === "stress"
          ? "거리를 두는 모습은 회피가 아니라 과부하를 막으려는 신호로 봐 주고, 언제 다시 돌아올지 말로 약속해 두면 좋습니다."
          : rowKey === "communication"
            ? "하고 싶은 말의 핵심을 한 줄로 먼저 전하고, 표현 방식을 다듬는 건 그다음으로 미루면 오해가 줄어듭니다."
            : rowKey === "affection"
              ? "말로 느끼는 안심과 행동으로 느끼는 안심을 서로 번역해 주면, 마음으로 느끼는 만족이 눈에 띄게 달라집니다."
              : rowKey === "expression"
                ? "표현이 빠르다고 마음이 더 크거나, 느리다고 마음이 없는 게 아니라는 걸 먼저 인정하면, 같은 감정도 다르게 전달되는 방식을 이해하기 쉬워집니다."
                : "혼자 정해도 되는 것과 함께 확인해야 하는 것의 경계를 미리 정해두면, 결정할 때마다 지치는 일이 줄어듭니다.";
    return {
      rowId: `compare.${rowKey}`,
      relationshipQuestion: COMPARE_QUESTION[rowKey],
      personA,
      personB,
      relationshipManifestation: manifestation,
      understandingPoint,
      confidence: "high" as ConfidenceLevel,
      evidenceIds: [
        `canonical_projections.comparison_table.${rowKey}`,
        "section_2_nature.comparison_table",
      ],
    };
  });
}

type V4SurveyEvidenceMetadata = NonNullable<RomanticV4PrototypePayload["surveyEvidence"]>;

const V4_COMPARISON_ROW_CONFIDENCE: Record<RomanticV4ComparisonRow["confidence"], ConfidenceLevel> = {
  high: "high",
  low: "low",
  insufficient: "tentative",
};

// Static per-row prose, unchanged from the fixture-driven table — reused as-is
// (the comparison_table's specific manifestation/understanding-point copy is
// out of scope here; only the underlying lean/confidence values are real now).
function comparisonRowProse(rowKey: RomanticCompareRowKey): { manifestation: string; understanding: string } {
  if (rowKey === "conflict") {
    return {
      manifestation:
        "같은 갈등 상황에서 한 사람은 곧바로 맞추려 하고, 다른 사람은 기준부터 세우려 해서 타이밍이 자꾸 어긋납니다.",
      understanding:
        "감정을 얼마나 강하게 표현하느냐보다, 어떤 순서로 풀어갈지를 먼저 맞춰두면 같은 문제도 덜 다치면서 다룰 수 있습니다.",
    };
  }
  if (rowKey === "stress") {
    return {
      manifestation:
        "압박이 커질수록 한쪽은 감정을 빠르게 쏟아내고, 다른 쪽은 잠시 물러나 마음을 정리합니다. 그 모습이 서로에게는 거절로 보이기 쉽습니다.",
      understanding:
        "거리를 두는 모습은 회피가 아니라 과부하를 막으려는 신호로 봐 주고, 언제 다시 돌아올지 말로 약속해 두면 좋습니다.",
    };
  }
  if (rowKey === "communication") {
    return {
      manifestation:
        "직설적인 표현과 배려 섞인 표현이 만나면서, 정작 하려던 말의 내용보다 어조와 순서가 먼저 쟁점이 되곤 합니다.",
      understanding:
        "하고 싶은 말의 핵심을 한 줄로 먼저 전하고, 표현 방식을 다듬는 건 그다음으로 미루면 오해가 줄어듭니다.",
    };
  }
  if (rowKey === "affection") {
    return {
      manifestation:
        "말과 행동, 서로 다른 방식으로 애정을 표현하다 보니 고마운 마음은 크지만 그 마음이 잘 전달되지 않을 때가 있습니다.",
      understanding:
        "말로 느끼는 안심과 행동으로 느끼는 안심을 서로 번역해 주면, 마음으로 느끼는 만족이 눈에 띄게 달라집니다.",
    };
  }
  if (rowKey === "expression") {
    return {
      manifestation:
        "감정을 표현하는 속도와 밀도가 서로 달라서, 한 사람은 마음을 그때그때 꺼내고 다른 사람은 충분히 정리한 뒤에야 말을 꺼냅니다.",
      understanding:
        "표현이 빠르다고 마음이 더 크거나, 느리다고 마음이 없는 게 아니라는 걸 먼저 인정하면, 같은 감정도 다르게 전달되는 방식을 이해하기 쉬워집니다.",
    };
  }
  return {
    manifestation:
      "결정을 내리는 기준이 서로 달라서(속도 중심과 합의 중심), 일정과 돈, 계획을 정할 때마다 작은 마찰이 반복됩니다.",
    understanding:
      "혼자 정해도 되는 것과 함께 확인해야 하는 것의 경계를 미리 정해두면, 결정할 때마다 지치는 일이 줄어듭니다.",
  };
}

/**
 * RomanticV4ComparisonRow (fusion resolver output) -> the display-ready
 * SajuComparisonRow shape. Shows all 6 canonical rows (no documented product
 * rule limits display — see buildComparisonTable's matching fix). Confidence/
 * labels come straight from the fused row — this function only formats, it
 * does not recompute lean/align/confidence.
 */
function comparisonRowsFromFusion(params: {
  rows: RomanticV4ComparisonRow[];
  locale: PrototypeLocale;
  viewerIsReportA: boolean;
}): SajuComparisonRow[] {
  const byKey = new Map(params.rows.map((r) => [r.rowKey, r] as const));
  const priority: RomanticCompareRowKey[] = [
    "conflict",
    "stress",
    "communication",
    "affection",
    "decision",
    "expression",
  ];
  const selected = priority.filter((k) => byKey.has(k)).slice(0, 6);

  return selected.map((rowKey) => {
    const row = byKey.get(rowKey)!;
    const leanForViewer = (mine: string, theirs: string) => (params.viewerIsReportA ? mine : theirs);
    const personA = formatRomanticCompareLeanLabel(leanForViewer(row.leanA, row.leanB), params.locale, rowKey);
    const personB = formatRomanticCompareLeanLabel(leanForViewer(row.leanB, row.leanA), params.locale, rowKey);
    const prose = comparisonRowProse(rowKey);
    return {
      rowId: `compare.${rowKey}`,
      relationshipQuestion: COMPARE_QUESTION[rowKey],
      personA,
      personB,
      relationshipManifestation: prose.manifestation,
      understandingPoint: prose.understanding,
      confidence: V4_COMPARISON_ROW_CONFIDENCE[row.confidence],
      evidenceIds: [
        `meta.romantic_signals.person_a.${rowKey}`,
        `meta.romantic_signals.person_b.${rowKey}`,
        `survey.secondary_axes.${rowKey}`,
      ],
    };
  });
}

/**
 * Single entry point for axisOverview/comparisonTable provenance — real mode
 * never falls through to fixture data, dev_fixture mode never claims to be real.
 */
function resolveV4AxisData(params: {
  locale: PrototypeLocale;
  variant: PrototypeVariant;
  viewerIsReportA: boolean;
  fixtureAxisResults: RomanticPsychMatchAxisResult[];
  surveyInput?: RomanticV4SurveyInput;
  romanticSignalsA?: RomanticSajuSignals | null;
  romanticSignalsB?: RomanticSajuSignals | null;
}): {
  comparisonTable: SajuComparisonRow[];
  usedRows: RomanticCompareRowKey[];
  axisOverview: RomanticPsychMatchAxisResult[];
  axisOverviewEvidence?: RomanticAxisOverviewRow[];
  comparisonTableEvidence?: RomanticV4ComparisonRow[];
  evidenceStatus: SurveyPairEvidenceStatus;
  surveyEvidence: V4SurveyEvidenceMetadata;
} {
  if (params.surveyInput?.mode === "real") {
    const evidence = resolveRomanticV4SurveyEvidence(params.surveyInput);
    // Both sides synthetic: never surface a numeric-only view that could be
    // misread as a real similarity/complementary/tension claim.
    const axisOverview: RomanticPsychMatchAxisResult[] =
      evidence.evidenceStatus === "unobserved"
        ? []
        : evidence.rows.map((row) => ({
            axis_key: row.axis_key,
            score_a: row.score_a,
            score_b: row.score_b,
            gap: row.gap,
            match_type: row.match_type as RomanticPsychMatchType,
          }));

    // comparisonTable needs Saju base bands (romantic_signals), which are not
    // part of RomanticV4SurveyInput — if the caller didn't supply them this
    // stays honestly empty rather than silently falling back to fixture rows.
    const hasSajuSignals = params.romanticSignalsA != null && params.romanticSignalsB != null;
    const comparisonTableEvidence = hasSajuSignals
      ? buildRomanticV4ComparisonFusion({
          signalsA: params.romanticSignalsA!,
          signalsB: params.romanticSignalsB!,
          profileA: params.surveyInput.profileA,
          profileB: params.surveyInput.profileB,
        })
      : undefined;
    const comparisonTable = comparisonTableEvidence
      ? comparisonRowsFromFusion({
          rows: comparisonTableEvidence,
          locale: params.locale,
          viewerIsReportA: params.viewerIsReportA,
        })
      : [];
    const usedRows = comparisonTable.map((row) => row.rowId.split(".")[1] as RomanticCompareRowKey);

    return {
      comparisonTable,
      usedRows,
      axisOverview,
      axisOverviewEvidence: evidence.rows,
      comparisonTableEvidence,
      evidenceStatus: evidence.evidenceStatus,
      surveyEvidence: {
        mode: "real",
        evidenceStatus: evidence.evidenceStatus,
        disclosureCode: evidence.disclosureCode,
        isSampleData: false,
        axisOverviewSource: "survey_resolver",
        comparisonTableSource: hasSajuSignals ? "saju_fusion_resolver" : "unavailable_pending_saju_wiring",
      },
    };
  }

  const comparisonTable = buildComparisonTable({
    locale: params.locale,
    viewerIsReportA: params.viewerIsReportA,
    variant: params.variant,
  });
  const usedRows = comparisonTable.map((row) => row.rowId.split(".")[1] as RomanticCompareRowKey);
  return {
    comparisonTable,
    usedRows,
    axisOverview: params.fixtureAxisResults,
    axisOverviewEvidence: undefined,
    comparisonTableEvidence: undefined,
    evidenceStatus: "observed",
    surveyEvidence: {
      mode: "dev_fixture",
      evidenceStatus: "observed",
      disclosureCode: "none",
      isSampleData: true,
      axisOverviewSource: "dev_fixture",
      comparisonTableSource: "dev_fixture",
    },
  };
}

function selectAxisInsights(params: {
  locale: PrototypeLocale;
  axisResults: RomanticPsychMatchAxisResult[];
  usedRows: RomanticCompareRowKey[];
  /** When set to "partial_inference", selected-axis confidence is capped at "low" — one side is synthetic. */
  evidenceStatus?: SurveyPairEvidenceStatus;
}) {
  const rejected: AxisSelectionRejected[] = [];
  const scored = params.axisResults
    .filter((axis) => axis.axis_key !== "conflict_style")
    .map((axis) => {
      const mapped = AXIS_TO_COMPARE_ROW[axis.axis_key];
      const ownershipCollision = Boolean(mapped && params.usedRows.includes(mapped));
      const overlapPenalty = ownershipCollision ? 16 : 0;
      const salience =
        (axis.score_a >= 70 && axis.score_b >= 70) || (axis.score_a <= 35 && axis.score_b <= 35)
          ? 10
          : 0;
      const typeBonus = axis.match_type === "tension" ? 9 : axis.match_type === "complementary" ? 5 : 3;
      const score = axis.gap + salience + typeBonus - overlapPenalty;
      return { axis, score, mapped, ownershipCollision };
    });

  const candidates = scored
    .filter((row) => {
      if (row.ownershipCollision && row.score < 24) {
        rejected.push({
          axisKey: row.axis.axis_key,
          reason: "ownership_collision",
          detail: `mapped row ${row.mapped ?? "unknown"} already owned by Saju comparison and axis score ${row.score} is not strong enough.`,
          evidenceIds: [`meta.psych_match.axis_results.${row.axis.axis_key}`],
        });
        return false;
      }
      if (row.score < 20) {
        rejected.push({
          axisKey: row.axis.axis_key,
          reason: "insufficient_evidence",
          detail: `selection score ${row.score} < threshold 20.`,
          evidenceIds: [`meta.psych_match.axis_results.${row.axis.axis_key}`],
        });
        return false;
      }
      return true;
    })
    .sort((a, b) => b.score - a.score);

  const chosen: Array<typeof candidates[number]> = [];
  const usedBuckets = new Set<string>();
  for (const c of candidates) {
    if (chosen.length >= 4) break;
    const bucket = c.axis.match_type;
    if (usedBuckets.has(bucket) && c.axis.gap < 24) {
      rejected.push({
        axisKey: c.axis.axis_key,
        reason: "low_distinctiveness",
        detail: `same match bucket ${bucket} already selected and gap ${c.axis.gap} < 24.`,
        evidenceIds: [`meta.psych_match.axis_results.${c.axis.axis_key}`],
      });
      continue;
    }
    chosen.push(c);
    usedBuckets.add(bucket);
  }

  const selected = chosen.map<AxisInsightRow>((c) => {
    const axisLabel = labelOfAxis(params.locale, c.axis.axis_key);
    const relationshipEffect =
      c.axis.match_type === "tension"
        ? "긴장"
        : c.axis.match_type === "complementary"
          ? "보완"
          : "공명";
    const whyItMatters =
      c.axis.axis_key === "structure"
        ? "일정과 돈, 우선순위를 함께 정할 때 가장 자주 부딪히는 부분이라, 미리 규칙을 맞춰두면 관계가 한결 수월해집니다."
        : c.axis.axis_key === "energy_style"
          ? "함께 있을 때 에너지를 회복하는 방식이 서로 달라서, 주말이나 모임에서 느끼는 만족도가 유독 크게 갈리는 부분입니다."
          : c.axis.axis_key === "stimulation"
            ? "새로운 자극을 원하는 속도가 서로 달라서, 데이트를 얼마나 촘촘히 잡을지와 그로 인한 피로감이 함께 흔들리기 때문입니다."
            : "일상 대화에서 서로의 의도를 해석하고 기대를 갖는 방식과 바로 이어지는 부분이라, 반복되는 패턴을 이해하는 실마리가 됩니다.";
    const dailyManifestation =
      c.axis.axis_key === "structure"
        ? "여행 준비에서 한 사람은 체크리스트를 완성하려 하고, 다른 사람은 상황에 맞춰 즉흥 수정하려다 출발 직전에 다툼이 납니다."
        : c.axis.axis_key === "energy_style"
          ? "한쪽은 사람 많은 자리에서 충전되고, 다른 쪽은 둘만의 정리 시간이 있어야 다음 대화가 부드럽게 이어집니다."
          : c.axis.axis_key === "stimulation"
            ? "새로운 장소를 계속 가보고 싶은 쪽과 익숙한 루틴을 지키고 싶은 쪽이, 데이트 횟수보다 강도를 두고 자주 엇갈립니다."
            : "중요한 메시지를 보낼 때 한 사람은 맥락을 길게, 다른 사람은 요점 위주로 보내 해석이 엇갈립니다.";
    return {
      axisKey: c.axis.axis_key,
      axisLabel,
      matchType: c.axis.match_type,
      gap: c.axis.gap,
      personAPattern: `${c.axis.score_a}점 경향`,
      personBPattern: `${c.axis.score_b}점 경향`,
      whyItMatters,
      dailyManifestation,
      relationshipEffect,
      confidence: params.evidenceStatus === "partial_inference" ? "low" : confidenceFromGap(c.axis.gap),
      evidenceIds: [`meta.psych_match.axis_results.${c.axis.axis_key}`],
    };
  });
  return { selected, rejected };
}

function createCompletePayload(
  locale: PrototypeLocale,
  contractOverride?: RomanticNarrativeInputContract,
  surveyInput?: RomanticV4SurveyInput,
  pairSajuInput?: RomanticV4PairSajuInput,
): RomanticV4PrototypePayload {
  const report = romanticExperienceCompleteFixture;
  const vm = buildRomanticExperienceViewModel({
    report,
    nameA: "지민",
    nameB: "정우",
    myName: "지민",
    partnerName: "정우",
    viewerIsReportA: true,
    locale,
  });

  const evidenceTrace: EvidenceTraceRow[] = [];
  const omitted: OmittedContentRow[] = [];
  const pushTrace = (
    blockId: string,
    chapter: ChapterId,
    sourceKind: SourceKind,
    text: string,
    evidenceIds: string[],
    plannerInstruction: string,
  ) => {
    evidenceTrace.push({ blockId, chapter, sourceKind, text, evidenceIds, plannerInstruction });
  };

  const fourCeResult = contractOverride ? null : buildActualFourCeContract(locale, pairSajuInput);
  const preNarrativeContract = contractOverride ?? fourCeResult!.contract;

  const axisData = resolveV4AxisData({
    locale,
    variant: "complete",
    viewerIsReportA: true,
    fixtureAxisResults: vm.axisComparison.axisResults,
    surveyInput,
    romanticSignalsA: fourCeResult?.romanticSignalsA,
    romanticSignalsB: fourCeResult?.romanticSignalsB,
  });
  const {
    comparisonTable,
    usedRows,
    axisOverview,
    axisOverviewEvidence,
    comparisonTableEvidence,
    surveyEvidence,
  } = axisData;
  const axisSelection = selectAxisInsights({
    locale,
    axisResults: axisOverview,
    usedRows,
    evidenceStatus: axisData.evidenceStatus,
  });
  const selectedAxisInsights = axisSelection.selected;

  const fourCeInfluenceAudit = explainFourCeInfluence(preNarrativeContract);
  const fourCeSemanticPlan = buildFourCeSemanticPlan(preNarrativeContract);
  const canonicalReport =
    locale === "ko-KR" || locale === "en-US"
      ? buildCanonicalRomanticV4Report(locale)
      : undefined;
  const aCharacterMeaning = fourCeSemanticPlan.aRelationshipCharacter.selectedMeaning;
  const bCharacterMeaning = fourCeSemanticPlan.bRelationshipCharacter.selectedMeaning;
  const asymmetryMeaning = fourCeSemanticPlan.directionalAsymmetry.selectedMeaning;
  const pairSynthesisMeaning = fourCeSemanticPlan.pairSynthesis.selectedMeaning;
  const hasTogetherSemantic = Boolean(asymmetryMeaning || pairSynthesisMeaning);
  const hasIndividualA =
    preNarrativeContract.siblingInputs.individualCeA.output.status === "available";
  const hasIndividualB =
    preNarrativeContract.siblingInputs.individualCeB.output.status === "available";
  const hasPairCe =
    preNarrativeContract.siblingInputs.pairCeCommon.output.status === "available";
  const hasRomanticCe =
    preNarrativeContract.siblingInputs.romanticCeSpecific.output.status === "available";

  const chapters = [
    {
      chapter: "ch0_opening" as const,
      title: locale === "ko-KR" ? "0. Opening: Relationship Signature" : "0. Opening: Relationship Signature",
      blocks: [
        {
          blockId: "opening.signature",
          label: locale === "ko-KR" ? "관계 시그니처" : "Relationship signature",
          sourceKind: "canonical_evidence" as SourceKind,
          content: "깊어지는 계절",
          evidenceIds: ["section_1_summary.relationship_name"],
          confidence: "high" as ConfidenceLevel,
        },
        {
          blockId: "opening.paradox",
          label: locale === "ko-KR" ? "핵심 역설" : "Defining paradox",
          sourceKind: "ce_derived" as SourceKind,
          content:
            locale === "ko-KR"
              ? "지민은 마음을 빠르게 꺼내 보이고, 정우는 충분히 생각을 정리한 뒤에야 말을 꺼냅니다. 같은 순간에 부딪히더라도, 그 뒤로 회복해 가는 속도는 서로 다르게 흘러갑니다."
              : "Jimin's fast expression and Jungwoo's deliberate processing often collide at the same trigger but recover on different clocks.",
          evidenceIds: [
            "canonical_projections.expression_speed",
            "canonical_projections.recovery_speed",
            "canonical_projections.cross_chart_tension",
          ],
          confidence: "high" as ConfidenceLevel,
        },
        {
          blockId: "opening.invitation",
          label: locale === "ko-KR" ? "읽기 초대" : "Invitation",
          sourceKind: "prototype_bounded_narrative" as SourceKind,
          content:
            locale === "ko-KR"
              ? "이 보고서는 누가 맞고 틀린지를 가리지 않습니다. 두 사람이 실제로 반복해 온 장면을 있는 그대로 짚어보고, 같은 장면을 조금 덜 아프게 지나가는 방법을 함께 찾기 위한 안내서입니다."
              : "This report does not judge who is right. It maps recurring scenes in your relationship and shows how to pass through the same moments with less hurt.",
          evidenceIds: ["meta.screen_plan", "meta.ranked_insights"],
          confidence: "high" as ConfidenceLevel,
        },
      ],
    },
  ];

  pushTrace(
    "opening.invitation",
    "ch0_opening",
    "prototype_bounded_narrative",
    chapters[0].blocks[2].content,
    ["meta.screen_plan", "meta.ranked_insights"],
    "Introduce report purpose without score/grade; tie to selected opening insight.",
  );

  const payload: RomanticV4PrototypePayload = {
    locale,
    variant: "complete",
    pair: { personA: "지민", personB: "정우", perspective: "A" },
    routeLabel: `/dev/romantic-v4-content-prototype?variant=complete&locale=${locale}`,
    preNarrativeContract,
    fourCeInfluenceAudit,
    fourCeSemanticPlan,
    canonicalReport,
    toc: [
      { chapter: "ch0_opening", label: "0. Opening: Relationship Signature" },
      { chapter: "ch1_who_we_are_together", label: "1. Who We Are Together" },
      { chapter: "ch2_you_and_me", label: "2. You and Me" },
      { chapter: "ch3_why_this_works", label: "3. Why This Works" },
      { chapter: "ch4_relationship_flow", label: "4. Relationship Flow" },
      { chapter: "ch5_when_we_miss_each_other", label: "5. When We Miss Each Other" },
      { chapter: "ch6_hidden_heart", label: "6. Hidden Heart" },
      { chapter: "ch7_repair_guide", label: "7. Repair Guide" },
      { chapter: "ch8_love_in_real_life", label: "8. Love in Real Life" },
      { chapter: "ch9_our_next_chapter", label: "9. Our Next Chapter" },
      { chapter: "ch10_closing", label: "10. Closing / Save and Share" },
    ],
    chapters,
    comparisonTable,
    comparisonTableEvidence,
    axisOverview,
    axisOverviewEvidence,
    selectedAxisInsights,
    axisSelectionAudit: {
      selectedReason:
        selectedAxisInsights.length >= 4
          ? "4개 이하 제한 중 상위 distinct 신호를 선택"
          : `${selectedAxisInsights.length}개만 충분한 증거를 충족`,
      rejected: axisSelection.rejected,
    },
    surveyEvidence,
    pairSajuProvenance: fourCeResult?.pairSajuProvenance,
    relationshipFlow: {
      title: "표현 속도 차이가 관계 루프를 만드는 방식",
      steps: [
        "지민은 마음이 불편해지는 순간 바로 이유를 확인하고 싶어 질문을 던집니다.",
        "정우는 그 질문의 속도를 압박으로 느끼고, 먼저 생각을 정리해야 안전하다고 느낍니다.",
        "그래서 정우는 답을 미루거나 짧게 끊어 말하며 시간을 확보합니다.",
        "지민은 그 침묵을 무관심이나 회피로 읽고, 감정이 더 커집니다.",
        "결국 대화 내용보다 말투가 중심이 되면서 친밀감은 줄고 갈등의 피로만 쌓입니다.",
      ],
      pivotPoint:
        "이 흐름이 바뀌는 지점은, 정우가 '30분 뒤에는 꼭 다시 이야기하자'고 시간을 정해 말하고, 지민이 그 시간까지 질문을 줄여 기다려 줄 때입니다. 그러면 갈등은 다시 이어지는 방향으로 흘러갑니다.",
      evidenceIds: [
        "canonical_projections.expression_speed",
        "section_3_conversation_patterns.conflict_situation.dialogue_table",
        "canonical_projections.recovery_speed",
      ],
    },
    conflicts: [
      {
        patternId: "conflict.speed-delay",
        trigger: "답장이나 답이 늦어지는 순간",
        whatIMeant: "지민: 지금 마음이 멀어진 건 아닌지 확인하고 싶었어.",
        whatYouHeard: "정우: 나를 몰아붙이고 당장 답하라고 요구하는 걸로 들렸어.",
        hiddenNeed: "지민은 연결이 끊기지 않았다는 확인을 원하고, 정우는 과부하 없이 정리할 시간을 원합니다.",
        betterWords: "지민: '지금 답을 강요하려는 건 아니고, 언제 다시 이야기할 수 있을지 알려줘.'",
        repairTiming: "갈등 직후 30~40분 정리 시간을 가진 뒤 다시 대화 시작하기.",
        evidenceIds: [
          "section_3_conversation_patterns.conflict_situation.dialogue_table",
          "canonical_projections.expression_speed",
          "canonical_projections.recovery_speed",
          "section_4_hidden_hearts",
        ],
        confidence: "high",
      },
      {
        patternId: "conflict.principle-tone",
        trigger: "원칙 설명이 감정 공감보다 먼저 나오는 순간",
        whatIMeant: "정우: 우리 둘 다 덜 다치려면 기준을 먼저 맞추자는 뜻이었어.",
        whatYouHeard: "지민: 내 감정보다 규칙이 더 중요하다고 말하는 것처럼 들렸어.",
        hiddenNeed: "정우는 대화의 구조가 있어야 안전하고, 지민은 먼저 감정이 인정되어야 대화가 열린다.",
        betterWords: "정우: '네가 속상한 건 먼저 이해해. 그다음에 우리가 지킬 기준을 같이 정해보자.'",
        repairTiming: "감정을 먼저 확인한 뒤, 같은 대화 안에서 기준을 협의하는 순서로 전환하기.",
        evidenceIds: [
          "canonical_projections.comparison_table.conflict",
          "canonical_projections.comparison_table.communication",
          "section_4_hidden_hearts",
        ],
        confidence: "medium",
      },
    ],
    hiddenHeart: {
      personA:
        "겉으로 보이는 지민의 반응은 질문이 빨라지고 톤이 높아지는 모습입니다. 실제 안쪽에는 '우리가 끊기지 않았다는 신호를 당장 받고 싶다'는 불안이 있습니다. 가장 깊은 두려움은 침묵이 곧 관계의 후퇴로 굳어지는 장면입니다. 그래서 지민에게 필요한 안심은 정답보다도 '나는 돌아온다'는 시간 약속입니다.",
      personB:
        "겉으로 보이는 정우의 반응은 말을 줄이고 잠시 물러나는 모습입니다. 실제 안쪽에는 '정리되지 않은 말로 너를 더 다치게 할까 봐 멈춘다'는 긴장이 있습니다. 가장 깊은 두려움은 성급한 한 문장이 관계를 장기 손상시키는 장면입니다. 정우에게 필요한 안심은 기다림이 처벌이 아니라 신뢰로 받아들여진다는 확인입니다.",
      personAOneLineForPartner: "정우야, 지금 조용해도 괜찮아. 돌아올 시간을 말해주면 나는 버려지지 않았다고 느껴.",
      personBOneLineForPartner: "지민아, 네 마음을 먼저 인정할게. 잠깐만 정리하고 꼭 이어서 말할게.",
      evidenceIds: [
        "section_4_hidden_hearts.a_hidden",
        "section_4_hidden_hearts.b_hidden",
        "canonical_projections.recovery_speed",
        "canonical_projections.reassurance_signal",
      ],
    },
    repairGuide: {
      sequence: [
        "목소리가 올라가기 시작하면, '잠깐, 지금은 감정이 앞서'라는 말을 함께 신호로 쓰기로 정해 둡니다.",
        "지민은 10분, 정우는 30~40분 정도 각자 마음을 정리할 시간을 기본으로 둡니다.",
        "먼저 마음이 정리된 사람이 '대화를 끝낸 게 아니야'라는 문장 한 줄을 먼저 보냅니다.",
        "다시 이야기를 시작할 때는 '내가 들은 건 ___인데 맞아?'처럼 사실을 확인하는 것부터 시작합니다.",
        "갈등 중에는 서로의 성격을 단정 짓는 말 대신, 지금 필요한 행동이나 부탁을 말로 전합니다.",
      ],
      sideBySide: {
        helpsA: [
          "침묵이 얼마나 이어질지 숫자로 알면 불안이 한결 줄어듭니다.",
          "먼저 내 감정을 알아주는 말을 들으면 마음의 방어가 누그러집니다.",
          "질문을 한 번에 하나씩 할 때 대화가 훨씬 편안해집니다.",
        ],
        helpsB: [
          "바로 해명하라는 압박이 줄면 더 정확하게 표현할 수 있게 됩니다.",
          "말하기 전에 핵심만 짧게 메모해 두면 부담이 줄어듭니다.",
          "비난이 아니라 부탁하는 말을 들을 때 더 빨리 마음을 열고 돌아올 수 있습니다.",
        ],
        together: [
          "갈등이 생기면 24시간 안에는 다시 이야기 나누기로 합니다.",
          "사과와 해결책은 따로따로 말하기로 합니다.",
          "마무리하는 말 없이 대화를 끝내지 않기로 합니다.",
        ],
      },
      evidenceIds: [
        "canonical_projections.recovery_speed",
        "canonical_projections.reassurance_signal",
        "section_3_conversation_patterns.conflict_situation",
        "canonical_projections.comparison_table",
      ],
    },
    realLifeScenes: [
      {
        sceneId: "scene.weekend-plan",
        sceneTitle: "주말 일정과 데이트 밀도",
        whatHappens: "지민은 가고 싶은 새로운 장소를 계속 일정에 넣고 싶어 하고, 정우는 한두 개 정도를 정해 여유 있게 즐기고 싶어 합니다.",
        whyForThisPair: "새로운 자극을 원하는 정도와 에너지를 쓰는 방식이 다르고, 계획을 세우는 성향도 서로 다르기 때문입니다.",
        whatACanDo: "새로운 일정은 최대 2개로 압축하고, 마지막 2시간은 정리 시간을 비워둡니다.",
        whatBCanDo: "루틴을 지키고 싶은 이유를 미리 이야기하고, 그중 하나는 새로운 시도를 받아들여 봅니다.",
        sharedAgreement: "데이트 전날 10분 계획 싱크를 하고 당일 변경 횟수 상한을 1회로 둡니다.",
        evidenceIds: [
          "meta.psych_match.axis_results.stimulation",
          "meta.psych_match.axis_results.energy_style",
          "meta.psych_match.axis_results.structure",
        ],
      },
      {
        sceneId: "scene.after-conflict-text",
        sceneTitle: "다툰 뒤 메시지 재개",
        whatHappens: "한쪽은 즉시 확인 문자를 보내고, 다른 쪽은 답변을 미루며 긴장이 커집니다.",
        whyForThisPair: "표현하는 속도와 회복하는 속도가 다르다 보니, 비슷한 상황에서 같은 어긋남이 반복됩니다.",
        whatACanDo: "재촉 대신 복귀 시간 확인 문장 하나만 보냅니다.",
        whatBCanDo: "정리 완료 시간을 숫자로 제시하고 그 시간에 반드시 복귀합니다.",
        sharedAgreement: "대화 중단 후 40분 이내 첫 복귀 신호를 보냅니다.",
        evidenceIds: [
          "canonical_projections.expression_speed",
          "canonical_projections.recovery_speed",
          "section_3_conversation_patterns.conflict_situation",
        ],
      },
      {
        sceneId: "scene.major-decision",
        sceneTitle: "큰 결정(이사/지출/휴가)",
        whatHappens: "지민은 빠른 확정을 선호하고, 정우는 검토와 합의 과정을 더 중시합니다.",
        whyForThisPair: "결정을 내리는 방식과 대화하는 방식 모두에서, 신중해지는 정도의 차이가 반복해서 나타나기 때문입니다.",
        whatACanDo: "결정 기한을 제시하되 선택지 2개를 함께 남깁니다.",
        whatBCanDo: "검토할 항목을 3개 이내로 줄여서, 결정이 너무 늦어지지 않도록 합니다.",
        sharedAgreement: "결정 회의는 1차(선호 공유)·2차(확정) 두 단계로 나눕니다.",
        evidenceIds: [
          "canonical_projections.comparison_table.decision",
          "canonical_projections.comparison_table.communication",
        ],
      },
    ],
    nextChapterMode: "maturity_direction",
    timingModeAudit: canonicalReport?.storyPlan.timing.available ? {
      mode: "timeline_active",
      evidenceIds: canonicalReport.storyPlan.timing.provenance.map(p => p.evidenceId),
      confidence: canonicalReport.storyPlan.timing.provenance[0]?.confidence || "high",
      safetyRulesPassed: ["no-safe-near-term-timing-evidence", "project-horizon-safety-checked"],
      renderedCopy: [...canonicalReport.storyPlan.timing.favorableWindows, ...canonicalReport.storyPlan.timing.cautionWindows],
      rationale: "section_6_timeline 기반 시계열 예측 렌더링 정상",
    } : {
      mode: "unavailable",
      evidenceIds: [],
      confidence: "low",
      safetyRulesPassed: [],
      renderedCopy: [],
      rationale: "section_6_timeline에 시계열 근거가 없어 예측형 모드를 사용하지 않음.",
    },
    nextChapter: [
      "지금 조율할 것: 갈등 시 복귀 시간 약속을 습관화해 침묵-오해 루프를 끊습니다.",
      "익숙해지며 좋아질 것: 서로의 애정 언어(말/행동) 번역 속도가 빨라져 같은 표현의 체감 차이가 줄어듭니다.",
      "시간이 지나도 지킬 것: 감정 인정 먼저, 기준 협의 나중의 순서를 무너뜨리지 않습니다.",
    ],
    closing: {
      concludingStatement:
        "두 사람의 차이는 관계의 약점이 아니라, 제대로 번역될 때 신뢰를 두껍게 만드는 재료입니다.",
      rememberA: "지민이 기억할 문장: 빠른 확인보다, 언제 돌아올지 아는 것이 더 큰 안심을 준다.",
      rememberB: "정우가 기억할 문장: 정확하게 정리해서 말하는 것도, 공감하는 말을 먼저 건넨 뒤에 훨씬 더 잘 전해진다.",
      shareLines: [
        "감정을 표현하는 속도는 다르지만, 다시 돌아오겠다는 약속이 있을 때 우리는 가장 단단해진다.",
        "말의 방식이 다른 만큼, 서로의 애정 언어를 번역해 줄수록 만족이 커진다.",
        "갈등에서 누가 이기고 지는지보다, 다시 이어지는 시간을 줄이는 것이 우리에게 더 중요하다.",
      ],
      reflectionQuestion: "다음 갈등에서 우리가 가장 먼저 지킬 한 문장을 지금 정한다면 무엇일까?",
    },
    insightOwnership: [
      {
        insightId: "insight.opening.signature",
        phenomenon: "관계 시그니처(깊어지는 계절)",
        evidenceIds: ["section_1_summary.relationship_name"],
        confidence: "high",
        primaryChapter: "ch0_opening",
        supportingChapters: [{ chapter: "ch10_closing", purpose: "정서적 결말 문장 앵커" }],
      },
      {
        insightId: "insight.opening.paradox",
        phenomenon: "표현 속도와 회복 속도의 핵심 역설",
        evidenceIds: [
          "canonical_projections.expression_speed",
          "canonical_projections.recovery_speed",
        ],
        confidence: "high",
        primaryChapter: "ch0_opening",
        supportingChapters: [{ chapter: "ch4_relationship_flow", purpose: "루프의 출발 조건 설명" }],
      },
      {
        insightId: "insight.together.identity",
        phenomenon: "속도 차이가 있지만 복귀 약속이 있을 때 안정되는 커플 정체성",
        evidenceIds: ["canonical_projections.expression_speed", "canonical_projections.recovery_speed"],
        confidence: "high",
        primaryChapter: "ch1_who_we_are_together",
        supportingChapters: [
          { chapter: "ch4_relationship_flow", purpose: "루프 전환점 설명" },
          { chapter: "ch7_repair_guide", purpose: "실행 규칙화" },
        ],
      },
      {
        insightId: "insight.daymaster.reciprocal.blocked",
        phenomenon: "A→B/B→A 상호 Day-Master 방향 해석 레이어는 CE 파생 부재로 차단",
        evidenceIds: [
          "canonical_projections.cross_chart_tension.hits[0].personA_pillar",
          "canonical_projections.cross_chart_tension.hits[0].personB_pillar",
          "missing:ce.day_master_reciprocal_directional_v1",
        ],
        confidence: "high",
        primaryChapter: "ch2_you_and_me",
        supportingChapters: [{ chapter: "ch3_why_this_works", purpose: "pair-level 결과만 제한적으로 참조" }],
      },
      {
        insightId: "insight.compare.conflict",
        phenomenon: "갈등 처리 방식(직면형↔원칙형)의 caution 차이",
        evidenceIds: ["canonical_projections.comparison_table.conflict"],
        confidence: "high",
        primaryChapter: "ch2_you_and_me",
        supportingChapters: [{ chapter: "ch5_when_we_miss_each_other", purpose: "trigger 배경 설명" }],
      },
      {
        insightId: "insight.compare.stress",
        phenomenon: "스트레스 처리(폭발형↔철수형) 차이",
        evidenceIds: ["canonical_projections.comparison_table.stress"],
        confidence: "high",
        primaryChapter: "ch2_you_and_me",
        supportingChapters: [{ chapter: "ch8_love_in_real_life", purpose: "메시지 재개 장면 실천화" }],
      },
      {
        insightId: "insight.compare.communication",
        phenomenon: "소통 톤/순서 차이(직접형↔배려형)",
        evidenceIds: ["canonical_projections.comparison_table.communication"],
        confidence: "high",
        primaryChapter: "ch2_you_and_me",
        supportingChapters: [{ chapter: "ch5_when_we_miss_each_other", purpose: "what you heard 경로 설명" }],
      },
      {
        insightId: "insight.compare.affection",
        phenomenon: "애정 언어 차이(정서 돌봄↔행동 증거)",
        evidenceIds: ["canonical_projections.comparison_table.affection"],
        confidence: "high",
        primaryChapter: "ch2_you_and_me",
        supportingChapters: [{ chapter: "ch3_why_this_works", purpose: "상호보완 메커니즘 설명" }],
      },
      {
        insightId: "insight.compare.decision",
        phenomenon: "의사결정 기준 차이(독립↔상의)",
        evidenceIds: ["canonical_projections.comparison_table.decision"],
        confidence: "medium",
        primaryChapter: "ch2_you_and_me",
        supportingChapters: [{ chapter: "ch8_love_in_real_life", purpose: "큰 결정 운영 규칙으로 전환" }],
      },
      {
        insightId: "insight.axis.structure",
        phenomenon: "계획 구조화 축의 큰 격차",
        evidenceIds: ["meta.psych_match.axis_results.structure"],
        confidence: "high",
        primaryChapter: "ch2_you_and_me",
        supportingChapters: [{ chapter: "ch8_love_in_real_life", purpose: "주말·결정 장면 실천화" }],
      },
      {
        insightId: "insight.axis.energy_style",
        phenomenon: "외향 에너지 축 격차",
        evidenceIds: ["meta.psych_match.axis_results.energy_style"],
        confidence: "high",
        primaryChapter: "ch2_you_and_me",
        supportingChapters: [{ chapter: "ch8_love_in_real_life", purpose: "주말·모임 장면 선택 근거" }],
      },
      {
        insightId: "insight.axis.stimulation",
        phenomenon: "자극추구 축 격차",
        evidenceIds: ["meta.psych_match.axis_results.stimulation"],
        confidence: "high",
        primaryChapter: "ch2_you_and_me",
        supportingChapters: [{ chapter: "ch8_love_in_real_life", purpose: "데이트 강도 조절 근거" }],
      },
      {
        insightId: "insight.axis.recognition",
        phenomenon: "인정욕구 보완 축",
        evidenceIds: ["meta.psych_match.axis_results.recognition"],
        confidence: "low",
        primaryChapter: "ch2_you_and_me",
        supportingChapters: [{ chapter: "ch1_who_we_are_together", purpose: "관계 시그널 보조 근거" }],
      },
      {
        insightId: "insight.hidden.a",
        phenomenon: "지민의 확인 욕구와 이탈 두려움",
        evidenceIds: ["section_4_hidden_hearts.a_hidden", "canonical_projections.reassurance_signal"],
        confidence: "high",
        primaryChapter: "ch6_hidden_heart",
        supportingChapters: [{ chapter: "ch5_when_we_miss_each_other", purpose: "오해 해석 체인 보강" }],
      },
      {
        insightId: "insight.hidden.b",
        phenomenon: "정우의 과부하 회피와 정리 시간 필요",
        evidenceIds: ["section_4_hidden_hearts.b_hidden", "canonical_projections.recovery_speed"],
        confidence: "high",
        primaryChapter: "ch6_hidden_heart",
        supportingChapters: [{ chapter: "ch7_repair_guide", purpose: "시간 규칙 수립" }],
      },
      {
        insightId: "insight.why.complement",
        phenomenon: "말 기반 안심 + 행동 기반 안정의 상호 보완",
        evidenceIds: ["section_4_special_bond", "canonical_projections.pair_ce_bonding", "section_4_relationship_frames"],
        confidence: "medium",
        primaryChapter: "ch3_why_this_works",
        supportingChapters: [{ chapter: "ch1_who_we_are_together", purpose: "정체성 장면 보강" }],
      },
      {
        insightId: "insight.flow.loop",
        phenomenon: "A 접근→B 해석→B 반응→A 해석 루프",
        evidenceIds: [
          "canonical_projections.expression_speed",
          "section_3_conversation_patterns.conflict_situation.dialogue_table",
        ],
        confidence: "high",
        primaryChapter: "ch4_relationship_flow",
        supportingChapters: [{ chapter: "ch5_when_we_miss_each_other", purpose: "패턴 분기 설명" }],
      },
      {
        insightId: "insight.conflict.speed-delay",
        phenomenon: "응답 지연 오해 패턴",
        evidenceIds: [
          "section_3_conversation_patterns.conflict_situation.dialogue_table",
          "canonical_projections.expression_speed",
        ],
        confidence: "high",
        primaryChapter: "ch5_when_we_miss_each_other",
        supportingChapters: [{ chapter: "ch7_repair_guide", purpose: "복귀 타이밍 규칙화" }],
      },
      {
        insightId: "insight.conflict.principle-tone",
        phenomenon: "원칙 선행 문장 오해 패턴",
        evidenceIds: [
          "canonical_projections.comparison_table.conflict",
          "canonical_projections.comparison_table.communication",
        ],
        confidence: "medium",
        primaryChapter: "ch5_when_we_miss_each_other",
        supportingChapters: [{ chapter: "ch7_repair_guide", purpose: "재개 문장 설계 근거" }],
      },
      {
        insightId: "insight.repair.sequence",
        phenomenon: "실행 가능한 5단계 수리 시퀀스",
        evidenceIds: [
          "canonical_projections.recovery_speed",
          "canonical_projections.reassurance_signal",
        ],
        confidence: "high",
        primaryChapter: "ch7_repair_guide",
        supportingChapters: [{ chapter: "ch10_closing", purpose: "기억 문장 행동화" }],
      },
      {
        insightId: "insight.scene.weekend-plan",
        phenomenon: "주말 계획 밀도 장면",
        evidenceIds: ["meta.psych_match.axis_results.structure", "meta.psych_match.axis_results.stimulation"],
        confidence: "high",
        primaryChapter: "ch8_love_in_real_life",
        supportingChapters: [{ chapter: "ch2_you_and_me", purpose: "축 해석의 생활 적용 사례" }],
      },
      {
        insightId: "insight.scene.after-conflict-text",
        phenomenon: "갈등 후 메시지 재개 장면",
        evidenceIds: ["canonical_projections.expression_speed", "canonical_projections.recovery_speed"],
        confidence: "high",
        primaryChapter: "ch8_love_in_real_life",
        supportingChapters: [{ chapter: "ch7_repair_guide", purpose: "재진입 규칙 적용 장면" }],
      },
      {
        insightId: "insight.scene.major-decision",
        phenomenon: "큰 결정 2단계 운영 장면",
        evidenceIds: ["canonical_projections.comparison_table.decision"],
        confidence: "medium",
        primaryChapter: "ch8_love_in_real_life",
        supportingChapters: [{ chapter: "ch2_you_and_me", purpose: "의사결정 row 후속 적용" }],
      },
      {
        insightId: "insight.next.maturity-direction",
        phenomenon: "타이밍 예측 대신 성숙 방향 제시",
        evidenceIds: ["section_6_timeline", "projectHorizon fate filter"],
        confidence: "high",
        primaryChapter: "ch9_our_next_chapter",
        supportingChapters: [{ chapter: "ch10_closing", purpose: "장기 보존 행동 리마인드" }],
      },
      {
        insightId: "insight.closing.memory-lines",
        phenomenon: "관계 종료 문장과 기억 문장",
        evidenceIds: ["opening.signature", "repairGuide", "comparisonTable"],
        confidence: "high",
        primaryChapter: "ch10_closing",
        supportingChapters: [],
      },
    ],
    evidenceTrace,
    omittedContent: omitted,
  };

  const syntheticChapters = [
    {
      chapter: "ch1_who_we_are_together" as ChapterId,
      title: "1. Who We Are Together",
      blocks: [
        {
          blockId: "together.narrative",
          label: "관계 정체성",
          sourceKind: "prototype_bounded_narrative" as SourceKind,
          content:
            "지민과 정우는 감정을 표현하는 속도가 다른 커플입니다. 지민은 관계의 온도를 빠르게 확인하며 연결을 지키고, 정우는 정리된 언어로 관계를 안정시키려 합니다. 그래서 처음에는 서로 다른 리듬 때문에 엇갈리지만, 그 리듬을 서로 번역해 주는 순간부터 회복의 질이 눈에 띄게 좋아집니다.",
          evidenceIds: [
            "canonical_projections.expression_speed",
            "canonical_projections.recovery_speed",
            "section_4_special_bond.only_together",
          ],
          confidence: "high" as ConfidenceLevel,
        },
        {
          blockId: "together.signals",
          label: "핵심 pair signals",
          sourceKind: "ce_derived" as SourceKind,
          content:
            "① 관계의 중심 리듬: 지민 주도·정우 수용 ② 버티게 해 주는 힘: 지민 경청 · 정우 행동 증거 ③ 의미 있는 긴장: 지민 급속 회복 · 정우 심층 숙성",
          evidenceIds: [
            "canonical_projections.balance_of_power",
            "canonical_projections.reassurance_signal",
            "canonical_projections.recovery_speed",
          ],
          confidence: "high" as ConfidenceLevel,
        },
        {
          blockId: "together.scene",
          label: "일상 장면",
          sourceKind: "prototype_bounded_narrative" as SourceKind,
          content:
            "퇴근 후 대화에서 지민이 먼저 마음의 매듭을 꺼내고, 정우가 바로 결론 대신 '듣고 정리해 내일 아침에 이어 말하자'고 제안하면, 두 사람은 같은 문제를 다르게 다루면서도 관계의 안전감은 지켜냅니다.",
          evidenceIds: [
            "section_3_conversation_patterns.conflict_situation.dialogue_table",
            "canonical_projections.recovery_speed",
          ],
          confidence: "high" as ConfidenceLevel,
        },
      ],
    },
    {
      chapter: "ch2_you_and_me" as ChapterId,
      title: "2. You and Me",
      blocks: [
        {
          blockId: "profile.a",
          label: "지민 1인칭 프로필",
          sourceKind: "existing_llm_narrative" as SourceKind,
          content:
            `나는 사랑을 느끼면 숨기지 않고 바로 표현하는 편이야. 하루를 같이 정리할 때도 먼저 말을 꺼내며 연결을 만들어. 내가 바라는 건 내 말의 내용이 완벽히 맞는지보다, 네가 내 마음을 듣고 있다는 신호야. 그리고 잘 말하지 못하는 애정은, 네가 해준 작은 행동을 오래 기억하고 고마워한다는 마음이야.${aCharacterMeaning ? ` 내 안쪽 리듬을 가장 잘 설명하는 문장은 "${aCharacterMeaning}"에 가까워.` : ""}`,
          evidenceIds: ["section_2_nature.a_nature.description", "section_2_nature.a_nature.together_change"],
          confidence: "high" as ConfidenceLevel,
        },
        {
          blockId: "profile.b",
          label: "정우 1인칭 프로필",
          sourceKind: "existing_llm_narrative" as SourceKind,
          content:
            `나는 사랑을 행동으로 증명하려는 편이야. 말하기 전에 한 번 더 생각하고, 오래 가는 문장을 고르려고 해. 내가 바라는 건 내 속도가 느려 보여도 관계를 소홀히 하는 게 아니라는 걸 알아주는 거야. 그리고 잘 말하지 못하는 애정은, 네가 편해지도록 내가 먼저 생활의 무게를 정리해 두고 싶다는 마음이야.${bCharacterMeaning ? ` 내 안쪽 리듬을 가장 잘 설명하는 문장은 "${bCharacterMeaning}"에 가까워.` : ""}`,
          evidenceIds: ["section_2_nature.b_nature.description", "section_2_nature.b_nature.together_change"],
          confidence: "high" as ConfidenceLevel,
        },
        {
          blockId: "daymaster.reciprocal.blocked",
          label: "상호 Day-Master 해석 레이어",
          sourceKind: "ce_derived" as SourceKind,
          content:
            "두 사람의 기본 기질 차이는 확인되지만, 방향성을 강하게 단정하는 문장은 근거가 충분할 때만 써야 합니다. 이번 보고서에서는 그 기준을 충족하지 않는 해석은 넣지 않았습니다.",
          evidenceIds: [
            "canonical_projections.cross_chart_tension.hits[0].personA_pillar",
            "canonical_projections.cross_chart_tension.hits[0].personB_pillar",
            "missing:ce.day_master_reciprocal_directional_v1",
          ],
          confidence: "high" as ConfidenceLevel,
        },
      ],
    },
    {
      chapter: "ch3_why_this_works" as ChapterId,
      title: "3. Why This Works",
      blocks: [
        {
          blockId: "why.a_to_b",
          label: "A가 B에게 주는 것",
          sourceKind: "prototype_bounded_narrative" as SourceKind,
          content:
            hasIndividualA && hasIndividualB && hasPairCe && hasRomanticCe
              ? "정우에게 어려운 부분은 감정이 빠르게 오갈 때도 관계가 지금 어떤 상태인지 놓치지 않는 것입니다. 지민이 먼저 감정을 말로 꺼내 주면, 정우는 짐작하지 않고 실제 신호를 받을 수 있습니다. 이런 도움은 갈등이 없을 때 오히려 더 잘 드러나서, 일상 대화나 데이트 계획, 하루를 정리하는 순간에 정우의 반응이 한결 안정적으로 빨라집니다."
              : "정우에게 어려운 부분은 감정의 신호를 놓치지 않는 것입니다. 지민이 먼저 마음을 표현해 주는 것이 정우가 관계의 지금 상태를 읽는 데 도움이 됩니다.",
          evidenceIds: [
            "section_4_special_bond.a_gives_b",
            "canonical_projections.expression_speed",
            "canonical_projections.pair_ce_bonding",
            "ce.individual.a",
            "ce.romantic.specific",
          ],
          confidence: "medium" as ConfidenceLevel,
        },
        {
          blockId: "why.b_to_a",
          label: "B가 A에게 주는 것",
          sourceKind: "prototype_bounded_narrative" as SourceKind,
          content:
            hasIndividualA && hasIndividualB && hasPairCe && hasRomanticCe
              ? "지민에게 어려운 부분은 감정이 크게 흔들리는 날에도 관계에 대한 안전감을 지키는 것입니다. 정우가 행동으로 보여주고 일정하게 돌아와 주면, 지민은 확인하려고 애써 목소리를 높이지 않아도 됩니다. 이런 도움은 평소에도 꾸준히 나타나서, 약속을 지키고 생활을 정리하는 작은 순간들 속에서 지민이 느끼는 불안이 줄고 친밀감이 차곡차곡 쌓입니다."
              : "지민에게 어려운 부분은 감정이 크게 흔들리는 날에도 안정감을 지키는 것입니다. 정우가 행동으로 보여주는 반응은 지민의 불안을 낮추는 방향으로 도움이 됩니다.",
          evidenceIds: [
            "section_4_special_bond.b_gives_a",
            "canonical_projections.reassurance_signal",
            "canonical_projections.pair_ce_bonding",
            "ce.individual.b",
            "ce.romantic.specific",
          ],
          confidence: "medium" as ConfidenceLevel,
        },
        ...(hasTogetherSemantic
          ? [
              {
                blockId: "why.together",
                label: "함께 만들게 되는 것",
                sourceKind: "prototype_bounded_narrative" as SourceKind,
                content:
                  `두 사람이 함께 있을 때만 생기는 힘은, '빠르게 마음을 확인하는 신호'와 '늦지 않게 돌아오겠다는 약속'을 동시에 지켜내는 힘입니다. 어느 한 사람만으로는 만들어지기 어려운 이 힘 덕분에, 감정이 크게 흔들리는 날에도 관계는 끊어지지 않고 다시 제자리를 찾습니다. 결국 오래가는 건 한때의 설렘이 아니라, 반복해서 쓸 수 있는 회복의 습관이며, 이 습관이 두 사람 관계를 지탱하는 가장 큰 힘이 됩니다.${asymmetryMeaning ? ` 이 비대칭의 실제 결은 "${asymmetryMeaning}"라는 문장으로 가장 잘 요약됩니다.` : ""}${pairSynthesisMeaning ? ` 그리고 두 사람이 함께 만들 수 있는 공통 기반은 "${pairSynthesisMeaning}"에 가깝습니다.` : ""}`,
                evidenceIds: [
                  "canonical_projections.pair_ce_bonding",
                  "canonical_projections.recovery_speed",
                  "canonical_projections.balance_of_power",
                  "canonical_projections.reassurance_signal",
                  "ce.pair.common",
                  "ce.romantic.specific",
                ],
                confidence: "medium" as ConfidenceLevel,
              },
            ]
          : []),
      ],
    },
    {
      chapter: "ch4_relationship_flow" as ChapterId,
      title: "4. Relationship Flow",
      blocks: [
        {
          blockId: "flow.summary",
          label: "반복되는 흐름",
          sourceKind: "prototype_bounded_narrative" as SourceKind,
          content:
            "두 사람의 갈등은 '문제가 생겼다'는 사실보다 '언제 말해야 안전한가'의 차이에서 더 자주 시작됩니다. 지민은 빠르게 연결을 확인하고 싶고, 정우는 먼저 문장을 정리해야 관계를 지킬 수 있다고 느낍니다. 그래서 같은 장면이 추궁과 회피처럼 보이지만, 실제로는 둘 다 관계를 지키려는 방식이 다를 뿐입니다.",
          evidenceIds: [
            "canonical_projections.expression_speed",
            "canonical_projections.recovery_speed",
            "section_3_conversation_patterns.conflict_situation.dialogue_table",
            "ce.romantic.specific",
            "ce.individual.a",
            "ce.individual.b",
          ],
          confidence: "high" as ConfidenceLevel,
        },
        {
          blockId: "flow.pivot.narrative",
          label: "전환점",
          sourceKind: "ce_derived" as SourceKind,
          content:
            "이 흐름이 바뀌는 지점은 누가 이겼는지가 아니라, 언제 다시 돌아올지 서로 아는가에 있습니다. 정우가 돌아올 시간을 분명히 말하고, 지민이 그 시간까지 질문을 줄이면 대화는 서로를 방어하는 자리에서 다시 이어지는 자리로 바뀝니다.",
          evidenceIds: [
            "canonical_projections.recovery_speed",
            "canonical_projections.reassurance_signal",
            "ce.romantic.specific",
            "ce.pair.common",
          ],
          confidence: "high" as ConfidenceLevel,
        },
      ],
    },
    {
      chapter: "ch5_when_we_miss_each_other" as ChapterId,
      title: "5. When We Miss Each Other",
      blocks: [
        {
          blockId: "miss.pattern.one",
          label: "자주 어긋나는 순간 1",
          sourceKind: "prototype_bounded_narrative" as SourceKind,
          content:
            "답이 늦어질 때 지민은 '마음이 멀어졌나?'를 먼저 묻고, 정우는 '지금은 틀린 말을 할까 봐 멈춘다'를 먼저 겪습니다. 이때 지민의 확인 요청은 정우에게 압박처럼 들리고, 정우의 침묵은 지민에게 단절처럼 읽힙니다.",
          evidenceIds: [
            "section_3_conversation_patterns.conflict_situation.dialogue_table",
            "section_4_hidden_hearts",
            "canonical_projections.expression_speed",
            "canonical_projections.recovery_speed",
            "ce.individual.a",
            "ce.individual.b",
            "ce.romantic.specific",
          ],
          confidence: "high" as ConfidenceLevel,
        },
        {
          blockId: "miss.pattern.two",
          label: "자주 어긋나는 순간 2",
          sourceKind: "prototype_bounded_narrative" as SourceKind,
          content:
            "정우가 원칙을 먼저 설명하면 지민은 '내 감정은 뒤로 밀렸다'고 느끼기 쉽습니다. 반대로 지민이 감정을 먼저 올리면 정우는 '대화의 구조가 사라졌다'고 느끼기 쉽습니다. 둘 다 관계를 지키려는 행동인데, 순서가 다르다는 사실이 빠지면 같은 싸움이 반복됩니다.",
          evidenceIds: [
            "canonical_projections.comparison_table.conflict",
            "canonical_projections.comparison_table.communication",
            "section_4_hidden_hearts",
            "ce.pair.common",
            "ce.romantic.specific",
          ],
          confidence: "medium" as ConfidenceLevel,
        },
      ],
    },
    {
      chapter: "ch6_hidden_heart" as ChapterId,
      title: "6. Hidden Heart",
      blocks: [
        {
          blockId: "hidden.a.inner-need",
          label: "지민의 안쪽 신호",
          sourceKind: "prototype_bounded_narrative" as SourceKind,
          content:
            "겉으로 보이는 지민의 빠른 질문은 통제를 위한 말이 아니라 연결이 끊기지 않았다는 확인 요청에 가깝습니다. 지민에게 가장 어려운 장면은 문제가 생긴 순간보다 답 없는 공백이 길어지는 순간입니다.",
          evidenceIds: [
            "section_4_hidden_hearts.a_hidden",
            "canonical_projections.reassurance_signal",
            "ce.individual.a",
            "ce.romantic.specific",
          ],
          confidence: "high" as ConfidenceLevel,
        },
        {
          blockId: "hidden.b.inner-need",
          label: "정우의 안쪽 신호",
          sourceKind: "prototype_bounded_narrative" as SourceKind,
          content:
            "겉으로 보이는 정우의 침묵은 무관심이라기보다 관계를 해치지 않는 문장을 고르기 위한 정리 시간에 가깝습니다. 정우에게 가장 어려운 장면은 갈등 자체보다 감정이 큰 상태에서 즉시 답을 내야 하는 압박입니다.",
          evidenceIds: [
            "section_4_hidden_hearts.b_hidden",
            "canonical_projections.recovery_speed",
            "ce.individual.b",
            "ce.romantic.specific",
          ],
          confidence: "high" as ConfidenceLevel,
        },
      ],
    },
    {
      chapter: "ch7_repair_guide" as ChapterId,
      title: "7. Repair Guide",
      blocks: [
        {
          blockId: "repair.core-sequence",
          label: "재연결 기본 순서",
          sourceKind: "ce_derived" as SourceKind,
          content:
            "수리의 핵심은 속도 맞춤입니다. 감정이 올라가면 먼저 멈춤 신호를 쓰고, 정우에게 필요한 정리 시간을 숫자로 합의한 뒤, 지민이 불안해지지 않도록 복귀 예고 문장을 반드시 남깁니다. 재대화는 '누가 맞았나'보다 '내가 들은 네 의도는 이것이 맞나'로 시작할 때 손상이 줄어듭니다.",
          evidenceIds: [
            "canonical_projections.recovery_speed",
            "canonical_projections.reassurance_signal",
            "section_3_conversation_patterns.conflict_situation",
            "ce.romantic.specific",
            "ce.pair.common",
          ],
          confidence: "high" as ConfidenceLevel,
        },
        {
          blockId: "repair.personalized-handles",
          label: "각자에게 특히 중요한 포인트",
          sourceKind: "prototype_bounded_narrative" as SourceKind,
          content:
            "지민에게는 '언제 다시 말할지'가 감정 진정의 핵심이고, 정우에게는 '지금 당장 완벽한 답을 내지 않아도 된다'는 여지가 핵심입니다. 이 두 조건이 동시에 보장될 때, 갈등은 관계 손실이 아니라 관계 학습으로 전환됩니다.",
          evidenceIds: [
            "canonical_projections.recovery_speed",
            "canonical_projections.reassurance_signal",
            "section_4_hidden_hearts",
            "ce.individual.a",
            "ce.individual.b",
            "ce.romantic.specific",
          ],
          confidence: "high" as ConfidenceLevel,
        },
      ],
    },
    {
      chapter: "ch8_love_in_real_life" as ChapterId,
      title: "8. Love in Real Life",
      blocks: [
        {
          blockId: "real-life.weekend",
          label: "주말 계획에서의 실제 작동",
          sourceKind: "prototype_bounded_narrative" as SourceKind,
          content:
            "데이트에서는 지민이 새로움을 더 넣고 싶어 하고, 정우는 과부하 없는 밀도를 지키고 싶어 합니다. 둘 중 하나가 틀린 것이 아니라 회복 방식이 다른 것입니다. 계획을 짤 때 '새 시도 1개 + 안전 루틴 1개'처럼 함께 지킬 비율을 정하면 만족도가 안정됩니다.",
          evidenceIds: [
            "meta.psych_match.axis_results.stimulation",
            "meta.psych_match.axis_results.energy_style",
            "meta.psych_match.axis_results.structure",
            "ce.pair.common",
            "ce.romantic.specific",
          ],
          confidence: "high" as ConfidenceLevel,
        },
        {
          blockId: "real-life.after-conflict",
          label: "다툰 뒤 다시 연결하는 실제 작동",
          sourceKind: "prototype_bounded_narrative" as SourceKind,
          content:
            "갈등 직후에는 답의 정답보다 복귀의 약속이 먼저입니다. 지민은 재촉 대신 복귀 시간을 확인하는 한 문장을 쓰고, 정우는 그 시간을 숫자로 약속한 뒤 반드시 지킵니다. 이 작은 규칙 하나가 '불안 확대'를 '신뢰 축적'으로 바꾸는 분기점이 됩니다.",
          evidenceIds: [
            "canonical_projections.expression_speed",
            "canonical_projections.recovery_speed",
            "section_3_conversation_patterns.conflict_situation",
            "ce.romantic.specific",
            "ce.individual.a",
            "ce.individual.b",
          ],
          confidence: "high" as ConfidenceLevel,
        },
      ],
    },
    {
      chapter: "ch9_our_next_chapter" as ChapterId,
      title: "9. Our Next Chapter",
      blocks: [
        {
          blockId: "next.mode",
          label: "Mode",
          sourceKind: "ce_derived" as SourceKind,
          content: "Maturity-direction mode",
          evidenceIds: ["section_6_timeline (safety check)", "projectHorizon fate filter"],
          confidence: "high" as ConfidenceLevel,
        },
      ],
    },
    {
      chapter: "ch10_closing" as ChapterId,
      title: "10. Closing / Save and Share",
      blocks: [
        {
          blockId: "closing.statement",
          label: "결론 문장",
          sourceKind: "prototype_bounded_narrative" as SourceKind,
          content: payload.closing.concludingStatement,
          evidenceIds: ["opening.signature", "repairGuide", "hiddenHeart"],
          confidence: "high" as ConfidenceLevel,
        },
      ],
    },
  ];

  payload.chapters.push(...syntheticChapters);
  for (const chapter of syntheticChapters) {
    for (const block of chapter.blocks) {
      pushTrace(
        block.blockId,
        chapter.chapter,
        block.sourceKind,
        block.content,
        block.evidenceIds,
        `Compose ${chapter.chapter} block from mapped evidence with no new analysis claims.`,
      );
    }
  }

  const extraTraceRows: EvidenceTraceRow[] = [
    {
      blockId: "flow.steps",
      chapter: "ch4_relationship_flow",
      sourceKind: "ce_derived",
      text: payload.relationshipFlow.steps.join(" "),
      evidenceIds: payload.relationshipFlow.evidenceIds,
      plannerInstruction: "Explain one representative loop from expression-speed and conflict dialogue evidence.",
    },
    {
      blockId: "flow.pivot",
      chapter: "ch4_relationship_flow",
      sourceKind: "prototype_bounded_narrative",
      text: payload.relationshipFlow.pivotPoint,
      evidenceIds: payload.relationshipFlow.evidenceIds,
      plannerInstruction: "Name actionable loop pivot without introducing unsupported causality.",
    },
    ...payload.conflicts.map((c) => ({
      blockId: `conflict.${c.patternId}`,
      chapter: "ch5_when_we_miss_each_other" as ChapterId,
      sourceKind: "prototype_bounded_narrative" as SourceKind,
      text: [
        c.trigger,
        c.whatIMeant,
        c.whatYouHeard,
        c.hiddenNeed,
        c.betterWords,
        c.repairTiming,
      ].join(" "),
      evidenceIds: c.evidenceIds,
      plannerInstruction:
        "Fill trigger→meant→heard→hidden-need→better-words→repair-timing chain only from supplied conflict/hidden-heart evidence.",
    })),
    {
      blockId: "hidden.heart.full",
      chapter: "ch6_hidden_heart",
      sourceKind: "prototype_bounded_narrative",
      text: `${payload.hiddenHeart.personA} ${payload.hiddenHeart.personB}`,
      evidenceIds: payload.hiddenHeart.evidenceIds,
      plannerInstruction: "Render visible reaction vs inner fear vs reassurance need in first-person-safe voice.",
    },
    {
      blockId: "repair.sequence",
      chapter: "ch7_repair_guide",
      sourceKind: "ce_derived",
      text: payload.repairGuide.sequence.join(" "),
      evidenceIds: payload.repairGuide.evidenceIds,
      plannerInstruction: "Produce executable five-step recovery sequence with timing and re-entry sentence.",
    },
    ...payload.realLifeScenes.map((s) => ({
      blockId: `scene.${s.sceneId}`,
      chapter: "ch8_love_in_real_life" as ChapterId,
      sourceKind: "prototype_bounded_narrative" as SourceKind,
      text: `${s.sceneTitle} ${s.whatHappens} ${s.whyForThisPair} ${s.whatACanDo} ${s.whatBCanDo} ${s.sharedAgreement}`,
      evidenceIds: s.evidenceIds,
      plannerInstruction:
        "Select exactly three high-relevance life scenes and attach pair-specific actions.",
    })),
    {
      blockId: "next.chapter.direction",
      chapter: "ch9_our_next_chapter",
      sourceKind: "ce_derived",
      text: payload.nextChapter.join(" "),
      evidenceIds: ["section_6_timeline", "projectHorizon fate filter", "repairGuide", "hiddenHeart"],
      plannerInstruction: "Use maturity-direction mode when timing confidence is insufficient.",
    },
    {
      blockId: "closing.share.lines",
      chapter: "ch10_closing",
      sourceKind: "prototype_bounded_narrative",
      text: payload.closing.shareLines.join(" "),
      evidenceIds: ["opening.signature", "repairGuide", "comparisonTable", "axisInsights"],
      plannerInstruction: "End with one conclusive line + memory lines + share lines, without full-summary repetition.",
    },
  ];
  payload.evidenceTrace.push(...extraTraceRows);

  omitted.push(
    {
      chapter: "ch2_you_and_me",
      omittedField: "Reciprocal Day-Master directional interpretation",
      reason:
        "일주 문자열은 있으나 A→B/B→A 방향 해석을 반환하는 안전한 CE 파생 필드가 없어 본문 해석을 생성하지 않음.",
      missingEvidence: ["ce.day_master_reciprocal_directional_v1"],
    },
    {
      chapter: "ch5_when_we_miss_each_other",
      omittedField: "meant/heard from independent CE derivation",
      reason: "독립 CE 파생기가 없어 conflict dialogue + hidden heart로만 제한 구성.",
      missingEvidence: ["ce.conflict_meant_heard_derivation_v1"],
    },
    {
      chapter: "ch9_our_next_chapter",
      omittedField: "연도 기반 3y/5y/10y 전망",
      reason: "타이밍 안전 규칙을 만족하는 증거 부족으로 maturity-direction 모드 선택.",
      missingEvidence: ["timeline.safe_timing_signal.high_confidence"],
    },
  );

  return payload;
}

function createVariantSelectionCheck(
  locale: PrototypeLocale,
  variant: PrototypeVariant,
  surveyInput?: RomanticV4SurveyInput,
  pairSajuInput?: RomanticV4PairSajuInput,
): RomanticV4PrototypePayload {
  const report = fixtureOf(variant);
  const vm = buildRomanticExperienceViewModel({
    report,
    nameA: "지민",
    nameB: "정우",
    myName: "지민",
    partnerName: "정우",
    viewerIsReportA: true,
    locale,
  });
  const needsFourCe = surveyInput?.mode === "real" || pairSajuInput?.mode === "real";
  const fourCeResult = needsFourCe ? buildActualFourCeContract(locale, pairSajuInput) : null;
  const axisData = resolveV4AxisData({
    locale,
    variant,
    viewerIsReportA: true,
    fixtureAxisResults: vm.axisComparison.axisResults,
    surveyInput,
    romanticSignalsA: fourCeResult?.romanticSignalsA,
    romanticSignalsB: fourCeResult?.romanticSignalsB,
  });
  const {
    comparisonTable: comparison,
    usedRows,
    axisOverview,
    axisOverviewEvidence,
    comparisonTableEvidence,
    surveyEvidence,
  } = axisData;
  const axisSelection = selectAxisInsights({
    locale,
    axisResults: axisOverview,
    usedRows,
    evidenceStatus: axisData.evidenceStatus,
  });
  const axis = axisSelection.selected;
  const selectedConflict = vm.conflictTranslation.rows.length > 0 ? ["speed-delay"] : [];
  const selectedScenes = variant === "minimal"
    ? ["after-conflict-text"]
    : variant === "tension"
      ? ["weekend-plan", "after-conflict-text", "major-decision"]
      : ["weekend-plan", "after-conflict-text", "major-decision"];
  const horizonEvidence = vm.horizon.evidence.map((e) => e.path);
  const hasSafeNearTerm =
    vm.horizon.available &&
    vm.horizon.waypoints.some((w) => w.period.includes("지금") || w.period.includes("1년"));
  const mode: "timing_supported" | "maturity_direction" = hasSafeNearTerm
    ? "timing_supported"
    : "maturity_direction";

  return {
    locale,
    variant,
    pair: { personA: "지민", personB: "정우", perspective: "A" },
    routeLabel: `/dev/romantic-v4-content-prototype?variant=${variant}&locale=${locale}`,
    toc: [],
    chapters: [],
    comparisonTable: comparison,
    comparisonTableEvidence,
    axisOverview,
    axisOverviewEvidence,
    selectedAxisInsights: axis,
    axisSelectionAudit: {
      selectedReason:
        axis.length > 0
          ? `${axis.length}개만 증거·비중복 규칙을 통과`
          : "선택 기준을 통과한 축 없음",
      rejected: axisSelection.rejected,
    },
    surveyEvidence,
    pairSajuProvenance: fourCeResult?.pairSajuProvenance,
    relationshipFlow: { title: "", steps: [], pivotPoint: "", evidenceIds: [] },
    conflicts: [],
    hiddenHeart: {
      personA: "",
      personB: "",
      personAOneLineForPartner: "",
      personBOneLineForPartner: "",
      evidenceIds: [],
    },
    repairGuide: { sequence: [], sideBySide: { helpsA: [], helpsB: [], together: [] }, evidenceIds: [] },
    realLifeScenes: [],
    nextChapterMode: mode,
    timingModeAudit: {
      mode,
      evidenceIds: horizonEvidence,
      confidence: vm.horizon.confidence,
      safetyRulesPassed: hasSafeNearTerm
        ? [
            "section_6_timeline waypoint exists",
            "fate-language filter passed",
            "near-term period present",
          ]
        : ["near-term safe waypoint not available"],
      renderedCopy: hasSafeNearTerm
        ? vm.horizon.waypoints.map((w) => `${w.period}: ${w.body}`)
        : [],
      rationale: hasSafeNearTerm
        ? "가까운 시점 텍스트가 존재하고 운명/단정 표현 필터를 통과하여 timing_supported 채택."
        : "근거리 타이밍 근거가 부족해 maturity_direction으로 강등.",
    },
    nextChapter: [],
    closing: { concludingStatement: "", rememberA: "", rememberB: "", shareLines: [], reflectionQuestion: "" },
    insightOwnership: [],
    evidenceTrace: [],
    omittedContent: [],
    antiOverfitCheck: {
      variant,
      selectedComparisonRows: comparison.map((r) => r.rowId),
      selectedAxisInsights: axis.map((a) => a.axisKey),
      selectedConflictPatterns: selectedConflict,
      selectedRealLifeScenes: selectedScenes,
      nextChapterMode: mode,
      omitted: [
        ...(!vm.conflictTranslation.available ? ["conflict patterns"] : []),
        ...(!vm.hiddenHeart.available ? ["hidden heart depth"] : []),
      ],
      evidenceGaps: [
        ...(!vm.conflictTranslation.available ? ["section_3_conversation_patterns.conflict_situation"] : []),
        ...(!vm.hiddenHeart.available ? ["section_4_hidden_hearts"] : []),
      ],
      axisRejected: axisSelection.rejected,
    },
  };
}

export function buildRomanticV4PrototypePayload(
  variant: PrototypeVariant,
  locale: PrototypeLocale,
  options?: {
    contractOverride?: RomanticNarrativeInputContract;
    /** mode "real" wires axisOverview to actual CurrentSelfProfile A/B; omitted = dev_fixture. */
    surveyInput?: RomanticV4SurveyInput;
    /** mode "real" wires Saju/CE to actual A/B birth data; omitted = dev-fixture demo pair. */
    pairSajuInput?: RomanticV4PairSajuInput;
  },
): RomanticV4PrototypePayload {
  if (variant === "complete")
    return createCompletePayload(
      locale,
      options?.contractOverride,
      options?.surveyInput,
      options?.pairSajuInput,
    );
  return createVariantSelectionCheck(locale, variant, options?.surveyInput, options?.pairSajuInput);
}
