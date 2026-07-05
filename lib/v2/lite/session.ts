import type { CurrentSelfLiteReport, InnateSelfLiteReport } from "@/lib/v2/lite/types";

const CURRENT_PREFIX = "ahaitsme_v2_lite_current_";
const INNATE_PREFIX = "ahaitsme_v2_lite_innate_";

export function writeCurrentLiteReport(reportId: string, report: CurrentSelfLiteReport) {
  if (typeof window === "undefined" || !reportId) return;
  try {
    sessionStorage.setItem(`${CURRENT_PREFIX}${reportId}`, JSON.stringify(report));
  } catch {
    /* quota */
  }
}

export function readCurrentLiteReport(
  reportId: string,
): CurrentSelfLiteReport | null {
  if (typeof window === "undefined" || !reportId) return null;
  try {
    const raw = sessionStorage.getItem(`${CURRENT_PREFIX}${reportId}`);
    if (!raw) return null;
    return JSON.parse(raw) as CurrentSelfLiteReport;
  } catch {
    return null;
  }
}

export function writeInnateLiteReport(reportId: string, report: InnateSelfLiteReport) {
  if (typeof window === "undefined" || !reportId) return;
  try {
    sessionStorage.setItem(`${INNATE_PREFIX}${reportId}`, JSON.stringify(report));
  } catch {
    /* quota */
  }
}

export function readInnateLiteReport(
  reportId: string,
): InnateSelfLiteReport | null {
  if (typeof window === "undefined" || !reportId) return null;
  try {
    const raw = sessionStorage.getItem(`${INNATE_PREFIX}${reportId}`);
    if (!raw) return null;
    return JSON.parse(raw) as InnateSelfLiteReport;
  } catch {
    return null;
  }
}
