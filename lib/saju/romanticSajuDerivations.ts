import { REF_EARTHLY_BRANCHES, REF_HEAVENLY_STEMS } from "@/lib/hardcoded/sajuReferenceData";
import { buildChartContext, type SajuPillars } from "@/lib/saju/chartContext";
import { ELEMENT_KO, countElements } from "@/lib/saju/elements";
import {
  estimateStrengthBalance as estimateStrengthBalanceFromChart,
  estimateYongsinGisin as estimateYongsinGisinFromChart,
} from "@/lib/saju/strengthBalance";

const stemKor = new Map<string, string>(
  REF_HEAVENLY_STEMS.map((r) => [r.code, r.kor_name]),
);
const branchKor = new Map<string, string>(
  REF_EARTHLY_BRANCHES.map((r) => [r.code, r.kor_name]),
);

function formatElementCounts(counts: Record<string, number>): string {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([el, n]) => `${ELEMENT_KO[el] ?? el}(${n})`)
    .join(", ");
}

function pillarStemBranch(pillar: string): { stem: string; branch: string } {
  const chart = buildChartContext({
    yearPillar: pillar,
    monthPillar: pillar,
    dayPillar: pillar,
    hourPillar: pillar,
  });
  const p = chart.pillars[0]!;
  return { stem: p.stemCode, branch: p.branchCode };
}

/**
 * 신강/신약 간이 추정 — LLM 내부 참고용.
 * lib/saju/strengthBalance.ts로 승격됨(ChartContext 기준). 여기서는 기존
 * SajuPillars 기반 호출부(romanticRules, work/friend/marriage rule-context
 * 빌더 등)를 깨지 않기 위한 얇은 래퍼만 유지.
 */
export function estimateStrengthBalance(saju: SajuPillars): {
  label: string;
  note: string;
} {
  return estimateStrengthBalanceFromChart(buildChartContext(saju));
}

/**
 * 용신·기신 방향 간이 추정 — 확정 금지, 후보만.
 * lib/saju/strengthBalance.ts로 승격됨. 얇은 래퍼만 유지(위와 동일 이유).
 */
export function estimateYongsinGisin(saju: SajuPillars): {
  yongsin_candidates: string[];
  gisin_candidates: string[];
  confidence: "low" | "medium";
  note: string;
} {
  return estimateYongsinGisinFromChart(buildChartContext(saju));
}

export function formatPillarStemBranchLabel(pillar: string): string {
  const { stem, branch } = pillarStemBranch(pillar);
  const sk = stemKor.get(stem) ?? stem;
  const bk = branchKor.get(branch) ?? branch;
  return `${sk}(${stem}) + ${bk}(${branch})`;
}

export function formatElementDistribution(saju: SajuPillars): string {
  return formatElementCounts(countElements(buildChartContext(saju)));
}

export function getMonthBranchCode(saju: SajuPillars): string {
  return buildChartContext(saju).monthBranchCode;
}

export function getDayBranchCode(saju: SajuPillars): string {
  return buildChartContext(saju).dayBranchCode;
}

export function getDayStemCode(saju: SajuPillars): string {
  return buildChartContext(saju).dayStemCode;
}
