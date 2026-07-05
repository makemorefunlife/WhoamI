import type { WorkColleagueContext } from "./buildWorkColleagueContext";
import { polishRomanticDisplayText } from "@/lib/relationship/romanticEverydayText";
import { resolveWorkColleagueStylePhrase } from "./officeLanguage";
import { REF_HEAVENLY_STEMS } from "@/lib/hardcoded/sajuReferenceData";
import { sajuJsonToPillars } from "@/lib/saju/pairChartAnalysis";
import { getDayStemCode } from "@/lib/saju/romanticSajuDerivations";
import { PRIMARY_AXIS_LABELS } from "@/lib/v2/framework/axisLabels";
import type { PrimaryAxisKey, PrimaryAxesScores } from "@/lib/v2/survey/types";
import { buildNeutralV2Profile } from "@/lib/v2/survey/neutralProfile";
import { getTriScoreKindConfig } from "@/lib/relationship/triScoreSnapshot/kinds";
import type {
  PersonSnapshotGauges,
  RelationshipTopicGauge,
  TriScoreSnapshotPanel,
} from "@/lib/relationship/triScoreSnapshot/types";
import type { SajuDataForIntegrated } from "@/lib/report/formatInnateAnalysisForIntegrated";
import {
  buildWorkSnapshotNarrative,
  buildWorkSnapshotNarrativeFromGauges,
} from "./buildWorkSnapshotNarrative";

const SNAPSHOT_AXIS_KEYS: PrimaryAxisKey[] = [
  "connection",
  "stability",
  "growth",
  "control",
  "adaptability",
];

const ELEMENT_AXIS_BIAS: Record<
  string,
  Partial<Record<PrimaryAxisKey, number>>
> = {
  fire: { connection: 10, growth: 6 },
  earth: { stability: 12, control: 8 },
  wood: { growth: 10, adaptability: 5 },
  metal: { control: 10, stability: 5 },
  water: { connection: 6, adaptability: 10 },
};

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

function fallbackAxesFromSaju(
  ctx: WorkColleagueContext,
  who: "a" | "b",
): PrimaryAxesScores {
  const scores = { ...buildNeutralV2Profile().primary_axes };
  const sajuJson = who === "a" ? ctx.sajuJsonA : ctx.sajuJsonB;
  const strength = who === "a" ? ctx.strengthA : ctx.strengthB;
  const tenGods = who === "a" ? ctx.tenGodsA : ctx.tenGodsB;

  const stemCode = stemCodeFromSaju(sajuJson);
  const ref = stemCode
    ? REF_HEAVENLY_STEMS.find((r) => r.code === stemCode)
    : null;
  const element = ref?.element as string | undefined;

  if (element && ELEMENT_AXIS_BIAS[element]) {
    for (const [key, delta] of Object.entries(ELEMENT_AXIS_BIAS[element]!)) {
      const axis = key as PrimaryAxisKey;
      scores[axis] = Math.min(85, scores[axis] + (delta ?? 0));
    }
  }

  if (ref?.yin_yang === "yang") {
    scores.control = Math.min(78, scores.control + 4);
    scores.growth = Math.min(78, scores.growth + 3);
  } else if (ref?.yin_yang === "yin") {
    scores.connection = Math.min(78, scores.connection + 4);
    scores.adaptability = Math.min(78, scores.adaptability + 3);
  }

  if (strength.label.includes("신강")) {
    scores.control = Math.min(82, scores.control + 8);
    scores.stability = Math.min(80, scores.stability + 5);
  } else if (strength.label.includes("신약")) {
    scores.connection = Math.min(82, scores.connection + 8);
    scores.adaptability = Math.min(78, scores.adaptability + 6);
  }

  const godTotal = Object.values(tenGods).reduce((s, n) => s + n, 0);
  if (godTotal >= 4) {
    scores.growth = Math.min(80, scores.growth + 5);
  }

  const topGod = Object.entries(tenGods).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (topGod?.includes("식신") || topGod?.includes("상관")) {
    scores.connection = Math.min(82, scores.connection + 5);
    scores.adaptability = Math.min(78, scores.adaptability + 4);
  }
  if (topGod?.includes("정관") || topGod?.includes("편관")) {
    scores.control = Math.min(82, scores.control + 6);
    scores.stability = Math.min(78, scores.stability + 4);
  }
  if (topGod?.includes("정인") || topGod?.includes("편인")) {
    scores.connection = Math.min(80, scores.connection + 4);
    scores.growth = Math.min(76, scores.growth + 3);
  }

  return scores;
}

function axesAreNearlyIdentical(
  a: PersonSnapshotGauges["axes"],
  b: PersonSnapshotGauges["axes"],
): boolean {
  if (a.length !== b.length) return false;
  return a.every((bar, i) => Math.abs(bar.value - (b[i]?.value ?? 0)) <= 3);
}

function buildWorkKeywords(ctx: WorkColleagueContext): string[] {
  const raw = new Set<string>();
  raw.add(`협업 ${ctx.grade}`);
  raw.add(resolveWorkColleagueStylePhrase(ctx.sajuJsonA, ctx.tenGodsA).split(".")[0] ?? "");
  raw.add(resolveWorkColleagueStylePhrase(ctx.sajuJsonB, ctx.tenGodsB).split(".")[0] ?? "");
  if (ctx.workPairAnalysis.monthBranch.monthElementInteraction.includes("상생")) {
    raw.add("업무 리듬 맞음");
  }
  if (ctx.workPairAnalysis.monthBranch.directMonthCross?.type === "육합") {
    raw.add("협업 시너지");
  }
  if (ctx.eventScores.overall.activation >= 60) raw.add("소통 핏");
  if (ctx.eventScores.overall.risk >= 55) raw.add("업무 마찰");
  if (ctx.eventScores.overall.benefit >= 60) raw.add("역할 보완");
  return [...raw]
    .map((k) => polishRomanticDisplayText(k))
    .filter((k) => k.length >= 2)
    .slice(0, 8);
}

export function buildWorkSnapshotPanel(
  ctx: WorkColleagueContext,
  headline: {
    gaugeLabel: string;
    representativeLine: string;
    keywords?: string[];
  },
): TriScoreSnapshotPanel {
  const topicLabels = getTriScoreKindConfig("work").topics;

  const fallbackA = fallbackAxesFromSaju(ctx, "a");
  const fallbackB = fallbackAxesFromSaju(ctx, "b");

  const personA: PersonSnapshotGauges = {
    nickname: ctx.nicknameA,
    metaphor: resolveWorkColleagueStylePhrase(ctx.sajuJsonA, ctx.tenGodsA),
    axes: axesFromFallback(fallbackA),
  };
  const personB: PersonSnapshotGauges = {
    nickname: ctx.nicknameB,
    metaphor: resolveWorkColleagueStylePhrase(ctx.sajuJsonB, ctx.tenGodsB),
    axes: axesFromFallback(fallbackB),
  };

  const personAxesSource: TriScoreSnapshotPanel["personAxesSource"] =
    axesAreNearlyIdentical(personA.axes, personB.axes)
      ? "hidden"
      : "saju_estimate";

  const keywords =
    headline.keywords?.length &&
    !headline.keywords.every((k) => k.includes("신호"))
      ? headline.keywords.map((k) => polishRomanticDisplayText(k))
      : buildWorkKeywords(ctx);

  const m = ctx.masterScores;

  const relationshipGauges: RelationshipTopicGauge[] = [
    {
      topic: "intimacy",
      label: topicLabels.find((t) => t.topic === "intimacy")!.cardTitle,
      activation: m.activation,
      benefit: ctx.eventScores.intimacy.benefit,
      risk: ctx.eventScores.intimacy.risk,
    },
    {
      topic: "stability",
      label: topicLabels.find((t) => t.topic === "stability")!.cardTitle,
      activation: ctx.eventScores.stability.activation,
      benefit: m.benefit,
      risk: ctx.eventScores.stability.risk,
    },
    {
      topic: "conflict",
      label: topicLabels.find((t) => t.topic === "conflict")!.cardTitle,
      activation: ctx.eventScores.conflict.activation,
      benefit: ctx.eventScores.conflict.benefit,
      risk: m.risk,
    },
  ];

  const narrative = buildWorkSnapshotNarrative({ ctx, relationshipGauges });

  return {
    grade: ctx.grade,
    gaugeLabel: headline.gaugeLabel,
    representativeLine: polishRomanticDisplayText(headline.representativeLine),
    keywords,
    relationshipGauges,
    personA,
    personB,
    personAxesSource,
    narrative,
  };
}

export function hydrateWorkSnapshotPanel(
  panel: TriScoreSnapshotPanel,
): TriScoreSnapshotPanel {
  if (panel.narrative?.topics?.length) return panel;
  return {
    ...panel,
    personAxesSource: panel.personAxesSource ?? "hidden",
    narrative: buildWorkSnapshotNarrativeFromGauges(panel.relationshipGauges),
  };
}

export function resolveWorkSnapshotPanelFromReport(
  meta: unknown,
): TriScoreSnapshotPanel | null {
  if (!meta || typeof meta !== "object") return null;
  const m = meta as {
    snapshot_panel?: TriScoreSnapshotPanel;
  };
  if (m.snapshot_panel?.personA?.axes?.length) {
    return hydrateWorkSnapshotPanel(m.snapshot_panel);
  }
  return null;
}
