import type { ChartContext } from "@/lib/saju/chartContext";
import {
  ELEMENT_KO,
  ELEMENT_GENERATES,
  ELEMENT_OVERCOMES,
  stemElement,
  countElements,
} from "@/lib/saju/elements";

/**
 * 신강/신약 간이 추정 — LLM 내부 참고용.
 * (기존 romanticSajuDerivations.ts에서 승격 — 로직은 동일, 입력만
 * SajuPillars → ChartContext로 통일해서 PersonCore SSOT 빌드 시
 * 이미 만들어진 chart를 재사용할 수 있게 함)
 */
export function estimateStrengthBalance(chart: ChartContext): {
  label: string;
  note: string;
} {
  const dayEl = stemElement.get(chart.dayStemCode) ?? "earth";
  const counts = countElements(chart);

  const resource = Object.entries(ELEMENT_GENERATES).find(([, v]) => v === dayEl)?.[0];
  const peer = dayEl;
  const output = ELEMENT_GENERATES[dayEl];
  const control = Object.entries(ELEMENT_OVERCOMES).find(([, v]) => v === dayEl)?.[0];

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

/**
 * 용신·기신 방향 간이 추정 — 확정 금지, 후보만.
 * (기존 romanticSajuDerivations.ts에서 승격 — 로직 동일, ChartContext 기준)
 */
export function estimateYongsinGisin(chart: ChartContext): {
  yongsin_candidates: string[];
  gisin_candidates: string[];
  confidence: "low" | "medium";
  note: string;
} {
  const counts = countElements(chart);
  const sorted = Object.entries(counts).sort((a, b) => a[1] - b[1]);
  const weakest = sorted[0]!;
  const strongest = sorted[sorted.length - 1]!;

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
