import { REF_EARTHLY_BRANCHES, REF_HEAVENLY_STEMS } from "@/lib/hardcoded/sajuReferenceData";
import { buildChartContext, type SajuPillars } from "@/lib/saju/chartContext";

const ELEMENT_KO: Record<string, string> = {
  wood: "목(木)",
  fire: "화(火)",
  earth: "토(土)",
  metal: "금(金)",
  water: "수(水)",
};

const stemElement = new Map(
  REF_HEAVENLY_STEMS.map((r) => [r.code, r.element as string]),
);
const branchElement = new Map(
  REF_EARTHLY_BRANCHES.map((r) => [r.code, r.element as string]),
);
const stemKor = new Map(REF_HEAVENLY_STEMS.map((r) => [r.code, r.kor_name]));
const branchKor = new Map(REF_EARTHLY_BRANCHES.map((r) => [r.code, r.kor_name]));

function countElementsFromPillars(saju: SajuPillars): Record<string, number> {
  const chart = buildChartContext(saju);
  const counts: Record<string, number> = {
    wood: 0,
    fire: 0,
    earth: 0,
    metal: 0,
    water: 0,
  };
  for (const p of chart.pillars) {
    const se = stemElement.get(p.stemCode);
    const be = branchElement.get(p.branchCode);
    if (se) counts[se] = (counts[se] ?? 0) + 1;
    if (be) counts[be] = (counts[be] ?? 0) + 1;
  }
  return counts;
}

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
  const p = chart.pillars[0];
  return { stem: p.stemCode, branch: p.branchCode };
}

/** 신강/신약 간이 추정 — LLM 내부 참고용 */
export function estimateStrengthBalance(saju: SajuPillars): {
  label: string;
  note: string;
} {
  const chart = buildChartContext(saju);
  const dayEl = stemElement.get(chart.dayStemCode) ?? "earth";
  const counts = countElementsFromPillars(saju);

  const generates: Record<string, string> = {
    wood: "fire",
    fire: "earth",
    earth: "metal",
    metal: "water",
    water: "wood",
  };
  const overcomes: Record<string, string> = {
    wood: "earth",
    earth: "water",
    water: "fire",
    fire: "metal",
    metal: "wood",
  };

  const resource = Object.entries(generates).find(([, v]) => v === dayEl)?.[0];
  const peer = dayEl;
  const output = generates[dayEl];
  const control = Object.entries(overcomes).find(([, v]) => v === dayEl)?.[0];

  const support = (counts[peer] ?? 0) + (counts[resource ?? ""] ?? 0);
  const drain =
    (counts[output ?? ""] ?? 0) +
    (counts[control ?? ""] ?? 0) * 1.2;

  const label =
    support >= drain + 2
      ? "신강(혼자서도 잘 버티는 타입)"
      : drain >= support + 2
        ? "신약(주변 지지·공감이 필요한 타입)"
        : "중화(상황에 따라 유연하게 기운이 오감)";

  return {
    label,
    note: `일간 ${ELEMENT_KO[dayEl]} 기준 — 받치는 기운(동기·자원) ${support} vs 소모·압박 기운 ${Math.round(drain)}`,
  };
}

/** 용신·기신 방향 간이 추정 — 확정 금지, 후보만 */
export function estimateYongsinGisin(saju: SajuPillars): {
  yongsin_candidates: string[];
  gisin_candidates: string[];
  confidence: "low" | "medium";
  note: string;
} {
  const counts = countElementsFromPillars(saju);
  const sorted = Object.entries(counts).sort((a, b) => a[1] - b[1]);
  const weakest = sorted[0];
  const strongest = sorted[sorted.length - 1];

  const yongsin_candidates = [
    `${ELEMENT_KO[weakest[0]]} — 부족한 기운, 관계에서 채우고 싶은 에너지`,
  ];
  const gisin_candidates = [
    `${ELEMENT_KO[strongest[0]]} — 과한 기운, 과부하·고집·예민함으로 나올 수 있음`,
  ];

  return {
    yongsin_candidates,
    gisin_candidates,
    confidence: "low",
    note: `오행 분포 기반 후보 (약: ${weakest[1]}, 강: ${strongest[1]}) — 확정 아님`,
  };
}

export function formatPillarStemBranchLabel(pillar: string): string {
  const { stem, branch } = pillarStemBranch(pillar);
  const sk = stemKor.get(stem) ?? stem;
  const bk = branchKor.get(branch) ?? branch;
  return `${sk}(${stem}) + ${bk}(${branch})`;
}

export function formatElementDistribution(saju: SajuPillars): string {
  return formatElementCounts(countElementsFromPillars(saju));
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
