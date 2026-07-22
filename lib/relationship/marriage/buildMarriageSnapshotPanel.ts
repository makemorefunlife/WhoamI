import type { MarriageRuleContext } from "./buildMarriageRuleContext";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import {
  buildPersonGaugesFromPsych,
  patchSnapshotPanelWithPsych,
  resolveSnapshotPersonAxesSource,
} from "@/lib/personCore/mappers/mapPsychMasterToSnapshotAxes";
import { getTriScoreKindConfig } from "@/lib/relationship/triScoreSnapshot/kinds";
import type {
  RelationshipTopicGauge,
  TriScoreSnapshotPanel,
} from "@/lib/relationship/triScoreSnapshot/types";
import {
  buildMarriageSnapshotNarrative,
  buildMarriageSnapshotNarrativeFromGauges,
} from "./buildMarriageSnapshotNarrative";
import { pick } from "./marriageCopy";

function emptyPersonGauges(nickname: string): TriScoreSnapshotPanel["personA"] {
  return { nickname, metaphor: "", axes: [] };
}

function buildMarriageKeywords(ctx: MarriageRuleContext): string[] {
  const raw = new Set<string>();
  raw.add(pick(ctx.locale, `Home ${ctx.grade}`, `홈 ${ctx.grade}`));
  raw.add(ctx.householdDnaA.lifestyle_title.split(" ")[0] ?? "Home");
  raw.add(ctx.householdDnaB.lifestyle_title.split(" ")[0] ?? "Partner");
  if (ctx.marriagePairAnalysis.dayBranch.bedFitLevel === "excellent") {
    raw.add(pick(ctx.locale, "Bedroom Fit", "침실 핏"));
  }
  if (ctx.masterScores.benefit >= 60) raw.add(pick(ctx.locale, "Life Synergy", "라이프 시너지"));
  if (ctx.masterScores.risk >= 55) raw.add(pick(ctx.locale, "Home Risk", "홈 리스크"));
  return [...raw].filter((k) => k.length >= 2).slice(0, 8);
}

export function buildMarriageSnapshotPanel(
  ctx: MarriageRuleContext,
  headline: {
    gaugeLabel: string;
    representativeLine: string;
    keywords?: string[];
  },
  personCorePsych?: {
    psychA?: PsychMasterJson | null;
    psychB?: PsychMasterJson | null;
  },
): TriScoreSnapshotPanel {
  const topicLabels = getTriScoreKindConfig("cohabitation", ctx.locale).topics;
  const psychA = personCorePsych?.psychA ?? null;
  const psychB = personCorePsych?.psychB ?? null;

  const personA =
    psychA != null
      ? buildPersonGaugesFromPsych(ctx.nicknameA, psychA, "cohabitation", ctx.locale)
      : emptyPersonGauges(ctx.nicknameA);
  const personB =
    psychB != null
      ? buildPersonGaugesFromPsych(ctx.nicknameB, psychB, "cohabitation", ctx.locale)
      : emptyPersonGauges(ctx.nicknameB);

  const personAxesSource = resolveSnapshotPersonAxesSource(psychA, psychB);

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

  const narrative = buildMarriageSnapshotNarrative({ ctx, relationshipGauges, psychA, psychB });

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
  personCorePsych?: {
    psychA?: PsychMasterJson | null;
    psychB?: PsychMasterJson | null;
    nicknameA?: string;
    nicknameB?: string;
  },
  locale: import("@/lib/i18n/locale").Locale = "ko-KR",
): TriScoreSnapshotPanel {
  let next = panel;
  if (
    personCorePsych?.psychA &&
    personCorePsych.psychB &&
    personCorePsych.nicknameA &&
    personCorePsych.nicknameB
  ) {
    next = patchSnapshotPanelWithPsych(
      next,
      {
        nicknameA: personCorePsych.nicknameA,
        nicknameB: personCorePsych.nicknameB,
      },
      {
        psychA: personCorePsych.psychA,
        psychB: personCorePsych.psychB,
      },
      "cohabitation",
      locale,
    );
  }
  if (next.narrative?.topics?.length) return next;
  return {
    ...next,
    personAxesSource: next.personAxesSource ?? "hidden",
    narrative: buildMarriageSnapshotNarrativeFromGauges(next.relationshipGauges),
  };
}
