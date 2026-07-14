/**
 * API rate limit helper — in-memory store when explicitly allowed in development only.
 *
 * Env:
 * - UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (preferred, not wired yet)
 * - KV_REST_API_URL + KV_REST_API_TOKEN (Vercel KV, not wired yet)
 * - RATE_LIMIT_ALLOW_MEMORY=true — development local/tests only
 *
 * Policy:
 * - development: memory only if RATE_LIMIT_ALLOW_MEMORY=true; else 503
 * - preview / production: remote required; memory flag ignored → 503 fail-closed
 * - store errors on paid/cost APIs → fail-closed
 */

export type RateLimitBucket =
  | "llm"
  | "relationship_basic"
  | "relationship_premium"
  | "astrology"
  | "saju"
  | "upgrade"
  | "report_create"
  | "survey_persist"
  | "invite";

const LIMITS: Record<RateLimitBucket, { max: number; windowMs: number }> = {
  llm: { max: 5, windowMs: 60 * 60 * 1000 },
  relationship_basic: { max: 10, windowMs: 60 * 60 * 1000 },
  relationship_premium: { max: 3, windowMs: 60 * 60 * 1000 },
  astrology: { max: 10, windowMs: 60 * 60 * 1000 },
  saju: { max: 10, windowMs: 60 * 60 * 1000 },
  upgrade: { max: 10, windowMs: 60 * 60 * 1000 },
  report_create: { max: 20, windowMs: 60 * 60 * 1000 },
  survey_persist: { max: 30, windowMs: 60 * 60 * 1000 },
  invite: { max: 30, windowMs: 60 * 60 * 1000 },
};

type Entry = { count: number; resetAt: number };

const memoryStore = new Map<string, Entry>();

/** Test-only: clear in-memory counters */
export function resetRateLimitMemoryForTests(): void {
  memoryStore.clear();
}

function hasRemoteRateLimitBackend(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() ||
      process.env.KV_REST_API_URL?.trim(),
  );
}

/** preview + production deploy targets (and NODE_ENV=production). */
export function isStrictDeployEnv(): boolean {
  const v = process.env.VERCEL_ENV;
  return (
    process.env.NODE_ENV === "production" ||
    v === "production" ||
    v === "preview"
  );
}

/**
 * Memory fallback allowed only in local development with explicit flag.
 * Production/preview ignore RATE_LIMIT_ALLOW_MEMORY entirely.
 */
export function allowsMemoryRateLimitFallback(): boolean {
  if (isStrictDeployEnv()) return false;
  if (process.env.NODE_ENV !== "development") return false;
  return process.env.RATE_LIMIT_ALLOW_MEMORY === "true";
}

export type RateLimitResult =
  | { ok: true }
  | { ok: false; status: 401 | 429 | 503; error: string; retryAfterSec?: number };

/**
 * @param keySubject — Clerk userId (required for paid/PII routes). Guest not allowed.
 * Subject is never returned in HTTP responses.
 */
export function enforceRateLimit(
  bucket: RateLimitBucket,
  keySubject: string | null | undefined,
): RateLimitResult {
  const subject = typeof keySubject === "string" ? keySubject.trim() : "";
  if (!subject) {
    return { ok: false, status: 401, error: "unauthorized" };
  }

  const hasRemote = hasRemoteRateLimitBackend();
  const allowMemory = allowsMemoryRateLimitFallback();

  if (!hasRemote && !allowMemory) {
    // Fail-closed — do not log subject/IP/key
    console.error("[rate-limit]", "backend_missing");
    return {
      ok: false,
      status: 503,
      error: "temporarily unavailable",
    };
  }

  // Remote not wired yet: memory path only when allowMemory (dev).
  // When remote is configured, future wiring should use it; until then
  // treat "has remote env" without client as still needing a store —
  // if remote URLs exist but client not installed, fail closed in deploy.
  if (hasRemote && isStrictDeployEnv()) {
    // Placeholder until Upstash/KV client is wired: fail-closed rather than
    // silently using memory in production/preview.
    console.error("[rate-limit]", "remote_not_wired");
    return {
      ok: false,
      status: 503,
      error: "temporarily unavailable",
    };
  }

  const { max, windowMs } = LIMITS[bucket];
  // Internal key — never expose in responses
  const key = `${bucket}:${subject}`;
  const now = Date.now();

  try {
    const existing = memoryStore.get(key);

    if (!existing || existing.resetAt <= now) {
      memoryStore.set(key, { count: 1, resetAt: now + windowMs });
      return { ok: true };
    }

    if (existing.count >= max) {
      const retryAfterSec = Math.max(
        1,
        Math.ceil((existing.resetAt - now) / 1000),
      );
      return {
        ok: false,
        status: 429,
        error: "rate limit exceeded",
        retryAfterSec,
      };
    }

    existing.count += 1;
    memoryStore.set(key, existing);
    return { ok: true };
  } catch {
    // Store errors → fail-closed for cost APIs
    console.error("[rate-limit]", "store_error");
    return {
      ok: false,
      status: 503,
      error: "temporarily unavailable",
    };
  }
}

export function rateLimitResponse(
  result: Extract<RateLimitResult, { ok: false }>,
) {
  const headers: Record<string, string> = {};
  if (result.retryAfterSec) {
    headers["Retry-After"] = String(result.retryAfterSec);
  }
  return Response.json(
    { error: result.error },
    { status: result.status, headers },
  );
}
