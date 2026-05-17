export type PersistedAstrologyReuseDecision =
  | { action: "reuse"; storedFingerprint: string }
  | { action: "invalidate"; reason: "missing_fingerprint" | "fingerprint_mismatch" }
  | { action: "none" };

/**
 * persisted astrology 행 재사용 여부 (content 있을 때만 호출)
 * - fingerprint 없음 → 무효화 (구 서울 고정 캐시 등)
 * - fingerprint 불일치 → 무효화
 */
export function decidePersistedAstrologyReuse(
  storedFingerprint: string | null | undefined,
  currentFingerprint: string,
): PersistedAstrologyReuseDecision {
  const stored =
    typeof storedFingerprint === "string" ? storedFingerprint.trim() : "";
  const current = currentFingerprint.trim();

  if (!stored) {
    return { action: "invalidate", reason: "missing_fingerprint" };
  }
  if (stored !== current) {
    return { action: "invalidate", reason: "fingerprint_mismatch" };
  }
  return { action: "reuse", storedFingerprint: stored };
}
