/** reports 행 기준 프리미엄(entitlement) 여부 — Dev SSOT hard cut */
export function isReportPremium(report: {
  entitlement?: string | null;
}): boolean {
  return report.entitlement === "premium";
}
