import type { CurrentSelfLiteReport, InnateSelfLiteReport } from "@/lib/v2/lite/types";
import {
  readJsonStorage,
  removeJsonStorage,
  writeJsonStorage,
} from "@/lib/v2/storage/localPersist";

const CURRENT_PREFIX = "ahaitsme_v2_lite_current_";
const INNATE_PREFIX = "ahaitsme_v2_lite_innate_";

export function writeCurrentLiteReport(reportId: string, report: CurrentSelfLiteReport) {
  if (!reportId) return;
  writeJsonStorage(`${CURRENT_PREFIX}${reportId}`, report);
}

export function readCurrentLiteReport(
  reportId: string,
): CurrentSelfLiteReport | null {
  if (!reportId) return null;
  return readJsonStorage<CurrentSelfLiteReport>(
    `${CURRENT_PREFIX}${reportId}`,
    `${CURRENT_PREFIX}${reportId}`,
  );
}

export function writeInnateLiteReport(reportId: string, report: InnateSelfLiteReport) {
  if (!reportId) return;
  writeJsonStorage(`${INNATE_PREFIX}${reportId}`, report);
}

export function readInnateLiteReport(
  reportId: string,
): InnateSelfLiteReport | null {
  if (!reportId) return null;
  return readJsonStorage<InnateSelfLiteReport>(
    `${INNATE_PREFIX}${reportId}`,
    `${INNATE_PREFIX}${reportId}`,
  );
}

export function clearLiteReports(reportId: string) {
  if (!reportId) return;
  removeJsonStorage(`${CURRENT_PREFIX}${reportId}`, `${CURRENT_PREFIX}${reportId}`);
  removeJsonStorage(`${INNATE_PREFIX}${reportId}`, `${INNATE_PREFIX}${reportId}`);
}
