import type { PremiumLlmRequestType } from "@/lib/report/llmPaymentGuard";

type CacheEntry = { hasPremium: boolean; expiresAt: number };

const TTL_MS = 60_000;
const cache = new Map<string, CacheEntry>();

export function readPremiumAccessCache(reportId: string): boolean | null {
  const entry = cache.get(reportId);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(reportId);
    return null;
  }
  return entry.hasPremium;
}

export function writePremiumAccessCache(
  reportId: string,
  hasPremium: boolean,
) {
  cache.set(reportId, {
    hasPremium,
    expiresAt: Date.now() + TTL_MS,
  });
}

export function invalidatePremiumAccessCache(reportId: string) {
  cache.delete(reportId.trim());
}

export function logPremiumAccessCacheHit(
  reportId: string,
  requestType: PremiumLlmRequestType,
) {
  console.info("[premium-pipeline] stage=llm_payment_guard_cache_hit", {
    reportId,
    requestType,
  });
}
