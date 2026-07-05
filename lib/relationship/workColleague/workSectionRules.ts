import type { WorkColleagueContext } from "./buildWorkColleagueContext";

export type WorkStyleSection = {
  intro: string;
  comparison_rows: Array<{
    aspect: string;
    person_a: string;
    person_b: string;
  }>;
};

export type RespectBoundarySection = {
  intro: string;
  items: Array<{ title: string; detail: string }>;
};

export type RoleAssignmentSection = {
  intro: string;
  complements: Array<{
    delegate_to: string;
    task_summary: string;
    roles: string[];
    explanation: string;
  }>;
  person_a: { nickname: string; roles: string[]; rationale: string };
  person_b: { nickname: string; roles: string[]; rationale: string };
};

export type ConflictTriggerSection = {
  intro: string;
  triggers: Array<{
    situation: string;
    why: string;
    avoid_tip: string;
  }>;
};

export function buildWorkStyleSection(ctx: WorkColleagueContext): WorkStyleSection {
  const month = ctx.workPairAnalysis.monthBranch;
  const stems = ctx.workPairAnalysis.stemCommunication;
  const topStemHits = stems.stemPairs
    .filter((p) => p.weight >= 0.85)
    .slice(0, 3);

  return {
    intro: `월지(사회궁·일터)와 천간 소통을 기준으로 본 스타일 비교입니다. ${month.summary}`,
    comparison_rows: [
      {
        aspect: "월지(月支) 관계",
        person_a: ctx.workPairAnalysis.chartA.pillars.find((p) => p.name === "월주")?.pillar ?? "—",
        person_b: ctx.workPairAnalysis.chartB.pillars.find((p) => p.name === "월주")?.pillar ?? "—",
      },
      {
        aspect: "월지 오행·생극",
        person_a: month.monthElementInteraction,
        person_b: month.directMonthCross
          ? `${month.directMonthCross.type}: ${month.directMonthCross.interpretation}`
          : "월지 직접 합충 없음 — 다른 궁 신호로 조율",
      },
      {
        aspect: "업무 소통·회의 스타일 핏",
        person_a: stems.communicationSummary,
        person_b: `소통핏 점수 ${stems.communicationFitScore} · ${stems.meetingStyleSummary}`,
      },
      {
        aspect: "천간 생극·충 (핵심)",
        person_a:
          topStemHits[0]?.interaction ??
          stems.stemPairs[0]?.interaction ??
          "—",
        person_b:
          topStemHits[1]?.interaction ??
          stems.stemPairs[1]?.interaction ??
          "—",
      },
      {
        aspect: "신강약(주도·지원)",
        person_a: ctx.strengthA.label,
        person_b: ctx.strengthB.label,
      },
      {
        aspect: "협업 점수",
        person_a: `업무 호감 ${ctx.eventScores.overall.activation}`,
        person_b: `시너지 ${ctx.eventScores.overall.benefit} · 마찰 ${ctx.eventScores.overall.risk}`,
      },
    ],
  };
}

export function buildRespectBoundarySection(
  ctx: WorkColleagueContext,
): RespectBoundarySection {
  const month = ctx.workPairAnalysis.monthBranch;
  const items: RespectBoundarySection["items"] = [];

  items.push({
    title: "월지(사회궁) — 일터 리듬",
    detail: `${month.summary} 월지는 직장·프로젝트·조직 적응 방식을 뜻하므로, 이 영역을 건드리면 업무 마찰이 커지기 쉽습니다.`,
  });

  if (month.monthElementInteraction.includes("상극")) {
    items.push({
      title: "월지 상극 — 다른 업무 속도",
      detail:
        "한쪽이 밀어붙일 때 다른 쪽은 프로세스·품질을 지키려 할 수 있어요. KPI만 공유하고 방법은 분리하세요.",
    });
  }

  const monthTension = month.monthCrossHits.filter((h) =>
    ["충", "형", "해", "파"].includes(h.type),
  );
  if (monthTension.length >= 1) {
    items.push({
      title: "월지 긴장 신호",
      detail: `월지 연관 ${monthTension.length}건의 충·형·해·파 — 일정·역할·평가를 동시에 건드리지 마세요.`,
    });
  }

  const stemClash = ctx.workPairAnalysis.stemCommunication.stemPairs.filter(
    (p) => p.type === "천간충" || p.type === "상극",
  );
  if (stemClash.length > 0) {
    items.push({
      title: "천간 충·극 — 회의·보고 방식",
      detail: `${stemClash[0]!.interaction} 회의에서는 결론을 한 번에 내리기보다 안건을 나누는 것이 좋아요.`,
    });
  }

  return {
    intro:
      "월지·천간이 말해 주는 ‘일터에서 존중해야 할 영역’입니다. 일지(친밀·사적 감정)보다 사회궁을 우선합니다.",
    items,
  };
}

export function buildRoleAssignmentSection(
  ctx: WorkColleagueContext,
): RoleAssignmentSection {
  const complements = ctx.tenGodComplement.items.map((item) => ({
    delegate_to: item.giverNickname,
    task_summary: item.delegateText,
    roles: item.roles,
    explanation: `${item.explanation} → **${item.delegateText}**는 ${item.giverNickname}에게 일임하세요.`,
  }));

  const rolesA = complements
    .filter((c) => c.delegate_to === ctx.nicknameA)
    .flatMap((c) => c.roles)
    .slice(0, 4);
  const rolesB = complements
    .filter((c) => c.delegate_to === ctx.nicknameB)
    .flatMap((c) => c.roles)
    .slice(0, 4);

  const fallbackA =
    ctx.strengthA.label.includes("신강")
      ? ["최종 결정·대외 대표"]
      : ["실무·지원·정리"];
  const fallbackB =
    ctx.strengthB.label.includes("신강")
      ? ["최종 결정·대외 대표"]
      : ["실무·지원·정리"];

  return {
    intro:
      complements.length > 0
        ? "십신 상호 보완 — 한쪽에게 부족한 기운을 다른 쪽이 채워 주는 업무를 맡기면 시너지가 납니다."
        : "십신 보완 신호가 약해, 월지·신강약 기준 역할 분담을 권합니다.",
    complements,
    person_a: {
      nickname: ctx.nicknameA,
      roles: rolesA.length ? rolesA : fallbackA,
      rationale:
        complements.find((c) => c.delegate_to === ctx.nicknameA)?.explanation ??
        `${ctx.nicknameA}의 강한 십신·신강약에 맞는 업무를 맡기세요.`,
    },
    person_b: {
      nickname: ctx.nicknameB,
      roles: rolesB.length ? rolesB : fallbackB,
      rationale:
        complements.find((c) => c.delegate_to === ctx.nicknameB)?.explanation ??
        `${ctx.nicknameB}의 강한 십신·신강약에 맞는 업무를 맡기세요.`,
    },
  };
}

export function buildConflictTriggerSection(
  ctx: WorkColleagueContext,
): ConflictTriggerSection {
  const month = ctx.workPairAnalysis.monthBranch;
  const stems = ctx.workPairAnalysis.stemCommunication;
  const triggers: ConflictTriggerSection["triggers"] = [];

  if (month.directMonthCross && ["충", "형", "해", "파"].includes(month.directMonthCross.type)) {
    triggers.push({
      situation: "월지가 직접 부딪히는 상황 (조직·프로젝트 리듬)",
      why: `월지 ${month.directMonthCross.type} — ${month.directMonthCross.interpretation}`,
      avoid_tip:
        "같은 프로젝트 안에서도 담당 영역·보고 라인을 분리하고, 월 단위 중간 점검만 공유하세요.",
    });
  }

  if (ctx.eventScores.conflict.risk >= 55) {
    triggers.push({
      situation: "월지 마찰 + 업무 평가가 겹칠 때",
      why: `업무 마찰도 ${ctx.eventScores.conflict.risk} — 월지 긴장 ${month.tensionWeight.toFixed(1)}`,
      avoid_tip:
        "평가·피드백은 1:1로, 공개 회의에서는 다음 액션만 합의하세요.",
    });
  }

  const stemTension = stems.stemPairs.find(
    (p) => p.type === "천간충" && p.weight >= 0.85,
  );
  if (stemTension) {
    triggers.push({
      situation: "회의·의사결정이 한자리에 모일 때",
      why: stemTension.interaction,
      avoid_tip:
        "안건 2개만 가져가고, 결론 없으면 비동기로 넘기세요. 천간 충·극은 ‘말로 밀어붙이기’에 취약합니다.",
    });
  }

  if (triggers.length < 3) {
    triggers.push({
      situation: "역할·책임이 불분명할 때",
      why: stems.meetingStyleSummary,
      avoid_tip:
        "십신 보완표에 따라 ‘누가 무엇을’ 문서로 정리한 뒤 시작하세요.",
    });
  }

  return {
    intro:
      "월지·천간 마찰 신호가 강해지는 트리거입니다. 일지(사적 감정)보다 일터·회의 맥락을 기준으로 피하세요.",
    triggers: triggers.slice(0, 4),
  };
}
