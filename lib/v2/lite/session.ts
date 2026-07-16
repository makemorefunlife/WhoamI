import type { CurrentSelfLiteReport, EssenceSelfLiteReport } from "@/lib/v2/lite/types";
import {
  readJsonStorage,
  removeJsonStorage,
  writeJsonStorage,
} from "@/lib/v2/storage/localPersist";
import type { Locale } from "@/lib/i18n/locale";
import { normalizeLocale } from "@/lib/i18n/locale";

const CURRENT_PREFIX = "ahaitsme_v2_lite_current_";
const ESSENCE_PREFIX = "ahaitsme_v2_lite_essence_";

function currentKey(reportId: string, locale: Locale) {
  return `${CURRENT_PREFIX}${locale}_${reportId}`;
}
function essenceKey(reportId: string, locale: Locale) {
  return `${ESSENCE_PREFIX}${locale}_${reportId}`;
}

export function writeCurrentLiteReport(
  reportId: string,
  report: CurrentSelfLiteReport,
  locale: Locale | string = "en-US",
) {
  if (!reportId) return;
  const loc = normalizeLocale(locale);
  writeJsonStorage(currentKey(reportId, loc), report);
}

export function readCurrentLiteReport(
  reportId: string,
  locale: Locale | string = "en-US",
): CurrentSelfLiteReport | null {
  if (!reportId) return null;
  const loc = normalizeLocale(locale);
  return readJsonStorage<CurrentSelfLiteReport>(
    currentKey(reportId, loc),
    currentKey(reportId, loc),
  );
}

export function writeEssenceLiteReport(
  reportId: string,
  report: EssenceSelfLiteReport,
  locale: Locale | string = "en-US",
) {
  if (!reportId) return;
  const loc = normalizeLocale(locale);
  writeJsonStorage(essenceKey(reportId, loc), report);
}

export function readEssenceLiteReport(
  reportId: string,
  locale: Locale | string = "en-US",
): EssenceSelfLiteReport | null {
  if (!reportId) return null;
  const loc = normalizeLocale(locale);
  return readJsonStorage<EssenceSelfLiteReport>(
    essenceKey(reportId, loc),
    essenceKey(reportId, loc),
  );
}

export function clearLiteReports(reportId: string) {
  if (!reportId) return;
  for (const loc of ["en-US", "ko-KR"] as const) {
    removeJsonStorage(currentKey(reportId, loc), currentKey(reportId, loc));
    removeJsonStorage(essenceKey(reportId, loc), essenceKey(reportId, loc));
  }
  // legacy keys without locale
  removeJsonStorage(
    `${CURRENT_PREFIX}${reportId}`,
    `${CURRENT_PREFIX}${reportId}`,
  );
  removeJsonStorage(
    `${ESSENCE_PREFIX}${reportId}`,
    `${ESSENCE_PREFIX}${reportId}`,
  );
}
