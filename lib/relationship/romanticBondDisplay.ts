/** special_bond UI — 진부·중복·자연물 비유 필터 */

const GENERIC_BOND_CLICHE_RE =
  /깊은 정서적 교감|깊은 신뢰|특별한 에너지|특별한 인연|함께할 때만 느낄 수 있는|서로를 이해하고 존중|함께 성장하는 경험|관계의 특별함을|서로에게 큰 힘이|솔직하게 나누면서|더욱 깊어지고 있어요|서로의 다름을 인정/;

const NATURE_METAPHOR_RE =
  /촛불|타오르는|등불|불꽃|산처럼|튼튼한 산|바위|대지|숲|나무|물결|바다|강물|씨앗이 되는/;

const FORMULA_CLICHE_RE =
  /서로를 완성|완성시키는 관계|특별한 에너지|천생연분|운명적/;

function normalizeForCompare(text: string): string {
  return text
    .replace(/\s+/g, "")
    .replace(/[.,!?…~]/g, "")
    .toLowerCase();
}

function overlapRatio(a: string, b: string): number {
  const na = normalizeForCompare(a);
  const nb = normalizeForCompare(b);
  if (!na || !nb) return 0;
  if (na.includes(nb) || nb.includes(na)) return 1;
  const shorter = na.length < nb.length ? na : nb;
  const longer = na.length >= nb.length ? na : nb;
  let hits = 0;
  for (let i = 0; i <= shorter.length - 12; i += 4) {
    const slice = shorter.slice(i, i + 12);
    if (longer.includes(slice)) hits++;
  }
  const windows = Math.max(1, Math.floor((shorter.length - 12) / 4) + 1);
  return hits / windows;
}

export function isGenericBondParagraph(text: string | undefined | null): boolean {
  const t = text?.trim();
  if (!t || t.length < 12) return true;
  if (GENERIC_BOND_CLICHE_RE.test(t)) return true;
  if (
    (t.match(/서로/g) ?? []).length >= 4 &&
    (t.match(/함께/g) ?? []).length >= 2 &&
    t.length < 220
  ) {
    return true;
  }
  return false;
}

export function isNatureMetaphorBondLine(text: string | undefined | null): boolean {
  const t = text?.trim();
  if (!t) return false;
  return NATURE_METAPHOR_RE.test(t) || FORMULA_CLICHE_RE.test(t);
}

export function shouldShowBondFormula(
  formula: string | undefined | null,
  onlyTogether: string | undefined | null,
): boolean {
  const f = formula?.trim();
  if (!f) return false;
  if (isGenericBondParagraph(f) || isNatureMetaphorBondLine(f)) return false;
  const together = onlyTogether?.trim();
  if (together && together.length >= 80 && overlapRatio(f, together) > 0.35) {
    return false;
  }
  return true;
}

export function shouldShowWhySpecial(
  why: string | undefined | null,
  context: {
    onlyTogether?: string | null;
    aGivesB?: string | null;
    bGivesA?: string | null;
  },
): boolean {
  const w = why?.trim();
  if (!w) return false;
  if (isGenericBondParagraph(w)) return false;
  if (isNatureMetaphorBondLine(w)) return false;

  const refs = [context.onlyTogether, context.aGivesB, context.bGivesA]
    .map((t) => t?.trim())
    .filter(Boolean) as string[];

  for (const ref of refs) {
    if (overlapRatio(w, ref) > 0.4) return false;
  }

  return true;
}

export function shouldShowBondInsightHook(body: string | undefined | null): boolean {
  const t = body?.trim();
  if (!t) return false;
  if (isGenericBondParagraph(t)) return false;
  if (isNatureMetaphorBondLine(t)) return false;
  return true;
}
