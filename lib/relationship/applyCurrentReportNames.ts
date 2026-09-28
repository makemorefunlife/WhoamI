/**
 * Shows a saved premium relationship report (Family, Friend, Marriage, Work)
 * with the participants' CURRENT canonical names
 * (lib/relationship/relationshipPersonNames.ts) -- without regenerating it,
 * without consuming a credit, and without rewriting prose.
 *
 * Every kind stores each person's generation-time name in dedicated name
 * fields (meta.nickname_a/b, snapshot_panel.personA/B.nickname, section_dna
 * person_a/b.nickname, role/compare-row "..._nickname" fields, ...), and the
 * view models render headers and mid-report headings ("Why X is needed for
 * Y", "X's upset guide", ...) from those fields. This swaps ONLY string values
 * under name keys, and ONLY when the value is exactly a person's stored name,
 * to that person's current name. Free-text fields (paragraphs, headlines,
 * advice) are never touched, so generic words such as "partner" in prose stay
 * as written; prose that already baked a name in at generation keeps it
 * (historical paid content is not rewritten).
 */

type Slots = { a?: string | null; b?: string | null } | null | undefined;

/** Exact name-field keys (besides "nickname" / "*_nickname" / "*Nickname"). */
const EXTRA_NAME_KEYS = new Set([
  "nickname_a",
  "nickname_b",
  "nicknameA",
  "nicknameB",
  "nicknames",
  "self_name",
  "partner_name",
  "name_a",
  "name_b",
  "nameA",
  "nameB",
  "names",
]);

export function isReportNameKey(key: string): boolean {
  return (
    key === "nickname" ||
    key.endsWith("_nickname") ||
    key.endsWith("Nickname") ||
    EXTRA_NAME_KEYS.has(key)
  );
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function at(obj: unknown, ...path: string[]): unknown {
  let cur = obj;
  for (const k of path) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[k];
  }
  return cur;
}

/**
 * The generation-time names of report slots A / B, read from the report's
 * own slot-name fields (first one present wins). Empty when unknown.
 */
export function storedReportSlotNames(report: unknown): { a: string; b: string } {
  const pairs: [unknown, unknown][] = [
    [at(report, "meta", "nickname_a"), at(report, "meta", "nickname_b")],
    [at(report, "snapshot_panel", "personA", "nickname"), at(report, "snapshot_panel", "personB", "nickname")],
    [at(report, "household", "section_dna", "person_a", "nickname"), at(report, "household", "section_dna", "person_b", "nickname")],
    [at(report, "office", "section_dna", "person_a", "nickname"), at(report, "office", "section_dna", "person_b", "nickname")],
    [at(report, "friend", "section_social_dna_a", "nickname"), at(report, "friend", "section_social_dna_b", "nickname")],
  ];
  for (const [a, b] of pairs) {
    if (str(a) && str(b)) return { a: str(a), b: str(b) };
  }
  return { a: "", b: "" };
}

function remapValue(v: unknown, map: Map<string, string>): unknown {
  if (typeof v === "string") return map.get(v.trim()) ?? v;
  if (Array.isArray(v)) return v.map((x) => (typeof x === "string" ? (map.get(x.trim()) ?? x) : remap(x, map)));
  return remap(v, map);
}

function remap(value: unknown, map: Map<string, string>): unknown {
  if (Array.isArray(value)) return value.map((v) => remap(v, map));
  if (!value || typeof value !== "object") return value;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = isReportNameKey(k) && (typeof v === "string" || Array.isArray(v)) ? remapValue(v, map) : remap(v, map);
  }
  return out;
}

export function applyCurrentReportNames<T>(report: T, currentNames: Slots): T {
  if (!report) return report;
  const stored = storedReportSlotNames(report);
  const nowA = currentNames?.a?.trim() ?? "";
  const nowB = currentNames?.b?.trim() ?? "";
  // Unknown stored names, or both slots stored the same name (ambiguous) -> as is.
  if (!stored.a || !stored.b || stored.a === stored.b) return report;
  const map = new Map<string, string>();
  if (nowA && nowA !== stored.a) map.set(stored.a, nowA);
  if (nowB && nowB !== stored.b) map.set(stored.b, nowB);
  if (map.size === 0) return report;
  return remap(report, map) as T;
}
