import type { InnateDeepPreviewResponse } from "@/lib/v1/slim/types";
import {
  readJsonStorage,
  removeJsonStorage,
  writeJsonStorage,
} from "@/lib/v2/storage/localPersist";

const PREFIX = "ahaitsme_v2_slim_integrated_";

function storageKey(reportId: string) {
  return `${PREFIX}${reportId}`;
}

export function readSlimIntegratedCache(
  reportId: string,
): InnateDeepPreviewResponse | null {
  if (!reportId) return null;
  const data = readJsonStorage<InnateDeepPreviewResponse>(
    storageKey(reportId),
    storageKey(reportId),
  );
  if (!data?.slim_v1?.report?.trim()) return null;
  return data;
}

export function writeSlimIntegratedCache(
  reportId: string,
  data: InnateDeepPreviewResponse,
) {
  if (!reportId) return;
  writeJsonStorage(storageKey(reportId), data);
}

export function clearSlimIntegratedCache(reportId: string) {
  if (!reportId) return;
  removeJsonStorage(storageKey(reportId), storageKey(reportId));
}
