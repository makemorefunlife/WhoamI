import type { EssenceDeepPreviewResponse } from "@/lib/v1/slim/types";
import {
  readJsonStorage,
  removeJsonStorage,
  writeJsonStorage,
} from "@/lib/v2/storage/localPersist";
import type { Locale } from "@/lib/i18n/locale";
import { normalizeLocale } from "@/lib/i18n/locale";
import { isDeepEssenceStructuredReport } from "@/lib/report/deepEssenceStructuredSchema";

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

  // 스키마가 바뀌면(예: Part 02~05 필드 추가) 예전 캐시의 structured는 새 필드가
  // 없어 그대로 렌더링하면 런타임 에러가 난다. 캐시에 남은 structured가 현재
  // 스키마와 안 맞으면 버리고 report(산문) 폴백만 살려서 돌려준다 — report 자체는
  // 항상 안전하므로 캐시 전체를 무효화할 필요는 없다.
  if (
    data.slim_v1.structured != null &&
    !isDeepEssenceStructuredReport(data.slim_v1.structured)
  ) {
    return {
      ...data,
      slim_v1: { ...data.slim_v1, structured: null, radar_current: null },
    };
  }

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
