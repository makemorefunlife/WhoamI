/**
 * 유료 통합 리포트 문자열을 Part / 소제목 블록으로 나눔 (마크다운 테이블·목록 유지)
 */

export type PartBodyBlock =
  | { type: "intro"; markdown: string }
  | { type: "subsection"; label: string; title: string; markdown: string };

export type ParsedReportSection =
  | { kind: "preamble"; markdown: string }
  | { kind: "part"; num: number; title: string; blocks: PartBodyBlock[] }
  | { kind: "appendix"; title: string; blocks: PartBodyBlock[] };

/** Part N 제목 구분자: 콜론, 하이픈, en/em dash, 공백 */
const PART_HEADER =
  /^Part\s*(\d+)\s*(?:[：:]\s*|[—–\-]\s*|\s+)?(.*)$/i;
const SUBSECTION_LINE = /^(\d+)\s*-\s*(\d+)\s*[\.．]?\s*(.*)$/;

/** ## / ### / **Part N — 제목** 등 장식 제거 */
function normalizeSectionLine(line: string): string {
  let t = line.trim();
  t = t.replace(/^#{1,6}\s+/, "");
  const boldWrap = t.match(/^\*{1,2}(.+?)\*{1,2}$/s);
  if (boldWrap) t = boldWrap[1].trim();
  t = t.replace(/^\*+|\*+$/g, "").trim();
  return t;
}

function parsePartHeader(
  line: string,
): { num: number; title: string } | null {
  const normalized = normalizeSectionLine(line);
  const m = normalized.match(PART_HEADER);
  if (!m) return null;
  const title = (m[2] ?? "").replace(/\*+$/g, "").trim();
  return { num: Number(m[1]), title };
}

function isPartStartLine(line: string): boolean {
  return parsePartHeader(line) !== null;
}

function hasPartMarkers(text: string): boolean {
  return (
    /(?:^|\n)\s*(?:#{1,6}\s+)?(?:\*{1,2}\s*)?Part\s*\d/i.test(text) ||
    /(?:^|\n)\s*(?:#{1,6}\s+)?(?:\*{1,2}\s*)?부록/mi.test(text)
  );
}

/**
 * "### 1-1. 제목" 형태를 "1-1. 제목"으로 바꿔 splitPartBody가 같은 줄 규칙으로 인식하게 함
 */
function stripMarkdownHashesFromNumericSubsectionLines(text: string): string {
  return text.replace(
    /^#{1,6}\s+((?:\d+)\s*-\s*(?:\d+)\s*[\.．]?\s*[^\n]*)$/gm,
    "$1",
  );
}

function isAppendixStart(line: string): boolean {
  const t = normalizeSectionLine(line);
  return /^부록(?:\s|$|[：:—–\-])/i.test(t);
}

/**
 * 마크다운 헤딩(### …) 다음에 빈 줄 없이 본문이 오면, 헤딩과 본문이 한 덩어리로 렌더링되는 문제 방지.
 * 헤딩 줄 직후에 빈 줄을 한 줄 삽입한다.
 */
function insertBlankLineAfterMarkdownHeadings(text: string): string {
  const lines = text.split("\n");
  const out: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    out.push(lines[i]);
    const cur = lines[i].trim();
    const next = lines[i + 1];
    if (next === undefined) continue;
    if (!/^#{1,6}\s+\S/.test(cur)) continue;

    const nextT = next.trim();
    if (nextT === "") continue;
    if (/^#{1,6}\s/.test(nextT)) continue;
    if (/^>\s/.test(nextT)) continue;
    if (/^[-*+]\s/.test(nextT)) continue;
    if (/^\d+\.\s/.test(nextT)) continue;
    if (/^\|.+\|/.test(nextT)) continue;
    if (nextT.startsWith("```")) continue;
    if (isPartStartLine(nextT)) continue;
    if (isAppendixStart(next)) continue;

    out.push("");
  }

  return out.join("\n");
}

function collectUntilNextSection(lines: string[], start: number): {
  chunk: string;
  nextIndex: number;
} {
  const buf: string[] = [];
  let i = start;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    if (isPartStartLine(trimmed) || isAppendixStart(trimmed)) {
      break;
    }
    buf.push(line);
    i++;
  }
  return { chunk: buf.join("\n"), nextIndex: i };
}

/** Part N 본문에서 소제목 n-m 으로 분할 */
function splitPartBody(body: string): PartBodyBlock[] {
  const t = body.trim();
  if (!t) return [];

  const segments = t.split(/(?=^\d+\s*-\s*\d+\s*[\.．]?\s+)/m);
  const blocks: PartBodyBlock[] = [];

  for (const seg of segments) {
    const s = seg.trim();
    if (!s) continue;

    const firstNl = s.indexOf("\n");
    const firstLineRaw = firstNl === -1 ? s : s.slice(0, firstNl);
    const rest = firstNl === -1 ? "" : s.slice(firstNl + 1).trim();

    const firstLine = firstLineRaw.replace(/^#{1,6}\s+/, "").trim();
    const m = firstLine.match(SUBSECTION_LINE);
    if (m) {
      const label = `${m[1]}-${m[2]}`;
      const title = (m[3] ?? "").trim();
      blocks.push({
        type: "subsection",
        label,
        title,
        markdown: rest,
      });
    } else {
      blocks.push({ type: "intro", markdown: s });
    }
  }

  return blocks;
}

export function parseReportStructure(raw: string): ParsedReportSection[] | null {
  let normalized = raw.replace(/\r\n/g, "\n");
  normalized = stripMarkdownHashesFromNumericSubsectionLines(normalized);
  normalized = insertBlankLineAfterMarkdownHeadings(normalized);
  normalized = normalized.trim();
  if (!normalized) return [];

  if (!hasPartMarkers(normalized)) {
    return null;
  }

  const lines = normalized.split("\n");
  const out: ParsedReportSection[] = [];
  let preamble: string[] = [];
  let i = 0;

  const flushPreamble = () => {
    const md = preamble.join("\n").trim();
    if (md) out.push({ kind: "preamble", markdown: md });
    preamble = [];
  };

  while (i < lines.length) {
    const trimmed = lines[i].trim();
    const partH = parsePartHeader(trimmed);

    if (partH) {
      flushPreamble();
      const { num, title } = partH;
      i++;
      const { chunk, nextIndex } = collectUntilNextSection(lines, i);
      i = nextIndex;
      const blocks = splitPartBody(chunk);
      out.push({
        kind: "part",
        num,
        title,
        blocks,
      });
      continue;
    }

    if (isAppendixStart(trimmed)) {
      flushPreamble();
      const ap = trimmed.match(/^부록\s*(?:[：:—–\-]\s*)?(.*)$/i);
      const title = (ap?.[1] ?? "").trim() || "부록";
      i++;
      const { chunk, nextIndex } = collectUntilNextSection(lines, i);
      i = nextIndex;
      const blocks = splitPartBody(chunk);
      out.push({ kind: "appendix", title, blocks });
      continue;
    }

    preamble.push(lines[i]);
    i++;
  }

  flushPreamble();
  return out;
}
