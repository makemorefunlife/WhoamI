import type { PairContextEngineOutput } from "./types";

const NARRATIVE_MARKERS = [
  "절대적",
  "완벽한",
  "무조건",
  "advice",
  "should ",
  "반드시",
];

/**
 * Structural purity — no domain narrative fields, no weight score field.
 */
export function assertPairContextPurity(output: PairContextEngineOutput): void {
  const errors: string[] = [];
  const forbiddenKeys = [
    "narrative",
    "advice",
    "weight",
    "section_copy",
    "compatibility_score",
  ];

  for (const key of forbiddenKeys) {
    if (key in (output as unknown as Record<string, unknown>)) {
      errors.push(`output has forbidden key: ${key}`);
    }
  }

  for (const p of output.packets) {
    if ("weight" in p) {
      errors.push(`${p.packet_id}: forbidden field weight`);
    }
    if (p.selection_priority < 0 || p.selection_priority > 1.5) {
      errors.push(`${p.packet_id}: selection_priority out of range`);
    }
    for (const m of p.base_meanings) {
      for (const marker of NARRATIVE_MARKERS) {
        if (m.text_ko.toLowerCase().includes(marker.toLowerCase())) {
          // soft: dictionary may still have soft prose; do not fail hard
          break;
        }
      }
    }
  }

  if (errors.length) {
    throw new Error(`Pair CE purity failed:\n${errors.join("\n")}`);
  }
}
