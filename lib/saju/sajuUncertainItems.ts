import type { SajuChartProvenance } from "@/lib/saju/loadSajuBundleFromReport";
import type { Locale } from "@/lib/i18n/locale";

function pick<T>(locale: Locale, en: T, ko: T): T {
  return locale === "en-US" ? en : ko;
}

/**
 * Substring markers used to decide which `validateSajuPillars` notes count
 * as "uncertain" — kept in sync with the exact wording validateSajuBundle.ts
 * emits per locale, so the filtering decision stays identical across
 * locales even though the underlying text is now translated.
 */
const UNCERTAIN_MARKERS: Record<Locale, { notCertain: string; referenceOnly: string; normal: string }> = {
  "en-US": { notCertain: "not certain", referenceOnly: "reference only", normal: "normal" },
  "ko-KR": { notCertain: "확실하지", referenceOnly: "참고용", normal: "정상" },
};

/** LLM·meta에 넘길 불확실 항목 — 임의 확정 방지 */
export function buildSajuUncertainItems(params: {
  provenance?: SajuChartProvenance | null;
  birthPlace?: string | null;
  validationNotes?: string[];
  locale?: Locale;
}): string[] {
  const locale = params.locale ?? "ko-KR";
  const items: string[] = [];

  if (params.provenance?.birthTimeUnknown) {
    items.push(
      pick(
        locale,
        "Birth time unknown — hour-pillar, late-life, and time-sensitive interpretations are reference only.",
        "출생 시간을 모름 — 시주·말년·시간대 민감 해석은 참고용입니다.",
      ),
    );
  }

  if (!params.birthPlace?.trim()) {
    items.push(
      pick(
        locale,
        "Birth place not entered — using Manseryeok defaults without longitude/timezone correction.",
        "출생지 미입력 — 경도·시차 보정 없이 만세력 기본값을 씁니다.",
      ),
    );
  }

  const markers = UNCERTAIN_MARKERS[locale];
  for (const note of params.validationNotes ?? []) {
    if (
      note.includes(markers.notCertain) ||
      note.includes(markers.referenceOnly) ||
      !note.includes(markers.normal)
    ) {
      items.push(note);
    }
  }

  return [...new Set(items)];
}
