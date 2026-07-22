import type { RomanticRuleContext } from "@/lib/relationship/romanticRules/types";
import {
  resolveIntimacyAxisNote,
  resolveConflictAxisNote,
} from "@/lib/relationship/romanticRules/relationshipDynamics";
import { polishRomanticDisplayText } from "@/lib/relationship/romanticEverydayText";
import type { RelationshipTopicGauge } from "./buildRomanticSnapshot";

const POSITIVE_CROSS = new Set(["육합", "천간합", "삼합", "방합"]);

export type SnapshotTopicNarrative = {
  topic: RelationshipTopicGauge["topic"];
  title: string;
  subtitle: string;
  activation: number;
  benefit: number;
  risk: number;
  interpretation: string;
  isWarning: boolean;
  /** Part1① 11축(관계공감/갈등직면성) 확인 문구 — intimacy/conflict만, profile 없으면 없음 */
  axisNote?: string | null;
};

export type SnapshotPositiveContext = {
  bondPhrase: string | null;
  hasDayStemSupport: boolean;
  hasYukhap: boolean;
  positiveCrossCount: number;
};

export type SnapshotNarrative = {
  topics: SnapshotTopicNarrative[];
};

export function buildPositiveContext(
  ctx: RomanticRuleContext,
): SnapshotPositiveContext {
  const positiveCrossCount = ctx.pairAnalysis.allCrossHits.filter((h) =>
    POSITIVE_CROSS.has(h.type),
  ).length;
  const hasYukhap = ctx.pairAnalysis.allCrossHits.some((h) => h.type === "육합");
  const hasDayStemSupport =
    ctx.pairAnalysis.dayStemInteraction.includes("상생");

  let bondPhrase: string | null = null;
  if (hasDayStemSupport && hasYukhap) {
    bondPhrase =
      "일간이 서로를 키워 주고, 끌림이 자연스럽게 이어지는 합도 있어 기본 바탕이 따뜻한 조합이에요.";
  } else if (hasDayStemSupport) {
    bondPhrase =
      "핵심 기질이 서로를 살려 주는 상생이라, 가까워질수록 응원이 되는 면이 커요.";
  } else if (hasYukhap || positiveCrossCount >= 1) {
    bondPhrase =
      "처음부터 편하게 끌리는 합(合)이 있어, 만났을 때의 호감이 잘 이어지는 편이에요.";
  } else if (ctx.eventScores.overall.benefit >= 60) {
    bondPhrase = "함께 있을 때 시너지가 살아나는 조합이에요.";
  }

  return {
    bondPhrase,
    hasDayStemSupport,
    hasYukhap,
    positiveCrossCount,
  };
}

function appendBondNote(base: string, positive: SnapshotPositiveContext): string {
  if (!positive.bondPhrase) return base;
  return `${base} ${positive.bondPhrase}`;
}

export function interpretTopic(
  gauge: RelationshipTopicGauge,
  positive: SnapshotPositiveContext = {
    bondPhrase: null,
    hasDayStemSupport: false,
    hasYukhap: false,
    positiveCrossCount: 0,
  },
  axisNote?: string | null,
): SnapshotTopicNarrative {
  const activation = Math.round(gauge.activation);
  const benefit = Math.round(gauge.benefit);
  const risk = Math.round(gauge.risk);

  if (gauge.topic === "intimacy") {
    const core =
      activation >= 70 && benefit >= 75
        ? "단둘이 감정을 나눌 때는 최고예요. 매력과 함께 있을 때의 즐거움이 크게 올라옵니다."
        : activation >= 60
          ? "가까워질수록 끌림이 살아나요. 둘만의 시간에 에너지가 잘 모입니다."
          : "천천히 가까워질수록 편안한 끌림이 자라는 타입이에요.";
    const extra =
      risk < 55
        ? " 긴장은 낮은 편이라, 설레는 마음을 즐기기 좋아요."
        : "";
    return {
      topic: gauge.topic,
      title: "① 친밀·끌림",
      subtitle: "썸·데이트·둘만 있을 때",
      activation,
      benefit,
      risk,
      interpretation: appendBondNote(`${core}${extra}`, positive),
      isWarning: false,
      axisNote,
    };
  }

  if (gauge.topic === "stability") {
    const core =
      benefit >= 68
        ? `일상·미래를 맞출 때도 끌림 ${activation} · 시너지 ${benefit}로 안정감이 따라와요.`
        : `생활 리듬을 맞출 때 끌림 ${activation}이 버텨 주어, 조율할 여지가 충분해요.`;
    const balance =
      risk >= 58
        ? ` 가끔 신경전(긴장 ${risk})이 있어도, 서로를 향한 마음이 있어 균형을 찾기 좋은 단계예요.`
        : " 서로의 속도를 존중하면 오래 가기 좋은 흐름이에요.";
    return {
      topic: gauge.topic,
      title: "② 안정·균형",
      subtitle: "일상·미래·생활 리듬을 맞출 때",
      activation,
      benefit,
      risk,
      interpretation: appendBondNote(`${core}${balance}`, positive),
      isWarning: false,
    };
  }

  const isWarning = risk >= 88 && benefit < 30;
  const core =
    activation >= 65
      ? `의견이 부딪혀도 끌림(${activation})은 남아 있어, 관계가 쉽게 끊기지는 않아요.`
      : `갈등이 와도 서로에 대한 마음이 바닥까지 떨어지지 않는 편이에요.`;
  const caution =
    benefit <= 45
      ? ` 이때는 시너지(${benefit})가 잠깐 낮아지니, 날카로운 말 대신 한 박자 쉬었다가 말하면 금방 회복돼요.`
      : ` 시너지 ${benefit} · 긴장 ${risk} — 서로의 다름을 인정하면 오히려 깊어질 수 있어요.`;
  const growth =
    positive.hasDayStemSupport || positive.positiveCrossCount > 0
      ? " 다툰 뒤에도 다시 붙는 힘이 있는 조합이에요."
      : "";

  return {
    topic: gauge.topic,
    title: "③ 갈등·긴장",
    subtitle: "의견이 부딪히거나 싸울 때",
    activation,
    benefit,
    risk,
    interpretation: `${core}${caution}${growth}`,
    isWarning,
    axisNote,
  };
}

function axisNoteForTopic(
  topic: RelationshipTopicGauge["topic"],
  ctx: RomanticRuleContext,
): string | null | undefined {
  if (topic === "intimacy") {
    return resolveIntimacyAxisNote(ctx.surveyProfileA, ctx.surveyProfileB);
  }
  if (topic === "conflict") {
    return resolveConflictAxisNote(ctx.surveyProfileA, ctx.surveyProfileB);
  }
  return undefined;
}

export function buildSnapshotNarrative(params: {
  ctx: RomanticRuleContext;
  relationshipGauges: RelationshipTopicGauge[];
}): SnapshotNarrative {
  const positive = buildPositiveContext(params.ctx);
  return {
    topics: params.relationshipGauges.map((g) =>
      interpretTopic(g, positive, axisNoteForTopic(g.topic, params.ctx)),
    ),
  };
}

/** 저장된 패널용 — 점수만으로 narrative 복원 */
export function buildSnapshotNarrativeFromGauges(
  gauges: RelationshipTopicGauge[],
): SnapshotNarrative {
  return {
    topics: gauges.map((g) => interpretTopic(g)),
  };
}
