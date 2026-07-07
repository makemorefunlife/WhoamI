import type { MarriageRuleContext } from "./buildMarriageRuleContext";
import { getTriScoreKindConfig } from "@/lib/relationship/triScoreSnapshot/kinds";
import type {
  SnapshotTopicNarrative,
  SnapshotNarrative,
} from "@/lib/relationship/romanticSnapshot/buildSnapshotNarrative";
import type { RelationshipTopicGauge } from "@/lib/relationship/triScoreSnapshot/types";

function interpretMarriageTopic(
  gauge: RelationshipTopicGauge,
  ctx: MarriageRuleContext,
): SnapshotTopicNarrative {
  const config = getTriScoreKindConfig("cohabitation");
  const topicMeta = config.topics.find((t) => t.topic === gauge.topic);
  const activation = Math.round(gauge.activation);
  const benefit = Math.round(gauge.benefit);
  const risk = Math.round(gauge.risk);
  const day = ctx.marriagePairAnalysis.dayBranch;

  if (gauge.topic === "intimacy") {
    const core =
      activation >= 70
        ? "침실·애착 리듬이 자연스럽게 맞습니다. 스킨십과 밤의 주파수가 잘 맞는 편."
        : activation >= 58
          ? "가까워질수록 핏이 올라가는 조합. 속도·촉감만 맞추면 충분합니다."
          : "신체·정서 리듬 차이가 있습니다. 대화 없이는 밤이 어색해질 수 있어요.";
    const bed =
      day.bedFitLevel === "excellent"
        ? " 밤의 케미가 특히 강합니다."
        : day.bedFitLevel === "needs_tune"
          ? " 침실에서 리듬 조율이 필수입니다."
          : "";
    return {
      topic: gauge.topic,
      title: topicMeta?.cardTitle ?? "① 로맨틱 핏·애착",
      subtitle: topicMeta?.cardSubtitle ?? "",
      activation,
      benefit,
      risk,
      interpretation: `${core}${bed}`,
      isWarning: false,
    };
  }

  if (gauge.topic === "stability") {
    const core =
      benefit >= 68
        ? "가사·재정·육아가 톱니바퀴처럼 맞물릴 여지가 큽니다."
        : benefit >= 50
          ? "역할 합의와 CFO 지정으로 끌어올릴 수 있습니다."
          : "돈·역할·육아에서 마찰이 잦을 수 있습니다. 시스템이 없으면 서운함만 쌓입니다.";
    const cfo = ctx.tenGod.cfo.nickname;
    return {
      topic: gauge.topic,
      title: topicMeta?.cardTitle ?? "② 라이프 시너지",
      subtitle: topicMeta?.cardSubtitle ?? "",
      activation,
      benefit,
      risk,
      interpretation: `${core} 통장·큰 지출은 ${cfo} 한 명만 쥐세요.`,
      isWarning: false,
    };
  }

  const isWarning = risk >= 70;
  const core =
    risk >= 60
      ? "집 안 스트레스·갈등이 올라가기 쉬운 패턴입니다."
      : risk >= 40
        ? "갈등이 와도 회복 여지는 있지만, 한 번에 여러 주제를 꺼내면 폭발합니다."
        : "홈 리스크는 비교적 낮은 편. 경계만 지키면 평화가 길어집니다.";
  const tip =
    risk >= 55
      ? " 육아·가사·돈은 한 번에 하나만. 퇴근 직후 무거운 대화 금지."
      : "";

  return {
    topic: gauge.topic,
    title: topicMeta?.cardTitle ?? "③ 홈 리스크",
    subtitle: topicMeta?.cardSubtitle ?? "",
    activation,
    benefit,
    risk,
    interpretation: `${core}${tip}`,
    isWarning,
  };
}

export function buildMarriageSnapshotNarrative(params: {
  ctx: MarriageRuleContext;
  relationshipGauges: RelationshipTopicGauge[];
}): SnapshotNarrative {
  return {
    topics: params.relationshipGauges.map((g) =>
      interpretMarriageTopic(g, params.ctx),
    ),
  };
}

export function buildMarriageSnapshotNarrativeFromGauges(
  gauges: RelationshipTopicGauge[],
): SnapshotNarrative {
  const stubCtx = {
    marriagePairAnalysis: { dayBranch: { bedFitLevel: "good" } },
    tenGod: { cfo: { nickname: "파트너" } },
  } as MarriageRuleContext;

  return {
    topics: gauges.map((g) => interpretMarriageTopic(g, stubCtx)),
  };
}
