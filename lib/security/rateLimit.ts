/**
 * API rate limit helper.
 *
 * Env (prefer Upstash; Vercel KV is the same REST shape):
 * - UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 * - KV_REST_API_URL + KV_REST_API_TOKEN
 * - RATE_LIMIT_ALLOW_MEMORY=true — development local/tests only
 * - RATE_LIMIT_DEV_UNLIMITED=true — development skip only
 *
 * Policy:
 * - development: remote if configured; else memory when ALLOW_MEMORY; else 503
 * - preview / production: prefer remote (url+token); if unset, in-process memory
 *   fallback (ponytail: multi-instance limits are best-effort until Upstash/KV is
 *   wired — remove fallback once Production always has REST credentials)
 * - remote configured but errors / invalid responses → fail-closed 503
 * - never log URL tokens or subjects
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

type RemoteConfig = { url: string; token: string };

type FetchLike = (
  input: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string },
) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}>;

let fetchImpl: FetchLike = globalThis.fetch.bind(globalThis) as FetchLike;

/** Test-only: clear in-memory counters */
export function resetRateLimitMemoryForTests(): void {
  memoryStore.clear();
}

/** Test-only: inject fetch (pass null to restore). Never used in production. */
export function setRateLimitFetchForTests(fn: FetchLike | null): void {
  fetchImpl =
    fn ?? (globalThis.fetch.bind(globalThis) as FetchLike);
}

function pairFromEnv(
  urlKey: string,
  tokenKey: string,
): RemoteConfig | null {
  const url = process.env[urlKey]?.trim() ?? "";
  const token = process.env[tokenKey]?.trim() ?? "";
  if (!url || !token) return null;
  return { url, token };
}

/** Prefer Upstash; fall back to Vercel KV REST (same protocol). */
export function resolveRemoteRateLimitConfig(): RemoteConfig | null {
  return (
    pairFromEnv("UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN") ??
    pairFromEnv("KV_REST_API_URL", "KV_REST_API_TOKEN")
  );
}

export function hasRemoteRateLimitBackend(): boolean {
  return resolveRemoteRateLimitConfig() !== null;
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

/**
 * Local-dev-only escape hatch — set RATE_LIMIT_DEV_UNLIMITED=true in
 * .env.local to skip all rate limits while building/testing.
 */
export function isDevRateLimitUnlimited(): boolean {
  if (isStrictDeployEnv()) return false;
  if (process.env.NODE_ENV !== "development") return false;
  return process.env.RATE_LIMIT_DEV_UNLIMITED === "true";
}

export type RateLimitResult =
  | { ok: true }
  | {
      ok: false;
      status: 401 | 429 | 503;
      error: string;
      /** Bounded machine code — never includes subjects or secrets */
      code?:
        | "unauthorized"
        | "rate_limit_exceeded"
        | "rate_limit_backend_missing"
        | "rate_limit_backend_unavailable";
      retryAfterSec?: number;
    };

async function redisCommand(
  config: RemoteConfig,
  command: Array<string | number>,
): Promise<unknown> {
  const res = await fetchImpl(config.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  if (res.status === 401 || res.status === 403) {
    console.error("[rate-limit]", "remote_auth_failed");
    throw new Error("remote_auth_failed");
  }
  if (!res.ok) {
    console.error("[rate-limit]", "remote_http_error");
    throw new Error("remote_http_error");
  }

  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    console.error("[rate-limit]", "remote_invalid_json");
    throw new Error("remote_invalid_json");
  }

  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    (payload as { error?: unknown }).error
  ) {
    console.error("[rate-limit]", "remote_command_error");
    throw new Error("remote_command_error");
  }

  if (
    payload &&
    typeof payload === "object" &&
    "result" in payload
  ) {
    return (payload as { result: unknown }).result;
  }

  console.error("[rate-limit]", "remote_invalid_response");
  throw new Error("remote_invalid_response");
}

async function consumeRemoteLimit(
  config: RemoteConfig,
  key: string,
  max: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
  const countRaw = await redisCommand(config, ["INCR", key]);
  const count = typeof countRaw === "number" ? countRaw : Number(countRaw);
  if (!Number.isFinite(count) || count < 1) {
    console.error("[rate-limit]", "remote_invalid_response");
    return {
      ok: false,
      status: 503,
      error: "temporarily unavailable",
      code: "rate_limit_backend_unavailable",
    };
    await redisCommand(config, ["EXPIRE", key, windowSec]);
  }

  if (count > max) {
    let retryAfterSec = windowSec;
    try {
      const ttlRaw = await redisCommand(config, ["TTL", key]);
      const ttl = typeof ttlRaw === "number" ? ttlRaw : Number(ttlRaw);
      if (Number.isFinite(ttl) && ttl > 0) retryAfterSec = Math.ceil(ttl);
    } catch {
      // keep windowSec fallback
    }
    return {
      ok: false,
      status: 429,
      error: "rate limit exceeded",
      code: "rate_limit_exceeded",
      retryAfterSec: Math.max(1, retryAfterSec),
    };
  }

  return { ok: true };
}

function consumeMemoryLimit(
  key: string,
  max: number,
  windowMs: number,
): RateLimitResult {
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
        code: "rate_limit_exceeded",
        retryAfterSec,
      };
    }

    existing.count += 1;
    memoryStore.set(key, existing);
    return { ok: true };
  } catch {
    console.error("[rate-limit]", "store_error");
    return {
      ok: false,
      status: 503,
      error: "temporarily unavailable",
    };
  }
}

/**
 * @param keySubject — Clerk userId (required for paid/PII routes). Guest not allowed.
 * Subject is never returned in HTTP responses.
 */
export async function enforceRateLimit(
  bucket: RateLimitBucket,
  keySubject: string | null | undefined,
): Promise<RateLimitResult> {
  const subject = typeof keySubject === "string" ? keySubject.trim() : "";
  if (!subject) {
    return { ok: false, status: 401, error: "unauthorized", code: "unauthorized" };
  }

  if (isDevRateLimitUnlimited()) {
    return { ok: true };
  }

  const remote = resolveRemoteRateLimitConfig();
  const allowMemory =
    allowsMemoryRateLimitFallback() || isStrictDeployEnv();

  if (!remote && !allowMemory) {
    console.error("[rate-limit]", "backend_missing");
    return {
      ok: false,
      status: 503,
      error: "temporarily unavailable",
      code: "rate_limit_backend_missing",
    };
  }

  const { max, windowMs } = LIMITS[bucket];
  // Internal key — never expose in responses or logs
  const key = `rl:${bucket}:${subject}`;

  if (remote) {
    try {
      return await consumeRemoteLimit(remote, key, max, windowMs);
    } catch {
      console.error("[rate-limit]", "backend_unavailable");
      return {
        ok: false,
        status: 503,
        error: "temporarily unavailable",
        code: "rate_limit_backend_unavailable",
      };
    }
  }

  if (isStrictDeployEnv()) {
    // ponytail: per-instance only; upgrade = require Upstash/KV and delete this branch
    console.error("[rate-limit]", "backend_missing_memory_fallback");
  }
  return consumeMemoryLimit(key, max, windowMs);
}

export function rateLimitResponse(
  result: Extract<RateLimitResult, { ok: false }>,
) {
  const headers: Record<string, string> = {};
  if (result.retryAfterSec) {
    headers["Retry-After"] = String(result.retryAfterSec);
  }
  return Response.json(
    {
      error: result.error,
      ...(result.code ? { code: result.code } : {}),
    },
    { status: result.status, headers },
  );
}
