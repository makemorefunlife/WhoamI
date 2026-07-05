import type { SajuDataForIntegrated } from "@/lib/report/formatInnateAnalysisForIntegrated";
import { REF_HEAVENLY_STEMS } from "@/lib/hardcoded/sajuReferenceData";
import { sajuJsonToPillars } from "@/lib/saju/pairChartAnalysis";
import { getDayStemCode } from "@/lib/saju/romanticSajuDerivations";

/**
 * 일간(10천간) 연인용 이미지 프로필 — UI에 사주 용어 없이 쓰는 문장 재료.
 * Supabase DB 없이 코드 레퍼런스로 관리 (기존 ref_heavenly_stems 와 분리).
 */
export type DayStemRomanticProfile = {
  stemCode: string;
  /** 시각 이미지 — 촛불, 산 (은유의 뿌리) */
  image: string;
  /** 관계에서 느껴지는 기질 — "꾸준히 빛나고 따뜻한" */
  essence: string;
  /** 사랑 안에서의 역할 — "마음을 밝히는 온기" */
  inLove: string;
  /** 헤드라인 짧은 라벨 — "따뜻한 촛불" */
  headlineLabel: string;
};

/** 10천간 — 연인 리포트 톤 (수정·확장은 이 파일만) */
export const DAY_STEM_ROMANTIC_PROFILES: Record<string, DayStemRomanticProfile> =
  {
    gap: {
      stemCode: "gap",
      image: "큰 나무",
      essence: "묵직하게 성장하는",
      inLove: "방향을 잡아 주는 뿌리",
      headlineLabel: "푸른 큰나무",
    },
    eul: {
      stemCode: "eul",
      image: "꽃",
      essence: "부드럽게 스며드는",
      inLove: "작은 배려로 공간을 채우는",
      headlineLabel: "섬세한 꽃",
    },
    byeong: {
      stemCode: "byeong",
      image: "태양",
      essence: "밝게 비추는",
      inLove: "주변을 환하게 만드는 에너지",
      headlineLabel: "빛나는 태양",
    },
    jeong: {
      stemCode: "jeong",
      image: "촛불",
      essence: "꾸준히 빛나고 따뜻한",
      inLove: "마음을 밝히는 온기",
      headlineLabel: "따뜻한 촛불",
    },
    mu: {
      stemCode: "mu",
      image: "산",
      essence: "듬직하고 안정감 있는",
      inLove: "든든한 바람막이",
      headlineLabel: "듬직한 산",
    },
    gi: {
      stemCode: "gi",
      image: "밭",
      essence: "포근하게 감싸 주는",
      inLove: "일상을 편안하게 받쳐 주는",
      headlineLabel: "넓은 밭",
    },
    gyeong: {
      stemCode: "gyeong",
      image: "강철",
      essence: "단단하고 분명한",
      inLove: "흔들릴 때 기준을 잡아 주는",
      headlineLabel: "단단한 강철",
    },
    sin: {
      stemCode: "sin",
      image: "보석",
      essence: "섬세하고 빛나는",
      inLove: "작은 신호도 놓치지 않는",
      headlineLabel: "고운 보석",
    },
    im: {
      stemCode: "im",
      image: "깊은 강",
      essence: "깊고 넓게 흐르는",
      inLove: "마음의 깊이를 담아 주는",
      headlineLabel: "깊은 강",
    },
    gye: {
      stemCode: "gye",
      image: "시냇물",
      essence: "조용히 스며드는",
      inLove: "말 없이도 공감해 주는",
      headlineLabel: "잔잔한 시냇물",
    },
  };

const ELEMENT_GENERATES: Record<string, string> = {
  wood: "fire",
  fire: "earth",
  earth: "metal",
  metal: "water",
  water: "wood",
};

/** 오행 상생 방향 — nurturer가 nurtured를 키움 */
const ELEMENT_PAIR_CLOSER: Record<string, string> = {
  "wood→fire": "한쪽이 키우고, 다른 쪽이 타오르게 해요.",
  "fire→earth":
    "서로를 밝히고, 단단한 바람막이가 되어 줘요.",
  "earth→metal": "무게감 있는 지지 위에 가치가 오래 빛나요.",
  "metal→water": "차가운 결을 부드러운 흐름이 풀어 줘요.",
  "water→wood": "마음을 적시고, 다시 자라나게 해요.",
};

const DEFAULT_SANGSAENG_CLOSER =
  "핵심 기질이 서로를 자연스럽게 키워 주는 관계예요.";
const DEFAULT_SANGGEUK_CLOSER =
  "서로 자극해 부딪히지만, 성장의 계기가 되기도 해요.";
const DEFAULT_SAME_ELEMENT_CLOSER =
  "비슷한 성향이라 공감은 쉽지만, 고집이 맞부딪힐 때도 있어요.";

function stemElement(stemCode: string): string | null {
  return REF_HEAVENLY_STEMS.find((r) => r.code === stemCode)?.element ?? null;
}

/** 일간 프로필이 없을 때 — 정화 등 커스텀 essence 미정의 시 */
export const ROMANTIC_ESSENCE_FALLBACK = "마음을 전하는";

/**
 * 연인 UI용 essence — DAY_STEM_ROMANTIC_PROFILES 우선, 없으면 천간 메타포, 최종 fallback.
 * (정화 → "꾸준히 빛나고 따뜻한" 은 jeong 프로필에 정의됨)
 */
export function resolveRomanticEssenceForSaju(
  sajuJson: SajuDataForIntegrated,
): string {
  const profile = resolveDayStemRomanticProfileFromSaju(sajuJson);
  if (profile?.essence) return profile.essence;

  try {
    const pillars = sajuJsonToPillars(
      sajuJson.saju as Required<NonNullable<typeof sajuJson.saju>>,
    );
    const stemCode = getDayStemCode(pillars);
    const ref = REF_HEAVENLY_STEMS.find((r) => r.code === stemCode);
    if (ref?.metaphor_ko?.trim()) {
      return `${ref.metaphor_ko} 같은 온기를 품은`;
    }
  } catch {
    /* fall through */
  }

  const metaphor = sajuJson.dayStemData?.metaphor_ko?.trim();
  if (metaphor) return `${metaphor} 같은 온기를 품은`;

  return ROMANTIC_ESSENCE_FALLBACK;
}

export function getDayStemRomanticProfile(
  stemCode: string,
): DayStemRomanticProfile | null {
  return DAY_STEM_ROMANTIC_PROFILES[stemCode] ?? null;
}

export function resolveDayStemRomanticProfileFromSaju(
  sajuJson: SajuDataForIntegrated,
): DayStemRomanticProfile | null {
  const dayPillar = sajuJson.saju?.dayPillar;
  if (!dayPillar) return null;
  try {
    const pillars = sajuJsonToPillars(
      sajuJson.saju as Required<NonNullable<typeof sajuJson.saju>>,
    );
    const stemCode = getDayStemCode(pillars);
    return getDayStemRomanticProfile(stemCode);
  } catch {
    return null;
  }
}

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

/** "꾸준히 빛나고 따뜻한 콩콩" */
export function formatRomanticEssenceNickname(
  profile: DayStemRomanticProfile,
  nickname: string,
): string {
  const n = nickname.trim();
  if (!n) return profile.essence;
  return `${profile.essence} ${n}`;
}

/** 두 사람 essence 구 — 조사 포함 */
export function formatRomanticEssencePair(
  profileA: DayStemRomanticProfile,
  nicknameA: string,
  profileB: DayStemRomanticProfile,
  nicknameB: string,
): string {
  const a = formatRomanticEssenceNickname(profileA, nicknameA);
  const b = formatRomanticEssenceNickname(profileB, nicknameB);
  return `${a}${waGwaAfter(a)} ${b}`;
}

function resolveElementPairCloser(
  stemCodeA: string,
  stemCodeB: string,
  interaction: string,
): string {
  const elA = stemElement(stemCodeA);
  const elB = stemElement(stemCodeB);
  if (!elA || !elB) return DEFAULT_SANGSAENG_CLOSER;

  if (interaction.includes("상생")) {
    if (ELEMENT_GENERATES[elA] === elB) {
      return ELEMENT_PAIR_CLOSER[`${elA}→${elB}`] ?? DEFAULT_SANGSAENG_CLOSER;
    }
    if (ELEMENT_GENERATES[elB] === elA) {
      return ELEMENT_PAIR_CLOSER[`${elB}→${elA}`] ?? DEFAULT_SANGSAENG_CLOSER;
    }
    return DEFAULT_SANGSAENG_CLOSER;
  }
  if (interaction.includes("상극")) {
    return DEFAULT_SANGGEUK_CLOSER;
  }
  if (interaction.includes("같은") && interaction.includes("기운")) {
    return DEFAULT_SAME_ELEMENT_CLOSER;
  }
  return DEFAULT_SANGSAENG_CLOSER;
}

/** 일간 조합 한줄 — 정화×무토 상생 등 */
export function buildRomanticDayStemOneLiner(params: {
  profileA: DayStemRomanticProfile;
  profileB: DayStemRomanticProfile;
  nicknameA: string;
  nicknameB: string;
  dayStemInteraction: string;
  closeRelationship?: boolean;
}): string {
  const opener = params.closeRelationship
    ? "가까운 관계에서"
    : "함께 있을 때";
  const pair = formatRomanticEssencePair(
    params.profileA,
    params.nicknameA,
    params.profileB,
    params.nicknameB,
  );
  const closer = resolveElementPairCloser(
    params.profileA.stemCode,
    params.profileB.stemCode,
    params.dayStemInteraction,
  );

  if (params.dayStemInteraction.includes("상생")) {
    return `${opener} ${pair}가 ${closer}`;
  }
  if (params.dayStemInteraction.includes("상극")) {
    return `${opener} ${pair}는 ${closer}`;
  }
  if (
    params.dayStemInteraction.includes("같은") &&
    params.dayStemInteraction.includes("기운")
  ) {
    return `${opener} ${pair}는 ${closer}`;
  }
  return `${opener} ${pair}는 서로 다른 강점으로 관계를 채워 가요.`;
}

export function romanticHeadlineFromProfiles(
  profileA: DayStemRomanticProfile,
  profileB: DayStemRomanticProfile,
): string {
  const a = profileA.headlineLabel;
  const b = profileB.headlineLabel;
  return `${a}${waGwaAfter(a)} ${b}`;
}
