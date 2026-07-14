import { maskId } from "@/lib/security/safeLog";

/** URL reportId 힌트와 서버 canonical 불일치 시 로그 (masked IDs만) */
export function logCanonicalReportIdMismatch(
  urlHint: string,
  canonicalReportId: string,
  context: string,
): void {
  const hint = urlHint.trim();
  const canonical = canonicalReportId.trim();
  if (!hint || !canonical || hint === canonical) return;
  console.info(
    `[canonical-report] mismatch context=${context} urlHint=${maskId(hint)} canonical=${maskId(canonical)}`,
  );
}
