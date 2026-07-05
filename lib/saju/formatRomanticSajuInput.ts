import type { SajuDataForIntegrated } from "@/lib/report/formatInnateAnalysisForIntegrated";
import {
  analyzePairSaju,
  sajuJsonToPillars,
  type PairSajuAnalysis,
} from "@/lib/saju/pairChartAnalysis";
import {
  estimateStrengthBalance,
  estimateYongsinGisin,
  formatElementDistribution,
  getDayBranchCode,
  getDayStemCode,
  getMonthBranchCode,
} from "@/lib/saju/romanticSajuDerivations";
import { REF_EARTHLY_BRANCHES, REF_HEAVENLY_STEMS } from "@/lib/hardcoded/sajuReferenceData";

export type PersonRomanticSajuInput = {
  nickname: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  sajuJson: SajuDataForIntegrated;
};

type BranchRef = {
  kor_name?: string;
  meaning_ko?: string | null;
  strength_ko?: string | null;
  weakness_ko?: string | null;
};

type StemRef = {
  kor_name?: string;
  metaphor_ko?: string | null;
  strength_ko?: string | null;
  weakness_ko?: string | null;
};

type ExtendedSajuJson = SajuDataForIntegrated & {
  monthBranchData?: BranchRef | null;
  yearBranchData?: BranchRef | null;
  hourBranchData?: BranchRef | null;
  monthStemData?: StemRef | null;
};

const stemKorByCode = new Map(REF_HEAVENLY_STEMS.map((r) => [r.code, r.kor_name]));
const branchKorByCode = new Map(
  REF_EARTHLY_BRANCHES.map((r) => [r.code, r.kor_name]),
);

function formatRelations(
  relations: SajuDataForIntegrated["relations"],
): string {
  if (!relations?.length) return "(원국 내 뚜렷한 합·충·형·해 없음)";
  return relations
    .map((r) => `- [${r.type ?? ""}] ${r.name ?? ""}: ${r.interpretation ?? ""}`)
    .join("\n");
}

function formatTenGodsSummary(
  tenGods: SajuDataForIntegrated["tenGods"],
): string {
  if (!tenGods?.length) return "(없음)";
  const counts = new Map<string, number>();
  for (const t of tenGods) {
    const name = t.godData?.kor_name ?? t.godCode ?? "";
    if (!name) continue;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, n]) => `${name}(${n})`)
    .join(", ");
}

function formatHiddenStems(
  hidden: SajuDataForIntegrated["hiddenStemsData"],
  dayBranchCode: string,
): string {
  if (!hidden?.length) return "(없음)";
  const branchLabel = branchKorByCode.get(dayBranchCode) ?? dayBranchCode;
  return hidden
    .map((h) => {
      const stemLabel = stemKorByCode.get(h.stem_code ?? "") ?? h.stem_code;
      return `- ${branchLabel} 속 ${stemLabel}: ${h.meaning_ko ?? ""}`;
    })
    .join("\n");
}

function formatShinsals(shinsals: SajuDataForIntegrated["shinsals"]): string {
  if (!shinsals?.length) return "(해당 신살 없음)";
  return shinsals
    .map((s) => {
      const parts = [
        s.name_ko,
        s.meaning_ko ? `의미: ${s.meaning_ko}` : null,
        s.strength_ko ? `강점: ${s.strength_ko}` : null,
        s.weakness_ko ? `주의: ${s.weakness_ko}` : null,
      ].filter(Boolean);
      return `- ${parts.join(" | ")}`;
    })
    .join("\n");
}

function branchLine(
  label: string,
  code: string,
  data: BranchRef | null | undefined,
  role: string,
): string {
  const kor = branchKorByCode.get(code) ?? code;
  const meaning = data?.meaning_ko ?? "";
  const strength = data?.strength_ko ?? "";
  return `- ${label}: ${kor}(${code}) — ${role}${meaning ? ` | ${meaning}` : ""}${strength ? ` | 강점: ${strength}` : ""}`;
}

/** 연인 심화 User Prompt용 — 구조화된 개인 사주 블록 (실제 계산 데이터) */
export function formatPersonSajuBlock(p: PersonRomanticSajuInput): string {
  const data = p.sajuJson as ExtendedSajuJson;
  const pillars = data.saju;
  if (!pillars?.dayPillar) {
    return `## ${p.nickname}님\n(사주 데이터 없음)`;
  }

  const sajuPillars = sajuJsonToPillars(
    pillars as Required<typeof pillars>,
  );
  const dayStemCode = getDayStemCode(sajuPillars);
  const dayBranchCode = getDayBranchCode(sajuPillars);
  const monthBranchCode = getMonthBranchCode(sajuPillars);

  const strength = estimateStrengthBalance(sajuPillars);
  const yongGisin = estimateYongsinGisin(sajuPillars);
  const elementDist = formatElementDistribution(sajuPillars);

  const dayStem = data.dayStemData;
  const dayBranch = data.dayBranchData;
  const monthBranch = data.monthBranchData;

  const twelveStage = data.twelveStageData?.kor_name
    ? `${data.twelveStageData.kor_name} — ${data.twelveStageData.meaning_ko ?? ""}`
    : "(없음)";

  return `
## ${p.nickname}님의 사주 데이터
- 생년월일시: ${p.birthDate} ${p.birthTime}
- 출생지: ${p.birthPlace}
- 원국(팔자): 년 ${pillars.yearPillar} · 월 ${pillars.monthPillar} · 일 ${pillars.dayPillar} · 시 ${pillars.hourPillar}

### 핵심 기둥 (내부 참고 — 출력 시 일상어·이미지로만 변환)
- 일간(日干): ${dayStem?.kor_name ?? stemKorByCode.get(dayStemCode) ?? dayStemCode} — ${dayStem?.metaphor_ko ?? "핵심 자아"} | 강점: ${dayStem?.strength_ko ?? ""} | 주의: ${dayStem?.weakness_ko ?? ""}
${branchLine("일지(日支)", dayBranchCode, dayBranch, "배우자궁·현실적 에너지 방식")}
${branchLine("월지(月支)", monthBranchCode, monthBranch, "잠재의식·본능·정서적 안정")}

### 오행·십성·기운
- 오행 분포: ${elementDist}
- 주요 십성: ${formatTenGodsSummary(data.tenGods)}
- 12운성(일주): ${twelveStage}
- ${strength.label} — ${strength.note}
- 용신 방향(추정): ${yongGisin.yongsin}
- 기신 방향(추정): ${yongGisin.gisin} (${yongGisin.note})

### 지지 관계 (원국 내)
${formatRelations(data.relations)}

### 지장간(支藏干) — 숨겨진 천간
${formatHiddenStems(data.hiddenStemsData, dayBranchCode)}

### 신살(특수 기질 신호)
${formatShinsals(data.shinsals)}

### 대운
- 전용 대운 계산 데이터 없음 — 12운성·연주·월지·십성 흐름으로 2026·2029·2031·2036 전망을 **추론**할 것 (확정 예언 금지)

⚠️ 위 데이터는 **이 사람(${p.nickname})만의 실제 계산값**입니다. 아래 품질 예시 문장을 복사하지 말고, 반드시 이 데이터를 조합해 새로 작성하세요.
`.trim();
}

function formatCrossHits(
  hits: PairSajuAnalysis["allCrossHits"],
  title: string,
): string {
  if (!hits.length) {
    return `${title}: (두 차트 간 뚜렷한 지지 충돌·합 없음 — 일간·오행·십성 조합으로 해석)`;
  }
  return [
    title,
    ...hits.map(
      (h) =>
        `- A ${h.personA_pillar} ↔ B ${h.personB_pillar} [${h.type}]: ${h.interpretation}`,
    ),
  ].join("\n");
}

/** 두 사람 궁합 사주 (Layer 2~4 입력) — pairAnalysis 재사용 시 중복 계산 방지 */
export function formatPairSajuBlock(
  sajuA: SajuDataForIntegrated,
  sajuB: SajuDataForIntegrated,
  labelA: string,
  labelB: string,
  pairAnalysis?: PairSajuAnalysis,
): string {
  const pillarsA = sajuA.saju;
  const pillarsB = sajuB.saju;
  if (!pillarsA?.dayPillar || !pillarsB?.dayPillar) {
    return "(궁합 사주 계산 불가 — 팔자 데이터 없음)";
  }

  const pair =
    pairAnalysis ??
    analyzePairSaju(
      sajuJsonToPillars(pillarsA as Required<typeof pillarsA>),
      sajuJsonToPillars(pillarsB as Required<typeof pillarsB>),
    );

  const yongA = estimateYongsinGisin(
    sajuJsonToPillars(pillarsA as Required<typeof pillarsA>),
  );
  const yongB = estimateYongsinGisin(
    sajuJsonToPillars(pillarsB as Required<typeof pillarsB>),
  );

  return `
## 두 사람 궁합 사주 (실제 교차 계산 — Layer 2~4)

### 오행·에너지 (Layer 2)
- ${labelA} 오행 분포: ${pair.aElementCounts}
- ${labelB} 오행 분포: ${pair.bElementCounts}
- 함께 있을 때: ${pair.combinedElementNote}

### 용신/기신 상호작용 (Layer 2-2)
- ${labelA} 필요 기운: ${yongA.yongsin} | 과부하 기운: ${yongA.gisin}
- ${labelB} 필요 기운: ${yongB.yongsin} | 과부하 기운: ${yongB.gisin}
- 해석: A의 부족분을 B가 채워주는지, B의 과한 기운이 A를 압박하는지 **조합**으로 판단

### 일간·일지·연주 (Layer 3-1, 3-2, 3-3)
- 일간(핵심 자아) 상호작용: ${pair.dayStemInteraction}
- ${pair.yearStemSameEra}
${formatCrossHits(pair.dayBranchCrossHits, "일지(배우자궁) 교차 지지 관계")}

### 지지 갈등·시너지 (Layer 4)
${formatCrossHits(pair.allCrossHits, "전체 기둥 교차 지지 관계")}

### 대운·시간 (Layer 8)
- 대운 전용 데이터 없음 — 각자 12운성·연주·월지·위 궁합 신호를 조합해 시기별 전망 작성
`.trim();
}
