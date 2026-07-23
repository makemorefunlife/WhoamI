/**
 * Marriage/Cohabitation premium 클라이언트 응답용 — report.context_output 제거 사본.
 * DB/로그에 넣는 payload는 이 함수를 거치지 않는다(원본 유지).
 * 원본 객체는 mutate하지 않는다.
 */
export function stripMarriageContextOutputForClient<T extends { report?: unknown }>(
  payload: T,
): T {
  const report = payload?.report;
  if (!report || typeof report !== "object" || Array.isArray(report)) {
    return payload;
  }
  if (!("context_output" in report)) {
    return payload;
  }
  const { context_output: _omit, ...reportWithoutContextOutput } = report as {
    context_output?: unknown;
  } & Record<string, unknown>;
  return {
    ...payload,
    report: reportWithoutContextOutput,
  };
}

/** report body만 있을 때(detail·로그 스냅샷) 비파괴 제거 */
export function omitMarriageContextOutputFromReport<T extends object>(
  report: T,
): T {
  if (!report || typeof report !== "object" || Array.isArray(report)) {
    return report;
  }
  if (!("context_output" in report)) {
    return report;
  }
  const { context_output: _omit, ...rest } = report as T & {
    context_output?: unknown;
  };
  return rest as T;
}
