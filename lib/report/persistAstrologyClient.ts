import { logPremiumContentSource } from "@/lib/report/premiumContentSourceLog";

/** 파이프라인 완료 후 astrology 맥락 텍스트 DB 저장 */
export async function persistAstrologyClient(
  reportId: string,
  text: string,
  options?: { locationFingerprint?: string },
): Promise<boolean> {
  const id = reportId.trim();
  const trimmed = text.trim();
  if (!id || !trimmed) return false;

  try {
    const res = await fetch("/api/my/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reportId: id,
        astrology: trimmed,
        astrologyLocationFingerprint: options?.locationFingerprint,
      }),
    });
    if (res.ok) {
      logPremiumContentSource(id, "generation", "astrology-persisted");
    } else {
      logPremiumContentSource(
        id,
        "generation",
        `astrology-persist-failed status=${res.status}`,
      );
    }
    return res.ok;
  } catch {
    logPremiumContentSource(id, "generation", "astrology-persist-error");
    return false;
  }
}
