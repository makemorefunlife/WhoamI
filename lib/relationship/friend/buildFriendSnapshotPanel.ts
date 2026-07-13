import type { FriendRuleContext } from "./buildFriendRuleContext";
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

function buildTopicGauges(ctx: FriendRuleContext): RelationshipTopicGauge[] {
  const { eventScores } = ctx;

  return [
    {
      topic: "intimacy",
      label: "① 우정 케미",
      activation: eventScores.intimacy.activation,
      benefit: eventScores.intimacy.benefit,
      risk: eventScores.intimacy.risk,
    },
    {
      topic: "stability",
      label: "② 티키타카",
      activation: eventScores.stability.activation,
      benefit: eventScores.stability.benefit,
      risk: eventScores.stability.risk,
    },
    {
      topic: "conflict",
      label: "③ 소셜 리스크",
      activation: eventScores.conflict.activation,
      benefit: eventScores.conflict.benefit,
      risk: eventScores.conflict.risk,
    },
  ];
}

function emptyPersonGauges(nickname: string): TriScoreSnapshotPanel["personA"] {
  return { nickname, metaphor: "", axes: [] };
}

export function buildFriendSnapshotPanel(
  ctx: FriendRuleContext,
  options?: { gaugeLabel?: string; representativeLine?: string },
  personCorePsych?: {
    psychA?: PsychMasterJson | null;
    psychB?: PsychMasterJson | null;
  },
): TriScoreSnapshotPanel {
  const relationshipGauges = buildTopicGauges(ctx);
  const snap = ctx.killerSections.section_snapshot;
  const psychA = personCorePsych?.psychA ?? null;
  const psychB = personCorePsych?.psychB ?? null;

  const personA =
    psychA != null
      ? buildPersonGaugesFromPsych(ctx.nicknameA, psychA, "friendship")
      : emptyPersonGauges(ctx.nicknameA);
  const personB =
    psychB != null
      ? buildPersonGaugesFromPsych(ctx.nicknameB, psychB, "friendship")
      : emptyPersonGauges(ctx.nicknameB);

  return {
    grade: ctx.grade,
    gaugeLabel: options?.gaugeLabel ?? "Social DNA · 우정 스냅샷",
    representativeLine:
      options?.representativeLine ??
      `🔥 ${ctx.masterScores.connection}% · 🧩 ${ctx.masterScores.banter}% · ⚡ ${ctx.masterScores.risk}%`,
    keywords: ["친구", "Social DNA", "우정"],
    relationshipGauges,
    personA,
    personB,
    personAxesSource: resolveSnapshotPersonAxesSource(psychA, psychB),
    narrative: {
      topics: relationshipGauges.map((g) => ({
        topic: g.topic,
        title: g.label,
        subtitle: `${ctx.nicknameA} ↔ ${ctx.nicknameB}`,
        activation: g.activation,
        benefit: g.benefit,
        risk: g.risk,
        interpretation: snap.one_line_friendship,
        isWarning: g.risk >= 55,
      })),
    },
  };
}

export function hydrateFriendSnapshotPanel(
  panel: TriScoreSnapshotPanel,
  personCorePsych?: {
    psychA?: PsychMasterJson | null;
    psychB?: PsychMasterJson | null;
    nicknameA?: string;
    nicknameB?: string;
  },
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
      "friendship",
    );
  }
  return panel;
}
