export const BIRTH_DATE_CORRECTION_COLUMN = "birth_date_correction_used_at" as const;

export function isBirthDateCorrectionUsed(
  value: string | null | undefined,
): boolean {
  return Boolean(value?.trim());
}

export function isMissingBirthDateCorrectionColumnError(
  error: { message?: string } | null | undefined,
): boolean {
  const msg = (error?.message ?? "").toLowerCase();
  if (!msg) return false;
  return (
    msg.includes("birth_date_correction_used_at") ||
    (msg.includes("column") &&
      (msg.includes("does not exist") || msg.includes("could not find")))
  );
}
