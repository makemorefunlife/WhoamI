import {
  RELATIONSHIP_AXIS_KEYS,
  isLegacyAxisBlock,
  isNewAxisBlock,
} from "@/lib/relationship/normalizeRelationshipPerspectives";

function isRecord(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

/**
 * Server-log-only summary of WHY a parsed Basic-analysis response was
 * rejected by normalizeRelationshipPerspectives: which perspective slot,
 * which axis, which field -- never any generated text, names or ids.
 * Does not change validation; it only explains it.
 */
export function describePerspectivesShape(
  parsed: unknown,
  reportIdA: string,
  reportIdB: string,
): string {
  if (!isRecord(parsed)) return "root:not_object";
  const raw = parsed.perspectives;
  if (!isRecord(raw)) return `perspectives:${raw === undefined ? "missing" : "not_object"}`;
  const keys = Object.keys(raw);
  const out: string[] = [`slices=${keys.length}`];
  if (!(reportIdA in raw)) out.push("idA:absent");
  if (!(reportIdB in raw)) out.push("idB:absent");
  keys.slice(0, 4).forEach((key, i) => {
    const slice = raw[key];
    const tag = key === reportIdA ? "A" : key === reportIdB ? "B" : `other${i}`;
    if (!isRecord(slice)) {
      out.push(`${tag}:not_object`);
      return;
    }
    for (const axis of RELATIONSHIP_AXIS_KEYS) {
      const ax = slice[axis];
      if (ax === undefined) {
        out.push(`${tag}.${axis}:missing`);
        continue;
      }
      if (!isRecord(ax)) {
        out.push(`${tag}.${axis}:not_object`);
        continue;
      }
      if (isNewAxisBlock(ax) || isLegacyAxisBlock(ax)) continue;
      const bad: string[] = [];
      for (const f of ["my_line", "partner_line"]) {
        if (typeof ax[f] !== "string") bad.push(`${f}=${ax[f] === undefined ? "missing" : typeof ax[f]}`);
      }
      for (const f of ["insights", "actions"]) {
        if (!Array.isArray(ax[f])) bad.push(`${f}=${ax[f] === undefined ? "missing" : typeof ax[f]}`);
      }
      out.push(`${tag}.${axis}:invalid(${bad.join(",")})`);
    }
  });
  return out.join(" ");
}
