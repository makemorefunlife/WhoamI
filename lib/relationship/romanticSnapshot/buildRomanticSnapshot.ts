import type { RomanticRuleContext } from "@/lib/relationship/romanticRules/types";
import type { RomanticHeadlineLocale } from "@/lib/relationship/romanticHeadline/locale";
import { polishRomanticDisplayText } from "@/lib/relationship/romanticEverydayText";
import { REF_HEAVENLY_STEMS } from "@/lib/hardcoded/sajuReferenceData";
import { sajuJsonToPillars } from "@/lib/saju/pairChartAnalysis";
import { getDayStemCode } from "@/lib/saju/romanticSajuDerivations";
import { PRIMARY_AXIS_LABELS } from "@/lib/v2/framework/axisLabels";
import type { PrimaryAxisKey, PrimaryAxesScores } from "@/lib/v2/survey/types";
import { buildNeutralV2Profile } from "@/lib/v2/survey/neutralProfile";
import {
  resolveRomanticEssenceForSaju,
} from "@/lib/relationship/dayStemRomanticProfile";
import {
  buildSnapshotNarrative,
  buildSnapshotNarrativeFromGauges,
  type SnapshotNarrative,
} from "./buildSnapshotNarrative";

/** 관계 리포트 스냅샷 — 핵심 5축 바 */
const SNAPSHOT_AXIS_KEYS: PrimaryAxisKey[] = [
  "connection",
  "stability",
  "growth",
  "structure",
  "adaptability",
];

const ELEMENT_AXIS_BIAS: Record<
  string,
  Partial<Record<PrimaryAxisKey, number>>
> = {
  fire: { connection: 10, growth: 6 },
  earth: { stability: 12, structure: 8 },
  wood: { growth: 10, adaptability: 5 },
  metal: { structure: 10, stability: 5 },
  water: { connection: 6, adaptability: 10 },
};

export type SnapshotAxisBar = {
  key: PrimaryAxisKey;
  label: string;
  value: number;
};

export type PersonSnapshotGauges = {
  nickname: string;
  metaphor: string;
  axes: SnapshotAxisBar[];
};

export type RelationshipTopicGauge = {
  topic: "intimacy" | "stability" | "conflict";
  label: string;
  activation: number;
  benefit: number;
  risk: number;
};

export type RomanticSnapshotPanel = {
  grade: string;
  gaugeLabel: string;
  representativeLine: string;
  keywords: string[];
  relationshipGauges: RelationshipTopicGauge[];
  personA: PersonSnapshotGauges;
  personB: PersonSnapshotGauges;
  /** 설문 기반 vs 사주 추정 — UI 안내용 */
  personAxesSource: "survey" | "saju_estimate" | "hidden";
  narrative: SnapshotNarrative;
};

function axesFromProfile(
  profile: { primary_axes: PrimaryAxesScores } | null | undefined,
  fallback: PrimaryAxesScores,
): SnapshotAxisBar[] {
  const scores = profile?.primary_axes ?? fallback;
  return SNAPSHOT_AXIS_KEYS.map((key) => ({
    key,
    label: PRIMARY_AXIS_LABELS[key],
    value: Math.max(0, Math.min(100, Math.round(scores[key] ?? 50))),
  }));
}

function stemCodeFromSaju(
  sajuJson: RomanticRuleContext["sajuJsonA"],
): string | null {
  try {
    const pillars = sajuJsonToPillars(
      sajuJson.saju as Required<NonNullable<typeof sajuJson.saju>>,
    );
    return getDayStemCode(pillars);
  } catch {
    return null;
  }
}

/** 설문 없을 때 — 일간·신강약·십성으로 사람마다 다른 추정치 */
function fallbackAxesFromSaju(
  ctx: RomanticRuleContext,
  who: "a" | "b",
): PrimaryAxesScores {
  const scores = { ...buildNeutralV2Profile().primary_axes };
  const sajuJson = who === "a" ? ctx.sajuJsonA : ctx.sajuJsonB;
  const strength = who === "a" ? ctx.strengthA : ctx.strengthB;
  const activation =
    who === "a" ? ctx.tenGodsActivationA : ctx.tenGodsActivationB;
  const profile = who === "a" ? ctx.romanticProfileA : ctx.romanticProfileB;

  const stemCode = profile?.stemCode ?? stemCodeFromSaju(sajuJson);
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
    scores.structure = Math.min(78, scores.structure + 4);
    scores.growth = Math.min(78, scores.growth + 3);
  } else if (ref?.yin_yang === "yin") {
    scores.connection = Math.min(78, scores.connection + 4);
    scores.adaptability = Math.min(78, scores.adaptability + 3);
  }

  if (strength.label.includes("신강")) {
    scores.structure = Math.min(82, scores.structure + 8);
    scores.stability = Math.min(80, scores.stability + 5);
  } else if (strength.label.includes("신약")) {
    scores.connection = Math.min(82, scores.connection + 8);
    scores.adaptability = Math.min(78, scores.adaptability + 6);
  }

  const activeCount = activation.filter((r) => r.state === "active").length;
  if (activeCount >= 2) {
    scores.growth = Math.min(80, scores.growth + 5);
  }

  const topGod = Object.entries(who === "a" ? ctx.tenGodsA : ctx.tenGodsB).sort(
    (a, b) => b[1] - a[1],
  )[0]?.[0];
  if (topGod?.includes("식신") || topGod?.includes("상관")) {
    scores.connection = Math.min(82, scores.connection + 5);
    scores.adaptability = Math.min(78, scores.adaptability + 4);
  }
  if (topGod?.includes("정관") || topGod?.includes("편관")) {
    scores.structure = Math.min(82, scores.structure + 6);
    scores.stability = Math.min(78, scores.stability + 4);
  }
  if (topGod?.includes("정인") || topGod?.includes("편인")) {
    scores.connection = Math.min(80, scores.connection + 4);
    scores.growth = Math.min(76, scores.growth + 3);
  }

  return scores;
}

function axesAreNearlyIdentical(
  a: SnapshotAxisBar[],
  b: SnapshotAxisBar[],
): boolean {
  if (a.length !== b.length) return false;
  return a.every((bar, i) => Math.abs(bar.value - (b[i]?.value ?? 0)) <= 3);
}

function buildRelationshipKeywords(ctx: RomanticRuleContext): string[] {
  const raw = new Set<string>();

  raw.add(`궁합 ${ctx.grade}`);
  if (ctx.romanticProfileA?.image) raw.add(ctx.romanticProfileA.image);
  if (ctx.romanticProfileB?.image) raw.add(ctx.romanticProfileB.image);

  if (ctx.pairAnalysis.dayStemInteraction.includes("상생")) raw.add("서로 키워 줌");
  if (ctx.pairAnalysis.dayStemInteraction.includes("상극")) raw.add("서로 자극");
  if (ctx.eventScores.overall.activation >= 60) raw.add("끌림");
  if (ctx.eventScores.overall.risk >= 55) raw.add("조율 필요");
  if (ctx.eventScores.overall.benefit >= 60) raw.add("시너지");

  const gap = Math.abs(
    (ctx.surveyProfileA?.primary_axes.connection ?? 50) -
      (ctx.surveyProfileB?.primary_axes.connection ?? 50),
  );
  if (gap >= 15) raw.add("친밀감 속도 차");

  return [...raw]
    .map((k) => polishRomanticDisplayText(k))
    .filter((k) => k.length >= 2)
    .slice(0, 8);
}

export function buildRomanticSnapshotPanel(
  ctx: RomanticRuleContext,
  headline: {
    gaugeLabel: string;
    representativeLine: string;
    keywords?: string[];
  },
): RomanticSnapshotPanel {
  const hasSurveyA = Boolean(ctx.surveyProfileA?.primary_axes);
  const hasSurveyB = Boolean(ctx.surveyProfileB?.primary_axes);
  const hasSurveyAxes = hasSurveyA && hasSurveyB;

  const fallbackA = fallbackAxesFromSaju(ctx, "a");
  const fallbackB = fallbackAxesFromSaju(ctx, "b");

  const personA: PersonSnapshotGauges = {
    nickname: ctx.nicknameA,
    metaphor: resolveRomanticEssenceForSaju(ctx.sajuJsonA),
    axes: axesFromProfile(ctx.surveyProfileA, fallbackA),
  };
  const personB: PersonSnapshotGauges = {
    nickname: ctx.nicknameB,
    metaphor: resolveRomanticEssenceForSaju(ctx.sajuJsonB),
    axes: axesFromProfile(ctx.surveyProfileB, fallbackB),
  };

  const identicalWithoutSurvey =
    !hasSurveyAxes && axesAreNearlyIdentical(personA.axes, personB.axes);
  const personAxesSource: RomanticSnapshotPanel["personAxesSource"] =
    hasSurveyAxes
      ? "survey"
      : identicalWithoutSurvey
        ? "hidden"
        : "saju_estimate";

  const keywords =
    headline.keywords?.length &&
    !headline.keywords.every((k) => k.includes("신호"))
      ? headline.keywords.map((k) => polishRomanticDisplayText(k))
      : buildRelationshipKeywords(ctx);

  const relationshipGauges: RelationshipTopicGauge[] = [
    {
      topic: "intimacy",
      label: "친밀·끌림",
      ...ctx.eventScores.intimacy,
    },
    {
      topic: "stability",
      label: "안정·균형",
      ...ctx.eventScores.stability,
    },
    {
      topic: "conflict",
      label: "갈등·긴장",
      ...ctx.eventScores.conflict,
    },
  ];

  const narrative = buildSnapshotNarrative({
    ctx,
    relationshipGauges,
  });

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

export function hydrateSnapshotPanel(
  panel: RomanticSnapshotPanel,
  locale?: RomanticHeadlineLocale,
): RomanticSnapshotPanel {
  if (panel.narrative?.topics?.length) return panel;
  return {
    ...panel,
    personAxesSource: panel.personAxesSource ?? "hidden",
    narrative: buildSnapshotNarrativeFromGauges(panel.relationshipGauges, locale),
  };
}

export function resolveSnapshotPanelFromReport(
  meta: unknown,
  locale?: RomanticHeadlineLocale,
): RomanticSnapshotPanel | null {
  if (!meta || typeof meta !== "object") return null;
  const m = meta as {
    snapshot_panel?: RomanticSnapshotPanel;
    rule_screen_plan?: Array<{ screen: number; key: string; output: unknown }>;
  };
  if (m.snapshot_panel?.personA?.axes?.length) {
    return hydrateSnapshotPanel(m.snapshot_panel, locale);
  }
  const hit = m.rule_screen_plan?.find(
    (s) => s.screen === 2 && s.key === "snapshot",
  );
  const out = hit?.output as { panel?: RomanticSnapshotPanel } | undefined;
  if (out?.panel?.personA?.axes?.length) {
    return hydrateSnapshotPanel(out.panel, locale);
  }
  return null;
}
