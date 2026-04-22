/** UUID 문자열 기준으로 고정 순서 (DB unique 인덱스와 정합) */
export function sortReportPair(
  a: string,
  b: string,
): { report_id_a: string; report_id_b: string } {
  const x = String(a).trim();
  const y = String(b).trim();
  return x <= y
    ? { report_id_a: x, report_id_b: y }
    : { report_id_a: y, report_id_b: x };
}
