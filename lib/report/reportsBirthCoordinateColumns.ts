/** reports 출생 좌표 컬럼 (20260518150000 마이그레이션) */
export const REPORT_BIRTH_COORD_COLUMNS =
  "birth_latitude, birth_longitude, birth_timezone" as const;

export const REPORT_BASE_FIELDS =
  "id, name, payment_status, plan_type, birth_date, birth_time, birth_place" as const;

export function reportSelectWithBirthCoords(
  extraFields = "",
): string {
  const extra = extraFields.trim();
  return extra
    ? `${REPORT_BASE_FIELDS}, ${REPORT_BIRTH_COORD_COLUMNS}, ${extra}`
    : `${REPORT_BASE_FIELDS}, ${REPORT_BIRTH_COORD_COLUMNS}`;
}

export function isMissingBirthCoordinateColumnError(
  error: { message?: string; code?: string } | null | undefined,
): boolean {
  const msg = (error?.message ?? "").toLowerCase();
  if (!msg) return false;
  return (
    msg.includes("birth_latitude") ||
    msg.includes("birth_longitude") ||
    msg.includes("birth_timezone") ||
    (msg.includes("column") &&
      (msg.includes("does not exist") || msg.includes("could not find")))
  );
}
