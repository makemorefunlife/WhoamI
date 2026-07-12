const PREFIX = "ahaitsme_birth_date_correction_used_";

/** DB 마이그레이션 전 — 생년월일 1회 수정 사용 여부 (브라우저 보조) */
export function readLocalBirthDateCorrectionUsed(reportId: string): boolean {
  if (typeof window === "undefined" || !reportId.trim()) return false;
  try {
    return localStorage.getItem(`${PREFIX}${reportId.trim()}`) === "1";
  } catch {
    return false;
  }
}

export function writeLocalBirthDateCorrectionUsed(reportId: string): void {
  if (typeof window === "undefined" || !reportId.trim()) return;
  try {
    localStorage.setItem(`${PREFIX}${reportId.trim()}`, "1");
  } catch {
    /* ignore */
  }
}
