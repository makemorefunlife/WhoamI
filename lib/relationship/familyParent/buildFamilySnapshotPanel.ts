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

function resolveFamilyVibeAxisNotes(
  psychA: PsychMasterJson | null,
  psychB: PsychMasterJson | null,
  locale: import("@/lib/i18n/locale").Locale,
): { intimacyNote?: string; stabilityNote?: string; conflictNote?: string } {
  if (!psychA || !psychB) return {};
  const empathyAvg = (psychA.secondary_axes.empathy + psychB.secondary_axes.empathy) / 2;
  const intimacyNote = empathyAvg >= 60
    ? pick(locale, "Both share high emotional empathy, deepening the bond beyond what saju suggests.", "관계공감 축이 둘 다 높아서 사주로 보이는 것 이상으로 정서적 교감이 깊을 수 있어요.")
    : empathyAvg <= 40
      ? pick(locale, "Empathy styles differ slightly, so deliberate effort might be needed to feel fully connected.", "관계공감 방식이 달라서, 서로의 마음을 온전히 느끼려면 약간의 의식적인 노력이 필요해요.")
      : undefined;

  const stimAvg = (psychA.secondary_axes.stimulation + psychB.secondary_axes.stimulation) / 2;
  const stabilityNote = stimAvg >= 60
    ? pick(locale, "Both crave novelty and growth, driving dynamic synergy.", "둘 다 새로운 자극과 성장을 즐기는 편이라 시너지의 폭이 큽니다.")
    : stimAvg <= 40
      ? pick(locale, "Both prefer stability, meaning growth happens in a calm, steady rhythm.", "둘 다 안정을 선호해서, 성장 시너지는 조용하고 꾸준하게 나타나요.")
      : undefined;

  const conflictGap = Math.abs(psychA.secondary_axes.conflict_style - psychB.secondary_axes.conflict_style);
  const conflictNote = conflictGap >= 30
    ? pick(locale, "Your conflict resolution styles clash, which might amplify friction during discipline.", "갈등을 대처하는 방식이 달라서 훈육 상황에서 마찰이 더 크게 번질 가능성이 있어요.")
    : undefined;

  return { intimacyNote, stabilityNote, conflictNote };
}

function resolveFamilyTopicInterpretations(
  ctx: FamilyRuleContext,
  roleLabel: string
) {
  const { masterScores } = ctx;
  const intimacy = masterScores.bond >= 70
    ? pick(ctx.locale, `The emotional bond between ${roleLabel} and Child is naturally strong and resilient.`, `${roleLabel}와(과) 자녀 사이의 정서적 교감은 본능적으로 강하고 단단하게 묶여 있습니다.`)
    : pick(ctx.locale, `The emotional connection might require active listening and patience to fully bloom.`, `서로의 진심을 온전히 나누기 위해서는 먼저 들어주고 기다려주는 연습이 필요합니다.`);
    
  const stability = masterScores.synergy >= 65
    ? pick(ctx.locale, `Your differing traits act as perfect puzzle pieces, accelerating each other's growth.`, `서로 다른 기질이 퍼즐처럼 맞물려, 자녀의 잠재력을 폭발적으로 끌어올리는 시너지를 만듭니다.`)
    : pick(ctx.locale, `Growth happens steadily when you respect each other's boundaries rather than forcing change.`, `상대를 억지로 이끌기보다는 각자의 속도와 방식을 존중할 때 시너지가 안정적으로 발휘됩니다.`);
    
  const conflict = masterScores.risk >= 55
    ? pick(ctx.locale, `Discipline can easily escalate into emotional friction if boundaries aren't clearly set.`, `훈육 과정에서 감정적 마찰로 번지기 쉬운 구조라, 명확한 선과 쿨한 마무리가 특히 중요합니다.`)
    : pick(ctx.locale, `You have a healthy buffer that prevents minor disagreements from turning into major conflicts.`, `의견 충돌이 생겨도 감정 싸움으로 크게 번지지 않고 이성적으로 조율할 수 있는 힘이 있습니다.`);
    
  return { intimacy, stability, conflict };
}

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
  const snap = ctx.killerSections.section_snapshot;
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

  const vibeNotes = resolveFamilyVibeAxisNotes(psychA, psychB, ctx.locale);
  const interpretations = resolveFamilyTopicInterpretations(ctx, roleLabel);

  return {
    grade: ctx.grade,
    gaugeLabel:
      options?.gaugeLabel ??
      pick(ctx.locale, "Child DNA Playbook · Family Snapshot", "Child DNA Playbook · 패밀리 스냅샷"),
    representativeLine:
      options?.representativeLine ??
      `🔥 ${ctx.masterScores.bond}% · 🧩 ${ctx.masterScores.synergy}% · ⚡ ${ctx.masterScores.risk}%`,
    keywords: [roleLabel, pick(ctx.locale, "Child", "자녀"), "Child DNA"],
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
        interpretation:
          g.topic === "intimacy" ? interpretations.intimacy :
          g.topic === "stability" ? interpretations.stability :
          interpretations.conflict,
        axisNote:
          g.topic === "intimacy" ? vibeNotes.intimacyNote :
          g.topic === "stability" ? vibeNotes.stabilityNote :
          vibeNotes.conflictNote,
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
