import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";

export type TenGodCategory =
  | "재성"
  | "관성"
  | "식상"
  | "인성"
  | "비겁";

const CATEGORY_GODS: Record<TenGodCategory, string[]> = {
  재성: ["정재", "편재"],
  관성: ["정관", "편관"],
  식상: ["식신", "상관"],
  인성: ["정인", "편인"],
  비겁: ["비견", "겁재"],
};

const CATEGORY_WORK: Record<
  TenGodCategory,
  { label: string; roles: string[]; delegatePhrase: string }
> = {
  재성: {
    label: "실속·자원",
    roles: ["예산·수익 관리", "영업·사업 개발", "실무·운영 돈 흐름"],
    delegatePhrase: "돈·자원·실무 성과가 필요한 업무",
  },
  관성: {
    label: "관리·추진",
    roles: ["프로젝트 관리", "일정·품질 통제", "대외 조율·책임"],
    delegatePhrase: "책임·추진·관리가 필요한 업무",
  },
  식상: {
    label: "기획·표현",
    roles: ["기획·아이디어", "콘텐츠·제작", "개선 제안·발표"],
    delegatePhrase: "기획·표현·산출물이 필요한 업무",
  },
  인성: {
    label: "학습·지원",
    roles: ["리서치·분석", "문서·교육", "백오피스·지원"],
    delegatePhrase: "학습·정리·지원이 필요한 업무",
  },
  비겁: {
    label: "현장·협업",
    roles: ["현장 조율", "팀 빌딩", "동료 협업·실행"],
    delegatePhrase: "현장·협업·실행이 필요한 업무",
  },
};

export const CATEGORY_OFFICE_LABEL: Record<TenGodCategory, string> = {
  재성: "실속·자원",
  관성: "관리·추진",
  식상: "기획·표현",
  인성: "학습·지원",
  비겁: "현장·협업",
};

export type TenGodComplementItem = {
  category: TenGodCategory;
  categoryLabel: string;
  /** 부족한 사람 */
  receiverNickname: string;
  /** 채워 주는 사람 */
  giverNickname: string;
  receiverStrength: number;
  giverStrength: number;
  roles: string[];
  delegateText: string;
  explanation: string;
};

export type TenGodComplementResult = {
  items: TenGodComplementItem[];
  personA: {
    lacking: TenGodCategory[];
    strong: TenGodCategory[];
  };
  personB: {
    lacking: TenGodCategory[];
    strong: TenGodCategory[];
  };
};

function countTenGods(sajuJson: SajuDataForIntegrated): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const t of sajuJson.tenGods ?? []) {
    const name = t.godData?.kor_name ?? t.godCode ?? "";
    if (!name) continue;
    counts[name] = (counts[name] ?? 0) + 1;
  }
  return counts;
}

function categoryStrength(
  counts: Record<string, number>,
  category: TenGodCategory,
): number {
  return CATEGORY_GODS[category].reduce((s, g) => s + (counts[g] ?? 0), 0);
}

function lackingCategories(counts: Record<string, number>): TenGodCategory[] {
  return (Object.keys(CATEGORY_GODS) as TenGodCategory[]).filter(
    (cat) => categoryStrength(counts, cat) === 0,
  );
}

function strongCategories(counts: Record<string, number>): TenGodCategory[] {
  return (Object.keys(CATEGORY_GODS) as TenGodCategory[]).filter(
    (cat) => categoryStrength(counts, cat) >= 2,
  );
}

/**
 * 십신 상호 보완 — A에게 부족한 기운을 B가 채워 주는지 분석
 */
export function analyzeTenGodComplement(params: {
  nicknameA: string;
  nicknameB: string;
  sajuJsonA: SajuDataForIntegrated;
  sajuJsonB: SajuDataForIntegrated;
  countsA?: Record<string, number>;
  countsB?: Record<string, number>;
}): TenGodComplementResult {
  const countsA = params.countsA ?? countTenGods(params.sajuJsonA);
  const countsB = params.countsB ?? countTenGods(params.sajuJsonB);

  const lackingA = lackingCategories(countsA);
  const lackingB = lackingCategories(countsB);
  const strongA = strongCategories(countsA);
  const strongB = strongCategories(countsB);

  const items: TenGodComplementItem[] = [];

  for (const cat of lackingA) {
    const bStrength = categoryStrength(countsB, cat);
    if (bStrength >= 1) {
      const meta = CATEGORY_WORK[cat];
      items.push({
        category: cat,
        categoryLabel: meta.label,
        receiverNickname: params.nicknameA,
        giverNickname: params.nicknameB,
        receiverStrength: 0,
        giverStrength: bStrength,
        roles: meta.roles,
        delegateText: meta.delegatePhrase,
        explanation: `${params.nicknameA}의 빈 구간을 ${params.nicknameB}이(가) ${meta.label} 역량으로 메워 줍니다.`,
      });
    }
  }

  for (const cat of lackingB) {
    const aStrength = categoryStrength(countsA, cat);
    if (aStrength >= 1) {
      const meta = CATEGORY_WORK[cat];
      items.push({
        category: cat,
        categoryLabel: meta.label,
        receiverNickname: params.nicknameB,
        giverNickname: params.nicknameA,
        receiverStrength: 0,
        giverStrength: aStrength,
        roles: meta.roles,
        delegateText: meta.delegatePhrase,
        explanation: `${params.nicknameB}의 빈 구간을 ${params.nicknameA}이(가) ${meta.label} 역량으로 메워 줍니다.`,
      });
    }
  }

  items.sort((a, b) => b.giverStrength - a.giverStrength);

  return {
    items,
    personA: { lacking: lackingA, strong: strongA },
    personB: { lacking: lackingB, strong: strongB },
  };
}

export { countTenGods as countTenGodsForWork };
