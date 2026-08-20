import type { EssenceDeepPreviewResponse } from "@/lib/v1/slim/types";
import {
  readJsonStorage,
  removeJsonStorage,
  writeJsonStorage,
} from "@/lib/v2/storage/localPersist";
import type { Locale } from "@/lib/i18n/locale";
import { normalizeLocale } from "@/lib/i18n/locale";
import { isDeepEssenceStructuredReport } from "@/lib/report/deepEssenceStructuredSchema";

/**
 * Bump when Inner Compass structured schema or cache contract changes.
 * Old keys are ignored → client refetches instead of serving a prose-only
 * shell that lost structured/radar.
 *
 * Bumped 3 -> 4: old localStorage entries could hold a structured payload
 * generated before the Personal V2 grounding pipeline (layered_identity /
 * axis_interpretations) shipped, and the schema validator alone can't tell
 * those apart since the newer fields are optional. Bumping forces a
 * refetch, which now goes through route.ts's own
 * PERSONAL_V2_STRUCTURED_GENERATION_VERSION gate server-side.
 *
 * Bumped 7 -> 8: Batch 3 Part 03 Current x Innate narrative guidelines,
 * gained strength / hidden cost contracts, advice bans, and UI labels.
 * Bumping client key forces browsers to refetch and receive the new Part 03.
 */
export const SLIM_INTEGRATED_CACHE_VERSION = 10;

const PREFIX = "ahaitsme_v2_slim_integrated_";

function storageKey(reportId: string, locale: Locale) {
  return `${PREFIX}v${SLIM_INTEGRATED_CACHE_VERSION}_${locale}_${reportId}`;
}

/** Pre-locale / pre-version legacy keys — cleared on write/clear only. */
function legacyStorageKeys(reportId: string, locale: Locale): string[] {
  return [
    `${PREFIX}${reportId}`,
    `${PREFIX}${locale}_${reportId}`,
    // v1/v2/v3/v4/v5/v6/v7/v8/v9 keys from earlier CACHE_VERSION values
    `${PREFIX}v1_${locale}_${reportId}`,
    `${PREFIX}v2_${locale}_${reportId}`,
    `${PREFIX}v3_${locale}_${reportId}`,
    `${PREFIX}v4_${locale}_${reportId}`,
    `${PREFIX}v5_${locale}_${reportId}`,
    `${PREFIX}v6_${locale}_${reportId}`,
    `${PREFIX}v7_${locale}_${reportId}`,
    `${PREFIX}v8_${locale}_${reportId}`,
    `${PREFIX}v9_${locale}_${reportId}`,
  ];
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

  // 스키마 불일치 structured만 제거. radar_current는 설문 SSOT라 유지.
  if (
    data.slim_v1.structured != null &&
    !isDeepEssenceStructuredReport(data.slim_v1.structured)
  ) {
    return {
      ...data,
      slim_v1: { ...data.slim_v1, structured: null },
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
  // Drop legacy keys so a stale prose-only shell cannot win on next read.
  for (const key of legacyStorageKeys(reportId, loc)) {
    removeJsonStorage(key, key);
  }
}

export function clearSlimIntegratedCache(reportId: string) {
  if (!reportId) return;
  for (const loc of ["en-US", "ko-KR"] as const) {
    removeJsonStorage(storageKey(reportId, loc), storageKey(reportId, loc));
    for (const key of legacyStorageKeys(reportId, loc)) {
      removeJsonStorage(key, key);
    }
  }
}
