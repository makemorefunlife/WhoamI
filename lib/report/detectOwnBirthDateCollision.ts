/**
 * "상대방(파트너) 생년월일시를 저장했는데, 알고 보니 로그인한 본인의
 * self-report 생년월일시와 완전히 똑같다" — 를 잡아내는 안전망.
 *
 * 2026-07-21: 동글(partner_manual) report row에 Sera 본인의 생년월일시가
 * 그대로 들어가 있던 실사고를 계기로 추가. 정확한 최초 유입 경로는 특정하지
 * 못했지만(폼 state·API 파라미터·localStorage 세션 모두 reportId로 올바르게
 * 구분돼 있는 것을 확인함 — 코드에 뻔한 fallback-to-self 버그는 없었음),
 * 재발 시 즉시 알아챌 수 있도록 저장 시점에 경고만 띄운다(차단은 하지 않음
 * — 실제로 본인과 생일이 같은 상대일 수도 있으므로).
 */

export type OwnSelfReportBirthLookup = {
  id: string;
  birth_date: string | null;
  birth_time: string | null;
} | null;

export function detectsOwnBirthDateCollision(params: {
  targetReportId: string;
  ownSelfReport: OwnSelfReportBirthLookup;
  newBirthDate: string | null | undefined;
  newBirthTime: string | null | undefined;
}): boolean {
  const { targetReportId, ownSelfReport, newBirthDate, newBirthTime } = params;

  if (!ownSelfReport) return false;
  // 본인 report를 본인이 수정하는 경우는 당연히 같아야 하므로 충돌 아님.
  if (ownSelfReport.id === targetReportId) return false;

  const ownDate = ownSelfReport.birth_date?.trim() || null;
  if (!ownDate) return false;

  const nextDate = newBirthDate?.trim() || null;
  if (!nextDate) return false;

  const dateMatches = ownDate === nextDate;
  if (!dateMatches) return false;

  const ownTime = ownSelfReport.birth_time?.trim() || null;
  const nextTime = newBirthTime?.trim() || null;
  return ownTime === nextTime;
}
