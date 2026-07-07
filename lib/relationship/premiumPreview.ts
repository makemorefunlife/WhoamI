/** 결제 연동 전 — 심화 관계 분석 미리보기 (NEXT_PUBLIC_RELATIONSHIP_PREMIUM_PREVIEW) */
export function relationshipPremiumPreviewEnabled(): boolean {
  const flag = process.env.NEXT_PUBLIC_RELATIONSHIP_PREMIUM_PREVIEW;
  if (flag === "true") return true;
  if (flag === "false") return false;
  return process.env.NODE_ENV === "development";
}
