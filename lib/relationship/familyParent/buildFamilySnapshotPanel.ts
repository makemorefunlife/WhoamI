import type { FamilyRuleContext } from "./buildFamilyRuleContext";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import {
  buildPersonGaugesFromPsych,
  patchSnapshotPanelWithPsych,
  resolveSnapshotPersonAxesSource,
} from "@/lib/personCore/mappers/mapPsychMasterToSnapshotAxes";
import type {
  RelationshipTopicGauge,
  TriScoreSnapshotPanel,
} from "@/lib/relationship/triScoreSnapshot/types";
import { pick } from "./familyParentCopy";
import { buildFamilyOverviewCardNarratives } from "./familyOverviewNarrative";

function buildTopicGauges(ctx: FamilyRuleContext): RelationshipTopicGauge[] {
  const { eventScores } = ctx;
  const roleLabel = pick(ctx.locale, ctx.parentRole === "mother" ? "Mom" : "Dad", ctx.parentRole === "mother" ? "엄마" : "아빠");
  const childLabel = pick(ctx.locale, "Child", "자녀");

  return [
    {
      topic: "intimacy",
      label: pick(ctx.locale, `① Emotional Bond (${roleLabel}↔${childLabel})`, `① 정서적 유대 (${roleLabel}↔자녀)`),
      activation: eventScores.intimacy.activation,
      benefit: eventScores.intimacy.benefit,
      risk: eventScores.intimacy.risk,
    },
    {
      topic: "stability",
      label: pick(ctx.locale, "② Growth Synergy", "② 성장 시너지"),
      activation: eventScores.stability.activation,
      benefit: eventScores.stability.benefit,
      risk: eventScores.stability.risk,
    },
    {
      topic: "conflict",
      label: pick(ctx.locale, "③ Discipline Friction Risk", "③ 훈육 마찰 리스크"),
      activation: eventScores.conflict.activation,
      benefit: eventScores.conflict.benefit,
      risk: eventScores.conflict.risk,
    },
  ];
}

function emptyPersonGauges(nickname: string): TriScoreSnapshotPanel["personA"] {
  return { nickname, metaphor: "", axes: [] };
}

export function buildFamilyParentSnapshotPanel(
  ctx: FamilyRuleContext,
  options?: { gaugeLabel?: string; representativeLine?: string },
  personCorePsych?: {
    psychA?: PsychMasterJson | null;
    psychB?: PsychMasterJson | null;
  },
): TriScoreSnapshotPanel {
  const roleLabel = pick(ctx.locale, ctx.parentRole === "mother" ? "Mom" : "Dad", ctx.parentRole === "mother" ? "엄마" : "아빠");
  const relationshipGauges = buildTopicGauges(ctx);
  const psychA = personCorePsych?.psychA ?? null;
  const psychB = personCorePsych?.psychB ?? null;

  const personA =
    psychA != null
      ? buildPersonGaugesFromPsych(ctx.nicknameA, psychA, "family", ctx.locale)
      : emptyPersonGauges(ctx.nicknameA);
  const personB =
    psychB != null
      ? buildPersonGaugesFromPsych(ctx.nicknameB, psychB, "family", ctx.locale)
      : emptyPersonGauges(ctx.nicknameB);

  const cardNarratives = buildFamilyOverviewCardNarratives(ctx, personCorePsych);

  return {
    grade: ctx.grade,
    gaugeLabel:
      options?.gaugeLabel ??
      pick(ctx.locale, "Child DNA Playbook · Family Snapshot", "Child DNA Playbook · 패밀리 스냅샷"),
    representativeLine:
      options?.representativeLine ??
      `▫ 유대 ${ctx.masterScores.bond}% · ▫ 시너지 ${ctx.masterScores.synergy}% · ▫ 마찰 ${ctx.masterScores.risk}%`,
    keywords: [roleLabel, pick(ctx.locale, "Child", "자녀"), "Child DNA"],
    relationshipGauges,
    personA,
    personB,
    personAxesSource: resolveSnapshotPersonAxesSource(psychA, psychB),
    narrative: {
      topics: relationshipGauges.map((g) => {
        const item =
          g.topic === "intimacy" ? cardNarratives.bond :
          g.topic === "stability" ? cardNarratives.synergy :
          cardNarratives.risk;
        return {
          topic: g.topic,
          title: g.label,
          subtitle: item.oneLiner,
          activation: g.activation,
          benefit: g.benefit,
          risk: g.risk,
          interpretation: item.shortWhy,
          detailedWhy: item.why,
          strength: item.strength,
          caution: item.caution,
          scene: item.scene,
          axisNote: item.axisNote ? `${item.scene} (${item.axisNote})` : item.scene,
          isWarning: g.risk >= 55,
        };
      }),
    },
  };
}

export function hydrateFamilyParentSnapshotPanel(
  panel: TriScoreSnapshotPanel,
  personCorePsych?: {
    psychA?: PsychMasterJson | null;
    psychB?: PsychMasterJson | null;
    nicknameA?: string;
    nicknameB?: string;
  },
  locale: import("@/lib/i18n/locale").Locale = "ko-KR",
): TriScoreSnapshotPanel {
  if (
    personCorePsych?.psychA &&
    personCorePsych.psychB &&
    personCorePsych.nicknameA &&
    personCorePsych.nicknameB
  ) {
    return patchSnapshotPanelWithPsych(
      panel,
      {
        nicknameA: personCorePsych.nicknameA,
        nicknameB: personCorePsych.nicknameB,
      },
      {
        psychA: personCorePsych.psychA,
        psychB: personCorePsych.psychB,
      },
      "family",
      locale,
    );
  }
  return panel;
}
