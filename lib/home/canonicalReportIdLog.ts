/** URL reportId 힌트와 서버 canonical 불일치 시 로그 */
export function logCanonicalReportIdMismatch(
  urlHint: string,
  canonicalReportId: string,
  context: string,
): void {
  const hint = urlHint.trim();
  const canonical = canonicalReportId.trim();
  if (!hint || !canonical || hint === canonical) return;
  console.info(
    `[canonical-report] urlHint=${hint} canonical=${canonical} context=${context}`,
  );
}
