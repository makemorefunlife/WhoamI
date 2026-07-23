/**
 * Romantic premium 클라이언트 응답용 — report.romantic_context_input 제거 사본.
 * DB/로그 payload는 이 함수를 거치지 않는다(원본 유지).
 * 원본 객체는 mutate하지 않는다.
 */
export function stripRomanticContextInputForClient<T extends { report?: unknown }>(
  payload: T,
): T {
  const report = payload?.report;
  if (!report || typeof report !== "object" || Array.isArray(report)) {
    return payload;
  }
  if (!("romantic_context_input" in report)) {
    return payload;
  }
  const { romantic_context_input: _omit, ...reportWithout } = report as {
    romantic_context_input?: unknown;
  } & Record<string, unknown>;
  return {
    ...payload,
    report: reportWithout,
  };
}

/** report body만 있을 때(detail·로그 스냅샷) 비파괴 제거 */
export function omitRomanticContextInputFromReport<T extends object>(
  report: T,
): T {
  if (!report || typeof report !== "object" || Array.isArray(report)) {
    return report;
  }
  if (!("romantic_context_input" in report)) {
    return report;
  }
  const { romantic_context_input: _omit, ...rest } = report as T & {
    romantic_context_input?: unknown;
  };
  return rest as T;
}
