/**
 * MVP: 로그인·소유권만으로 심화 LLM 허용.
 * 결제 런칭 시 `PREMIUM_PAYWALL=true` 로 entitlement / upgrade secret 게이트 복구.
 */
export function isPremiumPaywallEnabled(): boolean {
  return process.env.PREMIUM_PAYWALL === "true";
}
