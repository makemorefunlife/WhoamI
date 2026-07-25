/**
 * Korean tone guards — shared across every LLM-generated report surface
 * (relationship premium domains, personal Blueprint/Essence, deep reports,
 * and any future diary/journal analysis). Not relationship-specific.
 *
 * 1) repairBrokenKoFragments — 기계적 파편 수리:
 *    - "… — 편으로 보일 수 있으며," 대시 매크로 잔재 제거
 *    - 한글 문장 사이에 낀 대시(— – ㅡ)를 쉼표/연결어미/문장 분리로 순화
 *    - "단정하지 고" / "신중하게 통하는" 등 알려진 텍스트 파손 복구
 * 2) normalizeSpeechLevelKo — 문어체/해라체 종결을 해요체로 정규화.
 *    합쇼체(~입니다/~합니다)는 허용 문체이므로 건드리지 않는다.
 *    종결어미·고빈도 형용사/동사 화이트리스트만 변환 — 문장 중간(관형/인용)
 *    "~다"는 손대지 않는다.
 * 3) ensurePoliteKoCellEnding — 비교 표 셀 전용. 명사형 종결("~하는 편",
 *    "~스타일")에 이에요/예요를 붙여 셀 단위로 존댓말을 강제한다.
 * 4) polishKoStringTree — 임의의 JSON 구조(개인분석 리포트 등)를 순회하며
 *    모든 문자열 리프에 polishKoTone을 적용한다. 한글이 없는 값(enum, locale
 *    코드 등)은 정규식이 매치되지 않아 그대로 통과한다.
 */

const HANGUL_BASE = 0xac00;
const HANGUL_LAST = 0xd7a3;

function isHangulSyllable(ch: string): boolean {
  const code = ch.charCodeAt(0);
  return code >= HANGUL_BASE && code <= HANGUL_LAST;
}

function hasBatchim(ch: string): boolean {
  if (!isHangulSyllable(ch)) return false;
  return (ch.charCodeAt(0) - HANGUL_BASE) % 28 !== 0;
}

function decompose(ch: string): { cho: number; jung: number; jong: number } {
  const code = ch.charCodeAt(0) - HANGUL_BASE;
  return {
    cho: Math.floor(code / 588),
    jung: Math.floor((code % 588) / 28),
    jong: code % 28,
  };
}

function compose(cho: number, jung: number, jong: number): string {
  return String.fromCharCode(HANGUL_BASE + cho * 588 + jung * 28 + jong);
}

/** 문장 종결 위치에서만 매칭 — 뒤가 문장부호/쉼표/닫는 괄호이거나 문자열 끝. */
const END = "(?=[.。!?…,)]|$)";

export function repairBrokenKoFragments(text: string): {
  text: string;
  fixed: boolean;
} {
  // 빈 칸 플레이스홀더("—")는 손대지 않는다 — 비교 표 미존재 셀 등.
  if (/^[—–\-ㅡ]+$/.test(text.trim())) {
    return { text, fixed: false };
  }

  let out = text;

  // 대시 매크로 파편: "…다 — 편으로 보일 수 있으며, 실제 …" → 머리 없는 절 제거
  out = out.replace(/\s*[—–-]\s*편으로\s*보일\s*수\s*있으며[,，]?\s*/g, ". ");
  // 명사구 뒤 대시 → 연결어미로 자연 연결: "다정한 편 — 갈등…" → "다정한 편인데, 갈등…"
  out = out.replace(
    /(편|쪽|스타일|타입|성향)\s*[—–ㅡ]+\s*(?=[가-힣])/g,
    "$1인데, ",
  );
  // 평서 종결 뒤 대시 → 문장 분리: "보여준다ㅡ선물을…" → "보여준다. 선물을…"
  out = out.replace(/([다요])\s*[—–ㅡ]+\s*(?=[가-힣])/g, "$1. ");
  // 그 외 한글 사이의 대시(— – ㅡ) → 쉼표. 숫자 범위(10-20)·영문은 제외
  out = out.replace(/([가-힣.,!?%)])\s*[—–ㅡ]+\s*(?=[가-힣])/g, "$1, ");
  // 셀/문장 맨 앞의 고아 대시 제거
  out = out.replace(/^\s*[—–ㅡ]+\s*/g, "");
  // 문장부호 직후 중복 쉼표 정리
  out = out.replace(/([.。!?…]),\s*/g, "$1 ");

  // 알려진 텍스트 파손
  out = out.replace(/단정하지\s+고(?=[\s,.)]|$)/g, "단정하지 말고");
  out = out.replace(/신중하게\s+통하는/g, "신중하게 소통하는");

  // 위 수리가 실제로 일어난 경우에만 문장부호 뒷정리
  if (out !== text) {
    out = out
      .replace(/\.\s*\./g, ".")
      .replace(/\s{2,}/g, " ")
      .replace(/\s+\./g, ".")
      .trim();
  }

  return { text: out, fixed: out !== text };
}

/** 고빈도 형용사/불규칙 동사 — 정규 활용이 필요한 것들은 명시 매핑. */
const PLAIN_TO_HAEYO: Array<[RegExp, string]> = [
  [new RegExp(`것이다${END}`, "g"), "거예요"],
  [new RegExp(`보인다${END}`, "g"), "보여요"],
  [new RegExp(`많다${END}`, "g"), "많아요"],
  [new RegExp(`적다${END}`, "g"), "적어요"],
  [new RegExp(`크다${END}`, "g"), "커요"],
  [new RegExp(`작다${END}`, "g"), "작아요"],
  [new RegExp(`높다${END}`, "g"), "높아요"],
  [new RegExp(`낮다${END}`, "g"), "낮아요"],
  [new RegExp(`길다${END}`, "g"), "길어요"],
  [new RegExp(`짧다${END}`, "g"), "짧아요"],
  [new RegExp(`빠르다${END}`, "g"), "빨라요"],
  [new RegExp(`느리다${END}`, "g"), "느려요"],
  [new RegExp(`다르다${END}`, "g"), "달라요"],
  [new RegExp(`같다${END}`, "g"), "같아요"],
  [new RegExp(`좋다${END}`, "g"), "좋아요"],
  [new RegExp(`싫다${END}`, "g"), "싫어요"],
  [new RegExp(`쉽다${END}`, "g"), "쉬워요"],
  [new RegExp(`어렵다${END}`, "g"), "어려워요"],
  [new RegExp(`무겁다${END}`, "g"), "무거워요"],
  [new RegExp(`가볍다${END}`, "g"), "가벼워요"],
  [new RegExp(`깊다${END}`, "g"), "깊어요"],
  [new RegExp(`넓다${END}`, "g"), "넓어요"],
  [new RegExp(`강하다${END}`, "g"), "강해요"],
  [new RegExp(`약하다${END}`, "g"), "약해요"],
  // ㄹ-탈락·ㄷ-불규칙 동사의 현재형은 명시 매핑 (일반 규칙으로는 오변환)
  [new RegExp(`만든다${END}`, "g"), "만들어요"],
  [new RegExp(`든다${END}`, "g"), "들어요"],
  [new RegExp(`안다${END}`, "g"), "알아요"],
  [new RegExp(`산다${END}`, "g"), "살아요"],
  [new RegExp(`운다${END}`, "g"), "울어요"],
  [new RegExp(`연다${END}`, "g"), "열어요"],
  [new RegExp(`논다${END}`, "g"), "놀아요"],
  [new RegExp(`듣는다${END}`, "g"), "들어요"],
  [new RegExp(`걷는다${END}`, "g"), "걸어요"],
];

/** ㅏ/ㅗ 모음 → 아요, 그 외 → 어요 (모음조화). */
function harmonyEnding(stem: string): string {
  const { jung } = decompose(stem);
  return jung === 0 || jung === 8 ? "아요" : "어요";
}

/** "먹는다"류 — 받침 있는 어간 + 는다. */
function convertNeundaEnding(text: string): string {
  return text.replace(
    new RegExp(`([가-힣])는다${END}`, "g"),
    (_m, stem: string) => `${stem}${harmonyEnding(stem)}`,
  );
}

/**
 * "간다/온다/준다"류 — 어간 개음절 + ㄴ받침 축약형.
 * ㄴ받침을 벗겨 어간을 복원한 뒤 축약 활용을 적용한다.
 * 모호하거나 불규칙 위험이 있는 모음은 변환하지 않는다.
 */
function convertNdaEnding(text: string): string {
  return text.replace(
    new RegExp(`([가-힣])다${END}`, "g"),
    (match, prev: string) => {
      const { cho, jung, jong } = decompose(prev);
      if (jong !== 4) return match; // ㄴ받침이 아니면 어간 축약형이 아님
      const open = compose(cho, jung, 0);
      switch (jung) {
        case 0: // ㅏ: 간다→가요
        case 1: // ㅐ: 낸다→내요
        case 4: // ㅓ: 선다→서요
        case 5: // ㅔ: 센다→세요
        case 6: // ㅕ: 편다→펴요
          return `${open}요`;
        case 8: // ㅗ: 온다→와요
          return `${compose(cho, 9, 0)}요`;
        case 13: // ㅜ: 준다→줘요
          return `${compose(cho, 14, 0)}요`;
        case 18: // ㅡ: 쓴다→써요
          return `${compose(cho, 4, 0)}요`;
        case 20: // ㅣ: 마신다→마셔요
          return `${compose(cho, 6, 0)}요`;
        default:
          return match;
      }
    },
  );
}

export function normalizeSpeechLevelKo(text: string): {
  text: string;
  fixed: boolean;
} {
  let out = text;

  // 문어체 연결어미 완화
  out = out.replace(/있으며(?=[,\s])/g, "있고");

  // 명시 매핑 (구체적 → 일반 순서)
  for (const [re, rep] of PLAIN_TO_HAEYO) {
    out = out.replace(re, rep);
  }

  // 일반 종결어미
  out = out.replace(new RegExp(`했다${END}`, "g"), "했어요");
  out = out.replace(new RegExp(`([가-힣])었다${END}`, "g"), "$1었어요");
  out = out.replace(new RegExp(`([가-힣])았다${END}`, "g"), "$1았어요");
  out = out.replace(new RegExp(`있다${END}`, "g"), "있어요");
  out = out.replace(new RegExp(`없다${END}`, "g"), "없어요");
  out = out.replace(new RegExp(`된다${END}`, "g"), "돼요");
  out = out.replace(new RegExp(`한다${END}`, "g"), "해요");
  out = out.replace(new RegExp(`하다${END}`, "g"), "해요");

  // 동사 현재형 (는다 → 모음조화, ㄴ받침 축약형 → 축약 활용)
  out = convertNeundaEnding(out);
  out = convertNdaEnding(out);

  // 명사형 종결 "~함." → "~해요." ("표현함" 등 하다-용언 명사형)
  out = out.replace(new RegExp(`([가-힣])함${END}`, "g"), "$1해요");
  // "~하는 스타일임" 등 제한된 명사 + 임
  out = out.replace(
    new RegExp(`(스타일|타입|편|것|쪽)임${END}`, "g"),
    "$1이에요",
  );

  // 서술격 조사 "~이다" → 받침에 따라 이에요/예요
  out = out.replace(
    new RegExp(`([가-힣])이다${END}`, "g"),
    (_m, prev: string) => (hasBatchim(prev) ? `${prev}이에요` : `${prev}예요`),
  );

  return { text: out, fixed: out !== text };
}

/** 이미 정중한 종결(요/죠/니다/니까)인지 검사 — punct 제거된 body에 적용. */
const POLITE_ENDING_RE = /(요|죠|니다|니까)$/;

/** 명사형으로 끝나는 셀에 붙일 수 있는 명사 화이트리스트. */
const CELL_NOUN_ENDING_RE =
  /(편|쪽|스타일|타입|성향|사람|모습|주의)\s*$/;

/** 하다-동작명사로 끝나는 문장 → "해요" 부착 ("침묵으로 후퇴" → "후퇴해요"). */
const CELL_VERBAL_NOUN_ENDING_RE =
  /(후퇴|회피|철수|집중|몰입|정리|소통|표현|노력|배려|양보|휴식|충전)\s*$/;

/**
 * 비교 표 셀 전용 — 셀의 각 문장이 존댓말로 끝나도록 강제.
 * normalize 이후에도 명사형("~하는 편")으로 끝나면 이에요/예요를 붙인다.
 * 안전하게 변환할 수 없는 문장은 그대로 둔다.
 */
export function ensurePoliteKoCellEnding(cell: string): {
  text: string;
  fixed: boolean;
} {
  const raw = cell.trim();
  if (!raw) return { text: cell, fixed: false };

  const sentences = raw.split(/(?<=[.。!?…])\s+/);
  const out = sentences.map((sentence) => {
    const body = sentence.replace(/[.。!?…]+\s*$/, "");
    const punct = sentence.slice(body.length) || "";
    if (!body.trim()) return sentence;
    if (POLITE_ENDING_RE.test(body.trim())) return sentence;

    const verbalHit = body.match(CELL_VERBAL_NOUN_ENDING_RE);
    if (verbalHit) {
      return `${body.trim()}해요${punct || "."}`;
    }

    const nounHit = body.match(CELL_NOUN_ENDING_RE);
    if (nounHit) {
      const last = body.trim().at(-1) ?? "";
      const copula = hasBatchim(last) ? "이에요" : "예요";
      return `${body.trim()}${copula}${punct || "."}`;
    }
    return sentence;
  });

  const joined = out.join(" ").trim();
  return { text: joined, fixed: joined !== raw };
}

/** repair → normalize 순서로 한 번에 적용. */
export function polishKoTone(text: string): { text: string; fixed: boolean } {
  const repaired = repairBrokenKoFragments(text);
  const normalized = normalizeSpeechLevelKo(repaired.text);
  return {
    text: normalized.text,
    fixed: repaired.fixed || normalized.fixed,
  };
}

/** 비교 표 셀 전용 — polishKoTone + 셀 종결 존댓말 강제. */
export function polishKoTableCell(text: string): {
  text: string;
  fixed: boolean;
} {
  const base = polishKoTone(text);
  const polite = ensurePoliteKoCellEnding(base.text);
  return { text: polite.text, fixed: base.fixed || polite.fixed };
}

/**
 * 임의의 JSON 트리(개인분석·Blueprint·심화 리포트 등)를 순회하며 모든 문자열
 * 리프에 polishKoTone을 적용한다. 표 셀처럼 명사형 종결 강제가 필요하면
 * polishKoTableCell을 별도로 쓸 것 — 여기서는 제목·라벨처럼 완결 문장이 아닌
 * 문자열도 섞여 있을 수 있어 종결 강제는 하지 않는다.
 */
export function polishKoStringTree<T>(value: T): T {
  if (typeof value === "string") {
    return polishKoTone(value).text as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((v) => polishKoStringTree(v)) as unknown as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = polishKoStringTree(v);
    }
    return out as unknown as T;
  }
  return value;
}
