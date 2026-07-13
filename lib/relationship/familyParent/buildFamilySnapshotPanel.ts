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

function buildTopicGauges(ctx: FamilyRuleContext): RelationshipTopicGauge[] {
  const { eventScores } = ctx;
  const roleLabel = ctx.parentRole === "mother" ? "엄마" : "아빠";

  return [
    {
      topic: "intimacy",
      label: `① 정서적 유대 (${roleLabel}↔자녀)`,
      activation: eventScores.intimacy.activation,
      benefit: eventScores.intimacy.benefit,
      risk: eventScores.intimacy.risk,
    },
    {
      topic: "stability",
      label: "② 성장 시너지",
      activation: eventScores.stability.activation,
      benefit: eventScores.stability.benefit,
      risk: eventScores.stability.risk,
    },
    {
      topic: "conflict",
      label: "③ 훈육 마찰 리스크",
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
  const roleLabel = ctx.parentRole === "mother" ? "엄마" : "아빠";
  const relationshipGauges = buildTopicGauges(ctx);
  const snap = ctx.killerSections.section_snapshot;
  const psychA = personCorePsych?.psychA ?? null;
  const psychB = personCorePsych?.psychB ?? null;

  const personA =
    psychA != null
      ? buildPersonGaugesFromPsych(ctx.nicknameA, psychA, "family")
      : emptyPersonGauges(ctx.nicknameA);
  const personB =
    psychB != null
      ? buildPersonGaugesFromPsych(ctx.nicknameB, psychB, "family")
      : emptyPersonGauges(ctx.nicknameB);

  return {
    grade: ctx.grade,
    gaugeLabel: options?.gaugeLabel ?? "Child DNA Playbook · 패밀리 스냅샷",
    representativeLine:
      options?.representativeLine ??
      `🔥 ${ctx.masterScores.bond}% · 🧩 ${ctx.masterScores.synergy}% · ⚡ ${ctx.masterScores.risk}%`,
    keywords: [roleLabel, "자녀", "Child DNA"],
    relationshipGauges,
    personA,
    personB,
    personAxesSource: resolveSnapshotPersonAxesSource(psychA, psychB),
    narrative: {
      topics: relationshipGauges.map((g) => ({
        topic: g.topic,
        title: g.label,
        subtitle: `${ctx.childNickname} ↔ ${ctx.parentNickname}`,
        activation: g.activation,
        benefit: g.benefit,
        risk: g.risk,
        interpretation: snap.one_line_family,
        isWarning: g.risk >= 55,
      })),
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
    );
  }
  return panel;
}
