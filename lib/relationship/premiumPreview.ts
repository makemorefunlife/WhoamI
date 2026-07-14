/**
 * 클라이언트 UI — 프리미엄 미리보기 버튼 표시 여부.
 * NEXT_PUBLIC_* 는 보안 게이트가 아님 (서버 upgrade 우회에 사용하지 않음).
 */
export function relationshipPremiumPreviewEnabled(): boolean {
  const flag = process.env.NEXT_PUBLIC_RELATIONSHIP_PREMIUM_PREVIEW;
  if (flag === "true") return true;
  if (flag === "false") return false;
  return process.env.NODE_ENV === "development";
}

/**
 * 서버 전용 — 로컬 development에서만 upgrade preview bypass 허용.
 * production / preview 배포에서는 항상 false.
 * 필요 시 .env.local 에 RELATIONSHIP_PREMIUM_PREVIEW=true (서버 전용, NEXT_PUBLIC 아님).
 */
export function relationshipUpgradePreviewBypassEnabled(): boolean {
  if (process.env.NODE_ENV !== "development") return false;
  return process.env.RELATIONSHIP_PREMIUM_PREVIEW === "true";
}
