const PREFIX = "ahaitsme_v2_birth_";

export type BirthV2Session = {
  birthDate: string;
  birthTime: string | null;
  birthTimeUnknown: boolean;
  /** 점성 차트 좌표용 (예: 서울, 부산). 없으면 서울 기본값 */
  birthPlace: string | null;
  savedAt: string;
};

export function writeBirthV2Session(
  reportId: string,
  data: Omit<BirthV2Session, "savedAt">,
) {
  if (typeof window === "undefined" || !reportId) return;
  try {
    const payload: BirthV2Session = {
      ...data,
      savedAt: new Date().toISOString(),
    };
    sessionStorage.setItem(`${PREFIX}${reportId}`, JSON.stringify(payload));
  } catch {
    /* quota */
  }
}

export function readBirthV2Session(reportId: string): BirthV2Session | null {
  if (typeof window === "undefined" || !reportId) return null;
  try {
    const raw = sessionStorage.getItem(`${PREFIX}${reportId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<BirthV2Session>;
    if (!parsed.birthDate) return null;
    return {
      birthDate: parsed.birthDate,
      birthTime: parsed.birthTime ?? null,
      birthTimeUnknown:
        parsed.birthTimeUnknown === true ||
        parsed.birthTime == null ||
        parsed.birthTime === "",
      birthPlace: parsed.birthPlace?.trim() || null,
      savedAt: parsed.savedAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function hasBirthV2Session(reportId: string): boolean {
  return readBirthV2Session(reportId) != null;
}

export function clearBirthV2Session(reportId: string) {
  if (typeof window === "undefined" || !reportId) return;
  try {
    sessionStorage.removeItem(`${PREFIX}${reportId}`);
  } catch {
    /* ignore */
  }
}
