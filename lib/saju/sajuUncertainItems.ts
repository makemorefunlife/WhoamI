import type { SajuChartProvenance } from "@/lib/saju/loadSajuBundleFromReport";

/** LLM·meta에 넘길 불확실 항목 — 임의 확정 방지 */
export function buildSajuUncertainItems(params: {
  provenance?: SajuChartProvenance | null;
  birthPlace?: string | null;
  validationNotes?: string[];
}): string[] {
  const items: string[] = [];

  if (params.provenance?.birthTimeUnknown) {
    items.push(
      "출생 시간을 모름 — 시주·말년·시간대 민감 해석은 참고용입니다.",
    );
  }

  if (!params.birthPlace?.trim()) {
    items.push("출생지 미입력 — 경도·시차 보정 없이 만세력 기본값을 씁니다.");
  }

  for (const note of params.validationNotes ?? []) {
    if (note.includes("확실하지") || note.includes("참고용") || !note.includes("정상")) {
      items.push(note);
    }
  }

  return [...new Set(items)];
}
