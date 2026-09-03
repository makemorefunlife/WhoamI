const MAX_DISPLAY_NAME_LENGTH = 60;

/** 서비스 내부 display_name(=reports.name) 입력값 정제 — 앞뒤 공백 제거, 길이 제한, 빈 값은 null. */
export function sanitizeDisplayNameInput(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim().slice(0, MAX_DISPLAY_NAME_LENGTH);
  return trimmed.length > 0 ? trimmed : null;
}
