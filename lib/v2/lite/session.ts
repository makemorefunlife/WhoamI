import type { CurrentSelfLiteReport, EssenceSelfLiteReport } from "@/lib/v2/lite/types";
import {
  readJsonStorage,
  removeJsonStorage,
  writeJsonStorage,
} from "@/lib/v2/storage/localPersist";

const CURRENT_PREFIX = "ahaitsme_v2_lite_current_";
const ESSENCE_PREFIX = "ahaitsme_v2_lite_essence_";

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

export function writeEssenceLiteReport(reportId: string, report: EssenceSelfLiteReport) {
  if (!reportId) return;
  writeJsonStorage(`${ESSENCE_PREFIX}${reportId}`, report);
}

export function readEssenceLiteReport(
  reportId: string,
): EssenceSelfLiteReport | null {
  if (!reportId) return null;
  return readJsonStorage<EssenceSelfLiteReport>(
    `${ESSENCE_PREFIX}${reportId}`,
    `${ESSENCE_PREFIX}${reportId}`,
  );
}

export function clearLiteReports(reportId: string) {
  if (!reportId) return;
  removeJsonStorage(`${CURRENT_PREFIX}${reportId}`, `${CURRENT_PREFIX}${reportId}`);
  removeJsonStorage(`${ESSENCE_PREFIX}${reportId}`, `${ESSENCE_PREFIX}${reportId}`);
}
