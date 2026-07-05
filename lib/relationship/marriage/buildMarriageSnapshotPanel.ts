import type { MarriageRuleContext } from "./buildMarriageRuleContext";
import { getTriScoreKindConfig } from "@/lib/relationship/triScoreSnapshot/kinds";
import type {
  PersonSnapshotGauges,
  RelationshipTopicGauge,
  TriScoreSnapshotPanel,
} from "@/lib/relationship/triScoreSnapshot/types";
import type { SajuDataForIntegrated } from "@/lib/report/formatInnateAnalysisForIntegrated";
import { PRIMARY_AXIS_LABELS } from "@/lib/v2/framework/axisLabels";
import type { PrimaryAxisKey, PrimaryAxesScores } from "@/lib/v2/survey/types";
import { buildNeutralV2Profile } from "@/lib/v2/survey/neutralProfile";
import { REF_HEAVENLY_STEMS } from "@/lib/hardcoded/sajuReferenceData";
import { sajuJsonToPillars } from "@/lib/saju/pairChartAnalysis";
import { getDayStemCode } from "@/lib/saju/romanticSajuDerivations";
import { chartEnergyProfile } from "@/lib/saju/marriageAnalysis";
import { buildHomeLifeDnaProfile } from "./homeLifeLanguage";
import {
  buildMarriageSnapshotNarrative,
  buildMarriageSnapshotNarrativeFromGauges,
} from "./buildMarriageSnapshotNarrative";

const SNAPSHOT_AXIS_KEYS: PrimaryAxisKey[] = [
  "connection",
  "stability",
  "growth",
  "control",
  "adaptability",
];

function axesFromFallback(fallback: PrimaryAxesScores) {
  return SNAPSHOT_AXIS_KEYS.map((key) => ({
    key,
    label: PRIMARY_AXIS_LABELS[key],
    value: Math.max(0, Math.min(100, Math.round(fallback[key] ?? 50))),
  }));
}

function stemCodeFromSaju(sajuJson: SajuDataForIntegrated): string | null {
  try {
    const pillars = sajuJsonToPillars(
      sajuJson.saju as Required<NonNullable<typeof sajuJson.saju>>,
    );
    return getDayStemCode(pillars);
  } catch {
    return null;
  }
}

function fallbackAxesFromMarriage(
  ctx: MarriageRuleContext,
  who: "a" | "b",
): PrimaryAxesScores {
  const scores = { ...buildNeutralV2Profile().primary_axes };
  const sajuJson = who === "a" ? ctx.sajuJsonA : ctx.sajuJsonB;
  const counts = who === "a" ? ctx.tenGod.countsA : ctx.tenGod.countsB;
  const chart = who === "a" ? ctx.marriagePairAnalysis.chartA : ctx.marriagePairAnalysis.chartB;
  const energy = chartEnergyProfile(chart);

  const stemCode = stemCodeFromSaju(sajuJson);
  const ref = stemCode
    ? REF_HEAVENLY_STEMS.find((r) => r.code === stemCode)
    : null;

  if (energy.isHomebody) {
    scores.stability = Math.min(82, scores.stability + 10);
    scores.connection = Math.min(78, scores.connection + 6);
  }
  if (energy.isOutdoorsy) {
    scores.growth = Math.min(80, scores.growth + 8);
    scores.adaptability = Math.min(78, scores.adaptability + 8);
  }
  if (ref?.yin_yang === "yin") {
    scores.connection = Math.min(82, scores.connection + 6);
  } else if (ref?.yin_yang === "yang") {
    scores.control = Math.min(78, scores.control + 5);
  }

  const p = who === "a" ? ctx.tenGod.profileA : ctx.tenGod.profileB;
  if (p.wealthOfficer >= 2) scores.control = Math.min(82, scores.control + 8);
  if (p.food >= 2) scores.connection = Math.min(80, scores.connection + 6);
  if (p.seal >= 2) scores.stability = Math.min(78, scores.stability + 5);

  void counts;
  return scores;
}

function axesAreNearlyIdentical(
  a: PersonSnapshotGauges["axes"],
  b: PersonSnapshotGauges["axes"],
): boolean {
  if (a.length !== b.length) return false;
  return a.every((bar, i) => Math.abs(bar.value - (b[i]?.value ?? 0)) <= 3);
}

function buildMarriageKeywords(ctx: MarriageRuleContext): string[] {
  const raw = new Set<string>();
  raw.add(`홈 ${ctx.grade}`);
  raw.add(ctx.householdDnaA.lifestyle_title.split(" ")[0] ?? "Home");
  raw.add(ctx.householdDnaB.lifestyle_title.split(" ")[0] ?? "Partner");
  if (ctx.marriagePairAnalysis.dayBranch.bedFitLevel === "excellent") {
    raw.add("침실 핏");
  }
  if (ctx.masterScores.benefit >= 60) raw.add("라이프 시너지");
  if (ctx.masterScores.risk >= 55) raw.add("홈 리스크");
  return [...raw].filter((k) => k.length >= 2).slice(0, 8);
}

export function buildMarriageSnapshotPanel(
  ctx: MarriageRuleContext,
  headline: {
    gaugeLabel: string;
    representativeLine: string;
    keywords?: string[];
  },
): TriScoreSnapshotPanel {
  const topicLabels = getTriScoreKindConfig("cohabitation").topics;
  const fallbackA = fallbackAxesFromMarriage(ctx, "a");
  const fallbackB = fallbackAxesFromMarriage(ctx, "b");

  const personA: PersonSnapshotGauges = {
    nickname: ctx.nicknameA,
    metaphor: buildHomeLifeDnaProfile(
      ctx.nicknameA,
      ctx.sajuJsonA,
      ctx.tenGod.countsA,
    ).life_values.split(".")[0] ?? "",
    axes: axesFromFallback(fallbackA),
  };
  const personB: PersonSnapshotGauges = {
    nickname: ctx.nicknameB,
    metaphor: buildHomeLifeDnaProfile(
      ctx.nicknameB,
      ctx.sajuJsonB,
      ctx.tenGod.countsB,
    ).life_values.split(".")[0] ?? "",
    axes: axesFromFallback(fallbackB),
  };

  const personAxesSource: TriScoreSnapshotPanel["personAxesSource"] =
    axesAreNearlyIdentical(personA.axes, personB.axes)
      ? "hidden"
      : "saju_estimate";

  const keywords = headline.keywords?.length
    ? headline.keywords
    : buildMarriageKeywords(ctx);

  const m = ctx.masterScores;

  const relationshipGauges: RelationshipTopicGauge[] = [
    {
      topic: "intimacy",
      label: topicLabels.find((t) => t.topic === "intimacy")!.cardTitle,
      activation: m.activation,
      benefit: m.activation,
      risk: 0,
    },
    {
      topic: "stability",
      label: topicLabels.find((t) => t.topic === "stability")!.cardTitle,
      activation: m.benefit,
      benefit: m.benefit,
      risk: 0,
    },
    {
      topic: "conflict",
      label: topicLabels.find((t) => t.topic === "conflict")!.cardTitle,
      activation: 0,
      benefit: 0,
      risk: m.risk,
    },
  ];

  const narrative = buildMarriageSnapshotNarrative({ ctx, relationshipGauges });

  return {
    grade: ctx.grade,
    gaugeLabel: headline.gaugeLabel,
    representativeLine: headline.representativeLine,
    keywords,
    relationshipGauges,
    personA,
    personB,
    personAxesSource,
    narrative,
  };
}

export function hydrateMarriageSnapshotPanel(
  panel: TriScoreSnapshotPanel,
): TriScoreSnapshotPanel {
  if (panel.narrative?.topics?.length) return panel;
  return {
    ...panel,
    personAxesSource: panel.personAxesSource ?? "hidden",
    narrative: buildMarriageSnapshotNarrativeFromGauges(panel.relationshipGauges),
  };
}
