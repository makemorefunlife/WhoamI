/** 연인 리포트 타임라인 — 1·3·5·10년 구간, 사주 용어 없이 */

export type TimelineBlock = {
  period: string;
  body: string;
  sub?: string;
};

const HORIZONS = [
  { offset: 0, llmKeys: ["current"] as const },
  { offset: 1, llmKeys: ["in_1_year", "in_1_years"] as const },
  { offset: 3, llmKeys: ["in_3_years"] as const },
  { offset: 5, llmKeys: ["in_5_years", "turning_point"] as const },
  { offset: 10, llmKeys: ["in_10_years"] as const },
] as const;

const SAJU_NOTE_RE =
  /A\s*:\s*|B\s*:\s*|상생|상극|살림|누름|일간|일지|월지|대운|세운|용신|기신|오행|십성|지지|천간/g;

function extractBaseYear(
  llm: Record<string, Record<string, string>>,
  metaYear?: number,
): number {
  const fromMeta = metaYear;
  if (fromMeta && Number.isFinite(fromMeta)) return fromMeta;

  for (const block of Object.values(llm)) {
    const hit = block?.period?.match(/(20\d{2})/);
    if (hit) return Number.parseInt(hit[1]!, 10);
  }

  return new Date().getFullYear();
}

function pickBlockText(block?: Record<string, string>): string {
  if (!block) return "";
  return [
    block.description,
    block.change,
    block.growth,
    block.vision,
    block.advice,
  ]
    .map((s) => s?.trim())
    .filter(Boolean)
    .join(" ");
}

function pickBlockSub(block?: Record<string, string>): string {
  if (!block) return "";
  return (
    [block.focus, block.prepare, block.goal, block.memory, block.message]
      .map((s) => s?.trim())
      .find(Boolean) ?? ""
  );
}

export function humanizeFortuneTimelineNote(note: string | undefined): string {
  const raw = note?.trim() ?? "";
  if (!raw || SAJU_NOTE_RE.test(raw)) {
    if (/상극|긴장|누름/.test(raw)) {
      return "지금은 기대나 속도가 어긋나면 마찰이 커지기 쉬운 시기예요. 말투를 부드럽게 맞추는 게 중요해요.";
    }
    if (/상생|살림/.test(raw)) {
      return "서로를 받쳐 주기 좋은 흐름이에요. 고마움과 칭찬을 자주 나누면 관계가 더 단단해져요.";
    }
    return "작은 습관과 대화 방식을 맞추면 관계 온도가 안정돼요.";
  }
  return raw.replace(SAJU_NOTE_RE, "").replace(/\s+/g, " ").trim();
}

function defaultBodyForHorizon(
  offset: number,
  fortuneNote?: string,
): string {
  if (offset === 0) {
    return humanizeFortuneTimelineNote(fortuneNote);
  }
  if (offset === 1) {
    return "서로의 말버릇과 갈등 패턴을 알아차리기 시작해요. 작은 오해를 바로 풀 수 있는 습관이 쌓여요.";
  }
  if (offset === 3) {
    return "함께하는 리듬이 익숙해지고, 갈등 뒤 회복하는 방법도 자연스러워져요.";
  }
  if (offset === 5) {
    return "관계에서 기대하는 역할과 미래 그림이 더 분명해져요. 중요한 선택을 함께 검토하기 좋아요.";
  }
  return "지금의 다툼과 성장이 추억이 되고, 서로에 대한 신뢰가 깊어지는 시기예요.";
}

function periodLabel(offset: number, year: number): string {
  if (offset === 0) return `📍 지금 (${year}년)`;
  return `📍 ${offset}년 뒤 (${year}년)`;
}

export function buildRomanticTimelineBlocks(params: {
  llm: Record<string, Record<string, string>>;
  metaYear?: number;
  fortuneNote?: string;
  polish: (text: string) => string;
}): TimelineBlock[] {
  const { llm, metaYear, fortuneNote, polish } = params;
  const baseYear = extractBaseYear(llm, metaYear);

  return HORIZONS.map(({ offset, llmKeys }) => {
    const year = baseYear + offset;
    let block: Record<string, string> | undefined;
    for (const key of llmKeys) {
      if (llm[key]) {
        block = llm[key];
        break;
      }
    }

    const rawBody = pickBlockText(block);
    const body = polish(
      rawBody || defaultBodyForHorizon(offset, offset === 0 ? fortuneNote : undefined),
    );
    const subRaw = pickBlockSub(block);
    const sub = subRaw ? polish(subRaw) : undefined;

    return {
      period: periodLabel(offset, year),
      body,
      sub: sub && sub !== body ? sub : undefined,
    };
  }).filter((row) => row.body.trim().length > 0);
}
