import type {
  RomanticInsightCandidate,
  RomanticScreenHint,
} from "./types";

/** Screen 1~6 슬롯 정의 — DB 없이 코드 config (Blueprint hookCopy 패턴) */
export type RomanticScreenKey =
  | "opening"
  | "nature"
  | "bond"
  | "hidden"
  | "conflict"
  | "action";

export type RomanticScreenSlot = {
  screen: 1 | 2 | 3 | 4 | 5 | 6;
  key: RomanticScreenKey;
  title: string;
  headline: string;
  body: string;
  insightId: string;
  screenHint: RomanticScreenHint;
  resolvedFrom: "ranked" | "fallback";
};

export type StoredRankedInsight = {
  id: string;
  source?: string;
  ruleType?: string;
  score?: number;
  headline: string;
  body: string;
  screenHint: RomanticScreenHint;
};

const SCREEN_LAYOUT: Array<{
  screen: 1 | 2 | 3 | 4 | 5 | 6;
  key: RomanticScreenKey;
  title: string;
  hints: RomanticScreenHint[];
}> = [
  { screen: 1, key: "opening", title: "관계 요약", hints: ["opening"] },
  { screen: 2, key: "nature", title: "서로의 성향", hints: ["nature"] },
  { screen: 3, key: "bond", title: "이 관계가 특별한 이유", hints: ["bond"] },
  { screen: 4, key: "hidden", title: "서로의 숨은 마음", hints: ["hidden"] },
  { screen: 5, key: "conflict", title: "갈등 패턴", hints: ["conflict"] },
  { screen: 6, key: "action", title: "실천 조언", hints: ["action"] },
];

const TENSION_RULE = new Set(["충", "형", "해", "파"]);

function asCandidate(i: StoredRankedInsight): RomanticInsightCandidate {
  return {
    id: i.id,
    source: (i.source as RomanticInsightCandidate["source"]) ?? "pair_cross",
    ruleType: i.ruleType,
    priority: 50,
    impact: 50,
    surprise: 40,
    score: i.score ?? 50,
    headline: i.headline,
    body: i.body,
    screenHint: i.screenHint,
  };
}

function findByHint(
  ranked: RomanticInsightCandidate[],
  hints: RomanticScreenHint[],
  excludeIds: Set<string>,
): RomanticInsightCandidate | undefined {
  return ranked.find(
    (i) => hints.includes(i.screenHint) && !excludeIds.has(i.id),
  );
}

function findBySource(
  pool: RomanticInsightCandidate[],
  source: RomanticInsightCandidate["source"],
): RomanticInsightCandidate | undefined {
  return pool.find((i) => i.source === source);
}

/** attraction(bond) 없을 때: metaphor + complement */
function fallbackAttraction(
  pool: RomanticInsightCandidate[],
): RomanticInsightCandidate {
  const metaphor = findBySource(pool, "metaphor_combo");
  const complement = findBySource(pool, "strength_complement");
  if (metaphor && complement) {
    return {
      ...metaphor,
      id: "fallback_attraction_combo",
      headline: metaphor.headline,
      body: `${metaphor.body}\n\n${complement.body}`,
      screenHint: "bond",
    };
  }
  return (
    complement ??
    metaphor ?? {
      id: "fallback_attraction_generic",
      source: "metaphor_combo",
      priority: 50,
      impact: 50,
      surprise: 40,
      score: 50,
      headline: "서로를 채우는 조합",
      body: "두 사람의 기질이 만나면 부족한 부분을 자연스럽게 보완해요.",
      screenHint: "bond",
    }
  );
}

/** conflict 없을 때: tension cross 중 priority 최고 = weakest area */
function fallbackConflict(
  pool: RomanticInsightCandidate[],
): RomanticInsightCandidate {
  const tensionHits = pool.filter(
    (i) =>
      i.source === "pair_cross" && i.ruleType && TENSION_RULE.has(i.ruleType),
  );
  const worst = [...tensionHits].sort(
    (a, b) => b.priority - a.priority || b.impact - a.impact,
  )[0];
  if (worst) {
    return {
      ...worst,
      id: `fallback_conflict_${worst.id}`,
      headline: worst.headline || "예민해지는 지점",
      body: worst.body,
      screenHint: "conflict",
    };
  }
  const dayTension = findBySource(pool, "pair_day_stem");
  if (dayTension?.ruleType === "상극") {
    return { ...dayTension, screenHint: "conflict" };
  }
  return {
    id: "fallback_conflict_generic",
    source: "pair_cross",
    ruleType: "충",
    priority: 50,
    impact: 55,
    surprise: 45,
    score: 50,
    headline: "속도 차이에서 오는 마찰",
    body: "감정의 속도나 표현 방식이 어긋날 때, 작은 말투 차이가 크게 느껴질 수 있어요.",
    screenHint: "conflict",
  };
}

/** story/action 부족 시 — 중복 한줄 나열 금지 */
function fallbackNarrativeSequence(
  _ranked: RomanticInsightCandidate[],
): RomanticInsightCandidate {
  return {
    id: "fallback_narrative_sequence",
    source: "metaphor_combo",
    priority: 55,
    impact: 58,
    surprise: 42,
    score: 55,
    headline: "실천 조언",
    body: "아래 항목을 상황에 맞게 골라 써 보세요.",
    screenHint: "action",
  };
}

function fallbackNature(
  pool: RomanticInsightCandidate[],
  ranked: RomanticInsightCandidate[],
): RomanticInsightCandidate {
  return (
    findByHint(ranked, ["nature"], new Set()) ??
    findBySource(pool, "strength_complement") ?? {
      id: "fallback_nature_generic",
      source: "strength_complement",
      priority: 50,
      impact: 50,
      surprise: 40,
      score: 50,
      headline: "서로 다른 리듬",
      body: "두 사람은 같은 목표를 향해도, 마음을 표현하는 방식은 달라요.",
      screenHint: "nature",
    }
  );
}

function fallbackHidden(
  ranked: RomanticInsightCandidate[],
  pool: RomanticInsightCandidate[],
): RomanticInsightCandidate {
  return (
    findByHint(ranked, ["hidden"], new Set()) ??
    pool.find((i) => i.source === "person_relation") ?? {
      id: "fallback_hidden_generic",
      source: "person_relation",
      priority: 50,
      impact: 48,
      surprise: 38,
      score: 48,
      headline: "말하지 않은 마음",
      body: "겉으로는 괜찮아 보여도, 속으로는 더 들어주길 바라는 순간이 있어요.",
      screenHint: "hidden",
    }
  );
}

function resolveSlotInsight(
  layout: (typeof SCREEN_LAYOUT)[number],
  ranked: RomanticInsightCandidate[],
  pool: RomanticInsightCandidate[],
  usedIds: Set<string>,
): { insight: RomanticInsightCandidate; resolvedFrom: "ranked" | "fallback" } {
  if (layout.screen === 1) {
    const top = ranked[0];
    if (top) {
      usedIds.add(top.id);
      return { insight: top, resolvedFrom: "ranked" };
    }
    const fb = fallbackAttraction(pool);
    return { insight: fb, resolvedFrom: "fallback" };
  }

  const hit = findByHint(ranked, layout.hints, usedIds);
  if (hit) {
    usedIds.add(hit.id);
    return { insight: hit, resolvedFrom: "ranked" };
  }

  let fallback: RomanticInsightCandidate;
  switch (layout.key) {
    case "nature":
      fallback = fallbackNature(pool, ranked);
      break;
    case "bond":
      fallback = fallbackAttraction(pool);
      break;
    case "hidden":
      fallback = fallbackHidden(ranked, pool);
      break;
    case "conflict":
      fallback = fallbackConflict(pool);
      break;
    case "action":
      fallback = fallbackNarrativeSequence(ranked);
      break;
    default:
      fallback = ranked[0] ?? fallbackAttraction(pool);
  }
  return { insight: fallback, resolvedFrom: "fallback" };
}

/** ranked_insights + pool → Screen 1~6 슬롯 (selector 후처리) */
export function buildRomanticScreenPlan(params: {
  ranked: RomanticInsightCandidate[];
  pool: RomanticInsightCandidate[];
}): RomanticScreenSlot[] {
  const ranked = [...params.ranked].sort((a, b) => b.score - a.score);
  const pool = params.pool.length ? params.pool : ranked;
  const usedIds = new Set<string>();

  return SCREEN_LAYOUT.map((layout) => {
    const { insight, resolvedFrom } = resolveSlotInsight(
      layout,
      ranked,
      pool,
      usedIds,
    );
    return {
      screen: layout.screen,
      key: layout.key,
      title: layout.title,
      headline: insight.headline,
      body: insight.body,
      insightId: insight.id,
      screenHint: insight.screenHint,
      resolvedFrom,
    };
  });
}

/** 저장된 meta.ranked_insights → Screen plan (클라이언트·레거시 호환) */
export function buildRomanticScreenPlanFromStored(params: {
  ranked_insights?: StoredRankedInsight[];
  section1?: { relationship_name?: string; one_line_summary?: string };
}): RomanticScreenSlot[] | null {
  const raw = params.ranked_insights;
  if (!raw?.length) {
    if (!params.section1?.relationship_name) return null;
    return [
      {
        screen: 1,
        key: "opening",
        title: "관계 요약",
        headline: params.section1.relationship_name,
        body: params.section1.one_line_summary ?? "",
        insightId: "legacy_section_1",
        screenHint: "opening",
        resolvedFrom: "fallback",
      },
    ];
  }

  const ranked = raw.map(asCandidate);
  return buildRomanticScreenPlan({ ranked, pool: ranked });
}

export function getScreen1Opening(
  plan: RomanticScreenSlot[] | null,
  section1: { relationship_name?: string; one_line_summary?: string; grade?: string },
): {
  headline: string;
  body: string;
  grade: string;
} {
  const s1 = plan?.find((s) => s.screen === 1);
  return {
    headline: s1?.headline ?? section1.relationship_name ?? "",
    body: s1?.body ?? section1.one_line_summary ?? "",
    grade: section1.grade?.trim() || "—",
  };
}
