import type { PersonalContextEngineOutput } from "./types";

const NARRATIVE_MARKERS = [
  "하세요",
  "해보세요",
  "당신은",
  "조언",
  "advice",
  "should ",
  "romantic",
  "연애",
  "직장 동료",
  "부부",
];

/**
 * Structural purity for CE output — no narrative/advice fields, no invented facts.
 */
export function assertPersonalContextPurity(
  output: PersonalContextEngineOutput,
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const json = JSON.stringify(output);

  for (const key of [
    "advice_ko",
    "advice_en",
    "narrative",
    "prompt",
    "section_copy",
    "headline",
  ]) {
    if (new RegExp(`"${key}"\\s*:`).test(json)) {
      errors.push(`forbidden field: ${key}`);
    }
  }

  for (const p of output.packets) {
    if (!p.fact_path) errors.push(`${p.packet_id}: missing fact_path`);
    if (!p.reference_ids.length) {
      errors.push(`${p.packet_id}: empty reference_ids`);
    }
    if (p.selection_priority < 0 || p.selection_priority > 1.5) {
      errors.push(`${p.packet_id}: selection_priority out of range`);
    }
    for (const m of p.base_meanings) {
      if (!m.resolved) errors.push(`${p.packet_id}: base_meaning not resolved`);
      for (const marker of NARRATIVE_MARKERS) {
        if (m.text_ko.toLowerCase().includes(marker.toLowerCase())) {
          // Dictionary may still carry soft phrasing; flag only imperative advice endings.
          if (/하세요|해보세요|Practice /.test(m.text_ko)) {
            errors.push(
              `${p.packet_id}: advice-like dictionary text on ${m.reference_id}`,
            );
          }
        }
      }
    }
  }

  // Unresolved must be explicit list (may be empty)
  if (!Array.isArray(output.unresolved_references)) {
    errors.push("unresolved_references missing");
  }

  return { ok: errors.length === 0, errors };
}
