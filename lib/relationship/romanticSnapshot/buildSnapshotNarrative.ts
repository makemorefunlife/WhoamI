import type { RomanticRuleContext } from "@/lib/relationship/romanticRules/types";
import {
  resolveIntimacyAxisNote,
  resolveConflictAxisNote,
  pick,
} from "@/lib/relationship/romanticRules/relationshipDynamics";
import { polishRomanticDisplayText } from "@/lib/relationship/romanticEverydayText";
import type { RomanticHeadlineLocale } from "@/lib/relationship/romanticHeadline/locale";
import { normalizeRomanticHeadlineLocale } from "@/lib/relationship/romanticHeadline/locale";
import { getTriScoreKindConfig } from "@/lib/relationship/triScoreSnapshot/kinds";
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
  detailedWhy?: string;
  strength?: string;
  caution?: string;
  scene?: string;
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
  const locale = ctx.locale;

  let bondPhrase: string | null = null;
  if (hasDayStemSupport && hasYukhap) {
    bondPhrase = pick(
      locale,
      "Your core day-stems energize each other, and there's a natural pull that keeps drawing you together — a warm base to build on.",
      "일간이 서로를 키워 주고, 끌림이 자연스럽게 이어지는 합도 있어 기본 바탕이 따뜻한 조합이에요.",
    );
  } else if (hasDayStemSupport) {
    bondPhrase = pick(
      locale,
      "Your core temperaments bring out the best in each other, so the closer you get, the more you end up cheering each other on.",
      "핵심 기질이 서로를 살려 주는 상생이라, 가까워질수록 응원이 되는 면이 커요.",
    );
  } else if (hasYukhap || positiveCrossCount >= 1) {
    bondPhrase = pick(
      locale,
      "There's an easy, natural pull between you from the start, so the spark you felt when you first met tends to carry through.",
      "처음부터 편하게 끌리는 합(合)이 있어, 만났을 때의 호감이 잘 이어지는 편이에요.",
    );
  } else if (ctx.eventScores.overall.benefit >= 60) {
    bondPhrase = pick(
      locale,
      "Synergy comes alive when you're together.",
      "함께 있을 때 시너지가 살아나는 조합이에요.",
    );
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
  locale?: RomanticHeadlineLocale,
): SnapshotTopicNarrative {
  const activation = Math.round(gauge.activation);
  const benefit = Math.round(gauge.benefit);
  const risk = Math.round(gauge.risk);
  const appLocale = normalizeRomanticHeadlineLocale(locale) === "en" ? "en-US" : "ko-KR";
  const topicMeta = getTriScoreKindConfig("romantic", appLocale).topics.find(
    (t) => t.topic === gauge.topic,
  );

  if (gauge.topic === "intimacy") {
    const core = pick(
      locale,
      activation >= 70 && benefit >= 75
        ? "The two of you alone are the best — attraction and the joy of being together both run high."
        : activation >= 60
          ? "The closer you get, the more the attraction comes alive. Energy gathers well in your one-on-one time."
          : "A type where a comfortable pull grows the more slowly you get close.",
      activation >= 70 && benefit >= 75
        ? "단둘이 감정을 나눌 때는 최고예요. 매력과 함께 있을 때의 즐거움이 크게 올라옵니다."
        : activation >= 60
          ? "가까워질수록 끌림이 살아나요. 둘만의 시간에 에너지가 잘 모입니다."
          : "천천히 가까워질수록 편안한 끌림이 자라는 타입이에요.",
    );
    const extra = pick(
      locale,
      risk < 55 ? " Sensitivity runs low, so it's easy to just enjoy the butterflies." : "",
      risk < 55 ? " 예민은 낮은 편이라, 설레는 마음을 즐기기 좋아요." : "",
    );
    return {
      topic: gauge.topic,
      title: topicMeta?.cardTitle ?? pick(locale, "① Chemistry & Attraction", "① 친밀·끌림"),
      subtitle: topicMeta?.cardSubtitle ?? pick(locale, "A spark, dates, alone together", "썸·데이트·둘만 있을 때"),
      activation,
      benefit,
      risk,
      interpretation: appendBondNote(`${core}${extra}`, positive),
      isWarning: false,
      axisNote,
    };
  }

  if (gauge.topic === "stability") {
    const core = pick(
      locale,
      benefit >= 68
        ? `Even when matching daily life and the future, attraction ${activation} · chemistry ${benefit} keeps a sense of stability with you.`
        : `When matching your everyday rhythm, attraction ${activation} holds steady, leaving plenty of room to tune it further.`,
      benefit >= 68
        ? `일상·미래를 맞출 때도 호감 ${activation} · 케미 ${benefit}로 안정감이 따라와요.`
        : `생활 리듬을 맞출 때 호감 ${activation}이 버텨 주어, 조율할 여지가 충분해요.`,
    );
    const balance = pick(
      locale,
      risk >= 58
        ? ` There may be occasional friction (sensitivity ${risk}), but the care you have for each other makes this a good stage to find balance.`
        : " Respecting each other's pace makes this a good foundation for the long run.",
      risk >= 58
        ? ` 가끔 신경전(예민 ${risk})이 있어도, 서로를 향한 마음이 있어 균형을 찾기 좋은 단계예요.`
        : " 서로의 속도를 존중하면 오래 가기 좋은 흐름이에요.",
    );
    return {
      topic: gauge.topic,
      title: topicMeta?.cardTitle ?? pick(locale, "② Stability & Balance", "② 안정·균형"),
      subtitle: topicMeta?.cardSubtitle ?? pick(locale, "Daily life, the future, matching your pace", "일상·미래·생활 리듬을 맞출 때"),
      activation,
      benefit,
      risk,
      interpretation: appendBondNote(`${core}${balance}`, positive),
      isWarning: false,
    };
  }

  const isWarning = risk >= 88 && benefit < 30;
  const core = pick(
    locale,
    activation >= 65
      ? `Even when opinions clash, attraction (${activation}) sticks around, so the relationship doesn't break easily.`
      : `Even when conflict comes up, your feelings for each other tend not to bottom out.`,
    activation >= 65
      ? `의견이 부딪혀도 호감(${activation})은 남아 있어, 관계가 쉽게 끊기지는 않아요.`
      : `갈등이 와도 서로에 대한 마음이 바닥까지 떨어지지 않는 편이에요.`,
  );
  const caution = pick(
    locale,
    benefit <= 45
      ? ` Chemistry (${benefit}) dips a bit at times like this — pause a beat instead of a sharp word and it recovers quickly.`
      : ` Chemistry ${benefit} · sensitivity ${risk} — acknowledging your differences can actually deepen the bond.`,
    benefit <= 45
      ? ` 이때는 케미(${benefit})가 잠깐 낮아지니, 날카로운 말 대신 한 박자 쉬었다가 말하면 금방 회복돼요.`
      : ` 케미 ${benefit} · 예민 ${risk} — 서로의 다름을 인정하면 오히려 깊어질 수 있어요.`,
  );
  const growth = pick(
    locale,
    positive.hasDayStemSupport || positive.positiveCrossCount > 0
      ? " There's a strength that pulls you back together even after a fight."
      : "",
    positive.hasDayStemSupport || positive.positiveCrossCount > 0
      ? " 다툰 뒤에도 다시 붙는 힘이 있는 조합이에요."
      : "",
  );

  return {
    topic: gauge.topic,
    title: topicMeta?.cardTitle ?? pick(locale, "③ Conflict & Tension", "③ 갈등·긴장"),
    subtitle: topicMeta?.cardSubtitle ?? pick(locale, "When opinions clash or you fight", "의견이 부딪히거나 싸울 때"),
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
    return resolveIntimacyAxisNote(ctx.surveyProfileA, ctx.surveyProfileB, ctx.locale);
  }
  if (topic === "conflict") {
    return resolveConflictAxisNote(ctx.surveyProfileA, ctx.surveyProfileB, ctx.locale);
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
      interpretTopic(
        g,
        positive,
        axisNoteForTopic(g.topic, params.ctx),
        params.ctx.locale,
      ),
    ),
  };
}

/** 저장된 패널용 — 점수만으로 narrative 복원 */
export function buildSnapshotNarrativeFromGauges(
  gauges: RelationshipTopicGauge[],
  locale?: RomanticHeadlineLocale,
): SnapshotNarrative {
  return {
    topics: gauges.map((g) =>
      interpretTopic(
        g,
        { bondPhrase: null, hasDayStemSupport: false, hasYukhap: false, positiveCrossCount: 0 },
        undefined,
        locale,
      ),
    ),
  };
}
