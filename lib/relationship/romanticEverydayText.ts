import type { SajuDataForIntegrated } from "@/lib/report/formatInnateAnalysisForIntegrated";
import { REF_HEAVENLY_STEMS } from "@/lib/hardcoded/sajuReferenceData";
import {
  buildRomanticDayStemOneLiner,
  resolveDayStemRomanticProfileFromSaju,
} from "@/lib/relationship/dayStemRomanticProfile";
import type { CrossChartHit } from "@/lib/saju/pairChartAnalysis";
import { sajuJsonToPillars } from "@/lib/saju/pairChartAnalysis";
import { getDayStemCode } from "@/lib/saju/romanticSajuDerivations";

const HANJA_RE = /[\u4e00-\u9fff]/g;
const SAJU_TERM_RE =
  /일간|일지|월지|연주|지지|천간|십성|오행|상생|상극|육합|삼합|방합|원진|형벌|순환형|신강|신약|용신|기신|목\(木\)|화\(火\)|토\(土\)|금\(金\)|수\(水\)/g;

/** 지지(띠)·육합 원문에 섞인 메타포 — 연인 UI에는 일간(정화·무토 등)만 쓴다 */
const BRANCH_METAPHOR_LEAK_RE =
  /작은 불|날카로운 금|큰 나무|큰 강|초원|꽃나무|등불|칼|바다|샘물|성곽|보석|뱀|원숭이|닭|소|말|양|쥐|호랑이|토끼|용|돼지|개|지혜.*재주|재주.*지혜|불이 금을|금이 불을/;

const POSITIVE_CROSS = new Set(["육합", "천간합", "삼합", "방합"]);
const TENSION_CROSS = new Set(["충", "형", "해", "파"]);

const STEM_ELEMENT_SUFFIX: Record<string, string> = {
  wood: "목",
  fire: "화",
  earth: "토",
  metal: "금",
  water: "수",
};

function hasBatchimKorean(word: string): boolean {
  const ch = word.at(-1);
  if (!ch) return false;
  const code = ch.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

function waGwaAfter(phrase: string): "과" | "와" {
  const lastToken = phrase.trim().split(/\s+/).at(-1) ?? phrase.trim();
  return hasBatchimKorean(lastToken) ? "과" : "와";
}

/** "촛불" + "콩콩" → "촛불 같은 콩콩" (이미 "같은"이 있으면 trait 중복 제거) */
export function formatMetaphorNickname(
  metaphor: string,
  nickname: string,
): string {
  const m = metaphor.trim();
  const n = nickname.trim();
  if (!n) return m;
  if (!m) return n;
  if (m.includes("같은")) {
    const short = m.split("같은")[0]?.trim() || m;
    return `${short} 같은 ${n}`;
  }
  return `${m} 같은 ${n}`;
}

/** 두 사람 메타포 구 — "촛불 같은 콩콩과 산, 바위 같은 동글뱅이" */
export function formatMetaphorPairLine(
  metaphorA: string,
  nicknameA: string,
  metaphorB: string,
  nicknameB: string,
): string {
  const a = formatMetaphorNickname(metaphorA, nicknameA);
  const b = formatMetaphorNickname(metaphorB, nicknameB);
  return `${a}${waGwaAfter(a)} ${b}`;
}

export type RomanticCrossBodyContext = {
  nicknameA: string;
  nicknameB: string;
  metaphorA: string;
  metaphorB: string;
  romanticProfileA?: DayStemRomanticProfile | null;
  romanticProfileB?: DayStemRomanticProfile | null;
  stemNameA?: string;
  stemNameB?: string;
  dayStemInteraction?: string;
};

/** 일간 표기 — 정화(丁), 무토(戊) */
export function formatDayStemDisplayName(stemCode: string): string {
  const ref = REF_HEAVENLY_STEMS.find((r) => r.code === stemCode);
  if (!ref) return "";
  const suffix = STEM_ELEMENT_SUFFIX[ref.element as string] ?? "";
  return `${ref.kor_name}${suffix}`;
}

export function resolveDayStemNamesFromPair(
  sajuJsonA: SajuDataForIntegrated,
  sajuJsonB: SajuDataForIntegrated,
): { stemNameA: string; stemNameB: string } {
  const pillarsA = sajuJsonToPillars(
    sajuJsonA.saju as Required<NonNullable<typeof sajuJsonA.saju>>,
  );
  const pillarsB = sajuJsonToPillars(
    sajuJsonB.saju as Required<NonNullable<typeof sajuJsonB.saju>>,
  );
  return {
    stemNameA: formatDayStemDisplayName(getDayStemCode(pillarsA)),
    stemNameB: formatDayStemDisplayName(getDayStemCode(pillarsB)),
  };
}

function hasBranchMetaphorLeak(text: string): boolean {
  return BRANCH_METAPHOR_LEAK_RE.test(text);
}

/** 본문·훅에 노출할 문장 — 한자·사주 용어 제거 */
export function stripSajuJargon(text: string): string {
  return text
    .replace(HANJA_RE, "")
    .replace(SAJU_TERM_RE, "")
    .replace(/\([^)]*[\u4e00-\u9fff][^)]*\)/g, "")
    .replace(/[·\-–—]{2,}/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\.{2,}/g, ".")
    .trim();
}

function pickReadableSentences(raw: string): string[] {
  return raw
    .split(/[.。!！?？]/)
    .map((s) => stripSajuJargon(s))
    .filter((s) => s.length >= 8)
    .filter(
      (s) =>
        !/의 파$|의 합$|의 충돌$|순환형$|형벌$|파입니다|합입니다|충돌입니다/.test(s),
    );
}

/** ref_relation_rules meaning_ko → 일상어 (지지·띠 메타포는 제외) */
export function humanizeCrossMeaning(raw: string): string {
  if (hasBranchMetaphorLeak(raw)) {
    return "";
  }
  const sentences = pickReadableSentences(raw).filter(
    (s) => !hasBranchMetaphorLeak(s),
  );
  if (sentences.length > 0) {
    return sentences.slice(0, 2).join(" ");
  }
  const fallback = stripSajuJargon(raw);
  if (hasBranchMetaphorLeak(fallback) || fallback.length < 10) {
    return "";
  }
  return fallback;
}

/**
 * 연인 UI용 cross 해석 — 지지 육합 원문 대신 일간 이미지(정화·무토·촛불·산 등)로 서술.
 */
export function humanizeRomanticCrossBody(
  hit: CrossChartHit,
  ctx: RomanticCrossBodyContext,
  opts?: { closeRelationship?: boolean },
): string {
  const close =
    opts?.closeRelationship ??
    (hit.personA_pillar.startsWith("일주") ||
      hit.personB_pillar.startsWith("일주"));

  if (
    ctx.romanticProfileA &&
    ctx.romanticProfileB &&
    ctx.dayStemInteraction
  ) {
    return buildRomanticDayStemOneLiner({
      profileA: ctx.romanticProfileA,
      profileB: ctx.romanticProfileB,
      nicknameA: ctx.nicknameA,
      nicknameB: ctx.nicknameB,
      dayStemInteraction: ctx.dayStemInteraction,
      closeRelationship: close,
    });
  }

  const opener = close ? "가까운 관계에서" : "함께 있을 때";
  const pairLine = formatMetaphorPairLine(
    ctx.metaphorA,
    ctx.nicknameA,
    ctx.metaphorB,
    ctx.nicknameB,
  );

  if (POSITIVE_CROSS.has(hit.type)) {
    const bindNote =
      hit.palaceWeight >= 0.75
        ? " 가까워질수록 편안하지만, 서로에게 묶이거나 결정이 늦어질 때도 있어요."
        : "";
    if (ctx.dayStemInteraction?.includes("상생")) {
      return `${opener} 서로를 자연스럽게 받쳐 주는 관계예요. ${pairLine}가 편안하게 끌리는 조합이에요.${bindNote}`;
    }
    return `${opener} ${pairLine}는 처음부터 편안하게 끌리는 조합이에요.${bindNote}`;
  }

  if (TENSION_CROSS.has(hit.type)) {
    const mobilize =
      hit.type === "충"
        ? " 다만 막힌 상황을 움직이는 계기가 되기도 해요."
        : "";
    return `${opener} ${pairLine}는 리듬이 어긋날 때 예민해질 수 있어요.${mobilize}`;
  }

  const legacy = humanizeCrossMeaning(hit.interpretation);
  if (legacy) {
    return `${opener} ${legacy.endsWith("요") ? legacy : `${legacy}요`}`;
  }
  return `${opener} ${pairLine}는 서로 다른 강점으로 관계를 채워 가요.`;
}

export function humanizeCrossHitLine(
  hit: CrossChartHit,
  opts?: { closeRelationship?: boolean; ctx?: RomanticCrossBodyContext },
): string {
  if (opts?.ctx) {
    return humanizeRomanticCrossBody(hit, opts.ctx, {
      closeRelationship: opts.closeRelationship,
    });
  }
  const close =
    opts?.closeRelationship ??
    (hit.personA_pillar.startsWith("일주") ||
      hit.personB_pillar.startsWith("일주"));
  const opener = close ? "가까운 관계에서" : "함께 있을 때";
  const core = humanizeCrossMeaning(hit.interpretation);
  if (!core) {
    return `${opener} 서로 다른 리듬이 맞물리는 패턴이에요.`;
  }
  return `${opener} ${core.endsWith("요") ? core : `${core}요`}`;
}

export function crossHitDedupeKey(hit: CrossChartHit): string {
  return `${hit.type}:${hit.personA_pillar}:${hit.personB_pillar}`;
}

/** 일주(日干) 팔자 기준 헤드라인 라벨 — 연인 프로필 우선 */
export function resolvePersonalityLabel(
  sajuJson: SajuDataForIntegrated,
): string {
  const profile = resolveDayStemRomanticProfileFromSaju(sajuJson);
  if (profile?.headlineLabel) return profile.headlineLabel;

  const dayPillar = sajuJson.saju?.dayPillar;
  if (dayPillar) {
    try {
      const pillars = sajuJsonToPillars(
        sajuJson.saju as Required<NonNullable<typeof sajuJson.saju>>,
      );
      const stemCode = getDayStemCode(pillars);
      const ref = REF_HEAVENLY_STEMS.find((r) => r.code === stemCode);
      if (ref?.metaphor_ko?.trim()) {
        return ref.metaphor_ko.trim();
      }
    } catch {
      /* fall through */
    }
  }

  const raw = sajuJson.dayStemData?.metaphor_ko?.trim() ?? "";
  const cleaned = stripSajuJargon(raw);
  return cleaned || "한 사람";
}

export function humanizeDayStemInteraction(
  raw: string,
  _stemNames?: { a: string; b: string },
): string {
  if (raw.includes("살림(상생)") || raw.includes("상생")) {
    if (raw.includes("화") && raw.includes("토")) {
      return "불꽃이 땅을 따뜻하게 키우는 관계예요. 한쪽의 온기가 다른 쪽을 든든하게 받쳐 줘요.";
    }
    return "핵심 기질이 서로를 자연스럽게 키워 주는 관계예요.";
  }
  if (raw.includes("누름(상극") || raw.includes("상극")) {
    return "핵심 기질이 서로 자극해 부딪히지만, 성장의 계기가 되기도 해요.";
  }
  if (raw.includes("같은") && raw.includes("기운")) {
    return "비슷한 성향이라 공감은 쉽지만, 고집이 맞부딪힐 때도 있어요.";
  }
  return "핵심 기질은 직접 맞서기보다, 다른 방식으로 서로를 보완해요.";
}

export function humanizeStrengthComplement(
  strongNick: string,
  softNick: string,
): string {
  return `${strongNick}은 든든하게 버티는 편이고, ${softNick}은 마음의 온기와 공감이 필요한 타입이라 서로의 빈칸을 채워요.`;
}

export function humanizePersonRelation(raw: string): string {
  return humanizeCrossMeaning(raw);
}

export function humanizeElementNote(raw: string): string {
  const tail = raw.split("|").pop()?.trim() ?? raw;
  const cleaned = stripSajuJargon(tail);
  if (cleaned.includes("약한")) {
    return "둘이 함께할 때 채워 주면 좋은 에너지가 있어요.";
  }
  return cleaned || "함께할 때 서로 다른 강점이 드러나요.";
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** comparison_table 셀 — 열 헤더에 이름이 있으므로 맨 앞 주어(이름+조사) 제거 */
export function stripComparisonCellSubject(
  text: string,
  nickname: string,
): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  const name = nickname.trim();
  if (!name) return polishRomanticDisplayText(trimmed);

  const escaped = escapeRegExp(name);
  const withoutSubject = trimmed
    .replace(new RegExp(`^${escaped}(은|는|이|가)\\s+`), "")
    .replace(new RegExp(`^${escaped}\\s+`), "")
    .trim();

  return polishRomanticDisplayText(withoutSubject || trimmed);
}

  /** UI·저장 훅 공통 — 노출 직전 한 번 더 정리 */
export function polishRomanticDisplayText(text: string | undefined | null): string {
  if (!text?.trim()) return "";
  const cleaned = stripSajuJargon(text)
    .replace(/([가-힣,\s]+)\s+같은\s+[^,.·]+?\s+같은\s+/g, "$1 같은 ")
    .replace(
      /가까운 관계에서\s+[가-힣]{1,4}(?:와|과)\s+[가-힣]{1,4}(?:는|은)\s+/g,
      "가까운 관계에서 ",
    )
    .replace(/흐름이에요\.?$/g, "")
    .replace(/\s+요\.?$/g, "요.")
    .trim();
  if (hasBranchMetaphorLeak(cleaned)) {
    return cleaned
      .replace(BRANCH_METAPHOR_LEAK_RE, "")
      .replace(/\s+/g, " ")
      .trim();
  }
  return cleaned;
}

export function joinPersonalityHeadline(labelA: string, labelB: string): string {
  const endsWithVowel = (s: string) => /[aeiouAEIOUㅏ-ㅣ]$/.test(s);
  const particle = endsWithVowel(labelB) ? "와" : "과";
  return `${labelA}${particle} ${labelB}`;
}
