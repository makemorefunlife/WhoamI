import type { Locale } from "@/lib/i18n/locale";
import { pick } from "./familyParentCopy";
import { josaGwaWa } from "./familyParentLanguage";

/**
 * Single source for the Family compare-table "person contrast" lead -- the
 * sentence that opens each section_compare_table row's `meaning` and names
 * both people's own labels. It is written by familySajuCompareTable and
 * CHECKED by isFamilyParentChildDeepReport (a report whose first row lacks
 * it is an old v1 compare table and is treated as a cache miss).
 *
 * The writer and the checker used to hold two separate copies of this
 * wording. When the English wording changed (2026-08-24) the checker kept
 * the old English markers, so every en-US Family report was rejected as
 * "no report": the page showed the empty state / Buy CTA even though the
 * report existed (and History listed it), and generation re-ran -- and
 * re-charged -- on the next autostart. Keeping both here prevents that drift.
 */
export function buildFamilyPersonContrastLead(
  locale: Locale,
  nameParent: string,
  labelParent: string,
  nameChild: string,
  labelChild: string,
): string {
  if (labelParent === labelChild) {
    const parentWithJosa = josaGwaWa(nameParent);
    return pick(
      locale,
      `${nameParent} and ${nameChild} share the same signal (“${labelParent}”). `,
      `${parentWithJosa} ${nameChild} 모두 ‘${labelParent}’이에요. `,
    );
  }
  return pick(
    locale,
    `${nameParent}: “${labelParent}.” ${nameChild}: “${labelChild}.” `,
    `${nameParent} 쪽은 ‘${labelParent}’, ${nameChild} 쪽은 ‘${labelChild}’이에요. `,
  );
}

/**
 * Markers of the lead above, current and previously shipped wordings, in
 * both locales. A v1 compare table (no person lead at all) matches none.
 */
const PERSON_CONTRAST_LEAD_MARKERS: readonly RegExp[] = [
  // ko-KR (current)
  /모두 ‘/,
  /쪽은 ‘/,
  // en-US (current): `A and B share the same signal (“X”).`
  / share the same signal \(“/,
  // en-US (current): `A: “X.” B: “Y.”`
  /: “[^”]*” [^“”]*: “/,
  // en-US (pre-2026-08-24 wordings still present in stored reports)
  /share the same person signal/,
  /”: “/,
];

export function hasFamilyPersonContrastLead(meaning: string): boolean {
  return PERSON_CONTRAST_LEAD_MARKERS.some((re) => re.test(meaning));
}
