/** reports 행 기준 프리미엄(결제) 여부 */
export function isReportPremium(report: {
  payment_status?: string | null;
  plan_type?: string | null;
}): boolean {
  return report.payment_status === "paid" || report.plan_type === "paid";
}
