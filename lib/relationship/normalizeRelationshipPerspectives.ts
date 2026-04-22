/**
 * LLM이 perspectives 키에 UUID를 정확히 못 맞춘 경우 보정.
 * report_id_a / report_id_b 기준으로 두 시점 블록만 남긴다.
 * 구형(me/partner/insight) 축은 신형으로 승격할 수 있다.
 */

export const RELATIONSHIP_AXIS_KEYS = [
  "emotional_sensitivity",
  "communication_style",
  "conflict_response",
  "energy_pattern",
] as const;

export type RelationshipAxisKey = (typeof RELATIONSHIP_AXIS_KEYS)[number];

function isRecord(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

/** 신형 축 블록 */
export function isNewAxisBlock(v: unknown): boolean {
  if (!isRecord(v)) return false;
  const insights = v.insights;
  const actions = v.actions;
  return (
    typeof v.my_line === "string" &&
    typeof v.partner_line === "string" &&
    Array.isArray(insights) &&
    Array.isArray(actions)
  );
}

/** 구형 축 블록 */
export function isLegacyAxisBlock(v: unknown): boolean {
  if (!isRecord(v)) return false;
  return (
    typeof v.me === "string" &&
    typeof v.partner === "string" &&
    typeof v.insight === "string" &&
    !("my_line" in v)
  );
}

function stripInsightPrefix(s: string): string {
  return s.replace(/^💡\s*/, "").trim();
}

function padToTwo(arr: unknown[], filler: [string, string]): string[] {
  const out = arr
    .filter((x): x is string => typeof x === "string")
    .map((s) => s.trim())
    .filter(Boolean);
  if (out.length === 0) return [...filler];
  if (out.length === 1) return [out[0]!, filler[1]];
  return [out[0]!, out[1]!];
}

/** LLM이 insights/actions를 비우면 축마다 다른 문장을 채워 UI 반복을 막음 */
const AXIS_INSIGHT_FALLBACK: Record<
  RelationshipAxisKey,
  [string, string]
> = {
  emotional_sensitivity: [
    "기분 천이가 다른 쪽과 겉으로 잘 안 드러내는 쪽이면 신호가 한 박자씩 어긋나기 쉬워.",
    "말 줄이기보다 오늘은 톤만 한 단계 낮춰서 한 문장만 던져 봐.",
  ],
  communication_style: [
    "한쪽은 호흡을 끊지 않고 말이 이어지길 원하고, 한쪽은 말 사이 공백이 있어야 편해서 속도가 안 맞을 수 있어.",
    "답하기 전에 ‘지금 들은 말 한 줄로만 말해주면?’ 한 번만 물어봐.",
  ],
  conflict_response: [
    "한쪽은 바로 말로 정리하고 싶은데, 한쪽은 먼저 거리를 두고 싶어서 같은 사건에도 반응 시점이 갈라질 수 있어.",
    "말이 거칠어지기 전에 ‘잠깐만’이라고 먼저 붙이고 숨 고르기로 약속해 봐.",
  ],
  energy_pattern: [
    "충전이 사람 옆에서 되는지 혼자서 되는지 다르면 만남 길이랑 일정 밀도를 맞추기 어려울 수 있어.",
    "오늘 만남 끝날 때 다음 약속은 ‘짧게’ 혹은 ‘널널하게’ 둘 중 하나로만 잡아 봐.",
  ],
};

const AXIS_ACTION_FALLBACK: Record<RelationshipAxisKey, [string, string]> = {
  emotional_sensitivity: [
    "눈 마주치고 ‘지금 피곤해?’만 물어봐.",
    "문자 한 통은 이모지 없이 짧게, 사실 위주로만 보내 봐.",
  ],
  communication_style: [
    "상대가 말 끊을 때까지 세고, 끝나면 그다음에만 한 가지 질문해 봐.",
    "긴 얘기 전엔 ‘요점만 말해줄게’ 한마디로 프레임만 맞춰 봐.",
  ],
  conflict_response: [
    "싸운 날 밤엔 해결 안 해도 되니 ‘내일 한 가지만 이야기하자’만 남겨 봐.",
    "방에서 나올 땐 문 잠그지 말고 호흡부터 맞추기로 해 봐.",
  ],
  energy_pattern: [
    "이번 주말 약속은 시작 시간만 정하고, 헤어질 땐 각자 집 가서 쉬기로 해 봐.",
    "만나기 전에 ‘오늘은 가볍게’ 혹은 ‘오늘은 같이 풀자’ 모드 한 가지만 맞춰 봐.",
  ],
};

function upgradeLegacyAxis(
  legacy: {
    me: string;
    partner: string;
    insight: string;
  },
  axisKey: RelationshipAxisKey,
): Record<string, unknown> {
  const ins = stripInsightPrefix(legacy.insight);
  return {
    my_nickname: "",
    partner_nickname: "",
    my_line: legacy.me.trim(),
    partner_line: legacy.partner.trim(),
    insights: padToTwo(ins ? [ins] : [], AXIS_INSIGHT_FALLBACK[axisKey]),
    actions: [...AXIS_ACTION_FALLBACK[axisKey]],
  };
}

/** 단일 축을 신형으로 통일 + 닉네임 주입 */
function normalizeOneAxis(
  raw: unknown,
  myNickname: string,
  partnerNickname: string,
  axisKey: RelationshipAxisKey,
): Record<string, unknown> | null {
  let base: Record<string, unknown>;
  if (isNewAxisBlock(raw)) {
    base = { ...(raw as Record<string, unknown>) };
  } else if (isLegacyAxisBlock(raw)) {
    base = upgradeLegacyAxis(
      raw as { me: string; partner: string; insight: string },
      axisKey,
    );
  } else {
    return null;
  }

  base.my_nickname = myNickname;
  base.partner_nickname = partnerNickname;
  base.my_line = String(base.my_line ?? "").trim();
  base.partner_line = String(base.partner_line ?? "").trim();
  base.insights = padToTwo(
    Array.isArray(base.insights) ? base.insights : [],
    AXIS_INSIGHT_FALLBACK[axisKey],
  );
  base.actions = padToTwo(
    Array.isArray(base.actions) ? base.actions : [],
    AXIS_ACTION_FALLBACK[axisKey],
  );

  return base;
}

/** 한 사람 시점 객체 전체 */
function normalizePerspectiveObject(
  raw: unknown,
  myNickname: string,
  partnerNickname: string,
): Record<string, unknown> | null {
  if (!isRecord(raw)) return null;
  const out: Record<string, unknown> = {};
  for (const k of RELATIONSHIP_AXIS_KEYS) {
    const axis = normalizeOneAxis(raw[k], myNickname, partnerNickname, k);
    if (!axis) return null;
    out[k] = axis;
  }
  return out;
}

export function isPerspectiveBlock(v: unknown): boolean {
  if (!isRecord(v)) return false;
  return RELATIONSHIP_AXIS_KEYS.every((k) => {
    const ax = v[k];
    return isNewAxisBlock(ax) || isLegacyAxisBlock(ax);
  });
}

/** 구형 축이 하나라도 있으면 true (DB 마이그레이션용) */
export function perspectiveHasLegacyAxes(p: unknown): boolean {
  if (!isRecord(p)) return false;
  return RELATIONSHIP_AXIS_KEYS.some((k) => isLegacyAxisBlock(p[k]));
}

/** 두 리포트 id 각각에 대한 시점 데이터가 모두 있는지 */
export function hasCompletePerspectives(
  resultBasic: unknown,
  reportIdA: string,
  reportIdB: string,
): boolean {
  const p = (resultBasic as { perspectives?: Record<string, unknown> })
    ?.perspectives;
  if (!p || typeof p !== "object") return false;
  const a = p[reportIdA];
  const b = p[reportIdB];
  return isPerspectiveBlock(a) && isPerspectiveBlock(b);
}

export function normalizeRelationshipPerspectives(
  parsed: { perspectives?: Record<string, unknown> },
  reportIdA: string,
  reportIdB: string,
  nicknameA: string,
  nicknameB: string,
): { perspectives: Record<string, unknown> } | null {
  const raw = parsed.perspectives;
  if (!raw || typeof raw !== "object") return null;

  const nameA = nicknameA.trim() || "첫 번째";
  const nameB = nicknameB.trim() || "두 번째";

  const tryBuild = (sliceA: unknown, sliceB: unknown) => {
    if (!isPerspectiveBlock(sliceA) || !isPerspectiveBlock(sliceB)) return null;
    const canonA = normalizePerspectiveObject(sliceA, nameA, nameB);
    const canonB = normalizePerspectiveObject(sliceB, nameB, nameA);
    if (!canonA || !canonB) return null;
    return {
      perspectives: {
        [reportIdA]: canonA,
        [reportIdB]: canonB,
      },
    };
  };

  const byIdA = raw[reportIdA];
  const byIdB = raw[reportIdB];
  const direct = tryBuild(byIdA, byIdB);
  if (direct) return direct;

  const values = Object.values(raw).filter(isPerspectiveBlock) as unknown[];
  if (values.length >= 2) {
    return tryBuild(values[0], values[1]);
  }

  return null;
}
