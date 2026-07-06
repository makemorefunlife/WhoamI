export type PremiumContentSource =
  | "db"
  | "session"
  | "generation"
  | "regeneration";

/** premium integrated 본문 출처 추적 (개발·운영 디버깅) */
export function logPremiumContentSource(
  reportId: string,
  source: PremiumContentSource,
  detail?: string,
): void {
  const id = reportId.trim() || "unknown";
  const suffix = detail?.trim() ? ` detail=${detail.trim()}` : "";
  console.info(`[premium-report] reportId=${id} source=${source}${suffix}`);
}
