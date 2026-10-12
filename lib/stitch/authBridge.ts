/** 홈 커스텀 로그인 모달 ↔ 전역 Stitch 헤더/도커 연결 */
let handler: (() => void) | null = null;

export function setStitchAuthHandler(fn: (() => void) | null) {
  handler = fn;
}

export function openStitchAuthModal() {
  handler?.();
}

/**
 * 홈의 "개인분석 선택" 창(무료 체험 / 비회원 유료 구매) ↔ 도커 '나'.
 * 홈이 떠 있으면(/, /kr 모두) 그 자리에서 열고 true, 아니면 false.
 */
let personalHandler: (() => void) | null = null;

export function setStitchPersonalChoiceHandler(fn: (() => void) | null) {
  personalHandler = fn;
}

export function openStitchPersonalChoice(): boolean {
  if (!personalHandler) return false;
  personalHandler();
  return true;
}
