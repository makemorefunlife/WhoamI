/**
 * English tone guards — the en-US counterpart to koToneGuards.ts. Shared
 * across every LLM-generated report surface (relationship premium domains,
 * personal Blueprint/Essence, deep reports, future diary/journal analysis).
 *
 * English has no grammatical register system the way Korean does (해요체 vs
 * 합쇼체), so there is no verb-conjugation layer here. What LLM English
 * actually needs cleaning up is structural: em-dash clause-chaining and a
 * recognizable set of consultant/self-help clichés. Two variants:
 *
 * 1) polishEnTone — default warm-casual voice (Romantic/Married/Friend/Family,
 *    personal reports). Strips clichés, splits em-dash clause chains.
 * 2) polishEnFormalTone — Business/Partnership's analytical voice. Same
 *    structural cleanup, plus strips empathetic-cushioning phrases that
 *    belong to the warm consumer voice, not a decision-support tone.
 */

/** Em dash (—), spaced en dash/hyphen (" – " / " -- ") used as a clause joint. */
const DASH_JOIN_RE = /\s+[—–]\s+|\s+--\s+/g;

/**
 * LLM English throat-clearing / self-help clichés. Each entry either strips
 * the phrase (empty replacement, safe because it's a preamble/filler clause)
 * or substitutes a plainer phrase. Ordered longest/most-specific first.
 */
const CLICHE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bit'?s important to note that\s*/gi, ""],
  [/\bit'?s worth noting that\s*/gi, ""],
  [/\bit'?s worth mentioning that\s*/gi, ""],
  [/\bat the end of the day,?\s*/gi, ""],
  [/\bin today'?s fast-paced world,?\s*/gi, ""],
  [/\bwhen it comes to\b/gi, "with"],
  [/\bdelve into\b/gi, "look at"],
  [/\bnavigate the complexities of\b/gi, "work through"],
  [/\bfoster a deeper connection\b/gi, "build a closer connection"],
  [/\bunlock your (?:full )?potential\b/gi, "get more out of this"],
  [/\bembark on a journey\b/gi, "start"],
  [/\ba testament to\b/gi, "proof of"],
  [/\bin the realm of\b/gi, "in"],
  [/\btapestry of\b/gi, "mix of"],
];

/** Phrases that only make sense in a warm, emotionally-cushioning register. */
const EMPATHY_CUSHION_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bthat'?s completely understandable[,.]?\s*/gi, ""],
  [/\bit'?s (?:completely )?okay to feel (?:this way|that way)[,.]?\s*/gi, ""],
  [/\bno worries[,.]?\s*/gi, ""],
  [/\byou deserve (?:to feel|better|more)\b[^.]*\.\s*/gi, ""],
  [/\btake comfort in\b/gi, "note"],
];

export function repairBrokenEnFragments(text: string): {
  text: string;
  fixed: boolean;
} {
  // Placeholder cells ("—") are left alone.
  if (/^[—–-]+$/.test(text.trim())) {
    return { text, fixed: false };
  }

  let out = text;

  // Em-dash-joined clauses -> comma. A period risks stranding the second
  // half as a sentence fragment when it's an appositive ("X — a testament
  // to Y" -> "X. A testament to Y." has no verb); a comma stays grammatical
  // either way (compound sentence or appositive) at the small cost of an
  // occasional comma splice, which reads fine in a casual voice.
  out = out.replace(DASH_JOIN_RE, ", ");

  for (const [re, rep] of CLICHE_REPLACEMENTS) {
    out = out.replace(re, rep);
  }

  if (out !== text) {
    out = out
      .replace(/\.\s*\./g, ".")
      .replace(/,\s*,/g, ",")
      .replace(/,\s*\./g, ".")
      .replace(/\s{2,}/g, " ")
      .replace(/\s+\./g, ".")
      .replace(/\s+,/g, ",")
      // Capitalize the very start of the string only — comma joins don't
      // create new sentences, so mid-string capitalization isn't needed.
      .replace(/^[a-z]/, (c) => c.toUpperCase())
      .trim();
  }

  return { text: out, fixed: out !== text };
}

/** repair (dash + cliché scrub) — the default warm-casual voice. */
export function polishEnTone(text: string): { text: string; fixed: boolean } {
  return repairBrokenEnFragments(text);
}

/** repair + strip empathy-cushion phrasing — Business/Partnership's voice. */
export function polishEnFormalTone(text: string): {
  text: string;
  fixed: boolean;
} {
  const repaired = repairBrokenEnFragments(text);
  let out = repaired.text;
  for (const [re, rep] of EMPATHY_CUSHION_REPLACEMENTS) {
    out = out.replace(re, rep);
  }
  const cushionStripped = out !== repaired.text;
  if (cushionStripped) {
    out = out
      .replace(/\s{2,}/g, " ")
      .replace(/(^|[.!?]\s+)([a-z])/g, (_m, pre: string, ch: string) => pre + ch.toUpperCase())
      .trim();
  }
  return { text: out, fixed: repaired.fixed || cushionStripped };
}

/**
 * Walk an arbitrary JSON tree (personal-analysis reports, Blueprint, etc.)
 * and apply polishEnTone to every string leaf.
 */
export function polishEnStringTree<T>(value: T): T {
  if (typeof value === "string") {
    return polishEnTone(value).text as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((v) => polishEnStringTree(v)) as unknown as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = polishEnStringTree(v);
    }
    return out as unknown as T;
  }
  return value;
}
