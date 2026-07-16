import type { EssenceDeepPreviewResponse } from "@/lib/v1/slim/types";
import {
  readJsonStorage,
  removeJsonStorage,
  writeJsonStorage,
} from "@/lib/v2/storage/localPersist";
import type { Locale } from "@/lib/i18n/locale";
import { normalizeLocale } from "@/lib/i18n/locale";

const PREFIX = "ahaitsme_v2_slim_integrated_";

function storageKey(reportId: string, locale: Locale) {
  return `${PREFIX}${locale}_${reportId}`;
}

/** Pre-locale legacy key (no locale segment) — read-only, for one-time migration. */
function legacyStorageKey(reportId: string) {
  return `${PREFIX}${reportId}`;
}

export function readSlimIntegratedCache(
  reportId: string,
  locale: Locale | string = "en-US",
): EssenceDeepPreviewResponse | null {
  if (!reportId) return null;
  const loc = normalizeLocale(locale);
  const data = readJsonStorage<EssenceDeepPreviewResponse>(
    storageKey(reportId, loc),
    storageKey(reportId, loc),
  );
  if (!data?.slim_v1?.report?.trim()) return null;
  return data;
}

export function writeSlimIntegratedCache(
  reportId: string,
  data: EssenceDeepPreviewResponse,
  locale: Locale | string = "en-US",
) {
  if (!reportId) return;
  const loc = normalizeLocale(locale);
  writeJsonStorage(storageKey(reportId, loc), data);
}

export function clearSlimIntegratedCache(reportId: string) {
  if (!reportId) return;
  for (const loc of ["en-US", "ko-KR"] as const) {
    removeJsonStorage(storageKey(reportId, loc), storageKey(reportId, loc));
  }
  // legacy key from before locale-scoping
  removeJsonStorage(legacyStorageKey(reportId), legacyStorageKey(reportId));
}
