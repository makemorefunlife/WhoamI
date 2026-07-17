import type { WorkColleagueContext } from "./buildWorkColleagueContext";
import { polishRomanticDisplayText } from "@/lib/relationship/romanticEverydayText";
import { resolveWorkColleagueStylePhrase } from "./officeLanguage";
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
  buildWorkSnapshotNarrative,
  buildWorkSnapshotNarrativeFromGauges,
} from "./buildWorkSnapshotNarrative";
import { pick } from "./workColleagueCopy";

function buildWorkKeywords(ctx: WorkColleagueContext): string[] {
  const raw = new Set<string>();
  raw.add(pick(ctx.locale, `Collab ${ctx.grade}`, `협업 ${ctx.grade}`));
  raw.add(resolveWorkColleagueStylePhrase(ctx.sajuJsonA, ctx.tenGodsA, ctx.locale).split(".")[0] ?? "");
  raw.add(resolveWorkColleagueStylePhrase(ctx.sajuJsonB, ctx.tenGodsB, ctx.locale).split(".")[0] ?? "");
  if (ctx.workPairAnalysis.monthBranch.monthElementInteraction.includes("상생")) {
    raw.add(pick(ctx.locale, "Work Rhythm Match", "업무 리듬 맞음"));
  }
  if (ctx.workPairAnalysis.monthBranch.directMonthCross?.type === "육합") {
    raw.add(pick(ctx.locale, "Collab Synergy", "협업 시너지"));
  }
  if (ctx.eventScores.overall.activation >= 60) raw.add(pick(ctx.locale, "Comms Fit", "소통 핏"));
  if (ctx.eventScores.overall.risk >= 55) raw.add(pick(ctx.locale, "Work Friction", "업무 마찰"));
  if (ctx.eventScores.overall.benefit >= 60) raw.add(pick(ctx.locale, "Role Complement", "역할 보완"));
  return [...raw]
    .map((k) => polishRomanticDisplayText(k))
    .filter((k) => k.length >= 2)
    .slice(0, 8);
}

function emptyPersonGauges(nickname: string): TriScoreSnapshotPanel["personA"] {
  return { nickname, metaphor: "", axes: [] };
}

export function buildWorkSnapshotPanel(
  ctx: WorkColleagueContext,
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
  const topicLabels = getTriScoreKindConfig("work", ctx.locale).topics;
  const psychA = personCorePsych?.psychA ?? null;
  const psychB = personCorePsych?.psychB ?? null;

  const personA =
    psychA != null
      ? buildPersonGaugesFromPsych(ctx.nicknameA, psychA, "work", ctx.locale)
      : emptyPersonGauges(ctx.nicknameA);
  const personB =
    psychB != null
      ? buildPersonGaugesFromPsych(ctx.nicknameB, psychB, "work", ctx.locale)
      : emptyPersonGauges(ctx.nicknameB);

  const personAxesSource = resolveSnapshotPersonAxesSource(psychA, psychB);

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
      "work",
      locale,
    );
  }
  if (next.narrative?.topics?.length) return next;
  return {
    ...next,
    personAxesSource: next.personAxesSource ?? "hidden",
    narrative: buildWorkSnapshotNarrativeFromGauges(next.relationshipGauges),
  };
}

export function resolveWorkSnapshotPanelFromReport(
  meta: unknown,
): TriScoreSnapshotPanel | null {
  if (!meta || typeof meta !== "object") return null;
  const m = meta as {
    snapshot_panel?: TriScoreSnapshotPanel;
    person_core?: {
      psych_a?: PsychMasterJson;
      psych_b?: PsychMasterJson;
    };
    nickname_a?: string;
    nickname_b?: string;
  };
  if (!m.snapshot_panel?.personA) return null;
  return hydrateWorkSnapshotPanel(m.snapshot_panel, {
    psychA: m.person_core?.psych_a,
    psychB: m.person_core?.psych_b,
    nicknameA: m.nickname_a ?? m.snapshot_panel.personA.nickname,
    nicknameB: m.nickname_b ?? m.snapshot_panel.personB.nickname,
  });
}
