import type { SajuDataForIntegrated } from "@/lib/report/formatInnateAnalysisForIntegrated";
import { REF_HEAVENLY_STEMS } from "@/lib/hardcoded/sajuReferenceData";
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

export type RomanticCrossBodyContext = {
  nicknameA: string;
  nicknameB: string;
  metaphorA: string;
  metaphorB: string;
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
  const opener = close ? "가까운 관계에서" : "함께 있을 때";
  const pairA = `${ctx.metaphorA} 같은 ${ctx.nicknameA}`;
  const pairB = `${ctx.metaphorB} 같은 ${ctx.nicknameB}`;
  const stems =
    ctx.stemNameA && ctx.stemNameB
      ? `${ctx.stemNameA}와 ${ctx.stemNameB}`
      : null;

  if (POSITIVE_CROSS.has(hit.type)) {
    if (ctx.dayStemInteraction?.includes("상생")) {
      const nurture =
        stems != null
          ? `${stems}는 서로를 자연스럽게 받쳐 주는`
          : "핵심 기질이 서로를 자연스럽게 키워 주는";
      return `${opener} ${nurture} 관계예요. ${pairA}와 ${pairB}가 편안하게 끌리는 조합이에요.`;
    }
    return `${opener} ${pairA}와 ${pairB}는 처음부터 편안하게 끌리는 조합이에요.`;
  }

  if (TENSION_CROSS.has(hit.type)) {
    return `${opener} ${pairA}와 ${pairB}는 리듬이 어긋날 때 예민해질 수 있어요.`;
  }

  const legacy = humanizeCrossMeaning(hit.interpretation);
  if (legacy) {
    return `${opener} ${legacy.endsWith("요") ? legacy : `${legacy}요`}`;
  }
  return `${opener} ${pairA}와 ${pairB}는 서로 다른 강점으로 관계를 채워 가요.`;
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

/** 일주(日干) 팔자 기준 이미지 라벨 — dayStemData 오염·한자 메타포 무시 */
export function resolvePersonalityLabel(
  sajuJson: SajuDataForIntegrated,
): string {
  const dayPillar = sajuJson.saju?.dayPillar;
  if (dayPillar) {
    try {
      const pillars = sajuJsonToPillars(
        sajuJson.saju as Required<NonNullable<typeof sajuJson.saju>>,
      );
      const stemCode = getDayStemCode(pillars);
      const ref = REF_HEAVENLY_STEMS.find((r) => r.code === stemCode);
      if (ref?.metaphor_ko) {
        const trait = ref.strength_ko?.split(/[,，·]/)[0]?.trim();
        return trait
          ? `${ref.metaphor_ko} 같은 ${trait}`
          : ref.metaphor_ko;
      }
    } catch {
      /* fall through */
    }
  }

  const raw =
    sajuJson.dayStemData?.metaphor_ko?.trim() ||
    sajuJson.dayStemData?.strength_ko?.split(/[,，·]/)[0]?.trim() ||
    "";
  const cleaned = stripSajuJargon(raw);
  return cleaned || "한 사람";
}

export function humanizeDayStemInteraction(
  raw: string,
  stemNames?: { a: string; b: string },
): string {
  const pair =
    stemNames?.a && stemNames?.b ? `${stemNames.a}와 ${stemNames.b}는 ` : "";

  if (raw.includes("살림(상생)") || raw.includes("상생")) {
    if (raw.includes("화") && raw.includes("토")) {
      return `${pair}불꽃이 땅을 따뜻하게 키워 주는 관계예요. 한쪽의 온기가 다른 쪽을 든든하게 받쳐 줘요.`;
    }
    return `${pair}핵심 기질이 서로를 자연스럽게 키워 주는 관계예요.`;
  }
  if (raw.includes("누름(상극") || raw.includes("상극")) {
    return `${pair}핵심 기질이 서로 자극해 부딪히지만, 성장의 계기가 되기도 해요.`;
  }
  if (raw.includes("같은") && raw.includes("기운")) {
    return `${pair}비슷한 성향이라 공감은 쉽지만, 고집이 맞부딪힐 때도 있어요.`;
  }
  return `${pair}핵심 기질은 직접 맞서기보다, 다른 방식으로 서로를 보완해요.`;
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

  /** UI·저장 훅 공통 — 노출 직전 한 번 더 정리 */
export function polishRomanticDisplayText(text: string | undefined | null): string {
  if (!text?.trim()) return "";
  const cleaned = stripSajuJargon(text)
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
