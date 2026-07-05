import type { SajuPillars } from "@/lib/saju/chartContext";
import { buildChartContext } from "@/lib/saju/chartContext";

const HANJA_PAIR = /^[\u4e00-\u9fff]{2}$/;

export type SajuValidationResult = {
  ok: boolean;
  notes: string[];
};

/** 60갑자 정합성·필수 궁위 — LLM 호출 전 게이트 */
export function validateSajuPillars(
  pillars: SajuPillars,
  opts?: { birthTimeUnknown?: boolean },
): SajuValidationResult {
  const notes: string[] = [];
  let ok = true;

  const entries: Array<[string, string]> = [
    ["년주", pillars.yearPillar],
    ["월주", pillars.monthPillar],
    ["일주", pillars.dayPillar],
    ["시주", pillars.hourPillar],
  ];

  for (const [label, pillar] of entries) {
    if (!HANJA_PAIR.test(pillar)) {
      ok = false;
      notes.push(`${label} 팔자 형식이 올바르지 않습니다 (${pillar}).`);
    }
  }

  try {
    const chart = buildChartContext(pillars);
    if (!chart.dayStemCode || !chart.dayBranchCode) {
      ok = false;
      notes.push("일간·일지 코드를 해석할 수 없습니다.");
    }
  } catch (e) {
    ok = false;
    notes.push(
      e instanceof Error ? e.message : "팔자 차트 구성에 실패했습니다.",
    );
  }

  if (opts?.birthTimeUnknown) {
    notes.push(
      "출생 시간 미상 — 시주는 참고용(12:00 기준)이며 시주·말년 해석은 확실하지 않습니다.",
    );
  }

  if (ok && notes.length === 0) {
    notes.push("만세력 팔자·일간 해석 경로 정상.");
  }

  return { ok, notes };
}
