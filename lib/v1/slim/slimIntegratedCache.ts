import type { EssenceDeepPreviewResponse } from "@/lib/v1/slim/types";
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
): EssenceDeepPreviewResponse | null {
  if (!reportId) return null;
  const data = readJsonStorage<EssenceDeepPreviewResponse>(
    storageKey(reportId),
    storageKey(reportId),
  );
  if (!data?.slim_v1?.report?.trim()) return null;
  return data;
}

export function writeSlimIntegratedCache(
  reportId: string,
  data: EssenceDeepPreviewResponse,
) {
  if (!reportId) return;
  writeJsonStorage(storageKey(reportId), data);
}

export function clearSlimIntegratedCache(reportId: string) {
  if (!reportId) return;
  removeJsonStorage(storageKey(reportId), storageKey(reportId));
}
