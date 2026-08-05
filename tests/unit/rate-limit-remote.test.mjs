/**
 * Remote Upstash/KV rate-limit wiring tests — mocked fetch, no network.
 * Run: npx tsx tests/unit/rate-limit-remote.test.mjs
 */
import assert from "node:assert/strict";

process.env.NODE_ENV = "development";
delete process.env.VERCEL_ENV;
delete process.env.RATE_LIMIT_DEV_UNLIMITED;
process.env.RATE_LIMIT_ALLOW_MEMORY = "true";

const {
  resetRateLimitMemoryForTests,
  setRateLimitFetchForTests,
  enforceRateLimit,
  hasRemoteRateLimitBackend,
  resolveRemoteRateLimitConfig,
  isStrictDeployEnv,
  allowsMemoryRateLimitFallback,
} = await import("../../lib/security/rateLimit.ts");

let passed = 0;
function ok(name) {
  passed += 1;
  console.log(`[OK] ${name}`);
}

function restoreEnv(snapshot) {
  for (const [k, v] of Object.entries(snapshot)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}

function snapEnv(keys) {
  const s = {};
  for (const k of keys) s[k] = process.env[k];
  return s;
}

function mockRedis(handlers) {
  /** @type {Array<{cmd: string, body: unknown}>} */
  const calls = [];
  setRateLimitFetchForTests(async (_url, init) => {
    const body = JSON.parse(init.body);
    const cmd = Array.isArray(body) ? String(body[0]) : "";
    calls.push({ cmd, body });
    const handler = handlers[cmd] ?? handlers["*"];
    if (!handler) {
      return {
        ok: false,
        status: 500,
        json: async () => ({ error: "unexpected" }),
      };
    }
    return handler(body, init);
  });
  return calls;
}

const ENV_KEYS = [
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "KV_REST_API_URL",
  "KV_REST_API_TOKEN",
  "RATE_LIMIT_ALLOW_MEMORY",
  "NODE_ENV",
  "VERCEL_ENV",
  "RATE_LIMIT_DEV_UNLIMITED",
];

async function run() {
  // --- allowed request (remote) ---
  {
    const snap = snapEnv(ENV_KEYS);
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "production";
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
    delete process.env.RATE_LIMIT_ALLOW_MEMORY;
    let incr = 0;
    mockRedis({
      INCR: async () => {
        incr += 1;
        return { ok: true, status: 200, json: async () => ({ result: incr }) };
      },
      EXPIRE: async () => ({
        ok: true,
        status: 200,
        json: async () => ({ result: 1 }),
      }),
    });
    const r = await enforceRateLimit("relationship_premium", "user_ok");
    assert.equal(r.ok, true);
    assert.equal(hasRemoteRateLimitBackend(), true);
    assert.ok(resolveRemoteRateLimitConfig()?.url.includes("upstash"));
    ok("remote allowed request → ok");
    restoreEnv(snap);
    setRateLimitFetchForTests(null);
  }

  // --- exceeded limit ---
  {
    const snap = snapEnv(ENV_KEYS);
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "production";
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
    mockRedis({
      INCR: async () => ({
        ok: true,
        status: 200,
        json: async () => ({ result: 4 }), // premium max=3
      }),
      TTL: async () => ({
        ok: true,
        status: 200,
        json: async () => ({ result: 1200 }),
      }),
    });
    const r = await enforceRateLimit("relationship_premium", "user_over");
    assert.equal(r.ok, false);
    assert.equal(r.status, 429);
    assert.equal(r.retryAfterSec, 1200);
    assert.ok(!JSON.stringify(r).includes("test-token"));
    assert.ok(!JSON.stringify(r).includes("user_over"));
    ok("remote exceeded limit → 429");
    restoreEnv(snap);
    setRateLimitFetchForTests(null);
  }

  // --- missing credentials → production memory fallback ---
  {
    const snap = snapEnv(ENV_KEYS);
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "production";
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
    delete process.env.RATE_LIMIT_ALLOW_MEMORY;
    setRateLimitFetchForTests(null);
    resetRateLimitMemoryForTests();
    const r = await enforceRateLimit("llm", "user_missing");
    assert.equal(r.ok, true);
    assert.equal(hasRemoteRateLimitBackend(), false);
    ok("missing credentials in production → memory fallback ok");
    restoreEnv(snap);
  }

  // --- URL without token is not a valid backend → memory fallback ---
  {
    const snap = snapEnv(ENV_KEYS);
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "production";
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
    delete process.env.RATE_LIMIT_ALLOW_MEMORY;
    resetRateLimitMemoryForTests();
    assert.equal(hasRemoteRateLimitBackend(), false);
    const r = await enforceRateLimit("llm", "user_url_only");
    assert.equal(r.ok, true);
    ok("URL without token → memory fallback ok");
    restoreEnv(snap);
  }

  // --- invalid remote response ---
  {
    const snap = snapEnv(ENV_KEYS);
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "production";
    process.env.KV_REST_API_URL = "https://example.kv.vercel-storage.com";
    process.env.KV_REST_API_TOKEN = "kv-token";
    mockRedis({
      INCR: async () => ({
        ok: true,
        status: 200,
        json: async () => ({ unexpected: true }),
      }),
    });
    const r = await enforceRateLimit("llm", "user_bad_json_shape");
    assert.equal(r.ok, false);
    assert.equal(r.status, 503);
    ok("invalid remote response → 503");
    restoreEnv(snap);
    setRateLimitFetchForTests(null);
  }

  // --- backend unavailable (network / 5xx) ---
  {
    const snap = snapEnv(ENV_KEYS);
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "production";
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
    setRateLimitFetchForTests(async () => {
      throw new Error("network down");
    });
    const r = await enforceRateLimit("relationship_premium", "user_down");
    assert.equal(r.ok, false);
    assert.equal(r.status, 503);
    ok("backend unavailable → 503");
    restoreEnv(snap);
    setRateLimitFetchForTests(null);
  }

  // --- auth failure from remote ---
  {
    const snap = snapEnv(ENV_KEYS);
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "production";
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "bad-token";
    mockRedis({
      "*": async () => ({
        ok: false,
        status: 401,
        json: async () => ({ error: "Unauthorized" }),
      }),
    });
    const r = await enforceRateLimit("llm", "user_auth");
    assert.equal(r.ok, false);
    assert.equal(r.status, 503);
    ok("invalid remote credentials → 503");
    restoreEnv(snap);
    setRateLimitFetchForTests(null);
  }

  // --- production vs development ---
  {
    const snap = snapEnv(ENV_KEYS);
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "production";
    process.env.RATE_LIMIT_ALLOW_MEMORY = "true";
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
    assert.equal(isStrictDeployEnv(), true);
    assert.equal(allowsMemoryRateLimitFallback(), false);
    resetRateLimitMemoryForTests();
    const prod = await enforceRateLimit("llm", "prod_mem");
    assert.equal(prod.ok, true);

    process.env.NODE_ENV = "development";
    delete process.env.VERCEL_ENV;
    process.env.RATE_LIMIT_ALLOW_MEMORY = "true";
    resetRateLimitMemoryForTests();
    assert.equal(allowsMemoryRateLimitFallback(), true);
    const dev = await enforceRateLimit("llm", "dev_mem");
    assert.equal(dev.ok, true);
    ok("production memory-fallback when unconfigured; development allows memory");
    restoreEnv(snap);
  }

  // --- no remote_not_wired when credentials valid ---
  {
    const snap = snapEnv(ENV_KEYS);
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "production";
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
    let incr = 0;
    mockRedis({
      INCR: async () => {
        incr += 1;
        return { ok: true, status: 200, json: async () => ({ result: incr }) };
      },
      EXPIRE: async () => ({
        ok: true,
        status: 200,
        json: async () => ({ result: 1 }),
      }),
    });
    const logs = [];
    const prevErr = console.error;
    console.error = (...args) => logs.push(args.map(String).join(" "));
    try {
      const r = await enforceRateLimit("relationship_premium", "premium_user");
      assert.equal(r.ok, true);
      assert.equal(
        logs.some((l) => l.includes("remote_not_wired")),
        false,
      );
      ok("premium path with valid credentials never logs remote_not_wired");
    } finally {
      console.error = prevErr;
      restoreEnv(snap);
      setRateLimitFetchForTests(null);
    }
  }

  // --- memory still works for existing tests ---
  {
    const snap = snapEnv(ENV_KEYS);
    process.env.NODE_ENV = "development";
    delete process.env.VERCEL_ENV;
    process.env.RATE_LIMIT_ALLOW_MEMORY = "true";
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
    resetRateLimitMemoryForTests();
    for (let i = 0; i < 5; i++) {
      assert.equal((await enforceRateLimit("llm", "mem_u")).ok, true);
    }
    const blocked = await enforceRateLimit("llm", "mem_u");
    assert.equal(blocked.status, 429);
    ok("dev memory limit still enforces 429");
    restoreEnv(snap);
  }

  console.log(`\n${passed} rate-limit remote tests passed`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
