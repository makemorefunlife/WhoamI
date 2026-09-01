import type { AnonymousMapShare } from "./buildAnonymousMapShare";

/**
 * Plain-text rendering of an anonymized map share, e.g.:
 *   My Person 8 people · 27%
 *   Couch 6 people · 20%
 * Only ever fed role label + count + percent — see buildAnonymousMapShare.
 */
export function buildAnonymousMapShareText(
  share: AnonymousMapShare,
  formatCount: (n: number) => string,
  title: string,
): string {
  const lines = share.roles
    .filter((r) => r.count > 0)
    .map((r) => `${r.label} ${formatCount(r.count)} · ${r.percent}%`);
  return [title, ...lines].join("\n");
}
