import type { FriendRuleContext } from "./buildFriendRuleContext";
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

export function buildFriendSnapshotPanel(
  ctx: FriendRuleContext,
  options?: { gaugeLabel?: string; representativeLine?: string },
): TriScoreSnapshotPanel {
  const relationshipGauges = buildTopicGauges(ctx);
  const snap = ctx.killerSections.section_snapshot;

  return {
    grade: ctx.grade,
    gaugeLabel: options?.gaugeLabel ?? "Social DNA · 우정 스냅샷",
    representativeLine:
      options?.representativeLine ??
      `🔥 ${ctx.masterScores.connection}% · 🧩 ${ctx.masterScores.banter}% · ⚡ ${ctx.masterScores.risk}%`,
    keywords: ["친구", "Social DNA", "우정"],
    relationshipGauges,
    personA: {
      nickname: ctx.nicknameA,
      axes: [],
      metaphor: ctx.friendPairAnalysis.dnaA.socialTitle,
    },
    personB: {
      nickname: ctx.nicknameB,
      axes: [],
      metaphor: ctx.friendPairAnalysis.dnaB.socialTitle,
    },
    personAxesSource: "hidden",
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
