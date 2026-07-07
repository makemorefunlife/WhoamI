/** 홈 커스텀 로그인 모달 ↔ 전역 Stitch 헤더/도커 연결 */
let handler: (() => void) | null = null;

export function setStitchAuthHandler(fn: (() => void) | null) {
  handler = fn;
}

export function openStitchAuthModal() {
  handler?.();
}
