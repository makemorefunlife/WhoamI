import type { BirthV2Session } from "@/lib/v2/onboarding/birthSession";
import type { ReportBirthRow } from "@/lib/v2/onboarding/resolveReportBirth";

/**
 * English site: what to do when the account's report has no saved birth
 * details (2026-10-19, see lib/report/restoreBirthFromOwnedReports.ts).
 *
 *  1. Ask the server to fill them from the same account's other report where
 *     they are already SAVED (server data only, never replaces saved info).
 *  2. Not possible -> if this browser holds details for the report, show the
 *     form PREFILLED and let the person confirm (never saved automatically:
 *     a browser copy can come from another report used in this browser).
 *  3. Otherwise the normal empty form.
 * Korean site: none of this runs (unchanged).
 */
export type MissingBirthStep = "restore_from_account" | "none";

export function missingBirthStep(input: {
  locale: string;
  dbRow: ReportBirthRow | null | undefined;
}): MissingBirthStep {
  if (input.locale !== "en-US") return "none";
  if (input.dbRow?.birth_date && String(input.dbRow.birth_date).trim()) return "none";
  return "restore_from_account";
}

export type RestoreBirthClientResult =
  | "restored"
  | "already_has_birth"
  | "no_source"
  | "conflict"
  | "not_owner"
  | "unauthorized"
  | "error";

/** POST /api/report/birth/restore -- result code only. */
export async function restoreBirthFromAccount(reportId: string): Promise<RestoreBirthClientResult> {
  try {
    const res = await fetch("/api/report/birth/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-aha-locale": "en-US" },
      body: JSON.stringify({ reportId }),
    });
    const data = (await res.json().catch(() => ({}))) as { result?: string };
    const r = data.result;
    return r === "restored" || r === "already_has_birth" || r === "no_source" || r === "conflict" || r === "not_owner" || r === "unauthorized"
      ? r
      : "error";
  } catch {
    return "error";
  }
}

/** The form is prefilled from this browser and waits for the person to confirm. */
export function hasBrowserBirthToConfirm(birth: BirthV2Session | null | undefined): boolean {
  return Boolean(birth?.birthDate?.trim());
}

/** English-only, plain notices (no technical detail). */
export const BIRTH_CONFIRM_NOTICE_EN = "Please check your birth details below and save them to continue.";
export const BIRTH_SAVE_FAILED_NOTICE_EN = "We couldn't save your birth details. Please check them and try again.";
