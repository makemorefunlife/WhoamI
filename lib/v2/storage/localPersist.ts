/** sessionStorage → localStorage 마이그레이션 포함 읽기 */
export function readJsonStorage<T>(
  key: string,
  legacySessionKey?: string,
): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
    if (legacySessionKey) {
      const legacy = sessionStorage.getItem(legacySessionKey);
      if (legacy) {
        localStorage.setItem(key, legacy);
        sessionStorage.removeItem(legacySessionKey);
        return JSON.parse(legacy) as T;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function writeJsonStorage(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota */
  }
}

export function removeJsonStorage(key: string, legacySessionKey?: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
    if (legacySessionKey) sessionStorage.removeItem(legacySessionKey);
  } catch {
    /* ignore */
  }
}
