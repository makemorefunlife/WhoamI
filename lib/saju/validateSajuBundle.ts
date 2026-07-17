import type { SajuPillars } from "@/lib/saju/chartContext";
import { buildChartContext } from "@/lib/saju/chartContext";
import type { Locale } from "@/lib/i18n/locale";

const HANJA_PAIR = /^[一-鿿]{2}$/;

/**
 * Tiny local `pick` — this file sits below every relationship domain, so it
 * can't import a domain's `*Copy.ts` scaffold without inverting the layering.
 * `locale` defaults to Korean so every pre-existing caller that doesn't pass
 * it keeps rendering exactly as before.
 */
function pick<T>(locale: Locale, en: T, ko: T): T {
  return locale === "en-US" ? en : ko;
}

const PILLAR_LABEL: Record<Locale, [string, string, string, string]> = {
  "en-US": ["Year Pillar", "Month Pillar", "Day Pillar", "Hour Pillar"],
  "ko-KR": ["년주", "월주", "일주", "시주"],
};

export type SajuValidationResult = {
  ok: boolean;
  notes: string[];
};

/** 60갑자 정합성·필수 궁위 — LLM 호출 전 게이트 */
export function validateSajuPillars(
  pillars: SajuPillars,
  opts?: { birthTimeUnknown?: boolean; locale?: Locale },
): SajuValidationResult {
  const locale = opts?.locale ?? "ko-KR";
  const notes: string[] = [];
  let ok = true;

  const [yearLabel, monthLabel, dayLabel, hourLabel] = PILLAR_LABEL[locale];
  const entries: Array<[string, string]> = [
    [yearLabel, pillars.yearPillar],
    [monthLabel, pillars.monthPillar],
    [dayLabel, pillars.dayPillar],
    [hourLabel, pillars.hourPillar],
  ];

  for (const [label, pillar] of entries) {
    if (!HANJA_PAIR.test(pillar)) {
      ok = false;
      notes.push(
        pick(
          locale,
          `${label} pillar format is invalid (${pillar}).`,
          `${label} 팔자 형식이 올바르지 않습니다 (${pillar}).`,
        ),
      );
    }
  }

  try {
    const chart = buildChartContext(pillars);
    if (!chart.dayStemCode || !chart.dayBranchCode) {
      ok = false;
      notes.push(
        pick(
          locale,
          "Could not resolve the day-stem/day-branch code.",
          "일간·일지 코드를 해석할 수 없습니다.",
        ),
      );
    }
  } catch (e) {
    ok = false;
    notes.push(
      e instanceof Error
        ? e.message
        : pick(locale, "Failed to build the saju pillar chart.", "팔자 차트 구성에 실패했습니다."),
    );
  }

  if (opts?.birthTimeUnknown) {
    notes.push(
      pick(
        locale,
        "Birth time unknown — the hour pillar is reference only (based on 12:00), and hour-pillar/late-life interpretations are not certain.",
        "출생 시간 미상 — 시주는 참고용(12:00 기준)이며 시주·말년 해석은 확실하지 않습니다.",
      ),
    );
  }

  if (ok && notes.length === 0) {
    notes.push(
      pick(
        locale,
        "Manseryeok pillar/day-stem interpretation path normal.",
        "만세력 팔자·일간 해석 경로 정상.",
      ),
    );
  }

  return { ok, notes };
}
