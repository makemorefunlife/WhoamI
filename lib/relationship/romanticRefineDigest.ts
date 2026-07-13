import type { RomanticSajuDeepReport } from "@/lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";

const REFINE_DIGEST_MAX_STRING = 280;

function truncateString(value: string, max = REFINE_DIGEST_MAX_STRING): string {
  const t = value.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

function digestValue(value: unknown, depth = 0): unknown {
  if (value == null) return value;
  if (typeof value === "string") return truncateString(value);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    if (depth > 2) return `[${value.length} items]`;
    return value.slice(0, 8).map((item) => digestValue(item, depth + 1));
  }
  if (typeof value === "object") {
    if (depth > 3) return "{…}";
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = digestValue(v, depth + 1);
    }
    return out;
  }
  return value;
}

/** 2차 refine용 — 1차 JSON 전체 대신 축약 digest (토큰·지연 절감) */
export function buildRomanticRefineDigest(
  report: RomanticSajuDeepReport["report"],
): string {
  const digest = {
    section_1_summary: digestValue(report.section_1_summary),
    section_2_nature: digestValue(report.section_2_nature),
    section_3_conversation_patterns: digestValue(
      report.section_3_conversation_patterns,
    ),
    section_4_special_bond: digestValue(report.section_4_special_bond),
    section_4_hidden_hearts: digestValue(report.section_4_hidden_hearts),
    section_5_action: digestValue(report.section_5_action),
    section_6_timeline: digestValue(report.section_6_timeline),
  };
  return JSON.stringify(digest);
}
