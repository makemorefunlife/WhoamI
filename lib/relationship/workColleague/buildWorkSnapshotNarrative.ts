import type { WorkColleagueContext } from "./buildWorkColleagueContext";
import { buildOfficeMeetingSummary } from "./officeLanguage";
import { getTriScoreKindConfig } from "@/lib/relationship/triScoreSnapshot/kinds";
import type { RelationshipTopicGauge } from "@/lib/relationship/triScoreSnapshot/types";
import type {
  SnapshotNarrative,
  SnapshotTopicNarrative,
} from "@/lib/relationship/romanticSnapshot/buildSnapshotNarrative";

type WorkPositiveContext = {
  bondPhrase: string | null;
  hasMonthStemSupport: boolean;
  hasMonthYukhap: boolean;
  monthSynergyStrong: boolean;
};

function buildWorkPositiveContext(ctx: WorkColleagueContext): WorkPositiveContext {
  const month = ctx.workPairAnalysis.monthBranch;
  const hasMonthStemSupport = month.monthElementInteraction.includes("상생");
  const hasMonthYukhap =
    month.directMonthCross?.type === "육합" ||
    month.monthCrossHits.some((h) => h.type === "육합");
  const monthSynergyStrong = month.synergyWeight >= 2;

  let bondPhrase: string | null = null;
  if (hasMonthStemSupport && hasMonthYukhap) {
    bondPhrase =
      "일터 리듬이 자연스럽게 맞물리는 조합이에요. 첫 프로젝트부터 호흡이 나오기 쉽습니다.";
  } else if (hasMonthStemSupport) {
    bondPhrase =
      "서로의 업무 에너지가 살아나는 편이라, 프로젝트가 길어질수록 시너지가 커져요.";
  } else if (hasMonthYukhap || monthSynergyStrong) {
    bondPhrase =
      "협업 시너지 신호가 있어, 처음 맞닿는 업무에서도 편하게 맞물립니다.";
  } else if (ctx.masterScores.benefit >= 60) {
    bondPhrase = "함께 일할 때 시너지가 살아나는 조합이에요.";
  }

  return {
    bondPhrase,
    hasMonthStemSupport,
    hasMonthYukhap,
    monthSynergyStrong,
  };
}

function appendBondNote(base: string, positive: WorkPositiveContext): string {
  if (!positive.bondPhrase) return base;
  return `${base} ${positive.bondPhrase}`;
}

function interpretWorkTopic(
  gauge: RelationshipTopicGauge,
  positive: WorkPositiveContext,
  ctx: WorkColleagueContext,
): SnapshotTopicNarrative {
  const config = getTriScoreKindConfig("work");
  const topicMeta = config.topics.find((t) => t.topic === gauge.topic);
  const activation = Math.round(gauge.activation);
  const benefit = Math.round(gauge.benefit);
  const risk = Math.round(gauge.risk);
  const comm = ctx.workPairAnalysis.stemCommunication;

  if (gauge.topic === "intimacy") {
    const core =
      activation >= 70
        ? `회의·보고에서 말이 잘 통해요(업무적 핏 ${activation}%). 역할을 맡기기 좋은 조합입니다.`
        : activation >= 60
          ? "소통 방식만 맞추면 업무적 핏이 올라가요."
          : "처음엔 회의 스타일 차이가 있어도, 프로세스를 정하면 신뢰가 쌓여요.";
    const extra =
      risk < 55
        ? " 업무 리듬 마찰은 낮은 편이라, 안건만 나누면 편하게 맞물립니다."
        : "";
    return {
      topic: gauge.topic,
      title: topicMeta?.cardTitle ?? "① 업무 핏·신뢰",
      subtitle: topicMeta?.cardSubtitle ?? "",
      activation,
      benefit,
      risk,
      interpretation: appendBondNote(`${core}${extra}`, positive),
      isWarning: false,
    };
  }

  if (gauge.topic === "stability") {
    const core =
      benefit >= 68
        ? `협업 시너지 ${benefit}% — 장기 프로젝트·일정 맞추기에 유리합니다.`
        : `협업 시너지 ${benefit}% — 역할 분담으로 끌어올릴 여지가 충분해요.`;
    const balance =
      risk >= 58
        ? ` 업무 마찰(${risk}%)이 있어도, 서로의 전문 영역을 인정하면 회복이 빠릅니다.`
        : " 업무 리듬만 맞추면 오래 가는 파트너십이 됩니다.";
    return {
      topic: gauge.topic,
      title: topicMeta?.cardTitle ?? "② 프로젝트 시너지",
      subtitle: topicMeta?.cardSubtitle ?? "",
      activation,
      benefit,
      risk,
      interpretation: appendBondNote(`${core}${balance}`, positive),
      isWarning: false,
    };
  }

  const isWarning = risk >= 88 && benefit < 30;
  const core =
    risk >= 60
      ? `오피스 리스크 ${risk}% — 일정·역할·평가 주제가 겹치면 예민해지기 쉬워요.`
      : `오피스 리스크 ${risk}% — 갈등이 와도 협업 관계가 쉽게 끊기지는 않는 편이에요.`;
  const caution =
    benefit <= 45
      ? ` 이때는 협업 시너지(${benefit})가 잠깐 낮아지니, 회의 전에 안건·결정권을 문서로 정리하세요.`
      : ` 협업 시너지 ${benefit} · 업무 마찰 ${risk} — 프로젝트 리듬과 역할을 존중하면 안정됩니다.`;
  const commNote = comm.stemPairs?.length
    ? ` ${buildOfficeMeetingSummary(comm)}`
    : "";

  return {
    topic: gauge.topic,
    title: topicMeta?.cardTitle ?? "③ 업무 마찰·갈등",
    subtitle: topicMeta?.cardSubtitle ?? "",
    activation,
    benefit,
    risk,
    interpretation: `${core}${caution}${commNote}`,
    isWarning,
  };
}

export function buildWorkSnapshotNarrative(params: {
  ctx: WorkColleagueContext;
  relationshipGauges: RelationshipTopicGauge[];
}): SnapshotNarrative {
  const positive = buildWorkPositiveContext(params.ctx);
  return {
    topics: params.relationshipGauges.map((g) =>
      interpretWorkTopic(g, positive, params.ctx),
    ),
  };
}

export function buildWorkSnapshotNarrativeFromGauges(
  gauges: RelationshipTopicGauge[],
): SnapshotNarrative {
  const emptyPositive: WorkPositiveContext = {
    bondPhrase: null,
    hasMonthStemSupport: false,
    hasMonthYukhap: false,
    monthSynergyStrong: false,
  };
  const stubCtx = {
    workPairAnalysis: {
      stemCommunication: {
        communicationFitScore: 50,
        meetingStyleSummary: "",
        communicationSummary: "",
        stemPairs: [],
      },
    },
  } as WorkColleagueContext;

  return {
    topics: gauges.map((g) =>
      interpretWorkTopic(g, emptyPositive, stubCtx),
    ),
  };
}
